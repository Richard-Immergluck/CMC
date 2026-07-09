const { expect, test } = require('@playwright/test')
const { signInPageAs } = require('./helpers/e2e-session')

const signInAs = async (request, email) => {
  const response = await request.post('/api/e2e/session', {
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
  price: 3.99,
  pricePence: 399,
  currency: 'gbp',
  formattedPrice: '£3.99',
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

  test('request fulfilment pricing is proposed by the track uploader using guided bands', async ({ request }) => {
    const suffix = `request-pricing-${Date.now()}`

    await signInAs(request, 'e2e-uploader@example.com')

    const createResponse = await request.post('/api/tracks', {
      data: createTrackInput(suffix)
    })
    const createdTrack = await createResponse.json()

    expect(createResponse.status()).toBe(200)

    await signInAs(request, 'e2e-admin@example.com')

    const approvalResponse = await request.patch(`/api/admin/tracks/${createdTrack.id}`, {
      data: {
        decision: 'approve',
        moderationNotes: 'Approved for request pricing E2E.'
      }
    })

    expect(approvalResponse.status()).toBe(200)

    await signInAs(request, 'e2e-customer@example.com')

    const trackRequestResponse = await request.post('/api/track-requests', {
      data: {
        trackId: createdTrack.id,
        title: 'Could you prepare a longer cut?',
        notes: 'A specialist rehearsal cut would be useful.'
      }
    })
    const trackRequest = await trackRequestResponse.json()

    expect(trackRequestResponse.status()).toBe(200)

    const forbiddenProposalResponse = await request.post(`/api/track-requests/${trackRequest.id}/pricing-proposals`, {
      data: {
        catalogueType: 'OPERA_EXCERPT',
        saleFormat: 'INDIVIDUAL',
        pricePence: 899,
        justification: 'Customer should not be able to price their own request.'
      }
    })

    expect(forbiddenProposalResponse.status()).toBe(403)

    await signInAs(request, 'e2e-uploader@example.com')

    const invalidPriceResponse = await request.post(`/api/track-requests/${trackRequest.id}/pricing-proposals`, {
      data: {
        catalogueType: 'SINGLE_TRACK',
        saleFormat: 'INDIVIDUAL',
        pricePence: 999,
        justification: 'This should be rejected by the guided pricing band.'
      }
    })

    expect(invalidPriceResponse.status()).toBe(400)

    const proposalResponse = await request.post(`/api/track-requests/${trackRequest.id}/pricing-proposals`, {
      data: {
        catalogueType: 'OPERA_EXCERPT',
        saleFormat: 'INDIVIDUAL',
        pricePence: 899,
        justification: 'Prepared to order with specialist cuts.'
      }
    })
    const proposal = await proposalResponse.json()

    expect(proposalResponse.status()).toBe(200)
    expect(proposal).toEqual(
      expect.objectContaining({
        id: expect.any(Number),
        requestId: trackRequest.id,
        proposedById: expect.any(String),
        pricePence: 899,
        currency: 'gbp',
        catalogueType: 'OPERA_EXCERPT',
        saleFormat: 'INDIVIDUAL',
        reviewStatus: 'NEEDS_REVIEW',
        requesterDecision: 'PENDING',
        justification: 'Prepared to order with specialist cuts.'
      })
    )
  })

  test('uploaders can propose request fulfilment pricing from the track requests tab', async ({ page }) => {
    const suffix = `request-pricing-ui-${Date.now()}`

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
        moderationNotes: 'Approved for request pricing UI E2E.'
      }
    })

    expect(approvalResponse.status()).toBe(200)

    await signInPageAs(page, 'e2e-customer@example.com')

    const trackRequestResponse = await page.request.post('/api/track-requests', {
      data: {
        trackId: createdTrack.id,
        title: 'UI request pricing fixture',
        notes: 'Please prepare a specialist opera cut.'
      }
    })
    const trackRequest = await trackRequestResponse.json()

    expect(trackRequestResponse.status()).toBe(200)

    await signInPageAs(page, 'e2e-uploader@example.com')
    await page.goto(`/catalogue/${createdTrack.id}?tab=requests&requestId=${trackRequest.id}`)

    const requestCard = page.locator(`#request-${trackRequest.id}`)

    await expect(requestCard.getByText('Request fulfilment price')).toBeVisible()
    await requestCard.getByLabel('Type').selectOption('OPERA_EXCERPT')
    await requestCard.getByLabel('Request price for UI request pricing fixture').getByLabel('£8.99').check()
    await requestCard.getByLabel('Pricing note (optional)').fill('Specialist preparation for a requested cut.')
    await requestCard.getByRole('button', { name: 'Propose Price' }).click()

    await expect(page.getByRole('status').filter({ hasText: 'Request price proposal sent.' })).toBeVisible()
    await expect(requestCard.locator('.cmc-track-request-pricing-summary strong')).toHaveText('£8.99')
    await expect(requestCard.getByText('Admin review needed')).toBeVisible()
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

    await page.getByRole('tab', { name: 'Operations' }).click()
    await expect(page.getByRole('heading', { name: 'Recent Orders' })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Recent Payment Events' })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Recent Audit Events' })).toBeVisible()

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
