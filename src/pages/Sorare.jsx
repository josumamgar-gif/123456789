import React, { useState } from 'react'
import { useApp } from '../context/AppContext'
import {
  SORARE_COMPETITIONS,
  SORARE_RARITIES,
  SORARE_PAYMENT_METHODS,
  SORARE_PAYMENT_LABELS,
  RARITY_LABELS,
  RARITY_STYLE,
} from '../data/defaults'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

const fmt = (n) => n.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

const PAYMENT_STYLE = {
  cash: { bg: 'rgba(34,168,90,0.1)', c: 'var(--green)', border: 'var(--green)' },
  eth: { bg: 'rgba(10,138,173,0.1)', c: 'var(--blue)', border: 'var(--blue)' },
  apple_pay: { bg: 'rgba(26,26,26,0.08)', c: '#1a1a1a', border: '#666' },
}

const MOVE_CATEGORY_LABELS = {
  manual: 'Ajuste manual',
  card_buy: 'Compra carta',
  card_sell: 'Venta carta',
  prize: 'Premio liga',
}

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

function formatMoveAmount(m) {
  if (m.wallet === 'eth') return `${Number(m.amount).toFixed(4)} ETH`
  if (m.wallet === 'apple_pay') return `${fmt(m.amount)}€`
  return `${fmt(m.amount)}€`
}

function formatMoveWallet(m) {
  if (m.paymentMethod === 'apple_pay' || m.wallet === 'apple_pay') return 'Apple Pay'
  if (m.wallet === 'eth') return 'ETH'
  if (m.wallet === 'cash') return 'Cash'
  return m.wallet || '—'
}

