import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts'
import { format, differenceInDays, parseISO } from 'date-fns'
import { es } from 'date-fns/locale'
import { INVESTMENT_RECS, WALLET_MOVE_LABELS } from '../data/defaults'

const fmt = (n) => n.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
const GOAL_PRIORITY_COLORS = { 1: 'var(--red)', 2: 'var(--orange)', 3: 'var(--yellow)', 4: 'var(--blue)', 5: 'var(--text2)' }

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

function CryptoModal({ asset, onClose }) {
  const { crypto, setCrypto } = useApp()
  const isEdit = !!asset
  const [symbol, setSymbol] = useState(asset?.symbol || '')
  const [coinId, setCoinId] = useState(asset?.coinId || '')
  const [name, setName] = useState(asset?.name || '')
  const [units, setUnits] = useState(asset?.units || '')
  const [purchasePrice, setPurchasePrice] = useState(asset?.purchasePrice || '')

  const handleSave = () => {
    if (!symbol || !coinId || !units || !purchasePrice) return
    const data = { symbol: symbol.toUpperCase(), coinId, name, units: parseFloat(units), purchasePrice: parseFloat(purchasePrice), active: true }
    if (isEdit) {
      setCrypto(prev => prev.map(c => c.id === asset.id ? { ...c, ...data } : c))
    } else {
      setCrypto(prev => [...prev, { id: Date.now().toString(), ...data }])
    }
    onClose()
  }

  return (
    <Modal title={isEdit ? 'Editar activo' : 'Añadir activo cripto'} onClose={onClose}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <div className="form-group">
          <label className="form-label">Símbolo</label>
          <input className="form-input" placeholder="ETH" value={symbol} onChange={e => setSymbol(e.target.value)} />
        </div>
        <div className="form-group">
          <label className="form-label">ID CoinGecko</label>
          <input className="form-input" placeholder="ethereum" value={coinId} onChange={e => setCoinId(e.target.value)} />
        </div>
      </div>
      <div className="form-group">
        <label className="form-label">Nombre</label>
        <input className="form-input" placeholder="Ethereum" value={name} onChange={e => setName(e.target.value)} />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <div className="form-group">
          <label className="form-label">Unidades</label>
          <input className="form-input" type="number" step="0.0001" placeholder="0.195" value={units} onChange={e => setUnits(e.target.value)} />
        </div>
        <div className="form-group">
          <label className="form-label">Precio compra €</label>
          <input className="form-input" type="number" step="0.01" placeholder="1947.68" value={purchasePrice} onChange={e => setPurchasePrice(e.target.value)} />
        </div>
      </div>
      <div style={{ display: 'flex', gap: 10 }}>
        <button className="btn btn-ghost" style={{ flex: 1 }} onClick={onClose}>Cancelar</button>
        <button className="btn btn-primary" style={{ flex: 2 }} onClick={handleSave}>Guardar</button>
      </div>
    </Modal>
  )
}

