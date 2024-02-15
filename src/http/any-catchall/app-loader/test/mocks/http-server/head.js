export default function head (payload) {
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
}
