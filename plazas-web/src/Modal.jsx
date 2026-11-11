import { useEffect, useRef } from 'react'
// Uso el dialog del navegador para abrir las ventanas. Podés cerrarlas con Escape y el foco queda adentro mientras están abiertas.
export default function Modal({ children, onClose, className }) {
  const dialog = useRef(null)
  // Abro la ventana cuando aparece este componente y la cierro cuando deja de mostrarse.
  useEffect(() => {
    const element = dialog.current
    element.showModal()
    return () => element.close()
  }, [])
  return <dialog ref={dialog} className={className} aria-labelledby="modal-title" onCancel={onClose} onClick={event => { if (event.target === dialog.current) onClose() }}><div className="dialog-content"><button className="close-button" aria-label="Cerrar ventana" onClick={onClose}>×</button>{children}</div></dialog>
}
