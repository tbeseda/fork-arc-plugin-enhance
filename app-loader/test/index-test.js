import assert from 'node:assert/strict'
import test from 'node:test'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

import load from '../src/index.js'

const here = dirname(fileURLToPath(import.meta.url))

test('smoke test', () => {
  assert.equal(typeof load, 'function')
})

test('required params', async () => {
  try {
    // @ts-ignore
    await load({ debug: true })
    assert.fail('Expected to throw')
  }
  catch (err) {
    assert.ok(err.message)
  }
})

const basePath = join(here, 'mocks', 'render-kitchen-sink')
const config = await load({ basePath, debug: true })
const { routes, elements, timers } = config

test('load return value', () => {
  assert.ok(config)
  assert.ok(timers)
  assert.ok(routes)
  assert.ok(elements)
})

test('loaded routes', () => {
  assert.equal(routes.size, 4)

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
})

test('loaded elements', async () => {
  assert.equal(Object.keys(elements).length, 6)

  function html (strings, ...values) {
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
  const enhanceElementPayload = { state, html }

  const mjsElement = elements['blog-author']
  assert.equal(typeof mjsElement, 'function')
  assert.ok(mjsElement(enhanceElementPayload).indexOf(state.instanceID) > 0)
  assert.ok(mjsElement(enhanceElementPayload).indexOf(state.store.title) > 0)

  const htmlElement = elements['blog-comments']
  assert.equal(typeof htmlElement, 'function')
  assert.equal(htmlElement(enhanceElementPayload).trim(), 'No comments!')

  const multiFileElement = elements['my-element']
  assert.equal(typeof multiFileElement, 'function')
  assert.equal(multiFileElement(enhanceElementPayload), '🦄')

  const undefinedElement = elements['undefined-element']
  assert.equal(typeof undefinedElement, 'undefined')

  const componentElement = elements['my-component']
  assert.equal(typeof componentElement, 'function')
  assert.equal(componentElement(enhanceElementPayload), '👋')
})
