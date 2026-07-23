const SUPPORTED_LANGS = ['uz', 'ru', 'en']

const COPY = {
  footer: {
    uz: `© ${new Date().getFullYear()} mebelsotish.uz. Barcha huquqlar saqlanib qolgan.`,
    ru: `© ${new Date().getFullYear()} mebelsotish.uz. Все права защищены.`,
    en: `© ${new Date().getFullYear()} mebelsotish.uz. All rights reserved.`,
  },
  subjects: {
    'order-confirmation': {
      uz: 'Buyurtmangiz qabul qilindi — Mebel Sotish',
      ru: 'Ваш заказ принят — Mebel Sotish',
      en: 'Your order has been received — Mebel Sotish',
    },
    'order-shipped': {
      uz: "Buyurtmangiz yo'lga chiqdi — Mebel Sotish",
      ru: 'Ваш заказ отправлен — Mebel Sotish',
      en: 'Your order has been shipped — Mebel Sotish',
    },
    'order-delivered': {
      uz: 'Buyurtmangiz yetkazildi — Mebel Sotish',
      ru: 'Ваш заказ доставлен — Mebel Sotish',
      en: 'Your order has been delivered — Mebel Sotish',
    },
    'payment-receipt': {
      uz: "To'lov kvitansiyasi — Mebel Sotish",
      ru: 'Квитанция об оплате — Mebel Sotish',
      en: 'Payment receipt — Mebel Sotish',
    },
    welcome: {
      uz: 'Xush kelibsiz — Mebel Sotish',
      ru: 'Добро пожаловать — Mebel Sotish',
      en: 'Welcome — Mebel Sotish',
    },
    'password-reset': {
      uz: 'Parolni tiklash — Mebel Sotish',
      ru: 'Сброс пароля — Mebel Sotish',
      en: 'Password reset — Mebel Sotish',
    },
    'email-verification': {
      uz: 'Emailni tasdiqlang — Mebel Sotish',
      ru: 'Подтвердите email — Mebel Sotish',
      en: 'Verify your email — Mebel Sotish',
    },
    'contact-reply': {
      uz: 'Xabaringiz qabul qilindi — Mebel Sotish',
      ru: 'Мы получили ваше сообщение — Mebel Sotish',
      en: 'We received your message — Mebel Sotish',
    },
  },
}

export function normalizeLang(lang) {
  const code = String(lang || 'uz').toLowerCase().slice(0, 2)
  return SUPPORTED_LANGS.includes(code) ? code : 'uz'
}

export function getEmailSubject(templateKey, lang = 'uz') {
  const l = normalizeLang(lang)
  return COPY.subjects[templateKey]?.[l] || COPY.subjects[templateKey]?.uz || 'Mebel Sotish'
}

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

export function wrapEmailLayout(contentHtml, lang = 'uz') {
  const l = normalizeLang(lang)
  return `<!DOCTYPE html>
<html lang="${l}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { font-family: Arial, sans-serif; margin: 0; padding: 0; background: #f0f0f0; color: #1a1a1a; }
    .container { max-width: 600px; margin: 24px auto; background: #fff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.08); }
    .header { background: #1a1a1a; color: #fff; padding: 20px 24px; }
    .header h1 { margin: 0; font-size: 22px; letter-spacing: 1px; }
    .content { padding: 24px; line-height: 1.6; }
    .content h2 { color: #0b3c3c; font-size: 20px; margin-top: 0; }
    .content ul { padding-left: 20px; }
    .btn { display: inline-block; background: #0b3c3c; color: #fff !important; padding: 12px 20px; border-radius: 6px; text-decoration: none; margin: 12px 0; }
    .muted { color: #666; font-size: 13px; }
    .footer { background: #f5f5f5; padding: 14px; text-align: center; font-size: 12px; color: #666; }
    .total { font-size: 18px; font-weight: bold; color: #0b3c3c; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>MEBELSOTISH.UZ</h1>
    </div>
    <div class="content">
      ${contentHtml}
    </div>
    <div class="footer">
      <p>${COPY.footer[l]}</p>
    </div>
  </div>
</body>
</html>`
}

