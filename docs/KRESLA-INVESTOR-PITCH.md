# KRESLA — Investor Pitch (namuna)

> **Maqsad:** Investorlarga 5–10 daqiqalik taqdimot yoki email pitch.  
> **Brend:** Kresla · Domen: mebelsotish.uz  
> **Status:** Mahsulot tayyor (MVP+), production deploy bosqichida  
> **[ ]** belgilangan joylarga o‘z raqamlaringizni qo‘ying.

---

## Slide 1 — Cover

**KRESLA**  
O‘zbekiston uchun zamonaviy mebel e-commerce platformasi

*Uy jihozlarini onlayn tanlash, sozlash va xavfsiz to‘lash — bir joyda.*

**[Sana]** · Confidential

---

## Slide 2 — Muammo (Problem)

O‘zbekistonda mebel sotib olish hali ham:

1. **Offlinega bog‘liq** — shouroomga borish, vaqt, transport, cheklangan assortiment  
2. **Ishonchsizlik** — sifat, narx shaffofligi, yetkazib berish muddati noaniq  
3. **To‘lov qulayligi past** — muddatli to‘lov / mahalliy gatewaylar doim birlashtirilmagan  
4. **B2B bo‘shliq** — ofis, mehmonxona, restoran uchun ulgurji jarayon qog‘ozda qoladi  
5. **Mahalliy platformalar** — ko‘pincha katalog + telefon; admin, inventar, to‘lov bir tizim emas

**Natija:** mijoz qaror qila olmaydi, sotuvchi ko‘p qo‘ng‘iroq va yo‘qotilgan savdo oladi.

---

## Slide 3 — Yechim (Solution)

**Kresla** — to‘liq raqamli mebel marketplace + do‘kon:

| Mijoz | Sotuvchi / brend |
|--------|-------------------|
| Katalog (uz / ru / en) | Admin panel |
| Savat, wishlist, buyurtma | Mahsulot / kategoriya / mijozlar |
| Showroom (xona + mebel joylash) | Buyurtmalar va holat |
| Payme / Click / Uzum Bank | B2B portal |
| Profil, email tekshiruv | Galereya / CMS |

**Bir gap:** *Mebel sotishni “telefon + Instagram” dan — boshqariladigan onlayn biznesga aylantiramiz.*

---

## Slide 4 — Mahsulot (Product)

**Allaqachon qurilgan (texnik MVP+):**

- React storefront + Express API + MongoDB  
- Autentifikatsiya, rollar (customer, B2B, manager, super_admin)  
- Admin dashboard (mahsulotlar, mijozlar, buyurtmalar)  
- Ko‘p tilli interfeys (O‘zbek / Rus / Ingliz)  
- To‘lov integratsiyasi tayyorligi (Payme, Click, Uzum Bank)  
- B2B ro‘yxatdan o‘tish va portal  
- Virtual showroom (xona rasmiga mebel joylash)  
- Production arxitektura: Vercel (frontend) + Render (API) + Atlas

**Demo:** `https://mebelsotish.uz` *(deploy tugagach)* / local demo so‘rov bo‘yicha

---

## Slide 5 — Bozor (Market)

**TAM — O‘zbekiston mebel bozori**  
[ ] so‘m / yil (rasmiy statistika yoki tadqiqot manbasini qo‘ying)

**SAM — Onlayn / omni-channel mebel**  
Internet savdo ulushi o‘sib bormoqda; mebel hali “katalog + qo‘ng‘iroq” bosqichida → raqamlashtirish imkoniyati katta.

**SOM — Birinchi 24 oyda nishonga olamiz**  
- [ ] ta shahar (masalan: Toshkent, Samarqand, …)  
- [ ] ta SKU / kategoriya (divan, kreslo, yotoq, …)  
- B2C + tanlangan B2B (ofis, cafe, hotel)

> Manba: [ ] (Stat.uz, Google Trends, ichki tadqiqot)

---

## Slide 6 — Biznes modeli

