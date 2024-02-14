import { join } from 'node:path'

import * as radix3 from 'radix3'
import headerTimers from 'header-timers'

import { routesFromPaths, elementsFromPaths } from './scan-paths.js'
import { createRouteAndRender } from './route-and-render.js'
import { createLogger, createReport } from './logger.js'

/** @type {import('./types').CreateEnhanceRouter} */
export function createRouter (options) {
  const {
    basePath,
    debug = false,
  } = options
  let {
    // paths to expand with basePath:
    apiPath = 'api',
    pagesPath = 'pages',
    elementsPath = 'elements',
    componentsPath = 'components',
    // provided manifests:
    routes,
    elements,
  } = options

  const timers = headerTimers({ enabled: true })
  const log = createLogger(debug)

  log(0, '✦ Router started in:', basePath)

  timers.start('enhance-fs-scan')

  if (!routes && (apiPath || pagesPath)) {
    log('creating routes from:'); log(4, apiPath, '+', pagesPath)
    apiPath = join(basePath, apiPath)
    pagesPath = join(basePath, pagesPath)
    routes = routesFromPaths({ apiPath, pagesPath })
  }
  else routes = new Map()

  if (!elements && (elementsPath || componentsPath)) {
    log('scanning for elements in:'); log(4, elementsPath, '+', componentsPath)
    elementsPath = join(basePath, elementsPath)
    componentsPath = join(basePath, componentsPath)
    elements = elementsFromPaths({ elementsPath, componentsPath })
  }
  else elements = new Map()

  timers.stop('enhance-fs-scan')

  const radixRouter = radix3.createRouter({
    routes: Object.fromEntries(routes),
  })

  const { render, routeAndRender } = createRouteAndRender({
    timers,
    log,
    radixRouter,
    ...options,
    // override options with updates
    elements,
    apiPath,
    pagesPath,
    elementsPath,
    componentsPath,
  })

  const report = createReport({ elements, routes })

  return {
    options,
    routes,
    elements,
    radixRouter,
    timers,
    log,
    report,
    render,
    routeAndRender,
  }
}