function greeting(name, lang) {
  const n = escapeHtml(name)
  if (lang === 'ru') return n ? `<p>Здравствуйте, ${n}!</p>` : '<p>Здравствуйте!</p>'
  if (lang === 'en') return n ? `<p>Hello, ${n}!</p>` : '<p>Hello!</p>'
  return n ? `<p>Salom, ${n}!</p>` : '<p>Salom!</p>'
}

function trackingBlock(trackingLink, lang) {
  if (!trackingLink) return ''
  const labels = {
    uz: 'Buyurtmani kuzatish',
    ru: 'Отследить заказ',
    en: 'Track your order',
  }
  const l = normalizeLang(lang)
  return `
    <p><a class="btn" href="${escapeHtml(trackingLink)}">${labels[l]}</a></p>
    <p class="muted">${escapeHtml(trackingLink)}</p>
  `
}

export function buildOrderConfirmationHtml({ customerName, orderNumber, itemsHtml, totalFormatted, trackingLink, lang }) {
  const l = normalizeLang(lang)
  const titles = {
    uz: 'Buyurtma tasdiqlandi',
    ru: 'Заказ подтверждён',
    en: 'Order confirmed',
  }
  const bodies = {
    uz: `<strong>#${escapeHtml(orderNumber)}</strong> raqamli buyurtmangiz qabul qilindi.`,
    ru: `Ваш заказ <strong>#${escapeHtml(orderNumber)}</strong> принят.`,
    en: `Your order <strong>#${escapeHtml(orderNumber)}</strong> has been received.`,
  }
  const totalLabels = { uz: 'Jami', ru: 'Итого', en: 'Total' }

  const content = `
    <h2>${titles[l]}</h2>
    ${greeting(customerName, l)}
    <p>${bodies[l]}</p>
    ${itemsHtml ? `<ul>${itemsHtml}</ul>` : ''}
    <p class="total">${totalLabels[l]}: ${escapeHtml(totalFormatted)} so'm</p>
    ${trackingBlock(trackingLink, l)}
    <p class="muted">${l === 'ru' ? 'Спасибо за покупку!' : l === 'en' ? 'Thank you for your purchase!' : 'Xaridingiz uchun rahmat!'}</p>
  `
  return wrapEmailLayout(content, l)
}

export function buildOrderShippedHtml({ customerName, orderNumber, totalFormatted, trackingLink, estimatedDelivery, lang }) {
  const l = normalizeLang(lang)
  const titles = { uz: "Buyurtma yo'lga chiqdi", ru: 'Заказ отправлен', en: 'Order shipped' }
  const bodies = {
    uz: `<strong>#${escapeHtml(orderNumber)}</strong> raqamli buyurtmangiz yetkazib berish xizmatiga topshirildi.`,
    ru: `Заказ <strong>#${escapeHtml(orderNumber)}</strong> передан в доставку.`,
    en: `Order <strong>#${escapeHtml(orderNumber)}</strong> has been shipped.`,
  }
  const eta =
    estimatedDelivery &&
    (l === 'ru'
      ? `<p><strong>Ожидаемая дата:</strong> ${escapeHtml(estimatedDelivery)}</p>`
      : l === 'en'
        ? `<p><strong>Estimated delivery:</strong> ${escapeHtml(estimatedDelivery)}</p>`
        : `<p><strong>Taxminiy yetkazish:</strong> ${escapeHtml(estimatedDelivery)}</p>`)

  const content = `
    <h2>${titles[l]}</h2>
    ${greeting(customerName, l)}
    <p>${bodies[l]}</p>
    <p class="total">${escapeHtml(totalFormatted)} so'm</p>
    ${eta || ''}
    ${trackingBlock(trackingLink, l)}
  `
  return wrapEmailLayout(content, l)
}

