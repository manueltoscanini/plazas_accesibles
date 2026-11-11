import { test } from 'node:test'
import assert from 'node:assert/strict'
import { request } from './api.js'

test('sends login JSON and returns the API token', async () => {
  const originalFetch = globalThis.fetch
  globalThis.fetch = async (url, options) => {
    assert.equal(url, '/api/users/login')
    assert.equal(options.method, 'POST')
    assert.equal(options.headers['Content-Type'], 'application/json')
    assert.deepEqual(JSON.parse(options.body), { email: 'a@b.com', password: '1234' })
    return new Response(JSON.stringify({ token: 'jwt' }))
  }
  try {
    assert.deepEqual(await request('/users/login', { body: { email: 'a@b.com', password: '1234' } }), { token: 'jwt' })
  } finally { globalThis.fetch = originalFetch }
})

test('sends authorization and exposes API errors', async () => {
  const originalFetch = globalThis.fetch
  globalThis.fetch = async (_url, options) => {
    assert.equal(options.headers.Authorization, 'Bearer jwt')
    return new Response(JSON.stringify({ message: 'Sesión vencida' }), { status: 401 })
  }
  try {
    await assert.rejects(request('/reports/create', { token: 'jwt', body: {} }), { message: 'Sesión vencida', status: 401 })
  } finally { globalThis.fetch = originalFetch }
})

test('sends the image as multipart and lets fetch set the boundary', async () => {
  const originalFetch = globalThis.fetch
  const body = new FormData()
  body.append('image', new File(['photo'], 'rampa.png', { type: 'image/png' }))
  globalThis.fetch = async (url, options) => {
    assert.equal(url, '/api/uploads/image')
    assert.equal(options.method, 'POST')
    assert.deepEqual(options.headers, { Authorization: 'Bearer jwt' })
    assert.equal(options.body, body)
    assert.equal(options.body.get('image').name, 'rampa.png')
    return new Response(JSON.stringify({ url: 'https://example.com/rampa.png' }), { status: 201 })
  }
  try {
    assert.deepEqual(await request('/uploads/image', { body, token: 'jwt' }), { url: 'https://example.com/rampa.png' })
  } finally { globalThis.fetch = originalFetch }
})

test('reports non-JSON server failures clearly', async () => {
  const originalFetch = globalThis.fetch
  globalThis.fetch = async () => new Response('Bad gateway', { status: 502 })
  try {
    await assert.rejects(request('/square/list'), /No se pudo completar/)
  } finally { globalThis.fetch = originalFetch }
})
