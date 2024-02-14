import { c } from './util.js'

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

  return function report (out = console.log) {
    out(`
${c.blue('⏺───')} ${c.b(c.orange('EnhanceAppCore Report'))}
  ${c.blue('○─┬─')} #elements ${c.dim(`(${elements.size})`)}
${createTree([ ...elements.keys() ].map(e => `<${e}>`))}
  ${c.blue('●─┬─')} #router ${c.dim(`(${routes.size})`)}
${createTree([ ...routes.keys() ].map(r => `/${r}`))}
    `)
  }
}
