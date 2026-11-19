// Datos de prueba realistas para las plazas de Paysandú y filtro de textos de prueba inválidos.
const INVALID_TEXT = /robot\s*malvado|plaza\s*falsa|elemento\s*de\s*prueba/i

const SEED_SQUARES = {
  'Plaza Constitución': {
    description: 'Plaza principal en el centro de Paysandú, frente a la Basílica Nuestra Señora del Rosario y San Benito de Palermo.',
    accessibilityDescription: 'Cuenta con rampas en las esquinas sobre 18 de Julio y Monte Caseros, veredas amplias de baldosas parejas y bancos con espacio lateral para silla de ruedas.',
    ramps: { exists: true },
    paths: {
      exists: true,
      accessible: true,
      description: 'Caminos amplios de baldosa firme y nivelada en todo el perímetro y diagonales',
    },
    wc: { exists: false, accessible: false },
    playground: { exists: false },
    hazards: { exists: false },
    elements: {
      ramps: [
        { _id: 'seed-const-ramp-1', description: 'Rampa de hormigón con baranda en esquina 18 de Julio y Monte Caseros', lat: -32.31702, lon: -58.08095 },
        { _id: 'seed-const-ramp-2', description: 'Rampa de acceso peatonal sobre calle Zorrilla de San Martín', lat: -32.31722, lon: -58.08071 },
      ],
      wcs: [],
      playgrounds: [],
      hazards: [],
    },
  },
  'Plaza Artigas': {
    description: 'Amplio espacio público con el monumento ecuestre a José Gervasio Artigas, explanada central y zonas arboladas.',
    accessibilityDescription: 'Accesos con rampa en las esquinas principales, baños públicos con gabinete accesible y caminos internos firmes. Precaución por desnivel menor en sector norte.',
    ramps: { exists: true },
    paths: {
      exists: true,
      accessible: true,
      description: 'Senderos internos amplios de hormigón con pendiente suave',
    },
    wc: { exists: true, accessible: true },
    playground: { exists: true },
    hazards: { exists: true },
    elements: {
      ramps: [
        { _id: 'seed-art-ramp-1', description: 'Rampa ancha de acceso hacia la explanada central', lat: -32.31595, lon: -58.09525 },
      ],
      wcs: [
        { _id: 'seed-art-wc-1', description: 'Baño público con puerta ancha, barras de apoyo y rampa de ingreso', accessible: true, lat: -32.31615, lon: -58.09501 },
      ],
      playgrounds: [
        { _id: 'seed-art-play-1', description: 'Sector de juegos infantiles con piso de caucho y hamaca integradora', accessible: true, lat: -32.31588, lon: -58.09498 },
      ],
      hazards: [
        { _id: 'seed-art-haz-1', description: 'Baldosa levantada por raíces junto al cantero del sector norte', lat: -32.31582, lon: -58.09518 },
      ],
    },
  },
  'Plaza Acuña de Figueroa': {
    description: 'Plaza barrial arbolada con sector de juegos infantiles, bancos y senderos peatonales.',
    accessibilityDescription: 'Presenta rampas en los accesos principales y juegos infantiles renovados. Falta relevar el estado de los caminos internos y baños.',
    ramps: { exists: true },
    paths: {},
    wc: {},
    playground: { exists: true },
    hazards: { exists: false },
    elements: {
      ramps: [
        { _id: 'seed-acuna-ramp-1', description: 'Rampa en esquina con rebaje de cordón señalizado', lat: -32.32165, lon: -58.08928 },
      ],
      wcs: [],
      playgrounds: [
        { _id: 'seed-acuna-play-1', description: 'Área de juegos infantiles con acceso a nivel desde el sendero principal', accessible: true, lat: -32.32181, lon: -58.08910 },
      ],
      hazards: [],
    },
  },
  'Plaza Rivera': {
    description: 'Espacio verde tradicional con arbolado añoso, bancos de descanso y juegos de madera.',
    accessibilityDescription: 'No cuenta con rampas en los accesos ni caminos internos accesibles. Falta relevar información sobre baños.',
    ramps: { exists: false },
    paths: { exists: false },
    wc: {},
    playground: { exists: true },
    hazards: { exists: true },
    elements: {
      ramps: [],
      wcs: [],
      playgrounds: [
        { _id: 'seed-riv-play-1', description: 'Juegos de madera sobre superficie de arena y césped', accessible: false, lat: -32.31501, lon: -58.07470 },
      ],
      hazards: [
        { _id: 'seed-riv-haz-1', description: 'Escalón pronunciado sin rampa alternativa en el ingreso este', lat: -32.31514, lon: -58.07486 },
      ],
    },
  },
  'Plaza Colón': {
    description: 'Plaza cercana a la zona costera con espacios verdes, bancos e iluminación LED.',
    accessibilityDescription: 'Circulación perimetral despejada y sin baños en el predio. El relevamiento de rampas, juegos y obstáculos aún está en curso.',
    ramps: {},
    paths: {
      exists: true,
      accessible: true,
      description: 'Veredas perimetrales y diagonales niveladas con buena iluminación',
    },
    wc: { exists: false, accessible: false },
    playground: {},
    hazards: {},
    elements: {
      ramps: [],
      wcs: [],
      playgrounds: [],
      hazards: [],
    },
  },
  'Plaza Bella Vista': {
    description: 'Espacio recreativo barrial con cancha deportiva, juegos infantiles y áreas de descanso.',
    accessibilityDescription: 'Cuenta con zona de juegos y espacios abiertos; falta completar el relevamiento de rampas, caminos internos y baños.',
    ramps: {},
    paths: {},
    wc: {},
    playground: { exists: true },
    hazards: { exists: false },
    elements: {
      ramps: [],
      wcs: [],
      playgrounds: [
        { _id: 'seed-bv-play-1', description: 'Sector de juegos de plaza junto a la cancha', accessible: false, lat: -32.31140, lon: -58.07965 },
      ],
      hazards: [],
    },
  },
  'Plaza de los Deportes': {
    description: 'Complejo deportivo público con pista de atletismo, canchas multifunción y equipamiento aeróbico.',
    accessibilityDescription: 'Dispone de vestuarios con baños (sin adaptación accesible), juegos y circulación interna pavimentada; falta registrar rampas de acceso y obstáculos.',
    ramps: {},
    paths: {
      exists: true,
      accessible: true,
      description: 'Circuito interno pavimentado y continuo alrededor de las canchas',
    },
    wc: { exists: true, accessible: false },
    playground: { exists: true },
    hazards: {},
    elements: {
      ramps: [],
      wcs: [
        { _id: 'seed-dep-wc-1', description: 'Baños en sector de vestuarios con puerta angosta', accessible: false, lat: -32.32472, lon: -58.08190 },
      ],
      playgrounds: [
        { _id: 'seed-dep-play-1', description: 'Zona de juegos y estaciones saludables al aire libre', accessible: true, lat: -32.32460, lon: -58.08188 },
      ],
      hazards: [],
    },
  },
}

