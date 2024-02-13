import fg from 'fast-glob'

import { createElementName } from './util.js'

const { sync: globSync } = fg

/** @type {fg.Options} */
const globOpts = {
  onlyFiles: true,
  dot: true,
  ignore: [ '**/node_modules/**' ],
}

/** @returns {import('./types.js').RoutesManifest} */
export function routesFromPaths ({ apiPath, pagesPath }) {
  // combine possible api and pages routes into one router
  const routes = new Map()
  const apiFiles = apiPath
    ? globSync('**/*.mjs', { ...globOpts, cwd: apiPath })
    : []
  const pageFiles = pagesPath
    ? globSync('**/*.{html,mjs}', { ...globOpts, cwd: pagesPath })
    : []
  for (const file of apiFiles) {
    const route = file.replace(/\.mjs$/, '').replace(/index$/, '')
    routes.set(route, { api: file })
  }
  for (const file of pageFiles) {
    const extension = file.split('.').at(-1)
    if (!extension) continue

    const route = file.replace(/\.(html|mjs)$/, '').replace(/index$/, '')

    if (routes.has(route)) {
      // api or page with different extension
      const existingRoute = routes.get(route)
      existingRoute.page = { ...existingRoute.page, [extension]: file }
    }
    else {
      routes.set(route, { page: { [extension]: file } })
    }
  }
  return routes
}

/** @returns {import('./types.js').ElementsManifest} */
export function elementsFromPaths ({ elementsPath, componentsPath }) {
  // find all elements and components
  const elements = new Map()
  const elementFiles = elementsPath
    ? globSync('**/*.{html,mjs}', { ...globOpts, dot: false, cwd: elementsPath })
    : []
  for (const file of elementFiles) {
    const extension = file.split('.').at(-1)
    if (!extension) continue

    // element name should be lowercase and kebab-ed
    const name = createElementName(file)

    if (elements.has(name)) {
      const currentFile = elements.get(name)[extension]
      //  not yet set      OR       least nested file wins
      if (!currentFile || file.length < currentFile.length) {
        elements.get(name)[extension] = file
      }
    }
    else {
      elements.set(name, { [extension]: file })
    }
  }
  const componentFiles = componentsPath
    ? globSync('**/*.mjs', { ...globOpts, dot: false, cwd: componentsPath })
    : []
  for (const file of componentFiles) {
    const name = createElementName(file)
    if (elements.has(name)) {
      elements.get(name).component = file
    }
    else {
      elements.set(name, { component: file })
    }
  }
  return elements
}
