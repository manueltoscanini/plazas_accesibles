import { useState } from 'react'
import { request } from './api'

// Acá podés entrar con tu cuenta o crear una nueva.
export default function Account({ onLogin, onClose }) {
  const [register, setRegister] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  // Cuando entrás, la API me devuelve el token y el rol. App se los guarda y, si venías de un reporte o una foto, te lleva de vuelta.
  async function submit(event) {
    event.preventDefault()
    setBusy(true)
    setError('')
    const body = Object.fromEntries(new FormData(event.currentTarget))
    body.email = body.email.trim()
    try {
      const data = await request(`/users/${register ? 'register' : 'login'}`, { body })
      if (typeof data.token !== 'string' || !data.token) throw new Error('La API no devolvió una sesión válida.')
      onLogin({ token: data.token, role: data.role })
      onClose()
    } catch (err) {
      setError(err.status === 401 ? 'Revisá el correo y la contraseña e intentá de nuevo.' : err.message)
    }
    finally { setBusy(false) }
  }
  return <>
    <div className="dialog-heading"><span className="symbol">♧</span><h2 id="modal-title">{register ? 'Creá tu cuenta' : 'Qué bueno verte por acá'}</h2><p>Participá para mantener la información de las plazas al día.</p></div>
    <form onSubmit={submit}>
      {register && <div className="form-row"><label>Nombre<input name="firstName" autoComplete="given-name" required maxLength={100} /></label><label>Apellido<input name="lastName" autoComplete="family-name" required maxLength={100} /></label></div>}
      <label>Correo electrónico<input name="email" type="email" autoComplete="email" required autoFocus /></label>
      <label>Contraseña<input name="password" type="password" autoComplete={register ? 'new-password' : 'current-password'} required /></label>
      {error && <p className="error" role="alert">{error}</p>}
      <button className="primary full" disabled={busy}>{busy ? 'Conectando…' : register ? 'Crear cuenta' : 'Iniciar sesión'}</button>
    </form>
    <p className="account-switch">{register ? '¿Ya tenés cuenta?' : '¿Primera vez por acá?'} <button className="text-button" onClick={() => { setRegister(!register); setError('') }} disabled={busy}>{register ? 'Iniciar sesión' : 'Crear una cuenta'}</button></p>
  </>
}
