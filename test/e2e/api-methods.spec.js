const { expect, test } = require('@playwright/test')

test.describe('API method contracts', () => {
  test('API home only accepts GET', async ({ request }) => {
    const response = await request.post('/api', {
      data: {}
    })

    expect(response.status()).toBe(405)
    expect(response.headers()['allow']).toBe('GET')
    expect(await response.text()).toContain('Method not allowed')
  })

  test('checkout creation only accepts POST', async ({ request }) => {
    const response = await request.get('/api/stripe/checkout_sessions')

    expect(response.status()).toBe(405)
    expect(response.headers()['allow']).toBe('POST')
    expect(await response.text()).toContain('Method not allowed')
  })

  test('upload signing only accepts POST', async ({ request }) => {
    const response = await request.get('/api/uploads/signed-url')

    expect(response.status()).toBe(405)
    expect(response.headers()['allow']).toBe('POST')
    expect(await response.text()).toContain('Method not allowed')
  })

  test('track creation only accepts POST', async ({ request }) => {
    const response = await request.get('/api/tracks')

    expect(response.status()).toBe(405)
    expect(response.headers()['allow']).toBe('POST')
    expect(await response.text()).toContain('Method not allowed')
  })

  test('E2E session creation only accepts POST', async ({ request }) => {
    const response = await request.get('/api/e2e/session')

    expect(response.status()).toBe(405)
    expect(response.headers()['allow']).toBe('POST')
    expect(await response.text()).toContain('Method not allowed')
  })

  test('admin summary only accepts GET', async ({ request }) => {
    const response = await request.post('/api/admin/summary', {
      data: {}
    })

    expect(response.status()).toBe(405)
    expect(response.headers()['allow']).toBe('GET')
    expect(await response.text()).toContain('Method not allowed')
  })

  test('admin operations only accepts GET', async ({ request }) => {
    const response = await request.post('/api/admin/operations', {
      data: {}
    })

    expect(response.status()).toBe(405)
    expect(response.headers()['allow']).toBe('GET')
    expect(await response.text()).toContain('Method not allowed')
  })

  test('admin health only accepts GET', async ({ request }) => {
    const response = await request.post('/api/admin/health', {
      data: {}
    })

    expect(response.status()).toBe(405)
    expect(response.headers()['allow']).toBe('GET')
    expect(await response.text()).toContain('Method not allowed')
  })

  test('demo fixtures only accept GET', async ({ request }) => {
    const response = await request.post('/api/demo-fixtures/bach-style-warmup.wav', {
      data: {}
    })

    expect(response.status()).toBe(405)
    expect(response.headers()['allow']).toBe('GET')
    expect(await response.text()).toContain('Method not allowed')
  })

  test('stripe webhooks only accept POST', async ({ request }) => {
    const response = await request.get('/api/stripe/webhook')

    expect(response.status()).toBe(405)
    expect(response.headers()['allow']).toBe('POST')
    expect(await response.text()).toContain('Method not allowed')
  })

  test('comments only accept GET', async ({ request }) => {
    const response = await request.post('/api/comments?trackId=1', {
      data: {}
    })

    expect(response.status()).toBe(405)
    expect(response.headers()['allow']).toBe('GET')
    expect(await response.text()).toContain('Method not allowed')
  })

  test('catalogue list only accepts GET', async ({ request }) => {
    const response = await request.post('/api/tracks/list', {
      data: {}
    })

    expect(response.status()).toBe(405)
    expect(response.headers()['allow']).toBe('GET')
    expect(await response.text()).toContain('Method not allowed')
  })

  test('catalogue detail only accepts GET', async ({ request }) => {
    const response = await request.post('/api/tracks/1', {
      data: {}
    })

    expect(response.status()).toBe(405)
    expect(response.headers()['allow']).toBe('GET')
    expect(await response.text()).toContain('Method not allowed')
  })
})
