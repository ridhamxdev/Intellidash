import React from 'react'
import {
  ResponsiveContainer, LineChart, Line, BarChart, Bar,
  PieChart, Pie, Cell, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, Brush
} from 'recharts'

const COLORS = ['#6366f1', '#22c55e', '#f59e0b', '#ef4444', '#06b6d4', '#a855f7', '#ec4899']

const TOOLTIP_STYLE = {
  backgroundColor: '#1e293b',
  border: '1px solid #334155',
  borderRadius: '8px',
  color: '#e2e8f0',
  fontSize: '12px',
}

const LABEL_STYLE = { fill: '#94a3b8', fontSize: 11 }

// ─── Revenue Line Chart ───────────────────────────────────────────────────────
export function RevenueLineChart({ data, loading }) {
  if (loading) return <ChartSkeleton />
  if (!data?.length) return <EmptyChart message="No revenue trend data available" />

  return (
    <ResponsiveContainer width="100%" height={260}>
      <LineChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
        <XAxis
          dataKey="date"
          tick={LABEL_STYLE}
          tickFormatter={(v) => v?.slice(5)}
          interval="preserveStartEnd"
        />
        <YAxis tick={LABEL_STYLE} tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} />
        <Tooltip
          contentStyle={TOOLTIP_STYLE}
          formatter={(v) => [`₹${v?.toLocaleString()}`, 'Revenue']}
          labelFormatter={(l) => `Week of ${l}`}
        />
        <Line
          type="monotone"
          dataKey="revenue"
          stroke="#6366f1"
          strokeWidth={2}
          dot={false}
          activeDot={{ r: 5, fill: '#6366f1' }}
        />
        <Brush dataKey="date" height={20} stroke="#334155" fill="#1e293b" travellerWidth={6} />
      </LineChart>
    </ResponsiveContainer>
  )
}

