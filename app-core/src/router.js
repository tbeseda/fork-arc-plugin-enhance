import * as radix3 from 'radix3'

import { createRouteAndRender } from './route-and-render.js'
import { createLogger, createReport } from './util.js'

/** @type {import('./types').CreateEnhanceRouter} */
export function createRouter ({ debug = false, ...options }) {
  const { routes, elements = {} } = options

  const log = createLogger(debug)

  log(0, '✦ Creating router with', routes.size, 'routes and', Object.keys(elements).length, 'elements')

  const routerOptions = { routes: Object.fromEntries(routes) }
  const radixRouter = radix3.createRouter(routerOptions)

  const { render, routeAndRender, timers } = createRouteAndRender({
    log,
    radixRouter,
    ...options,
    elements,
  })

  const report = createReport({ routes, elements })

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
