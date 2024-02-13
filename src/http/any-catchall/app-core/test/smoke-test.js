import { cwd } from 'node:process'
import assert from 'node:assert/strict'
import test from 'node:test'
import { createRouter, htmlSkeleton, c } from '../src/index.js'

test('smoke test', async () => {
  const { elements, routeAndRender, routes, report } = createRouter({
    basePath: cwd(),
    apiPath: 'test/mocks/render-kitchen-sink/api',
    pagesPath: 'test/mocks/render-kitchen-sink/pages',
    elementsPath: 'test/mocks/render-kitchen-sink/elements',
    componentsPath: 'test/mocks/render-kitchen-sink/components',
    state: { title: 'foobarbaz' },
    /** @type {import('@enhance/types').EnhanceHeadFn} */
    head (payload) {
      const { store } = payload
      console.log('     └┬─ head()')
      console.log('      └─ incoming title:', store.title)
      return `<head><title>${store.title}</title></head>`
    },
    debug: true,
  })

  assert.equal(routes.size, 4)
  assert.equal(elements.size, 6)
  const response = await routeAndRender({ path: '/foo-bar' })
  assert.ok(response.html)
  assert.equal(typeof response.html, 'string')

  report()

  console.log(`
${c.pink('───')} ${c.orange('HTML')} 💀 ${c.pink('───────────────────')}
${htmlSkeleton(response.html)}
${c.pink('──────────────────────────────')}
  `)
})
