import axios from 'axios'

// VITE_API_URL is set in Vercel environment variables to the backend service URL.
// Locally, the Vite dev proxy forwards /api → localhost:8000, so no env var needed.
//
// Vercel multi-service:  VITE_API_URL = https://intellidash-backend.vercel.app
// Render backend:        VITE_API_URL = https://intellidash-backend.onrender.com
// Local dev:             (leave unset — proxy handles it)
const BASE_URL = import.meta.env.VITE_API_URL
  ? `${import.meta.env.VITE_API_URL}/api`
  : '/api'

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 60000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor
api.interceptors.request.use(
  (config) => config,
  (error) => Promise.reject(error)
)

// Response interceptor — normalise errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const message =
      error.response?.data?.detail ||
      error.response?.data?.message ||
      error.message ||
      'An unexpected error occurred'
    return Promise.reject(new Error(message))
  }
)

// ─── API helpers ──────────────────────────────────────────────────────────────

export const uploadFile = (file) => {
  const form = new FormData()
  form.append('file', file)
  return api.post('/upload', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
}

export const loadSample = () => api.get('/sample')

export const previewData = (page = 1, pageSize = 10) =>
  api.get('/preview', { params: { page, page_size: pageSize } })

export const preprocessData = (strategy = 'mean', dropDuplicates = true) =>
  api.post('/preprocess', null, {
    params: { strategy, drop_duplicates: dropDuplicates },
  })

export const fetchDashboard = () => api.get('/dashboard')

export const fetchEdaSummary = () => api.get('/eda/summary')

export const fetchCorrelation = () => api.get('/eda/correlation')

export const fetchDistribution = (column, bins = 20) =>
  api.get('/eda/distribution', { params: { column, bins } })

export const fetchOutliers = () => api.get('/eda/outliers')

export const runPrediction = (targetCol, featureCol = null) =>
  api.post('/predict', null, {
    params: { target_col: targetCol, ...(featureCol ? { feature_col: featureCol } : {}) },
  })

export const fetchPredictColumns = () => api.get('/predict/columns')

export const generateReport = () =>
  api.get('/report/generate', { responseType: 'blob' })

export default api
