import { useEffect, useMemo, useState } from 'react'
import { useDispatch } from 'react-redux'
import { useParams, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { Swiper, SwiperSlide } from 'swiper/react'
import { FreeMode, Navigation, Thumbs } from 'swiper/modules'
import useFetch from '../hook/useFetch'
import ProductCard from '../components/ProductCard'
import BreadCrumbs from '../components/BreadCrumbs'
import ProductDetailSkeleton from './ProductDetailSkeleton'
import ProductColorSwatches from '../components/product/ProductColorSwatches'
import ProductMaterialSelector from '../components/product/ProductMaterialSelector'
import ProductDimensionsGrid from '../components/product/ProductDimensionsGrid'
import { addToCart } from '../features/cart/cartSlice'
import { DEFAULT_MATERIAL_OPTIONS } from '../constants/premiumServices'
import { getProductImageSource } from '../features/admin/utils/imageUrl'
import '../assets/styles/product-detail.scss'
import '../assets/styles/product-customizer.scss'
import 'swiper/css'
import 'swiper/css/free-mode'
import 'swiper/css/navigation'
import 'swiper/css/thumbs'

function buildMaterialOptions(product) {
  const fromProduct = product?.materials?.filter(Boolean) || []
  const defaultMat = product?.filters?.material
  const merged = defaultMat
    ? [defaultMat, ...fromProduct.filter((m) => m !== defaultMat)]
    : fromProduct
  const base = merged.length > 0 ? merged : DEFAULT_MATERIAL_OPTIONS
  return [...new Set(base)]
}

const ProductDetail = () => {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const [thumbsSwiper, setThumbsSwiper] = useState(undefined)
  const [quantity, setQuantity] = useState(1)
  const [selectedColor, setSelectedColor] = useState('')
  const [selectedMaterial, setSelectedMaterial] = useState('')
  const { id } = useParams()
  const { state: data, loading } = useFetch(`products/${id}`)
  const { state } = useFetch('products')

  const colors = useMemo(
    () => (data?.colors?.length ? data.colors : data?.filters?.color ? [data.filters.color] : []),
    [data]
  )

  const materialOptions = useMemo(() => (data ? buildMaterialOptions(data) : []), [data])

  useEffect(() => {
    if (!data) return
    setSelectedColor(colors[0] || '')
    setSelectedMaterial(materialOptions[0] || '')
  }, [data?.id, colors, materialOptions])

  const activeColor = selectedColor || colors[0] || ''

  const relatedProducts = state?.products
    ?.filter((item) => item.category === data?.category && item.id !== data?.id)
    ?.slice(0, 4)

  const cartPayload = () => ({
    ...data,
    quantity,
    selectedColor: activeColor,
    selectedMaterial,
  })

  const handleAddToCart = () => {
    dispatch(addToCart(cartPayload()))
    toast.success('Savatga qo‘shildi')
  }

  const handleBuyNow = () => {
    dispatch(addToCart(cartPayload()))
    navigate('/cart')
  }

  const imageUrls = useMemo(() => {
    if (!data) return []
    const gallery = Array.isArray(data.gallery) ? data.gallery : []
    const main = getProductImageSource(data)
    const list = [main, ...gallery.map((u) => getProductImageSource({ thumbnail: u }) || u)].filter(Boolean)
    return [...new Set(list)]
  }, [data])

  return (
    <div className="container">
      <BreadCrumbs currentName={data?.title || data?.name} />
      {loading || !data ? (
        <ProductDetailSkeleton />
      ) : (
        <div className="detail">
          <div className="wrapperr">
            <Swiper
              spaceBetween={8}
              navigation
              thumbs={{ swiper: thumbsSwiper }}
              modules={[FreeMode, Navigation, Thumbs]}
              className="mySwiper2"
            >
              {imageUrls.map((img, index) => (
                <SwiperSlide key={index}>
                  <img src={img} alt={`${data.name} ${index + 1}`} />
                </SwiperSlide>
              ))}
            </Swiper>
            <Swiper
              onSwiper={setThumbsSwiper}
              spaceBetween={2}
              slidesPerView={4}
              freeMode
              watchSlidesProgress
              modules={[FreeMode, Navigation, Thumbs]}
              className="mySwiper"
            >
              {imageUrls.map((img, index) => (
                <SwiperSlide key={index} className="active">
                  <img src={img} alt={`Thumbnail ${index + 1}`} />
                </SwiperSlide>
              ))}
            </Swiper>
          </div>
          <div className="detail-info">
            <h4 className="detail-title">{data?.title || data?.name}</h4>
            <div className="detail-rating">
              <span>{data?.stock > 0 ? 'In Stock' : 'Out of Stock'}</span>
              <p className="detail-column" />
              <span>{data?.stock} available</span>
            </div>
            <p className="detail-price">${data?.price}</p>
            <p className="detail-description">{data?.description}</p>

            <ProductColorSwatches
              colors={colors}
              selectedColor={activeColor}
              onSelect={setSelectedColor}
            />

            <ProductMaterialSelector
              options={materialOptions}
              selectedMaterial={selectedMaterial}
              onSelect={setSelectedMaterial}
            />

            <ProductDimensionsGrid dimensions={data?.dimensions} />

            <div className="detail-line" />
            <div className="detail-row">
              <div className="detail-count">
                <button
                  type="button"
                  className="detail-minus"
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                >
                  <i className="fa-solid fa-minus" />
                </button>
                <input type="text" readOnly value={quantity} aria-label="Quantity" />
                <button type="button" className="detail-plus" onClick={() => setQuantity((q) => q + 1)}>
                  <i className="fa-solid fa-plus" />
                </button>
              </div>
              <button type="button" className="detail-buying" onClick={handleBuyNow}>
                Buy Now
              </button>
              <button type="button" className="detail-wishlist" onClick={handleAddToCart}>
                <i className="fa-solid fa-cart-shopping" />
              </button>
            </div>
          </div>
        </div>
      )}

      {relatedProducts?.length > 0 && (
        <div className="detail-related">
          <div className="detail-related--row">
            <p className="detail-mark" />
            <h4 className="detail-related--title">Related Items</h4>
          </div>
          <div className="detail-products">
            {relatedProducts.map((item) => (
              <ProductCard key={item.id} product={item} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default ProductDetail
