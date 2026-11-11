import { useLayoutEffect, useRef } from 'react'
// Uso el dialog del navegador para abrir las ventanas. Podés cerrarlas con Escape y el foco queda adentro mientras están abiertas.
export default function Modal({ children, onClose, className }) {
  const dialog = useRef(null)
  // Cierro la ventana antes de sacarla para que el navegador pueda devolver el foco al botón que la abrió.
  useLayoutEffect(() => {
    const element = dialog.current
    element.showModal()
    return () => element.close()
  }, [])
  return <dialog ref={dialog} className={className} aria-labelledby="modal-title" onCancel={onClose} onClick={event => { if (event.target === dialog.current) onClose() }}><div className="dialog-content"><button className="close-button" aria-label="Cerrar ventana" onClick={onClose}>×</button>{children}</div></dialog>
}
