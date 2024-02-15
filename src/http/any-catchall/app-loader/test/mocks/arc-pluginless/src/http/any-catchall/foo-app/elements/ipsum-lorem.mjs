export default function IpsumLorem({ html, state: {store} }) {
  return html`
    <p>Ipsum lorem dolor sit amet <strong>now:</strong> <code>${store.now}</code></p>
  `
}
