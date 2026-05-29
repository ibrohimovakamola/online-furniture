import { TrendingUp, TrendingDown } from 'lucide-react'
import MiniSparkline from './MiniSparkline'

function StatCard({
  title,
  value,
  subtitle,
  trend,
  trendLabel,
  sparkData,
  sparkColor = '#5eead4',
  icon: Icon,
}) {
  const isPositive = trend >= 0

  return (
    <div className="admin-card p-6 group hover:-translate-y-0.5 transition-transform duration-200">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-[var(--admin-text-muted)]">{title}</p>
          <h2 className="text-3xl font-bold tracking-tight text-[var(--admin-text)] mt-2">
            {value}
          </h2>
        </div>
        {Icon && (
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--admin-accent-soft)] text-[#5eead4]">
            <Icon className="h-5 w-5" strokeWidth={1.75} />
          </div>
        )}
      </div>

      <div className="flex items-center gap-2 mt-2">
        {trend !== undefined && (
          <span
            className={`inline-flex items-center gap-1 text-xs font-semibold ${
              isPositive ? 'text-[var(--admin-success)]' : 'text-[var(--admin-danger)]'
            }`}
          >
            {isPositive ? (
              <TrendingUp className="h-3.5 w-3.5" />
            ) : (
              <TrendingDown className="h-3.5 w-3.5" />
            )}
            {isPositive ? '+' : ''}
            {trend}%
          </span>
        )}
        {subtitle && (
          <span className="text-xs text-[var(--admin-text-subtle)]">{subtitle}</span>
        )}
        {trendLabel && !trend && (
          <span className="text-xs text-[var(--admin-text-subtle)]">{trendLabel}</span>
        )}
      </div>

      {sparkData && (
        <MiniSparkline data={sparkData} color={sparkColor} id={title.replace(/\s/g, '')} />
      )}
    </div>
  )
}

export default StatCard
