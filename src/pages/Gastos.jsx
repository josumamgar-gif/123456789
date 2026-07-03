import React, { useState } from 'react'
import { useApp } from '../context/AppContext'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { TX_PAYMENT_LABELS } from '../data/defaults'
import Modal from '../components/Modal'
import QuickAddExpense from '../components/QuickAddExpense'

const fmt = (n) => n.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

function TransactionModal({ tx, onClose }) {
  const { categories, updateTransaction } = useApp()
  const [type, setType] = useState(tx?.type || 'expense')
  const [amount, setAmount] = useState(tx?.amount || '')
  const [description, setDescription] = useState(tx?.description || '')
  const [category, setCategory] = useState(tx?.category || 'otros')
  const [date, setDate] = useState(tx?.date || new Date().toISOString().split('T')[0])
  const [paymentMethod, setPaymentMethod] = useState(tx?.paymentMethod || 'bank')

  const handleSave = () => {
    if (!amount || !description) return
    updateTransaction(tx.id, {
      type, amount: parseFloat(amount), description,
      category: type === 'expense' ? category : '',
      date, paymentMethod,
    })
    onClose()
  }

  return (
    <Modal title="Editar apunte" onClose={onClose}>
      <div className="form-group">
        <label className="form-label">Descripción</label>
        <input className="form-input" value={description} onChange={e => setDescription(e.target.value)} />
      </div>
      <div className="form-group">
        <label className="form-label">Importe (€)</label>
        <input className="form-input" type="number" min="0" step="0.01" value={amount} onChange={e => setAmount(e.target.value)} />
      </div>
      <div className="form-group">
        <label className="form-label">Categoría</label>
        <select className="form-input" value={category} onChange={e => setCategory(e.target.value)}>
          {categories.filter(c => c.id !== 'metas').map(c => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
        </select>
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
  const [modal, setModal] = useState(null)
  const [refresh, setRefresh] = useState(0)

  const now = new Date()
  const monthTx = transactions.filter(t => {
    const d = new Date(t.date)
    return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth()
  })
  const monthExpenses = monthTx.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0)

  const grouped = {}
  ;[...monthTx].sort((a, b) => new Date(b.date) - new Date(a.date)).forEach(t => {
    if (!grouped[t.date]) grouped[t.date] = []
    grouped[t.date].push(t)
  })
  const sortedDates = Object.keys(grouped).sort((a, b) => new Date(b) - new Date(a))

  return (
    <div className="page">
      <div className="page-header page-header--row">
        <h1 className="page-title">Gastos</h1>
        <button className="btn btn-ghost btn-sm" onClick={() => setModal('cats')}>Categorías</button>
      </div>

      <div className="card quick-add-card" style={{ marginBottom: 12 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text2)', letterSpacing: '0.06em', marginBottom: 12 }}>AÑADIR GASTO</div>
        <QuickAddExpense onAdded={() => setRefresh(r => r + 1)} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 14 }}>
        <div className="card-sm" style={{ borderLeft: '3px solid var(--blue)' }}>
          <div style={{ color: 'var(--text3)', fontSize: 9, fontWeight: 700 }}>BANCO</div>
          <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--blue)' }}>{fmt(bankBalance ?? 0)}€</div>
        </div>
        <div className="card-sm" style={{ borderLeft: '3px solid var(--orange)' }}>
          <div style={{ color: 'var(--text3)', fontSize: 9, fontWeight: 700 }}>EFECTIVO</div>
          <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--orange)' }}>{fmt(cashOnHand ?? 0)}€</div>
        </div>
        <div className="card-sm" style={{ borderLeft: '3px solid var(--red)' }}>
          <div style={{ color: 'var(--text3)', fontSize: 9, fontWeight: 700 }}>MES</div>
          <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--red)' }}>{fmt(monthExpenses)}€</div>
        </div>
      </div>

      {sortedDates.length === 0 && (
        <div className="empty-state card">
          <div className="empty-state-icon">💸</div>
          <p>Sin gastos este mes. Usa el formulario de arriba.</p>
        </div>
      )}

      {sortedDates.map(dateKey => {
        const dayTx = grouped[dateKey]
        const dayTotal = dayTx.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0)
        const d = new Date(dateKey + 'T12:00:00')
        return (
          <div key={`${dateKey}-${refresh}`} style={{ marginBottom: 14 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
              <span style={{ fontSize: 11, color: 'var(--text3)', textTransform: 'capitalize', fontWeight: 600 }}>{format(d, "EEEE d MMM", { locale: es })}</span>
              {dayTotal > 0 && <span style={{ fontSize: 12, color: 'var(--red)', fontWeight: 700 }}>-{fmt(dayTotal)}€</span>}
            </div>
            <div className="tx-list card">
              {dayTx.map((t, i) => {
                const cat = categories.find(c => c.id === t.category)
                const tag = t.autoSource?.type === 'goal' ? 'Meta' : t.autoSource?.type === 'sorare' ? 'Sorare' : t.autoSource ? 'Auto' : null
                return (
                  <div key={t.id} className="tx-row" style={{ borderBottom: i < dayTx.length - 1 ? '1px solid var(--border)' : 'none' }}>
                    <div className="tx-icon" style={{ background: (cat?.color || '#aaa') + '22' }}>{cat?.icon || '📦'}</div>
                    <div className="tx-body">
                      <div className="tx-desc">{t.description}</div>
                      <div className="tx-meta">{[cat?.name, TX_PAYMENT_LABELS[t.paymentMethod || 'bank'], tag].filter(Boolean).join(' · ')}</div>
                    </div>
                    <div className="tx-right">
                      <div className="tx-amount" style={{ color: t.type === 'expense' ? 'var(--red)' : 'var(--green)' }}>
                        {t.type === 'expense' ? '-' : '+'}{fmt(t.amount)}€
                      </div>
                      <div className="tx-actions">
                        <button type="button" className="text-btn" onClick={() => setModal({ type: 'editTx', tx: t })}>Editar</button>
                        <button type="button" className="text-btn text-btn--muted" onClick={() => deleteTransaction(t.id)}>Borrar</button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )
      })}

      {modal === 'cats' && (
        <Modal title="Categorías" onClose={() => setModal(null)}>
          <button className="btn btn-primary btn-sm" style={{ marginBottom: 14, width: '100%' }} onClick={() => setModal('addCat')}>+ Nueva categoría</button>
          {categories.map(c => (
            <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 0', borderBottom: '1px solid var(--border)' }}>
              <div style={{ width: 30, height: 30, borderRadius: 8, background: c.color + '22', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>{c.icon}</div>
              <span style={{ flex: 1, fontSize: 13 }}>{c.name}</span>
              <button type="button" className="text-btn" onClick={() => setModal({ type: 'editCat', cat: c })}>Editar</button>
              {c.id !== 'metas' && c.id !== 'sorare' && (
                <button type="button" className="text-btn text-btn--muted" onClick={() => setCategories(prev => prev.filter(x => x.id !== c.id))}>✕</button>
              )}
            </div>
          ))}
        </Modal>
      )}

      {modal?.type === 'editTx' && <TransactionModal tx={modal.tx} onClose={() => setModal(null)} />}
      {modal === 'addCat' && <CategoryModal cat={null} onClose={() => setModal(null)} />}
      {modal?.type === 'editCat' && <CategoryModal cat={modal.cat} onClose={() => setModal(null)} />}
    </div>
  )
}
