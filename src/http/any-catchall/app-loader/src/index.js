import { readFileSync } from 'node:fs'
import { join } from 'node:path'

import headerTimers from 'header-timers'

import { routesFromPaths, elementsFromPaths } from './scan-paths.js'
import { createElementName } from './util.js'

/** @type {import('./types.js').EnhanceLoad} */
export default async function load ({ basePath, debug = false, ...options }) {
  if (!basePath) throw new Error('missing basePath')

  const timers = headerTimers({ enabled: true })
  function log (...args) {
    if (debug) console.log(...args)
  }

  let {
    apiPath = 'api',
    pagesPath = 'pages',
    elementsPath = 'elements',
    componentsPath = 'components',
  } = options

  timers.start('enhance-fs-scan')

  apiPath = join(basePath, apiPath)
  pagesPath = join(basePath, pagesPath)
  const routes = routesFromPaths({ apiPath, pagesPath })

  elementsPath = join(basePath, elementsPath)
  componentsPath = join(basePath, componentsPath)
  const elements = elementsFromPaths({ elementsPath, componentsPath })

  timers.stop('enhance-load-scan')

  timers.start('enhance-load-build')

  /** @type {import('./types.js').CoreRoutesManifest} */
  const routesForCore = new Map()
  for (const [ path, { api, page } ] of routes) {
    /** @type {import('./types.js').CoreRouteRecord} */
    const route = {}

    if (api?.mjs) {
      log(`importing api: ${api.mjs}`)
      route.api = { deferredFn: import(join(apiPath, api.mjs)) }
    }

    if (page) {
      route.page = {}
      if (page.mjs) {
        log(`importing page: ${page.mjs}`)

        route.page.element = {
          tagName: `page-${createElementName(page.mjs)}`,
          deferredFn: import(join(pagesPath, page.mjs)),
        }
      }
      else if (page.html) {
        const pageHtml = page.html
        log(`reading page: ${pageHtml}`)

        route.page.deferredHtml = new Promise((resolve) => {
          const htmlString = readFileSync(join(pagesPath, pageHtml))
          resolve(htmlString.toString())
        })
      }
    }

    routesForCore.set(path, route)
  }

  /** @type {import('./types.js').EnhanceElements} */
  const elementFunctions = {}
  for (const [ name, record ] of elements) {
    // prefer component over mjs over html
    if (record.component) {
      log(`importing component: ${record.component}`)
      const componentModule = await import(join(componentsPath, record.component))
      elementFunctions[name] = componentModule?.default?.render
    }
    else if (record.mjs) {
      log(`importing element: ${record.mjs}`)
      // * if enhance-ssr supports promises, don't await
      const elemModule = await import(join(elementsPath, record.mjs))
      elementFunctions[name] = elemModule?.default
    }
    else if (record.html) {
      log(`reading element: ${record.html}`)
      const htmlString = readFileSync(join(elementsPath, record.html))
      elementFunctions[name] = () => htmlString?.toString() || ''
    }
  }

  timers.stop('enhance-load-build')

  return {
    timers,
    routes: routesForCore,
    elements: elementFunctions,
  }
}