function CardModal({ card, onClose }) {
  const { addSorareCard, updateSorareCard, sorareCompetitions, setSorareCompetitions, sorareBalances } = useApp()
  const isEdit = !!card
  const [player, setPlayer] = useState(card?.player || '')
  const [rarity, setRarity] = useState(card?.rarity || 'limited')
  const [buyPrice, setBuyPrice] = useState(card?.buyPrice ?? '')
  const [buyEthAmount, setBuyEthAmount] = useState(card?.buyEthAmount ?? '')
  const [paymentMethod, setPaymentMethod] = useState(card?.paymentMethod || 'cash')
  const [selectedComps, setSelectedComps] = useState(card?.competitions || [])
  const [customComp, setCustomComp] = useState('')

  const allComps = [...SORARE_COMPETITIONS, ...sorareCompetitions]
  const cashBal = sorareBalances?.cash ?? 0
  const ethBal = sorareBalances?.eth ?? 0

  const toggleComp = (c) =>
    setSelectedComps(prev => prev.includes(c) ? prev.filter(x => x !== c) : [...prev, c])

  const addCustom = () => {
    if (!customComp.trim()) return
    if (!sorareCompetitions.includes(customComp.trim()))
      setSorareCompetitions(prev => [...prev, customComp.trim()])
    setCustomComp('')
  }

  const handleSave = () => {
    if (!player || buyPrice === '' || buyPrice === null) return
    if (!isEdit && paymentMethod === 'eth' && (!buyEthAmount || parseFloat(buyEthAmount) <= 0)) return

    const data = {
      player,
      rarity,
      buyPrice: parseFloat(buyPrice),
      competitions: selectedComps,
      paymentMethod,
      buyEthAmount: paymentMethod === 'eth' ? parseFloat(buyEthAmount) : null,
    }

    if (isEdit) {
      updateSorareCard(card.id, data)
    } else {
      addSorareCard(data)
    }
    onClose()
  }

  return (
    <Modal title={isEdit ? 'Editar carta' : 'Nueva carta'} onClose={onClose}>
      <div className="form-group">
        <label className="form-label">Jugador</label>
        <input className="form-input" placeholder="Ej: Yamal" value={player} onChange={e => setPlayer(e.target.value)} />
      </div>

      <div className="form-group">
        <label className="form-label">Rareza</label>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          {SORARE_RARITIES.map(r => (
            <button key={r} onClick={() => setRarity(r)} style={{
              padding: '8px', borderRadius: 8, fontSize: 12, fontWeight: 700, border: '1px solid',
              borderColor: rarity === r ? RARITY_STYLE[r].c : 'var(--border)',
              background: rarity === r ? RARITY_STYLE[r].bg : 'transparent',
              color: rarity === r ? RARITY_STYLE[r].c : 'var(--text3)',
            }}>
              {RARITY_LABELS[r]}
            </button>
          ))}
        </div>
      </div>

      <div className="form-group">
        <label className="form-label">Precio de compra (€)</label>
        <input className="form-input" type="number" min="0" step="0.01" placeholder="0.00" value={buyPrice} onChange={e => setBuyPrice(e.target.value)} />
      </div>

      {!isEdit && (
        <div className="form-group">
          <label className="form-label">Pagado con</label>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 6 }}>
            {SORARE_PAYMENT_METHODS.map(pm => (
              <button key={pm} onClick={() => setPaymentMethod(pm)} style={{
                padding: '8px 4px', borderRadius: 8, fontSize: 10, fontWeight: 700, border: '1px solid',
                borderColor: paymentMethod === pm ? PAYMENT_STYLE[pm].border : 'var(--border)',
                background: paymentMethod === pm ? PAYMENT_STYLE[pm].bg : 'transparent',
                color: paymentMethod === pm ? PAYMENT_STYLE[pm].c : 'var(--text3)',
              }}>
                {SORARE_PAYMENT_LABELS[pm]}
              </button>
            ))}
          </div>
          {paymentMethod === 'cash' && (
            <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 6 }}>
              Saldo Cash: {fmt(cashBal)}€ — se descontará al guardar
            </div>
          )}
          {paymentMethod === 'eth' && (
            <>
              <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 6, marginBottom: 8 }}>
                Saldo ETH: {ethBal.toFixed(4)} — indica cuánto ETH gastaste
              </div>
              <input
                className="form-input"
                type="number"
                min="0"
                step="0.0001"
                placeholder="ETH gastados (ej: 0.0125)"
                value={buyEthAmount}
                onChange={e => setBuyEthAmount(e.target.value)}
              />
            </>
          )}
          {paymentMethod === 'apple_pay' && (
            <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 6 }}>
              No descuenta del saldo Sorare; queda registrado en movimientos
            </div>
          )}
        </div>
      )}

      {isEdit && card?.paymentMethod && (
        <div style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 12 }}>
          Pagado con: <strong>{SORARE_PAYMENT_LABELS[card.paymentMethod] || card.paymentMethod}</strong>
        </div>
      )}

      <div className="form-group">
        <label className="form-label">Competiciones</label>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, maxHeight: 130, overflowY: 'auto', padding: '4px 0' }}>
          {allComps.map(c => (
            <button key={c} onClick={() => toggleComp(c)} style={{
              padding: '4px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600, border: '1px solid',
              background: selectedComps.includes(c) ? 'var(--accent)' : 'var(--bg3)',
              color: selectedComps.includes(c) ? '#fff' : 'var(--text2)',
              borderColor: selectedComps.includes(c) ? 'var(--accent)' : 'var(--border)',
            }}>
              {c}
            </button>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
          <input className="form-input" placeholder="Añadir competición…" value={customComp} onChange={e => setCustomComp(e.target.value)} style={{ flex: 1 }} />
          <button className="btn btn-ghost" style={{ padding: '8px 12px', fontSize: 12 }} onClick={addCustom}>+</button>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 10 }}>
        <button className="btn btn-ghost" style={{ flex: 1 }} onClick={onClose}>Cancelar</button>
        <button className="btn btn-primary" style={{ flex: 2 }} onClick={handleSave}>Guardar</button>
      </div>
    </Modal>
  )
}

