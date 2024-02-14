/** @type {import('@enhance/types').EnhanceElemFn} */
export default function ({ html, state: { instanceID, store } }) {
  console.log('     └┬─ blog/author.mjs')
  console.log('      └─ store:', store)

  return html`
    <cite id="${instanceID}">tbeseda</cite>
    <my-component></my-component>
  `
}
