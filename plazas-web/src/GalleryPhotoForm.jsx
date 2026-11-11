import { useState } from 'react'
import { request } from './api'
import { photoAccept, uploadPhoto } from './photoUpload'
import { photoTitles } from './photos'

export default function GalleryPhotoForm({ square, category, token, onPublished, onExpired }) {
  const [step, setStep] = useState('')
  const [url, setUrl] = useState(null)
  const [status, setStatus] = useState(null)
  const [error, setError] = useState('')

  async function submit(event) {
    event.preventDefault()
    const file = new FormData(event.currentTarget).get('image')
    setError('')
    try {
      let photo = url
      if (!photo) {
        setStep('Subiendo foto…')
        photo = await uploadPhoto(file, token)
        setUrl(photo)
      }
      setStep('Guardando aporte…')
      const report = await request('/reports/create', {
        token,
        body: { publicSquareId: square._id, changes: { addPicture: { url: photo, category } } },
      })
      setStatus(report.status)
      if (report.status === 'approved') onPublished()
    } catch (err) {
      setError(err.message)
      if (err.status === 401) onExpired()
    } finally { setStep('') }
  }

  return <>
    <div className="dialog-heading">
      <h2 id="modal-title">Agregar una foto</h2>
      <p>{photoTitles[category]} · {square.name}</p>
    </div>
    {status ? <p className="photo-status" role="status">
      {status === 'approved' ? 'Foto publicada en la galería.' : 'Tu foto quedó pendiente de revisión.'}
    </p> : <form onSubmit={submit}>
      <label>Elegí una foto actual
        <input name="image" type="file" accept={photoAccept} disabled={Boolean(step)} required onChange={() => setUrl(null)} />
        <small className="muted">JPG, PNG o WEBP de hasta 5 MB.</small>
      </label>
      {error && <p className="error" role="alert">{error}</p>}
      <button className="primary full" disabled={Boolean(step)}>{step || 'Agregar foto'}</button>
    </form>}
  </>
}
