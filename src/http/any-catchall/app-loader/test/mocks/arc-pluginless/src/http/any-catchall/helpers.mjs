export function getState () {
  return { now: new Date().toISOString() }
}

export function preflight (req) {
  return { title: `My site - ${req.path}` }
}

export function postflight (res) {
  return res
}

export function head () {
  return /* html */`
    <html>
      <head>
        <title>arc-pluginless</title>
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
