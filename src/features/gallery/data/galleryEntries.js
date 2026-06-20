import before1 from '../../../assets/images/22f60e7847f94c228f2562ed6a700b33.jpg'
import after1 from '../../../assets/images/reg1.jpg'
import before2 from '../../../assets/images/gem1.jpg'
import after2 from '../../../assets/images/reg2.jpg'
import before3 from '../../../assets/images/9610589cee1ac89824118a709ddbfadb.jpg'
import after3 from '../../../assets/images/photo_2026-03-26_21-16-00.jpg'
import before4 from '../../../assets/images/0e150601e0577729286122f2e1f6ba81.jpg'
import after4 from '../../../assets/images/reg3.jpg'
import before5 from '../../../assets/images/f35c6c42c39c8e32980d125c1490f005.jpg'
import after5 from '../../../assets/images/photo_2026-02-14_22-23-52.jpg'
import before6 from '../../../assets/images/17451773129b00a1462e9bee5ea2f9db.jpg'
import after6 from '../../../assets/images/reg6.jpg'

/**
 * Gallery entry shape — ready for API mapping later.
 * @typedef {Object} GalleryEntry
 * @property {number|string} id
 * @property {string} customerName
 * @property {string} city
 * @property {string} productName
 * @property {string} [productId] - route param for /products/:id
 * @property {string} [beforeImage]
 * @property {string} [afterImage]
 * @property {string} [beforeColor] - fallback when images unavailable
 * @property {string} [afterColor]
 */

/** @type {GalleryEntry[]} */
export const GALLERY_ENTRIES = [
  {
    id: 1,
    customerName: 'Dilnoza R.',
    city: 'Toshkent',
    productName: 'Milano divan',
    productId: '',
    beforeImage: before1,
    afterImage: after1,
  },
  {
    id: 2,
    customerName: 'Jasur K.',
    city: 'Samarqand',
    productName: "Oslo stol to'plami",
    productId: '',
    beforeImage: before2,
    afterImage: after2,
  },
  {
    id: 3,
    customerName: 'Malika S.',
    city: 'Toshkent',
    productName: 'Nordik yotoq',
    productId: '',
    beforeImage: before3,
    afterImage: after3,
  },
  {
    id: 4,
    customerName: 'Bobur T.',
    city: "Farg'ona",
    productName: 'Urban shkaf',
    productId: '',
    beforeImage: before4,
    afterImage: after4,
  },
  {
    id: 5,
    customerName: 'Sevara M.',
    city: 'Toshkent',
    productName: 'Comfort burchakli',
    productId: '',
    beforeImage: before5,
    afterImage: after5,
  },
  {
    id: 6,
    customerName: 'Otabek H.',
    city: 'Namangan',
    productName: 'Classic divan',
    productId: '',
    beforeImage: before6,
    afterImage: after6,
  },
]
