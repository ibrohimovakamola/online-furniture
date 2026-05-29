import { MessageCircle } from 'lucide-react'
import { useSelector } from 'react-redux'
import { selectSettings } from '../features/settings/settingsSlice'

const DEFAULT_TELEGRAM = 'https://t.me/exclusive_uz_support'

function TelegramSupportWidget() {
  const settings = useSelector(selectSettings)
  const telegramUrl = settings?.store?.telegram?.trim() || DEFAULT_TELEGRAM

  return (
    <a
      href={telegramUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="telegram-support-btn"
      aria-label="Telegram orqali qo'llab-quvvatlash"
      title="Telegram orqali yozing"
    >
      <MessageCircle className="h-6 w-6" strokeWidth={2} aria-hidden />
    </a>
  )
}

export default TelegramSupportWidget
