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

const signInPageAs = async (page, email) => {
  const response = await page.request.post('/api/e2e/session', {
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

  test('seeded customers can view purchased tracks in their profile', async ({ page }) => {
    await signInPageAs(page, 'e2e-customer@example.com')

    await page.goto('/profile')

    await expect(page.getByText('e2e-customer@example.com')).toBeVisible()
    await expect(page.getByRole('button', { name: /Purchased Tracks:\s*\d+/i })).toBeVisible()

    const purchasedPanel = page.locator('.tab-pane.active')
    await expect(purchasedPanel.getByRole('link', { name: 'E2E Catalogue Navigation Study' })).toBeVisible()
    await expect(purchasedPanel.getByText('Synthetic Test Fixture')).toBeVisible()

    await purchasedPanel.getByRole('link', { name: 'E2E Catalogue Navigation Study' }).click()

    await expect(page).toHaveURL(/\/profile\/\d+-/)
    await expect(page.getByRole('heading', { name: 'E2E Catalogue Navigation Study' })).toBeVisible()
    await expect(page.getByText('Synthetic Test Fixture')).toBeVisible()
    await expect(page.getByRole('link', { name: 'Download' })).toBeVisible()
    await expect(page.getByRole('textbox', { name: 'Comment' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Submit' })).toBeVisible()
  })

  test('seeded customers do not see uploader or admin navigation', async ({ page }) => {
    await signInPageAs(page, 'e2e-customer@example.com')

    await page.goto('/')

    await expect(page).toHaveURL(/\/catalogue$/)
    await expect(page.getByRole('heading', { name: /Track Listing/i })).toBeVisible()
    await expect(page.getByRole('link', { name: 'Upload' })).toHaveCount(0)
    await expect(page.getByRole('link', { name: 'Admin' })).toHaveCount(0)

    await page.goto('/upload')

    await expect(page.getByRole('heading', { name: 'Upload Form' })).toBeVisible()
    await expect(page.getByText('Approved uploader access is required before you can submit tracks.')).toBeVisible()
    await expect(page.getByRole('link', { name: 'Go to Profile' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Submit' })).toHaveCount(0)
  })

  test('seeded support users can inspect operations without user management access', async ({ page }) => {
    const session = await signInPageAs(page, 'e2e-support@example.com')

    expect(session.user.email).toBe('e2e-support@example.com')
    expect(session.user.role).toBe('SUPPORT')

    const operationsResponse = await page.request.get('/api/admin/operations')
    const operations = await operationsResponse.json()

    expect(operationsResponse.status()).toBe(200)
    expect(operations).toEqual(
      expect.objectContaining({
        orders: expect.any(Array),
        paymentEvents: expect.any(Array),
        auditEvents: expect.any(Array)
      })
    )

    const usersResponse = await page.request.get('/api/admin/users')
    const usersBody = await usersResponse.json()

    expect(usersResponse.status()).toBe(403)
    expect(usersBody.message).toBe('Admin access required')

    await page.goto('/admin')

    await expect(page.getByRole('heading', { name: 'Operations Console' })).toBeVisible()
    await expect(page.getByText(/Signed in as e2e-support@example\.com/)).toBeVisible()
    await expect(page.getByRole('tab', { name: 'Operations' })).toBeVisible()
    await expect(page.getByRole('tab', { name: /Track Review/i })).toBeVisible()
    await expect(page.getByRole('tab', { name: 'Users' })).toHaveCount(0)
  })

  test('download URL issuance is visible in support audit operations', async ({ page }) => {
    await signInPageAs(page, 'e2e-customer@example.com')

    const profileResponse = await page.request.get('/api/profile')
    const profile = await profileResponse.json()
    const trackId = profile[0].trackId

    const signedUrlResponse = await page.request.get(`/api/tracks/${trackId}/signed-url?mode=download`)

    expect(signedUrlResponse.status()).toBe(200)

    await signInPageAs(page, 'e2e-support@example.com')

    const operationsResponse = await page.request.get('/api/admin/operations')
    const operations = await operationsResponse.json()

    expect(operationsResponse.status()).toBe(200)
    expect(operations.auditEvents).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          action: 'track_access.signed_url_issued',
          entityType: 'Track',
          entityId: `${trackId}`,
          actor: expect.objectContaining({
            email: 'e2e-customer@example.com'
          })
        })
      ])
    )
  })

  test('seeded customers can comment on purchased tracks', async ({ request }) => {
    await signInAs(request, 'e2e-customer@example.com')

    const profileResponse = await request.get('/api/profile')
    const profile = await profileResponse.json()
    const trackId = profile[0].trackId
    const comment = `E2E ownership comment ${Date.now()}`

    const commentResponse = await request.post('/api/profile', {
      data: {
        trackId,
        comment
      }
    })
    const createdComment = await commentResponse.json()

    expect(commentResponse.status()).toBe(200)
    expect(createdComment).toEqual(
      expect.objectContaining({
        trackId,
        content: comment
      })
    )

    const publicCommentsResponse = await request.get(`/api/comments?trackId=${trackId}`)
    const publicComments = await publicCommentsResponse.json()

    expect(publicCommentsResponse.status()).toBe(200)
    expect(publicComments).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: createdComment.id,
          content: comment
        })
      ])
    )
  })
})
