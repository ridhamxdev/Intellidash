import React, { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Database, Hash, AlertTriangle, ShieldCheck,
  RefreshCw, Upload, TrendingUp, Users, Globe
} from 'lucide-react'
import KPICard from '../components/KPICard.jsx'
import {
  RevenueLineChart, SalesBarChart, SegmentPieChart, MonthlyAreaChart
} from '../components/ChartPanel.jsx'
import { fetchDashboard, loadSample } from '../api/axios.js'
import { useData } from '../App.jsx'

export default function Dashboard() {
  const { isLoaded, setDataset } = useData()
  const navigate = useNavigate()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [loadingSample, setLoadingSample] = useState(false)

  const fetchData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetchDashboard()
      setData(res.data.data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [])

  const handleLoadSample = async () => {
    setLoadingSample(true)
    setError(null)
    try {
      const res = await loadSample()
      setDataset(res.data.data)
      await fetchData()
    } catch (err) {
      setError(err.message)
    } finally {
      setLoadingSample(false)
    }
  }

  useEffect(() => {
    if (isLoaded) {
      fetchData()
    }
  }, [isLoaded, fetchData])

  const kpis = data?.kpis

  if (!isLoaded) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-6 p-8">
        <div className="text-center max-w-md">
          <div className="w-20 h-20 bg-accent/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <Database size={36} className="text-accent" />
          </div>
          <h1 className="text-2xl font-bold text-text mb-2">Welcome to IntelliDash</h1>
          <p className="text-muted text-sm leading-relaxed mb-8">
            AI-Powered Business Analytics Platform. Load the sample dataset to explore
            a fully working dashboard, or upload your own CSV/Excel file.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={handleLoadSample}
              disabled={loadingSample}
              className="btn-primary"
            >
              {loadingSample ? (
                <><Spinner /> Loading Sample…</>
              ) : (
                <><Database size={16} /> Load Sample Dataset</>
              )}
            </button>
            <button onClick={() => navigate('/upload')} className="btn-secondary">
              <Upload size={16} /> Upload Your Data
            </button>
          </div>
        </div>

        {/* Feature cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full max-w-2xl mt-4">
          {[
            { icon: TrendingUp, title: 'Revenue Analytics', desc: 'Track trends, forecasts, and KPIs' },
            { icon: Users, title: 'Customer Insights', desc: 'Segment analysis and behaviour' },
            { icon: Globe, title: 'Regional Performance', desc: 'Sales breakdown by geography' },
          ].map(({ icon: Icon, title, desc }) => (
            <div key={title} className="card text-center hover:border-accent/40 transition-colors">
              <Icon size={24} className="text-accent mx-auto mb-2" />
              <p className="font-semibold text-sm text-text">{title}</p>
              <p className="text-xs text-muted mt-1">{desc}</p>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-text">Dashboard Overview</h1>
          <p className="text-sm text-muted mt-0.5">
            {kpis?.filename || 'Dataset'} · Real-time analytics
          </p>
        </div>
        <button
          onClick={fetchData}
          disabled={loading}
          className="btn-ghost"
          aria-label="Refresh dashboard"
        >
          <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 px-4 py-3 bg-danger/10 border border-danger/30 rounded-lg">
          <AlertTriangle size={16} className="text-danger" />
          <p className="text-sm text-danger">{error}</p>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="Total Records"
          value={kpis?.total_records?.toLocaleString() ?? '—'}
          subtitle="Rows in dataset"
          icon={Database}
          iconColor="text-accent"
          iconBg="bg-accent/10"
          loading={loading}
        />
        <KPICard
          title="Numeric Columns"
          value={kpis?.numeric_columns ?? '—'}
          subtitle="Analysable features"
          icon={Hash}
          iconColor="text-blue-400"
          iconBg="bg-blue-400/10"
          loading={loading}
        />
        <KPICard
          title="Missing Data"
          value={kpis ? `${kpis.missing_pct}%` : '—'}
          subtitle="Of all cells"
          icon={AlertTriangle}
          iconColor={kpis?.missing_pct > 5 ? 'text-warning' : 'text-success'}
          iconBg={kpis?.missing_pct > 5 ? 'bg-warning/10' : 'bg-success/10'}
          loading={loading}
        />
        <KPICard
          title="Quality Score"
          value={kpis ? `${kpis.quality_score.toFixed(1)}` : '—'}
          subtitle="Out of 100"
          icon={ShieldCheck}
          iconColor={kpis?.quality_score >= 80 ? 'text-success' : 'text-warning'}
          iconBg={kpis?.quality_score >= 80 ? 'bg-success/10' : 'bg-warning/10'}
          loading={loading}
        />
      </div>

      {/* Charts row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <h2 className="section-title">Revenue Over Time</h2>
          <p className="section-subtitle">Weekly aggregated revenue trend</p>
          <RevenueLineChart data={data?.revenue_trend} loading={loading} />
        </div>
        <div className="card">
          <h2 className="section-title">Sales by Region</h2>
          <p className="section-subtitle">Total revenue per geographic region</p>
          <SalesBarChart data={data?.sales_by_region} loading={loading} />
        </div>
      </div>

      {/* Charts row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <h2 className="section-title">Customer Segmentation</h2>
          <p className="section-subtitle">Distribution across customer tiers</p>
          <SegmentPieChart data={data?.customer_segmentation} loading={loading} />
        </div>
        <div className="card">
          <h2 className="section-title">Monthly Revenue Trend</h2>
          <p className="section-subtitle">Total vs average monthly revenue</p>
          <MonthlyAreaChart data={data?.monthly_trend} loading={loading} />
        </div>
      </div>

      {/* Monthly table */}
      {data?.monthly_trend?.length > 0 && (
        <div className="card">
          <h2 className="section-title">Monthly Breakdown</h2>
          <p className="section-subtitle">Detailed month-by-month performance</p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  {['Month', 'Total Revenue', 'Avg Revenue', 'Transactions'].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-muted uppercase tracking-wider">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.monthly_trend.map((row, i) => (
                  <tr key={i} className="border-b border-border/50 hover:bg-bg/50 transition-colors">
                    <td className="px-4 py-2.5 font-medium text-text">{row.month}</td>
                    <td className="px-4 py-2.5 text-success">₹{row.total_revenue.toLocaleString()}</td>
                    <td className="px-4 py-2.5 text-text/80">₹{row.avg_revenue.toLocaleString()}</td>
                    <td className="px-4 py-2.5 text-text/80">{row.transactions}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

function Spinner() {
  return (
    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
    </svg>
  )
}
