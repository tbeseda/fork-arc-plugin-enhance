export const c = {
  b (str) { return `\x1b[1m${str}\x1b[22m` },
  i (str) { return `\x1b[3m${str}\x1b[23m` },
  orange (str) { return this.b(`\x1b[33m${str}\x1b[0m`) },
  magenta (str) { return this.b(`\x1b[35m${str}\x1b[0m`) },
  pink (str) { return this.b(`\x1b[95m${str}\x1b[0m`) },
  blue (str) { return this.b(`\x1b[34m${str}\x1b[0m`) },
  dim (str) { return `\x1b[90m${str}\x1b[0m` },
}

export function createLogger (debug = false) {
  return debug
    ? function log (indent, ...args) {
      if (!debug) return

      if (typeof indent === 'string') {
        args.unshift(indent)
        indent = 2
      }

      if (indent > 0) args.unshift(' '.repeat(indent))

      console.log(
        ...args
          .map(a => typeof a === 'string' && a.length > 0 ? c.dim(a) : a),
      )
    }
    : () => {}
}

export function createReport ({ elements, routes }) {
  function createTree (list = []) {
    return list
      .map((s, i) =>
        `    ${c.blue(i === list.length - 1 ? '└──' : '├──')} ${s}`,
      )
      .join('\n')
  }

  const elementNames = Object.keys(elements)

  return function report (out = console.log) {
    out(`
${c.blue('⏺───')} ${c.b(c.orange('EnhanceAppCore Report'))}
  ${c.blue('○─┬─')} #elements ${c.dim(`(${elementNames.length})`)}
${createTree(elementNames.map(e => `<${e}>`))}
  ${c.blue('●─┬─')} #router ${c.dim(`(${routes.size})`)}
${createTree([ ...routes.keys() ])}
    `)
  }
}

/**
 * @param {Function} out
 * @param {Record<string, any>} req
 */
export function logRequest (out = console.log, req) {
  const { headers, method = 'GET', path, requestContext } = req
  const line = [ 0, '✧' ]

  if (requestContext?.timeEpoch) { // Lambda specific
    line.push(`[${new Date(requestContext.timeEpoch * 1000).toLocaleString()}]`)
  }
  line.push(method)
  line.push(`${headers?.host || ''}${path}`)

  out(...line)
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
      }
      else {
        tagStack.pop()
      }
    }
  }

  return result.trim()
}
