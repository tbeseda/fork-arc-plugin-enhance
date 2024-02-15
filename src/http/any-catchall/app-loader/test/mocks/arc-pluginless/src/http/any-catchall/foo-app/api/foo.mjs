export async function get (req, { state }) {
  return { json: { ...state, foo: 'bar' } }
}
