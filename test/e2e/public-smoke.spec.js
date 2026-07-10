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
  await expect(primaryNav.getByRole('link', { name: 'Works', exact: true })).toBeVisible()
  await expect(primaryNav.getByRole('link', { name: /Login \/ Sign up/i })).toBeVisible()
  await expect(page.getByRole('link', { name: 'Browse catalogue' })).toBeVisible()

  await primaryNav.getByRole('link', { name: 'Works', exact: true }).click()
  await expect(page).toHaveURL(/\/works-collections$/)
  await expect(page.getByRole('heading', { name: /Grouped music for bigger practice plans/i })).toBeVisible()

  await primaryNav.getByRole('link', { name: 'Catalogue', exact: true }).click()
  await expect(page).toHaveURL(/\/catalogue$/)
  await expect(page.getByRole('heading', { name: /Browse Archive/i })).toBeVisible()
  await expect(page.getByLabel('Search catalogue')).toBeVisible()

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
  await expect(page.getByRole('heading', { name: /Browse Archive/i })).toBeVisible()

  const firstTrackLink = page.locator('.cmc-catalogue-track-heading a').first()
  const firstTrackTitle = await firstTrackLink.innerText()

  await firstTrackLink.click()
  await expect(page).toHaveURL(/\/catalogue\/\d+$/)
  await expect(page.getByRole('heading', { name: firstTrackTitle })).toBeVisible()
  await expect(page.getByText(/Please .*login.* to add this track to your cart\./)).toBeVisible()
  await page.getByRole('tab', { name: /Comments/i }).click()
  await expect(page.getByLabel('Sign in and purchase this track to add your comment')).toBeVisible()
  await page.getByRole('tab', { name: /Requests/i }).click()
  await expect(page.getByLabel('Sign in to make a request')).toBeVisible()

  await page.getByRole('button', { name: 'Back' }).click()
  await expect(page).toHaveURL(/\/catalogue$/)
  await expect(page.getByRole('heading', { name: /Browse Archive/i })).toBeVisible()
})

test('anonymous visitor returns to the same catalogue scroll position from track detail', async ({ page }) => {
  await page.goto('/catalogue?pageSize=50')
  await expect(page.getByRole('heading', { name: /Browse Archive/i })).toBeVisible()

  const resultList = page.locator('.cmc-catalogue-result-list')
  await expect(page.locator('.cmc-catalogue-track-card')).toHaveCount(50)

  await resultList.evaluate(element => {
    element.scrollTop = element.scrollHeight
  })

  const scrollBeforeNavigation = await resultList.evaluate(element => element.scrollTop)
  expect(scrollBeforeNavigation).toBeGreaterThan(0)

  await page.getByRole('link', { name: 'Details' }).last().click()
  await expect(page).toHaveURL(/\/catalogue\/\d+$/)

  await page.getByRole('button', { name: 'Back' }).click()
  await expect(page).toHaveURL(/\/catalogue\?pageSize=50$/)

  await expect.poll(
    async () => resultList.evaluate(element => element.scrollTop)
  ).toBeGreaterThan(scrollBeforeNavigation - 10)
})

test('anonymous visitor can play an approved audio preview from the action button', async ({ page }) => {
  await page.goto('/catalogue?q=E2E%20Catalogue%20Bach%20Audition%20Cut&pageSize=10')
  await expect(page.getByRole('link', { name: 'E2E Catalogue Bach Audition Cut Op. 52' })).toBeVisible()

  await page.getByRole('button', { name: 'Preview', exact: true }).first().click()

  await expect(page.locator('.cmc-preview-player')).toHaveCount(0)

  const audioPreview = page.locator('audio.cmc-audio-preview-source').first()
  await expect(audioPreview).toHaveAttribute('src', /\/demo-fixtures\/.+\.(mp3|wav)/)
  await expect(audioPreview).not.toHaveAttribute('src', /\/uploads\//)
})

test('anonymous visitor can search catalogue tracks', async ({ page }) => {
  await page.goto('/catalogue')
  await expect(page.getByRole('link', { name: /Login \/ Sign up/i })).toBeVisible()
  const search = page.getByLabel('Search catalogue')
  await search.click()
  await search.pressSequentially('Mendelssohn')
  await search.press('Enter')

  const resultCards = page.locator('.cmc-catalogue-track-card')

  await expect(page.getByRole('link', { name: /Mendelssohn/i }).first()).toBeVisible()
  await expect(resultCards.first()).toBeVisible()
  expect(await resultCards.count()).toBeGreaterThan(0)
  expect(await resultCards.count()).toBeLessThanOrEqual(10)
  await expect(resultCards.filter({ hasText: /Bach/i })).toHaveCount(0)
  await expect(page.getByLabel('Composer').locator('option')).toHaveText([
    'All',
    'Mendelssohn Style Synthetic Fixture'
  ])
  await expect(page.getByLabel('Key').locator('option')).toHaveText([
    'All',
    'C major',
    'E minor',
    'G minor'
  ])

  await page.getByRole('link', { name: 'Clear search' }).click()
  await expect(page).toHaveURL(/\/catalogue/)
  await expect(page.getByLabel('Search catalogue')).toHaveValue('')
})

test('anonymous catalogue filters apply when changed', async ({ page }) => {
  await page.goto('/catalogue')
  await page.getByLabel('Page size').selectOption('10')

  await expect(page).toHaveURL(/pageSize=10/)
  await expect(page.locator('.cmc-catalogue-track-card')).toHaveCount(10)
})

test('invalid catalogue track routes render a not found page', async ({ page }) => {
  const response = await page.goto('/catalogue/not-a-track')

  expect(response.status()).toBe(404)
  await expect(page.getByText(/404/i)).toBeVisible()
})
