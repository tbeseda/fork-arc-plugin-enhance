import { join } from 'node:path'

import defaultHead from './templates/head.mjs'

let headFn
export async function findHeadFn (basePath) {
  try {
    const headModule = await import(join(basePath, 'head.mjs'))
    headFn = headModule.default
  }
  catch (err) {
    headFn = defaultHead
  }
  return headFn
}

let preflight
export async function findPreflightFn (basePath) {
  try {
    const preflightModule = await import(join(basePath, 'preflight.mjs'))
    preflight = preflightModule.default
  }
  catch (err) {
    preflight = () => ({})
  }
  return preflight
}

export function mergeTimingHeaders (headers, timers) {
  return {
    ...headers,
    [timers.key]: [
      timers.value(),
      headers?.[timers.key],
    ].join(', '),
  }
}
