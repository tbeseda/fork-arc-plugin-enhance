export default async function renderError (app, err) {
  const status = Number(err.message) // Core throws status code 404 or 500
  if (status === 404) {
    // render 404 page from templates
  }
  else if (status === 500) {
    // render 500 page from templates
  }

  // generic error page
  return {
    statusCode: 500,
    html: await app.render(`
<main>
  <h1>${err.message}</h1>
  <h2>${err.cause}</h2>
  <p>
    <pre>${err.stack}</pre>
  </p>
</main>`, { error: err }),
  }
}
