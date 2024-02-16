import assert from 'node:assert/strict'
import test from 'node:test'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

import load from '../src/index.js'

const DEBUG = 0

const here = dirname(fileURLToPath(import.meta.url))

function fakeHtml (strings, ...values) {
  return strings.reduce((result, string, i) => {
    const value = values[i] === undefined ? '' : values[i]
    return result + string + value
  }, '')
}
const state = {
  store: { title: 'foobarbaz' },
  attrs: { foo: 'bar' },
  instanceID: 'A1B2C3',
  context: { bar: 'baz' },
}
const fakeEnhanceElemPayload = { state, html: fakeHtml }
const fakeEnhanceApiPayload = {
  body: {},
  query: {},
  headers: {},
  params: {},
  session: {},
  method: 'GET',
  path: '/dynamic/foo/subdir/bar',
}

test('smoke test', () => {
  assert.equal(typeof load, 'function')
})

test('required params', async () => {
  try {
    // @ts-ignore
    await load({ debug: DEBUG > 0 })
    assert.fail('Expected to throw')
  }
  catch (err) {
    assert.ok(err.message)
  }
})

const basePath = join(here, 'mocks', 'render-kitchen-sink')
const config = await load({ basePath, debug: DEBUG > 0 })
const { routes, elements, timers } = config

test('load return value', () => {
  assert.ok(config)
  assert.ok(timers)
  assert.ok(routes)
  assert.ok(elements)
})

test('loaded routes', async () => {
  // console.log('routes', routes)

  assert.equal(routes.size, 7)

  const fooBar = routes.get('/foo-bar')
  assert.ok(fooBar)

  const apiOnly = routes.get('/api-only')
  assert.ok(apiOnly)
  assert.ok(apiOnly.api?.deferredFn?.then, 'Expected apiOnly.api.deferredFn to be a Promise')

  const pageOnly = routes.get('/page-only')
  assert.ok(pageOnly)
  assert.ok(pageOnly.page?.deferredHtml, 'Expected pageOnly.page.element.deferredFn to be a Promise')

  const pageElement = routes.get('/foo/bar')
  assert.ok(pageElement)
  assert.ok(pageElement.api?.deferredFn?.then, 'Expected pageElement.api.deferredFn to be a Promise')
  assert.ok(pageElement.page?.element?.deferredFn?.then, 'Expected pageElement.page.element.deferredFn to be a Promise')
  assert.equal(pageElement.page?.element?.tagName, 'page-foo-bar')

  const dynamicRoute = routes.get('/dynamic/:dir/')
  assert.ok(dynamicRoute)
  assert.ok(dynamicRoute.page?.deferredHtml?.then, 'Expected dynamicRoute.page.deferredHtml to be a Promise')
  assert.equal(typeof (await dynamicRoute.page.deferredHtml), 'string')

  const dynamicRouteSubdir = routes.get('/dynamic/:dir/subdir/::')
  assert.ok(dynamicRouteSubdir)
  assert.ok(dynamicRouteSubdir.api?.deferredFn?.then, 'Expected dynamicRouteSubdir.api.deferredFn to be a Promise')
  const routeApi = await dynamicRouteSubdir.api.deferredFn
  assert.ok(routeApi.get, 'Expected routeApi to have a get method')
  const routeApiResult = await routeApi.get({ ...fakeEnhanceApiPayload, params: { proxy: 'some/string' } })
  assert.ok(routeApiResult.json)

  assert.ok(dynamicRouteSubdir.page?.element?.deferredFn?.then, 'Expected dynamicRouteSubdir.element.deferredFn to be a Promise')
  assert.equal(dynamicRouteSubdir.page?.element?.tagName, 'page-dynamic--dir-subdir---')
  const routePageElementMod = await dynamicRouteSubdir.page.element.deferredFn
  assert.ok(routePageElementMod.default, 'Expected routePageElementMod to have a get method')
  assert.equal(typeof routePageElementMod?.default, 'function')
  const routePageElement = await routePageElementMod.default(fakeEnhanceElemPayload)
  assert.equal(typeof routePageElement, 'string')

  const dynamicRouteDoc = routes.get('/dynamic/:dir/subdir/:doc')
  assert.ok(dynamicRouteDoc)
})

test('loaded elements', async () => {
  // console.log('elements', elements)

  assert.equal(Object.keys(elements).length, 6)

  const mjsElement = elements['blog-author']
  assert.equal(typeof mjsElement, 'function')
  assert.ok(mjsElement(fakeEnhanceElemPayload).indexOf(state.instanceID) > 0)
  assert.ok(mjsElement(fakeEnhanceElemPayload).indexOf(state.store.title) > 0)

  const htmlElement = elements['blog-comments']
  assert.equal(typeof htmlElement, 'function')
  assert.equal(htmlElement(fakeEnhanceElemPayload).trim(), 'No comments!')

  const multiFileElement = elements['my-element']
  assert.equal(typeof multiFileElement, 'function')
  assert.equal(multiFileElement(fakeEnhanceElemPayload), '🦄')

  const undefinedElement = elements['undefined-element']
  assert.equal(typeof undefinedElement, 'undefined')

  const componentElement = elements['my-component']
  assert.equal(typeof componentElement, 'function')
  assert.equal(componentElement(fakeEnhanceElemPayload), '👋')
})
