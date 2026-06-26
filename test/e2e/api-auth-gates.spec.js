const { expect, test } = require('@playwright/test')

test.describe('anonymous API access', () => {
  test('upload signing requires authentication', async ({ request }) => {
    const response = await request.post('/api/uploads/signed-url', {
      data: {
        fileName: 'smoke-test.mp3',
        contentType: 'audio/mpeg'
      }
    })

    expect(response.status()).toBe(401)
    expect(await response.text()).toContain('Authentication required')
  })

  test('checkout requires authentication', async ({ request }) => {
    const response = await request.post('/api/stripe/checkout_sessions', {
      data: {
        trackIds: [1]
      }
    })

    expect(response.status()).toBe(401)
    expect(await response.text()).toContain('Authentication required')
  })

  test('full track access requires authentication', async ({ request }) => {
    const response = await request.get('/api/tracks/1/signed-url?mode=full')

    expect(response.status()).toBe(401)
    expect(await response.text()).toContain('Authentication required')
  })

  test('admin summary requires authentication', async ({ request }) => {
    const response = await request.get('/api/admin/summary')

    expect(response.status()).toBe(401)
    expect(await response.text()).toContain('Authentication required')
  })

  test('profile ownership data requires authentication', async ({ request }) => {
    const response = await request.get('/api/profile')

    expect(response.status()).toBe(401)
    expect(await response.text()).toContain('Authentication required')
  })

  test('profile comments require authentication', async ({ request }) => {
    const response = await request.post('/api/profile', {
      data: {
        trackId: 1,
        comment: 'Anonymous comment attempt'
      }
    })

    expect(response.status()).toBe(401)
    expect(await response.text()).toContain('Authentication required')
  })

  test('cart ownership data requires authentication', async ({ request }) => {
    const response = await request.get('/api/cart')

    expect(response.status()).toBe(401)
    expect(await response.text()).toContain('Authentication required')
  })
})
