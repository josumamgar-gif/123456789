import React, { useState } from 'react'
import { useApp } from '../context/AppContext'
import { SORARE_COMPETITIONS, SORARE_RARITIES, RARITY_LABELS } from '../data/defaults'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

const fmt = (n) => n.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

const RARITY_STYLE = {
  limited:   { bg: 'rgba(9,136,176,0.1)',   c: '#0988b0' },
  rare:      { bg: 'rgba(59,111,240,0.1)',   c: '#3b6ff0' },
  super_rare:{ bg: 'rgba(201,135,10,0.1)',   c: '#c9870a' },
  unique:    { bg: 'rgba(201,96,16,0.1)',    c: '#c96010' },
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

function CardModal({ card, onClose }) {
  const { addSorareCard, updateSorareCard, sorareCompetitions, setSorareCompetitions } = useApp()
  const isEdit = !!card
  const [player, setPlayer] = useState(card?.player || '')
  const [rarity, setRarity] = useState(card?.rarity || 'limited')
  const [buyPrice, setBuyPrice] = useState(card?.buyPrice || '')
  const [selectedComps, setSelectedComps] = useState(card?.competitions || [])
  const [customComp, setCustomComp] = useState('')

  const allComps = [...SORARE_COMPETITIONS, ...sorareCompetitions]

  const toggleComp = (c) =>
    setSelectedComps(prev => prev.includes(c) ? prev.filter(x => x !== c) : [...prev, c])

  const addCustom = () => {
    if (!customComp.trim()) return
    if (!sorareCompetitions.includes(customComp.trim()))
      setSorareCompetitions(prev => [...prev, customComp.trim()])
    setCustomComp('')
  }

  const handleSave = () => {
    if (!player || !buyPrice) return
    const data = { player, rarity, buyPrice: parseFloat(buyPrice), competitions: selectedComps }
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
  const { updateSorareCard } = useApp()
  const [sellPrice, setSellPrice] = useState(card?.sellPrice || '')

  const handleSell = () => {
    if (!sellPrice) return
    updateSorareCard(card.id, {
      status: 'sold',
      sellPrice: parseFloat(sellPrice),
      sellDate: card.sellDate || new Date().toISOString(),
    })
    onClose()
  }

  const profit = sellPrice ? parseFloat(sellPrice) - card.buyPrice : null

  return (
    <Modal title={`Vender — ${card.player}`} onClose={onClose}>
      <div style={{ background: 'var(--bg3)', borderRadius: 8, padding: '10px 12px', marginBottom: 14, fontSize: 12 }}>
        Compra: <strong>{fmt(card.buyPrice)}€</strong>
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
      <div style={{ display: 'flex', gap: 10 }}>
        <button className="btn btn-ghost" style={{ flex: 1 }} onClick={onClose}>Cancelar</button>
        <button className="btn btn-primary" style={{ flex: 2, background: 'var(--green)' }} onClick={handleSell}>Confirmar venta</button>
      </div>
    </Modal>
  )
}

function PrizeModal({ prize, onClose }) {
  const { addSorarePrize, setSorarePrizes, sorarePrizes } = useApp()
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

export default function Sorare() {
  const { sorareCards, deleteSorareCard, updateSorareCard, sorarePrizes, setSorarePrizes } = useApp()
  const [tab, setTab] = useState('cartera')
  const [filterRarity, setFilterRarity] = useState('all')
  const [modal, setModal] = useState(null)
  // modal types: 'addCard' | {type:'editCard',c} | {type:'sell',c} | {type:'unsell',c}
  //              'addPrize' | {type:'editPrize',p}

  const held = sorareCards.filter(c => c.status === 'held')
  const sold = sorareCards.filter(c => c.status === 'sold')

  const totalInvested  = sorareCards.reduce((s, c) => s + c.buyPrice, 0)
  const totalSoldFor   = sold.reduce((s, c) => s + (c.sellPrice || 0), 0)
  const totalPrizesEth = sorarePrizes.reduce((s, p) => s + p.ethAmount, 0)
  const totalPrizesEur = sorarePrizes.reduce((s, p) => s + (p.euroValue || 0), 0)
  const heldValue      = held.reduce((s, c) => s + c.buyPrice, 0)
  const netResult      = totalSoldFor + totalPrizesEur - totalInvested

  const filteredHeld = filterRarity === 'all' ? held : held.filter(c => c.rarity === filterRarity)
  const filteredSold = filterRarity === 'all' ? sold : sold.filter(c => c.rarity === filterRarity)

  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-title">Sorare</h1>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-ghost" style={{ padding: '7px 11px', fontSize: 11 }} onClick={() => setModal('addPrize')}>+ Premio</button>
          <button className="btn btn-primary" style={{ padding: '7px 13px', fontSize: 13 }} onClick={() => setModal('addCard')}>+ Carta</button>
        </div>
      </div>

      {/* Balance */}
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

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 7, marginBottom: 12 }}>
        {[['cartera', `Cartera (${held.length})`], ['vendidas', `Vendidas (${sold.length})`], ['premios', `Premios (${sorarePrizes.length})`]].map(([v, l]) => (
          <button key={v} onClick={() => setTab(v)} style={{
            padding: '5px 13px', borderRadius: 20, fontSize: 12, fontWeight: 600, whiteSpace: 'nowrap',
            background: tab === v ? 'var(--accent)' : 'var(--bg3)',
            color: tab === v ? '#fff' : 'var(--text2)',
            border: '1px solid ' + (tab === v ? 'var(--accent)' : 'var(--border)'),
          }}>
            {l}
          </button>
        ))}
      </div>

      {/* Rarity filter */}
      {tab !== 'premios' && (
        <div className="scroll-x" style={{ marginBottom: 12 }}>
          <div style={{ display: 'flex', gap: 6, width: 'max-content' }}>
            <button onClick={() => setFilterRarity('all')} style={{ padding: '4px 12px', borderRadius: 20, fontSize: 11, fontWeight: 600, background: filterRarity === 'all' ? 'var(--bg2)' : 'transparent', color: filterRarity === 'all' ? 'var(--text)' : 'var(--text3)', border: '1px solid ' + (filterRarity === 'all' ? 'var(--border2)' : 'var(--border)') }}>
              Todas
            </button>
            {SORARE_RARITIES.map(r => (
              <button key={r} onClick={() => setFilterRarity(r)} style={{ padding: '4px 12px', borderRadius: 20, fontSize: 11, fontWeight: 600, background: filterRarity === r ? RARITY_STYLE[r].bg : 'transparent', color: filterRarity === r ? RARITY_STYLE[r].c : 'var(--text3)', border: '1px solid ' + (filterRarity === r ? RARITY_STYLE[r].c : 'var(--border)') }}>
                {RARITY_LABELS[r]}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Cartera */}
      {tab === 'cartera' && (
        <>
          {filteredHeld.length === 0 && (
            <div className="card" style={{ textAlign: 'center', padding: '32px 14px' }}>
              <div style={{ fontSize: 26, marginBottom: 8 }}>⚽</div>
              <div style={{ color: 'var(--text3)', fontSize: 13 }}>Sin cartas en cartera.</div>
            </div>
          )}
          {filteredHeld.map(card => (
            <div key={card.id} className="card" style={{ marginBottom: 10, borderLeft: `3px solid ${RARITY_STYLE[card.rarity]?.c || 'var(--border)'}` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontFamily: 'var(--font-head)', fontWeight: 700, fontSize: 15 }}>{card.player}</div>
                  <span style={{ display: 'inline-block', padding: '2px 8px', borderRadius: 4, fontSize: 10, fontWeight: 700, marginTop: 4, background: RARITY_STYLE[card.rarity]?.bg, color: RARITY_STYLE[card.rarity]?.c }}>
                    {RARITY_LABELS[card.rarity]}
                  </span>
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
                    <button className="btn btn-ghost" style={{ padding: '4px 9px', fontSize: 11, color: 'var(--green)', borderColor: '#1e9e5640' }}
                      onClick={() => setModal({ type: 'sell', c: card })}>Vender</button>
                    <button className="btn btn-ghost" style={{ padding: '4px 9px', fontSize: 11 }}
                      onClick={() => setModal({ type: 'editCard', c: card })}>✏️</button>
                    <button onClick={() => deleteSorareCard(card.id)} style={{ fontSize: 11, color: 'var(--text3)', background: 'none', border: 'none', cursor: 'pointer', padding: '4px 2px' }}>✕</button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </>
      )}

      {/* Vendidas */}
      {tab === 'vendidas' && (
        <>
          {filteredSold.length === 0 && (
            <div className="card" style={{ textAlign: 'center', padding: '32px 14px' }}>
              <div style={{ fontSize: 26, marginBottom: 8 }}>💰</div>
              <div style={{ color: 'var(--text3)', fontSize: 13 }}>Sin cartas vendidas.</div>
            </div>
          )}
          {filteredSold.map(card => {
            const profit = (card.sellPrice || 0) - card.buyPrice
            return (
              <div key={card.id} className="card" style={{ marginBottom: 10 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <div style={{ fontFamily: 'var(--font-head)', fontWeight: 700, fontSize: 15 }}>{card.player}</div>
                    <span style={{ display: 'inline-block', padding: '2px 8px', borderRadius: 4, fontSize: 10, fontWeight: 700, marginTop: 4, background: RARITY_STYLE[card.rarity]?.bg, color: RARITY_STYLE[card.rarity]?.c }}>
                      {RARITY_LABELS[card.rarity]}
                    </span>
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
                      <button className="btn btn-ghost" style={{ padding: '4px 9px', fontSize: 11 }}
                        onClick={() => setModal({ type: 'sell', c: card })}>✏️ Editar venta</button>
                      <button className="btn btn-ghost" style={{ padding: '4px 9px', fontSize: 11, color: 'var(--orange)' }}
                        onClick={() => { updateSorareCard(card.id, { status: 'held', sellPrice: null, sellDate: null }) }}>
                        Devolver
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </>
      )}

      {/* Premios */}
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

      {modal === 'addCard'          && <CardModal  card={null}    onClose={() => setModal(null)} />}
      {modal?.type === 'editCard'   && <CardModal  card={modal.c} onClose={() => setModal(null)} />}
      {modal?.type === 'sell'       && <SellModal  card={modal.c} onClose={() => setModal(null)} />}
      {modal === 'addPrize'         && <PrizeModal prize={null}   onClose={() => setModal(null)} />}
      {modal?.type === 'editPrize'  && <PrizeModal prize={modal.p} onClose={() => setModal(null)} />}
    </div>
  )
}
