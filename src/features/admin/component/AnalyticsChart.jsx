import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts'

const COLORS = ['#5eead4', '#0b3c3c', '#134f4f', '#2dd4bf', '#99f6e4']

function AnalyticsChart({ data, title = 'Sales by Category' }) {
  const chartData = Array.isArray(data) ? data : []

  return (
    <div className="admin-card p-6 h-full">
      <h3 className="text-sm font-semibold text-[var(--admin-text)] mb-6">{title}</h3>

      {chartData.length === 0 ? (
        <p className="py-16 text-center text-sm text-[var(--admin-text-muted)]">
          No category data yet.
        </p>
      ) : (
        <>
          <div className="h-[200px] relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={80}
                  paddingAngle={3}
                  dataKey="value"
                  stroke="none"
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`${entry.name}-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    background: '#1a2626',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '10px',
                    fontSize: '12px',
                  }}
                  itemStyle={{ color: '#f0f4f4' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-2 gap-2 mt-4">
            {chartData.map((item, i) => (
              <div key={`${item.name}-${i}`} className="flex items-center gap-2 text-xs">
                <span
                  className="h-2.5 w-2.5 rounded-full shrink-0"
                  style={{ background: COLORS[i % COLORS.length] }}
                />
                <span className="text-[var(--admin-text-muted)] truncate">{item.name}</span>
                <span className="ml-auto font-medium text-[var(--admin-text)]">{item.value}</span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

export default AnalyticsChart
