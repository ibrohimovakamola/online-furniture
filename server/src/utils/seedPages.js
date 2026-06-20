import Page from '../models/Page.js'

const SEED_PAGES = [
  {
    slug: 'privacy-policy',
    title: 'Maxfiylik siyosati',
    description: 'Mebel Sotish maxfiylik siyosati — shaxsiy maʼlumotlaringiz qanday toplanishi va himoyalanishi.',
    keywords: ['maxfiylik', 'privacy', 'mebel', 'mebelsotish'],
    content: `
      <h2>Maʼlumot toplash</h2>
      <p>Buyurtma berishda ism, telefon, email va yetkazib berish manzilini to'playmiz. To'lov ma'lumotlari to'g'ridan-to'g'ri Payme yoki Click orqali qayta ishlanadi — biz karta raqamlarini saqlamaymiz.</p>
      <h2>Maʼlumotlardan foydalanish</h2>
      <ul>
        <li>Buyurtmalarni bajarish va yetkazib berish</li>
        <li>Mijozlarga xizmat ko'rsatish va qo'llab-quvvatlash</li>
        <li>Marketing xabarlari (faqat rozilik bilan)</li>
      </ul>
      <h2>Maʼlumotlarni saqlash</h2>
      <p>Shaxsiy ma'lumotlar xavfsiz serverlarda saqlanadi va uchinchi shaxslarga sotilmaydi.</p>
      <h2>Huquqlaringiz</h2>
      <p>Ma'lumotlaringizni ko'rish, tuzatish yoki o'chirishni so'rashingiz mumkin — <a href="/contact">bog'lanish</a> sahifasi orqali.</p>
      <p><em>Oxirgi yangilanish: 2026</em></p>
    `.trim(),
  },
  {
    slug: 'terms-of-service',
    title: 'Foydalanish shartlari',
    description: 'Mebel Sotish veb-saytidan foydalanish shartlari va foydalanuvchi huquqlari.',
    keywords: ['shartlar', 'terms', 'foydalanish', 'mebelsotish'],
    content: `
      <h2>Xizmatdan foydalanish</h2>
      <p>Saytdan foydalanish orqali ushbu shartlarga rozilik bildirasiz. Mahsulot narxlari va mavjudligi oldindan xabar berilmasdan o'zgarishi mumkin.</p>
      <h2>Buyurtmalar</h2>
      <p>Buyurtma tasdiqlangach, shartnoma tuzilgan hisoblanadi. To'lov muvaffaqiyatsiz bo'lsa buyurtma bekor qilinishi mumkin.</p>
      <h2>Yetkazib berish</h2>
      <p>Yetkazib berish muddatlari mintaqa va mahsulot turiga qarab belgilanadi. Batafsil ma'lumot <a href="/faq">FAQ</a> bo'limida.</p>
      <h2>Intellektual mulk</h2>
      <p>Saytdagi barcha matn, surat va dizayn materiallari Mebel Sotish mulki hisoblanadi.</p>
      <h2>Mas'uliyat cheklovi</h2>
      <p>Texnik nosozliklar yoki uchinchi tomon xizmatlari (to'lov tizimlari) sababli yuzaga kelgan kechikishlar uchun javobgarlik cheklangan.</p>
      <p><em>Oxirgi yangilanish: 2026</em></p>
    `.trim(),
  },
  {
    slug: 'returns',
    title: 'Qaytarish va almashtirish',
    description: 'Mebel mahsulotlarini qaytarish va almashtirish qoidalari.',
    keywords: ['qaytarish', 'returns', 'almashtirish', 'mebel'],
    content: `
      <h2>Qaytarish muddati</h2>
      <p>Standart mahsulotlar yetkazib berilgan kundan boshlab <strong>14 kun</strong> ichida qaytarilishi mumkin.</p>
      <h2>Shartlar</h2>
      <ul>
        <li>Mahsulot ishlatilmagan va asl qadoqda bo'lishi kerak</li>
        <li>Maxsus buyurtma (custom) mahsulotlar qaytarilmaydi</li>
        <li>Yetkazib berish xarajatlari mijoz hisobidan (agar xato biz tomondan bo'lmasa)</li>
      </ul>
      <h2>Jarayon</h2>
      <p>Qaytarish uchun <a href="/contact">bog'laning</a> yoki qo'llab-quvvatlash telefoniga murojaat qiling. Tasdiqlangach, mahsulotni qabul qilib, to'lov 5–10 ish kuni ichida qaytariladi.</p>
      <h2>Nuqsonli mahsulot</h2>
      <p>Ishlab chiqarish nuqsoni aniqlansa, bepul almashtirish yoki to'liq qaytarish amalga oshiriladi.</p>
    `.trim(),
  },
  {
    slug: 'about',
    title: 'Biz haqimizda',
    description: "Mebel Sotish — O'zbekistonda zamonaviy mebel va interyer yechimlari.",
    keywords: ['about', 'mebel', 'mebelsotish', 'kompaniya'],
    content: `
      <h2>Biz kim?</h2>
      <p><strong>Mebel Sotish</strong> — O'zbekistonda yuqori sifatli mebel va interyer yechimlarini taklif qiluvchi onlayn do'kon. Mehmonxona, yotoqxona, oshxona va ofis uchun divanlar, stollar, shkaf va aksessuarlar.</p>
      <h2>Bizning yondashuvimiz</h2>
      <p>Har bir mahsulot sifat, qulaylik va uzoq muddatli foydalanish uchun tanlanadi. Showroomimizda ko'rib, onlayn buyurtma berishingiz mumkin.</p>
      <h2>Xizmatlar</h2>
      <ul>
        <li>Toshkent va viloyatlarga yetkazib berish</li>
        <li>Professional yig'ish xizmati</li>
        <li>Bo'lib to'lash va Payme / Click to'lovlari</li>
        <li>B2B hamkorlik dasturi</li>
      </ul>
      <h2>Bog'lanish</h2>
      <p>Savollar uchun <a href="/contact">aloqa sahifasi</a> yoki qo'llab-quvvatlash telefonidan foydalaning.</p>
    `.trim(),
  },
]

export async function seedPagesIfEmpty() {
  const count = await Page.countDocuments()
  if (count > 0) {
    console.log(`[seed] Pages: ${count} existing — skip`)
    return
  }

  await Page.insertMany(SEED_PAGES)
  console.log(`[seed] Pages: inserted ${SEED_PAGES.length} default CMS pages`)
}
