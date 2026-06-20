import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'

export default function AnalyticsWidget({ analytics, tier }) {
  if (tier !== 'premium') {
    return (
      <div className="rounded-xl bg-white border border-[#0b3c3c]/10 p-5">
        <h3 className="font-semibold text-kresla-dark mb-2">Analytics</h3>
        <p className="text-sm text-gray-500">
          Spending trends and category insights are available for Premium partners. Contact your account manager to upgrade.
        </p>
      </div>
    )
  }

  const chartData = (analytics?.topProducts || []).map((p) => ({
    name: p.name?.slice(0, 12) || 'Product',
    qty: p.quantityOrdered,
  }))

  return (
    <div className="rounded-xl bg-white border border-[#0b3c3c]/10 p-5">
      <h3 className="font-semibold text-kresla-dark mb-4">Analytics</h3>
      <div className="grid sm:grid-cols-3 gap-4 mb-6 text-center">
        <div className="rounded-lg bg-[#f4f7f7] p-3">
          <p className="text-xs text-gray-500">Avg order value</p>
          <p className="text-lg font-semibold text-kresla-dark">{analytics?.averageOrderValue?.toLocaleString() || 0}</p>
        </div>
        <div className="rounded-lg bg-[#f4f7f7] p-3">
          <p className="text-xs text-gray-500">Fulfilment rate</p>
          <p className="text-lg font-semibold text-kresla-dark">{analytics?.fulfilmentRate || 0}%</p>
        </div>
        <div className="rounded-lg bg-[#f4f7f7] p-3">
          <p className="text-xs text-gray-500">Lifetime value</p>
          <p className="text-lg font-semibold text-kresla-dark">{analytics?.lifetimeValue?.toLocaleString() || 0}</p>
        </div>
      </div>
      {chartData.length > 0 && (
        <div className="h-48">
          <p className="text-xs font-semibold text-gray-500 mb-2">Top purchased products</p>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <XAxis dataKey="name" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip />
              <Bar dataKey="qty" fill="#0b3c3c" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  )
}
