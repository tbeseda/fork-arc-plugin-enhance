import enhance from '@enhance/ssr'
import headerTimers from 'header-timers'

/** @type {import('./types.js').CreateEnhanceRouteAndRender} */
export function createRouteAndRender ({
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

  const timers = headerTimers({ enabled: debug })

  /** @type {import('./types.js').EnhanceRouteAndRender} */
  async function routeAndRender (req, reqState) {
    const {
      headers: reqHheaders,
      path = '',
      method: reqMethod = 'GET',
    } = req

    let method = reqMethod.toLowerCase()
    if (method === 'delete') method = 'destroy'

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

    log(`routing "${path}" with:`, `
     api: ${api ? JSON.stringify(api) : 'no'}
     page: ${page ? JSON.stringify(page) : 'no'}
     params: ${JSON.stringify(params) || 'none'}
    `)

    let apiResult
    if (api) {
      timers.start('enhance-api')
      const { fn, deferredFn } = api
      const apiArgs = [
        { ...req, params },
        { state: { ...routerState, ...reqState } },
      ]

      if (fn && typeof fn[method] === 'function') {
        log('executing api', `${method}()`)
        try {
          apiResult = await fn[method](...apiArgs)
        }
        catch (err) {
          log(0, 'api execution error', err)
          throw err
        }
      }
      else if (deferredFn) {
        log('resolving deffered api function')
        try {
          const apiModule = await deferredFn
          const apiMethod = apiModule[method]

          if (typeof apiMethod === 'function') {
            log('executing api', `${method}()`)
            apiResult = await apiModule[method](...apiArgs)
          }
          else if (Array.isArray(apiMethod)) {
            log('executing api with', apiMethod.length, ' functions')
            // TODO: test this
            apiResult = await Promise.all(apiMethod.map(m => m(...apiArgs)))
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
      status > 299
      || apiResult?.body
      || apiResult?.html
      || apiResult?.xml
      || apiResult?.text
      || (reqHheaders?.accept === 'application/json' && apiResult?.json)
    ) {
      log('returning api result without rendering')
      return apiResult
    }

    if (!page) {
      log('route has api without page, but json was not requested')
      throw new Error('404', { cause: 'route missing page' })
    }

    timers.start('enhance-page')
    let pageTagName
    let pageHtml
    if (page.element) {
      const { deferredFn, fn, tagName } = page.element
      pageTagName = tagName || 'page-'
      log(`creating element for <${pageTagName}>`)
      if (fn) {
        log('using page element function')
        elements[pageTagName] = fn
      }
      else if (deferredFn) {
        log('resolving deferred page element function')
        try {
          elements[pageTagName] = (await deferredFn).default
        }
        catch (err) {
          log(0, 'deferred page element import error', err)
          throw err
        }
      }
      pageHtml = `<${pageTagName}></${pageTagName}>`
    }
    else if (page.html) {
      log('using static page html')
      pageHtml = page.html
    }
    else if (page.deferredHtml) {
      log('resolving deferred page html')
      pageHtml = (await page.deferredHtml).toString()
    }
    else {
      log('no page element or html')
      throw new Error('404', { cause: 'no page element or html' })
    }
    timers.stop('enhance-page')

    const renderResult = await render(
      pageHtml || '',
      { req, status, state: { ...reqState, ...apiResult?.json } },
      elements,
    )

    // merge timers into apiResult.headers
    let headers = apiResult?.headers
    if (timers.timers().length > 0) {
      const timerValues = [ timers.values() ]
      if (headers?.[timers.key]) timerValues.push(headers[timers.key])
      headers = {
        ...headers,
        [timers.key]: timerValues.join(','),
      }
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
      log(`executing head({ status: ${status}, ... })`)
      timers.start('enhance-head')
      headString = head({
        // @ts-ignore // EnhanceHeadFnArg is probably too strict
        req,
        // @ts-ignore // I don't want to validate status is "200 | 404 | 500"
        status,
        error,
        store,
      })
      timers.stop('enhance-head')
    }

    timers.start('enhance-html')
    const html = enhance({
      elements,
      initialState: {
        ...renderState,
        ...store,
      },
      ...ssrOptions,
    })
    timers.stop('enhance-html')

    log('rendering HTML')
    return html`${headString}${bodyString}`
  }

  return {
    render,
    routeAndRender,
    timers,
  }
}
