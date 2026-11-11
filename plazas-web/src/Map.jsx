import { useEffect, useRef } from 'react'
import L from 'leaflet'
import { createLeafletMap, paysandu } from './leafletMap'

// Acá se dibuja el mapa con Leaflet. React le dice qué plazas se ven y cuál elegiste.
export default function Map({ squares, selectedId, detail, onSelect, userLocation, reset }) {
  const container = useRef(null)
  const map = useRef(null)
  // Creo el mapa cuando entra este componente y lo saco cuando se cierra.
  useEffect(() => {
    const { map: instance, destroy } = createLeafletMap(container.current, paysandu, 14)
    map.current = instance
    return () => { destroy(); map.current = null }
  }, [])
  // Si cambia el filtro o la plaza elegida, vuelvo a dibujar los marcadores.
  useEffect(() => {
    const layer = L.layerGroup().addTo(map.current)
    for (const square of squares) {
      const { lat, lon } = square.location || {}
      if (!Number.isFinite(lat) || !Number.isFinite(lon)) continue
      L.marker([lat, lon], {
        title: square.name, alt: square.name,
        icon: L.divIcon({ className: `square-marker ${square._id === selectedId ? 'is-selected' : ''}`,
          html: '<span aria-hidden="true">♧</span>', iconSize: [36, 42], iconAnchor: [18, 42] }),
      }).on('click', () => onSelect(square._id)).addTo(layer)
    }
    return () => layer.remove()
  }, [squares, selectedId, onSelect])
  // Cuando abrís una plaza, acerco el mapa y marco sus elementos si tienen coordenadas válidas y no están marcados como sin verificar.
  useEffect(() => {
    if (!detail) return
    const { lat, lon } = detail.location || {}
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) return
    map.current.setView([lat, lon], 17, { animate: false })
    const layer = L.layerGroup().addTo(map.current)
    const groups = [['wcs', 'Baño', '#3569a0'], ['ramps', 'Rampa', '#537c46'], ['playgrounds', 'Juegos', '#937234'], ['hazards', 'Obstáculo', '#ba6243']]
    for (const [key, label, color] of groups) {
      for (const element of detail.elements?.[key] || []) {
        if (element.locationVerified === false || !Number.isFinite(element.lat) || !Number.isFinite(element.lon)) continue
        // Esto viene escrito por la gente. Lo pongo como texto para que Leaflet no lo tome como HTML.
        const text = document.createElement('span')
        text.textContent = `${label}${element.description ? ` · ${element.description}` : ''}`
        L.circleMarker([element.lat, element.lon], { radius: 7, color, fillOpacity: 0.9 }).bindTooltip(text).addTo(layer)
      }
    }
    return () => layer.remove()
  }, [detail])
  // El punto de «Mi ubicación» se dibuja aparte de las plazas.
  useEffect(() => {
    if (!userLocation) return
    const marker = L.circleMarker(userLocation, { radius: 9, color: '#fff', weight: 3, fillColor: '#3569a0', fillOpacity: 1 }).bindTooltip('Tu ubicación').addTo(map.current)
    map.current.setView(userLocation, 16, { animate: false })
    return () => marker.remove()
  }, [userLocation])
  // Cuando cambia reset, vuelvo al mapa general de Paysandú.
  useEffect(() => {
    if (reset) map.current.setView(paysandu, 14, { animate: false })
  }, [reset])
  return <div ref={container} className="map" aria-label="Mapa de plazas de Paysandú" />
}
