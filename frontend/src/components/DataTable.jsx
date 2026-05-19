import React, { useState } from 'react'
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react'

export default function DataTable({
  columns = [],
  rows = [],
  totalRows = 0,
  page = 1,
  pageSize = 10,
  totalPages = 1,
  onPageChange,
  loading = false,
  caption = '',
}) {
  if (loading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-9 shimmer rounded" />
        ))}
      </div>
    )
  }

  if (!columns.length) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-muted gap-3">
        <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
          <rect x="4" y="4" width="40" height="40" rx="4" stroke="#334155" strokeWidth="2" />
          <line x1="4" y1="14" x2="44" y2="14" stroke="#334155" strokeWidth="2" />
          <line x1="16" y1="4" x2="16" y2="44" stroke="#334155" strokeWidth="2" />
        </svg>
        <p className="text-sm">No data to display</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {caption && (
        <p className="text-xs text-muted">
          Showing {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, totalRows)} of{' '}
          <span className="text-text font-medium">{totalRows.toLocaleString()}</span> rows
        </p>
      )}

      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-bg border-b border-border">
              {columns.map((col) => (
                <th
                  key={col}
                  className="px-4 py-3 text-left text-xs font-semibold text-muted uppercase tracking-wider whitespace-nowrap"
                >
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr
                key={i}
                className="border-b border-border/50 hover:bg-bg/50 transition-colors duration-100"
              >
                {columns.map((col) => (
                  <td
                    key={col}
                    className="px-4 py-2.5 text-text/80 whitespace-nowrap max-w-[200px] truncate"
                    title={String(row[col] ?? '')}
                  >
                    {row[col] === null || row[col] === undefined ? (
                      <span className="text-danger/60 italic text-xs">null</span>
                    ) : (
                      String(row[col])
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && onPageChange && (
        <div className="flex items-center justify-between">
          <p className="text-xs text-muted">
            Page {page} of {totalPages}
          </p>
          <div className="flex items-center gap-1">
            <button
              onClick={() => onPageChange(1)}
              disabled={page === 1}
              className="p-1.5 rounded hover:bg-card disabled:opacity-30 disabled:cursor-not-allowed text-muted hover:text-text transition-colors"
              aria-label="First page"
            >
              <ChevronsLeft size={14} />
            </button>
            <button
              onClick={() => onPageChange(page - 1)}
              disabled={page === 1}
              className="p-1.5 rounded hover:bg-card disabled:opacity-30 disabled:cursor-not-allowed text-muted hover:text-text transition-colors"
              aria-label="Previous page"
            >
              <ChevronLeft size={14} />
            </button>

            {/* Page number buttons */}
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let p
              if (totalPages <= 5) {
                p = i + 1
              } else if (page <= 3) {
                p = i + 1
              } else if (page >= totalPages - 2) {
                p = totalPages - 4 + i
              } else {
                p = page - 2 + i
              }
              return (
                <button
                  key={p}
                  onClick={() => onPageChange(p)}
                  className={`w-7 h-7 rounded text-xs font-medium transition-colors ${
                    p === page
                      ? 'bg-accent text-white'
                      : 'text-muted hover:bg-card hover:text-text'
                  }`}
                >
                  {p}
                </button>
              )
            })}

            <button
              onClick={() => onPageChange(page + 1)}
              disabled={page === totalPages}
              className="p-1.5 rounded hover:bg-card disabled:opacity-30 disabled:cursor-not-allowed text-muted hover:text-text transition-colors"
              aria-label="Next page"
            >
              <ChevronRight size={14} />
            </button>
            <button
              onClick={() => onPageChange(totalPages)}
              disabled={page === totalPages}
              className="p-1.5 rounded hover:bg-card disabled:opacity-30 disabled:cursor-not-allowed text-muted hover:text-text transition-colors"
              aria-label="Last page"
            >
              <ChevronsRight size={14} />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
