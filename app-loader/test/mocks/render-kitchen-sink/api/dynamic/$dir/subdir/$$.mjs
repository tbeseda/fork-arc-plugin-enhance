export async function get ({ params }) {
  const { proxy } = params
  const pathSegments = proxy.split('/')
  return {
    json: { pathSegments },
  }
}
