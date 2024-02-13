export function createElementName (str) {
  return str
    .toLowerCase()
    .replace(/\.[^/.]+$/, '')
    .replace(/\//g, '-')
}

export const c = {
  b (str) { return `\x1b[1m${str}\x1b[22m` },
  i (str) { return `\x1b[3m${str}\x1b[23m` },
  orange (str) { return this.b(`\x1b[33m${str}\x1b[0m`) },
  magenta (str) { return this.b(`\x1b[35m${str}\x1b[0m`) },
  pink (str) { return this.b(`\x1b[95m${str}\x1b[0m`) },
  blue (str) { return this.b(`\x1b[34m${str}\x1b[0m`) },
  dim (str) { return `\x1b[90m${str}\x1b[0m` },
}

export function htmlSkeleton (htmlString) {
  htmlString = htmlString.replace(/\s{2,}/g, ' ')

  const tagStack = []
  let result = ''

  for (let i = 0; i < htmlString.length; i++) {
    const char = htmlString[i]

    if (char === '<') {
      // TODO: handle comments
      let tag = ''

      while (htmlString[i] !== '>') {
        tag += htmlString[i]
        i++
      }

      tag += '>'

      if (!tag.includes('/')) {
        tagStack.push(tag)
        result += '\n' + '  '.repeat(tagStack.length - 1) + tag
      } else {
        tagStack.pop()
      }
    }
  }

  return result.trim()
}
