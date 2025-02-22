export default function ({ html, state: { store } }) {
  const { from, title } = store
  console.log('     └┬─ blog/post.mjs')
  console.log('      └─ store:', store)

  return html`
    <article>
      <h2>Post ${title}</h2>
      <blog-author>${from}</blog-author>
      <p>Post content</p>
    </article>
    <blog-comments></blog-comments>
  `
}
