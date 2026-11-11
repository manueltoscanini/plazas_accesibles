import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

export function createLeafletMap(container, center, zoom, options = {}) {
  const map = L.map(container, { zoomControl: false, ...options }).setView(center, zoom)
  L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
  }).addTo(map)
  L.control.zoom({ position: 'bottomright' }).addTo(map)

  const observer = new ResizeObserver(() => map.invalidateSize())
  observer.observe(container)
  return {
    map,
    destroy() {
      observer.disconnect()
      map.remove()
    },
  }
}
