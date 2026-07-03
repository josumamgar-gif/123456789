import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import Modal from '../components/Modal'
import {
  SORARE_RARITIES, SORARE_EDITIONS, SORARE_PAYMENT_METHODS, SORARE_PAYMENT_LABELS,
  RARITY_LABELS, RARITY_STYLE, EDITION_LABELS, EDITION_STYLE, TX_PAYMENT_LABELS,
} from '../data/defaults'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

const fmt = (n) => n.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

function FundModal({ onClose }) {
  const { adjustSorareBalance } = useApp()
  const [amount, setAmount] = useState('')
  const [type, setType] = useState('deposit')
  const [wallet, setWallet] = useState('cash')
  const [note, setNote] = useState('')

  const handleSave = () => {
    if (!adjustSorareBalance({ wallet, amount, type, note, linkToGastos: wallet === 'cash' })) return
    onClose()
  }

  return (
    <Modal title="Mover dinero Sorare" onClose={onClose}>
      <p style={{ fontSize: 12, color: 'var(--text2)', marginBottom: 14, lineHeight: 1.5 }}>
        {wallet === 'cash'
          ? 'El cash en € se vincula automáticamente con la pestaña Gastos (banco).'
          : 'Los movimientos ETH solo afectan la cartera Sorare.'}
      </p>
      <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
        {[['deposit', '+ Entrada'], ['withdraw', '− Salida']].map(([v, l]) => (
          <button key={v} type="button" className={`quick-pay-btn${type === v ? ' active' : ''}`} style={{ flex: 1 }} onClick={() => setType(v)}>{l}</button>
        ))}
      </div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
        {[['cash', 'Cash €'], ['eth', 'ETH']].map(([v, l]) => (
          <button key={v} type="button" className={`quick-pay-btn${wallet === v ? ' active' : ''}`} style={{ flex: 1 }} onClick={() => setWallet(v)}>{l}</button>
        ))}
      </div>
      <div className="form-group">
        <label className="form-label">Cantidad</label>
        <input className="form-input" type="number" min="0" step={wallet === 'eth' ? '0.0001' : '0.01'} placeholder="0" value={amount} onChange={e => setAmount(e.target.value)} autoFocus />
      </div>
      <div className="form-group">
        <label className="form-label">Nota (opcional)</label>
        <input className="form-input" placeholder="Ej: Retirada a banco" value={note} onChange={e => setNote(e.target.value)} />
      </div>
      <div style={{ display: 'flex', gap: 10 }}>
        <button className="btn btn-ghost" style={{ flex: 1 }} onClick={onClose}>Cancelar</button>
        <button className="btn btn-primary" style={{ flex: 2 }} onClick={handleSave}>Confirmar</button>
      </div>
    </Modal>
  )
}

