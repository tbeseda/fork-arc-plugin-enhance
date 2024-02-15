export function getState () {
  return { now: new Date().toISOString() }
}

export function preflight (req) {
  return { title: `My site - ${req.path}` }
}

export function postflight ({timers, response}) {
  const headers = {
    ...response.headers,
    [timers.key]: [
      timers.value(),
      response.headers[timers.key]
    ].join(', '),
  }
  return {...response, headers}
}

export function head ({ store }) {
  return /* html */`
    <html>
      <head>
        <title>${store.title}</title>
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
}
