import { readFileSync } from 'node:fs'
import { join } from 'node:path'

import enhance from '@enhance/ssr'
import headerTimers from 'header-timers'

import { createElementName } from './util.js'

function logLine (req) {
  const { headers, method, path, requestContext } = req
  const line = [ 0, '✧' ]
  if (requestContext?.timeEpoch) { // Lambda specific
    line.push(`[${new Date(requestContext.timeEpoch * 1000).toLocaleString()}]`)
  }
  line.push(method)
  line.push(`${headers?.host || ''}${path}`)
  return line
}

/** @type {Record<string, Function>} */
let elementFunctions

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
    apiPath,
    pagesPath,
    elementsPath,
    componentsPath,
    head,
    state: routerState,
    ssrOptions,
    debug,
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

    const timers = headerTimers({ enabled: true })

    if (debug) log(...logLine(req))

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
      log('importing api:', api)

      timers.start('enhance-api', )

      let apiModule
      if (typeof api.fn?.[method] === 'function') {
        apiModule = api.fn
      }
      else if (api.file?.mjs) {
        log(`importing api: ${api.file.mjs}`)
        try {
          apiModule = await import(join(apiPath, api.file.mjs))
        }
        catch (err) {
          log(0, 'api import error', err)
          throw err
        }
      }

      if (apiModule[method]) {
        log(4, `executing api:`, `${method}()`)
        try {
          apiResult = await apiModule[method](
            { ...req, params },
            { state: { ...routerState, ...reqState } },
          )
        }
        catch (err) {
          log(0, 'api execution error', err)
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
    if (page.fn) {
      pageTagName = 'page-'
      elements.set(pageTagName, { fn: page.fn })
      pageHtml = `<${pageTagName}></${pageTagName}>`
    }
    else if (page.file) {
      if (page.file.mjs) {
        log(`importing page: ${page.file.mjs}`)
        pageTagName = `page-${createElementName(page.file.mjs)}`
        elements.set(pageTagName, { file: { mjs: page.file.mjs } })
        pageHtml = `<${pageTagName}></${pageTagName}>`
      }
      else if (page.file.html) {
        log(`reading page: ${page.file.html}`)
        pageHtml = readFileSync(join(pagesPath, page.file.html)).toString()
      }
    }

    // import element functions
    timers.start('enhance-elements')
    if (!elementFunctions || (pageTagName && !elementFunctions[pageTagName])) {
      log(`importing ${elements.size} elements`)

      elementFunctions = {}
      for (const [ name, e ] of elements) {
        if (e.fn) {
          log(4, name, ':F')
          elementFunctions[name] = e.fn
        }
        else if (e.file) {
          if (e.file.component) {
            log(4, e.file.component, ':C')
            try {
              const componentModule = await import(join(componentsPath, e.file.component))
              elementFunctions[name] = componentModule.default?.render
            }
            catch (err) {
              log(0, 'component import error', err)
              throw err
            }
          }
          else if (e.file.mjs) {
            log(4, e.file.mjs, ':E')
            try {
              const elementModule = await import(join(elementsPath, e.file.mjs))
              elementFunctions[name] = elementModule.default
            }
            catch (err) {
              log(0, 'element import error', err)
              throw err
            }
          }
          else if (e.file.html) {
            log(4, e.file.html, ':H')
            const elemHtml = readFileSync(join(elementsPath, e.file.html)).toString()
            elementFunctions[name] = ({ html }) => html`${elemHtml}`
          }
        }
      }
    }
    timers.stop('enhance-elements')

    timers.start('enhance-html')
    const renderResult = await render(
      pageHtml || '',
      { req, status, state: { ...reqState, ...apiResult?.json } },
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
  async function render (bodyString = '', payload = {}, elements = elementFunctions) {
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
