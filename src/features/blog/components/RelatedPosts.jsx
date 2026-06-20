import BlogCard from '../../../components/BlogCard'

export default function RelatedPosts({ posts, title = 'O‘xshash maqolalar' }) {
  if (!posts?.length) return null

  return (
    <section className="blog-related" aria-labelledby="related-posts-title">
      <h2 id="related-posts-title" className="blog-related__title">
        {title}
      </h2>
      <div className="blog-related__grid">
        {posts.map((post) => (
          <BlogCard key={post.slug} blog={post} variant="compact" />
        ))}
      </div>
    </section>
  )
}
