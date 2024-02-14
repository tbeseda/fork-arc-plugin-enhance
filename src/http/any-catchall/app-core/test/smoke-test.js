import assert from 'node:assert/strict'
import test from 'node:test'
import { createRouter, htmlSkeleton, c } from '../src/index.js'

const staticRoutes = new Map()
staticRoutes.set('/foo-bar', {
  api: {
    fn: {
      get () {
        return { json: { foo: 'bar' } }
      },

    },
  },
  page: { html: '<e-grandparent></e-grandparent>' },
})
staticRoutes.set('/foo-bar/baz', { page: { html: '<main>' } })
staticRoutes.set('/foo-bar/baz/qux', { page: { html: '<main>' } })

const staticElements = {
  'e-grandparent': ({ html }) => html`<e-parent></e-parent>`,
  'e-parent': ({ html }) => html`<e-child>hello</e-child>`,
  'e-child': ({ html }) => html`<div><slot></slot> world</div>`,
}

test('smoke test', async () => {
  const router = createRouter({
    routes: staticRoutes,
    elements: staticElements,
    state: { title: 'foobarbaz' },
    /** @type {import('@enhance/types').EnhanceHeadFn} */
    head (payload) {
      const { store } = payload
      return `<head><title>${store.title}</title></head>`
    },
    debug: true,
  })

  router.report()

  assert.ok(router.radixRouter)
  assert.equal(router.routes.size, staticRoutes.size)
  const response = await router.routeAndRender({ path: '/foo-bar' })
  assert.ok(response.html)
  assert.equal(typeof response.html, 'string')

  console.log(`
${c.pink('───')} ${c.orange('HTML')} 💀 ${c.pink('───────────────────')}
${htmlSkeleton(response.html)}
${c.pink('──────────────────────────────')}
  `)
})

test('smoke test PROMISES', async () => {})
