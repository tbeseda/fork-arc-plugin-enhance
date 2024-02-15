import enhance from '@enhance/ssr'
import headerTimers from 'header-timers'

/** @type {import('./types.js').CreateEnhanceRouteAndRender} */
export function createRouteAndRender ({
  timers: routerTimers,
  log,
  radixRouter,
  elements,
  ...options
}) {
  // router options:
  const {
    head,
    state: routerState,
    ssrOptions,
    debug
  } = options

  /** @type {import('./types.js').EnhanceRouteAndRender} */
  async function routeAndRender (req, reqState) {
    const {
      headers: reqHheaders,
      path = '',
      method: reqMethod = 'GET',
    } = req

    let method = reqMethod.toLowerCase()
    if (method === 'delete') method = 'destroy'

    const timers = headerTimers({ enabled: debug })

    log.request(req)

    /** @type {(import('./types.js').RouteRecord & { params?: Record<string, any> }) | null} */
    const route = radixRouter.lookup(path)
    if (!route) {
      log('route not found:', path)
      throw new Error('404', { cause: 'route not found' })
    }

    const { api, page, params } = route

    if (!(api || page)) {
      log('route requires api and/or page')
      throw new Error('404', { cause: 'route requires api and/or page' })
    }

    log('route:'); log(4, 'api: ', api || 'none'); log(4, 'page:', page || 'none')

    let apiResult
    if (api) {
      timers.start('enhance-api')
      const { fn, deferredFn } = api
      const apiArgs = [
        { ...req, params },
        { state: { ...routerState, ...reqState } },
      ]

      if (fn && typeof fn[method] === 'function') {
        log('executing api:', `${method}() on`, fn)
        try {
          apiResult = await fn[method](...apiArgs)
        }
        catch (err) {
          log(0, 'api execution error', err)
          throw err
        }
      }
      else if (deferredFn) {
        log('importing api', deferredFn)
        try {
          const apiModule = await deferredFn

          if (typeof apiModule[method] === 'function') {
            log('executing api:', `${method}() on`, apiModule)
            apiResult = await apiModule[method](...apiArgs)
          }
          else {
            log('api module missing method:', method)
          }
        }
        catch (err) {
          log(0, 'deferred api import/execution error', err)
          throw err
        }
      }

      timers.stop('enhance-api')
    }

    let status = 200
    if (apiResult) {
      status = apiResult.status || apiResult.code || apiResult.statusCode || 200 // @arc/fns things
    }

    // should we return early or continute and create HTML?
    // TODO: this isn't a complete implementation yet
    if (
      status > 299 ||
      (reqHheaders?.accept === 'application/json' && apiResult.json)
    ) {
      log('returning api result without rendering')
      return { ...apiResult }
    }

    if (!page) {
      log('route has api without page, but json was not requested')
      throw new Error('404', { cause: 'route missing page' })
    }

    let pageTagName
    let pageHtml
    if (page.element) {
      const { deferredFn, fn, tagName } = page.element
      pageTagName = tagName || 'page-'
      log('creating element for', pageTagName)
      if (fn) {
        elements[pageTagName] = fn
      }
      else if (deferredFn) {
        log('importing element', deferredFn)
        try {
          elements[pageTagName] = (await deferredFn).default
        }
        catch (err) {
          log(0, 'deferred element import error', err)
          throw err
        }
      }
      pageHtml = `<${pageTagName}></${pageTagName}>`
    }
    else if (page.html) {
      log('assigning page.html')
      pageHtml = page.html
    }
    else if (page.deferredHtml) {
      log('reading page.deferredHtml')
      pageHtml = (await page.deferredHtml).toString()
    }

    timers.start('enhance-html')
    const renderResult = await render(
      pageHtml || '',
      { req, status, state: { ...reqState, ...apiResult?.json } },
      elements,
    )
    timers.stop('enhance-html')

    // merge timers into apiResult.headers
    const headers = {
      ...apiResult?.headers,
      [timers.key]: [ routerTimers?.value(), timers.value(), apiResult?.headers?.[timers.key] ].join(', '),
    }

    return {
      ...apiResult,
      headers,
      html: renderResult,
    }
  }

  /** @type {import('./types.js').EnhanceRender} */
  async function render (bodyString = '', payload = {}, elements = {}) {
    const {
      error,
      req = {},
      state: store = {},
      status = 200,
      ...renderState // arbitrary state
    } = payload

    let headString = ''
    if (typeof head === 'function') {
      log(`running head({ status: ${status}, ... })`)
      headString = head({
        // @ts-ignore // EnhanceHeadFnArg is probably too strict
        req,
        // @ts-ignore // I don't want to validate status is "200 | 404 | 500"
        status,
        error,
        store,
      })
    }

    const html = enhance({
      elements,
      initialState: {
        ...renderState,
        ...store,
      },
      ...ssrOptions,
    })

    log('rendering HTML')
    return html`${headString}${bodyString}`
  }

  return {
    render,
    routeAndRender,
  }
}
