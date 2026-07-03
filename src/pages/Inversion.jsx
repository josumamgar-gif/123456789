import React, { useState } from 'react'
import { useApp } from '../context/AppContext'
import Modal from '../components/Modal'
import { INVESTMENT_TYPES, INVESTMENT_TYPE_LABELS } from '../data/defaults'

const fmt = (n) => n.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

const TYPE_COLORS = {
  crypto: 'var(--blue)',
  stock: 'var(--green)',
  fund: 'var(--accent)',
}

function InvestmentModal({ item, onClose }) {
  const { setInvestments } = useApp()
  const isEdit = !!item
  const [type, setType] = useState(item?.type || 'crypto')
  const [symbol, setSymbol] = useState(item?.symbol || '')
  const [name, setName] = useState(item?.name || '')
  const [units, setUnits] = useState(item?.units ?? '')
  const [purchasePrice, setPurchasePrice] = useState(item?.purchasePrice ?? '')
  const [coinId, setCoinId] = useState(item?.coinId || '')

  const handleSave = () => {
    if (!symbol || !name || !units || !purchasePrice) return
    const data = {
      type,
      symbol: symbol.toUpperCase(),
      name,
      units: parseFloat(units),
      purchasePrice: parseFloat(purchasePrice),
      coinId: type === 'crypto' ? (coinId || symbol.toLowerCase()) : '',
      active: true,
    }
    if (isEdit) {
      setInvestments(prev => (prev || []).map(i => i.id === item.id ? { ...i, ...data } : i))
    } else {
      setInvestments(prev => [...(prev || []), { ...data, id: `${Date.now()}-${Math.random().toString(36).slice(2, 6)}` }])
    }
    onClose()
  }

  return (
    <Modal title={isEdit ? 'Editar inversión' : 'Nueva inversión'} onClose={onClose}>
      <div className="type-picker">
        {INVESTMENT_TYPES.map(t => (
          <button
            key={t.id}
            type="button"
            className={`type-picker-btn${type === t.id ? ' active' : ''}`}
            onClick={() => setType(t.id)}
          >
            <span>{t.icon}</span> {t.label}
          </button>
        ))}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 10 }}>
        <div className="form-group">
          <label className="form-label">Símbolo</label>
          <input className="form-input" placeholder="BTC" value={symbol} onChange={e => setSymbol(e.target.value)} />
        </div>
        <div className="form-group">
          <label className="form-label">Nombre</label>
          <input className="form-input" placeholder="Bitcoin" value={name} onChange={e => setName(e.target.value)} />
        </div>
      </div>
      {type === 'crypto' && (
        <div className="form-group">
          <label className="form-label">ID CoinGecko (precio auto)</label>
          <input className="form-input" placeholder="bitcoin" value={coinId} onChange={e => setCoinId(e.target.value)} />
        </div>
      )}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <div className="form-group">
          <label className="form-label">{type === 'crypto' ? 'Unidades' : 'Participaciones'}</label>
          <input className="form-input" type="number" step="any" placeholder="0" value={units} onChange={e => setUnits(e.target.value)} />
        </div>
        <div className="form-group">
          <label className="form-label">Invertido (€)</label>
          <input className="form-input" type="number" step="0.01" placeholder="0.00" value={purchasePrice} onChange={e => setPurchasePrice(e.target.value)} />
        </div>
      </div>
      <div style={{ display: 'flex', gap: 10 }}>
        <button className="btn btn-ghost" style={{ flex: 1 }} onClick={onClose}>Cancelar</button>
        <button className="btn btn-primary" style={{ flex: 2 }} onClick={handleSave}>Guardar</button>
      </div>
    </Modal>
  )
}

