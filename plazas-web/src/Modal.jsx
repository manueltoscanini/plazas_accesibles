import { useEffect, useRef } from 'react'
export default function Modal({ children, onClose, className }) {
  const dialog = useRef(null)
  useEffect(() => {
    const element = dialog.current
    element.showModal()
    return () => element.close()
  }, [])
  return <dialog ref={dialog} className={className} aria-labelledby="modal-title" onCancel={onClose} onClick={event => { if (event.target === dialog.current) onClose() }}><div className="dialog-content"><button className="close-button" aria-label="Cerrar ventana" onClick={onClose}>×</button>{children}</div></dialog>
}
