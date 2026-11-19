import { test } from 'node:test'
import assert from 'node:assert/strict'
import { isInvalidText, normalizeSquare } from './squareData.js'

test('descarta datos que no corresponden como robot malvado o plazas falsas', () => {
  assert.equal(isInvalidText('Un robot malvado en la entrada'), true)
  assert.equal(normalizeSquare({ _id: '1', name: 'Plaza Falsa 1', location: { lat: -32, lon: -58 } }), null)

  const cleaned = normalizeSquare({
    _id: '2',
    name: 'Plaza Constitución',
    location: { lat: -32.3171, lon: -58.08083 },
    hazards: { exists: true },
    elements: {
      ramps: [],
      wcs: [],
      playgrounds: [],
      hazards: [{ _id: 'h1', description: 'robot malvado', lat: -32.317, lon: -58.08 }],
    },
  })

  assert.equal(cleaned.hazards.exists, false)
  assert.deepEqual(cleaned.elements.hazards, [])
  assert.equal(cleaned.ramps.exists, true)
  assert.equal(cleaned.wc.exists, false)
  assert.equal(cleaned.playground.exists, false)
})

test('completa datos de prueba con casos sin registrar, sin existentes y existentes en baños, caminos y rampas', () => {
  const colon = normalizeSquare({
    _id: '3',
    name: 'Plaza Colón',
    location: { lat: -32.31501, lon: -58.10131 },
  })
  assert.equal(colon.ramps.exists, undefined)
  assert.equal(colon.wc.exists, false)
  assert.equal(colon.playground.exists, undefined)
  assert.equal(colon.hazards.exists, undefined)

  const acuna = normalizeSquare({
    _id: '4',
    name: 'Plaza Acuña de Figueroa',
    location: { lat: -32.32174, lon: -58.08919 },
  })
  assert.equal(acuna.ramps.exists, true)
  assert.equal(acuna.paths.exists, undefined)
  assert.equal(acuna.wc.exists, undefined)

  const rivera = normalizeSquare({
    _id: '5',
    name: 'Plaza Rivera',
    location: { lat: -32.31507, lon: -58.07478 },
  })
  assert.equal(rivera.ramps.exists, false)
  assert.equal(rivera.paths.exists, false)
  assert.equal(rivera.wc.exists, undefined)

  const deportes = normalizeSquare({
    _id: '6',
    name: 'Plaza de los Deportes',
    location: { lat: -32.32466, lon: -58.08197 },
  })
  assert.equal(deportes.ramps.exists, undefined)
  assert.equal(deportes.wc.exists, true)
  assert.equal(deportes.wc.accessible, false)
})
