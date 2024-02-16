export async function get (req) {
  const { dir, doc } = req.params
  return {
    json: { dir, doc },
  }
}
