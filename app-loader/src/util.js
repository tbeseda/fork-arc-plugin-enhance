export function createElementName (str) {
  return str
    .toLowerCase()
    .replace(/\.[^/.]+$/, '')
    .replace(/\//g, '-')
}
