import FAQ from '../models/FAQ.js'

const SEED_FAQS = [
  {
    category: 'shipping',
    order: 0,
    question: 'Toshkent bo‘ylab yetkazib berish qancha vaqt oladi?',
    answer: 'Shahar markazida 1 kun, tumanlarda 2–3 kun.',
  },
  {
    category: 'shipping',
    order: 1,
    question: 'Viloyatlarga yetkazib berasizmi?',
    answer: 'Ha, O‘zbekiston bo‘ylab hamkor logistika orqali yetkazamiz.',
  },
  {
    category: 'shipping',
    order: 2,
    question: 'Yetkazib berish narxi qanday hisoblanadi?',
    answer: 'Toshkent markazi — bepul, tumanlar — +15 000 so‘m.',
  },
  {
    category: 'shipping',
    order: 3,
    question: 'Mahsulotni qayerga olib kelasiz?',
    answer: 'Xonaga kirgizib, qadoqdan chiqarib beramiz (ixtiyoriy xizmat).',
  },
  {
    category: 'shipping',
    order: 4,
    question: 'Yetkazib berish vaqtini tanlash mumkinmi?',
    answer: 'Ha, buyurtma berishda qulay kun va vaqtni belgilashingiz mumkin.',
  },
  {
    category: 'payment',
    order: 0,
    question: 'Qanday to‘lov usullari mavjud?',
    answer: 'Naqd, Payme, Click, Uzum Bank va bo‘lib to‘lash.',
  },
  {
    category: 'payment',
    order: 1,
    question: 'Bo‘lib to‘lash shartlari qanday?',
    answer: '3, 6 yoki 12 oy — foiz stavkasi tanlovingizga bog‘liq.',
  },
  {
    category: 'payment',
    order: 2,
    question: 'Karta orqali onlayn to‘lash xavfsizmi?',
    answer: 'Ha, barcha to‘lovlar shifrlangan tizim orqali o‘tadi.',
  },
  {
    category: 'payment',
    order: 3,
    question: 'Hisob-faktura (invoice) beriladimi?',
    answer: 'Ha, yuridik shaxslar va dizaynerlar uchun invoice mavjud.',
  },
  {
    category: 'general',
    order: 0,
    question: 'Mahsulotlar qayerda ishlab chiqariladi?',
    answer: 'Mahalliy hamkor zavodlar va import kolleksiyalar.',
  },
  {
    category: 'general',
    order: 1,
    question: 'Rang va o‘lchamni o‘zgartirish mumkinmi?',
    answer: 'Ko‘p modellarda mato va rang tanlovi mavjud.',
  },
  {
    category: 'general',
    order: 2,
    question: 'Namuna ko‘rish mumkinmi?',
    answer: 'Toshkent showroomda namunalar mavjud.',
  },
  {
    category: 'general',
    order: 3,
    question: 'Qanday material ishlatiladi?',
    answer: 'Yog‘och, MDF, mato, charm — har mahsulot kartasida ko‘rsatilgan.',
  },
  {
    category: 'general',
    order: 4,
    question: 'O‘rnatish xizmati bormi?',
    answer: 'Divan va yig‘iladigan mebel uchun o‘rnatish ixtiyoriy.',
  },
  {
    category: 'returns',
    order: 0,
    question: 'Qaytarish shartlari qanday?',
    answer: '14 kun ichida ishlatilmagan holatda qaytarish mumkin.',
  },
  {
    category: 'returns',
    order: 1,
    question: 'Kafolat muddati qancha?',
    answer: 'Standart 12 oy, premium kolleksiyada 24 oy.',
  },
  {
    category: 'returns',
    order: 2,
    question: 'Kafolat nimalarni qamrab oladi?',
    answer: 'Ishlab chiqarish nuqsonlari va konstruksiya zaifliklari.',
  },
  {
    category: 'returns',
    order: 3,
    question: 'Ta\'mirlash qancha vaqt oladi?',
    answer: 'Odatda 5–10 ish kuni ichida.',
  },
]

export async function seedFaqIfEmpty() {
  if (process.env.SEED_FAQ === 'false') return

  const count = await FAQ.countDocuments()
  if (count > 0) return

  await FAQ.insertMany(SEED_FAQS)
  console.log(`[seed] Inserted ${SEED_FAQS.length} FAQ entries`)
}
