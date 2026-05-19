import React, { useCallback, useState } from 'react'
import { Upload, FileText, X, CheckCircle, AlertCircle } from 'lucide-react'

export default function FileUpload({ onUpload, loading = false, accept = '.csv,.xlsx,.xls' }) {
  const [dragOver, setDragOver] = useState(false)
  const [selectedFile, setSelectedFile] = useState(null)
  const [error, setError] = useState(null)

  const validateFile = (file) => {
    const allowed = ['csv', 'xlsx', 'xls']
    const ext = file.name.split('.').pop()?.toLowerCase()
    if (!allowed.includes(ext)) {
      return `Unsupported file type ".${ext}". Please upload CSV or Excel files.`
    }
    if (file.size > 50 * 1024 * 1024) {
      return 'File size exceeds 50 MB limit.'
    }
    return null
  }

  const handleFile = useCallback((file) => {
    setError(null)
    const err = validateFile(file)
    if (err) {
      setError(err)
      return
    }
    setSelectedFile(file)
  }, [])

  const handleDrop = useCallback((e) => {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }, [handleFile])

  const handleInputChange = (e) => {
    const file = e.target.files[0]
    if (file) handleFile(file)
  }

  const handleUpload = () => {
    if (selectedFile && onUpload) {
      onUpload(selectedFile)
    }
  }

  const clearFile = () => {
    setSelectedFile(null)
    setError(null)
  }

  const formatSize = (bytes) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`
  }

  return (
    <div className="space-y-4">
      {/* Drop zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        className={`
          relative border-2 border-dashed rounded-xl p-10 text-center
          transition-all duration-200 cursor-pointer
          ${dragOver
            ? 'border-accent bg-accent/5 scale-[1.01]'
            : selectedFile
              ? 'border-success/50 bg-success/5'
              : 'border-border hover:border-accent/50 hover:bg-accent/5'
          }
        `}
        onClick={() => !selectedFile && document.getElementById('file-input').click()}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === 'Enter' && document.getElementById('file-input').click()}
        aria-label="Upload file drop zone"
      >
        <input
          id="file-input"
          type="file"
          accept={accept}
          className="hidden"
          onChange={handleInputChange}
          aria-label="File input"
        />

        {selectedFile ? (
          <div className="flex flex-col items-center gap-3">
            <div className="w-12 h-12 bg-success/10 rounded-full flex items-center justify-center">
              <CheckCircle size={24} className="text-success" />
            </div>
            <div>
              <p className="font-semibold text-text">{selectedFile.name}</p>
              <p className="text-sm text-muted mt-0.5">{formatSize(selectedFile.size)}</p>
            </div>
            <button
              onClick={(e) => { e.stopPropagation(); clearFile() }}
              className="text-muted hover:text-danger transition-colors p-1 rounded"
              aria-label="Remove selected file"
            >
              <X size={16} />
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3">
            <div className={`w-14 h-14 rounded-full flex items-center justify-center transition-colors
              ${dragOver ? 'bg-accent/20' : 'bg-border/50'}`}>
              <Upload size={26} className={dragOver ? 'text-accent' : 'text-muted'} />
            </div>
            <div>
              <p className="font-semibold text-text">
                {dragOver ? 'Drop your file here' : 'Drag & drop your dataset'}
              </p>
              <p className="text-sm text-muted mt-1">
                or <span className="text-accent underline cursor-pointer">browse files</span>
              </p>
            </div>
            <div className="flex items-center gap-2 mt-1">
              {['CSV', 'XLSX', 'XLS'].map((ext) => (
                <span key={ext} className="badge badge-accent">{ext}</span>
              ))}
              <span className="text-xs text-muted">· Max 50 MB</span>
            </div>
          </div>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 px-4 py-3 bg-danger/10 border border-danger/30 rounded-lg">
          <AlertCircle size={16} className="text-danger flex-shrink-0" />
          <p className="text-sm text-danger">{error}</p>
        </div>
      )}

      {/* Upload button */}
      {selectedFile && !error && (
        <button
          onClick={handleUpload}
          disabled={loading}
          className="btn-primary w-full justify-center"
        >
          {loading ? (
            <>
              <Spinner />
              Uploading & Analysing…
            </>
          ) : (
            <>
              <FileText size={16} />
              Upload & Analyse Dataset
            </>
          )}
        </button>
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
