import { join } from 'node:path'

import defaultHead from './templates/head.mjs'

let headFn
export async function findHeadFn (basePath) {
  try {
    // TODO: check if exists and throw if error importing
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
    // TODO: check if exists and throw if error importing
    const preflightModule = await import(join(basePath, 'preflight.mjs'))
    preflight = preflightModule.default
  }
  catch (err) {
    preflight = () => ({})
  }
  return preflight
}

export function mergeTimingHeaders (headers, timers) {
  if (timers.timers().length === 0) return headers

  const updatedHeaders = {
    ...headers,
    [timers.key]: [
      timers.value(),
      headers?.[timers.key],
    ].join(','),
  }

  timers.reset()

  return updatedHeaders
}
