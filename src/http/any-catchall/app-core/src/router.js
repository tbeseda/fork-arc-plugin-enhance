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
    lazy = false, // ! not implemented
    debug = false,
  } = options
  // paths to expand with basePath:
  let {
    apiPath,
    pagesPath,
    elementsPath,
    componentsPath,
  } = options

  if (lazy) {
    throw new Error('lazy router not yet implemented')
  } else {
    const timers = headerTimers({ enabled: true })
    const log = createLogger(debug)

    log(0, '✦ Router started in:', basePath)

    timers.start('enhance-fs-scan')

    log('creating routs from:'); log(4, apiPath, '+', pagesPath)
    apiPath = join(basePath, apiPath)
    pagesPath = join(basePath, pagesPath)
    const routes = routesFromPaths({ apiPath, pagesPath })

    log('scanning for elements in:'); log(4, elementsPath, '+', componentsPath)
    elementsPath = join(basePath, elementsPath)
    componentsPath = join(basePath, componentsPath)
    const elements = elementsFromPaths({ elementsPath, componentsPath })

    timers.stop('enhance-fs-scan')

    // create radix router
    const radixRouter = radix3.createRouter()
    for (const [path, data] of routes) radixRouter.insert(`/${path}`, data)

    const { render, routeAndRender } = createRouteAndRender({
      timers,
      log,
      radixRouter,
      elements,
      ...options,
      apiPath, // override options with expanded paths
      pagesPath,
      elementsPath,
      componentsPath,
    })

    const report = createReport({ elements, routes, radixRouter })

    return {
      options,
      routes,
      elements,
      radixRouter,
      log,
      report,
      render,
      routeAndRender,
    }
  }
}
