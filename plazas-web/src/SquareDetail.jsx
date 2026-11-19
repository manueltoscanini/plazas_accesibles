import { useState } from 'react'
import Modal from './Modal'
import PhotoGallery from './PhotoGallery'
import { getPhotoCaptions, getSquarePhotos, photoTitles } from './photos'

// Distingo si hay, si se confirmó que no existen o si todavía no se registraron datos.
function formatCondition(exists, whenTrue, whenFalse, whenUnregistered) {
  if (exists === true) return whenTrue
  if (exists === false) return whenFalse
  return whenUnregistered
}

// Acá armo lo que ves cuando abrís una plaza: accesibilidad, fotos y botones para aportar.
export default function SquareDetail({ square, signedIn, onReport, onAddPhoto }) {
  const [gallery, setGallery] = useState(null)
  const photos = getSquarePhotos(square)
  const captions = getPhotoCaptions(photos)
  const paths = square.paths
  const wcs = square.elements?.wcs ?? []
  const accessibleWc = wcs.length
    ? wcs.some(wc => wc.accessible)
    : square.wc?.exists === false ? false : square.wc?.accessible
  const updatedAt = Date.parse(square.updatedAt)
  // Cada fila muestra una condición de la plaza y abre las fotos de ese tipo.
  const conditions = [
    { category: 'ramps', label: 'Rampas', value: formatCondition(square.ramps?.exists, 'Hay rampas', 'Sin rampas existentes', 'Sin rampas registradas') },
    { category: 'paths', label: 'Caminos internos', value: paths?.description || formatCondition(paths?.exists, paths?.accessible ? 'Registrados como accesibles' : 'Consultar condiciones', 'Sin caminos existentes', 'Sin caminos registrados') },
    { category: 'wcs', label: 'Baños', value: formatCondition(square.wc?.exists, 'Hay baños', 'Sin baños existentes', 'Sin baños registrados') },
    { category: 'accessibleWcs', label: 'Baños accesibles', value: formatCondition(accessibleWc, 'Hay baños accesibles', 'Sin baños accesibles existentes', 'Sin baños accesibles registrados') },
    { category: 'playgrounds', label: 'Zona de juegos', value: formatCondition(square.playground?.exists, 'Hay juegos', 'Sin juegos existentes', 'Sin juegos registrados') },
    { category: 'hazards', label: 'Obstáculos', value: formatCondition(square.hazards?.exists, 'Hay obstáculos reportados', 'Sin obstáculos existentes', 'Sin obstáculos registrados') },
  ]

  return <div className="detail-content">
    <p className="place-label">Paysandú, Uruguay</p>
    <h2>{square.name}</h2>
    <p className="updated">Última actualización · {Number.isNaN(updatedAt) ? 'Sin fecha registrada' : <time dateTime={square.updatedAt}>{new Date(updatedAt).toLocaleDateString('es-UY')}</time>}</p>
    {square.description && <p className="square-description">{square.description}</p>}
    <h3>Para planear tu visita</h3>
    <dl className="conditions">
      {conditions.map(({ category, label, value }) => {
        const action = `Ver ${photoTitles[category].toLowerCase()}`
        return <div key={category} className="photo-condition">
          <dt><button className="condition-photo-button" aria-haspopup="dialog" aria-label={`${label}. ${action}`} onClick={() => setGallery({ category, index: 0 })}>
            {label}<span className="photo-hint" aria-hidden="true">{action}</span>
          </button></dt>
          <dd className={category === 'hazards' && square.hazards?.exists ? 'warning-text' : undefined}>{value}</dd>
        </div>
      })}
    </dl>
    {square.accessibilityDescription && <div className="accessibility-note">
      <h3>Sobre la accesibilidad</h3><p>{square.accessibilityDescription}</p>
    </div>}
    {/* Acá muestro la descripción de cada obstáculo que trae la ficha. */}
    {square.elements?.hazards?.map(hazard => <p className="hazard-note" key={hazard._id}>{hazard.description || 'Obstáculo sin descripción'}</p>)}
    <section aria-labelledby="square-photos-title">
      <h3 id="square-photos-title">{photoTitles.all}</h3>
      <PhotoGallery photos={photos.all} label={square.name} captions={captions} onOpen={index => setGallery({ category: 'all', index })} />
      <button className="secondary gallery-add" onClick={() => onAddPhoto('all')}>Agregar una foto</button>
    </section>
    <button className="primary full" onClick={onReport}>Reportar un hallazgo <span aria-hidden="true">↗</span></button>
    {!signedIn && <p className="report-hint">Iniciá sesión para aportar información.</p>}
    {gallery && <Modal className="photo-dialog" onClose={() => setGallery(null)}>
      <div className="dialog-heading">
        <h2 id="modal-title">{photoTitles[gallery.category]}</h2>
        <p>{square.name}</p>
      </div>
      <PhotoGallery photos={photos[gallery.category]} label={`${photoTitles[gallery.category]}, ${square.name}`} captions={gallery.category === 'all' ? captions : undefined} startAt={gallery.index} />
      <button className="secondary gallery-add" onClick={() => { onAddPhoto(gallery.category); setGallery(null) }}>Agregar una foto</button>
    </Modal>}
  </div>
}
