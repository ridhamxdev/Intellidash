import React, { createContext, useContext, useState, useCallback } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Sidebar from './components/Sidebar.jsx'
import Dashboard from './pages/Dashboard.jsx'
import Upload from './pages/Upload.jsx'
import EDA from './pages/EDA.jsx'
import Predictions from './pages/Predictions.jsx'
import Report from './pages/Report.jsx'

// ─── Global dataset context ───────────────────────────────────────────────────
export const DataContext = createContext(null)

export function useData() {
  return useContext(DataContext)
}

export default function App() {
  const [datasetInfo, setDatasetInfo] = useState(null)   // summary from /upload or /sample
  const [isLoaded, setIsLoaded] = useState(false)

  const setDataset = useCallback((info) => {
    setDatasetInfo(info)
    setIsLoaded(true)
  }, [])

  const clearDataset = useCallback(() => {
    setDatasetInfo(null)
    setIsLoaded(false)
  }, [])

  return (
    <DataContext.Provider value={{ datasetInfo, isLoaded, setDataset, clearDataset }}>
      <BrowserRouter>
        <div className="flex h-screen overflow-hidden bg-bg">
          <Sidebar />
          <main className="flex-1 overflow-y-auto">
            <Routes>
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/upload" element={<Upload />} />
              <Route path="/eda" element={<EDA />} />
              <Route path="/predictions" element={<Predictions />} />
              <Route path="/report" element={<Report />} />
            </Routes>
          </main>
        </div>
      </BrowserRouter>
    </DataContext.Provider>
  )
}
