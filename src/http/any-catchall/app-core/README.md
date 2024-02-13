> [!NOTE]  
> This work is carried from [tbeseda/enhance-app-core](https://github.com/tbeseda/enhance-app-core)

# WIP: `enhance-app-core` (working title)

## goals

### mainly:

Create an intermediary library between `@enhance/arc-plugin-enhance` and `@enhance/ssr`

- **scope:** scan files and create router. return a method `routeAndRender()` that does
  - `req` → { route, load, render, return } → `result`
- **more easily tested**
- adaptable to other Node.js servers

### also...

- enhance app structure without Arc dependency
  - file-based routing and element loading
- use `@architect/function#http`-style input and output
- outsource routing to external dep
- don't swallow user-land exceptions
- core router doesn't _render_ errors, just throws
  - only throws on missing or incomplete route: `err.message` is `"404"`
  - if user-land code throws, log the exception and throw
- don't load state pre-Enhance api fn (so no preflight)
  - do allow initial router state to be provided
- don't search for head file
  - allow head _function_ to be provided
- type defs, but still permissive as it's fairly flexible

## notes

- 🚀 my site, tbeseda.com, is deployed with this in a staging env
  - https://github.com/tbeseda/tbeseda-com/blob/enhance-app-core/src/http/any-catchall/index.mjs
  - https://bnpopnujr4.execute-api.us-east-1.amazonaws.com/
  - there are errors when session and some api state is involved 
  - note: overall performance won't be comparable to production since prod is behind CloudFront
    - but timers are valid, see note below
- the `radix3` router (currently implemented) is a good router candidate
  - it will never be a bottleneck
  - but it uses `:` to denote params, Enhance uses `$`
- 😞 session passing isn't implemented
- 🤨 state passing to user-land code is not handled correctly yet
- there's no compression - I _think_ that's out of scope here
- the perf is on par with `arc-plugin-enhance` on cold start, and 100ms faster when warm
  - `header-timers` has been added to be synonymous with timers in `arc-plugin-enhance`
- the main method is `routeAndRender()`, but `render()` is also very helpful
  - and `elements` override in `render()` could be a perf vector

### 🌟 wild idea

reduce scope further and exclude any file scanning. instead `app-core` consumer hands over:

- api routes with handlers
- page routes with handlers (html str or `<page-` fn)
- elements with definitions (function, html str, or component def)

_then_ we create `enhance-app-loader` based on work here, to create the config for `enhance-app-core`

in theory... `@enhance/arc-plugin-enhance` uses `@enhance/app-loader` to create the config for `@enhance/app-core` which runs `@enhance/ssr`  
then the Arc plugin can be swapped for another server and a custom loader can be used to create the config for `app-core`

the source of truth for route + render order of operations is in the core. like Iron Man. or something.

## next

- [ ] fix session and state passing
- [ ] handle path params
- [ ] expand options/config to allow pre-loaded routes, handlers, pages, and elements
- [ ] swap linter config
- [ ] drop into existing arc-plugin-enhance as sidecar, run tests
- [ ] gather feedback around API and general approach

## sample

in a vanilla Node server (this is only partially tested rn):

```javascript
import { cwd } from 'node:process'
import http from 'node:http'
import styleTransform from '@enhance/enhance-style-transform'
import { createRouter } from 'enhance-core-app'

import { headersToJson, head, preflight } from './helpers.mjs'

const { routeAndRender } = createRouter({
  basePath: cwd() + '/path/to/app',
  ssrOptions: {
    styleTransforms: [styleTransform],
  },
  state: { title: 'foobarbaz' },
  head,
})

const server = http.createServer(async (req, res) => {
  const headers = headersToJson(req.headers)
  const requestState = await preflight(req)
  const response = await routeAndRender(
    { path: req.url, method: req.method, headers },
    requestState,
  )

  res.writeHead(response.status, response.headers)
  res.end(response.html)
})

server.listen(3000, () => {
  console.log('server listening on port 3000')
})
```

in an Arc handler with error rendering:

```javascript
import arc from '@architect/functions'
import importTransform from '@enhance/import-transform'
import styleTransform from '@enhance/enhance-style-transform'

import { createRouter } from 'enhance-app-core'

import { getState, head, preflight, postflight } from './helpers.mjs'

const router = createRouter({
  basePath: 'path/to/app',
  apiPath: 'api',
  pagesPath: 'pages',
  elementsPath: 'elements',
  componentsPath: 'components',
  ssrOptions: {
    scriptTransforms: [importTransform({ lookup: arc.static })],
    styleTransforms: [styleTransform],
  },
  state: getState(),
  head,
})

router.report() // for fun

async function http (req) {
  try {
    const moreState = await preflight(req)
    const response = await router.routeAndRender(req, moreState)
    return postflight(response)
  } catch (err) {
    return {
      statusCode: Number(err.message) || 500,
      html: await router.render(`
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
```
