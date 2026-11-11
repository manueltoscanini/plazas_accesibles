import { useState } from 'react'
import { request } from './api'
import LocationPicker from './LocationPicker'

// Acá el administrador pone el nombre de la plaza y marca dónde queda.
export default function CreateSquareForm({ token, onCreated }) {
  const [location, setLocation] = useState(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  async function submit(event) {
    event.preventDefault()
    const data = new FormData(event.currentTarget)
    const name = data.get('name').trim()
    if (!name || !location) {
      setError(name ? 'Marcá dónde queda la plaza en el mapa.' : 'Escribí el nombre de la plaza.')
      return
    }

    setSaving(true)
    setError('')
    try {
      // Leaflet ya me dio la latitud y longitud que espera la API.
      const square = await request('/square', {
        token,
        body: {
          name,
          description: data.get('description').trim(),
          accessibilityDescription: data.get('accessibilityDescription').trim(),
          location,
        },
      })
      onCreated(square._id)
    } catch (err) {
      setError(err.status === 403 ? 'Solo un administrador puede agregar plazas.' : err.message)
    } finally { setSaving(false) }
  }

  return <>
    <div className="dialog-heading"><h2 id="modal-title">Agregar plaza</h2></div>
    <form onSubmit={submit}>
      <fieldset className="finding-fields" disabled={saving}>
        <label>Nombre de la plaza<input name="name" required autoFocus /></label>
        <LocationPicker selected={Boolean(location)} onSelect={setLocation} disabled={saving} />
        <label>Descripción (opcional)<textarea name="description" rows={2} /></label>
        <label>Información de accesibilidad (opcional)<textarea name="accessibilityDescription" rows={2} /></label>
      </fieldset>
      {error && <p className="error" role="alert">{error}</p>}
      <button className="primary full" disabled={saving}>{saving ? 'Guardando…' : 'Guardar plaza'}</button>
    </form>
  </>
}
