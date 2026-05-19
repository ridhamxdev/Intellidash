import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  TrendingUp, Play, AlertTriangle, Info,
  Target, BarChart2, Activity, Zap
} from 'lucide-react'
import { PredictionChart, ForecastChart } from '../components/ChartPanel.jsx'
import { runPrediction, fetchPredictColumns } from '../api/axios.js'
import { useData } from '../App.jsx'

export default function Predictions() {
  const { isLoaded } = useData()
  const navigate = useNavigate()

  const [columns, setColumns] = useState([])
  const [targetCol, setTargetCol] = useState('')
  const [featureCol, setFeatureCol] = useState('')
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (isLoaded) {
      fetchPredictColumns()
        .then((res) => {
          const cols = res.data.data.columns
          setColumns(cols)
          if (cols.length > 0) setTargetCol(cols[0])
        })
        .catch(() => {})
    }
  }, [isLoaded])

  const handleRun = async () => {
    if (!targetCol) return
    setLoading(true)
    setError(null)
    setResult(null)
    try {
      const res = await runPrediction(targetCol, featureCol || null)
      setResult(res.data.data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  if (!isLoaded) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4 p-8">
        <TrendingUp size={48} className="text-muted" />
        <p className="text-text font-semibold">No dataset loaded</p>
        <p className="text-muted text-sm">Upload a file or load the sample dataset first.</p>
        <button onClick={() => navigate('/upload')} className="btn-primary">Go to Upload</button>
      </div>
    )
  }

  const metrics = result?.metrics

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-text">ML Predictions</h1>
        <p className="text-sm text-muted mt-0.5">
          Linear Regression forecasting with 30-day outlook and confidence intervals.
        </p>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 px-4 py-3 bg-danger/10 border border-danger/30 rounded-lg">
          <AlertTriangle size={16} className="text-danger flex-shrink-0" />
          <p className="text-sm text-danger">{error}</p>
        </div>
      )}

      {/* Config panel */}
      <div className="card max-w-2xl">
        <h2 className="section-title flex items-center gap-2">
          <Zap size={18} className="text-accent" /> Configure Model
        </h2>
        <p className="section-subtitle">Select target and optional feature columns for regression</p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
          <div>
            <label className="block text-xs font-medium text-muted mb-1.5 uppercase tracking-wider">
              Target Column (Y) *
            </label>
            <select
              value={targetCol}
              onChange={(e) => setTargetCol(e.target.value)}
              className="select w-full"
              aria-label="Target column"
            >
              <option value="">Select target…</option>
              {columns.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-muted mb-1.5 uppercase tracking-wider">
              Feature Column (X) — optional
            </label>
            <select
              value={featureCol}
              onChange={(e) => setFeatureCol(e.target.value)}
              className="select w-full"
              aria-label="Feature column"
            >
              <option value="">Use row index (time proxy)</option>
              {columns.filter((c) => c !== targetCol).map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex items-center gap-3 p-3 bg-bg rounded-lg border border-border mb-5">
          <Info size={14} className="text-accent flex-shrink-0" />
          <p className="text-xs text-muted">
            The model uses <strong className="text-text">Simple Linear Regression</strong> with
            80/20 train-test split and StandardScaler normalisation.
            If no feature column is selected, the row index is used as a time proxy.
          </p>
        </div>

        <button
          onClick={handleRun}
          disabled={loading || !targetCol}
          className="btn-primary"
        >
          {loading ? <><Spinner /> Training Model…</> : <><Play size={16} /> Run Prediction</>}
        </button>
      </div>

      {/* Results */}
      {result && (
        <div className="space-y-6 animate-slide-up">
          {/* Metrics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <MetricCard
              label="R² Score"
              value={metrics.r2_score}
              icon={Target}
              color={metrics.r2_score >= 0.7 ? 'text-success' : metrics.r2_score >= 0.4 ? 'text-warning' : 'text-danger'}
              desc="Goodness of fit"
            />
            <MetricCard
              label="MAE"
              value={metrics.mae.toLocaleString()}
              icon={Activity}
              color="text-accent"
              desc="Mean Absolute Error"
            />
            <MetricCard
              label="RMSE"
              value={metrics.rmse.toLocaleString()}
              icon={BarChart2}
              color="text-accent"
              desc="Root Mean Sq. Error"
            />
            <MetricCard
              label="MAPE"
              value={`${metrics.mape.toFixed(2)}%`}
              icon={TrendingUp}
              color={metrics.mape < 10 ? 'text-success' : metrics.mape < 20 ? 'text-warning' : 'text-danger'}
              desc="Mean Abs. % Error"
            />
          </div>

          {/* Model info */}
          <div className="card">
            <h2 className="section-title">Model Details</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <InfoRow label="Target" value={result.target_column} />
              <InfoRow label="Feature" value={result.feature_column} />
              <InfoRow label="Intercept" value={result.coefficients.intercept} />
              <InfoRow label="Slope" value={result.coefficients.slope} />
              <InfoRow label="Train Samples" value={metrics.train_samples.toLocaleString()} />
              <InfoRow label="Test Samples" value={metrics.test_samples.toLocaleString()} />
              <InfoRow label="Residual Std" value={result.residual_std} />
              <InfoRow label="95% CI ±" value={result.confidence_interval} />
            </div>
          </div>

          {/* Actual vs Predicted */}
          <div className="card">
            <h2 className="section-title">Actual vs Predicted</h2>
            <p className="section-subtitle">
              Green = actual values · Purple dashed = model predictions
            </p>
            <PredictionChart data={result.actual_vs_predicted} loading={loading} />
          </div>

          {/* 30-day Forecast */}
          <div className="card">
            <h2 className="section-title">30-Day Forecast</h2>
            <p className="section-subtitle">
              Projected values with 95% confidence interval shading
            </p>
            <ForecastChart forecast={result.forecast_30_days} loading={loading} />

            {/* Forecast table */}
            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    {['Day', 'Predicted', 'Lower CI', 'Upper CI'].map((h) => (
                      <th key={h} className="px-4 py-2 text-left text-xs font-semibold text-muted uppercase tracking-wider">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {result.forecast_30_days.map((f) => (
                    <tr key={f.step} className="border-b border-border/50 hover:bg-bg/50 transition-colors">
                      <td className="px-4 py-2 text-muted">Day {f.step}</td>
                      <td className="px-4 py-2 font-semibold text-accent">{f.predicted.toLocaleString()}</td>
                      <td className="px-4 py-2 text-text/60">{f.lower.toLocaleString()}</td>
                      <td className="px-4 py-2 text-text/60">{f.upper.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function MetricCard({ label, value, icon: Icon, color, desc }) {
  return (
    <div className="card hover:border-accent/40 transition-colors">
      <div className="flex items-start justify-between mb-2">
        <p className="text-xs text-muted uppercase tracking-wider">{label}</p>
        <Icon size={16} className={color} />
      </div>
      <p className={`text-2xl font-bold ${color}`}>{value}</p>
      <p className="text-xs text-muted mt-1">{desc}</p>
    </div>
  )
}

function InfoRow({ label, value }) {
  return (
    <div className="bg-bg rounded-lg px-3 py-2.5 border border-border">
      <p className="text-xs text-muted mb-0.5">{label}</p>
      <p className="font-semibold text-text text-sm truncate">{value}</p>
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
