import { cwd } from 'node:process'
import { join } from 'node:path'
import assert from 'node:assert/strict'
import test from 'node:test'
import { routesFromPaths, elementsFromPaths } from '../src/scan-paths.js'

const basePath = cwd()

const kitchenPathParts = [ 'test', 'mocks', 'render-kitchen-sink' ]

test('generated routes', async () => {
  const apiPathParts = [ ...kitchenPathParts, 'api' ]
  const pagesPathParts = [ ...kitchenPathParts, 'pages' ]
  const routes = routesFromPaths({
    apiPath: join(basePath, ...apiPathParts),
    pagesPath: join(basePath, ...pagesPathParts),
  })

  // console.log(routes)

  assert.equal(routes.size, 4)

  const apiOnly = routes.get('/api-only')
  assert.equal(apiOnly?.api?.mjs, 'api-only.mjs')
  assert.ok(!apiOnly?.page)
  const pageOnly = routes.get('/page-only')
  assert.equal(pageOnly?.page?.html, 'page-only.html')
  assert.ok(!pageOnly?.api)
  const fooDashBar = routes.get('/foo-bar')
  assert.equal(fooDashBar?.api?.mjs, 'foo-bar.mjs')
  assert.equal(fooDashBar?.page?.html, 'foo-bar.html')
  const fooSlashBar = routes.get('/foo/bar')
  assert.equal(fooSlashBar?.api?.mjs, 'foo/bar.mjs')
  assert.equal(fooSlashBar?.page?.html, 'foo/bar.html')
})

test('generated elements', async () => {
  const elementsPathParts = [ ...kitchenPathParts, 'elements' ]
  const componentsPathParts = [ ...kitchenPathParts, 'components' ]
  const elements = elementsFromPaths({
    elementsPath: join(basePath, ...elementsPathParts),
    componentsPath: join(basePath, ...componentsPathParts),
  })

  assert.equal(elements.size, 6)

  const myElement = elements.get('my-element')
  assert.equal(myElement?.mjs, 'my-element.mjs')
  assert.equal(myElement?.html, 'my-element.html')
  const undefinedElement = elements.get('undefined-element')
  assert.equal(undefinedElement?.mjs, 'undefined-element.mjs')
  assert.ok(!undefinedElement?.html)
  const blogAuthor = elements.get('blog-author')
  assert.equal(blogAuthor?.mjs, 'blog/author.mjs')
  assert.ok(!blogAuthor?.html)
  const blogComments = elements.get('blog-comments')
  assert.equal(blogComments?.html, 'blog/comments.html')
  assert.ok(!blogComments?.mjs)
  const blogPost = elements.get('blog-post')
  assert.equal(blogPost?.mjs, 'blog/post.mjs')
  assert.ok(!blogPost?.html)
  const myComponent = elements.get('my-component')
  assert.equal(myComponent?.component, 'my-component.mjs')
  assert.ok(!myComponent?.html)
  assert.ok(!myComponent?.mjs)
})
