export default async function Preflight (/* { req } */) {
  return { now: new Date().toLocaleString() }
}
