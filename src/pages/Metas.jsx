import React, { useState } from 'react'
import { useApp } from '../context/AppContext'
import { differenceInDays, parseISO } from 'date-fns'

const fmt = (n) => n.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
const PRIORITY_COLORS = { 1: 'var(--red)', 2: 'var(--orange)', 3: 'var(--yellow)', 4: 'var(--blue)', 5: 'var(--text2)' }

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

function GoalModal({ goal, onClose }) {
  const { addGoal, updateGoal } = useApp()
  const isEdit = !!goal
  const [name, setName] = useState(goal?.name || '')
  const [icon, setIcon] = useState(goal?.icon || '🎯')
  const [targetAmount, setTargetAmount] = useState(goal?.targetAmount || '')
  const [deadline, setDeadline] = useState(goal?.deadline || '')
  const [priority, setPriority] = useState(goal?.priority || 3)

  const handleSave = () => {
    if (!name || !targetAmount || !deadline) return
    const data = { name, icon, targetAmount: parseFloat(targetAmount), deadline, priority }
    if (isEdit) {
      updateGoal(goal.id, data)
    } else {
      addGoal(data)
    }
    onClose()
  }

  return (
    <Modal title={isEdit ? 'Editar meta' : 'Nueva meta'} onClose={onClose}>
      <div className="form-group">
        <label className="form-label">Nombre</label>
        <input className="form-input" placeholder="Ej: Viaje a Japón" value={name} onChange={e => setName(e.target.value)} />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 10 }}>
        <div className="form-group">
          <label className="form-label">Emoji</label>
          <input className="form-input" value={icon} onChange={e => setIcon(e.target.value)} />
        </div>
        <div className="form-group">
          <label className="form-label">Objetivo (€)</label>
          <input className="form-input" type="number" min="0" placeholder="0" value={targetAmount} onChange={e => setTargetAmount(e.target.value)} />
        </div>
      </div>
      <div className="form-group">
        <label className="form-label">Fecha límite</label>
        <input className="form-input" type="date" value={deadline} onChange={e => setDeadline(e.target.value)} />
      </div>
      <div className="form-group">
        <label className="form-label">Prioridad (1 = más urgente)</label>
        <div style={{ display: 'flex', gap: 7 }}>
          {[1, 2, 3, 4, 5].map(p => (
            <button key={p} onClick={() => setPriority(p)} style={{ flex: 1, padding: '8px 0', borderRadius: 8, fontSize: 13, fontWeight: 700, border: '1px solid', borderColor: priority === p ? PRIORITY_COLORS[p] : 'var(--border)', background: priority === p ? PRIORITY_COLORS[p] + '22' : 'transparent', color: priority === p ? PRIORITY_COLORS[p] : 'var(--text3)' }}>
              {p}
            </button>
          ))}
        </div>
      </div>
      <div style={{ display: 'flex', gap: 10 }}>
        <button className="btn btn-ghost" style={{ flex: 1 }} onClick={onClose}>Cancelar</button>
        <button className="btn btn-primary" style={{ flex: 2 }} onClick={handleSave}>Guardar</button>
      </div>
    </Modal>
  )
}

function AddSavingsModal({ goal, onClose }) {
  const { updateGoal } = useApp()
  const [amount, setAmount] = useState('')
  const [mode, setMode] = useState('add') // 'add' | 'set'

  const handleSave = () => {
    const val = parseFloat(amount)
    if (isNaN(val)) return
    if (mode === 'add') {
      updateGoal(goal.id, { savedAmount: (goal.savedAmount || 0) + val })
    } else {
      updateGoal(goal.id, { savedAmount: val })
    }
    onClose()
  }

  return (
    <Modal title={`${goal.icon} ${goal.name}`} onClose={onClose}>
      <div style={{ background: 'var(--bg3)', borderRadius: 8, padding: '10px 12px', marginBottom: 14, fontSize: 12 }}>
        Ahorrado: <strong style={{ color: 'var(--accent)' }}>{fmt(goal.savedAmount || 0)}€</strong> de <strong>{fmt(goal.targetAmount)}€</strong>
      </div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
        {[['add', '+ Añadir'], ['set', 'Fijar total']].map(([v, l]) => (
          <button key={v} onClick={() => setMode(v)} style={{ flex: 1, padding: '7px', borderRadius: 8, fontSize: 12, fontWeight: 600, border: '1px solid', borderColor: mode === v ? 'var(--accent)' : 'var(--border)', background: mode === v ? 'var(--accent-light)' : 'transparent', color: mode === v ? 'var(--accent)' : 'var(--text2)' }}>
            {l}
          </button>
        ))}
      </div>
      <div className="form-group">
        <label className="form-label">{mode === 'add' ? 'Añadir ahorro (€)' : 'Establecer total ahorrado (€)'}</label>
        <input className="form-input" type="number" min="0" step="0.01" placeholder="0.00" value={amount} onChange={e => setAmount(e.target.value)} autoFocus />
      </div>
      <div style={{ display: 'flex', gap: 10 }}>
        <button className="btn btn-ghost" style={{ flex: 1 }} onClick={onClose}>Cancelar</button>
        <button className="btn btn-primary" style={{ flex: 2 }} onClick={handleSave}>Guardar</button>
      </div>
    </Modal>
  )
}

