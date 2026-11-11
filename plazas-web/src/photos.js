export const photoTitles = {
  all: 'Fotos de la plaza',
  ramps: 'Fotos de las rampas',
  paths: 'Fotos de los caminos',
  wcs: 'Fotos de los baños',
  accessibleWcs: 'Fotos de los baños accesibles',
  playgrounds: 'Fotos de la zona de juegos',
  hazards: 'Fotos de los obstáculos',
}

function uniquePhotos(urls) {
  return [...new Set(urls.filter(url => typeof url === 'string' && /^https?:\/\/\S+$/i.test(url)))]
}

function elementPhotos(elements) {
  return uniquePhotos((elements ?? []).map(element => element.picture))
}

export function getSquarePhotos(square) {
  const { ramps, wcs = [], playgrounds, hazards } = square.elements ?? {}
  const gallery = square.galleryPictures ?? {}
  const groups = {
    ramps: uniquePhotos([...elementPhotos(ramps), ...(gallery.ramps ?? [])]),
    paths: uniquePhotos(square.paths?.pictures ?? []),
    wcs: uniquePhotos([...elementPhotos(wcs), ...(gallery.wcs ?? []), ...(gallery.accessibleWcs ?? [])]),
    accessibleWcs: uniquePhotos([...elementPhotos(wcs.filter(wc => wc.accessible === true)), ...(gallery.accessibleWcs ?? [])]),
    playgrounds: uniquePhotos([...elementPhotos(playgrounds), ...(gallery.playgrounds ?? [])]),
    hazards: uniquePhotos([...elementPhotos(hazards), ...(gallery.hazards ?? [])]),
  }
  return { all: uniquePhotos([...(square.pictures ?? []), ...Object.values(groups).flat()]), ...groups }
}

export function getPhotoCaptions(photos) {
  const captions = new Map(photos.all.map(url => [url, 'General']))
  const labels = {
    ramps: 'Rampa', paths: 'Camino interno', wcs: 'Baño',
    accessibleWcs: 'Baño accesible', playgrounds: 'Zona de juegos', hazards: 'Obstáculo',
  }
  for (const [category, label] of Object.entries(labels)) {
    for (const url of photos[category]) captions.set(url, label)
  }
  return captions
}
