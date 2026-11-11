import { useCallback, useEffect, useRef, useState } from 'react'
import Map from './Map'
import Account from './Account'
import CreateSquareForm from './CreateSquareForm'
import GalleryPhotoForm from './GalleryPhotoForm'
import Modal from './Modal'
import Profile from './Profile'
import ReportForm from './ReportForm'
import ReportReview from './ReportReview'
import SquareDetail from './SquareDetail'
import { request } from './api'
import './App.css'

// Acá junto el mapa, la ficha y las ventanas. Con useState React se acuerda de cosas como la plaza que elegiste.
export default function App() {
  const [squares, setSquares] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [reload, setReload] = useState(0)
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState('all')
  const [selectedId, setSelectedId] = useState(null)
  const [detail, setDetail] = useState(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [detailError, setDetailError] = useState('')
  const [modal, setModal] = useState(null)
  const [photoCategory, setPhotoCategory] = useState(null)
  // La sesión vive en memoria y se cierra al recargar la página.
  const [session, setSession] = useState(null)
  const token = session?.token
  const isAdmin = session?.role === 'admin'
  const canReview = ['admin', 'trusted'].includes(session?.role)
  const [userLocation, setUserLocation] = useState(null)
  const [locating, setLocating] = useState(false)
  const [locationError, setLocationError] = useState('')
  const [reset, setReset] = useState(0)
  const panel = useRef(null)

  // Cuando entrás o pedís actualizar, acá traigo la lista de plazas. Si arranca otra consulta, cancelo la anterior.
  useEffect(() => {
    const controller = new AbortController()
    async function load() {
      setLoading(true)
      setError('')
      try {
        const data = await request('/square/list', { signal: AbortSignal.any([controller.signal, AbortSignal.timeout(15000)]) })
        if (!Array.isArray(data)) throw new Error('La API no devolvió una lista de plazas válida.')
        if (!controller.signal.aborted) setSquares(data.filter(square => !square.demo))
      } catch (err) { if (!controller.signal.aborted) setError(err.message) }
      finally { if (!controller.signal.aborted) setLoading(false) }
    }
    load()
    return () => controller.abort()
  }, [reload])

  // Cuando cambia selectedId, pido la ficha de esa plaza. Si tocás otra antes de que cargue, cancelo el pedido anterior.
  useEffect(() => {
    if (!selectedId) return
    const controller = new AbortController()
    async function loadDetail() {
      setDetail(current => current?._id === selectedId ? current : null)
      setDetailLoading(true)
      setDetailError('')
      try {
        const data = await request(`/square/${selectedId}`, { signal: AbortSignal.any([controller.signal, AbortSignal.timeout(15000)]) })
        if (!data._id || !Number.isFinite(data.location?.lat) || !Number.isFinite(data.location?.lon)) throw new Error('La plaza no tiene una ubicación válida.')
        if (!controller.signal.aborted) setDetail(data)
      } catch (err) { if (!controller.signal.aborted) setDetailError(err.message) }
      finally { if (!controller.signal.aborted) setDetailLoading(false) }
    }
    loadDetail()
    return () => controller.abort()
  }, [selectedId, reload])

  // Toques la lista o un punto del mapa, venís a parar a la misma función. Acá guardo cuál plaza elegiste.
  const selectSquare = useCallback(id => {
    setSelectedId(id)
    panel.current?.focus()
  }, [])
  const search = query.trim().toLocaleLowerCase('es')
  // Filtro las plazas una sola vez y uso ese resultado para la lista y para el mapa.
  const visible = squares.filter(square => square.name.toLocaleLowerCase('es').includes(search)
    && (filter === 'all' || square[filter]?.exists))

  // Cuando tocás «Mi ubicación», el navegador pide permiso. Si lo das, le paso tu posición al mapa.
  function locate() {
    setLocationError('')
    if (!navigator.geolocation) { setLocationError('Este navegador no permite consultar tu ubicación.'); return }
    setLocating(true)
    navigator.geolocation.getCurrentPosition(position => {
      setUserLocation([position.coords.latitude, position.coords.longitude])
      setLocating(false)
    }, () => {
      setLocationError('No pudimos obtener tu ubicación. Revisá el permiso del navegador. Podés seguir buscando por nombre.')
      setLocating(false)
    }, { timeout: 10000 })
  }

  // Cuando volvés a las plazas, saco la ficha y vuelvo a la vista general del mapa.
  function closeDetail() {
    setSelectedId(null)
    setDetail(null)
    setReset(value => value + 1)
    panel.current?.focus()
  }

  // Al tocar el logo, vuelvo al inicio dentro de la app. Como no recargo la página, la sesión sigue abierta.
  function goHome() {
    setQuery('')
    setFilter('all')
    closeDetail()
  }

  // Me guardo de qué galería venís para abrir esa misma categoría si primero tenés que iniciar sesión.
  function addPhoto(category) {
    setPhotoCategory(category)
    setModal(token ? 'photo' : 'photo-login')
  }

  // Si la API devuelve 401, borro el token y te llevo al inicio de sesión para que puedas seguir.
  function loginAgain(nextModal) {
    setSession(null)
    setModal(nextModal)
  }

  // Después de aprobar algo, vuelvo a pedir la lista y la ficha para que se vea el cambio.
  function refreshSquares() { setReload(value => value + 1) }

  // Después de guardar, actualizo el mapa y abro la ficha nueva.
  function squareCreated(id) {
    setModal(null)
    setQuery('')
    setFilter('all')
    selectSquare(id)
    refreshSquares()
  }

  // Acá está lo que se ve en pantalla. A la derecha pongo la lista o la ficha, según lo que hayas tocado.
  return <>
    <a className="skip-link" href="#plazas" onClick={selectedId ? closeDetail : undefined}>Ir a la lista de plazas</a>
    <header className="site-header" id="inicio">
      <a className="brand" href="#inicio" aria-label="Plazas Accesibles, inicio" onClick={goHome}><span className="brand-icon" aria-hidden="true">♧</span><span>Plazas<strong>Accesibles</strong></span></a>
      <span className="header-place">Paysandú, Uruguay</span>
      <nav aria-label="Navegación principal"><a className="nav-active" href="#plazas" onClick={selectedId ? closeDetail : undefined}>Explorar plazas</a><button className="nav-about" aria-label="Sobre el proyecto" onClick={() => setModal('about')}><span>Sobre el </span>proyecto</button>
        {canReview && <button className="nav-review" aria-label="Revisar reportes" onClick={() => setModal('review')}>Revisar<span> reportes</span></button>}
        {isAdmin && <button className="nav-review" onClick={() => setModal('create-square')}>Agregar plaza</button>}
        <button className="login-button" onClick={() => setModal(token ? 'profile' : 'account')}>{token ? 'Mi perfil' : 'Iniciar sesión'} <span aria-hidden="true">↗</span></button></nav>
    </header>
    <main className="explorer">
      <section className="map-area" aria-label="Mapa de plazas">
        <Map squares={visible} selectedId={selectedId} detail={detail} onSelect={selectSquare} userLocation={userLocation} reset={reset} />
        <div className="map-topbar"><span className="map-place"><span className="live-dot" /> Paysandú <span className="muted">/ Espacios públicos</span></span><button className="location-button" onClick={locate} disabled={locating}><span aria-hidden="true">⌖</span> {locating ? 'Buscando…' : 'Mi ubicación'}</button></div>
        {locationError && <p className="map-message" role="alert">{locationError}</p>}
        {!selectedId && <div className="map-caption"><span className="caption-icon" aria-hidden="true">♧</span><div><strong>Mapa de Paysandú</strong><p>Elegí una plaza en el mapa para consultar su ficha.</p></div></div>}
        <div className="map-legend"><span className="legend-pin" /> Plaza <span className="legend-obstacle" /> Obstáculo</div>
      </section>
      <aside ref={panel} id="plazas" className="visit-panel" tabIndex={-1} aria-label={selectedId ? 'Ficha de la plaza' : 'Explorar plazas'}>
      {selectedId ? <div className="detail-panel" aria-busy={detailLoading}>
        <div className="detail-toolbar"><button className="text-button" onClick={closeDetail}>← Volver a las plazas</button></div>
        {detailLoading && <p className="empty-state" role="status">Cargando la ficha…</p>}
        {detailError && <div className="empty-state"><p className="error" role="alert">{detailError}</p><button className="secondary" onClick={() => setReload(value => value + 1)}>Reintentar</button></div>}
        {detail && <SquareDetail
          key={detail._id}
          square={detail}
          signedIn={Boolean(token)}
          onReport={() => setModal(token ? 'report' : 'report-login')}
          onAddPhoto={addPhoto}
        />}
      </div> : <>
        <div className="panel-intro">
          <h1>Una plaza.<br />Tu próxima salida.</h1>
          <p>Conocé sus espacios y condiciones de accesibilidad antes de ir.</p>
        </div>
        <h2 className="list-title">Plazas de Paysandú</h2>
        <div className="search-area"><label className="search-field"><span aria-hidden="true">⌕</span><input type="search" value={query} onChange={event => setQuery(event.target.value)} placeholder="Buscá una plaza…" aria-label="Buscar plaza por nombre" /></label>
          <div className="filters" role="group" aria-label="Filtrar por instalaciones"><button aria-pressed={filter === 'all'} onClick={() => setFilter('all')}>Todas</button><button aria-pressed={filter === 'ramps'} onClick={() => setFilter('ramps')}>Con rampas</button><button aria-pressed={filter === 'wc'} onClick={() => setFilter('wc')}>Con baños</button></div>
        </div>
        <div className="results-heading"><span aria-live="polite">{loading ? 'Buscando plazas…' : `${visible.length} ${visible.length === 1 ? 'plaza' : 'plazas'} para explorar`}</span><button className="text-button" onClick={() => { setQuery(''); setFilter('all'); setReset(value => value + 1) }}>Ver todas</button></div>
        <div className="square-list" aria-busy={loading}>
          {loading && <div className="empty-state"><span className="loading-dot" />Estamos cargando las plazas…</div>}
          {error && <div className="empty-state"><h2>No pudimos cargar las plazas</h2><p className="error" role="alert">{error}</p><button className="secondary" onClick={() => setReload(value => value + 1)}>Volver a intentar</button></div>}
          {!loading && !error && !visible.length && <div className="empty-state"><h2>Sin resultados por acá</h2><p>Probá con otro nombre o cambiá los filtros.</p></div>}
          {!loading && !error && visible.map(square => <button className="square-item" key={square._id} onClick={() => selectSquare(square._id)}>
            <span className="square-icon" aria-hidden="true">♧</span><span className="square-copy"><strong>{square.name}</strong><span>{[square.ramps?.exists && 'Rampas', square.wc?.exists && 'Baños', square.playground?.exists && 'Juegos'].filter(Boolean).join(' · ') || 'Ver información de la plaza'}</span></span><span className="item-arrow" aria-hidden="true">↗</span>
          </button>)}
        </div>
      </>}
      </aside>
    </main>
    <footer className="site-footer"><p><span aria-hidden="true">ⓘ</span> Proyecto académico. La información puede incluir datos de demostración.</p><span>Plazas Accesibles · Paysandú</span></footer>
    {modal && <Modal className={['report', 'review', 'create-square'].includes(modal) ? 'report-dialog' : undefined} onClose={() => setModal(null)}>
      {['account', 'report-login', 'photo-login'].includes(modal) && <Account
        onLogin={setSession}
        onClose={() => setModal({ 'report-login': 'report', 'photo-login': 'photo' }[modal] ?? null)}
      />}
      {modal === 'report' && detail && <ReportForm square={detail} token={token} onExpired={() => loginAgain('report-login')} />}
      {modal === 'photo' && detail && <GalleryPhotoForm square={detail} category={photoCategory} token={token} onPublished={refreshSquares} onExpired={() => loginAgain('photo-login')} />}
      {modal === 'review' && canReview && <ReportReview squares={squares} token={token} onApproved={refreshSquares} />}
      {modal === 'create-square' && isAdmin && <CreateSquareForm token={token} onCreated={squareCreated} />}
      {modal === 'profile' && token && <Profile
        token={token}
        onSession={updated => setSession(current => current?.token === token ? updated : current)}
        onLogout={() => { setSession(null); setModal(null) }}
      />}
      {modal === 'about' && <div className="about-content">
        <span className="symbol" aria-hidden="true">♧</span>
        <h2 id="modal-title">Sobre el proyecto</h2>
        <p>Plazas Accesibles es un proyecto académico para consultar las condiciones de accesibilidad de las plazas de Paysandú antes de visitarlas.</p>
        <p>Las fichas pueden incluir datos ficticios de demostración.</p>
        <dl className="project-credits">
          <div><dt>Idea original · RPL 2026</dt><dd>Juan Pablo Iturbide, Renzo Scarabinni y Maximiliano Rodríguez</dd></div>
          <div><dt>Desarrollo · Taller de Sistemas de Información .NET</dt><dd>Manuel R. Toscanini y Juan Elola</dd></div>
          <div><dt>Carrera</dt><dd>Tecnólogo en Informática · UTEC, Udelar y UTU · Paysandú</dd></div>
        </dl>
      </div>}
    </Modal>}
  </>
}
