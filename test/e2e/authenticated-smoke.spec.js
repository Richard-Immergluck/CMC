const { expect, test } = require('@playwright/test')

const signInAs = async (request, email) => {
  const response = await request.post('/api/e2e/session', {
    data: {
      email
    }
  })

  expect(response.status()).toBe(200)
  return response.json()
}

test.describe('authenticated smoke', () => {
  test('seeded customers can access protected ownership APIs', async ({ request }) => {
    const session = await signInAs(request, 'e2e-customer@example.com')

    expect(session.user.email).toBe('e2e-customer@example.com')
    expect(session.user.role).toBe('CUSTOMER')

    const profileResponse = await request.get('/api/profile')
    const profile = await profileResponse.json()

    expect(profileResponse.status()).toBe(200)
    expect(profile).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          trackId: expect.any(Number)
        })
      ])
    )

    const cartResponse = await request.get('/api/cart')
    const cart = await cartResponse.json()

    expect(cartResponse.status()).toBe(200)
    expect(cart).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          trackId: profile[0].trackId
        })
      ])
    )
  })

  test('the E2E session endpoint only accepts seeded E2E users', async ({ request }) => {
    const response = await request.post('/api/e2e/session', {
      data: {
        email: 'richard@example.com'
      }
    })
    const body = await response.json()

    expect(response.status()).toBe(403)
    expect(body.message).toBe('Only seeded E2E users can request test sessions')
  })
})
