import React, { useState } from 'react'
import { useApp } from '../context/AppContext'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { TX_PAYMENT_METHODS, TX_PAYMENT_LABELS } from '../data/defaults'

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

function TransactionModal({ tx, onClose }) {
  const { categories, addTransaction, updateTransaction } = useApp()
  const isEdit = !!tx
  const [type, setType] = useState(tx?.type || 'expense')
  const [amount, setAmount] = useState(tx?.amount || '')
  const [description, setDescription] = useState(tx?.description || '')
  const [category, setCategory] = useState(tx?.category || categories[0]?.id || '')
  const [date, setDate] = useState(tx?.date || new Date().toISOString().split('T')[0])
  const [paymentMethod, setPaymentMethod] = useState(tx?.paymentMethod || 'bank')

  const handleSave = () => {
    if (!amount || !description) return
    const data = {
      type,
      amount: parseFloat(amount),
      description,
      category: type === 'expense' ? category : '',
      date,
      paymentMethod,
    }
    if (isEdit) {
      updateTransaction(tx.id, data)
    } else {
      addTransaction(data)
    }
    onClose()
  }

  return (
    <Modal title={isEdit ? 'Editar apunte' : 'Añadir apunte'} onClose={onClose}>
      <div style={{ display: 'flex', background: 'var(--bg3)', borderRadius: 8, padding: 3, gap: 3, marginBottom: 14 }}>
        {['expense', 'income'].map(t => (
          <button key={t} onClick={() => setType(t)} style={{ flex: 1, padding: '8px', borderRadius: 6, fontSize: 13, fontWeight: 600, border: 'none', transition: 'all 0.12s', background: type === t ? (t === 'expense' ? 'var(--red)' : 'var(--green)') : 'transparent', color: type === t ? '#fff' : 'var(--text3)' }}>
            {t === 'expense' ? 'Gasto' : 'Ingreso extra'}
          </button>
        ))}
      </div>
      <div className="form-group">
        <label className="form-label">Descripción</label>
        <input className="form-input" placeholder="Ej: Gafas, gasolina…" value={description} onChange={e => setDescription(e.target.value)} />
      </div>
      <div className="form-group">
        <label className="form-label">Importe (€)</label>
        <input className="form-input" type="number" min="0" step="0.01" placeholder="0.00" value={amount} onChange={e => setAmount(e.target.value)} />
      </div>
      {type === 'expense' && (
        <div className="form-group">
          <label className="form-label">Categoría</label>
          <select className="form-input" value={category} onChange={e => setCategory(e.target.value)}>
            {categories.map(c => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
          </select>
        </div>
      )}
      <div className="form-group">
        <label className="form-label">Pagado con</label>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          {TX_PAYMENT_METHODS.map(pm => (
            <button
              key={pm}
              type="button"
              onClick={() => setPaymentMethod(pm)}
              style={{
                padding: '10px',
                borderRadius: 8,
                fontSize: 13,
                fontWeight: 700,
                border: '1px solid',
                borderColor: paymentMethod === pm ? (pm === 'bank' ? 'var(--blue)' : 'var(--orange)') : 'var(--border)',
                background: paymentMethod === pm ? (pm === 'bank' ? 'rgba(10,138,173,0.1)' : 'rgba(212,96,10,0.1)') : 'transparent',
                color: paymentMethod === pm ? (pm === 'bank' ? 'var(--blue)' : 'var(--orange)') : 'var(--text3)',
              }}
            >
              {TX_PAYMENT_LABELS[pm]}
            </button>
          ))}
        </div>
      </div>
      <div className="form-group">
        <label className="form-label">Fecha</label>
        <input className="form-input" type="date" value={date} onChange={e => setDate(e.target.value)} />
      </div>
      <div style={{ display: 'flex', gap: 10 }}>
        <button className="btn btn-ghost" style={{ flex: 1 }} onClick={onClose}>Cancelar</button>
        <button className="btn btn-primary" style={{ flex: 2 }} onClick={handleSave}>Guardar</button>
      </div>
    </Modal>
  )
}

function CategoryModal({ cat, onClose }) {
  const { categories, setCategories } = useApp()
  const isEdit = !!cat
  const [name, setName] = useState(cat?.name || '')
  const [icon, setIcon] = useState(cat?.icon || '📦')
  const [color, setColor] = useState(cat?.color || '#3b6ff0')

  const handleSave = () => {
    if (!name) return
    if (isEdit) {
      setCategories(prev => prev.map(c => c.id === cat.id ? { ...c, name, icon, color } : c))
    } else {
      const id = name.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '')
      setCategories(prev => [...prev, { id, name, icon, color }])
    }
    onClose()
  }

  return (
    <Modal title={isEdit ? 'Editar categoría' : 'Nueva categoría'} onClose={onClose}>
      <div className="form-group">
        <label className="form-label">Nombre</label>
        <input className="form-input" placeholder="Ej: Deportes" value={name} onChange={e => setName(e.target.value)} />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <div className="form-group">
          <label className="form-label">Emoji</label>
          <input className="form-input" value={icon} onChange={e => setIcon(e.target.value)} />
        </div>
        <div className="form-group">
          <label className="form-label">Color</label>
          <input className="form-input" type="color" value={color} onChange={e => setColor(e.target.value)} style={{ height: 42, padding: 4 }} />
        </div>
      </div>
      <div style={{ display: 'flex', gap: 10 }}>
        <button className="btn btn-ghost" style={{ flex: 1 }} onClick={onClose}>Cancelar</button>
        <button className="btn btn-primary" style={{ flex: 2 }} onClick={handleSave}>Guardar</button>
      </div>
    </Modal>
  )
}

export default function Gastos() {
  const { transactions, deleteTransaction, categories, setCategories, bankBalance, cashOnHand } = useApp()
  const [modal, setModal] = useState(null) // null | 'addTx' | {type:'editTx',tx} | 'addCat' | {type:'editCat',cat} | 'cats'
  const [filter, setFilter] = useState('mes')

  const now = new Date()
  const monthTx = transactions.filter(t => {
    const d = new Date(t.date)
    return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth()
  })
  const monthExpenses = monthTx.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0)
  const monthIncome = monthTx.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0)

  const filtered = filter === 'mes'
    ? transactions.filter(t => { const d = new Date(t.date); return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth() })
    : transactions

  const grouped = {}
  ;[...filtered].sort((a, b) => new Date(b.date) - new Date(a.date)).forEach(t => {
    if (!grouped[t.date]) grouped[t.date] = []
    grouped[t.date].push(t)
  })
  const sortedDates = Object.keys(grouped).sort((a, b) => new Date(b) - new Date(a))

  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-title">Gastos</h1>
        <div className="page-header-actions page-header-actions--2">
          <button className="btn btn-ghost" onClick={() => setModal('cats')}>Categorías</button>
          <button className="btn btn-primary" onClick={() => setModal('addTx')}>+ Añadir</button>
        </div>
      </div>

      {(bankBalance !== null || cashOnHand !== null) && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 10 }}>
          {bankBalance !== null && (
            <div className="card-sm" style={{ borderLeft: '3px solid var(--blue)' }}>
              <div style={{ color: 'var(--text3)', fontSize: 10 }}>BANCO</div>
              <div style={{ fontSize: 16, fontWeight: 700, color: bankBalance >= 0 ? 'var(--blue)' : 'var(--red)' }}>{fmt(bankBalance)}€</div>
            </div>
          )}
          {cashOnHand !== null && (
            <div className="card-sm" style={{ borderLeft: '3px solid var(--orange)' }}>
              <div style={{ color: 'var(--text3)', fontSize: 10 }}>EFECTIVO</div>
              <div style={{ fontSize: 16, fontWeight: 700, color: cashOnHand >= 0 ? 'var(--orange)' : 'var(--red)' }}>{fmt(cashOnHand)}€</div>
            </div>
          )}
        </div>
      )}

      {/* Summary */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 14 }}>
        <div className="card-sm" style={{ borderLeft: '3px solid var(--red)' }}>
          <div style={{ color: 'var(--text3)', fontSize: 10 }}>GASTO MES</div>
          <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--red)' }}>{fmt(monthExpenses)}€</div>
        </div>
        <div className="card-sm" style={{ borderLeft: '3px solid var(--green)' }}>
          <div style={{ color: 'var(--text3)', fontSize: 10 }}>INGRESOS EXTRA</div>
          <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--green)' }}>{fmt(monthIncome)}€</div>
        </div>
      </div>

      {/* Filter */}
      <div style={{ display: 'flex', gap: 7, marginBottom: 14 }}>
        {[['all', 'Todo'], ['mes', 'Este mes']].map(([v, l]) => (
          <button key={v} onClick={() => setFilter(v)} style={{ padding: '5px 14px', borderRadius: 20, fontSize: 12, fontWeight: 600, background: filter === v ? 'var(--accent)' : 'var(--bg3)', color: filter === v ? '#fff' : 'var(--text2)', border: '1px solid ' + (filter === v ? 'var(--accent)' : 'var(--border)') }}>{l}</button>
        ))}
      </div>

      {/* List */}
      {sortedDates.length === 0 && (
        <div className="card" style={{ textAlign: 'center', padding: '32px 14px' }}>
          <div style={{ fontSize: 26, marginBottom: 8 }}>💸</div>
          <div style={{ color: 'var(--text3)', fontSize: 13 }}>Sin apuntes. Pulsa <strong>+ Añadir</strong>.</div>
        </div>
      )}
      {sortedDates.map(dateKey => {
        const dayTx = grouped[dateKey]
        const dayTotal = dayTx.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0)
        const d = new Date(dateKey + 'T12:00:00')
        return (
          <div key={dateKey} style={{ marginBottom: 14 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
              <span style={{ fontSize: 11, color: 'var(--text3)', textTransform: 'capitalize' }}>{format(d, "EEEE d 'de' MMMM", { locale: es })}</span>
              {dayTotal > 0 && <span style={{ fontSize: 12, color: 'var(--red)' }}>-{fmt(dayTotal)}€</span>}
            </div>
            <div className="card" style={{ padding: 0, overflow: 'hidden', marginBottom: 0 }}>
              {dayTx.map((t, i) => {
                const cat = categories.find(c => c.id === t.category)
                return (
                  <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '11px 13px', borderBottom: i < dayTx.length - 1 ? '1px solid var(--border)' : 'none' }}>
                    <div style={{ width: 34, height: 34, borderRadius: 9, background: cat ? cat.color + '22' : 'var(--bg3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 17, flexShrink: 0 }}>
                      {cat?.icon || '📦'}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.description}</div>
                      <div style={{ fontSize: 11, color: 'var(--text3)' }}>
                        {[cat?.name, TX_PAYMENT_LABELS[t.paymentMethod || 'bank']].filter(Boolean).join(' · ')}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: t.type === 'expense' ? 'var(--red)' : 'var(--green)' }}>
                        {t.type === 'expense' ? '-' : '+'}{fmt(t.amount)}€
                      </div>
                      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 2 }}>
                        <button onClick={() => setModal({ type: 'editTx', tx: t })} style={{ fontSize: 10, color: 'var(--accent)', background: 'none', border: 'none', cursor: 'pointer' }}>Editar</button>
                        <button onClick={() => deleteTransaction(t.id)} style={{ fontSize: 10, color: 'var(--text3)', background: 'none', border: 'none', cursor: 'pointer' }}>Eliminar</button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )
      })}

      {/* Categories management sheet */}
      {modal === 'cats' && (
        <div className="modal-overlay" onClick={() => setModal(null)}>
          <div className="modal-sheet" onClick={e => e.stopPropagation()}>
            <div className="modal-handle" />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <h2 style={{ fontFamily: 'var(--font-head)', fontSize: 18, fontWeight: 700 }}>Categorías</h2>
              <button className="btn btn-primary btn-sm" onClick={() => setModal('addCat')}>+ Nueva</button>
            </div>
            {categories.map(c => (
              <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 0', borderBottom: '1px solid var(--border)' }}>
                <div style={{ width: 30, height: 30, borderRadius: 8, background: c.color + '22', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>{c.icon}</div>
                <span style={{ flex: 1, fontSize: 13 }}>{c.name}</span>
                <div style={{ width: 12, height: 12, borderRadius: 3, background: c.color }} />
                <button onClick={() => setModal({ type: 'editCat', cat: c })} style={{ fontSize: 11, color: 'var(--accent)', background: 'none', border: 'none', cursor: 'pointer' }}>✏️</button>
                <button onClick={() => setCategories(prev => prev.filter(x => x.id !== c.id))} style={{ fontSize: 11, color: 'var(--text3)', background: 'none', border: 'none', cursor: 'pointer' }}>✕</button>
              </div>
            ))}
          </div>
        </div>
      )}

      {modal === 'addTx' && <TransactionModal tx={null} onClose={() => setModal(null)} />}
      {modal?.type === 'editTx' && <TransactionModal tx={modal.tx} onClose={() => setModal(null)} />}
      {modal === 'addCat' && <CategoryModal cat={null} onClose={() => setModal(null)} />}
      {modal?.type === 'editCat' && <CategoryModal cat={modal.cat} onClose={() => setModal(null)} />}
    </div>
  )
}
