import { useEffect, useState } from 'react'
import { TASHKENT_DISTRICTS } from '../../data/districts'
import { readJSON, writeJSON, STORAGE_KEYS } from '../../utils/storage'
import { formatSom } from '../../utils/formatPrice'

export default function DeliveryCalculator() {
  const saved = readJSON(STORAGE_KEYS.deliveryDistrict, 'center')
  const [districtId, setDistrictId] = useState(saved)

  useEffect(() => {
    writeJSON(STORAGE_KEYS.deliveryDistrict, districtId)
  }, [districtId])

  const district = TASHKENT_DISTRICTS.find((d) => d.id === districtId) || TASHKENT_DISTRICTS[0]

  return (
    <div className="rounded-xl border border-gray-200 p-4 bg-white">
      <h3 className="font-semibold text-kresla-dark mb-3">Yetkazib berish narxi</h3>
      <label className="block text-sm text-gray-600 mb-1">Toshkent tumani</label>
      <select
        value={districtId}
        onChange={(e) => setDistrictId(e.target.value)}
        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm mb-3"
      >
        {TASHKENT_DISTRICTS.map((d) => (
          <option key={d.id} value={d.id}>
            {d.name}
          </option>
        ))}
      </select>
      <p className="text-sm">
        Narxi:{' '}
        <strong className="text-kresla-primary">
          {district.fee === 0 ? 'Bepul' : formatSom(district.fee)}
        </strong>
      </p>
      <p className="text-sm text-gray-600 mt-1">Muddat: {district.days}</p>
    </div>
  )
}
