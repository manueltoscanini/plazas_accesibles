import { useState } from 'react'

export default function PhotoGallery({ photos, label, captions, startAt = 0, onOpen }) {
  const [index, setIndex] = useState(startAt)
  const [failedUrl, setFailedUrl] = useState(null)

  if (!photos.length) return <p className="photo-status">Todavía no hay fotos en esta galería.</p>

  const url = photos[index]
  const caption = captions?.get(url)
  const position = `${index + 1} de ${photos.length}`
  const photo = failedUrl === url
    ? <p className="photo-status" role="status">No se pudo cargar esta foto.</p>
    : <img src={url} alt={`${label}${caption ? `, ${caption}` : ''}, foto ${position}`} onError={() => setFailedUrl(url)} />

  function move(offset) {
    setIndex(current => (current + offset + photos.length) % photos.length)
  }

  return <>
    <figure className="photo-figure">
      <div className="photo-frame">
        {onOpen && failedUrl !== url
          ? <button className="photo-preview" aria-label={`Ampliar foto ${position}`} aria-haspopup="dialog" onClick={() => onOpen(index)}>{photo}</button>
          : photo}
      </div>
      {caption && <figcaption>{caption}</figcaption>}
    </figure>
    {photos.length > 1 && <div className="photo-controls">
      <button className="secondary" onClick={() => move(-1)} aria-label="Foto anterior">←</button>
      <span aria-live="polite">{position}</span>
      <button className="secondary" onClick={() => move(1)} aria-label="Foto siguiente">→</button>
    </div>}
  </>
}
