import { useEffect, useState } from 'react'
import { request } from './api'

export default function Profile({ token, onSession, onLogout }) {
  const [details, setDetails] = useState(null)
  const [savedEmail, setSavedEmail] = useState('')
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [feedback, setFeedback] = useState(null)
  const emailChanged = details && details.email.trim().toLowerCase() !== savedEmail

  useEffect(() => {
    const controller = new AbortController()
    request('/users/me', { token, signal: AbortSignal.any([controller.signal, AbortSignal.timeout(15000)]) })
      .then(data => {
        if (controller.signal.aborted) return
        setDetails(data)
        setSavedEmail(data.email)
      })
      .catch(err => {
        if (!controller.signal.aborted) setFeedback({ section: 'profile', error: err.message })
      })
      .finally(() => { if (!controller.signal.aborted) setLoading(false) })
    return () => controller.abort()
  }, [token])

  function edit(field, value) {
    setDetails(current => ({ ...current, [field]: value }))
  }

  async function saveProfile(event) {
    event.preventDefault()
    const body = Object.fromEntries(new FormData(event.currentTarget))
    setBusy(true)
    setFeedback(null)
    try {
      const updated = await request('/users/me', { method: 'PATCH', token, body })
      setDetails(updated)
      setSavedEmail(updated.email)
      setFeedback({ section: 'profile', message: 'Cambios guardados.' })
    } catch (err) {
      setFeedback({ section: 'profile', error: err.message })
    } finally { setBusy(false) }
  }

  async function changePassword(event) {
    event.preventDefault()
    const form = event.currentTarget
    const { currentPassword, newPassword, confirmation } = Object.fromEntries(new FormData(form))
    if (newPassword !== confirmation) {
      setFeedback({ section: 'password', error: 'Las contraseñas nuevas no coinciden.' })
      return
    }
    setBusy(true)
    setFeedback(null)
    try {
      const session = await request('/users/me/password', { token, body: { currentPassword, newPassword } })
      onSession(session)
      form.reset()
      setFeedback({ section: 'password', message: 'Contraseña actualizada. Las sesiones anteriores se cerraron.' })
    } catch (err) {
      setFeedback({ section: 'password', error: err.message })
    } finally { setBusy(false) }
  }

  function status(section) {
    if (feedback?.section !== section) return null
    return feedback.error
      ? <p className="error" role="alert">{feedback.error}</p>
      : <p className="photo-status" role="status">{feedback.message}</p>
  }

  return <>
    <div className="dialog-heading">
      <h2 id="modal-title">Mi perfil</h2>
      {details && <p>{details.firstName} {details.lastName}</p>}
    </div>
    {loading && <p role="status">Cargando tu perfil…</p>}
    {!details && status('profile')}
    {details && <>
      <form onSubmit={saveProfile} aria-label="Datos del perfil">
        <div className="form-row">
          <label>Nombre<input name="firstName" autoComplete="given-name" maxLength={100} required value={details.firstName} onChange={event => edit('firstName', event.target.value)} /></label>
          <label>Apellido<input name="lastName" autoComplete="family-name" maxLength={100} required value={details.lastName} onChange={event => edit('lastName', event.target.value)} /></label>
        </div>
        <label>Número de contacto (opcional)<input name="phone" type="tel" autoComplete="tel" maxLength={32} value={details.phone} onChange={event => edit('phone', event.target.value)} /></label>
        <label>Correo electrónico<input name="email" type="email" autoComplete="email" maxLength={254} required value={details.email} onChange={event => edit('email', event.target.value)} /></label>
        {emailChanged && <label>Contraseña actual para cambiar el correo<input name="currentPassword" type="password" autoComplete="current-password" required /></label>}
        {status('profile')}
        <button className="primary full" disabled={busy}>Guardar cambios</button>
      </form>
      <section className="profile-security" aria-labelledby="profile-security-title">
        <h3 id="profile-security-title">Cambiar contraseña</h3>
        <form onSubmit={changePassword} aria-labelledby="profile-security-title">
          <label>Contraseña actual<input name="currentPassword" type="password" autoComplete="current-password" required /></label>
          <label>Nueva contraseña<input name="newPassword" type="password" autoComplete="new-password" minLength={8} required /></label>
          <label>Confirmar nueva contraseña<input name="confirmation" type="password" autoComplete="new-password" minLength={8} required /></label>
          {status('password')}
          <button className="primary full" disabled={busy}>Cambiar contraseña</button>
        </form>
      </section>
    </>}
    <button className="text-button profile-logout" onClick={onLogout} disabled={busy}>Cerrar sesión</button>
  </>
}
