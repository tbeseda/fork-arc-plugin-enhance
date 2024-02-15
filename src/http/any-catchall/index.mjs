import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

import arc from '@architect/functions'
import importTransform from '@enhance/import-transform'
import styleTransform from '@enhance/enhance-style-transform'
import loadAppConfig from '../../../app-loader/src/index.js'
import createEnhanceApp from '../../../app-core/src/index.js'

import fingerprintPublicRefs from './fingerprint-paths.mjs'
import { findHeadFn, findPreflightFn, mergeTimingHeaders } from './util.mjs'

const DEBUG = 0

const here = dirname(fileURLToPath(import.meta.url))
const basePath = join(here, 'node_modules', '@architect', 'views')

const head = await findHeadFn(basePath)
const preflight = await findPreflightFn(basePath)
const config = await loadAppConfig({ basePath, debug: DEBUG > 0 })

const app = createEnhanceApp({
  ...config,
  head,
  ssrOptions: {
    scriptTransforms: [ importTransform({ lookup: arc.static }) ],
    styleTransforms: [ styleTransform ],
  },
  state: {}, // * New
  debug: DEBUG > 0,
})

async function http (req) {
  try {
    const moreState = await preflight(req)
    const response = await app.routeAndRender(req, moreState)

    response.html = fingerprintPublicRefs(response.html)
    const headers = mergeTimingHeaders(response.headers, app.timers)

    return { ...response, headers }
  }
  catch (err) {
    const status = Number(err.message) // Core throws status code 404 or 500
    if (status === 404) {
      // render 404 page from templates
    }
    else if (status === 500) {
      // render 500 page from templates
    }
    // generic error page
    return {
      statusCode: 500,
      html: await app.render(`
          <main>
            <h1>${err.message}</h1>
            <h2>${err.cause}</h2>
            <p>
              <pre>${err.stack}</pre>
            </p>
          </main>
        `, { error: err }),
    }
  }
}

export const handler = arc.http(http)
