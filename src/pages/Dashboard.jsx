import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import ThemeToggle from '../components/ThemeToggle'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts'
import { format, differenceInDays, parseISO } from 'date-fns'
import { es } from 'date-fns/locale'
import { WALLET_MOVE_LABELS, INVESTMENT_TYPE_LABELS } from '../data/defaults'
import Modal from '../components/Modal'

const fmt = (n) => n.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
const GOAL_PRIORITY_COLORS = { 1: 'var(--red)', 2: 'var(--orange)', 3: 'var(--yellow)', 4: 'var(--blue)', 5: 'var(--text2)' }

function InvestmentsPreview() {
  const { investments, cryptoPrices } = useApp()
  const list = (investments || []).filter(i => i.active !== false).slice(0, 4)
  const all = (investments || []).filter(i => i.active !== false)
  let total = 0
  all.forEach(i => {
    if (i.type === 'crypto' && i.coinId && cryptoPrices[i.coinId]) total += cryptoPrices[i.coinId] * i.units
    else total += i.purchasePrice || 0
  })

  return (
    <div className="card" style={{ marginBottom: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <span className="section-title" style={{ margin: 0 }}>Inversiones</span>
        <Link to="/inversion" className="btn btn-ghost btn-sm">Ver todo</Link>
      </div>
      {all.length === 0 ? (
        <div style={{ textAlign: 'center', color: 'var(--text3)', fontSize: 13, padding: '8px 0' }}>
          Sin inversiones. <Link to="/inversion" style={{ color: 'var(--accent)', fontWeight: 600 }}>Añadir</Link>
        </div>
      ) : (
        <>
          <div style={{ fontSize: 22, fontWeight: 800, marginBottom: 10 }}>{fmt(total)}€</div>
          {list.map(i => (
            <div key={i.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderTop: '1px solid var(--border)' }}>
              <span style={{ fontSize: 13, fontWeight: 600 }}>{i.symbol} <span style={{ fontWeight: 400, color: 'var(--text2)' }}>{INVESTMENT_TYPE_LABELS[i.type]}</span></span>
              <span style={{ fontSize: 13 }}>{fmt(i.purchasePrice)}€</span>
            </div>
          ))}
        </>
      )}
    </div>
  )
}

function ViviendaCard() {
  const { vivienda } = useApp()
  const remaining = vivienda.yearlyMax - vivienda.yearlyContributed
  const pct = (vivienda.yearlyContributed / vivienda.yearlyMax) * 100
  const monthsLeft = Math.max(1, 12 - new Date().getMonth())
  const suggested = remaining / monthsLeft

  return (
    <div className="card" style={{ marginBottom: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
        <span className="section-title" style={{ margin: 0 }}>Cuenta Vivienda</span>
        <span style={{ color: 'var(--green)', fontSize: 12, fontWeight: 600 }}>{vivienda.annualReturn}% TAE</span>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
        <span style={{ color: 'var(--text2)', fontSize: 12 }}>Saldo total</span>
        <span style={{ fontWeight: 600, color: 'var(--blue)' }}>{fmt(vivienda.currentAmount)}€</span>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
        <span style={{ color: 'var(--text2)', fontSize: 12 }}>Cupo anual</span>
        <span style={{ fontSize: 12, color: 'var(--text2)' }}>{fmt(vivienda.yearlyContributed)} / {fmt(vivienda.yearlyMax)}€</span>
      </div>
      <div className="progress-bar" style={{ marginBottom: 8 }}>
        <div className="progress-fill" style={{ width: `${pct}%`, background: 'var(--blue)' }} />
      </div>
      <div style={{ background: '#eef2fd', borderRadius: 7, padding: '8px 10px', fontSize: 12 }}>
        💡 Te quedan <strong style={{ color: 'var(--accent)' }}>{fmt(remaining)}€</strong> · Mete <strong style={{ color: 'var(--accent)' }}>{fmt(suggested)}€/mes</strong>
      </div>
    </div>
  )
}

const WALLET_META = {
  bank: { label: 'Banco', color: 'var(--blue)', setup: 'Cada mes empieza en 0€. Pulsa «Cobrar nómina» o añade entradas manualmente.' },
  cash: { label: 'Efectivo', color: 'var(--orange)', setup: 'Cada mes empieza en 0€. Añade el efectivo que tengas cuando quieras.' },
}

function CashDepositModal({ onClose }) {
  const { addCashDeposit } = useApp()
  const [amount, setAmount] = useState('')

  const handleSave = () => {
    if (!addCashDeposit(amount)) return
    onClose()
  }

  return (
    <Modal title="Añadir efectivo" onClose={onClose}>
      <p style={{ fontSize: 12, color: 'var(--text2)', lineHeight: 1.5, marginBottom: 14 }}>
        Indica cuánto efectivo tienes. Se sumará a tu cartera de efectivo del mes.
      </p>
      <div className="form-group">
        <label className="form-label">Cantidad (€)</label>
        <input className="form-input" type="number" min="0" step="0.01" placeholder="0.00" value={amount} onChange={e => setAmount(e.target.value)} autoFocus />
      </div>
      <div style={{ display: 'flex', gap: 10 }}>
        <button className="btn btn-ghost" style={{ flex: 1 }} onClick={onClose}>Cancelar</button>
        <button className="btn btn-primary" style={{ flex: 2, background: 'var(--orange)' }} onClick={handleSave}>Añadir</button>
      </div>
    </Modal>
  )
}

function WalletModal({ wallet, onClose }) {
  const {
    bankBalance, cashOnHand,
    bankBalanceMoves, cashBalanceMoves,
    setWalletBalanceExact, adjustWalletBalance, deleteWalletMove,
  } = useApp()
  const balance = wallet === 'cash' ? cashOnHand : bankBalance
  const moves = wallet === 'cash' ? cashBalanceMoves : bankBalanceMoves
  const meta = WALLET_META[wallet]
  const [mode, setMode] = useState('adjust')
  const [amount, setAmount] = useState('')
  const [adjustType, setAdjustType] = useState('deposit')
  const [note, setNote] = useState('')
  const [tab, setTab] = useState('moves')

  const handleSave = () => {
    if (mode === 'set') {
      if (!setWalletBalanceExact(wallet, amount)) return
    } else if (!adjustWalletBalance(wallet, { amount, type: adjustType, note: note.trim() })) return
    setNote('')
    setAmount('')
  }

  const sortedMoves = [...moves].reverse()

  return (
    <Modal title={meta.label} onClose={onClose}>
      <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
        {[['moves', 'Movimientos'], ['config', 'Ajustar']].map(([v, l]) => (
          <button key={v} onClick={() => setTab(v)} style={{ flex: 1, padding: '7px', borderRadius: 8, fontSize: 12, fontWeight: 600, border: '1px solid', borderColor: tab === v ? 'var(--accent)' : 'var(--border)', background: tab === v ? 'var(--accent-light)' : 'transparent', color: tab === v ? 'var(--accent)' : 'var(--text2)' }}>
            {l}
          </button>
        ))}
      </div>

      {tab === 'config' && (
        <>
          <p style={{ fontSize: 12, color: 'var(--text2)', lineHeight: 1.5, marginBottom: 14 }}>{meta.setup}</p>
          <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
            {[['set', 'Fijar saldo'], ['adjust', 'Ajustar']].map(([v, l]) => (
              <button key={v} onClick={() => setMode(v)} style={{ flex: 1, padding: '7px', borderRadius: 8, fontSize: 12, fontWeight: 600, border: '1px solid', borderColor: mode === v ? 'var(--accent)' : 'var(--border)', background: mode === v ? 'var(--accent-light)' : 'transparent', color: mode === v ? 'var(--accent)' : 'var(--text2)' }}>
                {l}
              </button>
            ))}
          </div>
          {mode === 'adjust' && (
            <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
              {[['deposit', '+ Entrada'], ['withdraw', '− Salida']].map(([v, l]) => (
                <button key={v} onClick={() => setAdjustType(v)} style={{ flex: 1, padding: '7px', borderRadius: 8, fontSize: 12, fontWeight: 600, border: '1px solid', borderColor: adjustType === v ? (v === 'deposit' ? 'var(--green)' : 'var(--red)') : 'var(--border)', background: adjustType === v ? (v === 'deposit' ? 'rgba(34,168,90,0.1)' : 'rgba(224,61,61,0.08)') : 'transparent', color: adjustType === v ? (v === 'deposit' ? 'var(--green)' : 'var(--red)') : 'var(--text2)' }}>
                  {l}
                </button>
              ))}
            </div>
          )}
          <div className="form-group">
            <label className="form-label">{mode === 'set' ? 'Saldo actual (€)' : 'Cantidad (€)'}</label>
            <input className="form-input" type="number" step="0.01" placeholder="0.00" value={amount} onChange={e => setAmount(e.target.value)} />
          </div>
          {mode === 'adjust' && (
            <div className="form-group">
              <label className="form-label">Nota (opcional)</label>
              <input className="form-input" placeholder="Ej: Transferencia, cajero…" value={note} onChange={e => setNote(e.target.value)} />
            </div>
          )}
          <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
            <button className="btn btn-ghost" style={{ flex: 1 }} onClick={onClose}>Cerrar</button>
            <button className="btn btn-primary" style={{ flex: 2 }} onClick={handleSave}>Guardar</button>
          </div>
        </>
      )}

      {tab === 'moves' && (
        <>
          <div style={{ fontSize: 12, color: 'var(--text2)', marginBottom: 10 }}>
            Saldo actual: <strong style={{ color: meta.color }}>{fmt(balance)}€</strong>
          </div>
          {sortedMoves.length === 0 ? (
            <div style={{ textAlign: 'center', color: 'var(--text3)', fontSize: 13, padding: '20px 0' }}>Sin movimientos</div>
          ) : (
            <div style={{ maxHeight: 320, overflowY: 'auto' }}>
              {sortedMoves.map(m => {
                const isIn = m.type === 'deposit'
                return (
                  <div key={m.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10, padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 600 }}>
                        {WALLET_MOVE_LABELS[m.category] || m.category}
                        {m.note && <span style={{ fontWeight: 400, color: 'var(--text2)' }}> · {m.note}</span>}
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 2 }}>
                        {format(new Date(m.date), 'd MMM yyyy, HH:mm', { locale: es })}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <div style={{ fontSize: 14, fontWeight: 700, color: isIn ? 'var(--green)' : 'var(--red)' }}>
                        {isIn ? '+' : '−'}{fmt(m.amount)}€
                      </div>
                      <button
                        onClick={() => {
                          if (window.confirm('¿Borrar este movimiento? Se revertirá el saldo.' + (m.transactionId ? ' También se eliminará el apunte en Gastos.' : ''))) {
                            deleteWalletMove(wallet, m.id)
                          }
                        }}
                        style={{ fontSize: 10, color: 'var(--red)', background: 'none', border: 'none', cursor: 'pointer', marginTop: 4 }}
                      >
                        Borrar
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
          {tab === 'moves' && (
            <button className="btn btn-ghost" style={{ width: '100%', marginTop: 12 }} onClick={onClose}>Cerrar</button>
          )}
        </>
      )}
    </Modal>
  )
}

function WalletsCard() {
  const { bankBalance, cashOnHand, income, receivePaycheck, paycheckMonth } = useApp()
  const [modal, setModal] = useState(null)
  const currentMonth = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`
  const paycheckDone = paycheckMonth === currentMonth

  const handlePaycheck = () => {
    const result = receivePaycheck()
    if (result === 'duplicate') {
      if (window.confirm('Ya cobraste la nómina este mes. ¿Registrarla otra vez?')) {
        receivePaycheck(true)
      }
    }
  }

  const total = (bankBalance ?? 0) + (cashOnHand ?? 0)

  const renderWallet = (wallet, balance) => {
    const meta = WALLET_META[wallet]
    return (
      <button type="button" className="hero-tile" onClick={() => setModal(wallet)}>
        <div style={{ color: 'rgba(255,255,255,0.75)', fontSize: 10, fontWeight: 700, letterSpacing: '0.06em', marginBottom: 4 }}>
          {meta.label.toUpperCase()}
        </div>
        <div style={{ fontSize: 20, fontWeight: 700, color: '#fff' }}>{fmt(balance ?? 0)}€</div>
      </button>
    )
  }

  return (
    <>
      <div className="hero-card" style={{ marginBottom: 12 }}>
        <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', marginBottom: 4 }}>
          DINERO DEL MES
        </div>
        <div style={{ fontSize: 32, fontWeight: 800, letterSpacing: '-0.02em', marginBottom: 14 }}>
          {fmt(total)}€
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          {renderWallet('bank', bankBalance)}
          {renderWallet('cash', cashOnHand)}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 12 }}>
          <button
            type="button"
            className="btn"
            style={{
              fontSize: 12,
              background: paycheckDone ? 'rgba(255,255,255,0.16)' : '#fff',
              color: paycheckDone ? 'rgba(255,255,255,0.85)' : 'var(--accent)',
              border: paycheckDone ? '1px solid rgba(255,255,255,0.3)' : 'none',
              fontWeight: 700,
            }}
            onClick={handlePaycheck}
          >
            {paycheckDone ? '✓ Nómina' : `+ Nómina ${fmt(income)}€`}
          </button>
          <button
            type="button"
            className="btn"
            style={{ fontSize: 12, background: 'rgba(255,255,255,0.16)', color: '#fff', border: '1px solid rgba(255,255,255,0.3)', fontWeight: 700 }}
            onClick={() => setModal('cash-deposit')}
          >
            + Efectivo
          </button>
        </div>
        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.65)', marginTop: 12 }}>
          El mes empieza en 0€. Cobra la nómina y añade el efectivo que tengas.
        </div>
      </div>
      {modal === 'cash-deposit' && <CashDepositModal onClose={() => setModal(null)} />}
      {modal === 'bank' || modal === 'cash' ? <WalletModal wallet={modal} onClose={() => setModal(null)} /> : null}
    </>
  )
}

function GoalsCard() {
  const { goals } = useApp()
  const sorted = [...goals]
    .filter(g => (g.savedAmount || 0) < g.targetAmount)
    .sort((a, b) => a.priority - b.priority)
    .slice(0, 4)

  if (goals.length === 0) {
    return (
      <div className="card" style={{ marginBottom: 12 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <span className="section-title" style={{ margin: 0 }}>Metas de ahorro</span>
          <Link to="/metas" className="btn btn-ghost btn-sm">+ Nueva</Link>
        </div>
        <div style={{ textAlign: 'center', color: 'var(--text3)', fontSize: 13, padding: '12px 0' }}>
          Sin metas activas. <Link to="/metas" style={{ color: 'var(--accent)', fontWeight: 600 }}>Crea una</Link>
        </div>
      </div>
    )
  }

  return (
    <div className="card" style={{ marginBottom: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <span className="section-title" style={{ margin: 0 }}>Metas de ahorro</span>
        <Link to="/metas" className="btn btn-ghost btn-sm">Ver todas</Link>
      </div>
      {sorted.map((goal, i) => {
        const pct = Math.min(100, ((goal.savedAmount || 0) / goal.targetAmount) * 100)
        const pc = GOAL_PRIORITY_COLORS[goal.priority] || 'var(--accent)'
        let daysLeft = null
        try { daysLeft = differenceInDays(parseISO(goal.deadline), new Date()) } catch { /* ignore */ }
        const monthly = daysLeft && daysLeft > 0
          ? Math.max(0, (goal.targetAmount - (goal.savedAmount || 0)) / Math.max(1, Math.ceil(daysLeft / 30)))
          : null

        return (
          <div key={goal.id} style={{ marginBottom: i < sorted.length - 1 ? 12 : 0, paddingBottom: i < sorted.length - 1 ? 12 : 0, borderBottom: i < sorted.length - 1 ? '1px solid var(--border)' : 'none' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
                <span style={{ fontSize: 18 }}>{goal.icon}</span>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: 13, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{goal.name}</div>
                  {monthly !== null && (
                    <div style={{ fontSize: 10, color: 'var(--text3)' }}>{fmt(monthly)}€/mes · {daysLeft} días</div>
                  )}
                </div>
              </div>
              <div style={{ textAlign: 'right', flexShrink: 0, marginLeft: 8 }}>
                <div style={{ fontSize: 13, fontWeight: 600 }}>{fmt(goal.savedAmount || 0)}€</div>
                <div style={{ fontSize: 10, color: 'var(--text3)' }}>de {fmt(goal.targetAmount)}€</div>
              </div>
            </div>
            <div className="progress-bar">
              <div className="progress-fill" style={{ width: `${pct}%`, background: pc }} />
            </div>
          </div>
        )
      })}
      {goals.filter(g => (g.savedAmount || 0) >= g.targetAmount).length > 0 && (
        <div style={{ fontSize: 11, color: 'var(--green)', marginTop: 10, fontWeight: 600 }}>
          ✓ {goals.filter(g => (g.savedAmount || 0) >= g.targetAmount).length} meta(s) completada(s)
        </div>
      )}
    </div>
  )
}

export default function Dashboard() {
  const { income, transactions, getMonthlyObligations, categories, bankBalance, cashOnHand } = useApp()
  const obligations = getMonthlyObligations()
  const bank = bankBalance ?? 0
  const cash = cashOnHand ?? 0
  const available = bank
  const now = new Date()

  const monthTx = transactions.filter(t => {
    const d = new Date(t.date)
    return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth() && t.type === 'expense'
  })
  const remaining = bank + cash

  const catSpend = {}
  monthTx.forEach(t => { catSpend[t.category] = (catSpend[t.category] || 0) + t.amount })
  const pieData = Object.entries(catSpend).map(([catId, value]) => {
    const cat = categories.find(c => c.id === catId)
    return { name: cat?.name || catId, value, color: cat?.color || '#aaa' }
  }).filter(d => d.value > 0)

  return (
    <div className="page">
      <div className="page-header page-header--row">
        <h1 className="page-title">Patrimonio</h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span className="page-header-meta">
            {now.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}
          </span>
          <ThemeToggle />
        </div>
      </div>

      <WalletsCard />

      {/* Summary cards */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 12 }}>
        {[
          { icon: '💼', label: 'NÓMINA', value: income, color: 'var(--green)' },
          { icon: '📌', label: 'OBLIGACIONES', value: obligations, color: 'var(--red)' },
          { icon: '🏦', label: 'DISPONIBLE', value: available, color: available >= 0 ? 'var(--blue)' : 'var(--red)' },
          { icon: '💶', label: 'TOTAL (BANCO + EFECTIVO)', value: remaining, color: remaining >= 0 ? 'var(--accent)' : 'var(--red)' },
        ].map((s, i) => (
          <div key={i} className="card-sm" style={{ borderLeft: `3px solid ${s.color}` }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, color: 'var(--text3)', fontSize: 9.5, fontWeight: 700, letterSpacing: '0.04em', marginBottom: 4 }}>
              <span style={{ fontSize: 12 }}>{s.icon}</span>
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.label}</span>
            </div>
            <div style={{ fontSize: 18, fontWeight: 700, color: s.color }}>{fmt(s.value)}€</div>
          </div>
        ))}
      </div>

      <GoalsCard />

      {/* Pie chart */}
      {pieData.length > 0 ? (
        <div className="card" style={{ marginBottom: 12 }}>
          <span className="section-title">Gasto este mes por categoría</span>
          <div className="chart-wrap">
          <ResponsiveContainer width="100%" height={170}>
            <PieChart>
              <Pie data={pieData} cx="50%" cy="50%" innerRadius={48} outerRadius={74} dataKey="value" paddingAngle={2}>
                {pieData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
              </Pie>
              <Tooltip formatter={v => `${fmt(v)}€`} contentStyle={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12 }} />
            </PieChart>
          </ResponsiveContainer>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {pieData.map((d, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11 }}>
                <div style={{ width: 7, height: 7, borderRadius: 2, background: d.color }} />
                <span style={{ color: 'var(--text2)' }}>{d.name}:</span>
                <span>{fmt(d.value)}€</span>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="card" style={{ marginBottom: 12, textAlign: 'center', padding: '20px 14px' }}>
          <div style={{ fontSize: 22, marginBottom: 6 }}>📊</div>
          <div style={{ color: 'var(--text3)', fontSize: 13 }}>Sin gastos este mes.<br />Ve a <strong>Gastos</strong> para añadir.</div>
        </div>
      )}

      <ViviendaCard />
      <InvestmentsPreview />
    </div>
  )
}
