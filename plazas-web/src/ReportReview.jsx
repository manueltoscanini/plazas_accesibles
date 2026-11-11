import { useEffect, useState } from 'react'
import { request } from './api'
import { photoTitles } from './photos'

const actions = { add: 'Agregar', modify: 'Modificar', delete: 'Quitar' }
const elements = { WC: 'baño', Playground: 'zona de juegos', Ramp: 'rampa', Hazard: 'obstáculo' }

// Acá cambio nombres como addWC por algo que se pueda leer, como «Agregar baño».
function describeChange(key, change) {
  if (key === 'addPicture' || key === 'deletePicture') {
    const category = Object.hasOwn(photoTitles, change.category) ? change.category : 'all'
    return `${key === 'addPicture' ? 'Agregar foto' : 'Quitar foto'} · ${photoTitles[category]}`
  }
  const match = key.match(/^(add|modify|delete)(WC|Playground|Ramp|Hazard)$/)
  return match ? `${actions[match[1]]} ${elements[match[2]]}` : 'Cambio en la ficha'
}

// Es la pantalla donde ves los reportes pendientes y elegís si se aprueban o se rechazan.
export default function ReportReview({ squares, token, onApproved }) {
  const [reports, setReports] = useState(null)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [busy, setBusy] = useState(null)
  const [reload, setReload] = useState(0)

  // Al abrir esta ventana pido los pendientes. Si la cerrás, cancelo el pedido.
  useEffect(() => {
    const controller = new AbortController()
    request('/reports/pending', { token, signal: AbortSignal.any([controller.signal, AbortSignal.timeout(15000)]) })
      .then(data => {
        if (!Array.isArray(data)) throw new Error('La API no devolvió una lista de pendientes.')
        if (!controller.signal.aborted) setReports(data)
      })
      .catch(err => { if (!controller.signal.aborted) setError(err.message) })
    return () => controller.abort()
  }, [token, reload])

  // Le mando a la API lo que decidiste. Si ya se resolvió, lo saco de la lista.
  async function review(report, action) {
    setBusy(report._id)
    setError('')
    setNotice('')
    try {
      await request(`/reports/${action}`, { token, body: { reportId: report._id } })
      setReports(current => current.filter(item => item._id !== report._id))
      setNotice(action === 'approve' ? 'Reporte aprobado. La ficha ya está actualizada.' : 'Reporte rechazado.')
      if (action === 'approve') onApproved()
    } catch (err) {
      if (err.status === 409) {
        setReports(current => current.filter(item => item._id !== report._id))
        setNotice('El reporte ya fue resuelto.')
        onApproved()
      } else setError(err.message)
    } finally { setBusy(null) }
  }

  return <>
    <div className="dialog-heading"><h2 id="modal-title">Reportes pendientes</h2></div>
    {notice && <p className="photo-status" role="status">{notice}</p>}
    {error && <p className="error" role="alert">{error}</p>}
    {!reports && !error && <p role="status">Cargando pendientes…</p>}
    {!reports && error && <button className="secondary" onClick={() => { setError(''); setReload(value => value + 1) }}>Reintentar</button>}
    {reports?.length === 0 && <p className="photo-status">No hay reportes pendientes.</p>}
    {reports?.length > 0 && <ul className="review-list">
      {reports.map(report => <li key={report._id}>
        <h3>{squares.find(square => square._id === report.publicSquareId)?.name ?? 'Plaza del reporte'}</h3>
        {Object.entries(report.changes ?? {}).map(([key, change]) => {
          const photo = key.endsWith('Picture') ? change.url : change.picture
          return <div className="review-change" key={key}>
            <strong>{describeChange(key, change)}</strong>
            {typeof change.description === 'string' && <p>{change.description}</p>}
            {Number.isFinite(change.lat) && Number.isFinite(change.lon) && <a href={`https://www.openstreetmap.org/?mlat=${change.lat}&mlon=${change.lon}#map=19/${change.lat}/${change.lon}`} target="_blank" rel="noreferrer">Ver ubicación</a>}
            {typeof change.accessible === 'boolean' && <p>{change.accessible ? 'Accesible para silla de ruedas' : 'Sin acceso para silla de ruedas'}</p>}
            {typeof photo === 'string' && /^https?:\/\/\S+$/i.test(photo) && <img src={photo} alt="Foto del reporte" loading="lazy" />}
          </div>
        })}
        <div className="review-actions">
          <button className="primary" disabled={Boolean(busy)} onClick={() => review(report, 'approve')}>Aprobar</button>
          <button className="secondary" disabled={Boolean(busy)} onClick={() => review(report, 'reject')}>Rechazar</button>
        </div>
      </li>)}
    </ul>}
  </>
}
