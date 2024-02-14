// import process from 'node:process'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
// import { createRouter } from '../../app-core/src/index.js'

// things to extract from the app-core
import { routesFromPaths, elementsFromPaths } from '../../app-core/src/scan-paths.js'
import { createElementName } from '../../app-core/src/util.js'

// do work
const here = dirname(fileURLToPath(import.meta.url))
const kitchenSink = join(here, '..', 'test', 'mocks', 'render-kitchen-sink')
const apiPath = join(kitchenSink, 'api')
const pagesPath = join(kitchenSink, 'pages')
const elementsPath = join(kitchenSink, 'elements')
const componentsPath = join(kitchenSink, 'components')

// const routes = new Map()
// const elements = new Map()
const routes = routesFromPaths({ apiPath, pagesPath })
const elements = elementsFromPaths({ elementsPath, componentsPath, })

for (const [ , record ] of routes) {
  const { api, page } = record

  if (api?.file?.mjs) {
    console.log(`importing api: ${api.file.mjs}`)
    api.fn = import(join(apiPath, api.file.mjs)) // Promise
  }

  if (page?.file) {
    if (page.file.mjs) {
      console.log(`importing page: ${page.file.mjs}`)

      page.element = {
        tagName: `page-${createElementName(page.file.mjs)}`,
        deferredFn: import(join(pagesPath, page.file.mjs)), // Promise
      }
    }
    else if (page.file.html) {
      console.log(`reading page: ${page.file.html}`)

      page.deferredHtml = new Promise((resolve, reject) => {
        if (page.file?.html) {
          const htmlString = readFileSync(join(pagesPath, page.file.html))
          resolve(htmlString.toString())
        }
        else reject(`no page file: ${page.file}`)
      })
    }
  }
}

console.log('routes:', routes)

const elementFunctions = {}
for (const [ name, record ] of elements) {
  const { file } = record
  if (!file) continue

  if (file.component) {
    console.log(file.component, ':C')
    try {
      const componentModule = await import(join(componentsPath, file.component))
      elementFunctions[name] = componentModule.default?.render
    }
    catch (err) {
      console.log('component import error', err)
      throw err
    }
  }
  else if (file.mjs) {
    console.log(file.mjs, ':E')
    try {
      const elementModule = await import(join(elementsPath, file.mjs))
      elementFunctions[name] = elementModule.default
    }
    catch (err) {
      console.log('element import error', err)
      throw err
    }
  }
  else if (file.html) {
    console.log(file.html, ':H')
    const elemHtml = readFileSync(join(elementsPath, file.html)).toString()
    elementFunctions[name] = ({ html }) => html`${elemHtml}`
  }
}

console.log('elementFunctions:', elementFunctions)

// const router = createRouter({
//   basePath: 'null',
//   // send all route and element manifests as functions
//   routes,
//   elements,

//   debug: true,
// })