function CardModal({ card, onClose }) {
  const { addSorareCard, updateSorareCard, sorareBalances } = useApp()
  const isEdit = !!card
  const [player, setPlayer] = useState(card?.player || '')
  const [rarity, setRarity] = useState(card?.rarity || 'limited')
  const [edition, setEdition] = useState(card?.edition || 'in_season')
  const [buyPrice, setBuyPrice] = useState(card?.buyPrice ?? '')
  const [buyEthAmount, setBuyEthAmount] = useState(card?.buyEthAmount ?? '')
  const [paymentMethod, setPaymentMethod] = useState(card?.paymentMethod || 'cash')

  const handleSave = () => {
    if (!player || buyPrice === '') return
    const data = {
      player, rarity, edition,
      buyPrice: parseFloat(buyPrice),
      paymentMethod,
      buyEthAmount: paymentMethod === 'eth' ? parseFloat(buyEthAmount) : null,
      competitions: card?.competitions || [],
    }
    if (isEdit) updateSorareCard(card.id, data)
    else addSorareCard(data)
    onClose()
  }

  return (
    <Modal title={isEdit ? 'Editar carta' : 'Comprar carta'} onClose={onClose}>
      <div className="form-group">
        <label className="form-label">Jugador</label>
        <input className="form-input" placeholder="Ej: Yamal" value={player} onChange={e => setPlayer(e.target.value)} autoFocus />
      </div>
      <div className="form-group">
        <label className="form-label">Precio (€)</label>
        <input className="form-input" type="number" min="0" step="0.01" value={buyPrice} onChange={e => setBuyPrice(e.target.value)} />
      </div>
      {!isEdit && (
        <>
          <div className="form-group">
            <label className="form-label">Pagado con</label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {SORARE_PAYMENT_METHODS.map(pm => (
                <button key={pm} type="button" className={`quick-pay-btn${paymentMethod === pm ? ' active' : ''}`} style={{ width: '100%', justifyContent: 'flex-start', padding: '12px 14px' }} onClick={() => setPaymentMethod(pm)}>
                  {SORARE_PAYMENT_LABELS[pm]}
                  {pm === 'cash' && <span style={{ marginLeft: 'auto', fontSize: 11, opacity: 0.7 }}>{fmt(sorareBalances?.cash ?? 0)}€</span>}
                  {pm === 'eth' && <span style={{ marginLeft: 'auto', fontSize: 11, opacity: 0.7 }}>{(sorareBalances?.eth ?? 0).toFixed(4)} ETH</span>}
                </button>
              ))}
            </div>
            {paymentMethod === 'apple_pay' && (
              <p style={{ fontSize: 11, color: 'var(--text3)', marginTop: 8 }}>Descuenta del banco y aparece en Gastos.</p>
            )}
          </div>
          {paymentMethod === 'eth' && (
            <div className="form-group">
              <label className="form-label">ETH gastados</label>
              <input className="form-input" type="number" min="0" step="0.0001" value={buyEthAmount} onChange={e => setBuyEthAmount(e.target.value)} />
            </div>
          )}
          <div className="form-group">
            <label className="form-label">Edición</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 12 }}>
              {SORARE_EDITIONS.map(e => (
                <button key={e} type="button" onClick={() => setEdition(e)} style={{ padding: '8px', borderRadius: 8, fontSize: 11, fontWeight: 700, border: '1px solid', borderColor: edition === e ? EDITION_STYLE[e].border : 'var(--border)', background: edition === e ? EDITION_STYLE[e].bg : 'transparent', color: edition === e ? EDITION_STYLE[e].c : 'var(--text3)' }}>
                  {EDITION_LABELS[e]}
                </button>
              ))}
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Rareza</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {SORARE_RARITIES.map(r => (
                <button key={r} type="button" onClick={() => setRarity(r)} style={{ padding: '8px', borderRadius: 8, fontSize: 11, fontWeight: 700, border: '1px solid', borderColor: rarity === r ? RARITY_STYLE[r].c : 'var(--border)', background: rarity === r ? RARITY_STYLE[r].bg : 'transparent', color: rarity === r ? RARITY_STYLE[r].c : 'var(--text3)' }}>
                  {RARITY_LABELS[r]}
                </button>
              ))}
            </div>
          </div>
        </>
      )}
      <div style={{ display: 'flex', gap: 10 }}>
        <button className="btn btn-ghost" style={{ flex: 1 }} onClick={onClose}>Cancelar</button>
        <button className="btn btn-primary" style={{ flex: 2 }} onClick={handleSave}>Guardar</button>
      </div>
    </Modal>
  )
}

function SellModal({ card, onClose }) {
  const { sellSorareCard, updateSorareSellPrice } = useApp()
  const isEdit = card?.status === 'sold'
  const [sellPrice, setSellPrice] = useState(card?.sellPrice || '')

  const handleSell = () => {
    if (!sellPrice) return
    if (isEdit) updateSorareSellPrice(card.id, parseFloat(sellPrice))
    else sellSorareCard(card.id, parseFloat(sellPrice), true)
    onClose()
  }

  return (
    <Modal title={`Vender · ${card.player}`} onClose={onClose}>
      <div style={{ background: 'var(--bg3)', borderRadius: 10, padding: '12px', marginBottom: 14, fontSize: 13 }}>
        Compra: <strong>{fmt(card.buyPrice)}€</strong>
      </div>
      <div className="form-group">
        <label className="form-label">Precio venta (€)</label>
        <input className="form-input" type="number" min="0" step="0.01" value={sellPrice} onChange={e => setSellPrice(e.target.value)} autoFocus />
      </div>
      <div style={{ display: 'flex', gap: 10 }}>
        <button className="btn btn-ghost" style={{ flex: 1 }} onClick={onClose}>Cancelar</button>
        <button className="btn btn-primary" style={{ flex: 2, background: 'var(--green)' }} onClick={handleSell}>Confirmar</button>
      </div>
    </Modal>
  )
}