export function buildOrderDeliveredHtml({ customerName, orderNumber, lang }) {
  const l = normalizeLang(lang)
  const titles = { uz: 'Buyurtma yetkazildi', ru: 'Заказ доставлен', en: 'Order delivered' }
  const bodies = {
    uz: `<strong>#${escapeHtml(orderNumber)}</strong> raqamli buyurtmangiz muvaffaqiyatli yetkazildi. Umid qilamiz, mahsulotlarimiz sizga yoqadi!`,
    ru: `Заказ <strong>#${escapeHtml(orderNumber)}</strong> успешно доставлен. Надеемся, вам понравится наша мебель!`,
    en: `Order <strong>#${escapeHtml(orderNumber)}</strong> has been delivered. We hope you enjoy your furniture!`,
  }

  const content = `
    <h2>${titles[l]}</h2>
    ${greeting(customerName, l)}
    <p>${bodies[l]}</p>
  `
  return wrapEmailLayout(content, l)
}

export function buildPaymentReceiptHtml({
  customerName,
  orderNumber,
  totalFormatted,
  paymentMethod,
  paidAt,
  trackingLink,
  lang,
}) {
  const l = normalizeLang(lang)
  const titles = { uz: "To'lov kvitansiyasi", ru: 'Квитанция об оплате', en: 'Payment receipt' }
  const bodies = {
    uz: `<strong>#${escapeHtml(orderNumber)}</strong> buyurtmangiz uchun to'lov qabul qilindi.`,
    ru: `Оплата по заказу <strong>#${escapeHtml(orderNumber)}</strong> получена.`,
    en: `Payment for order <strong>#${escapeHtml(orderNumber)}</strong> has been received.`,
  }
  const methodLabels = { uz: "To'lov usuli", ru: 'Способ оплаты', en: 'Payment method' }
  const dateLabels = { uz: 'Sana', ru: 'Дата', en: 'Date' }
  const totalLabels = { uz: "To'langan summa", ru: 'Оплачено', en: 'Amount paid' }

  const content = `
    <h2>${titles[l]}</h2>
    ${greeting(customerName, l)}
    <p>${bodies[l]}</p>
    <p class="total">${totalLabels[l]}: ${escapeHtml(totalFormatted)} so'm</p>
    ${paymentMethod ? `<p><strong>${methodLabels[l]}:</strong> ${escapeHtml(paymentMethod)}</p>` : ''}
    ${paidAt ? `<p><strong>${dateLabels[l]}:</strong> ${escapeHtml(paidAt)}</p>` : ''}
    ${trackingBlock(trackingLink, l)}
  `
  return wrapEmailLayout(content, l)
}

export function buildWelcomeHtml({ customerName, loginUrl, lang }) {
  const l = normalizeLang(lang)
  const titles = { uz: 'Xush kelibsiz!', ru: 'Добро пожаловать!', en: 'Welcome!' }
  const bodies = {
    uz: 'Mebel Sotish platformasida ro\'yxatdan o\'tdingiz. Endi buyurtma berish, buyurtmalarni kuzatish va sevimli mahsulotlaringizni saqlashingiz mumkin.',
    ru: 'Вы зарегистрировались на Mebel Sotish. Теперь вы можете оформлять заказы, отслеживать доставку и сохранять избранные товары.',
    en: 'You have registered on Mebel Sotish. You can now place orders, track deliveries, and save your favorite products.',
  }
  const btnLabels = { uz: 'Saytga kirish', ru: 'Войти на сайт', en: 'Visit the store' }

  const content = `
    <h2>${titles[l]}</h2>
    ${greeting(customerName, l)}
    <p>${bodies[l]}</p>
    ${loginUrl ? `<p><a class="btn" href="${escapeHtml(loginUrl)}">${btnLabels[l]}</a></p>` : ''}
  `
  return wrapEmailLayout(content, l)
}

