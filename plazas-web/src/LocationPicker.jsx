import { useEffect, useRef } from 'react'
import L from 'leaflet'
import { createLeafletMap, paysandu } from './leafletMap'

// Este es el mapa donde marcás el lugar de la plaza o del hallazgo.
export default function LocationPicker({ square, selected, onSelect, disabled }) {
  const container = useRef(null)
  const markCenter = useRef(null)
  const [lat, lon] = square ? [square.location.lat, square.location.lon] : paysandu
  const name = square?.name
  const zoom = square ? 18 : 15
  const title = square ? 'Ubicación del hallazgo' : 'Ubicación de la plaza'

  // Abro el mapa cerca de la plaza y lo saco al cerrar el formulario.
  useEffect(() => {
    const { map, destroy } = createLeafletMap(container.current, [lat, lon], zoom, { scrollWheelZoom: false })
    if (name === 'Plaza Artigas') {
      // Monumento ecuestre, OpenStreetMap node 4846318401.
      L.circleMarker([-32.31573, -58.09501], { radius: 5, color: '#315c4c', fillOpacity: 1, interactive: false })
        .addTo(map)
        .bindTooltip('Monumento a Artigas', { permanent: true, direction: 'right' })
    }

    const marker = L.marker([lat, lon], {
      draggable: true,
      keyboard: false,
      title,
      icon: L.divIcon({ className: 'finding-marker', iconSize: [24, 24], iconAnchor: [12, 12] }),
    })

    // Leaflet me da lat y lng. Cambio lng por lon porque así lo espera nuestra API.
    function mark(point) {
      const position = map.wrapLatLng(point)
      marker.setLatLng(position).addTo(map)
      onSelect({ lat: position.lat, lon: position.lng })
    }

    map.on('click', event => mark(event.latlng))
    marker.on('dragend', () => mark(marker.getLatLng()))
    // Si usás teclado, podés mover el mapa con las flechas y elegir el punto que queda en el centro.
    markCenter.current = () => mark(map.getCenter())

    return () => {
      destroy()
      markCenter.current = null
    }
  }, [lat, lon, zoom, name, title, onSelect])

  return <div className="finding-location">
    <h3>{title}</h3>
    <p id="finding-location-help" className="muted">Tocá el lugar en el mapa. Con teclado, mové el mapa con las flechas y usá «Marcar centro del mapa».</p>
    <div className="finding-map-frame">
      <div ref={container} className="finding-map" role="region" aria-label={name ? `Mapa de ${name} para marcar el hallazgo` : 'Mapa de Paysandú para marcar la plaza'} aria-describedby="finding-location-help" />
      <span className="finding-crosshair" aria-hidden="true" />
    </div>
    <div className="finding-map-actions">
      <button type="button" className="secondary" disabled={disabled} onClick={() => markCenter.current?.()}>Marcar centro del mapa</button>
      <p role="status">{selected ? 'Punto marcado. Podés moverlo.' : 'Marcá un punto para continuar.'}</p>
    </div>
  </div>
}
