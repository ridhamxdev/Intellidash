import React, { useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import {
  LayoutDashboard, Upload, BarChart2, TrendingUp,
  FileText, ChevronLeft, ChevronRight, Zap, Database
} from 'lucide-react'
import { useData } from '../App.jsx'

const NAV_ITEMS = [
  { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/upload', label: 'Upload Data', icon: Upload },
  { path: '/eda', label: 'EDA', icon: BarChart2 },
  { path: '/predictions', label: 'Predictions', icon: TrendingUp },
  { path: '/report', label: 'Report', icon: FileText },
]

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false)
  const { datasetInfo, isLoaded } = useData()
  const location = useLocation()

  return (
    <aside
      className={`
        relative flex flex-col bg-card border-r border-border
        transition-all duration-300 ease-in-out flex-shrink-0
        ${collapsed ? 'w-16' : 'w-60'}
      `}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-5 border-b border-border">
        <div className="w-8 h-8 bg-accent rounded-lg flex items-center justify-center flex-shrink-0">
          <Zap size={16} className="text-white" />
        </div>
        {!collapsed && (
          <div className="animate-fade-in overflow-hidden">
            <p className="font-bold text-text text-sm leading-tight">IntelliDash</p>
            <p className="text-muted text-xs">Analytics Platform</p>
          </div>
        )}
      </div>

      {/* Dataset status */}
      {!collapsed && (
        <div className="mx-3 mt-3 mb-1 px-3 py-2.5 rounded-lg bg-bg border border-border animate-fade-in">
          <div className="flex items-center gap-2">
            <Database size={13} className={isLoaded ? 'text-success' : 'text-muted'} />
            <span className="text-xs text-muted truncate">
              {isLoaded ? datasetInfo?.filename || 'Dataset loaded' : 'No dataset loaded'}
            </span>
          </div>
          {isLoaded && (
            <p className="text-xs text-success mt-0.5 ml-5">
              {datasetInfo?.rows?.toLocaleString()} rows · {datasetInfo?.columns} cols
            </p>
          )}
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 px-2 py-3 space-y-1">
        {NAV_ITEMS.map(({ path, label, icon: Icon }) => {
          const active = location.pathname === path
          return (
            <NavLink
              key={path}
              to={path}
              className={`
                flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium
                transition-all duration-200 group relative
                ${active
                  ? 'bg-accent text-white shadow-lg shadow-accent/20'
                  : 'text-muted hover:text-text hover:bg-bg'
                }
                ${collapsed ? 'justify-center' : ''}
              `}
              title={collapsed ? label : undefined}
            >
              <Icon size={18} className="flex-shrink-0" />
              {!collapsed && <span className="animate-fade-in">{label}</span>}
              {active && !collapsed && (
                <span className="ml-auto w-1.5 h-1.5 rounded-full bg-white/60" />
              )}
            </NavLink>
          )
        })}
      </nav>

      {/* Footer */}
      {!collapsed && (
        <div className="px-4 py-4 border-t border-border animate-fade-in">
          <p className="text-xs text-muted leading-relaxed">
            Aryan Chandak · 1DT22CG007
          </p>
          <p className="text-xs text-muted">DSATM, Bengaluru · VTU</p>
        </div>
      )}

      {/* Collapse toggle */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="absolute -right-3 top-6 w-6 h-6 bg-card border border-border rounded-full
                   flex items-center justify-center text-muted hover:text-text
                   hover:bg-accent hover:border-accent transition-all duration-200 z-10"
        aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
      >
        {collapsed ? <ChevronRight size={12} /> : <ChevronLeft size={12} />}
      </button>
    </aside>
  )
}