export function buildPasswordResetHtml({ resetLink, lang }) {
  const l = normalizeLang(lang)
  const titles = { uz: 'Parolni tiklash', ru: 'Сброс пароля', en: 'Reset your password' }
  const bodies = {
    uz: 'Hisobingiz uchun parolni tiklash so\'rovi qabul qilindi. Quyidagi tugmani bosing:',
    ru: 'Мы получили запрос на сброс пароля. Нажмите кнопку ниже:',
    en: 'We received a request to reset your password. Click the button below:',
  }
  const btnLabels = { uz: 'Parolni tiklash', ru: 'Сбросить пароль', en: 'Reset password' }
  const notes = {
    uz: 'Havola 1 soat ichida amal qiladi. Agar siz so\'ramagan bo\'lsangiz, bu xatni e\'tiborsiz qoldiring.',
    ru: 'Ссылка действительна 1 час. Если вы не запрашивали сброс, проигнорируйте это письмо.',
    en: 'This link expires in 1 hour. If you did not request a reset, please ignore this email.',
  }

  const content = `
    <h2>${titles[l]}</h2>
    <p>${bodies[l]}</p>
    <p><a class="btn" href="${escapeHtml(resetLink)}">${btnLabels[l]}</a></p>
    <p class="muted">${notes[l]}</p>
  `
  return wrapEmailLayout(content, l)
}

export function buildEmailVerificationHtml({ customerName, verifyLink, lang }) {
  const l = normalizeLang(lang)
  const titles = {
    uz: 'Email manzilingizni tasdiqlang',
    ru: 'Подтвердите ваш email',
    en: 'Verify your email address',
  }
  const bodies = {
    uz: 'Mebel Sotish platformasida ro\'yxatdan o\'tganingiz uchun rahmat. Hisobingizni faollashtirish uchun quyidagi tugmani bosing:',
    ru: 'Спасибо за регистрацию на Mebel Sotish. Нажмите кнопку ниже, чтобы активировать аккаунт:',
    en: 'Thank you for registering on Mebel Sotish. Click the button below to activate your account:',
  }
  const btnLabels = { uz: 'Emailni tasdiqlash', ru: 'Подтвердить email', en: 'Verify email' }
  const notes = {
    uz: 'Havola 24 soat ichida amal qiladi. Agar siz ro\'yxatdan o\'tmagan bo\'lsangiz, bu xatni e\'tiborsiz qoldiring.',
    ru: 'Ссылка действительна 24 часа. Если вы не регистрировались, проигнорируйте это письмо.',
    en: 'This link expires in 24 hours. If you did not sign up, please ignore this email.',
  }

  const content = `
    <h2>${titles[l]}</h2>
    ${greeting(customerName, l)}
    <p>${bodies[l]}</p>
    <p><a class="btn" href="${escapeHtml(verifyLink)}">${btnLabels[l]}</a></p>
    <p class="muted">${notes[l]}</p>
  `
  return wrapEmailLayout(content, l)
}

export function buildContactFormReplyHtml({ customerName, message, lang }) {
  const l = normalizeLang(lang)
  const titles = {
    uz: 'Xabaringiz qabul qilindi',
    ru: 'Мы получили ваше сообщение',
    en: 'We received your message',
  }
  const bodies = {
    uz: 'Biz bilan bog\'lanishingiz uchun rahmat. Jamoamiz 24 soat ichida sizga javob beradi.',
    ru: 'Спасибо за обращение. Наша команда ответит вам в течение 24 часов.',
    en: 'Thank you for contacting us. Our team will reply within 24 hours.',
  }
  const msgLabels = { uz: 'Sizning xabaringiz', ru: 'Ваше сообщение', en: 'Your message' }

  const content = `
    <h2>${titles[l]}</h2>
    ${greeting(customerName, l)}
    <p>${bodies[l]}</p>
    ${message ? `<p><strong>${msgLabels[l]}:</strong></p><p style="background:#f9f9f9;padding:12px;border-radius:6px;">${escapeHtml(message)}</p>` : ''}
  `
  return wrapEmailLayout(content, l)
}
