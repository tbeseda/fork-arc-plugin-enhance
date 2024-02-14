import { cwd } from 'node:process'
import http from 'node:http'
import styleTransform from '@enhance/enhance-style-transform'
import { createRouter } from '../../../../app-core/src/index.js'

const { routeAndRender, report } = createRouter({
  basePath: cwd(),
  apiPath: 'foo-app/api',
  pagesPath: 'foo-app/pages',
  elementsPath: 'foo-app/elements',
  componentsPath: 'foo-app/components',
  ssrOptions: {
    styleTransforms: [ styleTransform ],
  },
  state: { title: 'foobarbaz' },
  head (payload) {
    return /* html */`
<html>
  <head>
    <title>vanilla http server</title>
    <link rel="icon" href="data:;base64,iVBORw0KGgo=">
    <style>
      body {
        font-family: sans-serif;
      }
      main {
        max-width: 800px;
        margin: 0 auto;
        padding: 2rem;
      }
    </style>
  </head>`.trim()
  },
  debug: true,
})

report()

const server = http.createServer(async (req, res) => {
  const headers = Object.keys(req.headers).reduce((acc, key) => {
    acc[key] = req.headers[key]
    return acc
  }, {})

  const response = await routeAndRender({
    path: req.url,
    headers,
    method: req.method || 'GET',
  })

  res.writeHead(
    response.status || 200,
    {
      ...response.headers,
      'content-type': 'text/html; charset=utf-8',
    },
  )
  res.end(response.html || '')
})

server.listen(3000, () => {
  console.log('server listening on port 3000')
})
