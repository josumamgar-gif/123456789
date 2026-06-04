import React, { useState } from 'react'
import { useApp } from '../context/AppContext'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts'
import { INVESTMENT_RECS } from '../data/defaults'

const fmt = (n) => n.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

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
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <span className="section-title" style={{ margin: 0 }}>Cripto</span>
        <div style={{ display: 'flex', gap: 8 }}>
          {crypto.length > 0 && (
            <button className="btn btn-ghost" style={{ padding: '5px 10px', fontSize: 11 }} onClick={fetchPrices} disabled={loading}>
              {loading ? '…' : '↻ Precios'}
            </button>
          )}
          <button className="btn btn-ghost" style={{ padding: '5px 10px', fontSize: 11 }} onClick={() => setModal('add')}>+ Añadir</button>
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
      <div className="page-header">
        <h1 className="page-title">Patrimonio</h1>
        <span style={{ color: 'var(--text3)', fontSize: 12 }}>
          {now.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}
        </span>
      </div>

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

      {/* Pie chart */}
      {pieData.length > 0 ? (
        <div className="card" style={{ marginBottom: 12 }}>
          <span className="section-title">Gasto este mes por categoría</span>
          <ResponsiveContainer width="100%" height={170}>
            <PieChart>
              <Pie data={pieData} cx="50%" cy="50%" innerRadius={48} outerRadius={74} dataKey="value" paddingAngle={2}>
                {pieData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
              </Pie>
              <Tooltip formatter={v => `${fmt(v)}€`} contentStyle={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12 }} />
            </PieChart>
          </ResponsiveContainer>
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