function SellModal({ card, onClose }) {
  const { sellSorareCard, updateSorareCard } = useApp()
  const isEdit = card?.status === 'sold'
  const [sellPrice, setSellPrice] = useState(card?.sellPrice || '')
  const [creditToCash, setCreditToCash] = useState(!isEdit)

  const handleSell = () => {
    if (!sellPrice) return
    if (isEdit) {
      updateSorareCard(card.id, { sellPrice: parseFloat(sellPrice) })
    } else {
      sellSorareCard(card.id, parseFloat(sellPrice), creditToCash)
    }
    onClose()
  }

  const profit = sellPrice ? parseFloat(sellPrice) - card.buyPrice : null

  return (
    <Modal title={`Vender — ${card.player}`} onClose={onClose}>
      <div style={{ background: 'var(--bg3)', borderRadius: 8, padding: '10px 12px', marginBottom: 14, fontSize: 12 }}>
        Compra: <strong>{fmt(card.buyPrice)}€</strong>
        {card.paymentMethod && (
          <span style={{ marginLeft: 8, color: 'var(--text3)' }}>
            · {SORARE_PAYMENT_LABELS[card.paymentMethod]}
          </span>
        )}
        {profit !== null && (
          <span style={{ marginLeft: 12, color: profit >= 0 ? 'var(--green)' : 'var(--red)', fontWeight: 600 }}>
            {profit >= 0 ? '+' : ''}{fmt(profit)}€
          </span>
        )}
      </div>
      <div className="form-group">
        <label className="form-label">Precio de venta (€)</label>
        <input className="form-input" type="number" min="0" step="0.01" placeholder="0.00" value={sellPrice} onChange={e => setSellPrice(e.target.value)} autoFocus />
      </div>
      {!isEdit && (
        <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: 'var(--text2)', marginBottom: 14, cursor: 'pointer' }}>
          <input type="checkbox" checked={creditToCash} onChange={e => setCreditToCash(e.target.checked)} />
          Sumar importe al saldo Cash y registrar en movimientos
        </label>
      )}
      <div style={{ display: 'flex', gap: 10 }}>
        <button className="btn btn-ghost" style={{ flex: 1 }} onClick={onClose}>Cancelar</button>
        <button className="btn btn-primary" style={{ flex: 2, background: 'var(--green)' }} onClick={handleSell}>Confirmar venta</button>
      </div>
    </Modal>
  )
}

function FundModal({ onClose }) {
  const { adjustSorareBalance } = useApp()
  const [wallet, setWallet] = useState('cash')
  const [moveType, setMoveType] = useState('deposit')
  const [amount, setAmount] = useState('')
  const [note, setNote] = useState('')

  const handleSave = () => {
    if (!adjustSorareBalance({ wallet, amount, type: moveType, note: note.trim() })) return
    onClose()
  }

  return (
    <Modal title="Ajustar cartera" onClose={onClose}>
      <p style={{ fontSize: 12, color: 'var(--text2)', lineHeight: 1.5, marginBottom: 14 }}>
        Registra depósitos o retiros de tu saldo en Sorare. <strong>Cash (€)</strong>: dinero en Sorare.
        <strong> ETH</strong>: premios o ETH en wallet. Las compras con carta se registran al añadir la carta.
      </p>
      <div className="form-group">
        <label className="form-label">Cartera</label>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          {[['cash', 'Cash (€)'], ['eth', 'ETH']].map(([w, label]) => (
            <button key={w} onClick={() => setWallet(w)} style={{
              padding: '10px', borderRadius: 8, fontSize: 13, fontWeight: 700, border: '1px solid',
              borderColor: wallet === w ? (w === 'cash' ? 'var(--green)' : 'var(--blue)') : 'var(--border)',
              background: wallet === w ? (w === 'cash' ? 'rgba(34,168,90,0.1)' : 'rgba(10,138,173,0.1)') : 'transparent',
              color: wallet === w ? (w === 'cash' ? 'var(--green)' : 'var(--blue)') : 'var(--text3)',
            }}>
              {label}
            </button>
          ))}
        </div>
      </div>
      <div className="form-group">
        <label className="form-label">Operación</label>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          {[['deposit', 'Añadir fondos'], ['withdraw', 'Retirar']].map(([t, label]) => (
            <button key={t} onClick={() => setMoveType(t)} style={{
              padding: '8px', borderRadius: 8, fontSize: 12, fontWeight: 700, border: '1px solid',
              borderColor: moveType === t ? (t === 'deposit' ? 'var(--green)' : 'var(--red)') : 'var(--border)',
              background: moveType === t ? (t === 'deposit' ? 'rgba(34,168,90,0.1)' : 'rgba(224,61,61,0.08)') : 'transparent',
              color: moveType === t ? (t === 'deposit' ? 'var(--green)' : 'var(--red)') : 'var(--text3)',
            }}>
              {label}
            </button>
          ))}
        </div>
      </div>
      <div className="form-group">
        <label className="form-label">{wallet === 'cash' ? 'Cantidad (€)' : 'Cantidad (ETH)'}</label>
        <input className="form-input" type="number" min="0" step={wallet === 'cash' ? '0.01' : '0.0001'} placeholder={wallet === 'cash' ? '0.00' : '0.0000'} value={amount} onChange={e => setAmount(e.target.value)} autoFocus />
      </div>
      <div className="form-group">
        <label className="form-label">Nota (opcional)</label>
        <input className="form-input" placeholder="Ej: Depósito tarjeta" value={note} onChange={e => setNote(e.target.value)} />
      </div>
      <div style={{ display: 'flex', gap: 10 }}>
        <button className="btn btn-ghost" style={{ flex: 1 }} onClick={onClose}>Cancelar</button>
        <button className="btn btn-primary" style={{ flex: 2, background: moveType === 'deposit' ? 'var(--green)' : 'var(--red)' }} onClick={handleSave}>
          {moveType === 'deposit' ? 'Añadir' : 'Retirar'}
        </button>
      </div>
    </Modal>
  )
}

