import React, { useState, useRef, useCallback, useEffect } from 'react'

const DISMISS_THRESHOLD = 90
const VELOCITY_THRESHOLD = 0.45
const CLOSE_MS = 240

export default function Modal({ title, onClose, children, wide }) {
  const [closing, setClosing] = useState(false)
  const [dragY, setDragY] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const dragYRef = useRef(0)
  const draggingRef = useRef(false)
  const startY = useRef(0)
  const startDragY = useRef(0)
  const lastY = useRef(0)
  const lastTime = useRef(0)
  const velocity = useRef(0)

  const requestClose = useCallback(() => {
    if (closing) return
    setClosing(true)
    draggingRef.current = false
    setIsDragging(false)
    window.setTimeout(onClose, CLOSE_MS)
  }, [onClose, closing])

  useEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = prev }
  }, [])

  const onPointerDown = (e) => {
    if (closing) return
    draggingRef.current = true
    setIsDragging(true)
    startY.current = e.clientY
    startDragY.current = dragYRef.current
    lastY.current = e.clientY
    lastTime.current = performance.now()
    velocity.current = 0
    e.currentTarget.setPointerCapture(e.pointerId)
  }

  const onPointerMove = (e) => {
    if (!draggingRef.current || closing) return
    const delta = e.clientY - startY.current
    const next = Math.max(0, startDragY.current + delta)
    const now = performance.now()
    const dt = now - lastTime.current
    if (dt > 0) velocity.current = (e.clientY - lastY.current) / dt
    lastY.current = e.clientY
    lastTime.current = now
    dragYRef.current = next
    setDragY(next)
  }

  const endDrag = () => {
    if (!draggingRef.current) return
    draggingRef.current = false
    setIsDragging(false)
    const y = dragYRef.current
    if (y > DISMISS_THRESHOLD || velocity.current > VELOCITY_THRESHOLD) {
      requestClose()
    } else {
      dragYRef.current = 0
      setDragY(0)
    }
  }

  const overlayStyle = closing
    ? undefined
    : { opacity: Math.max(0.15, 1 - dragY / 420) }

  const sheetStyle = closing
    ? undefined
    : dragY > 0
      ? { transform: `translateY(${dragY}px)` }
      : undefined

  return (
    <div
      className={`modal-overlay${closing ? ' modal-overlay--closing' : ''}`}
      style={overlayStyle}
      onClick={requestClose}
      role="presentation"
    >
      <div
        className={[
          'modal-sheet',
          wide ? 'modal-sheet--wide' : '',
          isDragging ? 'modal-sheet--dragging' : '',
          closing ? 'modal-sheet--closing' : '',
        ].filter(Boolean).join(' ')}
        style={sheetStyle}
        onClick={e => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <div
          className="modal-drag-zone"
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={endDrag}
          onPointerCancel={endDrag}
        >
          <div className="modal-handle" aria-hidden="true" />
          <span className="modal-drag-hint">Desliza para cerrar</span>
        </div>
        {title && <h2 className="modal-title">{title}</h2>}
        {children}
      </div>
    </div>
  )
}
