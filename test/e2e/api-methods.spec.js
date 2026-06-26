const { expect, test } = require('@playwright/test')

test.describe('API method contracts', () => {
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

  test('admin summary only accepts GET', async ({ request }) => {
    const response = await request.post('/api/admin/summary', {
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
})
