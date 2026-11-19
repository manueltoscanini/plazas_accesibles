import { useState } from 'react'
import { request } from './api'
import LocationPicker from './LocationPicker'

function parseBoolean(value) {
  if (value === 'true') return true
  if (value === 'false') return false
}

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

    const ramps = parseBoolean(data.get('ramps'))
    const pathsChoice = data.get('paths')
    const wcExists = parseBoolean(data.get('wc'))
    const wcAccessible = parseBoolean(data.get('accessibleWc'))
    const playground = parseBoolean(data.get('playground'))
    const wc = {}
    if (wcExists !== undefined) wc.exists = wcExists
    if (wcAccessible !== undefined) {
      wc.accessible = wcExists === false ? false : wcAccessible
      if (wcAccessible && wc.exists === undefined) wc.exists = true
    } else if (wcExists === false) {
      wc.accessible = false
    }
    const paths = pathsChoice === 'accessible'
      ? { exists: true, accessible: true }
      : pathsChoice === 'true'
        ? { exists: true, accessible: false }
        : pathsChoice === 'false'
          ? { exists: false }
          : undefined

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
          ...(ramps !== undefined && { ramps: { exists: ramps } }),
          ...(paths && { paths }),
          ...(Object.keys(wc).length > 0 && { wc }),
          ...(playground !== undefined && { playground: { exists: playground } }),
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
        <div className="form-row">
          <label>Rampas
            <select name="ramps" defaultValue="">
              <option value="">Sin rampas registradas</option>
              <option value="true">Hay rampas</option>
              <option value="false">Sin rampas existentes</option>
            </select>
          </label>
          <label>Caminos internos
            <select name="paths" defaultValue="">
              <option value="">Sin caminos registrados</option>
              <option value="accessible">Registrados como accesibles</option>
              <option value="true">Consultar condiciones</option>
              <option value="false">Sin caminos existentes</option>
            </select>
          </label>
        </div>
        <div className="form-row">
          <label>Baños
            <select name="wc" defaultValue="">
              <option value="">Sin baños registrados</option>
              <option value="true">Hay baños</option>
              <option value="false">Sin baños existentes</option>
            </select>
          </label>
          <label>Baños accesibles
            <select name="accessibleWc" defaultValue="">
              <option value="">Sin baños accesibles registrados</option>
              <option value="true">Hay baños accesibles</option>
              <option value="false">Sin baños accesibles existentes</option>
            </select>
          </label>
        </div>
        <label>Zona de juegos
          <select name="playground" defaultValue="">
            <option value="">Sin juegos registrados</option>
            <option value="true">Hay juegos</option>
            <option value="false">Sin juegos existentes</option>
          </select>
        </label>
        <label>Descripción (opcional)<textarea name="description" rows={2} /></label>
        <label>Información de accesibilidad (opcional)<textarea name="accessibilityDescription" rows={2} /></label>
      </fieldset>
      {error && <p className="error" role="alert">{error}</p>}
      <button className="primary full" disabled={saving}>{saving ? 'Guardando…' : 'Guardar plaza'}</button>
    </form>
  </>
}
