import React from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AppProvider } from './context/AppContext'
import BottomNav from './components/BottomNav'
import Dashboard from './pages/Dashboard'
import Gastos from './pages/Gastos'
import Metas from './pages/Metas'
import Sorare from './pages/Sorare'
import Resumen from './pages/Resumen'

export default function App() {
  return (
    <AppProvider>
      <BrowserRouter>
        <div className="app-shell">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/gastos" element={<Gastos />} />
            <Route path="/metas" element={<Metas />} />
            <Route path="/sorare" element={<Sorare />} />
            <Route path="/resumen" element={<Resumen />} />
          </Routes>
          <BottomNav />
        </div>
      </BrowserRouter>
    </AppProvider>
  )
}
