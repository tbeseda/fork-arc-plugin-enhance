export function createElementName (str) {
  return str
    .toLowerCase()
    .replace(/\$/g, '-')
    .replace(/\.[^/.]+$/, '')
    .replace(/\//g, '-')
}