// ─── Sales by Region Bar Chart ────────────────────────────────────────────────
export function SalesBarChart({ data, loading }) {
  if (loading) return <ChartSkeleton />
  if (!data?.length) return <EmptyChart message="No regional sales data available" />

  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
        <XAxis dataKey="region" tick={LABEL_STYLE} />
        <YAxis tick={LABEL_STYLE} tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} />
        <Tooltip
          contentStyle={TOOLTIP_STYLE}
          formatter={(v) => [`₹${v?.toLocaleString()}`, 'Revenue']}
        />
        <Bar dataKey="revenue" radius={[4, 4, 0, 0]}>
          {data.map((_, i) => (
            <Cell key={i} fill={COLORS[i % COLORS.length]} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}

// ─── Customer Segmentation Pie Chart ─────────────────────────────────────────
export function SegmentPieChart({ data, loading }) {
  if (loading) return <ChartSkeleton />
  if (!data?.length) return <EmptyChart message="No segmentation data available" />

  const total = data.reduce((s, d) => s + d.count, 0)

  return (
    <ResponsiveContainer width="100%" height={260}>
      <PieChart>
        <Pie
          data={data}
          dataKey="count"
          nameKey="segment"
          cx="50%"
          cy="50%"
          outerRadius={90}
          innerRadius={50}
          paddingAngle={3}
          label={({ segment, count }) =>
            `${segment} (${((count / total) * 100).toFixed(0)}%)`
          }
          labelLine={{ stroke: '#334155' }}
        >
          {data.map((_, i) => (
            <Cell key={i} fill={COLORS[i % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip
          contentStyle={TOOLTIP_STYLE}
          formatter={(v, name) => [v, name]}
        />
        <Legend
          formatter={(v) => <span style={{ color: '#94a3b8', fontSize: 12 }}>{v}</span>}
        />
      </PieChart>
    </ResponsiveContainer>
  )
}

// ─── Monthly Trend Area Chart ─────────────────────────────────────────────────
export function MonthlyAreaChart({ data, loading }) {
  if (loading) return <ChartSkeleton />
  if (!data?.length) return <EmptyChart message="No monthly trend data available" />

  return (
    <ResponsiveContainer width="100%" height={260}>
      <AreaChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
        <defs>
          <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="avgGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
        <XAxis dataKey="month" tick={LABEL_STYLE} />
        <YAxis tick={LABEL_STYLE} tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} />
        <Tooltip
          contentStyle={TOOLTIP_STYLE}
          formatter={(v, name) => [`₹${v?.toLocaleString()}`, name]}
        />
        <Legend formatter={(v) => <span style={{ color: '#94a3b8', fontSize: 12 }}>{v}</span>} />
        <Area
          type="monotone"
          dataKey="total_revenue"
          name="Total Revenue"
          stroke="#6366f1"
          strokeWidth={2}
          fill="url(#revGrad)"
        />
        <Area
          type="monotone"
          dataKey="avg_revenue"
          name="Avg Revenue"
          stroke="#22c55e"
          strokeWidth={2}
          fill="url(#avgGrad)"
        />
      </AreaChart>
    </ResponsiveContainer>
  )
}

// ─── Correlation Heatmap (custom SVG) ────────────────────────────────────────
export function CorrelationHeatmap({ columns, matrix, loading }) {
  if (loading) return <ChartSkeleton height={300} />
  if (!columns?.length || !matrix?.length) return <EmptyChart message="No correlation data" />

  const n = columns.length
  const cellSize = Math.min(Math.floor(480 / n), 60)
  const labelWidth = 80
  const svgWidth = labelWidth + n * cellSize
  const svgHeight = labelWidth + n * cellSize

  const getColor = (val) => {
    const abs = Math.abs(val)
    if (val > 0) {
      const g = Math.round(99 + (1 - abs) * 156)
      const b = Math.round(241 - abs * 100)
      return `rgb(99, ${g}, ${b})`
    } else {
      const r = Math.round(99 + abs * 156)
      return `rgb(${r}, 68, 68)`
    }
  }

  return (
    <div className="overflow-auto">
      <svg width={svgWidth} height={svgHeight} style={{ fontFamily: 'Inter, sans-serif' }}>
        {/* Column labels */}
        {columns.map((col, i) => (
          <text
            key={`col-${i}`}
            x={labelWidth + i * cellSize + cellSize / 2}
            y={labelWidth - 6}
            textAnchor="end"
            fontSize={10}
            fill="#94a3b8"
            transform={`rotate(-45, ${labelWidth + i * cellSize + cellSize / 2}, ${labelWidth - 6})`}
          >
            {col.length > 10 ? col.slice(0, 10) + '…' : col}
          </text>
        ))}
        {/* Row labels */}
        {columns.map((col, i) => (
          <text
            key={`row-${i}`}
            x={labelWidth - 6}
            y={labelWidth + i * cellSize + cellSize / 2 + 4}
            textAnchor="end"
            fontSize={10}
            fill="#94a3b8"
          >
            {col.length > 10 ? col.slice(0, 10) + '…' : col}
          </text>
        ))}
        {/* Cells */}
        {matrix.map((row, i) =>
          row.map((val, j) => (
            <g key={`${i}-${j}`}>
              <rect
                x={labelWidth + j * cellSize}
                y={labelWidth + i * cellSize}
                width={cellSize - 1}
                height={cellSize - 1}
                fill={getColor(val)}
                rx={2}
              />
              {cellSize >= 30 && (
                <text
                  x={labelWidth + j * cellSize + cellSize / 2}
                  y={labelWidth + i * cellSize + cellSize / 2 + 4}
                  textAnchor="middle"
                  fontSize={9}
                  fill={Math.abs(val) > 0.5 ? '#fff' : '#94a3b8'}
                >
                  {val.toFixed(2)}
                </text>
              )}
            </g>
          ))
        )}
      </svg>
    </div>
  )
}

// ─── Distribution Histogram ───────────────────────────────────────────────────
export function DistributionChart({ data, loading }) {
  if (loading) return <ChartSkeleton />
  if (!data) return <EmptyChart message="Select a column to view distribution" />

  const chartData = data.type === 'numeric'
    ? data.histogram.map((b) => ({ name: b.label, count: b.count }))
    : data.histogram.map((b) => ({ name: b.label, count: b.count }))

  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 40 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
        <XAxis
          dataKey="name"
          tick={{ ...LABEL_STYLE, fontSize: 9 }}
          angle={-35}
          textAnchor="end"
          interval={0}
        />
        <YAxis tick={LABEL_STYLE} />
        <Tooltip contentStyle={TOOLTIP_STYLE} />
        <Bar dataKey="count" fill="#6366f1" radius={[3, 3, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}

// ─── Prediction Chart ─────────────────────────────────────────────────────────
export function PredictionChart({ data, forecast, loading }) {
  if (loading) return <ChartSkeleton height={300} />
  if (!data?.length) return <EmptyChart message="Run a prediction to see results" />

  // Sample every Nth point to keep chart readable
  const step = Math.max(1, Math.floor(data.length / 100))
  const sampled = data.filter((_, i) => i % step === 0)

  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={sampled} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
        <XAxis dataKey="index" tick={LABEL_STYLE} label={{ value: 'Sample Index', position: 'insideBottom', offset: -2, fill: '#94a3b8', fontSize: 11 }} />
        <YAxis tick={LABEL_STYLE} />
        <Tooltip contentStyle={TOOLTIP_STYLE} />
        <Legend formatter={(v) => <span style={{ color: '#94a3b8', fontSize: 12 }}>{v}</span>} />
        <Line type="monotone" dataKey="actual" stroke="#22c55e" strokeWidth={1.5} dot={false} name="Actual" />
        <Line type="monotone" dataKey="predicted" stroke="#6366f1" strokeWidth={2} dot={false} name="Predicted" strokeDasharray="5 3" />
      </LineChart>
    </ResponsiveContainer>
  )
}

// ─── Forecast Chart ───────────────────────────────────────────────────────────
export function ForecastChart({ forecast, loading }) {
  if (loading) return <ChartSkeleton />
  if (!forecast?.length) return <EmptyChart message="No forecast data" />

  return (
    <ResponsiveContainer width="100%" height={260}>
      <AreaChart data={forecast} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
        <defs>
          <linearGradient id="ciGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#6366f1" stopOpacity={0.2} />
            <stop offset="95%" stopColor="#6366f1" stopOpacity={0.05} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
        <XAxis dataKey="step" tick={LABEL_STYLE} label={{ value: 'Day', position: 'insideBottom', offset: -2, fill: '#94a3b8', fontSize: 11 }} />
        <YAxis tick={LABEL_STYLE} />
        <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v, n) => [v?.toFixed(2), n]} />
        <Legend formatter={(v) => <span style={{ color: '#94a3b8', fontSize: 12 }}>{v}</span>} />
        <Area type="monotone" dataKey="upper" stroke="transparent" fill="url(#ciGrad)" name="Upper CI" />
        <Area type="monotone" dataKey="lower" stroke="transparent" fill="#1e293b" name="Lower CI" />
        <Line type="monotone" dataKey="predicted" stroke="#6366f1" strokeWidth={2.5} dot={false} name="Forecast" />
      </AreaChart>
    </ResponsiveContainer>
  )
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function ChartSkeleton({ height = 260 }) {
  return (
    <div className={`shimmer rounded-lg`} style={{ height }} />
  )
}

function EmptyChart({ message }) {
  return (
    <div className="flex flex-col items-center justify-center h-48 text-muted gap-2">
      <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
        <rect x="4" y="28" width="8" height="16" rx="2" fill="#334155" />
        <rect x="16" y="18" width="8" height="26" rx="2" fill="#334155" />
        <rect x="28" y="22" width="8" height="22" rx="2" fill="#334155" />
        <rect x="40" y="12" width="8" height="32" rx="2" fill="#334155" />
      </svg>
      <p className="text-sm">{message}</p>
    </div>
  )
}
