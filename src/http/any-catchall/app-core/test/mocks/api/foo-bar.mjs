/**
 * @param {import('@enhance/types').EnhanceApiReq} req
 * @param {Record<string, any>} store
 */
export async function get (req, store) {
  const { path, params } = req
  const { state } = store
  const json = { from: 'theApi', ...state }

  const _ = ' '.repeat(6)
  console.log(_, '└┬─ foo-bar.mjs get()')
  console.log(_, ' ├─ req.path:', path)
  console.log(_, ' ├─ req.params:', params)
  console.log(_, ' ├─ got state.title:', state.title)
  console.log(_, ' └─ returning json:', json)

  return {
    json,
  }
}
