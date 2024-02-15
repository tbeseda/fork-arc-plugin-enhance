import path from 'path'
import test from 'tape'
import url from 'url'
import { findPreflightFn } from '../src/http/any-catchall/util.mjs'
const __dirname = path.dirname(url.fileURLToPath(import.meta.url))

test('findPreflightFn', async t => {
  t.plan(1)
  const basePath = path.join(__dirname, 'mock-preflight', 'app')
  const expected = {
    pageTitle: 'About',
    account: {
      username: 'bobsyouruncle',
      id: '23jk24h24'
    }
  }
  const preflight = await findPreflightFn({ basePath })
  t.deepEqual(expected, preflight({ req: { path: '/about' } }), 'Got preflight')
})

test('missing preflight', async t => {
  t.plan(1)
  const basePath = path.join(__dirname, 'mock-app', 'app')
  const preflight = await findPreflightFn({ basePath })
  t.notok(preflight, 'Missing preflight is OK')
})

test('preflight with missing module import inside it should throw', async t => {
  t.plan(1)
  const basePath = path.join(__dirname, 'mock-preflight', 'app', 'bad-preflight')
  try {
    await findPreflightFn({ basePath })
    t.fail('Missing module import should throw')
  }
  catch (error) {
    t.ok(error, 'Missing module import throws')
  }
})
