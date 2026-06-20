export const BLOG_POSTS = [
  {
    slug: 'kichik-xona-divalar',
    title: 'Kichik xona uchun eng yaxshi divalar',
    category: 'Maslahat',
    readTime: '5 daqiqa',
    date: '2025-02-10',
    excerpt: 'Kichik kvartira va studiya uchun joy tejovchi, qulay va zamonaviy divan modellari.',
    coverColor: '#c8e6d9',
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
    readTime: '7 daqiqa',
    date: '2025-01-15',
    excerpt: 'Tabiiy matolar, yumaloq shakllar va barqaror materiallar — yangi yilning asosiy yo‘nalishlari.',
    coverColor: '#d4e4f0',
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
    category: 'Qo‘llanma',
    readTime: '6 daqiqa',
    date: '2024-12-20',
    excerpt: 'Oilaviy uy uchun mato, zamonaviy ofis uchun charm — qaysi holatda nima tanlash kerak.',
    coverColor: '#f0e6d4',
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
    readTime: '8 daqiqa',
    date: '2024-11-05',
    excerpt: 'Mehmonlarni qarshi olish uchun qulay, chiroyli va funksional mehmonxona yaratish.',
    coverColor: '#e8d4f0',
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
]

export function getPostBySlug(slug) {
  return BLOG_POSTS.find((p) => p.slug === slug)
}
