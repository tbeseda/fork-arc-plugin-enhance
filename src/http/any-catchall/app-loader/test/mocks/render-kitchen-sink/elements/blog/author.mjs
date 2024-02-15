export default function ({ html, state: { instanceID, store } }) {
  console.log('     └┬─ blog/author.mjs')
  console.log('      └─ store:', store)

  return html`
    <cite id="${instanceID}">${store.title}</cite>
    <my-component></my-component>
  `
}
