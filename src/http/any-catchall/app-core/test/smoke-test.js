import assert from 'node:assert/strict'
import test from 'node:test'
import { dirname, join } from 'node:path'
import { readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'

import { createRouter, htmlSkeleton, c } from '../src/index.js'

const here = dirname(fileURLToPath(import.meta.url))

const state = { title: 'foobarbaz' }

function head (payload) {
  const { store } = payload
  return `<head><title>${store.title}</title></head>`
}

const nestedElements = {
  'e-grandparent': ({ html }) => html`<e-parent></e-parent>`,
  'e-parent': ({ html }) => html`<e-child>hello</e-child>`,
  'e-child': ({ html }) => html`<div><slot></slot> world</div>`,
}

const vanillaRoutes = new Map()
vanillaRoutes.set('/vanilla', {
  api: {
    fn: {
      get () {
        return { json: { foo: 'bar' } }
      },

    },
  },
  page: { html: '<e-grandparent></e-grandparent>' },
})
vanillaRoutes.set('/vanilla/html', {
  page: { html: '<e-grandparent></e-grandparent>' }
})
vanillaRoutes.set('/vanilla/page-element', {
  page: {
    element: {
      fn: ({ html }) => html`<e-grandparent></e-grandparent>`,
    }
  }
})

test('smoke test VANILLA', async () => {
  const router = createRouter({
    routes: vanillaRoutes,
    elements: nestedElements,
    state,
    head,
    // debug: true,
  })

  router.report()

  assert.ok(router)
  assert.ok(router.timers)
  assert.ok(router.radixRouter)
  assert.equal(typeof router.render, 'function')
  assert.equal(typeof router.routeAndRender, 'function')
  assert.equal(typeof router.report, 'function')
  assert.equal(typeof router.log, 'function')
  assert.equal(router.routes.size, vanillaRoutes.size)
  assert.equal(Object.keys(router.elements).length, Object.keys(nestedElements).length)

  const vanillaResponse = await router.routeAndRender({ path: '/vanilla' })
  assert.ok(vanillaResponse.html)
  assert.equal(typeof vanillaResponse.html, 'string')

  printHtml('/vanilla', vanillaResponse.html)

  const vanillaHtmlResponse = await router.routeAndRender({ path: '/vanilla/html' })
  assert.ok(vanillaHtmlResponse.html)
  assert.equal(typeof vanillaHtmlResponse.html, 'string')

  printHtml('/vanilla/html', vanillaHtmlResponse.html)

  const vanillaPageElementResponse = await router.routeAndRender({ path: '/vanilla/page-element' })
  assert.ok(vanillaPageElementResponse.html)
  assert.equal(typeof vanillaPageElementResponse.html, 'string')

  printHtml('/vanilla/page-element', vanillaPageElementResponse.html)
})

const deferredRoutes = new Map()
deferredRoutes.set('/deferred', {
  api: {
    deferredFn: import('./mocks/api/foo-bar.mjs'),
  },
  page: {
    deferredHtml: readFile(join(here, 'mocks/pages/foo-bar.html')),
  },
})
deferredRoutes.set('/deferred/page-element', {
  api: {
    deferredFn: import('./mocks/api/foo-bar.mjs'),
  },
  page: {
    element: {
      tagName: 'page-foo-bar',
      deferredFn: import('./mocks/pages/foo-bar.mjs'),
    },
  },
})

test('smoke test DEFERRED', async () => {
  const router = createRouter({
    routes: deferredRoutes,
    elements: nestedElements,
    state,
    head,
    // debug: true,
  })

  // router.report()

  const deferredResponse = await router.routeAndRender({ path: '/deferred' })
  assert.ok(deferredResponse.html)
  assert.equal(typeof deferredResponse.html, 'string')

  printHtml('/deferred', deferredResponse.html)

  const deferredPageElementResponse = await router.routeAndRender({ path: '/deferred/page-element' })
  assert.ok(deferredPageElementResponse.html)
  assert.equal(typeof deferredPageElementResponse.html, 'string')

  printHtml('/deferred/page-element', deferredPageElementResponse.html)
})

function printHtml (title, htmlString) {
  const skeleton = htmlSkeleton(htmlString)
  const longestLine = skeleton.split('\n').reduce((a, b) => a.length > b.length ? a : b)
  const titleLine = `${c.pink(('┌─'))} ${c.orange(title)} 🩻 ${c.pink('─○')}`
  const lastLine = c.pink(`└${'─'.repeat(longestLine.length + 3)}●`)

  console.log(`
${titleLine}
${skeleton.split('\n').map(line => `${c.pink('│')} ${line}`).join('\n')}
${lastLine}
  `)
}
