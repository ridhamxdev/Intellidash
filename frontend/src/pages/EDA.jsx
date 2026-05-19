import React, { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  BarChart2, RefreshCw, AlertTriangle, Wand2,
  ChevronDown, Info, TrendingUp, Activity
} from 'lucide-react'
import {
  CorrelationHeatmap, DistributionChart
} from '../components/ChartPanel.jsx'
import DataTable from '../components/DataTable.jsx'
import {
  fetchEdaSummary, fetchCorrelation, fetchDistribution,
  fetchOutliers, preprocessData
} from '../api/axios.js'
import { useData } from '../App.jsx'

export default function EDA() {
  const { isLoaded } = useData()
  const navigate = useNavigate()

  const [activeTab, setActiveTab] = useState('summary')
  const [summary, setSummary] = useState(null)
  const [correlation, setCorrelation] = useState(null)
  const [distribution, setDistribution] = useState(null)
  const [outliers, setOutliers] = useState(null)
  const [preprocessResult, setPreprocessResult] = useState(null)

  const [loading, setLoading] = useState(false)
  const [distLoading, setDistLoading] = useState(false)
  const [preprocessLoading, setPreprocessLoading] = useState(false)
  const [error, setError] = useState(null)

  const [selectedColumn, setSelectedColumn] = useState('')
  const [preprocessStrategy, setPreprocessStrategy] = useState('mean')
  const [dropDuplicates, setDropDuplicates] = useState(true)

  const loadTab = useCallback(async (tab) => {
    setLoading(true)
    setError(null)
    try {
      if (tab === 'summary' && !summary) {
        const res = await fetchEdaSummary()
        setSummary(res.data.data)
      } else if (tab === 'correlation' && !correlation) {
        const res = await fetchCorrelation()
        setCorrelation(res.data.data)
      } else if (tab === 'outliers' && !outliers) {
        const res = await fetchOutliers()
        setOutliers(res.data.data)
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [summary, correlation, outliers])

  useEffect(() => {
    if (isLoaded) loadTab(activeTab)
  }, [isLoaded, activeTab])

  const handleTabChange = (tab) => {
    setActiveTab(tab)
    loadTab(tab)
  }

  const handleDistribution = async (col) => {
    if (!col) return
    setSelectedColumn(col)
    setDistLoading(true)
    try {
      const res = await fetchDistribution(col)
      setDistribution(res.data.data)
    } catch (err) {
      setError(err.message)
    } finally {
      setDistLoading(false)
    }
  }

  const handlePreprocess = async () => {
    setPreprocessLoading(true)
    setError(null)
    try {
      const res = await preprocessData(preprocessStrategy, dropDuplicates)
      setPreprocessResult(res.data.data)
      // Invalidate cached EDA data so it reloads with clean data
      setSummary(null)
      setCorrelation(null)
      setOutliers(null)
    } catch (err) {
      setError(err.message)
    } finally {
      setPreprocessLoading(false)
    }
  }

  const TABS = [
    { id: 'summary', label: 'Summary Stats', icon: BarChart2 },
    { id: 'correlation', label: 'Correlation', icon: Activity },
    { id: 'distribution', label: 'Distribution', icon: TrendingUp },
    { id: 'outliers', label: 'Outliers', icon: AlertTriangle },
    { id: 'preprocess', label: 'Preprocessing', icon: Wand2 },
  ]

  if (!isLoaded) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4 p-8">
        <BarChart2 size={48} className="text-muted" />
        <p className="text-text font-semibold">No dataset loaded</p>
        <p className="text-muted text-sm">Upload a file or load the sample dataset first.</p>
        <button onClick={() => navigate('/upload')} className="btn-primary">
          Go to Upload
        </button>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-text">Exploratory Data Analysis</h1>
        <p className="text-sm text-muted mt-0.5">
          Deep-dive into your dataset's structure, distributions, and relationships.
        </p>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 px-4 py-3 bg-danger/10 border border-danger/30 rounded-lg">
          <AlertTriangle size={16} className="text-danger flex-shrink-0" />
          <p className="text-sm text-danger">{error}</p>
          <button onClick={() => setError(null)} className="ml-auto text-muted hover:text-text text-xs">Dismiss</button>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 bg-card rounded-xl p-1 border border-border overflow-x-auto">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => handleTabChange(id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all duration-200
              ${activeTab === id
                ? 'bg-accent text-white shadow-lg shadow-accent/20'
                : 'text-muted hover:text-text hover:bg-bg'
              }`}
          >
            <Icon size={14} />
            {label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === 'summary' && (
        <SummaryTab data={summary} loading={loading} />
      )}
      {activeTab === 'correlation' && (
        <CorrelationTab data={correlation} loading={loading} />
      )}
      {activeTab === 'distribution' && (
        <DistributionTab
          summary={summary}
          distribution={distribution}
          loading={distLoading}
          selectedColumn={selectedColumn}
          onSelectColumn={handleDistribution}
        />
      )}
      {activeTab === 'outliers' && (
        <OutliersTab data={outliers} loading={loading} />
      )}
      {activeTab === 'preprocess' && (
        <PreprocessTab
          strategy={preprocessStrategy}
          setStrategy={setPreprocessStrategy}
          dropDuplicates={dropDuplicates}
          setDropDuplicates={setDropDuplicates}
          onRun={handlePreprocess}
          loading={preprocessLoading}
          result={preprocessResult}
        />
      )}
    </div>
  )
}

// ─── Summary Tab ──────────────────────────────────────────────────────────────
function SummaryTab({ data, loading }) {
  if (loading) return <LoadingCards />
  if (!data) return null

  return (
    <div className="space-y-6">
      {/* Numeric stats */}
      {data.stats?.length > 0 && (
        <div className="card">
          <h2 className="section-title">Numeric Column Statistics</h2>
          <p className="section-subtitle">Descriptive statistics including skewness and kurtosis</p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  {['Column', 'Count', 'Mean', 'Std Dev', 'Min', 'Q25', 'Median', 'Q75', 'Max', 'Skewness', 'Missing'].map((h) => (
                    <th key={h} className="px-3 py-3 text-left text-xs font-semibold text-muted uppercase tracking-wider whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.stats.map((s, i) => (
                  <tr key={i} className="border-b border-border/50 hover:bg-bg/50 transition-colors">
                    <td className="px-3 py-2.5 font-semibold text-accent">{s.column}</td>
                    <td className="px-3 py-2.5 text-text/80">{s.count.toLocaleString()}</td>
                    <td className="px-3 py-2.5 text-text/80">{s.mean.toLocaleString()}</td>
                    <td className="px-3 py-2.5 text-text/80">{s.std.toLocaleString()}</td>
                    <td className="px-3 py-2.5 text-text/80">{s.min.toLocaleString()}</td>
                    <td className="px-3 py-2.5 text-text/80">{s.q25.toLocaleString()}</td>
                    <td className="px-3 py-2.5 text-text/80">{s.median.toLocaleString()}</td>
                    <td className="px-3 py-2.5 text-text/80">{s.q75.toLocaleString()}</td>
                    <td className="px-3 py-2.5 text-text/80">{s.max.toLocaleString()}</td>
                    <td className="px-3 py-2.5">
                      <span className={Math.abs(s.skewness) > 1 ? 'text-warning' : 'text-text/80'}>
                        {s.skewness}
                      </span>
                    </td>
                    <td className="px-3 py-2.5">
                      {s.missing > 0 ? (
                        <span className="badge badge-warning">{s.missing} ({s.missing_pct}%)</span>
                      ) : (
                        <span className="badge badge-success">0</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Categorical stats */}
      {data.categorical_stats?.length > 0 && (
        <div className="card">
          <h2 className="section-title">Categorical Column Insights</h2>
          <p className="section-subtitle">Top value counts for each categorical column</p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {data.categorical_stats.map((cs) => (
              <div key={cs.column} className="bg-bg rounded-lg p-4 border border-border">
                <div className="flex items-center justify-between mb-3">
                  <p className="font-semibold text-sm text-accent">{cs.column}</p>
                  <span className="badge badge-accent">{cs.unique_values} unique</span>
                </div>
                <div className="space-y-1.5">
                  {cs.top_10.slice(0, 5).map(({ value, count }) => {
                    const pct = ((count / (cs.top_10.reduce((s, x) => s + x.count, 0))) * 100).toFixed(0)
                    return (
                      <div key={value} className="flex items-center gap-2">
                        <span className="text-xs text-muted w-20 truncate">{value}</span>
                        <div className="flex-1 bg-border rounded-full h-1.5">
                          <div className="bg-accent h-1.5 rounded-full" style={{ width: `${pct}%` }} />
                        </div>
                        <span className="text-xs text-text/60 w-8 text-right">{count}</span>
                      </div>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Correlation Tab ──────────────────────────────────────────────────────────
function CorrelationTab({ data, loading }) {
  if (loading) return <LoadingCards />
  if (!data) return null

  return (
    <div className="space-y-6">
      <div className="card">
        <h2 className="section-title">Correlation Heatmap</h2>
        <p className="section-subtitle">Pearson correlation coefficients between numeric columns</p>
        <CorrelationHeatmap columns={data.columns} matrix={data.matrix} loading={loading} />
        <div className="flex items-center gap-4 mt-4 text-xs text-muted">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded" style={{ background: 'rgb(99,180,241)' }} />
            Strong positive
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded" style={{ background: 'rgb(99,99,241)' }} />
            Neutral
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded" style={{ background: 'rgb(255,68,68)' }} />
            Strong negative
          </div>
        </div>
      </div>

      {data.pairs?.length > 0 && (
        <div className="card">
          <h2 className="section-title">Top Correlated Pairs</h2>
          <p className="section-subtitle">Ranked by absolute correlation strength</p>
          <div className="space-y-2">
            {data.pairs.map((p, i) => (
              <div key={i} className="flex items-center gap-4 py-2 border-b border-border/50 last:border-0">
                <span className="text-xs text-muted w-5">{i + 1}</span>
                <span className="text-sm font-medium text-accent w-28 truncate">{p.col1}</span>
                <span className="text-xs text-muted">↔</span>
                <span className="text-sm font-medium text-accent w-28 truncate">{p.col2}</span>
                <div className="flex-1 bg-bg rounded-full h-1.5">
                  <div
                    className={`h-1.5 rounded-full ${p.correlation >= 0 ? 'bg-accent' : 'bg-danger'}`}
                    style={{ width: `${Math.abs(p.correlation) * 100}%` }}
                  />
                </div>
                <span className={`text-sm font-semibold w-14 text-right ${p.correlation >= 0 ? 'text-accent' : 'text-danger'}`}>
                  {p.correlation}
                </span>
                <span className="badge badge-accent text-xs w-24 justify-center">{p.strength}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Distribution Tab ─────────────────────────────────────────────────────────
function DistributionTab({ summary, distribution, loading, selectedColumn, onSelectColumn }) {
  const numericCols = summary?.stats?.map((s) => s.column) || []
  const catCols = summary?.categorical_stats?.map((s) => s.column) || []
  const allCols = [...numericCols, ...catCols]

  return (
    <div className="space-y-6">
      <div className="card">
        <h2 className="section-title">Column Distribution</h2>
        <p className="section-subtitle">Histogram for numeric columns, value counts for categorical</p>
        <div className="flex items-center gap-3 mb-6">
          <select
            value={selectedColumn}
            onChange={(e) => onSelectColumn(e.target.value)}
            className="select w-64"
            aria-label="Select column for distribution"
          >
            <option value="">Select a column…</option>
            {numericCols.length > 0 && (
              <optgroup label="Numeric">
                {numericCols.map((c) => <option key={c} value={c}>{c}</option>)}
              </optgroup>
            )}
            {catCols.length > 0 && (
              <optgroup label="Categorical">
                {catCols.map((c) => <option key={c} value={c}>{c}</option>)}
              </optgroup>
            )}
          </select>
          {distribution && (
            <div className="flex items-center gap-2 text-xs text-muted">
              <Info size={12} />
              {distribution.type === 'numeric'
                ? `Mean: ${distribution.mean} · Median: ${distribution.median} · Std: ${distribution.std}`
                : `${distribution.histogram.length} unique values`
              }
            </div>
          )}
        </div>
        <DistributionChart data={distribution} loading={loading} />
      </div>
    </div>
  )
}

// ─── Outliers Tab ─────────────────────────────────────────────────────────────
function OutliersTab({ data, loading }) {
  if (loading) return <LoadingCards />
  if (!data) return null

  return (
    <div className="space-y-6">
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="section-title">Outlier Detection (IQR Method)</h2>
            <p className="section-subtitle">Values beyond 1.5× IQR from Q1/Q3 are flagged as outliers</p>
          </div>
          <span className="badge badge-warning">
            {data.total_outlier_rows} outlier rows
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          {data.summary.map((s) => (
            <div key={s.column} className="bg-bg rounded-lg p-4 border border-border">
              <div className="flex items-center justify-between mb-2">
                <p className="font-semibold text-sm text-accent">{s.column}</p>
                <span className={`badge ${s.outlier_count > 0 ? 'badge-warning' : 'badge-success'}`}>
                  {s.outlier_count} outliers
                </span>
              </div>
              <div className="space-y-1 text-xs text-muted">
                <div className="flex justify-between">
                  <span>IQR</span>
                  <span className="text-text">{s.iqr.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>Lower fence</span>
                  <span className="text-text">{s.lower_fence.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>Upper fence</span>
                  <span className="text-text">{s.upper_fence.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>Outlier %</span>
                  <span className={s.outlier_pct > 5 ? 'text-warning' : 'text-success'}>
                    {s.outlier_pct}%
                  </span>
                </div>
              </div>
              {s.outlier_count > 0 && (
                <div className="mt-2">
                  <div className="bg-border rounded-full h-1.5">
                    <div
                      className="bg-warning h-1.5 rounded-full"
                      style={{ width: `${Math.min(100, s.outlier_pct)}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {data.outlier_rows?.length > 0 && (
          <>
            <h3 className="text-sm font-semibold text-text mb-3">
              Sample Outlier Rows (up to 50)
            </h3>
            <DataTable
              columns={Object.keys(data.outlier_rows[0])}
              rows={data.outlier_rows}
              totalRows={data.outlier_rows.length}
              page={1}
              pageSize={data.outlier_rows.length}
              totalPages={1}
            />
          </>
        )}
      </div>
    </div>
  )
}

// ─── Preprocess Tab ───────────────────────────────────────────────────────────
function PreprocessTab({ strategy, setStrategy, dropDuplicates, setDropDuplicates, onRun, loading, result }) {
  return (
    <div className="space-y-6">
      <div className="card max-w-xl">
        <h2 className="section-title flex items-center gap-2">
          <Wand2 size={18} className="text-accent" /> Data Preprocessing
        </h2>
        <p className="section-subtitle">
          Clean your dataset by handling missing values and removing duplicates.
        </p>

        <div className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-text mb-2">
              Missing Value Strategy
            </label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { value: 'mean', label: 'Mean Imputation', desc: 'Replace with column mean' },
                { value: 'median', label: 'Median Imputation', desc: 'Replace with column median' },
                { value: 'mode', label: 'Mode Imputation', desc: 'Replace with most frequent' },
                { value: 'drop', label: 'Drop Rows', desc: 'Remove rows with nulls' },
              ].map(({ value, label, desc }) => (
                <button
                  key={value}
                  onClick={() => setStrategy(value)}
                  className={`text-left px-4 py-3 rounded-lg border transition-all duration-200
                    ${strategy === value
                      ? 'border-accent bg-accent/10 text-text'
                      : 'border-border bg-bg text-muted hover:border-accent/50'
                    }`}
                >
                  <p className="font-medium text-sm">{label}</p>
                  <p className="text-xs mt-0.5 opacity-70">{desc}</p>
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between py-3 px-4 bg-bg rounded-lg border border-border">
            <div>
              <p className="text-sm font-medium text-text">Remove Duplicate Rows</p>
              <p className="text-xs text-muted">Drop exact duplicate records from the dataset</p>
            </div>
            <button
              onClick={() => setDropDuplicates(!dropDuplicates)}
              className={`relative w-11 h-6 rounded-full transition-colors duration-200
                ${dropDuplicates ? 'bg-accent' : 'bg-border'}`}
              role="switch"
              aria-checked={dropDuplicates}
            >
              <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow
                transition-transform duration-200 ${dropDuplicates ? 'translate-x-5' : ''}`} />
            </button>
          </div>

          <button onClick={onRun} disabled={loading} className="btn-primary w-full justify-center">
            {loading ? <><Spinner /> Processing…</> : <><Wand2 size={16} /> Run Preprocessing</>}
          </button>
        </div>
      </div>

      {result && (
        <div className="card animate-slide-up">
          <h2 className="section-title text-success flex items-center gap-2">
            ✓ Preprocessing Complete
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <StatBox label="Rows Before" value={result.rows_before.toLocaleString()} />
            <StatBox label="Rows After" value={result.rows_after.toLocaleString()} color="text-success" />
            <StatBox label="Rows Removed" value={result.rows_removed.toLocaleString()} color={result.rows_removed > 0 ? 'text-warning' : 'text-success'} />
            <StatBox label="Duplicates Removed" value={result.duplicates_removed.toLocaleString()} />
          </div>
          <div className="grid grid-cols-2 gap-4 mb-6">
            <QualityBar label="Quality Before" value={result.quality_before} color="bg-warning" />
            <QualityBar label="Quality After" value={result.quality_after} color="bg-success" />
          </div>

          {/* Missing heatmap */}
          {Object.values(result.missing_heatmap).some((v) => v > 0) && (
            <div>
              <h3 className="text-sm font-semibold text-text mb-3">Missing Values (Before Cleaning)</h3>
              <div className="space-y-2">
                {Object.entries(result.missing_heatmap)
                  .filter(([, v]) => v > 0)
                  .map(([col, count]) => (
                    <div key={col} className="flex items-center gap-3">
                      <span className="text-xs text-muted w-32 truncate">{col}</span>
                      <div className="flex-1 bg-bg rounded-full h-1.5">
                        <div className="bg-warning h-1.5 rounded-full" style={{ width: `${Math.min(100, (count / result.rows_before) * 100)}%` }} />
                      </div>
                      <span className="text-xs text-warning w-8 text-right">{count}</span>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* Preview */}
          {result.preview && (
            <div className="mt-6">
              <h3 className="text-sm font-semibold text-text mb-3">Cleaned Data Preview</h3>
              <DataTable
                columns={result.preview.columns}
                rows={result.preview.rows}
                totalRows={result.preview.total_rows}
                page={1}
                pageSize={10}
                totalPages={result.preview.total_pages}
              />
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function StatBox({ label, value, color = 'text-text' }) {
  return (
    <div className="bg-bg rounded-lg px-4 py-3 border border-border text-center">
      <p className="text-xs text-muted mb-1">{label}</p>
      <p className={`text-xl font-bold ${color}`}>{value}</p>
    </div>
  )
}

function QualityBar({ label, value, color }) {
  return (
    <div className="bg-bg rounded-lg px-4 py-3 border border-border">
      <div className="flex justify-between mb-2">
        <span className="text-xs text-muted">{label}</span>
        <span className="text-sm font-bold text-text">{value.toFixed(1)}/100</span>
      </div>
      <div className="bg-border rounded-full h-2">
        <div className={`${color} h-2 rounded-full transition-all duration-700`} style={{ width: `${value}%` }} />
      </div>
    </div>
  )
}

function LoadingCards() {
  return (
    <div className="space-y-4">
      {[1, 2, 3].map((i) => (
        <div key={i} className="card">
          <div className="h-4 shimmer rounded w-48 mb-3" />
          <div className="h-3 shimmer rounded w-64 mb-6" />
          <div className="space-y-2">
            {[1, 2, 3, 4].map((j) => <div key={j} className="h-8 shimmer rounded" />)}
          </div>
        </div>
      ))}
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
