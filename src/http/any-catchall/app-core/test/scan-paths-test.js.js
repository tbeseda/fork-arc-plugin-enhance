import { cwd } from 'node:process'
import { join } from 'node:path'
import assert from 'node:assert/strict'
import test from 'node:test'
import { routesFromPaths, elementsFromPaths } from '../src/scan-paths.js'

const basePath = cwd()

const apiPathParts = [ 'test', 'mocks', 'render-kitchen-sink', 'api' ]
const pagesPathParts = [ 'test', 'mocks', 'render-kitchen-sink', 'pages' ]
const elementsPathParts = [ 'test', 'mocks', 'render-kitchen-sink', 'elements' ]
const componentsPathParts = [ 'test', 'mocks', 'render-kitchen-sink', 'components' ]

test('generated routes', async () => {
  const routes = routesFromPaths({
    apiPath: join(basePath, ...apiPathParts),
    pagesPath: join(basePath, ...pagesPathParts),
  })

  // console.log(routes)

  assert.equal(routes.size, 4)

  const apiOnly = routes.get('/api-only')
  assert.equal(apiOnly?.api?.file?.mjs, 'api-only.mjs')
  assert.ok(!apiOnly?.page)
  const pageOnly = routes.get('/page-only')
  assert.equal(pageOnly?.page?.file?.html, 'page-only.html')
  assert.ok(!pageOnly?.api)
  const fooDashBar = routes.get('/foo-bar')
  assert.equal(fooDashBar?.api?.file?.mjs, 'foo-bar.mjs')
  assert.equal(fooDashBar?.page?.file?.html, 'foo-bar.html')
  const fooSlashBar = routes.get('/foo/bar')
  assert.equal(fooSlashBar?.api?.file?.mjs, 'foo/bar.mjs')
  assert.equal(fooSlashBar?.page?.file?.html, 'foo/bar.html')
})

test('generated elements', async () => {
  const elements = elementsFromPaths({
    elementsPath: join(basePath, ...elementsPathParts),
    componentsPath: join(basePath, ...componentsPathParts),
  })

  // console.log(elements)

  assert.equal(elements.size, 6)

  const myElement = elements.get('my-element')
  assert.equal(myElement?.file?.mjs, 'my-element.mjs')
  assert.equal(myElement?.file?.html, 'my-element.html')
  const undefinedElement = elements.get('undefined-element')
  assert.equal(undefinedElement?.file?.mjs, 'undefined-element.mjs')
  assert.ok(!undefinedElement?.file?.html)
  const blogAuthor = elements.get('blog-author')
  assert.equal(blogAuthor?.file?.mjs, 'blog/author.mjs')
  assert.ok(!blogAuthor?.file?.html)
  const blogComments = elements.get('blog-comments')
  assert.equal(blogComments?.file?.html, 'blog/comments.html')
  assert.ok(!blogComments?.file?.mjs)
  const blogPost = elements.get('blog-post')
  assert.equal(blogPost?.file?.mjs, 'blog/post.mjs')
  assert.ok(!blogPost?.file?.html)
  const myComponent = elements.get('my-component')
  assert.equal(myComponent?.file?.component, 'my-component.mjs')
  assert.ok(!myComponent?.file?.html)
  assert.ok(!myComponent?.file?.mjs)
})
