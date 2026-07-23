import { useCallback, useRef, useState } from 'react'
import { ImagePlus, Upload } from 'lucide-react'
import { MAX_ROOM_FILE_BYTES, ROOM_ACCEPT } from '../constants'

/**
 * @param {{
 *   roomImageUrl: string | null,
 *   onRoomImageChange: (url: string | null) => void,
 * }} props
 */
export default function RoomUpload({ roomImageUrl, onRoomImageChange }) {
  const inputRef = useRef(null)
  const [dragOver, setDragOver] = useState(false)
  const [error, setError] = useState('')

  const applyFile = useCallback(
    (file) => {
      setError('')
      if (!file) return

      if (!file.type.startsWith('image/')) {
        setError('Faqat rasm fayllari qabul qilinadi (JPG, PNG, WebP).')
        return
      }

      if (file.size > MAX_ROOM_FILE_BYTES) {
        setError('Rasm hajmi 12 MB dan oshmasligi kerak.')
        return
      }

      const url = URL.createObjectURL(file)
      onRoomImageChange(url)
    },
    [onRoomImageChange]
  )

  const onInputChange = (e) => {
    const file = e.target.files?.[0]
    applyFile(file)
    e.target.value = ''
  }

  const onDrop = (e) => {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files?.[0]
    applyFile(file)
  }

  const clearRoom = () => {
    if (roomImageUrl?.startsWith('blob:')) {
      URL.revokeObjectURL(roomImageUrl)
    }
    onRoomImageChange(null)
    setError('')
  }

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-kresla-dark">Xona rasmini yuklash</label>
      <p className="text-xs text-gray-500">O&apos;z xonangiz suratini yuklang va mebelni ustiga joylashtiring.</p>

      <div
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') inputRef.current?.click()
        }}
        onDragOver={(e) => {
          e.preventDefault()
          setDragOver(true)
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
        onClick={() => inputRef.current?.click()}
        className={[
          'relative flex min-h-[140px] cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed px-4 py-6 text-center transition-colors',
          dragOver
            ? 'border-kresla-primary bg-kresla-light'
            : 'border-gray-200 bg-white hover:border-kresla-primary/50 hover:bg-kresla-light/60',
        ].join(' ')}
      >
        {roomImageUrl ? (
          <>
            <img
              src={roomImageUrl}
              alt="Yuklangan xona"
              className="absolute inset-0 h-full w-full rounded-[10px] object-cover"
            />
            <div className="relative z-10 rounded-lg bg-kresla-dark/70 px-3 py-2 text-xs font-medium text-white backdrop-blur-sm">
              Boshqa rasm tanlash uchun bosing
            </div>
          </>
        ) : (
          <>
            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-kresla-light text-kresla-dark">
              <ImagePlus className="h-6 w-6" aria-hidden />
            </div>
            <p className="text-sm font-medium text-kresla-dark">Xona rasmini yuklang</p>
            <p className="mt-1 text-xs text-gray-500">Sudrab tashlang yoki fayl tanlang</p>
            <span className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-kresla-dark px-3 py-1.5 text-xs font-medium text-white">
              <Upload className="h-3.5 w-3.5" aria-hidden />
              Fayl tanlash
            </span>
          </>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept={ROOM_ACCEPT}
        className="sr-only"
        onChange={onInputChange}
      />

      {roomImageUrl ? (
        <button
          type="button"
          onClick={clearRoom}
          className="text-xs font-medium text-gray-500 underline-offset-2 hover:text-kresla-dark hover:underline"
        >
          Standart xonaga qaytish
        </button>
      ) : null}

      {error ? <p className="text-xs text-red-600">{error}</p> : null}
    </div>
  )
}
