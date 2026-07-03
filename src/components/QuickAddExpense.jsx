import React, { useState } from 'react'
import { useApp } from '../context/AppContext'
import { TX_PAYMENT_METHODS } from '../data/defaults'

const fmt = (n) => n.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

export default function QuickAddExpense({ onAdded, compact }) {
  const { categories, addTransaction } = useApp()
  const [amount, setAmount] = useState('')
  const [description, setDescription] = useState('')
  const [paymentMethod, setPaymentMethod] = useState('bank')
  const [category, setCategory] = useState('otros')
  const [expanded, setExpanded] = useState(false)

  const expenseCats = categories.filter(c => c.id !== 'metas')

  const handleSubmit = () => {
    const val = parseFloat(amount)
    if (!val || val <= 0) return
    const desc = description.trim() || 'Gasto'
    const ok = addTransaction({
      type: 'expense',
      amount: val,
      description: desc,
      category,
      date: new Date().toISOString().split('T')[0],
      paymentMethod,
    })
    if (!ok) return
    setAmount('')
    setDescription('')
    setExpanded(false)
    onAdded?.()
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleSubmit()
  }

  if (compact) {
    return (
      <div className="quick-add quick-add--compact">
        <input
          className="quick-add-input"
          type="number"
          inputMode="decimal"
          placeholder="0,00 €"
          value={amount}
          onChange={e => setAmount(e.target.value)}
          onKeyDown={handleKeyDown}
        />
        <div className="quick-add-pay">
          {TX_PAYMENT_METHODS.map(pm => (
            <button
              key={pm}
              type="button"
              className={`quick-pay-btn${paymentMethod === pm ? ' active' : ''}`}
              onClick={() => setPaymentMethod(pm)}
            >
              {pm === 'bank' ? '💳' : '💵'}
            </button>
          ))}
        </div>
        <button type="button" className="btn btn-primary quick-add-submit" onClick={handleSubmit} disabled={!amount}>
          +
        </button>
      </div>
    )
  }

  return (
    <div className="quick-add">
      <div className="quick-add-row">
        <input
          className="quick-add-input quick-add-input--lg"
          type="number"
          inputMode="decimal"
          placeholder="0,00"
          value={amount}
          onChange={e => setAmount(e.target.value)}
          onFocus={() => setExpanded(true)}
          onKeyDown={handleKeyDown}
        />
        <span className="quick-add-euro">€</span>
      </div>

      <div className="quick-add-pay">
        {TX_PAYMENT_METHODS.map(pm => (
          <button
            key={pm}
            type="button"
            className={`quick-pay-btn${paymentMethod === pm ? ' active' : ''}`}
            onClick={() => setPaymentMethod(pm)}
          >
            {pm === 'bank' ? '💳 Tarjeta' : '💵 Efectivo'}
          </button>
        ))}
      </div>

      {expanded && (
        <>
          <input
            className="form-input"
            placeholder="Descripción (opcional)"
            value={description}
            onChange={e => setDescription(e.target.value)}
            style={{ marginBottom: 10 }}
          />
          <div className="quick-cat-scroll">
            {expenseCats.map(c => (
              <button
                key={c.id}
                type="button"
                className={`quick-cat-chip${category === c.id ? ' active' : ''}`}
                onClick={() => setCategory(c.id)}
              >
                {c.icon} {c.name}
              </button>
            ))}
          </div>
        </>
      )}

      <button type="button" className="btn btn-primary quick-add-submit" onClick={handleSubmit} disabled={!amount}>
        {amount ? `Guardar ${fmt(parseFloat(amount) || 0)}€` : 'Introduce importe'}
      </button>
    </div>
  )
}
