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

const createTinyMp3 = () => {
  return Buffer.from([
    0x49, 0x44, 0x33, 0x03, 0x00, 0x00, 0x00, 0x00,
    0x00, 0x0f, 0x54, 0x49, 0x54, 0x32, 0x00, 0x00,
    0x00, 0x05, 0x00, 0x00, 0x03, 0x45, 0x32, 0x45
  ])
}

test.describe('upload browser flow', () => {
  test('approved uploaders can submit a track and see the review modal', async ({ page }) => {
    const suffix = Date.now()
    const title = `E2E Browser Upload ${suffix}`
    let interceptedUpload = false

    await page.route(/https:\/\/.*amazonaws\.com\/.*/, async route => {
      if (route.request().method() === 'PUT') {
        interceptedUpload = true
        await route.fulfill({
          status: 200,
          body: ''
        })
        return
      }

      await route.continue()
    })

    await signInPageAs(page, 'e2e-uploader@example.com')
    await page.goto('/upload')

    await expect(page.getByRole('heading', { name: 'Upload Form' })).toBeVisible()

    await page.locator('input[type="file"]').setInputFiles({
      name: `browser-upload-${suffix}.mp3`,
      mimeType: 'audio/mpeg',
      buffer: createTinyMp3()
    })
    await page.getByRole('textbox', { name: 'Title' }).fill(title)
    await page.getByRole('textbox', { name: 'Composer' }).fill('Synthetic Upload Fixture')
    await page.getByRole('textbox', { name: 'e.g. Gb Minor' }).fill('E minor')
    await page.getByRole('textbox', { name: 'e.g. Piano, Orchestra' }).fill('Piano')
    await page.getByRole('textbox', { name: 'eg. 00:35 or 35' }).fill('0')
    await page.getByRole('textbox', { name: /Tempo, cuts/i }).fill('Synthetic browser upload test.')
    await page.getByRole('textbox', { name: '0.00' }).fill('4.25')
    await page.getByLabel('Agree to terms and conditions').check()

    await page.getByRole('button', { name: 'Submit' }).click()

    const reviewDialog = page.getByRole('dialog', {
      name: 'Track submitted for review'
    })

    await expect(reviewDialog).toBeVisible()
    await expect(reviewDialog.getByText(/waiting for review/i)).toBeVisible()
    await expect(reviewDialog.getByRole('button', { name: 'Upload Another' })).toBeVisible()
    await expect(reviewDialog.getByRole('link', { name: 'Catalogue' })).toBeVisible()
    await expect(reviewDialog.getByRole('link', { name: 'Review Submissions' })).toBeVisible()
    expect(interceptedUpload).toBe(true)

    const adminResponse = await page.request.post('/api/e2e/session', {
      data: {
        email: 'e2e-admin@example.com'
      }
    })

    expect(adminResponse.status()).toBe(200)

    const pendingResponse = await page.request.get('/api/admin/tracks')
    const pendingBody = await pendingResponse.json()

    expect(pendingResponse.status()).toBe(200)
    expect(pendingBody.tracks).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          title,
          composer: 'Synthetic Upload Fixture',
          moderationStatus: 'PENDING'
        })
      ])
    )
  })
})
