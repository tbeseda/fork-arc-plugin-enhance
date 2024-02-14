const c = {
  b (str) { return `\x1b[1m${str}\x1b[22m` },
  i (str) { return `\x1b[3m${str}\x1b[23m` },
  orange (str) { return this.b(`\x1b[33m${str}\x1b[0m`) },
  pink (str) { return this.b(`\x1b[95m${str}\x1b[0m`) },
  blue (str) { return this.b(`\x1b[34m${str}\x1b[0m`) },
  dim (str) { return `\x1b[90m${str}\x1b[0m` },
}

/** @returns {((...strings: any[]) => void) & {request: (req:any) => void}} */
export function createLogger (debug = false) {
  function noop () {}
  noop.request = noop
  if (!debug) return noop

  function log (indent, ...args) {
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

  log.request = function (req) {
    const { headers, method = 'GET', path, requestContext } = req
    const line = [ 0, '✧' ]

    if (requestContext?.timeEpoch) { // Lambda specific
      line.push(`[${new Date(requestContext.timeEpoch * 1000).toLocaleString()}]`)
    }
    line.push(method)
    line.push(`${headers?.host || ''}${path}`)

    log(...line)
  }

  return log
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