function PrizeModal({ prize, onClose }) {
  const { addSorarePrize, setSorarePrizes } = useApp()
  const isEdit = !!prize
  const [description, setDescription] = useState(prize?.description || '')
  const [ethAmount, setEthAmount] = useState(prize?.ethAmount || '')
  const [euroValue, setEuroValue] = useState(prize?.euroValue || '')

  const handleSave = () => {
    if (!description || !ethAmount) return
    if (isEdit) {
      setSorarePrizes(prev => prev.map(p => p.id === prize.id
        ? { ...p, description, ethAmount: parseFloat(ethAmount), euroValue: euroValue ? parseFloat(euroValue) : null }
        : p
      ))
    } else {
      addSorarePrize({ description, ethAmount: parseFloat(ethAmount), euroValue: euroValue ? parseFloat(euroValue) : null })
    }
    onClose()
  }

  return (
    <Modal title={isEdit ? 'Editar premio' : 'Añadir premio'} onClose={onClose}>
      {!isEdit && (
        <p style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 12 }}>
          El ETH se sumará a tu cartera y aparecerá en Movimientos.
        </p>
      )}
      <div className="form-group">
        <label className="form-label">Descripción</label>
        <input className="form-input" placeholder="Ej: Liga All-Star semana 12" value={description} onChange={e => setDescription(e.target.value)} />
      </div>
      <div className="form-group">
        <label className="form-label">Cantidad ETH</label>
        <input className="form-input" type="number" min="0" step="0.0001" placeholder="0.0000" value={ethAmount} onChange={e => setEthAmount(e.target.value)} />
      </div>
      <div className="form-group">
        <label className="form-label">Valor en € (opcional)</label>
        <input className="form-input" type="number" min="0" step="0.01" placeholder="0.00" value={euroValue} onChange={e => setEuroValue(e.target.value)} />
      </div>
      <div style={{ display: 'flex', gap: 10 }}>
        <button className="btn btn-ghost" style={{ flex: 1 }} onClick={onClose}>Cancelar</button>
        <button className="btn btn-primary" style={{ flex: 2 }} onClick={handleSave}>Guardar</button>
      </div>
    </Modal>
  )
}

