// Datos de prueba realistas para las plazas de Paysandú con fotos de Pexels y filtro de textos inválidos.
const INVALID_TEXT = /robot\s*malvado|plaza\s*falsa|elemento\s*de\s*prueba/i

const PEXELS = {
  ramp1: 'https://images.pexels.com/photos/9808741/pexels-photo-9808741.jpeg?auto=compress&cs=tinysrgb&w=1200',
  ramp2: 'https://images.pexels.com/photos/29608838/pexels-photo-29608838.jpeg?auto=compress&cs=tinysrgb&w=1200',
  ramp3: 'https://images.pexels.com/photos/8415672/pexels-photo-8415672.jpeg?auto=compress&cs=tinysrgb&w=1200',
  ramp4: 'https://images.pexels.com/photos/8415737/pexels-photo-8415737.jpeg?auto=compress&cs=tinysrgb&w=1200',
  path1: 'https://images.pexels.com/photos/9192661/pexels-photo-9192661.jpeg?auto=compress&cs=tinysrgb&w=1200',
  path2: 'https://images.pexels.com/photos/18561081/pexels-photo-18561081.jpeg?auto=compress&cs=tinysrgb&w=1200',
  path3: 'https://images.pexels.com/photos/7956384/pexels-photo-7956384.jpeg?auto=compress&cs=tinysrgb&w=1200',
  path4: 'https://images.pexels.com/photos/10255850/pexels-photo-10255850.jpeg?auto=compress&cs=tinysrgb&w=1200',
  wc1: 'https://images.pexels.com/photos/4239131/pexels-photo-4239131.jpeg?auto=compress&cs=tinysrgb&w=1200',
  wc2: 'https://images.pexels.com/photos/16501253/pexels-photo-16501253.jpeg?auto=compress&cs=tinysrgb&w=1200',
  play1: 'https://images.pexels.com/photos/5591632/pexels-photo-5591632.jpeg?auto=compress&cs=tinysrgb&w=1200',
  play2: 'https://images.pexels.com/photos/5826495/pexels-photo-5826495.jpeg?auto=compress&cs=tinysrgb&w=1200',
  play3: 'https://images.pexels.com/photos/317262/pexels-photo-317262.jpeg?auto=compress&cs=tinysrgb&w=1200',
  play4: 'https://images.pexels.com/photos/28147598/pexels-photo-28147598.jpeg?auto=compress&cs=tinysrgb&w=1200',
  play5: 'https://images.pexels.com/photos/30740924/pexels-photo-30740924.jpeg?auto=compress&cs=tinysrgb&w=1200',
}

const SEED_SQUARES = {
  'Plaza Constitución': {
    description: 'Plaza principal en el centro de Paysandú, frente a la Basílica Nuestra Señora del Rosario y San Benito de Palermo.',
    accessibilityDescription: 'Cuenta con rampas en las esquinas sobre 18 de Julio y Monte Caseros, veredas amplias de baldosas parejas y bancos con espacio lateral para silla de ruedas.',
    ramps: { exists: true },
    paths: {
      exists: true,
      accessible: true,
      description: 'Caminos amplios de baldosa firme y nivelada en todo el perímetro y diagonales',
      pictures: [PEXELS.path1],
    },
    wc: { exists: false, accessible: false },
    playground: { exists: false },
    hazards: { exists: false },
    elements: {
      ramps: [
        { _id: 'seed-const-ramp-1', description: 'Rampa de hormigón con baranda en esquina 18 de Julio y Monte Caseros', picture: PEXELS.ramp1, lat: -32.31702, lon: -58.08095 },
        { _id: 'seed-const-ramp-2', description: 'Rampa de acceso peatonal sobre calle Zorrilla de San Martín', picture: PEXELS.ramp2, lat: -32.31722, lon: -58.08071 },
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
      pictures: [PEXELS.path2],
    },
    wc: { exists: true, accessible: true },
    playground: { exists: true },
    hazards: { exists: true },
    elements: {
      ramps: [
        { _id: 'seed-art-ramp-1', description: 'Rampa ancha de acceso hacia la explanada central', picture: PEXELS.ramp3, lat: -32.31595, lon: -58.09525 },
      ],
      wcs: [
        { _id: 'seed-art-wc-1', description: 'Baño público con puerta ancha, barras de apoyo y rampa de ingreso', picture: PEXELS.wc1, accessible: true, lat: -32.31615, lon: -58.09501 },
      ],
      playgrounds: [
        { _id: 'seed-art-play-1', description: 'Sector de juegos infantiles con piso de caucho y hamaca integradora', picture: PEXELS.play1, accessible: true, lat: -32.31588, lon: -58.09498 },
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
        { _id: 'seed-acuna-ramp-1', description: 'Rampa en esquina con rebaje de cordón señalizado', picture: PEXELS.ramp4, lat: -32.32165, lon: -58.08928 },
      ],
      wcs: [],
      playgrounds: [
        { _id: 'seed-acuna-play-1', description: 'Área de juegos infantiles con acceso a nivel desde el sendero principal', picture: PEXELS.play2, accessible: true, lat: -32.32181, lon: -58.08910 },
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
        { _id: 'seed-riv-play-1', description: 'Juegos de madera sobre superficie de arena y césped', picture: PEXELS.play3, accessible: false, lat: -32.31501, lon: -58.07470 },
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
      pictures: [PEXELS.path3],
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
        { _id: 'seed-bv-play-1', description: 'Sector de juegos de plaza junto a la cancha', picture: PEXELS.play4, accessible: false, lat: -32.31140, lon: -58.07965 },
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
      pictures: [PEXELS.path4],
    },
    wc: { exists: true, accessible: false },
    playground: { exists: true },
    hazards: {},
    elements: {
      ramps: [],
      wcs: [
        { _id: 'seed-dep-wc-1', description: 'Baños en sector de vestuarios con puerta angosta', picture: PEXELS.wc2, accessible: false, lat: -32.32472, lon: -58.08190 },
      ],
      playgrounds: [
        { _id: 'seed-dep-play-1', description: 'Zona de juegos y estaciones saludables al aire libre', picture: PEXELS.play5, accessible: true, lat: -32.32460, lon: -58.08188 },
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
  if (valid.length > 0) {
    return valid.map((item, i) => ({
      ...item,
      picture: item.picture || seedList[i]?.picture || seedList[0]?.picture || '',
    }))
  }
  return seedList
}

// Limpia registros de prueba que no corresponden (como «robot malvado») y completa datos y fotos de prueba en las plazas de Paysandú.
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

  const paths = {
    ...seed.paths,
    ...(seed.paths?.pictures && {
      pictures: [...new Set([...(square.paths?.pictures ?? []), ...seed.paths.pictures])],
    }),
  }

  return {
    ...square,
    description: cleanText(square.description, seed.description),
    accessibilityDescription: cleanText(square.accessibilityDescription, seed.accessibilityDescription),
    ramps: { ...seed.ramps },
    paths,
    wc: { ...seed.wc },
    playground: { ...seed.playground },
    hazards: { ...seed.hazards },
    elements,
  }
}
