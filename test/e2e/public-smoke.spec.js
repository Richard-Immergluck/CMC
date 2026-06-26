const { expect, test } = require('@playwright/test')

test('anonymous visitor can reach the public catalogue and auth gate', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('heading', { name: 'C.M.B.C' })).toBeVisible()
  await expect(page.getByRole('link', { name: 'Catalogue', exact: true })).toBeVisible()
  await expect(page.getByRole('link', { name: /Sign In \/ Register/i })).toBeVisible()

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
