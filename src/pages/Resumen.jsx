import React, { useState } from 'react'
import { useApp } from '../context/AppContext'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { format, subMonths } from 'date-fns'
import { es } from 'date-fns/locale'

const fmt = (n) => n.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

// ── Modal genérico ──────────────────────────────────────
function Modal({ title, onClose, children }) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-sheet" onClick={e => e.stopPropagation()}>
        <div className="modal-handle" />
        <h2 style={{ fontFamily: 'var(--font-head)', fontSize: 18, fontWeight: 700, marginBottom: 16 }}>{title}</h2>
        {children}
      </div>
    </div>
  )
}

// ── Editar nómina ───────────────────────────────────────
function EditIncomeModal({ onClose }) {
  const { income, setIncome } = useApp()
  const [val, setVal] = useState(income)
  return (
    <Modal title="Editar nómina" onClose={onClose}>
      <div className="form-group">
        <label className="form-label">Nómina mensual neta (€)</label>
        <input className="form-input" type="number" value={val} onChange={e => setVal(parseFloat(e.target.value))} />
      </div>
      <div style={{ display: 'flex', gap: 10 }}>
        <button className="btn btn-ghost" style={{ flex: 1 }} onClick={onClose}>Cancelar</button>
        <button className="btn btn-primary" style={{ flex: 2 }} onClick={() => { setIncome(val); onClose() }}>Guardar</button>
      </div>
    </Modal>
  )
}

