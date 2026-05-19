import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  FileText, Download, CheckCircle, AlertTriangle,
  User, Building, Calendar, Database, BarChart2,
  TrendingUp, Shield, Layers
} from 'lucide-react'
import { generateReport } from '../api/axios.js'
import { useData } from '../App.jsx'

export default function Report() {
  const { isLoaded, datasetInfo } = useData()
  const navigate = useNavigate()
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(false)

  const handleGenerate = async () => {
    setGenerating(true)
    setError(null)
    setSuccess(false)
    try {
      const res = await generateReport()
      const blob = new Blob([res.data], { type: 'application/pdf' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'IntelliDash_Analytics_Report.pdf'
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      setSuccess(true)
    } catch (err) {
      setError(err.message)
    } finally {
      setGenerating(false)
    }
  }

  if (!isLoaded) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4 p-8">
        <FileText size={48} className="text-muted" />
        <p className="text-text font-semibold">No dataset loaded</p>
        <p className="text-muted text-sm">Load a dataset first to generate a report.</p>
        <button onClick={() => navigate('/upload')} className="btn-primary">Go to Upload</button>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6 animate-fade-in max-w-4xl">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-text">Report Generation</h1>
        <p className="text-sm text-muted mt-0.5">
          Export a branded PDF analytics report with all insights and statistics.
        </p>
      </div>

      {/* Error / Success */}
      {error && (
        <div className="flex items-center gap-2 px-4 py-3 bg-danger/10 border border-danger/30 rounded-lg">
          <AlertTriangle size={16} className="text-danger flex-shrink-0" />
          <p className="text-sm text-danger">{error}</p>
        </div>
      )}
      {success && (
        <div className="flex items-center gap-2 px-4 py-3 bg-success/10 border border-success/30 rounded-lg">
          <CheckCircle size={16} className="text-success flex-shrink-0" />
          <p className="text-sm text-success">Report downloaded successfully!</p>
        </div>
      )}

      {/* Report preview card */}
      <div className="card">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h2 className="text-lg font-bold text-text">IntelliDash Analytics Report</h2>
            <p className="text-sm text-muted mt-0.5">AI-Powered Business Analytics Platform</p>
          </div>
          <div className="w-12 h-12 bg-accent/10 rounded-xl flex items-center justify-center">
            <FileText size={24} className="text-accent" />
          </div>
        </div>

        {/* Student info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <InfoBlock icon={User} label="Student" value="Aryan Chandak (1DT22CG007)" />
          <InfoBlock icon={Building} label="College" value="DSATM, Bengaluru · VTU" />
          <InfoBlock icon={Calendar} label="Internship Period" value="Feb 2026 – May 2026" />
          <InfoBlock icon={Building} label="Organisation" value="Rooman Technologies" />
        </div>

        {/* Dataset info */}
        {datasetInfo && (
          <div className="bg-bg rounded-lg p-4 border border-border mb-6">
            <p className="text-xs font-semibold text-muted uppercase tracking-wider mb-3">
              Dataset Information
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <MiniStat label="File" value={datasetInfo.filename} />
              <MiniStat label="Rows" value={datasetInfo.rows?.toLocaleString()} />
              <MiniStat label="Columns" value={datasetInfo.columns} />
              <MiniStat label="Quality" value={`${datasetInfo.quality_score}/100`} />
            </div>
          </div>
        )}

        {/* Report sections */}
        <div className="mb-6">
          <p className="text-xs font-semibold text-muted uppercase tracking-wider mb-3">
            Report Contents
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {[
              { icon: Database, title: 'Dataset Overview', desc: 'Shape, types, missing values, quality score' },
              { icon: BarChart2, title: 'Summary Statistics', desc: 'Mean, median, std, quartiles, skewness' },
              { icon: Layers, title: 'Categorical Insights', desc: 'Top value counts per categorical column' },
              { icon: TrendingUp, title: 'Correlation Analysis', desc: 'Top correlated pairs with strength labels' },
              { icon: AlertTriangle, title: 'Outlier Detection', desc: 'IQR-based outlier summary per column' },
              { icon: Shield, title: 'Revenue Trend', desc: 'Monthly breakdown and performance metrics' },
              { icon: CheckCircle, title: 'Key Insights', desc: 'AI-generated data-driven recommendations' },
            ].map(({ icon: Icon, title, desc }) => (
              <div key={title} className="flex items-start gap-3 p-3 bg-bg rounded-lg border border-border">
                <div className="w-8 h-8 bg-accent/10 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Icon size={15} className="text-accent" />
                </div>
                <div>
                  <p className="text-sm font-medium text-text">{title}</p>
                  <p className="text-xs text-muted mt-0.5">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Generate button */}
        <button
          onClick={handleGenerate}
          disabled={generating}
          className="btn-primary w-full justify-center text-base py-3"
        >
          {generating ? (
            <><Spinner /> Generating PDF Report…</>
          ) : (
            <><Download size={18} /> Export PDF Report</>
          )}
        </button>

        <p className="text-xs text-muted text-center mt-3">
          The report will be downloaded as <code className="text-accent">IntelliDash_Analytics_Report.pdf</code>
        </p>
      </div>

      {/* Tips */}
      <div className="card">
        <h2 className="section-title">Tips for Viva / Evaluation</h2>
        <ul className="space-y-2 text-sm text-muted">
          {[
            'Run preprocessing before generating the report to include quality improvement metrics.',
            'Execute EDA (summary, correlation, outliers) to populate all report sections.',
            'Run at least one ML prediction to demonstrate the forecasting capability.',
            'The report is branded with your student details and internship information.',
            'All charts and statistics are computed from the actual loaded dataset — no mock data.',
          ].map((tip, i) => (
            <li key={i} className="flex items-start gap-2">
              <span className="text-accent font-bold mt-0.5">→</span>
              {tip}
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}

function InfoBlock({ icon: Icon, label, value }) {
  return (
    <div className="flex items-center gap-3 p-3 bg-bg rounded-lg border border-border">
      <Icon size={16} className="text-accent flex-shrink-0" />
      <div>
        <p className="text-xs text-muted">{label}</p>
        <p className="text-sm font-medium text-text">{value}</p>
      </div>
    </div>
  )
}

function MiniStat({ label, value }) {
  return (
    <div>
      <p className="text-xs text-muted">{label}</p>
      <p className="text-sm font-semibold text-text truncate">{value}</p>
    </div>
  )
}

function Spinner() {
  return (
    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
    </svg>
  )
}
