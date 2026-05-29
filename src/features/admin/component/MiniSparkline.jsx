import { Area, AreaChart, ResponsiveContainer } from 'recharts'

function MiniSparkline({ data, color = '#5eead4', id }) {
  const chartData = Array.isArray(data) ? data : []
  if (chartData.length === 0) return null

  const gradientId = `spark-${id}`

  return (
    <div className="h-12 w-full mt-3 -mx-1">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={chartData} margin={{ top: 4, right: 0, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.35} />
              <stop offset="100%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <Area
            type="monotone"
            dataKey="value"
            stroke={color}
            strokeWidth={2}
            fill={`url(#${gradientId})`}
            dot={false}
            isAnimationActive
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}

export default MiniSparkline
