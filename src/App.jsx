import React, { useEffect } from 'react'
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom'
import { AppProvider } from './context/AppContext'
import { ThemeProvider } from './context/ThemeContext'
import BottomNav from './components/BottomNav'
import Dashboard from './pages/Dashboard'
import Gastos from './pages/Gastos'
import Metas from './pages/Metas'
import Sorare from './pages/Sorare'
import Resumen from './pages/Resumen'
import Inversion from './pages/Inversion'

function useKeyboardOnInputOnly() {
  useEffect(() => {
    const blurIfTyping = (e) => {
      if (e.target.closest('input, textarea, select')) return
      const tap = e.target.closest('button, a.nav-item, .tab-btn, .modal-overlay')
      if (!tap) return
      const active = document.activeElement
      if (active && ['INPUT', 'TEXTAREA', 'SELECT'].includes(active.tagName)) {
        active.blur()
      }
    }
    document.addEventListener('pointerdown', blurIfTyping, true)
    return () => document.removeEventListener('pointerdown', blurIfTyping, true)
  }, [])
}

function AppRoutes() {
  const location = useLocation()
  return (
    <div key={location.pathname} className="route-view">
      <Routes location={location}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/gastos" element={<Gastos />} />
        <Route path="/metas" element={<Metas />} />
        <Route path="/sorare" element={<Sorare />} />
        <Route path="/resumen" element={<Resumen />} />
        <Route path="/inversion" element={<Inversion />} />
      </Routes>
      <BottomNav />
    </div>
  )
}

export default function App() {
  useKeyboardOnInputOnly()

  return (
    <ThemeProvider>
      <AppProvider>
        <BrowserRouter>
          <div className="app-shell">
            <AppRoutes />
          </div>
        </BrowserRouter>
      </AppProvider>
    </ThemeProvider>
  )
}
