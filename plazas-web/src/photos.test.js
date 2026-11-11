import { test } from 'node:test'
import assert from 'node:assert/strict'
import { getPhotoCaptions, getSquarePhotos } from './photos.js'

test('agrupa las fotos y muestra primero las generales sin repetirlas', () => {
  const general = 'https://example.com/plaza.jpg'
  const ramp = 'https://example.com/rampa.jpg'
  const path = 'https://example.com/camino.jpg'
  const wc = 'https://example.com/bano.jpg'
  const accessibleWC = 'https://example.com/bano-accesible.jpg'
  const playground = 'https://example.com/juegos.jpg'
  const hazard = 'https://example.com/obstaculo.jpg'

  assert.deepEqual(getSquarePhotos({
    pictures: [general, ramp, 'javascript:alert(1)'],
    paths: { pictures: [path] },
    elements: {
      ramps: [{ picture: ramp }, { picture: '' }],
      wcs: [{ picture: wc, accessible: false }, { picture: accessibleWC, accessible: true }],
      playgrounds: [{ picture: playground }],
      hazards: [{ picture: hazard }],
    },
  }), {
    all: [general, ramp, path, wc, accessibleWC, playground, hazard],
    ramps: [ramp],
    paths: [path],
    wcs: [wc, accessibleWC],
    accessibleWcs: [accessibleWC],
    playgrounds: [playground],
    hazards: [hazard],
  })
})

test('admite fichas antiguas sin fotos de caminos ni elementos', () => {
  const general = 'https://example.com/plaza.jpg'
  const photos = getSquarePhotos({ pictures: [general], paths: { description: 'Camino principal' } })
  assert.deepEqual(photos.all, [general])
  assert.deepEqual(photos.paths, [])
  assert.deepEqual(photos.ramps, [])
  assert.deepEqual(photos.accessibleWcs, [])
})

test('muestra los aportes aprobados en su categoría y en la galería general', () => {
  const ramp = 'https://example.com/rampa.jpg'
  const accessible = 'https://example.com/accesible.jpg'
  const photos = getSquarePhotos({
    galleryPictures: { ramps: [ramp], accessibleWcs: [accessible] },
    elements: { ramps: [{ picture: ramp }] },
  })
  assert.deepEqual(photos.ramps, [ramp])
  assert.deepEqual(photos.wcs, [accessible])
  assert.deepEqual(photos.accessibleWcs, [accessible])
  assert.deepEqual(photos.all, [ramp, accessible])
})

test('la galería completa identifica cada categoría y distingue los baños accesibles', () => {
  const general = 'https://example.com/plaza.jpg'
  const ramp = 'https://example.com/rampa.jpg'
  const wc = 'https://example.com/baño.jpg'
  const captions = getPhotoCaptions(getSquarePhotos({
    pictures: [general, ramp],
    elements: { ramps: [{ picture: ramp }], wcs: [{ picture: wc, accessible: true }] },
  }))
  assert.equal(captions.get(general), 'General')
  assert.equal(captions.get(ramp), 'Rampa')
  assert.equal(captions.get(wc), 'Baño accesible')
})
