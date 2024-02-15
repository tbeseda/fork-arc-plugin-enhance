import { getStyles }  from '@enhance/arc-plugin-styles'

export default function Head ({ req, /* store, status, error */ }) {
  const { path } = req
  const title = `My app — ${path}`

  const styles = process.env.ARC_LOCAL
    ? getStyles.linkTag()
    : getStyles.styleTag()

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <title>${title}</title>
      ${styles}
      <link rel="icon" href="data:;base64,iVBORw0KGgo=">
      <style>
        body {
          max-width: 800px;
          margin: 0 auto;
          padding: 2rem;
          font-family: sans-serif;
        }
      </style>
    </head>
  `
}
