import React, { useState, useRef, useCallback, useEffect } from 'react'

const DISMISS_THRESHOLD = 90
const VELOCITY_THRESHOLD = 0.45
const DRAG_START_THRESHOLD = 10
const OPEN_MS = 420
const CLOSE_MS = 240

function lockBodyScroll() {
  const scrollY = window.scrollY
  document.body.classList.add('modal-open')
  document.body.style.top = `-${scrollY}px`
  return scrollY
}

function unlockBodyScroll(scrollY) {
  document.body.classList.remove('modal-open')
  document.body.style.top = ''
  window.scrollTo(0, scrollY)
}

export default function Modal({ title, onClose, children, wide }) {
  const [closing, setClosing] = useState(false)
  const [ready, setReady] = useState(false)
  const [dragY, setDragY] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const [sheetMaxHeight, setSheetMaxHeight] = useState(null)

  const sheetRef = useRef(null)
  const dragZoneRef = useRef(null)
  const dragYRef = useRef(0)
  const draggingRef = useRef(false)
  const pendingDragRef = useRef(false)
  const didDragRef = useRef(false)
  const pointerIdRef = useRef(null)
  const startY = useRef(0)
  const startDragY = useRef(0)
  const lastY = useRef(0)
  const lastTime = useRef(0)
  const velocity = useRef(0)
  const scrollYRef = useRef(0)

  const requestClose = useCallback(() => {
    if (closing) return
    const active = document.activeElement
    if (active && typeof active.blur === 'function') active.blur()
    setClosing(true)
    draggingRef.current = false
    pendingDragRef.current = false
    setIsDragging(false)
    window.setTimeout(onClose, CLOSE_MS)
  }, [onClose, closing])

  useEffect(() => {
    scrollYRef.current = lockBodyScroll()

    const active = document.activeElement
    if (active && !active.closest('.modal-sheet') && ['INPUT', 'TEXTAREA', 'SELECT'].includes(active.tagName)) {
      active.blur()
    }

    const openTimer = window.setTimeout(() => setReady(true), OPEN_MS)
    return () => {
      window.clearTimeout(openTimer)
      unlockBodyScroll(scrollYRef.current)
    }
  }, [])

  useEffect(() => {
    const sheet = sheetRef.current
    if (!sheet) return undefined
    const autoEl = sheet.querySelector('[autofocus], [data-autofocus]')
    if (!autoEl) return undefined
    autoEl.removeAttribute('autofocus')
    const focusTimer = window.setTimeout(() => {
      autoEl.focus({ preventScroll: true })
    }, OPEN_MS)
    return () => window.clearTimeout(focusTimer)
  }, [])

  useEffect(() => {
    const vv = window.visualViewport
    if (!vv) return

    const update = () => {
      setSheetMaxHeight(Math.max(240, Math.floor(vv.height * 0.92)))
    }

    update()
    vv.addEventListener('resize', update)
    vv.addEventListener('scroll', update)
    return () => {
      vv.removeEventListener('resize', update)
      vv.removeEventListener('scroll', update)
    }
  }, [])

  const releaseCapture = (target) => {
    if (pointerIdRef.current == null || !target) return
    try {
      target.releasePointerCapture(pointerIdRef.current)
    } catch {
      /* ignore */
    }
    pointerIdRef.current = null
  }

  const onPointerDown = (e) => {
    if (closing || !ready) return
    if (e.pointerType === 'mouse' && e.button !== 0) return

    pendingDragRef.current = true
    startY.current = e.clientY
    startDragY.current = dragYRef.current
    lastY.current = e.clientY
    lastTime.current = performance.now()
    velocity.current = 0
    pointerIdRef.current = e.pointerId
  }

  const onPointerMove = (e) => {
    if (!pendingDragRef.current && !draggingRef.current) return
    if (closing || !ready) return

    const delta = e.clientY - startY.current

    if (!draggingRef.current) {
      if (delta <= DRAG_START_THRESHOLD) return
      draggingRef.current = true
      didDragRef.current = true
      setIsDragging(true)
      dragZoneRef.current?.setPointerCapture(e.pointerId)
    }

    const next = Math.max(0, startDragY.current + delta)
    const now = performance.now()
    const dt = now - lastTime.current
    if (dt > 0) velocity.current = (e.clientY - lastY.current) / dt
    lastY.current = e.clientY
    lastTime.current = now
    dragYRef.current = next
    setDragY(next)
  }

  const endDrag = (e) => {
    releaseCapture(e.currentTarget)
    pendingDragRef.current = false

    if (!draggingRef.current) return

    draggingRef.current = false
    setIsDragging(false)

    const y = dragYRef.current
    if (y > DISMISS_THRESHOLD || velocity.current > VELOCITY_THRESHOLD) {
      requestClose()
    } else {
      dragYRef.current = 0
      setDragY(0)
      window.setTimeout(() => { didDragRef.current = false }, 0)
    }
  }

  const onOverlayClick = (e) => {
    if (e.target !== e.currentTarget) return
    if (didDragRef.current) {
      didDragRef.current = false
      return
    }
    requestClose()
  }

  const overlayStyle = closing
    ? undefined
    : { opacity: Math.max(0.15, 1 - dragY / 420) }

  const sheetStyle = {
    ...(sheetMaxHeight ? { maxHeight: `${sheetMaxHeight}px` } : {}),
    ...(closing
      ? {}
      : dragY > 0
        ? { transform: `translateY(${dragY}px)` }
        : {}),
  }

  return (
    <div
      className={`modal-overlay${closing ? ' modal-overlay--closing' : ''}${ready ? ' modal-overlay--ready' : ''}`}
      style={overlayStyle}
      onClick={onOverlayClick}
      role="presentation"
    >
      <div
        ref={sheetRef}
        className={[
          'modal-sheet',
          wide ? 'modal-sheet--wide' : '',
          ready ? 'modal-sheet--ready' : '',
          isDragging ? 'modal-sheet--dragging' : '',
          closing ? 'modal-sheet--closing' : '',
        ].filter(Boolean).join(' ')}
        style={sheetStyle}
        onClick={e => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <div
          ref={dragZoneRef}
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
