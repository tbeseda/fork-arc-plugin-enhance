> [!NOTE]  
> This work started in [../app-core](../app-core/)

# WIP: `@enhance/app-loader` "Loader" (working title)

## goals

### mainly:

Provide a full, pre-loaded config for `@enhance/app-core`.  
That's routes (from api and pages) and elements from [from elements (mjs and html) and components].

### also...

- be the bridge between a server env (like `arc-plugin-enhance`) and "Core"
- **more easily tested**
- defaults to the well-established Enhance app file structure
  - though, not concerned with `head` or `preflight`
- be performant as possible
  - promises help to defer work until needed
- good IntelliSense

## next

- [ ] page tag names aren't 1:1 with current implementation

## samples

the gist in an Arc handler...

```javascript
import arc from '@architect/functions'
import loadAppConfig from '@enhance/app-loader'
import createEnhanceApp from '@enhance/app-core'

const basePath = process.cwd()
const appConfig = await loadAppConfig({ basePath })
const app = createEnhanceApp(appConfig)

export const handler = arc.http.bind(app.routeAndRender)
```

this ☝️ is very minimal. check out [test/mocks](./test/mocks/) for a more complete Arc example and a vanilla Node.js `http` example.
