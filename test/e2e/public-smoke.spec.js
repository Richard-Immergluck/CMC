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
  await expect(page.getByRole('heading', { name: 'Backing tracks should not gather dust.' })).toBeVisible()
  await expect(page.getByText(/publish useful home-made backing tracks/i)).toBeVisible()
  await expect(page.getByText(/Upload\. Discover\. Discuss\. Request\./i)).toBeVisible()
  await expect(page.getByRole('link', { name: 'Catalogue', exact: true })).toBeVisible()
  await expect(page.getByRole('link', { name: /Sign In \/ Register/i })).toBeVisible()
  await expect(page.getByRole('link', { name: 'Browse catalogue' })).toBeVisible()

  await page.getByRole('link', { name: 'Catalogue', exact: true }).click()
  await expect(page).toHaveURL(/\/catalogue$/)
  await expect(page.getByRole('heading', { name: /Track Listing/i })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Search' })).toBeVisible()

  await page.goto('/profile')
  await expect(page).toHaveURL(/\/api\/auth\/signin/)
  await expect(page.getByText('Sign in with Google')).toBeVisible()
  await expect(page.getByText('GitHub')).toHaveCount(0)
})

test('anonymous visitor can open a catalogue track and return to the listing', async ({ page }) => {
  await page.goto('/catalogue')
  await expect(page.getByRole('heading', { name: /Track Listing/i })).toBeVisible()

  await page.getByRole('link', { name: 'E2E Catalogue Navigation Study' }).first().click()
  await expect(page).toHaveURL(/\/catalogue\/\d+$/)
  await expect(page.getByRole('heading', { name: 'E2E Catalogue Navigation Study' })).toBeVisible()
  await expect(page.getByText('Synthetic Test Fixture')).toBeVisible()

  await page.getByRole('button', { name: 'Back' }).click()
  await expect(page).toHaveURL(/\/catalogue$/)
  await expect(page.getByRole('heading', { name: /Track Listing/i })).toBeVisible()
})

test('anonymous visitor can search catalogue tracks', async ({ page }) => {
  await page.goto('/catalogue')
  await page.getByLabel('Search catalogue').fill('Mendelssohn')
  await page.getByRole('button', { name: 'Search' }).click()

  await expect(page.getByRole('link', { name: /Mendelssohn/i }).first()).toBeVisible()
  await expect(page.getByRole('link', { name: /Bach/i })).toHaveCount(0)
})

test('invalid catalogue track routes render a not found page', async ({ page }) => {
  const response = await page.goto('/catalogue/not-a-track')

  expect(response.status()).toBe(404)
  await expect(page.getByText(/404/i)).toBeVisible()
})
