const { expect, test } = require('@playwright/test')

test('public routes include baseline security headers', async ({ request }) => {
  const response = await request.get('/')
  const headers = response.headers()

  expect(response.status()).toBe(200)
  expect(headers['x-frame-options']).toBe('DENY')
  expect(headers['x-content-type-options']).toBe('nosniff')
  expect(headers['referrer-policy']).toBe('strict-origin-when-cross-origin')
  expect(headers['permissions-policy']).toContain('camera=()')
  expect(headers['content-security-policy']).toContain("default-src 'self'")
  expect(headers['content-security-policy']).toContain("frame-ancestors 'none'")
})

test('anonymous visitor can reach the public catalogue and auth gate', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('heading', { name: /should not gather dust/i })).toBeVisible()
  await expect(page.getByText(/Discover, buy, request and discuss/i)).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Find rehearsal material' })).toBeVisible()

  const primaryNav = page.getByRole('navigation', { name: 'Primary navigation' })
  await expect(primaryNav.getByRole('link', { name: 'Catalogue', exact: true })).toBeVisible()
  await expect(primaryNav.getByRole('link', { name: /Login \/ Sign up/i })).toBeVisible()
  await expect(page.getByRole('link', { name: 'Browse catalogue' })).toBeVisible()

  await primaryNav.getByRole('link', { name: 'Catalogue', exact: true }).click()
  await expect(page).toHaveURL(/\/catalogue$/)
  await expect(page.getByRole('heading', { name: /Track Listing/i })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Search' })).toBeVisible()

  await page.goto('/profile')
  await expect(page).toHaveURL(/\/auth\/signin\?callbackUrl=(%2F|\/)profile/)
  await expect(page.getByRole('heading', { name: 'Sign in to your catalogue workspace.' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Continue with Google' })).toBeVisible()
  await expect(page.getByText('GitHub')).toHaveCount(0)
})

test('anonymous visitor can use the bespoke sign-in entry point', async ({ page }) => {
  await page.goto('/')

  await page.getByRole('link', { name: /Login \/ Sign up/i }).click()

  await expect(page).toHaveURL(/\/auth\/signin/)
  await expect(page.getByRole('heading', { name: 'Sign in to your catalogue workspace.' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Continue with Google' })).toBeVisible()
  await expect(page.getByText('GitHub')).toHaveCount(0)
})

test('anonymous visitor can open a catalogue track and return to the listing', async ({ page }) => {
  await page.goto('/catalogue')
  await expect(page.getByRole('heading', { name: /Track Listing/i })).toBeVisible()

  const firstTrackLink = page.locator('.cmc-catalogue-track-heading a').first()
  const firstTrackTitle = await firstTrackLink.innerText()

  await firstTrackLink.click()
  await expect(page).toHaveURL(/\/catalogue\/\d+$/)
  await expect(page.getByRole('heading', { name: firstTrackTitle })).toBeVisible()
  await expect(page.getByText(/Please .*login.* to add this track to your cart\./)).toBeVisible()

  await page.getByRole('button', { name: 'Back' }).click()
  await expect(page).toHaveURL(/\/catalogue$/)
  await expect(page.getByRole('heading', { name: /Track Listing/i })).toBeVisible()
})

test('anonymous visitor can search catalogue tracks', async ({ page }) => {
  await page.goto('/catalogue')
  await expect(page.getByRole('link', { name: /Login \/ Sign up/i })).toBeVisible()
  const search = page.getByLabel('Search catalogue')
  await search.click()
  await search.pressSequentially('Mendelssohn')
  await page.getByRole('button', { name: 'Search' }).click()

  await expect(page.getByRole('link', { name: /Mendelssohn/i }).first()).toBeVisible()
  await expect(page.locator('.cmc-catalogue-track-card')).toHaveCount(5)
  await expect(page.locator('.cmc-catalogue-track-card').filter({ hasText: /Bach/i })).toHaveCount(0)
})

test('invalid catalogue track routes render a not found page', async ({ page }) => {
  const response = await page.goto('/catalogue/not-a-track')

  expect(response.status()).toBe(404)
  await expect(page.getByText(/404/i)).toBeVisible()
})
