import fg from 'fast-glob'

import { createElementName } from './util.js'

const { sync: globSync } = fg

/** @type {fg.Options} */
const globOpts = {
  onlyFiles: true,
  dot: true,
  ignore: [ '**/node_modules/**' ],
}

/**
 * @description combine possible api and pages routes into one router
 * @param {{ apiPath: string, pagesPath: string }} options
 * @returns {import('./types.js').RoutesManifest}
 */
export function routesFromPaths ({ apiPath, pagesPath }) {
  /** @type {import('./types.js').RoutesManifest} */
  const routes = new Map()

  const apiFiles = apiPath
    ? globSync('**/*.mjs', { ...globOpts, cwd: apiPath })
    : []
  for (const filename of apiFiles) {
    const route = filename
      .replace(/^/, '/')
      .replace(/\.mjs$/, '')
      .replace(/index$/, '')
    routes.set(route, { api: { file: { mjs: filename } } })
  }

  const pageFilenames = pagesPath
    ? globSync('**/*.{html,mjs}', { ...globOpts, cwd: pagesPath })
    : []
  for (const filename of pageFilenames) {
    const ext = filename.split('.').at(-1)
    if (!ext) continue

    const route = filename
      .replace(/^/, '/')
      .replace(/\.(html|mjs)$/, '')
      .replace(/index$/, '')

    if (routes.has(route)) {
      // api or page with different extension
      const existingRoute = routes.get(route)
      if (existingRoute) {
        existingRoute.page = {
          ...existingRoute.page,
          file: {
            ...existingRoute.page?.file,
            [ext]: filename,
          },
        }
      }
    }
    else {
      routes.set(route, { page: { file: { [ext]: filename } } })
    }
  }

  return routes
}

/**
 * @description find all elements and components
 * @param {{ elementsPath: string, componentsPath: string }} options
 * @returns {import('./types.js').ElementsManifest}
 */
export function elementsFromPaths ({ elementsPath, componentsPath }) {
  /** @type {import('./types.js').ElementsManifest} */
  const elements = new Map()

  const elementFilenames = elementsPath
    ? globSync('**/*.{html,mjs}', { ...globOpts, dot: false, cwd: elementsPath })
    : []
  for (const filename of elementFilenames) {
    const ext = filename.split('.').at(-1)
    if (!ext) continue

    // element name should be lowercase and kebab-ed
    const name = createElementName(filename)

    if (elements.has(name)) {
      const currentElement = elements.get(name)
      const currentFile = currentElement?.file?.[ext]

      if (
        currentElement
        //  not set      OR       least nested file wins
        && (!currentFile || currentFile.length < filename.length)
      ) {
        currentElement.file = {
          ...currentElement.file,
          [ext]: filename,
        }
      }
    }
    else {
      elements.set(name, { file: { [ext]: filename } })
    }
  }

  const componentFiles = componentsPath
    ? globSync('**/*.mjs', { ...globOpts, dot: false, cwd: componentsPath })
    : []
  for (const filename of componentFiles) {
    const name = createElementName(filename)
    if (elements.has(name)) {
      const currentElement = elements.get(name)
      const currentFile = currentElement?.file?.component

      if (
        currentElement
        //  not set      OR       least nested file wins
        && (!currentFile || currentFile.length < filename.length)
      ) {
        currentElement.file = {
          ...currentElement.file,
          component: filename,
        }
      }
    }
    else {
      elements.set(name, { file: { component: filename } })
    }
  }

  return elements
}
