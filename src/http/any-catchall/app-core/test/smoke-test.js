import assert from 'node:assert/strict'
import test from 'node:test'
import { dirname, join } from 'node:path'
import { readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'

import { createRouter } from '../src/index.js'

const PRINT = true
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
    debug: true, // enabled to complete code coverage
  })

  router.report(router.log)

  assert.ok(router)
  assert.ok(router.timers)
  assert.ok(router.radixRouter)
  assert.equal(typeof router.render, 'function')
  assert.equal(typeof router.routeAndRender, 'function')
  assert.equal(typeof router.report, 'function')
  assert.equal(typeof router.log, 'function')
  assert.equal(router.routes.size, vanillaRoutes.size)
  assert.equal(Object.keys(router.elements).length, Object.keys(nestedElements).length)

  const vanillaResponse = await router.routeAndRender({
    path: '/vanilla',
    requestContext: { timeEpoch: Date.now() / 1000 },
  })
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

  router.report(router.log)

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
  if (!PRINT) return
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

export function htmlSkeleton (htmlString) {
  htmlString = htmlString.replace(/\s{2,}/g, ' ')

  const tagStack = []
  let result = ''

  for (let i = 0; i < htmlString.length; i++) {
    const char = htmlString[i]

    if (char === '<') {
      // TODO: handle comments
      let tag = ''

      while (htmlString[i] !== '>') {
        tag += htmlString[i]
        i++
      }

      tag += '>'

      if (!tag.includes('/')) {
        tagStack.push(tag)
        result += '\n' + '  '.repeat(tagStack.length - 1) + tag
      }
      else {
        tagStack.pop()
      }
    }
  }

  return result.trim()
}

export const c = {
  b (str) { return `\x1b[1m${str}\x1b[22m` },
  i (str) { return `\x1b[3m${str}\x1b[23m` },
  orange (str) { return this.b(`\x1b[33m${str}\x1b[0m`) },
  magenta (str) { return this.b(`\x1b[35m${str}\x1b[0m`) },
  pink (str) { return this.b(`\x1b[95m${str}\x1b[0m`) },
  blue (str) { return this.b(`\x1b[34m${str}\x1b[0m`) },
  dim (str) { return `\x1b[90m${str}\x1b[0m` },
}
