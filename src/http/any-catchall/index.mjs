import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

import arc from '@architect/functions'

import createApp from './create-app.mjs'
import fingerprintPublicRefs from './fingerprint-paths.mjs'
import renderError from './render-error.mjs'
import { findPreflightFn, mergeTimingHeaders } from './util.mjs'

const DEBUG = 0

const here = dirname(fileURLToPath(import.meta.url)) // SOMEDAY: import.meta.dirname
const basePath = join(here, 'node_modules', '@architect', 'views')

const app = await createApp({ basePath, DEBUG })
const preflight = await findPreflightFn(basePath)

async function http (req) {
  if (DEBUG > 0) app.report()

  try {
    const moreState = await preflight(req)
    const response = await app.routeAndRender(req, moreState)

    response.html = fingerprintPublicRefs(response.html)
    const headers = mergeTimingHeaders(response.headers, app.timers)

    return { ...response, headers }
  }
  catch (err) {
    return renderError(app, err)
  }
}

export const handler = arc.http(http)
