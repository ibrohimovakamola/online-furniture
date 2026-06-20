import Blog from '../models/Blog.js'
import { getBlogFeaturedImageUrl, BLOG_SLUG_IMAGES } from '../config/blogImages.js'

const DEFAULT_BLOGS = [
  {
    slug: 'kichik-xona-divalar',
    title: 'Kichik xona uchun eng yaxshi divalar',
    category: 'Maslahat',
    author: 'Dilnoza Karimova',
    readTime: 5,
    viewCount: 1240,
    createdAt: new Date('2025-02-10'),
    image: BLOG_SLUG_IMAGES['kichik-xona-divalar'],
    content: `
      <p>Kichik xonada mebel tanlash — bu nafaqat estetika, balki funksionallik masalasi. Kresla mutaxassislari quyidagi yo‘riqnomalarni tavsiya qiladi.</p>
      <h2>1. O‘lcham</h2>
      <p>Divan uzunligi xona devori uzunligining 60–70% dan oshmasligi kerak. Burchakli modellar burchaklarni samarali ishlatadi.</p>
      <h2>2. Rang</h2>
      <p>Ochiq va neytral ranglar vizual kenglik beradi. To‘q yashil yoki ko‘k aksentlar zamonaviy ko‘rinish qo‘shadi.</p>
      <h2>3. Saqlash</h2>
      <p>Yostiqlar ostida yashirin quti yoki yig‘iladigan mehmon joyi — kichik xonalar uchun eng yaxshi yechim.</p>
    `,
  },
  {
    slug: '2025-mebel-trendlari',
    title: '2025 yil mebel trendlari',
    category: 'Trend',
    author: 'Aziz Rakhmonov',
    readTime: 7,
    viewCount: 2180,
    createdAt: new Date('2025-01-15'),
    image: BLOG_SLUG_IMAGES['2025-mebel-trendlari'],
    content: `
      <p>2025-yilda mebel bozorida tabiiylik va qulaylik ustuvor. Quyidagi trendlar Toshkent uylarida ham ko‘p uchraydi.</p>
      <h2>Tabiiy matolar</h2>
      <p>Linen, paxta va qayta ishlangan matolar talab oshmoqda.</p>
      <h2>Yumaloq forma</h2>
      <p>Divan va stullarda yumshoq burchaklar va organik chiziqlar.</p>
      <h2>Barqarorlik</h2>
      <p>FSC sertifikatlangan yog‘och va ekologik toza ranglar.</p>
    `,
  },
  {
    slug: 'mato-vs-charm',
    title: 'Mato vs charm — qaysi biri yaxshi?',
    category: "Qo'llanma",
    author: 'Malika Yusupova',
    readTime: 6,
    viewCount: 980,
    createdAt: new Date('2024-12-20'),
    image: BLOG_SLUG_IMAGES['mato-vs-charm'],
    content: `
      <p>Mato va charm — eng ko‘p so‘raladigan savollar. Har birining o‘z afzalliklari bor.</p>
      <h2>Mato</h2>
      <p>Nafas oladi, issiqda qulay. Bolali oilalar uchun ideal.</p>
      <h2>Charm</h2>
      <p>Oson tozalanadi, uzoq muddatli ko‘rinish. Mehmonxona va ofis uchun mos.</p>
    `,
  },
  {
    slug: 'zamonaviy-mehmonxona',
    title: 'Zamonaviy mehmonxona dizayni sirlari',
    category: 'Dizayn',
    author: 'Jasur Tursunov',
    readTime: 8,
    viewCount: 1560,
    createdAt: new Date('2024-11-05'),
    image: BLOG_SLUG_IMAGES['zamonaviy-mehmonxona'],
    content: `
      <p>Mehmonxona — uyingizning yuzi. Bir nechta oddiy qoidalar bilan uni zamonaviy qilishingiz mumkin.</p>
      <h2>Yoritish</h2>
      <p>Qatlamli yoritish: asosiy, aksent va dekorativ chiroqlar.</p>
      <h2>Markaziy nuqta</h2>
      <p>Divan yoki stol atrofida mebel guruhini joylashtiring.</p>
      <h2>Rang palitrasi</h2>
      <p>2–3 asosiy rang + 1 aksent — ortiqcha ranglardan qoching.</p>
    `,
  },
  {
    slug: 'yotoqxona-ranglari',
    title: 'Yotoqxona uchun eng yaxshi rang palitralari',
    category: 'Dizayn',
    author: 'Dilnoza Karimova',
    readTime: 5,
    viewCount: 870,
    createdAt: new Date('2024-10-18'),
    image: BLOG_SLUG_IMAGES['yotoqxona-ranglari'],
    content: `
      <p>Yotoqxona ranglari uyqu sifatiga ta'sir qiladi. Tinchlantiruvchi va zamonaviy palitralarni tanlang.</p>
      <h2>Soft neytral</h2>
      <p>Krem, kumush va och kulrang — universal va doimiy tanlov.</p>
      <h2>Tabiiy yashil</h2>
      <p>Tabiat bilan bog‘liqlik hissini beradi va ko‘zni dam oladi.</p>
    `,
  },
  {
    slug: 'ofis-kreslo-tanlash',
    title: 'Ofis kreslosini to‘g‘ri tanlash',
    category: 'Maslahat',
    author: 'Aziz Rakhmonov',
    readTime: 4,
    viewCount: 640,
    createdAt: new Date('2024-09-22'),
    image: BLOG_SLUG_IMAGES['ofis-kreslo-tanlash'],
    content: `
      <p>Ofis kreslosi sog‘ligingiz va unumdorligingiz uchun muhim. Quyidagi mezonlarga e'tibor bering.</p>
      <h2>Ergonomika</h2>
      <p>Bel qo‘llab-quvvatlash va sozlanadigan balandlik majburiy.</p>
      <h2>Material</h2>
      <p>Nafas oladigan to‘qima yoki yuqori sifatli mesh tanlang.</p>
    `,
  },
  {
    slug: 'ekologik-mebel',
    title: 'Ekologik mebel: nima uchun muhim?',
    category: 'Trend',
    author: 'Malika Yusupova',
    readTime: 6,
    viewCount: 720,
    createdAt: new Date('2024-08-30'),
    image: BLOG_SLUG_IMAGES['ekologik-mebel'],
    content: `
      <p>Barqaror mebel tanlash — atrof-muhit va uyingiz salomatligi uchun foydali.</p>
      <h2>Sertifikatlar</h2>
      <p>FSC va E1 formaldehit standartlariga e'tibor bering.</p>
      <h2>Uzoq muddatli foyda</h2>
      <p>Sifatli ekologik mebel ko‘proq xizmat qiladi va qayta ishlash mumkin.</p>
    `,
  },
  {
    slug: 'mebel-parvarishi',
    title: 'Mebel parvarishi bo‘yicha to‘liq qo‘llanma',
    category: "Qo'llanma",
    author: 'Jasur Tursunov',
    readTime: 9,
    viewCount: 1100,
    createdAt: new Date('2024-07-12'),
    image: BLOG_SLUG_IMAGES['mebel-parvarishi'],
    content: `
      <p>Mebelingiz uzoq yillar yangi ko‘rinishda qolishi uchun to‘g‘ri parvarish qoidalarini bilish kerak.</p>
      <h2>Mato divanlar</h2>
      <p>Haftalik changyutgich va darhol dog‘larni tozalash.</p>
      <h2>Yog‘och mebel</h2>
      <p>Namlikdan saqlang va maxsus parlatgich ishlating.</p>
    `,
  },
]

export async function seedBlogsIfEmpty() {
  const count = await Blog.countDocuments()
  if (count > 0) {
    await patchBlogImagesIfMissing()
    return { seeded: false, total: count }
  }

  await Blog.insertMany(
    DEFAULT_BLOGS.map((b) => ({
      ...b,
      status: 'published',
      isPublished: true,
      publishedAt: b.createdAt || new Date(),
    }))
  )
  console.log(`[seed] Blog posts seeded: ${DEFAULT_BLOGS.length}`)
  return { seeded: true, total: DEFAULT_BLOGS.length }
}

/** Backfill featured images on posts that were seeded before images were added */
export async function patchBlogImagesIfMissing() {
  let patched = 0

  for (const sample of DEFAULT_BLOGS) {
    const imageUrl = getBlogFeaturedImageUrl(sample)
    if (!imageUrl) continue

    const result = await Blog.updateOne(
      {
        slug: sample.slug,
        $or: [{ image: '' }, { image: null }, { image: { $exists: false } }],
      },
      { $set: { image: imageUrl, featuredImage: imageUrl } }
    )

    if (result.modifiedCount) patched += 1
  }

  if (patched > 0) {
    console.log(`[seed] Blog featured images patched: ${patched}`)
  }

  return patched
}
