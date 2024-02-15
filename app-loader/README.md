> [!NOTE]  
> This work started in [../app-core](../app-core/)

# WIP: `@enhance/app-loader` "Loader" (working title)

## goals

### mainly:

Provide a full, pre-loaded config for `@enhance/app-core`.  
That's routes (from api and pages) and elements from [from elements (mjs and html) and components].

### also...

- be the bridge between the Arc plugin and "Core"
- defaults to the well-established Enhance app file structure
  - not concerned with `head` or `preflight`
- be performant as possible
  - promises help to defer work until needed
- good IntelliSense

## samples

the gist in an Arc handler...

```javascript
import arc from '@architect/functions'
import loadAppConfig from '@enhance/app-loader'
import createEnhanceApp from '@enhance/app-core'

const basePath = process.cwd()
const appConfig = await loadAppConfig({ basePath })
const app = createEnhanceApp(appConfig)

async function http(req) {
  return await app.routeAndRender(req)
}

export const handler = arc.http(http)
```

this ☝️ is very minimal. check out [test/mocks](./test/mocks/) for a more complete Arc example and a vanilla Node.js `http` example.
