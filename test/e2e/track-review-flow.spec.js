const { expect, test } = require('@playwright/test')

const signInAs = async (request, email) => {
  const response = await request.post('/api/e2e/session', {
    data: {
      email
    }
  })

  expect(response.status()).toBe(200)
  return response.json()
}

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
  title: `E2E Pending Review ${suffix}`,
  composer: 'Synthetic Review Fixture',
  key: 'D major',
  instrumentation: 'Piano and strings',
  newFileName: `e2e-fixtures/pending-review-${suffix}.mp3`,
  previewStart: 0,
  previewEnd: 15,
  durationSeconds: 30,
  sourceContentType: 'audio/mpeg',
  additionalInfo: 'Synthetic pending review track created by Playwright.',
  price: 3.5,
  pricePence: 350,
  currency: 'gbp',
  formattedPrice: 'GBP 3.50',
  downloadName: `pending-review-${suffix}.mp3`,
  downloadCount: 0
})

test.describe('track review API flow', () => {
  test('approved uploaders can submit tracks for admin approval', async ({ request }) => {
    const suffix = `${Date.now()}`

    await signInAs(request, 'e2e-uploader@example.com')

    const createResponse = await request.post('/api/tracks', {
      data: createTrackInput(suffix)
    })
    const createdTrack = await createResponse.json()

    expect(createResponse.status()).toBe(200)
    expect(createdTrack).toEqual(
      expect.objectContaining({
        id: expect.any(Number),
        title: `E2E Pending Review ${suffix}`,
        status: 'DRAFT',
        moderationStatus: 'PENDING',
        processingStatus: 'READY'
      })
    )

    await signInAs(request, 'e2e-admin@example.com')

    const pendingResponse = await request.get('/api/admin/tracks')
    const pendingBody = await pendingResponse.json()

    expect(pendingResponse.status()).toBe(200)
    expect(pendingBody.tracks).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: createdTrack.id,
          title: createdTrack.title,
          moderationStatus: 'PENDING',
          uploader: expect.objectContaining({
            email: 'e2e-uploader@example.com'
          })
        })
      ])
    )

    const approvalResponse = await request.patch(`/api/admin/tracks/${createdTrack.id}`, {
      data: {
        decision: 'approve',
        moderationNotes: 'Approved by E2E smoke test.'
      }
    })
    const approvalBody = await approvalResponse.json()

    expect(approvalResponse.status()).toBe(200)
    expect(approvalBody.track).toEqual(
      expect.objectContaining({
        id: createdTrack.id,
        status: 'PUBLISHED',
        moderationStatus: 'APPROVED',
        processingStatus: 'READY'
      })
    )

    const publicTrackResponse = await request.get(`/api/tracks/${createdTrack.id}`)
    const publicTrack = await publicTrackResponse.json()

    expect(publicTrackResponse.status()).toBe(200)
    expect(publicTrack).toEqual(
      expect.objectContaining({
        id: createdTrack.id,
        title: createdTrack.title,
        composer: 'Synthetic Review Fixture'
      })
    )
  })

  test('admins can review, listen to, and approve pending tracks in the browser', async ({ page }) => {
    const suffix = `ui-${Date.now()}`

    await signInPageAs(page, 'e2e-uploader@example.com')

    const createResponse = await page.request.post('/api/tracks', {
      data: createTrackInput(suffix)
    })
    const createdTrack = await createResponse.json()

    expect(createResponse.status()).toBe(200)

    await signInPageAs(page, 'e2e-admin@example.com')
    await page.goto('/admin')

    await expect(page.getByRole('heading', { name: 'Operations Console' })).toBeVisible()
    await expect(page.getByText(/Signed in as e2e-admin@example\.com/)).toBeVisible()

    await page.getByRole('tab', { name: /Track Review/i }).click()

    const reviewRow = page.getByRole('row').filter({
      hasText: createdTrack.title
    })

    await expect(reviewRow).toBeVisible()
    await expect(reviewRow.getByText('e2e-uploader@example.com')).toBeVisible()
    await expect(reviewRow.locator('.badge', { hasText: 'PENDING' })).toBeVisible()

    await reviewRow.getByRole('button', { name: 'Listen' }).click()
    await expect(reviewRow.locator('audio')).toBeVisible()

    await reviewRow.getByRole('button', { name: 'Approve' }).click()

    await expect.poll(async () => {
      const publicTrackResponse = await page.request.get(`/api/tracks/${createdTrack.id}`)

      if (!publicTrackResponse.ok()) {
        return null
      }

      const publicTrack = await publicTrackResponse.json()
      return {
        id: publicTrack.id,
        title: publicTrack.title,
        status: publicTrack.status,
        moderationStatus: publicTrack.moderationStatus
      }
    }).toEqual({
      id: createdTrack.id,
      title: createdTrack.title,
      status: 'PUBLISHED',
      moderationStatus: 'APPROVED'
    })
  })
})