export default function Sorare() {
  const {
    sorareCards, deleteSorareCard, revertSorareSale,
    sorareBalances, sorareBalanceMoves, getSorareTransactions,
    cryptoPrices, setCryptoPrices,
  } = useApp()

  const [tab, setTab] = useState('cartas')
  const [modal, setModal] = useState(null)

  const cashBalance = sorareBalances?.cash ?? 0
  const ethBalance = sorareBalances?.eth ?? 0
  const ethPriceEur = cryptoPrices?.ethereum ?? null
  const ethValueEur = ethPriceEur != null ? ethBalance * ethPriceEur : null

  useEffect(() => {
    const updatedAt = cryptoPrices?.updatedAt ? new Date(cryptoPrices.updatedAt).getTime() : 0
    if (cryptoPrices?.ethereum && Date.now() - updatedAt < 3600000) return
    fetch('https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=eur')
      .then(r => r.json())
      .then(d => { if (d?.ethereum?.eur) setCryptoPrices(p => ({ ...p, ethereum: d.ethereum.eur, updatedAt: new Date().toISOString() })) })
      .catch(() => {})
  }, [cryptoPrices?.ethereum, cryptoPrices?.updatedAt, setCryptoPrices])

  const held = sorareCards.filter(c => c.status === 'held')
  const sold = sorareCards.filter(c => c.status === 'sold')
  const sorareGastos = getSorareTransactions()
  const sortedMoves = [...sorareBalanceMoves].reverse()

  const TABS = [
    ['cartas', 'Cartas', held.length + sold.length],
    ['gastos', 'Gastos', sorareGastos.length],
    ['movs', 'Movimientos', sortedMoves.length],
  ]

  return (
    <div className="page">
      <div className="page-header page-header--row">
        <h1 className="page-title">Sorare</h1>
        <button className="btn btn-primary btn-sm" onClick={() => setModal('addCard')}>+ Carta</button>
      </div>

      <div className="sorare-balances card" style={{ marginBottom: 12 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <div className="balance-tile" style={{ background: 'rgba(34,168,90,0.08)' }}>
            <div className="balance-label">CASH</div>
            <div className="balance-value" style={{ color: 'var(--green)' }}>{fmt(cashBalance)}€</div>
          </div>
          <div className="balance-tile" style={{ background: 'rgba(10,138,173,0.08)' }}>
            <div className="balance-label">ETH</div>
            <div className="balance-value" style={{ color: 'var(--blue)' }}>{ethBalance.toFixed(4)}</div>
            {ethValueEur != null && <div style={{ fontSize: 10, color: 'var(--text3)' }}>≈ {fmt(ethValueEur)}€</div>}
          </div>
        </div>
        <button className="btn btn-ghost" style={{ width: '100%', marginTop: 12, fontSize: 12 }} onClick={() => setModal('funds')}>
          ⇄ Inyectar / Retirar dinero
        </button>
      </div>

      <div className="filter-pills" style={{ marginBottom: 14 }}>
        {TABS.map(([v, l, n]) => (
          <button key={v} type="button" className={`filter-pill${tab === v ? ' active' : ''}`} onClick={() => setTab(v)}>
            {l} {n > 0 && <span style={{ opacity: 0.7 }}>({n})</span>}
          </button>
        ))}
      </div>

      {tab === 'cartas' && (
        <>
          {held.length === 0 && sold.length === 0 && (
            <div className="empty-state card"><div className="empty-state-icon">⚽</div><p>Sin cartas. Pulsa + Carta.</p></div>
          )}
          {held.length > 0 && <div className="section-title" style={{ marginTop: 0 }}>En cartera ({held.length})</div>}
          {held.map(card => (
            <div key={card.id} className="sorare-card card" style={{ borderLeft: `3px solid ${RARITY_STYLE[card.rarity]?.c}` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div style={{ fontWeight: 800, fontSize: 16 }}>{card.player}</div>
                  <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 2 }}>
                    {RARITY_LABELS[card.rarity]} · {EDITION_LABELS[card.edition || 'classic']} · {fmt(card.buyPrice)}€
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                  <button type="button" className="btn btn-ghost btn-sm" style={{ color: 'var(--green)', borderColor: 'var(--green)' }} onClick={() => setModal({ type: 'sell', c: card })}>Vender</button>
                  <button type="button" className="btn btn-ghost btn-sm" onClick={() => setModal({ type: 'edit', c: card })}>✏️</button>
                  <button type="button" className="text-btn text-btn--muted" onClick={() => deleteSorareCard(card.id)}>✕</button>
                </div>
              </div>
            </div>
          ))}
          {sold.length > 0 && <div className="section-title">Vendidas ({sold.length})</div>}
          {sold.map(card => {
            const profit = (card.sellPrice || 0) - card.buyPrice
            return (
              <div key={card.id} className="sorare-card card" style={{ opacity: 0.85, borderLeft: `3px solid ${RARITY_STYLE[card.rarity]?.c}` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ fontWeight: 700 }}>{card.player}</div>
                    <div style={{ fontSize: 11, color: 'var(--text3)' }}>{fmt(card.buyPrice)}€ → {fmt(card.sellPrice || 0)}€</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontWeight: 700, color: profit >= 0 ? 'var(--green)' : 'var(--red)' }}>{profit >= 0 ? '+' : ''}{fmt(profit)}€</div>
                    <div style={{ display: 'flex', gap: 6, marginTop: 4, justifyContent: 'flex-end' }}>
                      <button type="button" className="text-btn" onClick={() => setModal({ type: 'sell', c: card })}>Editar</button>
                      <button type="button" className="text-btn" style={{ color: 'var(--orange)' }} onClick={() => revertSorareSale(card.id)}>Devolver</button>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </>
      )}

      {tab === 'gastos' && (
        <>
          <div style={{ fontSize: 12, color: 'var(--text2)', marginBottom: 12, lineHeight: 1.5 }}>
            Movimientos de dinero vinculados a <Link to="/gastos" style={{ color: 'var(--accent)', fontWeight: 600 }}>Gastos</Link>.
          </div>
          {sorareGastos.length === 0 ? (
            <div className="empty-state card"><p>Sin apuntes Sorare en Gastos.</p></div>
          ) : sorareGastos.map(t => (
            <div key={t.id} className="tx-row card" style={{ marginBottom: 8, padding: '12px 14px' }}>
              <div className="tx-body">
                <div className="tx-desc">{t.description}</div>
                <div className="tx-meta">{format(new Date(t.date), 'd MMM yyyy', { locale: es })} · {TX_PAYMENT_LABELS[t.paymentMethod || 'bank']}</div>
              </div>
              <div className="tx-amount" style={{ color: t.type === 'expense' ? 'var(--red)' : 'var(--green)', fontWeight: 700 }}>
                {t.type === 'expense' ? '-' : '+'}{fmt(t.amount)}€
              </div>
            </div>
          ))}
        </>
      )}

      {tab === 'movs' && (
        <>
          {sortedMoves.length === 0 ? (
            <div className="empty-state card"><p>Sin movimientos internos Sorare.</p></div>
          ) : sortedMoves.map(m => (
            <div key={m.id} className="card" style={{ marginBottom: 8, padding: '12px 14px', borderLeft: `3px solid ${m.type === 'deposit' ? 'var(--green)' : 'var(--red)'}` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>{m.note || m.category}</div>
                  <div style={{ fontSize: 11, color: 'var(--text3)' }}>{format(new Date(m.date), 'd MMM, HH:mm', { locale: es })} · {m.wallet?.toUpperCase()}</div>
                </div>
                <div style={{ fontWeight: 700, color: m.type === 'deposit' ? 'var(--green)' : 'var(--red)' }}>
                  {m.type === 'deposit' ? '+' : '−'}{m.wallet === 'eth' ? `${Number(m.amount).toFixed(4)} ETH` : `${fmt(m.amount)}€`}
                </div>
              </div>
            </div>
          ))}
        </>
      )}

      {modal === 'funds' && <FundModal onClose={() => setModal(null)} />}
      {modal === 'addCard' && <CardModal card={null} onClose={() => setModal(null)} />}
      {modal?.type === 'edit' && <CardModal card={modal.c} onClose={() => setModal(null)} />}
      {modal?.type === 'sell' && <SellModal card={modal.c} onClose={() => setModal(null)} />}
    </div>
  )
}
