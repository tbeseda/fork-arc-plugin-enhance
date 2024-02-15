> [!NOTE]  
> This work is carried from [tbeseda/enhance-app-core](https://github.com/tbeseda/enhance-app-core)

# WIP: `@enhance/app-core` "Core" (working title)

## goals

### mainly:

Create an intermediary library between `@enhance/arc-plugin-enhance` and `@enhance/ssr`

- **scope:** create router from pre-loaded routes Map. marshall pre-defined element functions. return a method `routeAndRender()` that does:
  - `req` → { route, execute api, render template, return } → `result`
- Agnostic to Architect (mostly - see below about i/o)
  - this library doesn't consider many Arc things or Arc-specific parts of `arc-plugin-enhance`.
- **more easily tested**
- adaptable to other Node.js servers - even other runtimes like Deno and the browser
  - there are no Node.js dependencies in this library

### also...

- use `@architect/function#http`-style input and output
  - adapters could be used to convert to/from other formats like native `IncomingMessage` and `ServerResponse` - the advantag here is that implementation is above Core
- outsource routing to external dep (not a hard requirement, but many benefits)
  - will require some adapting to fit Enhance path param API
- don't swallow user-land exceptions
  - the Core consumer can handle errors as it sees fit
- Core router doesn't _render_ errors, just throws
  - only throws on missing or incomplete route: `err.message` is `"404"`
  - if user-land code throws, log the exception and throw
- don't search for head file - but allow it to be provided
- don't load state for api fn (so no preflight)
  - but allow additional state at request-time for `routeAndRender()`
  - also allow initial router state to be provided
- expose decent type defs for configuration and returned values

## notes

- the main method is `routeAndRender()`, but `render()` is also very helpful
  - and `elements` override in `render()` could be a perf vector
- the `radix3` router (currently implemented) is a good router candidate
  - it will never be a bottleneck
  - but it uses `:` to denote params, Enhance uses `$`
- 😞 session passing isn't implemented
- 🤨 state passing to user-land code is not handled correctly yet
- ⁉️ I forgot about middleware!
- there's no compression - IMO that's out of scope here
- the perf is on par with `arc-plugin-enhance` on cold start, and 100ms faster when warm
  - `header-timers` has been added to be synonymous with timers in `arc-plugin-enhance`

## next

- [ ] fix session and state passing
- [ ] handle path params
- [ ] add middleware considerations
- [x] expand options/config to allow pre-loaded routes, handlers, pages, and elements
- [x] swap linter config
- [ ] drop into existing arc-plugin-enhance as sidecar, run tests
- [ ] gather feedback around API and general approach
- [ ] plenty more smol things

## samples

check out [test/mocks/](../app-loader/test/mocks/) in `app-loader` for an example of an Arc handler, a vanilla Node.js `http` server, and a bunch of tests.
