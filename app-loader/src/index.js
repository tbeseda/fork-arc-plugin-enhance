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
    if (debug)
      console.log(
        ...args.map(
          a => typeof a === 'string' && a.length > 0
            ? `\x1b[2m${a}\x1b[22m`
            : a
        )
      )
  }

  let {
    apiPath = 'api',
    pagesPath = 'pages',
    elementsPath = 'elements',
    componentsPath = 'components',
  } = options

  log('☆ loading routes and elements')

  timers.start('enhance-fs-scan')

  apiPath = join(basePath, apiPath)
  pagesPath = join(basePath, pagesPath)
  const routes = routesFromPaths({ apiPath, pagesPath })

  elementsPath = join(basePath, elementsPath)
  componentsPath = join(basePath, componentsPath)
  const elements = elementsFromPaths({ elementsPath, componentsPath })

  timers.stop('enhance-fs-scan')

  /** @type {import('./types.js').CoreRoutesManifest} */
  const routesForCore = new Map()
  /** @type {import('./types.js').EnhanceElements} */
  const elementFunctions = {}

  timers.start('enhance-routes')
  for (const [ p, { api, page } ] of routes) {
    const path = p.replace(/\$/g, ':')
    /** @type {import('./types.js').CoreRouteRecord} */
    const route = {}

    if (api?.mjs) {
      log(`  importing api "${api.mjs}" for route: ${path}`)
      route.api = { deferredFn: import(join(apiPath, api.mjs)) }
    }

    if (page) {
      route.page = {}
      if (page.mjs) {
        log(`  importing page "${page.mjs}" for route: ${path}`)
        const tagName = `page-${createElementName(page.mjs)}`
        const deferredFn = import(join(pagesPath, page.mjs))

        // ? should this also be added to elements?
        // Core's routeAndRender() does load it in elements for @enhance/ssr
        // elementFunctions[tagName] = await deferredFn

        route.page.element = { tagName, deferredFn }
      }
      else if (page.html) {
        const pageHtml = page.html
        log(`  reading page "${pageHtml}" for route: ${path}`)

        route.page.deferredHtml = new Promise((resolve) => {
          const htmlString = readFileSync(join(pagesPath, pageHtml))
          resolve(htmlString.toString())
        })
      }
    }

    routesForCore.set(path, route)
  }
  timers.stop('enhance-routes')

  timers.start('enhance-elements')
  for (const [ name, { component, mjs, html } ] of elements) {
    // prefer component over mjs over html
    if (component) {
      log(`  importing component: ${component}`)
      const componentModule = await import(join(componentsPath, component))
      elementFunctions[name] = componentModule?.default?.render
    }
    else if (mjs) {
      log(`  importing element: ${mjs}`)
      // * if enhance-ssr supports promises, don't await
      const elemModule = await import(join(elementsPath, mjs))
      elementFunctions[name] = elemModule?.default
    }
    else if (html) {
      log(`  reading element: ${html}`)
      const htmlString = readFileSync(join(elementsPath, html))
      elementFunctions[name] = () => htmlString?.toString() || ''
    }
  }
  timers.stop('enhance-elements')

  return {
    timers,
    routes: routesForCore,
    elements: elementFunctions,
  }
}