function CardItem({ card, onSell, onEdit, onDelete, showPayment }) {
  return (
    <div className="card" style={{ marginBottom: 10, borderLeft: `3px solid ${RARITY_STYLE[card.rarity]?.c || 'var(--border)'}` }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: 'var(--font-head)', fontWeight: 700, fontSize: 15 }}>{card.player}</div>
          <span style={{ display: 'inline-block', padding: '2px 8px', borderRadius: 4, fontSize: 10, fontWeight: 700, marginTop: 4, background: RARITY_STYLE[card.rarity]?.bg, color: RARITY_STYLE[card.rarity]?.c }}>
            {RARITY_LABELS[card.rarity]}
          </span>
          {showPayment && card.paymentMethod && (
            <span style={{ display: 'inline-block', marginLeft: 6, padding: '2px 8px', borderRadius: 4, fontSize: 10, fontWeight: 600, background: PAYMENT_STYLE[card.paymentMethod]?.bg || 'var(--bg3)', color: PAYMENT_STYLE[card.paymentMethod]?.c || 'var(--text2)' }}>
              {SORARE_PAYMENT_LABELS[card.paymentMethod]}
            </span>
          )}
          {card.purchaseDate && (
            <div style={{ color: 'var(--text3)', fontSize: 11, marginTop: 4 }}>
              Comprada: {format(new Date(card.purchaseDate), 'd MMM yyyy', { locale: es })}
            </div>
          )}
          {card.competitions?.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 6 }}>
              {card.competitions.map(c => (
                <span key={c} style={{ padding: '2px 6px', borderRadius: 4, fontSize: 10, background: 'var(--bg3)', color: 'var(--text2)' }}>{c}</span>
              ))}
            </div>
          )}
        </div>
        <div style={{ textAlign: 'right', flexShrink: 0, marginLeft: 12 }}>
          <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--red)' }}>{fmt(card.buyPrice)}€</div>
          <div style={{ fontSize: 10, color: 'var(--text3)', marginBottom: 8 }}>compra</div>
          <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
            {onSell && (
              <button className="btn btn-ghost" style={{ padding: '4px 9px', fontSize: 11, color: 'var(--green)', borderColor: '#1e9e5640' }} onClick={onSell}>Vender</button>
            )}
            {onEdit && (
              <button className="btn btn-ghost" style={{ padding: '4px 9px', fontSize: 11 }} onClick={onEdit}>✏️</button>
            )}
            {onDelete && (
              <button onClick={onDelete} style={{ fontSize: 11, color: 'var(--text3)', background: 'none', border: 'none', cursor: 'pointer', padding: '4px 2px' }}>✕</button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function RarityGallery({ cards, emptyIcon, emptyText, onSell, onEdit, onDelete }) {
  const grouped = SORARE_RARITIES.map(r => ({
    rarity: r,
    items: cards.filter(c => c.rarity === r),
  })).filter(g => g.items.length > 0)

  if (cards.length === 0) {
    return (
      <div className="card" style={{ textAlign: 'center', padding: '32px 14px' }}>
        <div style={{ fontSize: 26, marginBottom: 8 }}>{emptyIcon}</div>
        <div style={{ color: 'var(--text3)', fontSize: 13 }}>{emptyText}</div>
      </div>
    )
  }

  return grouped.map(({ rarity, items }) => (
    <section key={rarity} style={{ marginBottom: 18 }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        marginBottom: 10,
        paddingBottom: 6,
        borderBottom: `2px solid ${RARITY_STYLE[rarity].c}`,
      }}>
        <span style={{
          padding: '4px 12px',
          borderRadius: 20,
          fontSize: 12,
          fontWeight: 700,
          background: RARITY_STYLE[rarity].bg,
          color: RARITY_STYLE[rarity].c,
        }}>
          {RARITY_LABELS[rarity]}
        </span>
        <span style={{ fontSize: 11, color: 'var(--text3)' }}>{items.length} carta{items.length !== 1 ? 's' : ''}</span>
      </div>
      {items.map(card => (
        <CardItem
          key={card.id}
          card={card}
          showPayment
          onSell={onSell ? () => onSell(card) : null}
          onEdit={onEdit ? () => onEdit(card) : null}
          onDelete={onDelete ? () => onDelete(card.id) : null}
        />
      ))}
    </section>
  ))
}

export default function Sorare() {
  const {
    sorareCards, deleteSorareCard, updateSorareCard, sellSorareCard,
    sorarePrizes, setSorarePrizes,
    sorareBalances, sorareBalanceMoves,
  } = useApp()
  const cashBalance = sorareBalances?.cash ?? 0
  const ethBalance = sorareBalances?.eth ?? 0
  const [tab, setTab] = useState('cartera')
  const [modal, setModal] = useState(null)

  const held = sorareCards.filter(c => c.status === 'held')
  const sold = sorareCards.filter(c => c.status === 'sold')

  const totalInvested = sorareCards.reduce((s, c) => s + c.buyPrice, 0)
  const totalSoldFor = sold.reduce((s, c) => s + (c.sellPrice || 0), 0)
  const totalPrizesEth = sorarePrizes.reduce((s, p) => s + p.ethAmount, 0)
  const totalPrizesEur = sorarePrizes.reduce((s, p) => s + (p.euroValue || 0), 0)
  const heldValue = held.reduce((s, c) => s + c.buyPrice, 0)
  const netResult = totalSoldFor + totalPrizesEur - totalInvested

  const sortedMoves = [...sorareBalanceMoves].reverse()

  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-title">Sorare</h1>
        <div className="page-header-actions page-header-actions--3">
          <button className="btn btn-ghost" onClick={() => setModal('addFunds')}>+ Fondos</button>
          <button className="btn btn-ghost" onClick={() => setModal('addPrize')}>+ Premio</button>
          <button className="btn btn-primary" onClick={() => setModal('addCard')}>+ Carta</button>
        </div>
      </div>

      <div className="card" style={{ marginBottom: 12, borderLeft: '3px solid var(--accent)' }}>
        <div className="card-header-row">
          <span style={{ fontFamily: 'var(--font-head)', fontWeight: 600, fontSize: 13 }}>Carteras Sorare</span>
          <button className="btn btn-primary" style={{ background: 'var(--green)' }} onClick={() => setModal('addFunds')}>
            + Añadir fondos
          </button>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <div style={{ background: 'rgba(34,168,90,0.08)', borderRadius: 8, padding: '10px 12px' }}>
            <div style={{ color: 'var(--text3)', fontSize: 10, marginBottom: 2 }}>CASH (€)</div>
            <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--green)' }}>{fmt(cashBalance)}€</div>
          </div>
          <div style={{ background: 'rgba(10,138,173,0.08)', borderRadius: 8, padding: '10px 12px' }}>
            <div style={{ color: 'var(--text3)', fontSize: 10, marginBottom: 2 }}>ETH</div>
            <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--blue)' }}>{ethBalance.toFixed(4)} ETH</div>
          </div>
        </div>
      </div>

      <div className="card" style={{ marginBottom: 12, borderLeft: `3px solid ${netResult >= 0 ? 'var(--green)' : 'var(--red)'}` }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
          <div>
            <div style={{ color: 'var(--text3)', fontSize: 10, marginBottom: 2 }}>INVERTIDO</div>
            <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--red)' }}>{fmt(totalInvested)}€</div>
          </div>
          <div>
            <div style={{ color: 'var(--text3)', fontSize: 10, marginBottom: 2 }}>RECUPERADO</div>
            <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--green)' }}>{fmt(totalSoldFor)}€</div>
          </div>
          <div>
            <div style={{ color: 'var(--text3)', fontSize: 10, marginBottom: 2 }}>PREMIOS ETH</div>
            <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--blue)' }}>{totalPrizesEth.toFixed(4)} ETH</div>
          </div>
          <div>
            <div style={{ color: 'var(--text3)', fontSize: 10, marginBottom: 2 }}>CARTERA ACTUAL</div>
            <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--accent)' }}>{fmt(heldValue)}€</div>
          </div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 10, borderTop: '1px solid var(--border)' }}>
          <span style={{ fontFamily: 'var(--font-head)', fontWeight: 600, fontSize: 13 }}>Balance neto</span>
          <span style={{ fontSize: 18, fontWeight: 700, color: netResult >= 0 ? 'var(--green)' : 'var(--red)' }}>
            {netResult >= 0 ? '+' : ''}{fmt(netResult)}€
          </span>
        </div>
      </div>

      <div className="tab-list-vertical">
        {[
          ['cartera', 'Galería', held.length],
          ['vendidas', 'Vendidas', sold.length],
          ['movimientos', 'Movimientos', sorareBalanceMoves.length],
          ['premios', 'Premios', sorarePrizes.length],
        ].map(([v, label, count]) => (
          <button
            key={v}
            type="button"
            className={`tab-btn ${tab === v ? 'active' : ''}`}
            onClick={() => setTab(v)}
          >
            <span>{label}</span>
            <span className="tab-count">{count}</span>
          </button>
        ))}
      </div>

      {tab === 'cartera' && (
        <RarityGallery
          cards={held}
          emptyIcon="⚽"
          emptyText="Sin cartas en cartera."
          onSell={(c) => setModal({ type: 'sell', c })}
          onEdit={(c) => setModal({ type: 'editCard', c })}
          onDelete={(id) => deleteSorareCard(id)}
        />
      )}

      {tab === 'vendidas' && (
        <>
          {sold.length === 0 ? (
            <div className="card" style={{ textAlign: 'center', padding: '32px 14px' }}>
              <div style={{ fontSize: 26, marginBottom: 8 }}>💰</div>
              <div style={{ color: 'var(--text3)', fontSize: 13 }}>Sin cartas vendidas.</div>
            </div>
          ) : (
            SORARE_RARITIES.map(rarity => {
              const items = sold.filter(c => c.rarity === rarity)
              if (items.length === 0) return null
              return (
                <section key={rarity} style={{ marginBottom: 18 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10, paddingBottom: 6, borderBottom: `2px solid ${RARITY_STYLE[rarity].c}` }}>
                    <span style={{ padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 700, background: RARITY_STYLE[rarity].bg, color: RARITY_STYLE[rarity].c }}>
                      {RARITY_LABELS[rarity]}
                    </span>
                  </div>
                  {items.map(card => {
                    const profit = (card.sellPrice || 0) - card.buyPrice
                    return (
                      <div key={card.id} className="card" style={{ marginBottom: 10, borderLeft: `3px solid ${RARITY_STYLE[rarity].c}` }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <div>
                            <div style={{ fontFamily: 'var(--font-head)', fontWeight: 700, fontSize: 15 }}>{card.player}</div>
                            {card.paymentMethod && (
                              <span style={{ fontSize: 10, color: 'var(--text3)' }}>{SORARE_PAYMENT_LABELS[card.paymentMethod]}</span>
                            )}
                            {card.sellDate && (
                              <div style={{ color: 'var(--text3)', fontSize: 11, marginTop: 4 }}>
                                Vendida: {format(new Date(card.sellDate), 'd MMM yyyy', { locale: es })}
                              </div>
                            )}
                          </div>
                          <div style={{ textAlign: 'right' }}>
                            <div style={{ fontSize: 13, color: 'var(--text2)' }}>{fmt(card.buyPrice)}€ → {fmt(card.sellPrice || 0)}€</div>
                            <div style={{ fontSize: 16, fontWeight: 700, color: profit >= 0 ? 'var(--green)' : 'var(--red)' }}>
                              {profit >= 0 ? '+' : ''}{fmt(profit)}€
                            </div>
                            <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end', marginTop: 6 }}>
                              <button className="btn btn-ghost" style={{ padding: '4px 9px', fontSize: 11 }} onClick={() => setModal({ type: 'sell', c: card })}>✏️ Editar venta</button>
                              <button className="btn btn-ghost" style={{ padding: '4px 9px', fontSize: 11, color: 'var(--orange)' }}
                                onClick={() => updateSorareCard(card.id, { status: 'held', sellPrice: null, sellDate: null })}>
                                Devolver
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </section>
              )
            })
          )}
        </>
      )}

      {tab === 'movimientos' && (
        <>
          {sortedMoves.length === 0 ? (
            <div className="card" style={{ textAlign: 'center', padding: '32px 14px' }}>
              <div style={{ fontSize: 26, marginBottom: 8 }}>📋</div>
              <div style={{ color: 'var(--text3)', fontSize: 13 }}>Sin movimientos. Añade fondos, cartas o premios.</div>
            </div>
          ) : (
            sortedMoves.map(m => {
              const isIn = m.type === 'deposit'
              const cat = m.category || 'manual'
              return (
                <div key={m.id} className="card" style={{ marginBottom: 8, borderLeft: `3px solid ${isIn ? 'var(--green)' : 'var(--red)'}` }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 600 }}>
                        {MOVE_CATEGORY_LABELS[cat] || cat}
                        {m.player && <span style={{ fontWeight: 400, color: 'var(--text2)' }}> · {m.player}</span>}
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 2 }}>
                        {formatMoveWallet(m)} · {format(new Date(m.date), 'd MMM yyyy, HH:mm', { locale: es })}
                      </div>
                      {m.note && <div style={{ fontSize: 11, color: 'var(--text2)', marginTop: 4 }}>{m.note}</div>}
                    </div>
                    <div style={{ textAlign: 'right', flexShrink: 0, marginLeft: 10 }}>
                      <div style={{ fontSize: 15, fontWeight: 700, color: isIn ? 'var(--green)' : 'var(--red)' }}>
                        {isIn ? '+' : '−'}{formatMoveAmount(m)}
                      </div>
                    </div>
                  </div>
                </div>
              )
            })
          )}
        </>
      )}

      {tab === 'premios' && (
        <>
          {sorarePrizes.length > 0 && (
            <div className="card-sm" style={{ marginBottom: 12, display: 'flex', justifyContent: 'space-between', borderLeft: '3px solid var(--blue)' }}>
              <div>
                <div style={{ color: 'var(--text3)', fontSize: 10 }}>TOTAL ETH</div>
                <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--blue)' }}>{totalPrizesEth.toFixed(4)} ETH</div>
              </div>
              {totalPrizesEur > 0 && (
                <div style={{ textAlign: 'right' }}>
                  <div style={{ color: 'var(--text3)', fontSize: 10 }}>VALOR €</div>
                  <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--green)' }}>{fmt(totalPrizesEur)}€</div>
                </div>
              )}
            </div>
          )}
          {sorarePrizes.length === 0 && (
            <div className="card" style={{ textAlign: 'center', padding: '32px 14px' }}>
              <div style={{ fontSize: 26, marginBottom: 8 }}>🏆</div>
              <div style={{ color: 'var(--text3)', fontSize: 13 }}>Sin premios registrados.</div>
            </div>
          )}
          {[...sorarePrizes].reverse().map(p => (
            <div key={p.id} className="card" style={{ marginBottom: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 500 }}>{p.description}</div>
                  <div style={{ color: 'var(--text3)', fontSize: 11 }}>
                    {format(new Date(p.date), 'd MMM yyyy', { locale: es })}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--blue)' }}>{p.ethAmount} ETH</div>
                  {p.euroValue && <div style={{ fontSize: 11, color: 'var(--green)' }}>{fmt(p.euroValue)}€</div>}
                  <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 4 }}>
                    <button onClick={() => setModal({ type: 'editPrize', p })} style={{ fontSize: 10, color: 'var(--accent)', background: 'none', border: 'none', cursor: 'pointer' }}>✏️ Editar</button>
                    <button onClick={() => setSorarePrizes(prev => prev.filter(x => x.id !== p.id))} style={{ fontSize: 10, color: 'var(--text3)', background: 'none', border: 'none', cursor: 'pointer' }}>Eliminar</button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </>
      )}

      {modal === 'addFunds' && <FundModal onClose={() => setModal(null)} />}
      {modal === 'addCard' && <CardModal card={null} onClose={() => setModal(null)} />}
      {modal?.type === 'editCard' && <CardModal card={modal.c} onClose={() => setModal(null)} />}
      {modal?.type === 'sell' && <SellModal card={modal.c} onClose={() => setModal(null)} />}
      {modal === 'addPrize' && <PrizeModal prize={null} onClose={() => setModal(null)} />}
      {modal?.type === 'editPrize' && <PrizeModal prize={modal.p} onClose={() => setModal(null)} />}
    </div>
  )
}