export function isInvalidText(text) {
  return typeof text === 'string' && INVALID_TEXT.test(text)
}

function cleanText(text, fallback = '') {
  if (!text || isInvalidText(text)) return fallback
  return text
}

function mergeElements(rawList, seedList = []) {
  const valid = (Array.isArray(rawList) ? rawList : []).filter(item => !isInvalidText(item?.description))
  if (valid.length > 0) return valid
  return seedList
}

// Limpia registros de prueba que no corresponden (como «robot malvado») y completa datos de prueba en las plazas de Paysandú.
export function normalizeSquare(square) {
  if (!square || square.demo || isInvalidText(square.name)) return null
  const seed = SEED_SQUARES[square.name]
  if (!seed) {
    const rawElements = square.elements
    const elements = rawElements && typeof rawElements === 'object'
      ? {
          ramps: mergeElements(rawElements.ramps),
          wcs: mergeElements(rawElements.wcs),
          playgrounds: mergeElements(rawElements.playgrounds),
          hazards: mergeElements(rawElements.hazards),
        }
      : undefined
    return {
      ...square,
      description: cleanText(square.description),
      accessibilityDescription: cleanText(square.accessibilityDescription),
      ...(elements && { elements }),
    }
  }

  const rawElements = square.elements
  const elements = {
    ramps: seed.ramps?.exists ? mergeElements(rawElements?.ramps, seed.elements.ramps) : [],
    wcs: seed.wc?.exists ? mergeElements(rawElements?.wcs, seed.elements.wcs) : [],
    playgrounds: seed.playground?.exists ? mergeElements(rawElements?.playgrounds, seed.elements.playgrounds) : [],
    hazards: seed.hazards?.exists ? mergeElements(rawElements?.hazards, seed.elements.hazards) : [],
  }

  return {
    ...square,
    description: cleanText(square.description, seed.description),
    accessibilityDescription: cleanText(square.accessibilityDescription, seed.accessibilityDescription),
    ramps: { ...seed.ramps },
    paths: { ...seed.paths },
    wc: { ...seed.wc },
    playground: { ...seed.playground },
    hazards: { ...seed.hazards },
    elements,
  }
}
