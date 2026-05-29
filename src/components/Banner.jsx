import { Link } from 'react-router-dom'
import { useSelector } from 'react-redux'
import Skeleton from 'react-loading-skeleton'
import 'react-loading-skeleton/dist/skeleton.css'
import '../assets/styles/banner.scss'
import BannerImg from '../assets/images/c48e7ea910d9f2525e8ed8c5480bd047-removebg-preview.png'
import { selectCatalog, selectStoreCategories } from '../features/catalog/catalogSlice'
import { selectSettings } from '../features/settings/settingsSlice'

function Banner() {
  const { loading, error } = useSelector(selectCatalog)
  const categories = useSelector(selectStoreCategories)
  const settings = useSelector(selectSettings)
  const banner = settings?.banner

  const getCategoryPath = (category) => {
    if (category?.id) return `/category/${category.id}`
    if (category?.slug) return `/products?category=${category.slug}`
    return '/products'
  }

  const heroImage = banner?.backgroundImageUrl || BannerImg
  const heroStyle = banner?.backgroundImageUrl
    ? { backgroundImage: `url(${banner.backgroundImageUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' }
    : undefined

  return (
    <div className="container">
      <div className="banner">
        <nav className="banner-links" aria-label="Furniture categories">
          {loading ? (
            <div className="banner-links--loading">
              {Array.from({ length: 8 }).map((_, i) => (
                <Skeleton key={i} height={24} className="banner-link-skeleton" />
              ))}
            </div>
          ) : categories.length === 0 ? (
            <p className="banner-links-hint text-sm text-[#545252] py-2">
              {error ? 'Categories unavailable — check backend connection.' : 'No categories yet.'}
            </p>
          ) : (
            categories.map((category) => (
              <Link
                key={category.id || category.slug}
                to={getCategoryPath(category)}
                className="banner-link"
              >
                {category.name}
                <i className="fa-solid fa-angle-right" aria-hidden />
              </Link>
            ))
          )}
          {!loading && error && categories.length > 0 && (
            <p className="banner-links-hint text-xs text-[#545252] mt-2">Some categories may be unavailable</p>
          )}
        </nav>

        <div className="banner-wrapper" style={heroStyle}>
          <div className="banner-info">
            <p className="banner-text">
              <i className="fa-solid fa-couch" />
              {banner?.eyebrow || 'Furniture for living room'}
            </p>
            <h2 className="banner-title">
              {banner?.title || `Yangi kolleksiya – ${banner?.discountPercent ?? 10}% gacha chegirma`}
            </h2>
            <Link to={banner?.ctaLink || '/products'} className="banner-route">
              {banner?.ctaText || 'Buyurtma berish'}
              <i className="fa-solid fa-arrow-right" />
            </Link>
          </div>
          {!banner?.backgroundImageUrl && (
            <div className="banner-img">
              <img src={heroImage} alt="Furniture collection" />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default Banner
