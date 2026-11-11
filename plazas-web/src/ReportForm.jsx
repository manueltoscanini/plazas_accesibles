import { useState } from 'react'
import { request } from './api'
import LocationPicker from './LocationPicker'

import { photoAccept, uploadPhoto } from './photoUpload'

// Acá contás qué encontraste, marcás dónde queda y podés adjuntar una foto.
export default function ReportForm({ square, token, onExpired }) {
  const [type, setType] = useState('Hazard')
  const [position, setPosition] = useState(null)
  const [uploadedPicture, setUploadedPicture] = useState(null)
  const [step, setStep] = useState('')
  const [error, setError] = useState('')
  const [sent, setSent] = useState(false)
  const asksAccessibility = type === 'WC' || type === 'Playground'

  // Antes de mandar el reporte miro que haya texto y un punto. Si pusiste una foto, la subo primero.
  async function submit(event) {
    event.preventDefault()
    const values = new FormData(event.currentTarget)
    const description = values.get('description').trim()
    if (!description) { setError('Describí lo que encontraste.'); return }
    if (!position) { setError('Marcá la ubicación del hallazgo en el mapa.'); return }

    const file = values.get('image')
    setError('')
    try {
      // Me guardo el enlace por si hay que reintentar el envío. Así no subo la misma foto otra vez.
      let picture = uploadedPicture
      if (file?.name && !picture) {
        setStep('Subiendo foto…')
        picture = await uploadPhoto(file, token)
        setUploadedPicture(picture)
      }

      setStep('Enviando…')
      await request('/reports/create', {
        token,
        body: {
          publicSquareId: square._id,
          changes: {
            // Según lo que elegiste, armo el nombre del cambio. Por ejemplo, una rampa va como addRamp.
            [`add${type}`]: {
              description,
              ...position,
              ...(picture && { picture }),
              ...(asksAccessibility && { accessible: values.get('accessible') === 'on' }),
            },
          },
        },
      })
      setSent(true)
    } catch (err) { setError(err.message); if (err.status === 401) onExpired() }
    finally { setStep('') }
  }
  if (sent) return <div className="report-success" role="status"><span className="symbol">✓</span><h2 id="modal-title">Gracias por aportar</h2><p>Tu reporte sobre {square.name} quedó pendiente de revisión. La ficha se actualizará cuando se apruebe.</p></div>
  return <><div className="dialog-heading"><h2 id="modal-title">Reportar un hallazgo</h2><p>{square.name}</p></div>
    <form onSubmit={submit}>
      <fieldset className="finding-fields" disabled={Boolean(step)}>
        <label>¿Qué encontraste?
          <select value={type} onChange={event => setType(event.target.value)}>
            <option value="Hazard">Un obstáculo o peligro</option>
            <option value="Ramp">Una rampa</option>
            <option value="WC">Un baño</option>
            <option value="Playground">Una zona de juegos</option>
          </select>
        </label>
        <LocationPicker square={square} selected={Boolean(position)} onSelect={setPosition} disabled={Boolean(step)} />
        <label>Contanos los detalles
          <textarea name="description" rows={3} required maxLength={1500} placeholder="Por ejemplo, una rama bloquea el paso en la esquina…" />
        </label>
        {asksAccessibility && <label className="checkbox"><input name="accessible" type="checkbox" /> Es accesible para silla de ruedas</label>}
        <label>Foto del hallazgo (opcional)
          <input name="image" type="file" accept={photoAccept} onChange={() => setUploadedPicture(null)} />
          <small className="muted">JPG, PNG o WEBP de hasta 5 MB.</small>
        </label>
      </fieldset>
      {error && <p className="error" role="alert">{error}</p>}
      <button className="primary full" disabled={Boolean(step)}>{step || 'Enviar a revisión'}</button>
    </form></>
}
