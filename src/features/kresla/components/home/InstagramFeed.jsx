import { INSTAGRAM_POSTS } from '../../data/instagramPosts'
import InstagramPostCard from './InstagramPostCard'

export default function InstagramFeed() {
  return (
    <section className="py-10 md:py-14 bg-kresla-light/30">
      <div className="container mx-auto max-w-[1360px] px-4 sm:px-6 text-center">
        <h2 className="text-2xl md:text-3xl font-semibold text-kresla-dark">Bizning Instagram</h2>
        <p className="text-[#0b3c3c] font-medium mt-1 mb-8 md:mb-10">@kresla.uz</p>

        <ul className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto px-4 list-none">
          {INSTAGRAM_POSTS.map((post) => (
            <li key={post.id} className="flex justify-center">
              <div className="group w-full max-w-[320px] transition-transform duration-300 hover:scale-105">
                <InstagramPostCard post={post} />
              </div>
            </li>
          ))}
        </ul>

        <a
          href="https://instagram.com/kresla.uz"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex mt-8 md:mt-10 px-6 py-3 rounded-lg bg-[#0b3c3c] text-white font-medium hover:bg-[#0d4a4a] transition-colors"
        >
          Instagramda kuzatish
        </a>
      </div>
    </section>
  )
}
