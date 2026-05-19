import React from 'react'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'

export default function KPICard({
  title,
  value,
  subtitle,
  icon: Icon,
  iconColor = 'text-accent',
  iconBg = 'bg-accent/10',
  trend = null,       // { value: number, label: string }
  loading = false,
  className = '',
}) {
  if (loading) {
    return (
      <div className={`card animate-pulse ${className}`}>
        <div className="flex items-start justify-between">
          <div className="space-y-2 flex-1">
            <div className="h-3 bg-border rounded w-24 shimmer" />
            <div className="h-8 bg-border rounded w-32 shimmer" />
            <div className="h-3 bg-border rounded w-20 shimmer" />
          </div>
          <div className="w-10 h-10 bg-border rounded-lg shimmer" />
        </div>
      </div>
    )
  }

  const trendIcon =
    trend?.value > 0 ? TrendingUp :
    trend?.value < 0 ? TrendingDown : Minus

  const trendColor =
    trend?.value > 0 ? 'text-success' :
    trend?.value < 0 ? 'text-danger' : 'text-muted'

  const TrendIcon = trendIcon

  return (
    <div className={`card hover:border-accent/40 transition-all duration-300 group ${className}`}>
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-muted uppercase tracking-wider mb-2">
            {title}
          </p>
          <p className="text-2xl font-bold text-text truncate">{value}</p>
          {subtitle && (
            <p className="text-xs text-muted mt-1 truncate">{subtitle}</p>
          )}
          {trend && (
            <div className={`flex items-center gap-1 mt-2 ${trendColor}`}>
              <TrendIcon size={12} />
              <span className="text-xs font-medium">
                {trend.value > 0 ? '+' : ''}{trend.value}% {trend.label}
              </span>
            </div>
          )}
        </div>
        {Icon && (
          <div className={`w-10 h-10 ${iconBg} rounded-lg flex items-center justify-center
                          flex-shrink-0 ml-3 group-hover:scale-110 transition-transform duration-200`}>
            <Icon size={20} className={iconColor} />
          </div>
        )}
      </div>
    </div>
  )
}
