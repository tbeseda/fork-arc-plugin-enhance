export function createElementName (str) {
  return str
    .toLowerCase()
    .replace(/\$/g, '-')      // replace $ with -
    .replace(/\.[^/.]+$/, '') // remove file extension
    .replace(/\//g, '-')      // replace / with -
}
