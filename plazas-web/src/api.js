// En desarrollo le pido los datos a /api y Vite manda el pedido a Express. Si hay VITE_API_URL, uso esa dirección.
const baseUrl = import.meta.env?.VITE_API_URL || '/api'

// Paso por acá para hablar con la API. Mando el token si tengo uno y dejo el archivo en FormData cuando subo una foto.
export async function request(path, { body, token, signal, method = body === undefined ? 'GET' : 'POST' } = {}) {
  const multipart = body instanceof FormData
  let response
  try {
    response = await fetch(`${baseUrl}${path}`, {
      method,
      headers: {
        ...(body !== undefined && !multipart && { 'Content-Type': 'application/json' }),
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      body: multipart ? body : JSON.stringify(body),
      signal: signal || AbortSignal.timeout(15000),
    })
  } catch (error) {
    if (error.name === 'AbortError') throw error
    throw new Error('No pudimos conectar con la API. Comprobá que esté encendida e intentá de nuevo.')
  }
  // Si algo falla, guardo el código del error. Por ejemplo, con 401 la pantalla puede pedirte que vuelvas a entrar.
  const data = await response.json().catch(() => null)
  if (!response.ok || data === null) {
    const error = new Error(data?.message || 'No se pudo completar la solicitud. Intentá de nuevo.')
    error.status = response.status
    throw error
  }
  return data
}