| Oqim | Qanday ishlaydi | Margina (taxmin) |
|------|-----------------|------------------|
| **To‘g‘ridan-to‘g‘ri sotuv (D2C)** | O‘z katalogimizdan sotish | [ ]% |
| **Marketplace / komissiya** | Brendlar / zavodlar listing | [ ]% buyurtmadan |
| **B2B ulgurji** | Korporativ shartnoma, volume chegirma | [ ]% |
| **Muddatli to‘lov (BNPL)** | Gateway + bank hamkorligi | [ ] / tranzaksiya |
| **Premium xizmat** | Dizayn, o‘lchov, montaj | [ ] so‘m / buyurtma |

**Asosiy fokus:** birinchi bosqichda D2C + B2B; keyin marketplace va 3P sotuvchilar.

---

## Slide 7 — Go-to-market

**0–3 oy**  
- Soft launch Toshkent  
- Instagram / Telegram / SEO (mebel so‘zlari)  
- 50–100 SKU, sifatli foto + 360 / showroom  
- Birinchi 100 to‘langan buyurtma

**3–9 oy**  
- Muddatli to‘lovni faollashtirish  
- 2–3 fabrika / brend hamkorligi  
- B2B pipeline (ofis, mehmonxona)  
- Referral + retargeting

**9–18 oy**  
- Viloyatlar yetkazib berish  
- Marketplace (3P)  
- App (ixtiyoriy) / loyalty

---

## Slide 8 — Raqobat

| | Offline do‘konlar | Instagram seller | Umumiy marketplace | **Kresla** |
|--|-------------------|------------------|---------------------|------------|
| Katalog chuqurligi | Yuqori | Past | O‘rtacha | **Yuqori (mebelga fokus)** |
| Trust / to‘lov | Naqd / terminal | Ko‘pincha offline | Yuqori | **Mahalliy gatewaylar** |
| Admin / inventar | Qisman | Yo‘q | Marketplace | **O‘z platformamiz** |
| Showroom / sozlash | Fizik | Yo‘q | Yo‘q | **Raqamli showroom** |
| B2B | Alohida | Yo‘q | Zaif | **B2B portal** |

**Ustunlik:** mebelga ixtisoslashgan stack + mahalliy to‘lov + B2B + showroom — bitta brend ostida.

---

## Slide 9 — Traction (hozirgi holat)

| Ko‘rsatkich | Holat |
|-------------|--------|
| Mahsulot | Ishlaydigan platforma (kod + deploy pipeline) |
| Domen / brend | Kresla · mebelsotish.uz |
| Foydalanuvchilar | [ ] (beta / waitlist) |
| GMV / oylik savdo | [ ] so‘m |
| Buyurtmalar | [ ] |
| Hamkorlar (zavod / logistika) | [ ] |
| Jamoa | [ ] kishi |

> Agar traction hali past bo‘lsa: *“Pre-revenue / pre-launch — texnologiya va GTM tayyor.”*

---

## Slide 10 — Moliyaviy proyeksiya (namuna — almashtiring)

| | Yil 1 | Yil 2 | Yil 3 |
|--|-------|-------|-------|
| GMV | [ ] | [ ] | [ ] |
| Sof tushum | [ ] | [ ] | [ ] |
| Gross margin | [ ]% | [ ]% | [ ]% |
| Operatsion xarajat | [ ] | [ ] | [ ] |
| EBITDA | [ ] | [ ] | [ ] |

**Unit economics (bir buyurtma):**  
AOV [ ] · CAC [ ] · Contribution margin [ ] · Payback [ ] oy

---

## Slide 11 — Investitsiya so‘rovi (The Ask)

**So‘raymiz:** **$[ ] / [ ] so‘m**  
**Bosqich:** Pre-seed / Seed  
**Instrument:** Equity / SAFE / Convertible *(tanlang)*

**Mablag‘ qayerga ketadi:**

| Yo‘nalish | Ulushi | Nima uchun |
|-----------|--------|------------|
| Inventar / ombor | [ ]% | Tez yetkazib berish, stock |
| Marketing & growth | [ ]% | CAC, kontent, influencer |
| Texnologiya | [ ]% | To‘lov, mobil, marketplace |
| Logistika / montaj | [ ]% | Oxirgi mil, sifat |
| Jamoa | [ ]% | Sales, ops, support |
| Zaxira | [ ]% | 6–12 oy runway |