function CryptoCard() {
  const { crypto, setCrypto, cryptoPrices, setCryptoPrices } = useApp()
  const [loading, setLoading] = useState(false)
  const [modal, setModal] = useState(null) // null | 'add' | {type:'edit',c}

  const fetchPrices = async () => {
    if (!crypto.length) return
    setLoading(true)
    try {
      const ids = crypto.filter(c => c.active).map(c => c.coinId).join(',')
      const res = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=eur`)
      const data = await res.json()
      const prices = {}
      crypto.forEach(c => { if (data[c.coinId]) prices[c.coinId] = data[c.coinId].eur })
      setCryptoPrices({ ...cryptoPrices, ...prices, updatedAt: new Date().toISOString() })
    } catch { alert('No se pudo obtener precio.') }
    setLoading(false)
  }

  return (
    <div className="card" style={{ marginBottom: 12 }}>
      <div className="card-header-row">
        <span className="section-title" style={{ margin: 0 }}>Cripto</span>
        <div className="page-header-actions page-header-actions--2">
          {crypto.length > 0 && (
            <button className="btn btn-ghost btn-sm" onClick={fetchPrices} disabled={loading}>
              {loading ? '…' : '↻ Precios'}
            </button>
          )}
          <button className="btn btn-ghost btn-sm" onClick={() => setModal('add')}>+ Añadir</button>
        </div>
      </div>

      {crypto.length === 0 && (
        <div style={{ color: 'var(--text3)', fontSize: 12, textAlign: 'center', padding: '12px 0' }}>Sin activos. Pulsa + Añadir.</div>
      )}

      {crypto.filter(c => c.active).map(c => {
        const currentPrice = cryptoPrices[c.coinId]
        const currentValue = currentPrice ? currentPrice * c.units : null
        const diff = currentValue ? currentValue - c.purchasePrice : null
        const pct = diff !== null ? (diff / c.purchasePrice) * 100 : null
        return (
          <div key={c.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '9px 0', borderBottom: '1px solid var(--border)' }}>
            <div>
              <div style={{ fontWeight: 700, fontSize: 14 }}>{c.symbol} <span style={{ fontWeight: 400, color: 'var(--text2)', fontSize: 12 }}>{c.name}</span></div>
              <div style={{ color: 'var(--text3)', fontSize: 11 }}>{c.units} u · inv. {fmt(c.purchasePrice)}€</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              {currentValue !== null ? (
                <>
                  <div style={{ fontWeight: 600, fontSize: 14 }}>{fmt(currentValue)}€</div>
                  <div style={{ fontSize: 11, color: diff >= 0 ? 'var(--green)' : 'var(--red)' }}>
                    {diff >= 0 ? '+' : ''}{fmt(diff)}€ ({pct >= 0 ? '+' : ''}{pct.toFixed(1)}%)
                  </div>
                </>
              ) : (
                <span style={{ color: 'var(--text3)', fontSize: 11 }}>Sin precio</span>
              )}
              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 3 }}>
                <button onClick={() => setModal({ type: 'edit', c })} style={{ fontSize: 10, color: 'var(--accent)', background: 'none', border: 'none', cursor: 'pointer' }}>✏️ Editar</button>
                <button onClick={() => setCrypto(prev => prev.filter(x => x.id !== c.id))} style={{ fontSize: 10, color: 'var(--text3)', background: 'none', border: 'none', cursor: 'pointer' }}>Eliminar</button>
              </div>
            </div>
          </div>
        )
      })}

      {cryptoPrices.updatedAt && (
        <div style={{ color: 'var(--text3)', fontSize: 10, marginTop: 8 }}>
          Actualizado: {new Date(cryptoPrices.updatedAt).toLocaleTimeString('es-ES')}
        </div>
      )}

      {modal === 'add'           && <CryptoModal asset={null}    onClose={() => setModal(null)} />}
      {modal?.type === 'edit'    && <CryptoModal asset={modal.c} onClose={() => setModal(null)} />}
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
  bank: { label: 'Banco', color: 'var(--blue)', setup: 'Indica el saldo real de tu cuenta. Los apuntes pagados con banco se descontarán de aquí.' },
  cash: { label: 'Efectivo', color: 'var(--orange)', setup: 'Indica cuánto efectivo llevas encima. Los apuntes pagados en efectivo se descontarán de aquí.' },
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
  const isFirstSetup = balance === null
  const [mode, setMode] = useState(isFirstSetup ? 'set' : 'adjust')
  const [amount, setAmount] = useState(isFirstSetup ? '' : String(balance ?? ''))
  const [adjustType, setAdjustType] = useState('deposit')
  const [note, setNote] = useState('')
  const [tab, setTab] = useState(isFirstSetup ? 'config' : 'moves')

  const handleSave = () => {
    if (mode === 'set') {
      if (!setWalletBalanceExact(wallet, amount)) return
    } else if (!adjustWalletBalance(wallet, { amount, type: adjustType, note: note.trim() })) return
    setNote('')
    if (isFirstSetup) setTab('moves')
    else setAmount(String((wallet === 'cash' ? cashOnHand : bankBalance) ?? ''))
  }

  const sortedMoves = [...moves].reverse()

  return (
    <Modal title={isFirstSetup ? `Configurar ${meta.label.toLowerCase()}` : meta.label} onClose={onClose}>
      {!isFirstSetup && (
        <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
          {[['moves', 'Movimientos'], ['config', 'Ajustar']].map(([v, l]) => (
            <button key={v} onClick={() => setTab(v)} style={{ flex: 1, padding: '7px', borderRadius: 8, fontSize: 12, fontWeight: 600, border: '1px solid', borderColor: tab === v ? 'var(--accent)' : 'var(--border)', background: tab === v ? 'var(--accent-light)' : 'transparent', color: tab === v ? 'var(--accent)' : 'var(--text2)' }}>
              {l}
            </button>
          ))}
        </div>
      )}

      {(tab === 'config' || isFirstSetup) && (
        <>
          <p style={{ fontSize: 12, color: 'var(--text2)', lineHeight: 1.5, marginBottom: 14 }}>{meta.setup}</p>
          {!isFirstSetup && (
            <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
              {[['set', 'Fijar saldo'], ['adjust', 'Ajustar']].map(([v, l]) => (
                <button key={v} onClick={() => setMode(v)} style={{ flex: 1, padding: '7px', borderRadius: 8, fontSize: 12, fontWeight: 600, border: '1px solid', borderColor: mode === v ? 'var(--accent)' : 'var(--border)', background: mode === v ? 'var(--accent-light)' : 'transparent', color: mode === v ? 'var(--accent)' : 'var(--text2)' }}>
                  {l}
                </button>
              ))}
            </div>
          )}
          {mode === 'adjust' && !isFirstSetup && (
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
          {mode === 'adjust' && !isFirstSetup && (
            <div className="form-group">
              <label className="form-label">Nota (opcional)</label>
              <input className="form-input" placeholder="Ej: Nómina, cajero…" value={note} onChange={e => setNote(e.target.value)} />
            </div>
          )}
          <div style={{ display: 'flex', gap: 10, marginBottom: tab === 'moves' ? 16 : 0 }}>
            <button className="btn btn-ghost" style={{ flex: 1 }} onClick={onClose}>Cerrar</button>
            <button className="btn btn-primary" style={{ flex: 2 }} onClick={handleSave}>Guardar</button>
          </div>
        </>
      )}

      {tab === 'moves' && !isFirstSetup && (
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
  const { bankBalance, cashOnHand } = useApp()
  const [modal, setModal] = useState(null)

  const renderWallet = (wallet, balance) => {
    const meta = WALLET_META[wallet]
    return (
      <button
        type="button"
        onClick={() => setModal(wallet)}
        style={{
          textAlign: 'left',
          background: balance === null ? 'var(--bg3)' : meta.color + '10',
          border: `1px solid ${balance === null ? 'var(--border)' : meta.color + '40'}`,
          borderRadius: 10,
          padding: '12px 14px',
          cursor: 'pointer',
        }}
      >
        <div style={{ color: 'var(--text3)', fontSize: 10, marginBottom: 4 }}>{meta.label.toUpperCase()}</div>
        {balance === null ? (
          <div style={{ fontSize: 12, color: 'var(--text2)' }}>Configurar</div>
        ) : (
          <div style={{ fontSize: 20, fontWeight: 700, color: balance >= 0 ? meta.color : 'var(--red)' }}>{fmt(balance)}€</div>
        )}
      </button>
    )
  }

  return (
    <>
      <div className="card" style={{ marginBottom: 12 }}>
        <div style={{ color: 'var(--text3)', fontSize: 10, marginBottom: 10 }}>DINERO DISPONIBLE</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          {renderWallet('bank', bankBalance)}
          {renderWallet('cash', cashOnHand)}
        </div>
        <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 10 }}>
          Pulsa cada cartera para ajustar el saldo o ver y borrar movimientos
        </div>
      </div>
      {modal && <WalletModal wallet={modal} onClose={() => setModal(null)} />}
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

function DebtCard() {
  const { debts } = useApp()
  const now = new Date()
  const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  const loan = debts.find(d => d.id === 'prestamo')
  const pct = loan ? (loan.paid / loan.totalAmount) * 100 : 0
  const activeAplazados = debts.filter(d => d.type === 'aplazado' && d.months?.includes(month))

  if (!loan && !activeAplazados.length) return null

  return (
    <div className="card" style={{ marginBottom: 12 }}>
      <span className="section-title">Deudas activas</span>
      {loan && (
        <div style={{ marginBottom: 10 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
            <span style={{ fontSize: 13 }}>{loan.name}</span>
            <span style={{ fontSize: 13, color: 'var(--red)', fontWeight: 600 }}>-{fmt(loan.monthlyQuota)}€/mes</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
            <span style={{ color: 'var(--text3)', fontSize: 11 }}>Pagado: {fmt(loan.paid || 0)}€ de {fmt(loan.totalAmount)}€</span>
            <span style={{ color: 'var(--text3)', fontSize: 11 }}>Vence {loan.endDate}</span>
          </div>
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: `${pct}%`, background: 'var(--accent)' }} />
          </div>
        </div>
      )}
      {activeAplazados.map(d => (
        <div key={d.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderTop: '1px solid var(--border)' }}>
          <span style={{ fontSize: 13 }}>{d.name}</span>
          <span style={{ fontSize: 13, color: 'var(--red)', fontWeight: 600 }}>-{fmt(d.monthlyQuota)}€</span>
        </div>
      ))}
    </div>
  )
}

export default function Dashboard() {
  const { income, transactions, getMonthlyObligations, categories } = useApp()
  const obligations = getMonthlyObligations()
  const available = income - obligations
  const now = new Date()

  const monthTx = transactions.filter(t => {
    const d = new Date(t.date)
    return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth() && t.type === 'expense'
  })
  const monthSpend = monthTx.reduce((s, t) => s + t.amount, 0)
  const remaining = available - monthSpend

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
        <span className="page-header-meta">
          {now.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}
        </span>
      </div>

      <WalletsCard />

      {/* Summary cards */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 12 }}>
        <div className="card-sm" style={{ borderLeft: '3px solid var(--green)' }}>
          <div style={{ color: 'var(--text3)', fontSize: 10, marginBottom: 3 }}>NÓMINA</div>
          <div style={{ fontSize: 17, fontWeight: 600, color: 'var(--green)' }}>{fmt(income)}€</div>
        </div>
        <div className="card-sm" style={{ borderLeft: '3px solid var(--red)' }}>
          <div style={{ color: 'var(--text3)', fontSize: 10, marginBottom: 3 }}>OBLIGACIONES</div>
          <div style={{ fontSize: 17, fontWeight: 600, color: 'var(--red)' }}>{fmt(obligations)}€</div>
        </div>
        <div className="card-sm" style={{ borderLeft: '3px solid var(--accent)' }}>
          <div style={{ color: 'var(--text3)', fontSize: 10, marginBottom: 3 }}>DISPONIBLE</div>
          <div style={{ fontSize: 17, fontWeight: 600, color: 'var(--accent)' }}>{fmt(available)}€</div>
        </div>
        <div className="card-sm" style={{ borderLeft: `3px solid ${remaining >= 0 ? 'var(--blue)' : 'var(--red)'}` }}>
          <div style={{ color: 'var(--text3)', fontSize: 10, marginBottom: 3 }}>LIBRE HOY</div>
          <div style={{ fontSize: 17, fontWeight: 600, color: remaining >= 0 ? 'var(--blue)' : 'var(--red)' }}>{fmt(remaining)}€</div>
        </div>
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
      <DebtCard />
      <CryptoCard />

      {/* Investment recommendations */}
      <div className="card">
        <span className="section-title">Activos recomendados</span>
        {INVESTMENT_RECS.map((r, i) => (
          <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: i < INVESTMENT_RECS.length - 1 ? '1px solid var(--border)' : 'none' }}>
            <div>
              <div style={{ fontWeight: 600, fontSize: 13 }}>{r.symbol} <span style={{ fontWeight: 400, color: 'var(--text2)', fontSize: 12 }}>— {r.name}</span></div>
              <div style={{ color: 'var(--text3)', fontSize: 11 }}>{r.reason}</div>
            </div>
            <span style={{ fontSize: 10, padding: '3px 7px', borderRadius: 4, fontWeight: 600,
              background: r.risk === 'bajo' ? '#e8f7ee' : r.risk === 'medio' ? '#fdf5e3' : '#fdeaea',
              color: r.risk === 'bajo' ? 'var(--green)' : r.risk === 'medio' ? 'var(--yellow)' : 'var(--red)' }}>
              {r.risk.toUpperCase()}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
