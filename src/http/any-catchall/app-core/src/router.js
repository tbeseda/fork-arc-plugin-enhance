import * as radix3 from 'radix3'
import headerTimers from 'header-timers'

import { createRouteAndRender } from './route-and-render.js'
import { createLogger, createReport } from './util.js'

/** @type {import('./types').CreateEnhanceRouter} */
export function createRouter ({ debug = false, ...options }) {
  const { routes, elements = {} } = options

  const timers = headerTimers({ enabled: true })
  const log = createLogger(debug)

  log(0, '✦ Creating router with', routes.size, 'routes and', Object.keys(elements).length, 'elements')

  const radixRouter = radix3.createRouter({
    routes: Object.fromEntries(routes),
  })

  const { render, routeAndRender } = createRouteAndRender({
    timers,
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
