export default function Modal({ title, onClose, children, wide }) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className={`modal-sheet${wide ? ' modal-sheet--wide' : ''}`} onClick={e => e.stopPropagation()}>
        <div className="modal-handle" />
        {title && <h2 className="modal-title">{title}</h2>}
        {children}
      </div>
    </div>
  )
}