export default function Metas() {
  const { goals, deleteGoal } = useApp()
  const [modal, setModal] = useState(null) // null | 'add' | {type:'edit',g} | {type:'save',g}

  const sorted = [...goals].sort((a, b) => a.priority - b.priority)

  const getDaysLeft = (deadline) => {
    try { return differenceInDays(parseISO(deadline), new Date()) } catch { return null }
  }

  const getMonthlyNeeded = (goal) => {
    const days = getDaysLeft(goal.deadline)
    if (!days || days <= 0) return null
    const months = Math.max(1, Math.ceil(days / 30))
    return Math.max(0, (goal.targetAmount - (goal.savedAmount || 0)) / months)
  }

  const totalSaved = goals.reduce((s, g) => s + (g.savedAmount || 0), 0)
  const totalTarget = goals.reduce((s, g) => s + g.targetAmount, 0)

  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-title">Metas</h1>
        <button className="btn btn-primary" style={{ padding: '7px 13px', fontSize: 13 }} onClick={() => setModal('add')}>+ Nueva</button>
      </div>

      {/* Summary */}
      {goals.length > 0 && (
        <div className="card-sm" style={{ marginBottom: 14, borderLeft: '3px solid var(--accent)' }}>
          <div style={{ color: 'var(--text3)', fontSize: 10, marginBottom: 4 }}>TOTAL METAS</div>
          <div style={{ display: 'flex', gap: 16, alignItems: 'baseline' }}>
            <div><span style={{ fontSize: 16, fontWeight: 600, color: 'var(--accent)' }}>{fmt(totalSaved)}€</span> <span style={{ fontSize: 11, color: 'var(--text3)' }}>ahorrado</span></div>
            <div><span style={{ fontSize: 16, fontWeight: 600, color: 'var(--text2)' }}>{fmt(totalTarget)}€</span> <span style={{ fontSize: 11, color: 'var(--text3)' }}>objetivo</span></div>
          </div>
          <div className="progress-bar" style={{ marginTop: 8 }}>
            <div className="progress-fill" style={{ width: `${Math.min(100, (totalSaved / totalTarget) * 100)}%`, background: 'var(--accent)' }} />
          </div>
        </div>
      )}

      {sorted.length === 0 && (
        <div className="card" style={{ textAlign: 'center', padding: '36px 14px' }}>
          <div style={{ fontSize: 28, marginBottom: 8 }}>🎯</div>
          <div style={{ color: 'var(--text3)', fontSize: 13 }}>Sin metas. Pulsa <strong>+ Nueva</strong>.</div>
        </div>
      )}

      {sorted.map(goal => {
        const pct = Math.min(100, ((goal.savedAmount || 0) / goal.targetAmount) * 100)
        const daysLeft = getDaysLeft(goal.deadline)
        const monthly = getMonthlyNeeded(goal)
        const done = pct >= 100
        const pc = PRIORITY_COLORS[goal.priority] || 'var(--text3)'

        return (
          <div key={goal.id} className="card" style={{ marginBottom: 10, borderLeft: `3px solid ${pc}` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 22 }}>{goal.icon}</span>
                <div>
                  <div style={{ fontFamily: 'var(--font-head)', fontWeight: 700, fontSize: 15 }}>{goal.name}</div>
                  <div style={{ display: 'flex', gap: 6, marginTop: 3 }}>
                    <span style={{ fontSize: 10, padding: '2px 7px', borderRadius: 4, fontWeight: 700, background: pc + '22', color: pc }}>P{goal.priority}</span>
                    {daysLeft !== null && (
                      <span style={{ fontSize: 11, color: daysLeft < 30 ? 'var(--red)' : 'var(--text3)' }}>
                        {daysLeft > 0 ? `${daysLeft} días` : 'Vencida'}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 15, fontWeight: 600 }}>{fmt(goal.savedAmount || 0)}€</div>
                <div style={{ fontSize: 11, color: 'var(--text3)' }}>de {fmt(goal.targetAmount)}€</div>
              </div>
            </div>

            <div className="progress-bar">
              <div className="progress-fill" style={{ width: `${pct}%`, background: done ? 'var(--green)' : pc }} />
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 }}>
              <div style={{ fontSize: 11, color: 'var(--text2)' }}>
                {done ? (
                  <span style={{ color: 'var(--green)', fontWeight: 600 }}>✓ Completada</span>
                ) : monthly !== null ? (
                  <>Necesitas <strong style={{ color: pc }}>{fmt(monthly)}€/mes</strong></>
                ) : null}
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                {!done && (
                  <button className="btn btn-ghost" style={{ padding: '4px 10px', fontSize: 11 }} onClick={() => setModal({ type: 'save', g: goal })}>
                    + Ahorrar
                  </button>
                )}
                <button className="btn btn-ghost" style={{ padding: '4px 10px', fontSize: 11 }} onClick={() => setModal({ type: 'edit', g: goal })}>
                  ✏️
                </button>
                <button onClick={() => deleteGoal(goal.id)} style={{ fontSize: 11, color: 'var(--text3)', background: 'none', border: 'none', cursor: 'pointer', padding: '4px 0' }}>
                  Borrar
                </button>
              </div>
            </div>
          </div>
        )
      })}

      {modal === 'add' && <GoalModal goal={null} onClose={() => setModal(null)} />}
      {modal?.type === 'edit' && <GoalModal goal={modal.g} onClose={() => setModal(null)} />}
      {modal?.type === 'save' && <AddSavingsModal goal={modal.g} onClose={() => setModal(null)} />}
    </div>
  )
}