**18 oyda nima beramiz:**  
- [ ] GMV  
- [ ] faol mijoz  
- [ ] shahar / kanal  
- Break-even yoki aniq path to Series A

---

## Slide 12 — Jamoa

| Ism | Rol | Nima olib keladi |
|-----|-----|------------------|
| [ ] | Founder / CEO | [ ] |
| [ ] | CTO / Product | Platforma (Kresla stack) |
| [ ] | Sales / Ops | [ ] |
| Advisor | [ ] | Mebel / retail / fintech |

> Investor uchun muhim: **domain (mebel) + execution (texnologiya) + distribution**.

---

## Slide 13 — Nima uchun hozir?

1. O‘zbekistonda e-commerce va muddatli to‘lov madaniyati o‘sishda  
2. Mebel hali “digital native” emas — erta kirish imkoniyati  
3. Platforma **allaqachon qurilgan** — investitsiya asosan growth + inventar  
4. B2C + B2B bir funnel — yuqori LTV potentsiali  
5. Mahalliy to‘lov (Payme / Click / Uzum) — conversion uchun zarur

---

## Slide 14 — Yopish (Close)

**Kresla** — O‘zbekiston mebel savdosini raqamlashtirish.

> *“Biz mijozga ishonchli onlayn tanlov, sotuvchiga esa boshqariladigan savdo tizimini beramiz.”*

**Keyingi qadam:** 30 daqiqalik demo + moliyaviy model review

**Aloqa**  
[Ism] · [email] · [telefon] · [Telegram]  
mebelsotish.uz · GitHub: *(ixtiyoriy)*

---

# Qisqa email pitch (1 daqiqa o‘qish)

**Mavzu:** Kresla — O‘zbekiston mebel e-commerce · Pre-seed

Assalomu alaykum,

Men [Ism], **Kresla** (mebelsotish.uz) asoschisiman. Biz O‘zbekistonda mebelni to‘liq onlayn sotish platformasini qurdik: katalog, admin, B2B portal, mahalliy to‘lovlar va virtual showroom.

Muammo aniq: mebel hali asosan offline va “telefon orqali” sotiladi. Biz esa D2C + B2B ni bitta texnologiya stackida birlashtiramiz.

Hozir: ishlaydigan mahsulot + production deploy. Keyingi bosqich — inventar, marketing va to‘lovni to‘liq yoqish.

**So‘raymiz:** $[ ] pre-seed · 18 oy runway · maqsad [ ] GMV.

15–30 daqiqalik demo qilishga tayyormiz.

Hurmat bilan,  
[Ism] · [telefon]

---

# Taqdimot uchun maslahatlar

1. **10 slayddan oshirmang** — Cover, Problem, Solution, Market, Product, Model, Traction, Ask, Team, Close  
2. **Raqamlarni o‘zingiz to‘ldiring** — bo‘sh `[ ]` joylar investor ishonchini pasaytiradi  
3. **Demo > so‘z** — live site yoki video (2 daqiqa)  
4. **Ask aniq bo‘lsin** — summa, foiz (agar equity), nima uchun shu summa  
5. **Risklarni oldindan ayting** — logistika, qaytarish, ombor; keyin mitigatsiya

---

# Investor savollariga qisqa javoblar (FAQ)

**Q: Nima uchun marketplace emas, o‘z do‘koningiz?**  
A: Birinchi bosqichda sifat va trust uchun D2C; keyin 3P marketplace ochiladi.

**Q: Logistika qanday?**  
A: [ ] hamkor / o‘z courier · montaj alohida xizmat.

**Q: Raqobat AliExpress / Uy.uz / …?**  
A: Biz mebelga vertikal fokus + showroom + B2B + mahalliy gateway.

**Q: Pul nima uchun kerak?**  
A: Texnologiya asosan tayyor — mablag‘ growth, inventar, ops uchun.

**Q: Exit?**  
A: Regional marketplace / katta retail / fintech (BNPL) strategik sotib olishi yoki Series A+ o‘sish.

---

*Hujjat: `docs/KRESLA-INVESTOR-PITCH.md` — namuna. Raqamlar, jamoa va ask ni yangilang, keyin Google Slides / Pitch.com ga ko‘chiring.*
