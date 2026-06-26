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

const createTrackInput = suffix => ({
  title: `E2E Checkout Study ${suffix}`,
  composer: 'Synthetic Checkout Fixture',
  key: 'A minor',
  instrumentation: 'Piano reduction',
  newFileName: `e2e-fixtures/checkout-${suffix}.mp3`,
  previewStart: 0,
  previewEnd: 12,
  durationSeconds: 30,
  sourceContentType: 'audio/mpeg',
  additionalInfo: 'Synthetic checkout track created by Playwright.',
  price: 4.75,
  pricePence: 475,
  currency: 'gbp',
  formattedPrice: 'GBP 4.75',
  downloadName: `checkout-${suffix}.mp3`,
  downloadCount: 0
})

const createPublishedTrack = async (page, suffix) => {
  await signInPageAs(page, 'e2e-uploader@example.com')

  const createResponse = await page.request.post('/api/tracks', {
    data: createTrackInput(suffix)
  })
  const createdTrack = await createResponse.json()

  expect(createResponse.status()).toBe(200)

  await signInPageAs(page, 'e2e-admin@example.com')

  const approvalResponse = await page.request.patch(`/api/admin/tracks/${createdTrack.id}`, {
    data: {
      decision: 'approve',
      moderationNotes: 'Approved for checkout browser E2E.'
    }
  })

  expect(approvalResponse.status()).toBe(200)

  return createdTrack
}

test.describe('checkout browser flow', () => {
  test('customers can buy a catalogue track and receive profile ownership', async ({ page }) => {
    const suffix = `${Date.now()}`
    const track = await createPublishedTrack(page, suffix)

    await signInPageAs(page, 'e2e-customer@example.com')
    await page.goto(`/catalogue/${track.id}`)

    await expect(page.getByRole('heading', { name: track.title })).toBeVisible()

    page.once('dialog', async dialog => {
      expect(dialog.message()).toBe('Track added to cart!')
      await dialog.accept()
    })

    await page.getByRole('button', { name: 'Add to Cart' }).click()
    await page.goto('/cart')

    await expect(page.getByText('Shopping Cart')).toBeVisible()
    await expect(page.getByRole('link', { name: track.title })).toBeVisible()
    await expect(page.getByText('GBP 4.75')).toBeVisible()

    const deniedDownloadResponse = await page.request.get(
      `/api/tracks/${track.id}/signed-url?mode=download`
    )

    expect(deniedDownloadResponse.status()).toBe(403)

    await page.getByRole('button', { name: 'Buy Now' }).click()

    const purchasedTabPanel = page.getByRole('tabpanel', { name: 'Purchased' })
    await expect(purchasedTabPanel.getByRole('link', { name: track.title })).toBeVisible()

    const signedUrlResponse = await page.request.get(`/api/tracks/${track.id}/signed-url?mode=download`)
    const signedUrlBody = await signedUrlResponse.json()

    expect(signedUrlResponse.status()).toBe(200)
    expect(signedUrlBody).toEqual(
      expect.objectContaining({
        url: expect.any(String)
      })
    )
  })
})
