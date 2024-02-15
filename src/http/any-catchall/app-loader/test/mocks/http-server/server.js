import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import http from 'node:http'

import styleTransform from '@enhance/enhance-style-transform'

import loadAppConfig from '../../../../app-loader/src/index.js'
import createEnhanceApp from '../../../../app-core/src/index.js'

import head from './head.js'

const thisDir = dirname(fileURLToPath(import.meta.url))
const config = await loadAppConfig({ basePath: join(thisDir, 'foo-app') })

const app = createEnhanceApp({
  ...config,
  ssrOptions: {
    styleTransforms: [ styleTransform ],
  },
  state: { title: 'foobarbaz' },
  head,
  debug: true,
})

app.report()

const server = http.createServer(async (req, res) => {
  const headers = Object.keys(req.headers).reduce((acc, key) => {
    acc[key] = req.headers[key]
    return acc
  }, {})

  let response
  try {
    response = await app.routeAndRender({
      headers,
      path: req.url,
      // @ts-ignore
      method: req.method,
    })

    res.writeHead(
      response.status || 200,
      {
        ...response.headers,
        'content-type': 'text/html; charset=utf-8',
      },
    )
    res.end(response.html || '')
  } catch (err) {
    const status = Number(err.message) || 500
    const html = await app.render(`
        <main>
          <h1>${err.message}</h1>
          <h2>${err.cause}</h2>
          <p>
            <pre>${err.stack}</pre>
          </p>
          <error-help></error-help>
        </main>`)
    res.writeHead(status, {
      'content-type': 'text/html; charset=utf-8',
    })
    res.end(html)
  }

})

server.listen(3000, () => {
  console.log('server listening on port 3000')
})
