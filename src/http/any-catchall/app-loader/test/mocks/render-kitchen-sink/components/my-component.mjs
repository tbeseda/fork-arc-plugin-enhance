export default {
  render ({ html, state: { store } }) {
    console.log('     └┬─ my-component.mjs render()')
    console.log('      ├─ typeof html:', typeof html)
    console.log('      └─ store:', store)
    return '👋'
  },
}
