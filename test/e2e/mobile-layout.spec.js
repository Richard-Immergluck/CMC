const { expect, test } = require('@playwright/test')
const { signInPageAs } = require('./helpers/e2e-session')

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

    await expect(page.getByRole('heading', { name: /Browse Archive/i })).toBeVisible()
    await expect(page.getByLabel('Search catalogue')).toBeVisible()
    await expectNoDocumentHorizontalOverflow(page)

    const firstTrackLink = page.locator('.cmc-catalogue-track-heading a').first()
    const firstTrackTitle = await firstTrackLink.innerText()

    await firstTrackLink.click()

    await expect(page).toHaveURL(/\/catalogue\/\d+$/)
    await expect(page.getByRole('heading', { name: firstTrackTitle })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Back' })).toBeVisible()
    await expectNoDocumentHorizontalOverflow(page)
  })

  test('public home page fits a mobile viewport', async ({ page }) => {
    await page.goto('/')

    await expect(page.getByRole('heading', { name: /should not gather dust/i })).toBeVisible()
    await expect(page.getByRole('link', { name: 'Browse catalogue' })).toBeVisible()
    await expect(page.getByText(/Discover, buy, request and discuss/i)).toBeVisible()
    await expectNoDocumentHorizontalOverflow(page)
  })

  test('bespoke sign-in page fits a mobile viewport', async ({ page }) => {
    await page.goto('/auth/signin?callbackUrl=/catalogue')

    await expect(page.getByRole('heading', { name: 'Sign in to your catalogue workspace.' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Continue with Google' })).toBeVisible()
    await expectNoDocumentHorizontalOverflow(page)
  })

  test('approved uploader form fits a mobile viewport', async ({ page }) => {
    await signInPageAs(page, 'e2e-uploader@example.com')
    await page.goto('/upload')

    await expect(page.getByRole('heading', { name: 'Share a Track.' })).toBeVisible()
    await expect(page.getByLabel('Select a File')).toBeVisible()
    await expect(page.getByRole('textbox', { name: 'Title' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Submit' })).toBeVisible()
    await expectNoDocumentHorizontalOverflow(page)
  })

  test('customer upload form fits a mobile viewport', async ({ page }) => {
    await signInPageAs(page, 'e2e-customer@example.com')
    await page.goto('/upload')

    await expect(page.getByRole('heading', { name: 'Share a Track.' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Submit' })).toBeVisible()
    await expectNoDocumentHorizontalOverflow(page)
  })
})
