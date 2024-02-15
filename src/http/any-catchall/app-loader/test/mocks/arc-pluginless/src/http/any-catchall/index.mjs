import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

import arc from '@architect/functions'
import importTransform from '@enhance/import-transform'
import styleTransform from '@enhance/enhance-style-transform'

import loadAppConfig from '../../../../../../src/index.js'

import { getState, head, preflight, postflight } from './helpers.mjs'

const debug = true

const thisDir = dirname(fileURLToPath(import.meta.url))
const app = createEnhanceApp({
  basePath: join(thisDir, 'foo-app'),
  apiPath: 'api',
  pagesPath: 'pages',
  elementsPath: 'elements',
  componentsPath: 'components',
  ssrOptions: {
    scriptTransforms: [ importTransform({ lookup: arc.static }) ],
    styleTransforms: [ styleTransform ],
  },
  state: getState(),
  head,
  debug,
})

if (debug) app.report()

async function http (req) {
  console.log(`${c.orange(req.method)} ${req.path}`)

  try {
    const moreState = await preflight(req)
    const response = await app.routeAndRender(req, moreState)

    return postflight(response)
  }
  catch (err) {
    return {
      statusCode: Number(err.message),
      html: await app.render(`
        <main>
          <h1>${err.message}</h1>
          <h2>${err.cause}</h2>
          <p>
            <pre>${err.stack}</pre>
          </p>
          <error-help></error-help>
        </main>
      `, { error: err }),
    }
  }
}

export const handler = arc.http(http)
