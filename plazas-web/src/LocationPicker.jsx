import { useEffect, useRef } from 'react'
import L from 'leaflet'
import { createLeafletMap } from './leafletMap'

export default function LocationPicker({ square, selected, onSelect, disabled }) {
  const container = useRef(null)
  const markCenter = useRef(null)
  const { lat, lon } = square.location

  useEffect(() => {
    const { map, destroy } = createLeafletMap(container.current, [lat, lon], 18, { scrollWheelZoom: false })
    if (square.name === 'Plaza Artigas') {
      // Monumento ecuestre, OpenStreetMap node 4846318401.
      L.circleMarker([-32.31573, -58.09501], { radius: 5, color: '#315c4c', fillOpacity: 1, interactive: false })
        .addTo(map)
        .bindTooltip('Monumento a Artigas', { permanent: true, direction: 'right' })
    }

    const marker = L.marker([lat, lon], {
      draggable: true,
      keyboard: false,
      title: 'Ubicación del hallazgo',
      icon: L.divIcon({ className: 'finding-marker', iconSize: [24, 24], iconAnchor: [12, 12] }),
    })

    function mark(point) {
      const position = map.wrapLatLng(point)
      marker.setLatLng(position).addTo(map)
      onSelect({ lat: position.lat, lon: position.lng })
    }

    map.on('click', event => mark(event.latlng))
    marker.on('dragend', () => mark(marker.getLatLng()))
    markCenter.current = () => mark(map.getCenter())

    return () => {
      destroy()
      markCenter.current = null
    }
  }, [lat, lon, square.name, onSelect])

  return <div className="finding-location">
    <h3>Ubicación del hallazgo</h3>
    <p id="finding-location-help" className="muted">Tocá el lugar en el mapa. Con teclado, mové el mapa con las flechas y usá «Marcar centro del mapa».</p>
    <div className="finding-map-frame">
      <div ref={container} className="finding-map" role="region" aria-label={`Mapa de ${square.name} para marcar el hallazgo`} aria-describedby="finding-location-help" />
      <span className="finding-crosshair" aria-hidden="true" />
    </div>
    <div className="finding-map-actions">
      <button type="button" className="secondary" disabled={disabled} onClick={() => markCenter.current?.()}>Marcar centro del mapa</button>
      <p role="status">{selected ? 'Punto marcado. Podés moverlo.' : 'Marcá un punto para continuar.'}</p>
    </div>
  </div>
}
