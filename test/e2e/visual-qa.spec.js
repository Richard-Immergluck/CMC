const { expect, test } = require('@playwright/test')

const signInPageAs = async (page, email) => {
  const response = await page.request.post('/api/e2e/session', {
    data: { email }
  })

  expect(response.status()).toBe(200)
}

const getLayoutMetrics = async page => {
  return page.evaluate(() => ({
    clientWidth: document.documentElement.clientWidth,
    scrollWidth: Math.max(document.body.scrollWidth, document.documentElement.scrollWidth),
    viewportWidth: window.innerWidth
  }))
}

const capture = async ({ name, page }, testInfo) => {
  const metrics = await getLayoutMetrics(page)

  expect(metrics.clientWidth).toBeGreaterThan(0)

  await testInfo.attach(name, {
    body: await page.screenshot({ fullPage: true }),
    contentType: 'image/png'
  })
  await testInfo.attach(`${name}-layout`, {
    body: JSON.stringify(metrics, null, 2),
    contentType: 'application/json'
  })
}

test.describe('visual QA snapshots', () => {
  test('public home, catalogue, and auth surfaces have review screenshots', async ({ page }, testInfo) => {
    await page.goto('/')
    await expect(page.getByRole('heading', { name: /should not gather dust/i })).toBeVisible()
    await capture({ name: 'home-desktop', page }, testInfo)

    await page.goto('/catalogue')
    await expect(page.getByRole('heading', { name: 'Browse Archive' })).toBeVisible()
    await capture({ name: 'catalogue-desktop', page }, testInfo)

    await page.goto('/auth/signin?callbackUrl=/catalogue')
    await expect(page.getByRole('heading', { name: 'Sign in to your catalogue workspace.' })).toBeVisible()
    await capture({ name: 'auth-desktop', page }, testInfo)
  })

  test('mobile public and catalogue surfaces have review screenshots', async ({ page }, testInfo) => {
    await page.setViewportSize({ width: 390, height: 844 })

    await page.goto('/')
    await expect(page.getByRole('heading', { name: /should not gather dust/i })).toBeVisible()
    await capture({ name: 'home-mobile', page }, testInfo)

    await page.goto('/catalogue')
    await expect(page.getByRole('heading', { name: 'Browse Archive' })).toBeVisible()
    await capture({ name: 'catalogue-mobile', page }, testInfo)

    await page.goto('/auth/signin?callbackUrl=/catalogue')
    await expect(page.getByRole('heading', { name: 'Sign in to your catalogue workspace.' })).toBeVisible()
    await capture({ name: 'auth-mobile', page }, testInfo)
  })

  test('protected upload and admin surfaces have review screenshots', async ({ page }, testInfo) => {
    await signInPageAs(page, 'e2e-customer@example.com')
    await page.goto('/upload')
    await expect(page.getByText('Approved uploader access is required before you can submit tracks.')).toBeVisible()
    await capture({ name: 'upload-customer-guard', page }, testInfo)

    await signInPageAs(page, 'e2e-admin@example.com')
    await page.goto('/admin')
    await expect(page.getByRole('heading', { name: 'Operations Console' })).toBeVisible()
    await capture({ name: 'admin-desktop', page }, testInfo)
  })
})
