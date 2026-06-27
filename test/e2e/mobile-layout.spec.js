const { expect, test } = require('@playwright/test')

const signInPageAs = async (page, email) => {
  const response = await page.request.post('/api/e2e/session', {
    data: {
      email
    }
  })

  expect(response.status()).toBe(200)
  return response.json()
}

const expectNoDocumentHorizontalOverflow = async page => {
  const overflow = await page.evaluate(() => {
    const width = window.innerWidth
    const scrollWidth = Math.max(
      document.body.scrollWidth,
      document.documentElement.scrollWidth
    )

    return {
      width,
      scrollWidth,
      overflowing: scrollWidth > width + 1
    }
  })

  expect(overflow).toEqual(
    expect.objectContaining({
      overflowing: false
    })
  )
}

test.describe('mobile layout smoke', () => {
  test.use({
    viewport: {
      width: 390,
      height: 844
    },
    isMobile: true
  })

  test('catalogue list and track detail fit a mobile viewport', async ({ page }) => {
    await page.goto('/catalogue')

    await expect(page.getByRole('heading', { name: /Track Listing/i })).toBeVisible()
    await expect(page.getByLabel('Search catalogue')).toBeVisible()
    await expectNoDocumentHorizontalOverflow(page)

    await page.getByRole('link', { name: 'E2E Catalogue Navigation Study' }).first().click()

    await expect(page).toHaveURL(/\/catalogue\/\d+$/)
    await expect(page.getByRole('heading', { name: 'E2E Catalogue Navigation Study' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Back' })).toBeVisible()
    await expectNoDocumentHorizontalOverflow(page)
  })

  test('approved uploader form fits a mobile viewport', async ({ page }) => {
    await signInPageAs(page, 'e2e-uploader@example.com')
    await page.goto('/upload')

    await expect(page.getByRole('heading', { name: 'Upload Form' })).toBeVisible()
    await expect(page.getByLabel('Select a File')).toBeVisible()
    await expect(page.getByRole('textbox', { name: 'Title' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Submit' })).toBeVisible()
    await expectNoDocumentHorizontalOverflow(page)
  })

  test('customer upload guard fits a mobile viewport', async ({ page }) => {
    await signInPageAs(page, 'e2e-customer@example.com')
    await page.goto('/upload')

    await expect(page.getByRole('heading', { name: 'Upload Form' })).toBeVisible()
    await expect(page.getByText('Approved uploader access is required before you can submit tracks.')).toBeVisible()
    await expect(page.getByRole('link', { name: 'Go to Profile' })).toBeVisible()
    await expectNoDocumentHorizontalOverflow(page)
  })
})
