const { expect, test } = require('@playwright/test')
const { signInPageAs } = require('./helpers/e2e-session')

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
  test('signed-in customers cannot access full audio for unowned tracks', async ({ page }) => {
    await signInPageAs(page, 'e2e-customer@example.com')

    const [profileResponse, catalogueResponse] = await Promise.all([
      page.request.get('/api/profile'),
      page.request.get('/api/tracks/list')
    ])
    const profile = await profileResponse.json()
    const catalogue = await catalogueResponse.json()
    const ownedTrackIds = new Set(profile.map(ownership => ownership.trackId))
    const unownedTrack = catalogue.find(track => !ownedTrackIds.has(track.id))

    expect(profileResponse.status()).toBe(200)
    expect(catalogueResponse.status()).toBe(200)
    expect(unownedTrack).toEqual(expect.objectContaining({ id: expect.any(Number) }))

    const fullResponse = await page.request.get(`/api/tracks/${unownedTrack.id}/signed-url?mode=full`)
    const fullBody = await fullResponse.json()

    expect(fullResponse.status()).toBe(403)
    expect(fullBody.message).toBe('Track access denied')

    const downloadResponse = await page.request.get(`/api/tracks/${unownedTrack.id}/signed-url?mode=download`)
    const downloadBody = await downloadResponse.json()

    expect(downloadResponse.status()).toBe(403)
    expect(downloadBody.message).toBe('Track access denied')

    const reviewResponse = await page.request.get(`/api/tracks/${unownedTrack.id}/signed-url?mode=review`)
    const reviewBody = await reviewResponse.json()

    expect(reviewResponse.status()).toBe(403)
    expect(reviewBody.message).toBe('Review access denied')

    await page.goto(`/catalogue/${unownedTrack.id}`)

    await expect(page.getByRole('button', { name: 'Preview' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Play Track' })).toHaveCount(0)
  })

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
    await expect(page.getByRole('heading', { name: 'Downloaded Tracks' })).toBeVisible()
    await expect(page.getByRole('tablist', { name: 'Profile track library' })).toHaveCount(0)
    await expect(page.getByRole('searchbox', { name: 'Search downloaded tracks' })).toBeVisible()

    const downloadsTable = page.getByRole('table', { name: 'Downloaded tracks' })
    await expect(downloadsTable.getByRole('link', { name: 'E2E Catalogue Navigation Study', exact: true })).toBeVisible()
    await expect(downloadsTable.getByText('Synthetic Test Fixture')).toBeVisible()
    await expect(downloadsTable.getByRole('columnheader', { name: 'Instrumentation' })).toHaveCount(0)
    await downloadsTable.getByRole('button', { name: 'Play E2E Catalogue Navigation Study' }).click()
    await expect(downloadsTable.getByRole('button', { name: 'Pause E2E Catalogue Navigation Study' })).toBeVisible()
    await expect(downloadsTable.getByRole('alert').filter({ hasText: /unavailable/i })).toHaveCount(0)
    await expect(downloadsTable.getByLabel('Playback position for E2E Catalogue Navigation Study')).toBeVisible()
    await expect(downloadsTable.getByRole('link', { name: 'Download E2E Catalogue Navigation Study' })).toBeVisible()
    await expect(downloadsTable.getByRole('link', { name: 'Open' })).toHaveCount(0)
    await expect(page.getByRole('heading', { name: 'My requests' })).toBeVisible()
    await expect(page.getByText('Poulenc Oboe Sonata')).toBeVisible()
    await expect(page.getByText(/New request · \d{2}\/\d{2}\/\d{4}/).first()).toBeVisible()
    await page.getByRole('link', { name: 'Poulenc Oboe Sonata' }).click()

    await expect(page).toHaveURL(/\/catalogue\/\d+\?tab=requests&requestId=\d+/)
    await expect(page.getByRole('tab', { name: /Requests/i })).toHaveAttribute('aria-selected', 'true')
    await expect(page.getByText('Poulenc Oboe Sonata')).toBeVisible()
    await expect(page.getByText('New request').first()).toBeVisible()
    await expect(page.getByLabel('Request title')).toBeVisible()
    await page.goto('/profile')

    const recentCommentsPanel = page.getByRole('article').filter({
      has: page.getByRole('heading', { name: 'Recent comments' })
    })
    await expect(recentCommentsPanel).toBeVisible()
    const recentCommentLink = recentCommentsPanel.getByRole('link', { name: 'E2E Catalogue Mendelssohn Sonata Excerpt Op. 16' })
    await expect(recentCommentLink).toBeVisible()
    await recentCommentLink.click()

    await expect(page).toHaveURL(/\/catalogue\/\d+\?tab=comments&commentId=\d+/)
    await expect(page.getByRole('tab', { name: /Comments/i })).toHaveAttribute('aria-selected', 'true')
    await expect(page.getByRole('textbox', { name: 'Add your comment' })).toBeVisible()
    const ownedPurchasePanel = page.getByRole('complementary', { name: 'Purchase track' })
    await expect(ownedPurchasePanel.getByRole('link', { name: 'View in Library' })).toBeVisible()
    await expect(ownedPurchasePanel.getByRole('link', { name: 'View in Library' })).toHaveAttribute('href', '/profile')
    await expect(ownedPurchasePanel.getByRole('button', { name: 'Add to Cart' })).toHaveCount(0)
    await expect(ownedPurchasePanel.getByRole('button', { name: 'Add to Wishlist' })).toHaveCount(0)
    await expect(ownedPurchasePanel.getByText(/£/)).toHaveCount(0)
    await page.goto('/profile')

    await downloadsTable.getByRole('link', { name: 'E2E Catalogue Navigation Study', exact: true }).click()

    await expect(page).toHaveURL(/\/catalogue\/\d+$/)
    await expect(page.getByRole('heading', { name: 'E2E Catalogue Navigation Study' })).toBeVisible()
    await expect(page.getByText('Synthetic Test Fixture')).toBeVisible()
    const libraryPurchasePanel = page.getByRole('complementary', { name: 'Purchase track' })
    await expect(libraryPurchasePanel.getByRole('link', { name: 'View in Library' })).toBeVisible()
    await expect(libraryPurchasePanel.getByRole('link', { name: 'View in Library' })).toHaveAttribute('href', '/profile')
    await expect(libraryPurchasePanel.getByRole('button', { name: 'Add to Cart' })).toHaveCount(0)

    await page.goto('/catalogue?q=E2E%20Catalogue%20Navigation%20Study')
    const ownedCatalogueRow = page.locator('.cmc-catalogue-track-card').filter({ hasText: 'E2E Catalogue Navigation Study' }).first()
    await expect(ownedCatalogueRow.getByText('Owned')).toBeVisible()
    await expect(ownedCatalogueRow.getByRole('link', { name: 'View in Library' })).toHaveCount(0)
    await expect(ownedCatalogueRow.getByRole('link', { name: 'Details' })).toBeVisible()
  })

  test('seeded uploaders see uploaded tracks as their default profile library tab', async ({ page }) => {
    await signInPageAs(page, 'e2e-uploader@example.com')

    await page.goto('/profile')

    await expect(page.locator('#profile-library-heading')).toHaveText('Uploaded Tracks')
    const libraryTabs = page.getByRole('tablist', { name: 'Profile track library' })
    await expect(libraryTabs).toBeVisible()
    await expect(libraryTabs.getByRole('tab', { name: /Uploaded Tracks/i })).toHaveAttribute('aria-selected', 'true')
    await expect(libraryTabs.getByRole('tab', { name: /Downloaded Tracks/i })).toHaveAttribute('aria-selected', 'false')

    const uploadsTable = page.getByRole('table', { name: 'Uploaded tracks' })
    await expect(uploadsTable.getByRole('columnheader', { name: 'Downloads' })).toBeVisible()
    await expect(uploadsTable.getByRole('columnheader', { name: 'Comments' })).toBeVisible()
    await expect(uploadsTable.getByRole('columnheader', { name: 'Requests' })).toBeVisible()
  })

  test('seeded customers can create a request from a track detail page', async ({ page }) => {
    await signInPageAs(page, 'e2e-customer@example.com')

    await page.goto('/catalogue')
    await expect(page.getByRole('heading', { name: /Browse Archive/i })).toBeVisible()

    await page.getByRole('link', { name: 'Details' }).first().click()
    await expect(page).toHaveURL(/\/catalogue\/\d+$/)
    await page.getByRole('tab', { name: /Requests/i }).click()

    const requestTitle = `E2E Smoke Request ${Date.now()}`
    await page.getByLabel('Request title').fill(requestTitle)
    await page.getByLabel('Request notes').fill('Please add a practice version with a slower click.')
    await page.getByRole('button', { name: 'Add Request' }).click()

    await expect(page.getByRole('status')).toContainText('Your request has been added.')
    const createdRequest = page.locator('.cmc-track-request').filter({ hasText: requestTitle }).first()
    await expect(createdRequest).toBeVisible()
    await expect(createdRequest.getByText('New request')).toBeVisible()
    await expect(createdRequest.getByText(/\d{2}\/\d{2}\/\d{4}/)).toBeVisible()
  })

  test('seeded customers can access upload navigation but not admin navigation', async ({ page }) => {
    await signInPageAs(page, 'e2e-customer@example.com')

    await page.goto('/')

    await expect(page).toHaveURL(/\/catalogue$/)
    await expect(page.getByRole('heading', { name: /Browse Archive/i })).toBeVisible()
    const primaryNav = page.getByRole('navigation', { name: 'Primary navigation' })
    await expect(primaryNav.getByRole('link', { name: 'Profile' })).toBeVisible()
    await expect(primaryNav.getByRole('link', { name: /^Cart \(\d+\)$/ })).toBeVisible()
    await expect(primaryNav.getByRole('link', { name: 'Sign Out' })).toBeVisible()
    await expect(primaryNav.getByRole('link', { name: /Login \/ Sign up/i })).toHaveCount(0)
    await expect(primaryNav.getByRole('link', { name: 'Upload' })).toBeVisible()
    await expect(primaryNav.getByRole('link', { name: 'Admin' })).toHaveCount(0)

    await page.goto('/upload')

    await expect(page.getByRole('heading', { name: 'Share a Track.' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Upload audio' })).toBeVisible()
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

  test('seeded support users can filter account lifecycle audit operations', async ({ page }) => {
    await signInPageAs(page, 'e2e-support@example.com')

    const operationsResponse = await page.request.get('/api/admin/operations?auditCategory=accountLifecycle')
    const operations = await operationsResponse.json()
    const lifecycleActions = new Set([
      'auth.inactive_api_rejected',
      'auth.sign_in_denied',
      'auth.sign_out',
      'user_access.self_update_denied',
      'user_access.updated',
      'user_access_change.requested',
      'user_access_change.approved',
      'user_access_change.rejected'
    ])

    expect(operationsResponse.status()).toBe(200)
    expect(operations.auditEvents.length).toBeGreaterThan(0)
    expect(operations.auditEvents.every(event => lifecycleActions.has(event.action))).toBe(true)
    expect(operations.auditEvents).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          action: 'auth.sign_in_denied',
          entityType: 'User',
          actor: expect.objectContaining({
            email: 'e2e-support@example.com'
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