export default function Inversion() {
  const { investments, setInvestments, cryptoPrices, setCryptoPrices } = useApp()
  const list = (investments || []).filter(i => i.active !== false)
  const [modal, setModal] = useState(null)
  const [loading, setLoading] = useState(false)
  const [filter, setFilter] = useState('all')

  const fetchPrices = async () => {
    const cryptoItems = list.filter(i => i.type === 'crypto' && i.coinId)
    if (!cryptoItems.length) return
    setLoading(true)
    try {
      const ids = [...new Set(cryptoItems.map(i => i.coinId))].join(',')
      const res = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=eur`)
      const data = await res.json()
      const prices = {}
      cryptoItems.forEach(i => { if (data[i.coinId]) prices[i.coinId] = data[i.coinId].eur })
      setCryptoPrices({ ...cryptoPrices, ...prices, updatedAt: new Date().toISOString() })
    } catch { /* silent */ }
    setLoading(false)
  }

  const filtered = filter === 'all' ? list : list.filter(i => i.type === filter)

  let totalInvested = 0
  let totalCurrent = 0
  list.forEach(i => {
    totalInvested += i.purchasePrice || 0
    if (i.type === 'crypto' && i.coinId && cryptoPrices[i.coinId]) {
      totalCurrent += cryptoPrices[i.coinId] * i.units
    } else {
      totalCurrent += i.purchasePrice || 0
    }
  })
  const totalDiff = totalCurrent - totalInvested

  return (
    <div className="page">
      <div className="page-header page-header--row">
        <h1 className="page-title">Inversión</h1>
        <button className="btn btn-primary btn-sm" onClick={() => setModal('add')}>+ Añadir</button>
      </div>

      <div className="invest-hero card">
        <div style={{ color: 'var(--text3)', fontSize: 10, fontWeight: 700, letterSpacing: '0.06em' }}>PORTFOLIO</div>
        <div style={{ fontSize: 28, fontWeight: 800, margin: '4px 0 12px' }}>{fmt(totalCurrent)}€</div>
        <div style={{ display: 'flex', gap: 16, fontSize: 12 }}>
          <span style={{ color: 'var(--text2)' }}>Invertido: {fmt(totalInvested)}€</span>
          <span style={{ color: totalDiff >= 0 ? 'var(--green)' : 'var(--red)', fontWeight: 700 }}>
            {totalDiff >= 0 ? '+' : ''}{fmt(totalDiff)}€
          </span>
        </div>
        {list.some(i => i.type === 'crypto' && i.coinId) && (
          <button className="btn btn-ghost btn-sm" style={{ marginTop: 12, width: '100%' }} onClick={fetchPrices} disabled={loading}>
            {loading ? 'Actualizando…' : '↻ Actualizar precios cripto'}
          </button>
        )}
      </div>

      <div className="filter-pills">
        {[['all', 'Todo'], ...INVESTMENT_TYPES.map(t => [t.id, t.label])].map(([v, l]) => (
          <button key={v} type="button" className={`filter-pill${filter === v ? ' active' : ''}`} onClick={() => setFilter(v)}>
            {l}
          </button>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="empty-state card">
          <div className="empty-state-icon">📊</div>
          <p>Sin inversiones. Añade cripto, acciones o fondos.</p>
        </div>
      )}

      {filtered.map(item => {
        const price = item.type === 'crypto' && item.coinId ? cryptoPrices[item.coinId] : null
        const current = price ? price * item.units : item.purchasePrice
        const diff = current - item.purchasePrice
        const pct = item.purchasePrice ? (diff / item.purchasePrice) * 100 : 0
        const color = TYPE_COLORS[item.type] || 'var(--accent)'

        return (
          <div key={item.id} className="invest-row card">
            <div className="invest-row-left">
              <div className="invest-badge" style={{ background: color + '18', color }}>{item.symbol}</div>
              <div>
                <div style={{ fontWeight: 700, fontSize: 14 }}>{item.name}</div>
                <div style={{ fontSize: 11, color: 'var(--text3)' }}>
                  {INVESTMENT_TYPE_LABELS[item.type]} · {item.units} u · inv. {fmt(item.purchasePrice)}€
                </div>
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontWeight: 700, fontSize: 15 }}>{fmt(current)}€</div>
              {price && (
                <div style={{ fontSize: 11, color: diff >= 0 ? 'var(--green)' : 'var(--red)' }}>
                  {diff >= 0 ? '+' : ''}{fmt(diff)}€ ({pct >= 0 ? '+' : ''}{pct.toFixed(1)}%)
                </div>
              )}
              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 4 }}>
                <button type="button" className="text-btn" onClick={() => setModal({ type: 'edit', item })}>Editar</button>
                <button type="button" className="text-btn text-btn--muted" onClick={() => setInvestments(prev => (prev || []).filter(x => x.id !== item.id))}>Eliminar</button>
              </div>
            </div>
          </div>
        )
      })}

      {modal === 'add' && <InvestmentModal item={null} onClose={() => setModal(null)} />}
      {modal?.type === 'edit' && <InvestmentModal item={modal.item} onClose={() => setModal(null)} />}
    </div>
  )
}
