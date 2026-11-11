import { useEffect, useRef } from 'react'
import L from 'leaflet'
import { createLeafletMap } from './leafletMap'

const paysandu = [-32.317, -58.088]

export default function Map({ squares, selectedId, detail, onSelect, userLocation, reset }) {
  const container = useRef(null)
  const map = useRef(null)
  useEffect(() => {
    const { map: instance, destroy } = createLeafletMap(container.current, paysandu, 14)
    map.current = instance
    return () => { destroy(); map.current = null }
  }, [])
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
        const text = document.createElement('span')
        text.textContent = `${label}${element.description ? ` · ${element.description}` : ''}`
        L.circleMarker([element.lat, element.lon], { radius: 7, color, fillOpacity: 0.9 }).bindTooltip(text).addTo(layer)
      }
    }
    return () => layer.remove()
  }, [detail])
  useEffect(() => {
    if (!userLocation) return
    const marker = L.circleMarker(userLocation, { radius: 9, color: '#fff', weight: 3, fillColor: '#3569a0', fillOpacity: 1 }).bindTooltip('Tu ubicación').addTo(map.current)
    map.current.setView(userLocation, 16, { animate: false })
    return () => marker.remove()
  }, [userLocation])
  useEffect(() => {
    if (reset) map.current.setView(paysandu, 14, { animate: false })
  }, [reset])
  return <div ref={container} className="map" aria-label="Mapa de plazas de Paysandú" />
}