// ── Añadir / Editar gasto fijo ──────────────────────────
function EditFixedModal({ expense, onClose }) {
  const { categories, setFixedExpenses } = useApp()
  const isNew = !expense
  const [name, setName] = useState(expense?.name || '')
  const [amount, setAmount] = useState(expense?.amount || '')
  const [category, setCategory] = useState(expense?.category || 'otros')

  const handleSave = () => {
    if (!name || !amount) return
    if (isNew) {
      setFixedExpenses(prev => [...prev, { id: Date.now().toString(), name, amount: parseFloat(amount), category, active: true }])
    } else {
      setFixedExpenses(prev => prev.map(e => e.id === expense.id ? { ...e, name, amount: parseFloat(amount), category } : e))
    }
    onClose()
  }

  return (
    <Modal title={isNew ? 'Nuevo gasto fijo' : 'Editar gasto fijo'} onClose={onClose}>
      <div className="form-group">
        <label className="form-label">Nombre</label>
        <input className="form-input" placeholder="Ej: Netflix" value={name} onChange={e => setName(e.target.value)} />
      </div>
      <div className="form-group">
        <label className="form-label">Importe €/mes</label>
        <input className="form-input" type="number" step="0.01" placeholder="0.00" value={amount} onChange={e => setAmount(e.target.value)} />
      </div>
      <div className="form-group">
        <label className="form-label">Categoría</label>
        <select className="form-input" value={category} onChange={e => setCategory(e.target.value)}>
          {categories.map(c => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
        </select>
      </div>
      <div style={{ display: 'flex', gap: 10 }}>
        <button className="btn btn-ghost" style={{ flex: 1 }} onClick={onClose}>Cancelar</button>
        <button className="btn btn-primary" style={{ flex: 2 }} onClick={handleSave}>Guardar</button>
      </div>
    </Modal>
  )
}

// ── Añadir / Editar deuda ───────────────────────────────
function EditDebtModal({ debt, onClose }) {
  const { setDebts } = useApp()
  const isNew = !debt
  const [name, setName] = useState(debt?.name || '')
  const [type, setType] = useState(debt?.type || 'prestamo')
  const [totalAmount, setTotalAmount] = useState(debt?.totalAmount || '')
  const [monthlyQuota, setMonthlyQuota] = useState(debt?.monthlyQuota || '')
  const [paid, setPaid] = useState(debt?.paid || '')
  const [endDate, setEndDate] = useState(debt?.endDate || '')
  const [months, setMonths] = useState(debt?.months?.join(', ') || '')

  const handleSave = () => {
    if (!name || !monthlyQuota) return
    const base = { name, type, monthlyQuota: parseFloat(monthlyQuota), totalAmount: parseFloat(totalAmount) || 0 }
    const full = type === 'prestamo'
      ? { ...base, paid: parseFloat(paid) || 0, endDate }
      : { ...base, months: months.split(',').map(m => m.trim()).filter(Boolean) }
    if (isNew) {
      setDebts(prev => [...prev, { id: Date.now().toString(), ...full }])
    } else {
      setDebts(prev => prev.map(d => d.id === debt.id ? { ...d, ...full } : d))
    }
    onClose()
  }

  return (
    <Modal title={isNew ? 'Nueva deuda' : 'Editar deuda'} onClose={onClose}>
      <div className="form-group">
        <label className="form-label">Nombre</label>
        <input className="form-input" placeholder="Ej: Préstamo coche" value={name} onChange={e => setName(e.target.value)} />
      </div>
      <div className="form-group">
        <label className="form-label">Tipo</label>
        <div style={{ display: 'flex', gap: 8 }}>
          {['prestamo', 'aplazado'].map(t => (
            <button key={t} onClick={() => setType(t)} style={{ flex: 1, padding: '8px', borderRadius: 8, fontSize: 12, fontWeight: 600, border: '1px solid', borderColor: type === t ? 'var(--accent)' : 'var(--border)', background: type === t ? 'var(--accent-light)' : 'transparent', color: type === t ? 'var(--accent)' : 'var(--text2)' }}>
              {t === 'prestamo' ? 'Préstamo' : 'Aplazado'}
            </button>
          ))}
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <div className="form-group">
          <label className="form-label">Total €</label>
          <input className="form-input" type="number" step="0.01" placeholder="0.00" value={totalAmount} onChange={e => setTotalAmount(e.target.value)} />
        </div>
        <div className="form-group">
          <label className="form-label">Cuota €/mes</label>
          <input className="form-input" type="number" step="0.01" placeholder="0.00" value={monthlyQuota} onChange={e => setMonthlyQuota(e.target.value)} />
        </div>
      </div>
      {type === 'prestamo' && (
        <>
          <div className="form-group">
            <label className="form-label">Pagado hasta ahora (€)</label>
            <input className="form-input" type="number" step="0.01" placeholder="0.00" value={paid} onChange={e => setPaid(e.target.value)} />
          </div>
          <div className="form-group">
            <label className="form-label">Fecha fin (YYYY-MM-DD)</label>
            <input className="form-input" type="date" value={endDate} onChange={e => setEndDate(e.target.value)} />
          </div>
        </>
      )}
      {type === 'aplazado' && (
        <div className="form-group">
          <label className="form-label">Meses activos (ej: 2025-07, 2025-08)</label>
          <input className="form-input" placeholder="2025-07, 2025-08, 2025-09" value={months} onChange={e => setMonths(e.target.value)} />
        </div>
      )}
      <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
        <button className="btn btn-ghost" style={{ flex: 1 }} onClick={onClose}>Cancelar</button>
        <button className="btn btn-primary" style={{ flex: 2 }} onClick={handleSave}>Guardar</button>
      </div>
    </Modal>
  )
}

// ── Amortizar préstamo ──────────────────────────────────
function AmortizeModal({ debt, onClose }) {
  const { setDebts } = useApp()
  const [extra, setExtra] = useState('')

  const handleSave = () => {
    const amount = parseFloat(extra)
    if (!amount || amount <= 0) return
    setDebts(prev => prev.map(d => d.id === debt.id ? { ...d, paid: Math.min(d.totalAmount, (d.paid || 0) + amount) } : d))
    onClose()
  }

  const remaining = (debt.totalAmount || 0) - (debt.paid || 0)

  return (
    <Modal title={`Amortizar — ${debt.name}`} onClose={onClose}>
      <div style={{ background: '#fdf0e3', borderRadius: 8, padding: '10px 12px', marginBottom: 14, fontSize: 12 }}>
        Pendiente: <strong style={{ color: 'var(--orange)' }}>{fmt(remaining)}€</strong>
        {' · '}Cuota: <strong>{fmt(debt.monthlyQuota)}€/mes</strong>
      </div>
      <div className="form-group">
        <label className="form-label">Amortización extra (€)</label>
        <input className="form-input" type="number" step="0.01" placeholder="0.00" value={extra} onChange={e => setExtra(e.target.value)} autoFocus />
      </div>
      <div style={{ display: 'flex', gap: 10 }}>
        <button className="btn btn-ghost" style={{ flex: 1 }} onClick={onClose}>Cancelar</button>
        <button className="btn btn-primary" style={{ flex: 2, background: 'var(--orange)' }} onClick={handleSave}>Amortizar</button>
      </div>
    </Modal>
  )
}

// ── Editar cuenta vivienda ──────────────────────────────
function EditViviendaModal({ onClose }) {
  const { vivienda, setVivienda } = useApp()
  const [current, setCurrent] = useState(vivienda.currentAmount)
  const [contributed, setContributed] = useState(vivienda.yearlyContributed)
  const [max, setMax] = useState(vivienda.yearlyMax)
  const [ret, setRet] = useState(vivienda.annualReturn)

  return (
    <Modal title="Editar cuenta vivienda" onClose={onClose}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <div className="form-group">
          <label className="form-label">Saldo total (€)</label>
          <input className="form-input" type="number" value={current} onChange={e => setCurrent(parseFloat(e.target.value))} />
        </div>
        <div className="form-group">
          <label className="form-label">Aportado este año (€)</label>
          <input className="form-input" type="number" value={contributed} onChange={e => setContributed(parseFloat(e.target.value))} />
        </div>
        <div className="form-group">
          <label className="form-label">Cupo máximo anual (€)</label>
          <input className="form-input" type="number" value={max} onChange={e => setMax(parseFloat(e.target.value))} />
        </div>
        <div className="form-group">
          <label className="form-label">Rentabilidad anual (%)</label>
          <input className="form-input" type="number" step="0.1" value={ret} onChange={e => setRet(parseFloat(e.target.value))} />
        </div>
      </div>
      <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
        <button className="btn btn-ghost" style={{ flex: 1 }} onClick={onClose}>Cancelar</button>
        <button className="btn btn-primary" style={{ flex: 2 }} onClick={() => { setVivienda({ currentAmount: current, yearlyContributed: contributed, yearlyMax: max, annualReturn: ret }); onClose() }}>Guardar</button>
      </div>
    </Modal>
  )
}

// ── Página principal ────────────────────────────────────
export default function Resumen() {
  const { income, fixedExpenses, setFixedExpenses, debts, setDebts, vivienda, goals, transactions, getMonthlySpend } = useApp()
  const [modal, setModal] = useState(null) // 'income' | 'vivienda' | 'addFixed' | {type:'editFixed',e} | 'addDebt' | {type:'editDebt',d} | {type:'amortize',d}

  const now = new Date()
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`

  const fixedTotal = fixedExpenses.filter(e => e.active).reduce((s, e) => s + e.amount, 0)
  const debtThisMonth = debts.reduce((s, d) => {
    if (d.type === 'prestamo') return s + d.monthlyQuota
    if (d.type === 'aplazado' && d.months?.includes(currentMonth)) return s + d.monthlyQuota
    return s
  }, 0)

  const activeGoals = [...goals].filter(g => (g.savedAmount || 0) < g.targetAmount).sort((a, b) => a.priority - b.priority)
  let remaining = income - fixedTotal - debtThisMonth
  const goalAllocations = activeGoals.map(g => {
    const days = Math.max(1, Math.ceil((new Date(g.deadline) - now) / (1000 * 60 * 60 * 24)))
    const months = Math.max(1, Math.ceil(days / 30))
    const needed = Math.max(0, (g.targetAmount - (g.savedAmount || 0)) / months)
    const allocated = Math.min(needed, remaining)
    remaining -= allocated
    return { ...g, monthly: needed, allocated }
  })

  const monthsLeft = Math.max(1, 12 - now.getMonth())
  const viviendaSuggested = (vivienda.yearlyMax - vivienda.yearlyContributed) / monthsLeft

  const breakdownData = [
    { name: 'Gastos fijos', value: fixedTotal, color: 'var(--orange)' },
    { name: 'Deudas', value: debtThisMonth, color: 'var(--red)' },
    { name: 'Metas', value: goalAllocations.reduce((s, g) => s + g.allocated, 0), color: 'var(--accent)' },
    { name: 'Vivienda', value: viviendaSuggested, color: 'var(--blue)' },
    { name: 'Libre', value: Math.max(0, remaining - viviendaSuggested), color: 'var(--green)' },
  ].filter(d => d.value > 0)

  const historyData = Array.from({ length: 6 }, (_, i) => {
    const d = subMonths(now, 5 - i)
    return { month: format(d, 'MMM', { locale: es }), gasto: getMonthlySpend(d.getFullYear(), d.getMonth() + 1) }
  })

  return (
    <div className="page">
      {/* Header */}
      <div className="page-header">
        <h1 className="page-title">Nómina</h1>
        <div className="page-header-actions page-header-actions--1">
          <button className="btn btn-ghost" onClick={() => setModal('income')}>
            ✏️ Nómina: {fmt(income)}€
          </button>
        </div>
      </div>

      {/* Reparto */}
      <div className="card" style={{ marginBottom: 12, borderLeft: '3px solid var(--accent)' }}>
        <span className="section-title">Reparto recomendado este mes</span>
        {breakdownData.map((item, i) => (
          <div key={i} style={{ marginBottom: 10 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
              <span style={{ fontSize: 13, color: 'var(--text2)' }}>{item.name}</span>
              <span style={{ fontSize: 13, fontWeight: 600, color: item.color }}>{fmt(item.value)}€</span>
            </div>
            <div className="progress-bar">
              <div className="progress-fill" style={{ width: `${(item.value / income) * 100}%`, background: item.color }} />
            </div>
          </div>
        ))}
        <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 10, borderTop: '1px solid var(--border)', marginTop: 4 }}>
          <span style={{ fontWeight: 600, fontSize: 13 }}>Total distribuido</span>
          <span style={{ fontWeight: 700, fontSize: 15, color: 'var(--accent)' }}>{fmt(income)}€</span>
        </div>
      </div>

      {/* Vivienda hint */}
      <div style={{ background: '#e3f4fa', borderRadius: 8, padding: '9px 12px', marginBottom: 12, fontSize: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span>🏠 Mete <strong style={{ color: 'var(--blue)' }}>{fmt(viviendaSuggested)}€</strong> este mes para agotar el cupo vivienda</span>
        <button style={{ fontSize: 11, color: 'var(--blue)', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline', whiteSpace: 'nowrap', marginLeft: 8 }} onClick={() => setModal('vivienda')}>Editar</button>
      </div>

      {/* Gastos fijos */}
      <div className="card" style={{ marginBottom: 12 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
          <span className="section-title" style={{ margin: 0 }}>Gastos fijos</span>
          <button className="btn btn-ghost" style={{ padding: '5px 10px', fontSize: 11 }} onClick={() => setModal('addFixed')}>+ Añadir</button>
        </div>
        {fixedExpenses.length === 0 && <div style={{ color: 'var(--text3)', fontSize: 12, padding: '6px 0' }}>Sin gastos fijos.</div>}
        {fixedExpenses.map(e => (
          <div key={e.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
            <button onClick={() => setFixedExpenses(prev => prev.map(x => x.id === e.id ? { ...x, active: !x.active } : x))}
              style={{ width: 17, height: 17, borderRadius: 4, border: '1px solid var(--border2)', background: e.active ? 'var(--accent)' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 11, color: '#fff' }}>
              {e.active ? '✓' : ''}
            </button>
            <span style={{ flex: 1, fontSize: 13, color: e.active ? 'var(--text)' : 'var(--text3)' }}>{e.name}</span>
            <span style={{ fontSize: 13, color: e.active ? 'var(--orange)' : 'var(--text3)' }}>-{fmt(e.amount)}€</span>
            <button onClick={() => setModal({ type: 'editFixed', e })} style={{ fontSize: 11, color: 'var(--accent)', background: 'none', border: 'none', cursor: 'pointer', padding: '0 4px' }}>✏️</button>
            <button onClick={() => setFixedExpenses(prev => prev.filter(x => x.id !== e.id))} style={{ fontSize: 11, color: 'var(--text3)', background: 'none', border: 'none', cursor: 'pointer' }}>✕</button>
          </div>
        ))}
        <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: 8 }}>
          <span style={{ fontSize: 12, color: 'var(--orange)' }}>Total: -{fmt(fixedTotal)}€/mes</span>
        </div>
      </div>

      {/* Deudas */}
      <div className="card" style={{ marginBottom: 12 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
          <span className="section-title" style={{ margin: 0 }}>Deudas / Aplazados</span>
          <button className="btn btn-ghost" style={{ padding: '5px 10px', fontSize: 11 }} onClick={() => setModal('addDebt')}>+ Añadir</button>
        </div>
        {debts.map(d => {
          const active = d.type === 'prestamo' || (d.months?.includes(currentMonth))
          const pct = d.type === 'prestamo' ? (d.paid / d.totalAmount) * 100 : null
          return (
            <div key={d.id} style={{ padding: '10px 0', borderBottom: '1px solid var(--border)', opacity: active ? 1 : 0.5 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 500 }}>{d.name}</div>
                  {d.type === 'aplazado' && d.months && (
                    <div style={{ fontSize: 10, color: 'var(--text3)', marginTop: 2 }}>Cuotas: {d.months.join(', ')}</div>
                  )}
                  {d.type === 'prestamo' && (
                    <div style={{ fontSize: 10, color: 'var(--text3)', marginTop: 2 }}>
                      {fmt(d.paid || 0)}€ de {fmt(d.totalAmount)}€ · Vence {d.endDate}
                    </div>
                  )}
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: active ? 'var(--red)' : 'var(--text3)' }}>-{fmt(d.monthlyQuota)}€</div>
                </div>
              </div>
              {pct !== null && (
                <div className="progress-bar" style={{ marginBottom: 6 }}>
                  <div className="progress-fill" style={{ width: `${pct}%`, background: 'var(--accent)' }} />
                </div>
              )}
              {/* Action buttons */}
              <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
                {d.type === 'prestamo' && (
                  <button className="btn btn-ghost" style={{ padding: '4px 10px', fontSize: 11, color: 'var(--orange)', borderColor: 'var(--orange)' }}
                    onClick={() => setModal({ type: 'amortize', d })}>
                    Amortizar
                  </button>
                )}
                <button className="btn btn-ghost" style={{ padding: '4px 10px', fontSize: 11 }} onClick={() => setModal({ type: 'editDebt', d })}>✏️ Editar</button>
                <button onClick={() => setDebts(prev => prev.filter(x => x.id !== d.id))}
                  style={{ fontSize: 11, color: 'var(--text3)', background: 'none', border: 'none', cursor: 'pointer', marginLeft: 'auto' }}>Eliminar</button>
              </div>
            </div>
          )
        })}
        <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: 8 }}>
          <span style={{ fontSize: 12, color: 'var(--red)' }}>Este mes: -{fmt(debtThisMonth)}€</span>
        </div>
      </div>

      {/* Histórico */}
      <div className="card" style={{ marginBottom: 12 }}>
        <span className="section-title">Gasto últimos 6 meses</span>
        <div className="chart-wrap">
        <ResponsiveContainer width="100%" height={150}>
          <BarChart data={historyData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
            <XAxis dataKey="month" tick={{ fill: 'var(--text3)', fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: 'var(--text3)', fontSize: 10 }} axisLine={false} tickLine={false} />
            <Tooltip formatter={v => [`${fmt(v)}€`, 'Gasto']} contentStyle={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12 }} cursor={{ fill: 'rgba(59,111,240,0.06)' }} />
            <Bar dataKey="gasto" radius={[4, 4, 0, 0]}>
              {historyData.map((_, i) => (
                <Cell key={i} fill={i === historyData.length - 1 ? 'var(--accent)' : 'var(--bg3)'} stroke={i === historyData.length - 1 ? 'var(--accent)' : 'var(--border2)'} strokeWidth={1} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
        </div>
      </div>

      {/* Modals */}
      {modal === 'income' && <EditIncomeModal onClose={() => setModal(null)} />}
      {modal === 'vivienda' && <EditViviendaModal onClose={() => setModal(null)} />}
      {modal === 'addFixed' && <EditFixedModal expense={null} onClose={() => setModal(null)} />}
      {modal?.type === 'editFixed' && <EditFixedModal expense={modal.e} onClose={() => setModal(null)} />}
      {modal === 'addDebt' && <EditDebtModal debt={null} onClose={() => setModal(null)} />}
      {modal?.type === 'editDebt' && <EditDebtModal debt={modal.d} onClose={() => setModal(null)} />}
      {modal?.type === 'amortize' && <AmortizeModal debt={modal.d} onClose={() => setModal(null)} />}
    </div>
  )
}
