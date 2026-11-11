import { request } from './api'

export const photoAccept = 'image/jpeg,image/png,image/webp'

export async function uploadPhoto(file, token) {
  if (!file?.name || !photoAccept.split(',').includes(file.type) || !file.size || file.size > 5 * 1024 * 1024) {
    throw new Error('Elegí una foto JPG, PNG o WEBP de hasta 5 MB.')
  }
  const body = new FormData()
  body.append('image', file)
  const data = await request('/uploads/image', { token, body, signal: AbortSignal.timeout(60000) })
  if (typeof data.url !== 'string' || !data.url.startsWith('https://')) {
    throw new Error('La API no devolvió un enlace válido para la foto.')
  }
  return data.url
}
