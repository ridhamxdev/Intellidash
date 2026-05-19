import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Upload as UploadIcon, Database, CheckCircle, AlertTriangle,
  FileText, Hash, Calendar, Layers, ArrowRight
} from 'lucide-react'
import FileUpload from '../components/FileUpload.jsx'
import DataTable from '../components/DataTable.jsx'
import { uploadFile, loadSample, previewData } from '../api/axios.js'
import { useData } from '../App.jsx'

export default function Upload() {
  const { setDataset } = useData()
  const navigate = useNavigate()
  const [uploading, setUploading] = useState(false)
  const [loadingSample, setLoadingSample] = useState(false)
  const [summary, setSummary] = useState(null)
  const [error, setError] = useState(null)
  const [preview, setPreview] = useState(null)
  const [previewPage, setPreviewPage] = useState(1)
  const [previewLoading, setPreviewLoading] = useState(false)

  const handleUpload = async (file) => {
    setUploading(true)
    setError(null)
    setSummary(null)
    try {
      const res = await uploadFile(file)
      const info = res.data.data
      setSummary(info)
      setDataset(info)
      await loadPreview(1)
    } catch (err) {
      setError(err.message)
    } finally {
      setUploading(false)
    }
  }

  const handleLoadSample = async () => {
    setLoadingSample(true)
    setError(null)
    setSummary(null)
    try {
      const res = await loadSample()
      const info = res.data.data
      setSummary(info)
      setDataset(info)
      await loadPreview(1)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoadingSample(false)
    }
  }

  const loadPreview = async (page) => {
    setPreviewLoading(true)
    try {
      const res = await previewData(page, 10)
      setPreview(res.data.data)
      setPreviewPage(page)
    } catch (err) {
      // preview failure is non-critical
    } finally {
      setPreviewLoading(false)
    }
  }

  return (
    <div className="p-6 space-y-6 animate-fade-in max-w-5xl">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-text">Upload Dataset</h1>
        <p className="text-sm text-muted mt-0.5">
          Upload a CSV or Excel file, or load the built-in sample dataset to get started immediately.
        </p>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 px-4 py-3 bg-danger/10 border border-danger/30 rounded-lg">
          <AlertTriangle size={16} className="text-danger flex-shrink-0" />
          <p className="text-sm text-danger">{error}</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upload card */}
        <div className="card">
          <h2 className="section-title flex items-center gap-2">
            <UploadIcon size={18} className="text-accent" /> Upload File
          </h2>
          <p className="section-subtitle">Supports CSV, XLSX, XLS up to 50 MB</p>
          <FileUpload onUpload={handleUpload} loading={uploading} />
        </div>

        {/* Sample data card */}
        <div className="card flex flex-col">
          <h2 className="section-title flex items-center gap-2">
            <Database size={18} className="text-accent" /> Sample Dataset
          </h2>
          <p className="section-subtitle">
            Pre-loaded sales data with 500 rows covering Jan–Dec 2024.
            Perfect for exploring all dashboard features immediately.
          </p>

          <div className="grid grid-cols-2 gap-3 mb-6">
            {[
              { label: '500 rows', sub: 'Daily records' },
              { label: '8 columns', sub: 'Mixed types' },
              { label: '5 regions', sub: 'Geographic data' },
              { label: '12 months', sub: 'Full year 2024' },
            ].map(({ label, sub }) => (
              <div key={label} className="bg-bg rounded-lg px-3 py-2.5 border border-border">
                <p className="font-semibold text-text text-sm">{label}</p>
                <p className="text-xs text-muted">{sub}</p>
              </div>
            ))}
          </div>

          <button
            onClick={handleLoadSample}
            disabled={loadingSample}
            className="btn-primary mt-auto"
          >
            {loadingSample ? (
              <><Spinner /> Loading…</>
            ) : (
              <><Database size={16} /> Load Sample Dataset</>
            )}
          </button>
        </div>
      </div>

      {/* Dataset Summary */}
      {summary && (
        <div className="card animate-slide-up">
          <div className="flex items-center justify-between mb-4">
            <h2 className="section-title flex items-center gap-2 mb-0">
              <CheckCircle size={18} className="text-success" /> Dataset Loaded Successfully
            </h2>
            <button
              onClick={() => navigate('/eda')}
              className="btn-primary text-sm"
            >
              Explore EDA <ArrowRight size={14} />
            </button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <MetaStat icon={FileText} label="Filename" value={summary.filename} />
            <MetaStat icon={Layers} label="Shape" value={`${summary.rows} × ${summary.columns}`} />
            <MetaStat icon={AlertTriangle} label="Missing %" value={`${summary.missing_percentage}%`} color={summary.missing_percentage > 5 ? 'text-warning' : 'text-success'} />
            <MetaStat icon={CheckCircle} label="Quality Score" value={`${summary.quality_score}/100`} color={summary.quality_score >= 80 ? 'text-success' : 'text-warning'} />
          </div>

          {/* Column types */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <ColGroup title="Numeric Columns" cols={summary.numeric_columns} color="text-accent" />
            <ColGroup title="Categorical Columns" cols={summary.categorical_columns} color="text-success" />
            <ColGroup title="Date Columns" cols={summary.date_columns} color="text-warning" />
          </div>

          {/* Missing per column */}
          {Object.values(summary.missing_per_column).some((v) => v > 0) && (
            <div className="mb-6">
              <h3 className="text-sm font-semibold text-text mb-3">Missing Values per Column</h3>
              <div className="space-y-2">
                {Object.entries(summary.missing_per_column)
                  .filter(([, v]) => v > 0)
                  .map(([col, count]) => {
                    const pct = ((count / summary.rows) * 100).toFixed(1)
                    return (
                      <div key={col} className="flex items-center gap-3">
                        <span className="text-xs text-muted w-32 truncate">{col}</span>
                        <div className="flex-1 bg-bg rounded-full h-1.5">
                          <div
                            className="bg-warning h-1.5 rounded-full transition-all duration-500"
                            style={{ width: `${Math.min(100, pct)}%` }}
                          />
                        </div>
                        <span className="text-xs text-warning w-16 text-right">{count} ({pct}%)</span>
                      </div>
                    )
                  })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Data Preview */}
      {preview && (
        <div className="card animate-slide-up">
          <h2 className="section-title">Data Preview</h2>
          <p className="section-subtitle">First rows of the loaded dataset</p>
          <DataTable
            columns={preview.columns}
            rows={preview.rows}
            totalRows={preview.total_rows}
            page={previewPage}
            pageSize={10}
            totalPages={preview.total_pages}
            onPageChange={loadPreview}
            loading={previewLoading}
            caption
          />
        </div>
      )}
    </div>
  )
}

function MetaStat({ icon: Icon, label, value, color = 'text-text' }) {
  return (
    <div className="bg-bg rounded-lg px-4 py-3 border border-border">
      <div className="flex items-center gap-2 mb-1">
        <Icon size={13} className="text-muted" />
        <span className="text-xs text-muted">{label}</span>
      </div>
      <p className={`font-semibold text-sm truncate ${color}`}>{value}</p>
    </div>
  )
}

function ColGroup({ title, cols, color }) {
  return (
    <div className="bg-bg rounded-lg px-4 py-3 border border-border">
      <p className="text-xs text-muted mb-2">{title}</p>
      <div className="flex flex-wrap gap-1.5">
        {cols?.length > 0 ? (
          cols.map((c) => (
            <span key={c} className={`badge ${color === 'text-accent' ? 'badge-accent' : color === 'text-success' ? 'badge-success' : 'badge-warning'}`}>
              {c}
            </span>
          ))
        ) : (
          <span className="text-xs text-muted italic">None detected</span>
        )}
      </div>
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
