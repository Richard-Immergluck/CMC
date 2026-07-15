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

  test('support admins can bulk approve pending uploaded tracks', async ({ request }) => {
    const suffix = `bulk-${Date.now()}`

    await signInAs(request, 'e2e-uploader@example.com')

    const firstCreateResponse = await request.post('/api/tracks', {
      data: createTrackInput(`${suffix}-one`)
    })
    const secondCreateResponse = await request.post('/api/tracks', {
      data: createTrackInput(`${suffix}-two`)
    })
    const firstTrack = await firstCreateResponse.json()
    const secondTrack = await secondCreateResponse.json()

    expect(firstCreateResponse.status()).toBe(200)
    expect(secondCreateResponse.status()).toBe(200)

    await signInAs(request, 'e2e-admin@example.com')

    const bulkApprovalResponse = await request.patch('/api/admin/tracks/bulk-moderation', {
      data: {
        decision: 'approve',
        moderationNotes: 'Approved together by E2E bulk review.',
        trackIds: [firstTrack.id, secondTrack.id]
      }
    })
    const bulkApprovalBody = await bulkApprovalResponse.json()

    expect(bulkApprovalResponse.status()).toBe(200)
    expect(bulkApprovalBody.updatedCount).toBe(2)
    expect(bulkApprovalBody.tracks).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: firstTrack.id,
          moderationStatus: 'APPROVED',
          status: 'PUBLISHED'
        }),
        expect.objectContaining({
          id: secondTrack.id,
          moderationStatus: 'APPROVED',
          status: 'PUBLISHED'
        })
      ])
    )

    const pendingResponse = await request.get('/api/admin/tracks')
    const pendingBody = await pendingResponse.json()

    expect(pendingResponse.status()).toBe(200)
    expect(pendingBody.tracks).not.toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: firstTrack.id
        }),
        expect.objectContaining({
          id: secondTrack.id
        })
      ])
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

    const forbiddenResponse = await request.post(`/api/track-requests/${trackRequest.id}/responses`, {
      data: {
        catalogueType: 'OPERA_EXCERPT',
        saleFormat: 'INDIVIDUAL',
        status: 'ACCEPTED',
        pricePence: 899,
        pricingJustification: 'Customer should not be able to price their own request.'
      }
    })

    expect(forbiddenResponse.status()).toBe(403)

    await signInAs(request, 'e2e-uploader@example.com')

    const invalidPriceResponse = await request.post(`/api/track-requests/${trackRequest.id}/responses`, {
      data: {
        catalogueType: 'SINGLE_TRACK',
        saleFormat: 'INDIVIDUAL',
        pricePence: 999,
        pricingJustification: 'This should be rejected by the guided pricing band.',
        status: 'ACCEPTED'
      }
    })

    expect(invalidPriceResponse.status()).toBe(400)

    const responseResponse = await request.post(`/api/track-requests/${trackRequest.id}/responses`, {
      data: {
        catalogueType: 'OPERA_EXCERPT',
        saleFormat: 'INDIVIDUAL',
        pricePence: 899,
        pricingJustification: 'Prepared to order with specialist cuts.',
        status: 'ACCEPTED'
      }
    })
    const response = await responseResponse.json()

    expect(responseResponse.status()).toBe(200)
    expect(response).toEqual(
      expect.objectContaining({
        id: expect.any(Number),
        requestId: trackRequest.id,
        respondedById: expect.any(String),
        pricePence: 899,
        currency: 'gbp',
        catalogueType: 'OPERA_EXCERPT',
        saleFormat: 'INDIVIDUAL',
        pricingReviewStatus: 'NEEDS_REVIEW',
        pricingJustification: 'Prepared to order with specialist cuts.',
        status: 'ACCEPTED'
      })
    )
  })

  test('uploaders can group approved tracks into a Work or Collection', async ({ page, request }) => {
    const suffix = `works-collection-${Date.now()}`

    await signInAs(request, 'e2e-uploader@example.com')

    const firstCreateResponse = await request.post('/api/tracks', {
      data: createTrackInput(`${suffix}-one`)
    })
    const firstTrack = await firstCreateResponse.json()
    const secondCreateResponse = await request.post('/api/tracks', {
      data: createTrackInput(`${suffix}-two`)
    })
    const secondTrack = await secondCreateResponse.json()

    expect(firstCreateResponse.status()).toBe(200)
    expect(secondCreateResponse.status()).toBe(200)

    const prematureCollectionResponse = await request.post('/api/works-collections', {
      data: {
        catalogueType: 'COLLECTION',
        pricePence: 1499,
        saleFormat: 'BOTH',
        tagSlugs: ['vocal-anthologies'],
        title: `E2E Grouped Work ${suffix}`,
        trackIds: [firstTrack.id, secondTrack.id]
      }
    })

    expect(prematureCollectionResponse.status()).toBe(403)

    await signInAs(request, 'e2e-admin@example.com')

    for (const track of [firstTrack, secondTrack]) {
      const approvalResponse = await request.patch(`/api/admin/tracks/${track.id}`, {
        data: {
          decision: 'approve',
          moderationNotes: 'Approved for Works & Collections E2E.'
        }
      })

      expect(approvalResponse.status()).toBe(200)
    }

    await signInAs(request, 'e2e-uploader@example.com')

    const collectionResponse = await request.post('/api/works-collections', {
      data: {
        catalogueType: 'COLLECTION',
        pricePence: 1499,
        saleFormat: 'BOTH',
        tagSlugs: ['vocal-anthologies'],
        title: `E2E Grouped Work ${suffix}`,
        trackIds: [firstTrack.id, secondTrack.id]
      }
    })
    const collectionBody = await collectionResponse.json()

    expect(collectionResponse.status()).toBe(200)
    expect(collectionBody.collection).toEqual(
      expect.objectContaining({
        catalogueType: 'COLLECTION',
        formattedPrice: '£14.99',
        formattedIndividualTracksTotal: '£7.98',
        pricePence: 1499,
        saleFormat: 'BOTH',
        savingsPence: 0,
        title: `E2E Grouped Work ${suffix}`
      })
    )
    expect(collectionBody.collection.tracks).toEqual([
      expect.objectContaining({
        position: 1,
        trackId: firstTrack.id
      }),
      expect.objectContaining({
        position: 2,
        trackId: secondTrack.id
      })
    ])

    await page.goto('/works-collections')
    await expect(page.getByRole('heading', { name: /Works & Collections/i })).toBeVisible()
    await expect(page.getByRole('link', { name: `E2E Grouped Work ${suffix}` })).toBeVisible()
    await expect(page.getByText('Synthetic Review Fixture').first()).toBeVisible()

    await page.getByRole('link', { name: `E2E Grouped Work ${suffix}` }).click()
    await expect(page).toHaveURL(new RegExp(`/works-collections/${collectionBody.collection.id}$`))
    await expect(page.getByRole('heading', { name: `E2E Grouped Work ${suffix}.` })).toBeVisible()
    await expect(page.getByText(`${collectionBody.collection.tracks.length} tracks in this bundle`)).toBeVisible()
    await expect(page.getByRole('link', { name: `E2E Pending Review ${suffix}-one` })).toBeVisible()
    await expect(page.getByRole('link', { name: `E2E Pending Review ${suffix}-two` })).toBeVisible()

    await page.goto(`/catalogue?q=${encodeURIComponent(`E2E Pending Review ${suffix}-one`)}`)
    const bundleAvailability = page.locator('.cmc-catalogue-track-membership').first()
    await expect(bundleAvailability.locator('summary')).toContainText('Available in 1 bundle')
    await expect(bundleAvailability.locator('summary')).not.toContainText('Best value:')
    await bundleAvailability.locator('summary').click()
    await expect(bundleAvailability.getByText('This track is available in this bundle.')).toBeVisible()
    await expect(
      bundleAvailability.getByRole('link', { name: new RegExp(`E2E Grouped Work ${suffix}`) })
    ).toHaveAttribute('href', `/works-collections/${collectionBody.collection.id}`)

    const listResponse = await request.get('/api/works-collections')
    const listBody = await listResponse.json()

    expect(listResponse.status()).toBe(200)
    expect(listBody.collections).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: collectionBody.collection.id,
          title: `E2E Grouped Work ${suffix}`
        })
      ])
    )

    await signInPageAs(page, 'e2e-admin@example.com')
    await page.goto('/admin')
    await page.getByRole('tab', { name: /Works & Collections/i }).click()
    const worksAdminPanel = page.locator('.tab-pane.active')
    await worksAdminPanel.getByLabel('Search Works & Collections').fill(`E2E Grouped Work ${suffix}`)
    await worksAdminPanel.getByRole('button', { name: /Live/i }).click()
    await worksAdminPanel.getByLabel('Sort').selectOption('title')
    await expect(worksAdminPanel.getByRole('row').filter({
      hasText: `E2E Grouped Work ${suffix}`
    })).toBeVisible()

    await signInPageAs(page, 'e2e-uploader@example.com')
    await page.goto('/upload/manage')
    await expect(page.getByText(`Part of E2E Grouped Work ${suffix}`).first()).toBeVisible()
    await expect(page.getByText('Individual total £7.98').first()).toBeVisible()
    const createdCollectionsPanel = page.locator('.cmc-profile-works-list')
    await createdCollectionsPanel.getByLabel('Search Works and Collections').fill(`E2E Grouped Work ${suffix}`)
    await createdCollectionsPanel.getByRole('button', { name: /Live/i }).click()
    await createdCollectionsPanel.getByLabel('Sort').selectOption('title')
    await expect(createdCollectionsPanel.getByRole('listitem').filter({
      hasText: `E2E Grouped Work ${suffix}`
    })).toBeVisible()
    const bulkMetadataPanel = page.locator('.cmc-upload-management-bulk-panel')
    await page.getByLabel(`Select E2E Pending Review ${suffix}-one`).check()
    await page.getByLabel(`Select E2E Pending Review ${suffix}-two`).check()
    await bulkMetadataPanel.getByLabel('Composer').fill('Bulk Updated Composer')
    await bulkMetadataPanel.getByLabel('Key').fill('F major')
    await bulkMetadataPanel.getByLabel('Instrumentation').fill('Bulk piano reduction')
    await bulkMetadataPanel.getByRole('button', { name: 'Apply shared metadata' }).click()
    await expect(page.getByText('2 uploaded tracks updated with shared metadata.')).toBeVisible()
    await expect(page.getByText('Bulk Updated Composer · F major · Bulk piano reduction').first()).toBeVisible()
    const collectionRow = page.getByRole('listitem').filter({
      hasText: `E2E Grouped Work ${suffix}`
    })

    await expect(collectionRow.getByRole('link', { name: 'View' })).toHaveAttribute('href', `/upload/manage/works/${collectionBody.collection.id}`)
    await collectionRow.getByRole('link', { name: 'View' }).click()
    await expect(page).toHaveURL(new RegExp(`/upload/manage/works/${collectionBody.collection.id}$`))
    await expect(page.getByRole('heading', { name: `E2E Grouped Work ${suffix}.` })).toBeVisible()
    await expect(page.getByText('Individual track total: £7.98')).toBeVisible()
    await page.getByRole('link', { name: 'Back to management' }).click()

    await collectionRow.getByRole('button', { name: `Edit E2E Grouped Work ${suffix}` }).click()
    await expect(page.getByText('Editing an existing Work or Collection.')).toBeVisible()
    await expect(page.getByText('This is £7.01 above the individual-track total.')).toBeVisible()
    const worksCollectionForm = page.locator('.cmc-profile-works-form')
    await worksCollectionForm.getByLabel('Title').fill(`E2E UI Edited Grouped Work ${suffix}`)
    await worksCollectionForm.getByRole('button', { name: 'Save Work or Collection' }).click()
    await expect(page.getByText('Work or Collection updated.')).toBeVisible()
    await expect(page.getByText(`E2E UI Edited Grouped Work ${suffix}`)).toBeVisible()

    const updateResponse = await request.patch(`/api/works-collections/${collectionBody.collection.id}`, {
      data: {
        catalogueType: 'COLLECTION',
        pricePence: 1999,
        saleFormat: 'BOTH',
        tagSlugs: ['vocal-anthologies'],
        title: `E2E Updated Grouped Work ${suffix}`,
        trackIds: [secondTrack.id, firstTrack.id]
      }
    })
    const updateBody = await updateResponse.json()

    expect(updateResponse.status()).toBe(200)
    expect(updateBody.collection).toEqual(
      expect.objectContaining({
        id: collectionBody.collection.id,
        formattedPrice: '£19.99',
        title: `E2E Updated Grouped Work ${suffix}`
      })
    )
    expect(updateBody.collection.tracks).toEqual([
      expect.objectContaining({
        position: 1,
        trackId: secondTrack.id
      }),
      expect.objectContaining({
        position: 2,
        trackId: firstTrack.id
      })
    ])

    const deleteResponse = await request.delete(`/api/works-collections/${collectionBody.collection.id}`)
    const deleteBody = await deleteResponse.json()

    expect(deleteResponse.status()).toBe(200)
    expect(deleteBody.deleted).toBe(true)

    const finalListResponse = await request.get('/api/works-collections')
    const finalListBody = await finalListResponse.json()

    expect(finalListResponse.status()).toBe(200)
    expect(finalListBody.collections).not.toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: collectionBody.collection.id
        })
      ])
    )
  })

  test('uploaders can repair a Work or Collection after a dependent track is rejected', async ({ page, request }) => {
    const suffix = `blocked-release-repair-${Date.now()}`

    await signInAs(request, 'e2e-uploader@example.com')

    const firstCreateResponse = await request.post('/api/tracks', {
      data: createTrackInput(`${suffix}-one`)
    })
    const firstTrack = await firstCreateResponse.json()
    const secondCreateResponse = await request.post('/api/tracks', {
      data: createTrackInput(`${suffix}-two`)
    })
    const secondTrack = await secondCreateResponse.json()
    const replacementCreateResponse = await request.post('/api/tracks', {
      data: createTrackInput(`${suffix}-replacement`)
    })
    const replacementTrack = await replacementCreateResponse.json()

    expect(firstCreateResponse.status()).toBe(200)
    expect(secondCreateResponse.status()).toBe(200)
    expect(replacementCreateResponse.status()).toBe(200)

    await signInAs(request, 'e2e-admin@example.com')

    for (const track of [firstTrack, secondTrack, replacementTrack]) {
      const approvalResponse = await request.patch(`/api/admin/tracks/${track.id}`, {
        data: {
          decision: 'approve',
          moderationNotes: 'Approved for blocked release repair E2E.'
        }
      })

      expect(approvalResponse.status()).toBe(200)
    }

    await signInAs(request, 'e2e-uploader@example.com')

    const releaseTitle = `E2E Blocked Release Repair ${suffix}`
    const collectionResponse = await request.post('/api/works-collections', {
      data: {
        catalogueType: 'COLLECTION',
        pricePence: 1499,
        saleFormat: 'BOTH',
        tagSlugs: ['vocal-anthologies'],
        title: releaseTitle,
        trackItems: [
          {
            movementNo: 'I',
            position: 1,
            titleInWork: 'Rejected dependency cut',
            trackId: firstTrack.id
          },
          {
            movementNo: 'II',
            position: 2,
            titleInWork: 'Stable dependency cut',
            trackId: secondTrack.id
          }
        ]
      }
    })
    const collectionBody = await collectionResponse.json()

    expect(collectionResponse.status()).toBe(200)
    expect(collectionBody.collection.status).toBe('PUBLISHED')

    await signInAs(request, 'e2e-admin@example.com')

    const rejectionResponse = await request.patch(`/api/admin/tracks/${firstTrack.id}`, {
      data: {
        decision: 'reject',
        moderationNotes: 'Rejected to exercise blocked release repair.'
      }
    })
    const rejectionBody = await rejectionResponse.json()

    expect(rejectionResponse.status()).toBe(200)
    expect(rejectionBody.track.worksCollections).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: collectionBody.collection.id,
          status: 'NEEDS_CHANGES'
        })
      ])
    )

    await signInAs(request, 'e2e-uploader@example.com')
    const blockedListResponse = await request.get('/api/works-collections')
    const blockedListBody = await blockedListResponse.json()

    expect(blockedListResponse.status()).toBe(200)
    expect(blockedListBody.collections).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: collectionBody.collection.id,
          status: 'NEEDS_CHANGES',
          tracks: expect.arrayContaining([
            expect.objectContaining({
              moderationStatus: 'REJECTED',
              trackId: firstTrack.id
            })
          ])
        })
      ])
    )

    await signInPageAs(page, 'e2e-uploader@example.com')
    await page.goto('/upload/manage')
    const createdCollectionsPanel = page.locator('.cmc-profile-works-list')
    await createdCollectionsPanel.getByLabel('Search Works and Collections').fill(releaseTitle)
    await createdCollectionsPanel.getByRole('button', { name: /Blocked dependency/i }).click()
    const blockedCollectionRow = createdCollectionsPanel.getByRole('listitem').filter({
      hasText: releaseTitle
    })

    await expect(blockedCollectionRow).toBeVisible()
    await expect(blockedCollectionRow.getByText(/Blocked dependency: Rejected dependency cut \(Rejected\)/)).toBeVisible()

    await blockedCollectionRow.getByRole('link', { name: 'View' }).click()
    await expect(page).toHaveURL(new RegExp(`/upload/manage/works/${collectionBody.collection.id}$`))
    const recoveryGuidance = page.getByRole('region', { name: 'Blocked dependency recovery guidance' })
    await expect(recoveryGuidance).toBeVisible()
    await expect(page.getByText('Repair this release before it can return to the catalogue')).toBeVisible()
    await expect(recoveryGuidance.getByText('Rejected dependency cut')).toBeVisible()
    await page.getByRole('link', { name: 'Back to management' }).click()

    await createdCollectionsPanel.getByLabel('Search Works and Collections').fill(releaseTitle)
    await blockedCollectionRow.getByRole('button', { name: `Edit ${releaseTitle}` }).click()
    await expect(page.getByText('Editing an existing Work or Collection.')).toBeVisible()
    const worksCollectionForm = page.locator('.cmc-profile-works-form')
    await page.getByRole('button', { name: 'Remove Rejected dependency cut from release' }).click()
    await worksCollectionForm
      .getByRole('checkbox', { name: new RegExp(`^E2E Pending Review ${suffix}-replacement\\b`) })
      .check()
    await worksCollectionForm.getByRole('button', { name: 'Save Work or Collection' }).click()
    await expect(page.getByText('Work or Collection updated.')).toBeVisible()

    const repairedListResponse = await request.get('/api/works-collections')
    const repairedListBody = await repairedListResponse.json()
    const repairedCollection = repairedListBody.collections.find(collection => collection.id === collectionBody.collection.id)

    expect(repairedListResponse.status()).toBe(200)
    expect(repairedCollection).toEqual(
      expect.objectContaining({
        status: 'PUBLISHED'
      })
    )
    expect(repairedCollection.tracks).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          trackId: secondTrack.id
        }),
        expect.objectContaining({
          trackId: replacementTrack.id
        })
      ])
    )
    expect(repairedCollection.tracks).not.toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          trackId: firstTrack.id
        })
      ])
    )

    const publicReleaseResponse = await page.goto(`/works-collections/${collectionBody.collection.id}`)

    expect(publicReleaseResponse.status()).toBe(200)
    await expect(page.getByRole('heading', { name: `${releaseTitle}.` })).toBeVisible()
    await expect(page.getByRole('link', { name: 'Stable dependency cut' })).toBeVisible()
    await expect(page.getByRole('link', { name: `E2E Pending Review ${suffix}-replacement` })).toBeVisible()
  })

  test('admins can review Works and Collections pricing with release contents visible', async ({ page, request }) => {
    const suffix = `release-pricing-review-${Date.now()}`

    await signInAs(request, 'e2e-uploader@example.com')

    const firstCreateResponse = await request.post('/api/tracks', {
      data: createTrackInput(`${suffix}-one`)
    })
    const firstTrack = await firstCreateResponse.json()
    const secondCreateResponse = await request.post('/api/tracks', {
      data: createTrackInput(`${suffix}-two`)
    })
    const secondTrack = await secondCreateResponse.json()

    expect(firstCreateResponse.status()).toBe(200)
    expect(secondCreateResponse.status()).toBe(200)

    await signInAs(request, 'e2e-admin@example.com')

    for (const track of [firstTrack, secondTrack]) {
      const approvalResponse = await request.patch(`/api/admin/tracks/${track.id}`, {
        data: {
          decision: 'approve',
          moderationNotes: 'Approved for release pricing review E2E.'
        }
      })

      expect(approvalResponse.status()).toBe(200)
    }

    await signInAs(request, 'e2e-uploader@example.com')

    const releaseTitle = `E2E Release Pricing Review ${suffix}`
    const collectionResponse = await request.post('/api/works-collections', {
      data: {
        catalogueType: 'COLLECTION',
        pricePence: 2999,
        pricingJustification: 'Large specialist release for admin review.',
        saleFormat: 'BOTH',
        tagSlugs: ['vocal-anthologies'],
        title: releaseTitle,
        trackItems: [
          {
            movementNo: 'I',
            position: 1,
            titleInWork: 'Opening rehearsal cut',
            trackId: firstTrack.id
          },
          {
            movementNo: 'II',
            position: 2,
            titleInWork: 'Second rehearsal cut',
            trackId: secondTrack.id
          }
        ]
      }
    })
    const collectionBody = await collectionResponse.json()

    expect(collectionResponse.status()).toBe(200)
    expect(collectionBody.collection.pricingReviewStatus).toBe('NEEDS_REVIEW')
    expect(collectionBody.collection.status).toBe('SUBMITTED')

    const hiddenReleaseResponse = await page.goto(`/works-collections/${collectionBody.collection.id}`)

    expect(hiddenReleaseResponse.status()).toBe(404)
    await expect(page.getByText(/404/i)).toBeVisible()

    await signInAs(request, 'e2e-admin@example.com')

    const pricingReviewResponse = await request.get('/api/admin/pricing-reviews')
    const pricingReviewBody = await pricingReviewResponse.json()

    expect(pricingReviewResponse.status()).toBe(200)
    expect(pricingReviewBody.releases).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: collectionBody.collection.id,
          title: releaseTitle,
          tracks: [
            expect.objectContaining({
              movementNo: 'I',
              position: 1,
              title: 'Opening rehearsal cut',
              trackId: firstTrack.id
            }),
            expect.objectContaining({
              movementNo: 'II',
              position: 2,
              title: 'Second rehearsal cut',
              trackId: secondTrack.id
            })
          ]
        })
      ])
    )

    await signInPageAs(page, 'e2e-admin@example.com')
    await page.goto('/admin')
    await page.getByRole('tab', { name: /Pricing/i }).click()

    const releaseRow = page.getByRole('row').filter({
      hasText: releaseTitle
    })

    await expect(releaseRow.getByText('1. I · Opening rehearsal cut')).toBeVisible()
    await expect(releaseRow.getByText('2. II · Second rehearsal cut')).toBeVisible()
    await expect(releaseRow.getByText('£29.99')).toBeVisible()
    await releaseRow.getByRole('button', { name: 'Approve' }).click()
    await expect(releaseRow).toHaveCount(0)

    await page.goto(`/works-collections/${collectionBody.collection.id}`)
    await expect(page.getByRole('heading', { name: `${releaseTitle}.` })).toBeVisible()
    await expect(page.getByRole('link', { name: 'Opening rehearsal cut' })).toBeVisible()
  })

  test('uploaders can respond to track requests from the track requests tab', async ({ page }) => {
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
    await requestCard.getByLabel('Track type').selectOption('OPERA_EXCERPT')
    await requestCard.getByLabel('Request price for UI request pricing fixture').getByLabel('£8.99').check()
    await requestCard.getByLabel('Pricing note (optional)').fill('Specialist preparation for a requested cut.')
    await requestCard.getByRole('button', { name: 'Save Response' }).click()

    await expect(page.getByRole('status').filter({ hasText: 'Response saved.' })).toBeVisible()
    await expect(requestCard.locator('.cmc-track-request-pricing-summary').getByText('£8.99')).toBeVisible()
    await expect(requestCard.getByText('Admin review needed')).toBeVisible()
  })

  test('admins can approve pending request pricing reviews', async ({ page }) => {
    const suffix = `admin-pricing-review-${Date.now()}`

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
        moderationNotes: 'Approved for admin pricing review E2E.'
      }
    })

    expect(approvalResponse.status()).toBe(200)

    await signInPageAs(page, 'e2e-customer@example.com')

    const requestTitle = `Admin pricing review fixture ${suffix}`
    const trackRequestResponse = await page.request.post('/api/track-requests', {
      data: {
        trackId: createdTrack.id,
        title: requestTitle,
        notes: 'Please prepare an admin-reviewed specialist cut.'
      }
    })
    const trackRequest = await trackRequestResponse.json()

    expect(trackRequestResponse.status()).toBe(200)

    await signInPageAs(page, 'e2e-uploader@example.com')

    const responseResponse = await page.request.post(`/api/track-requests/${trackRequest.id}/responses`, {
      data: {
        catalogueType: 'OPERA_EXCERPT',
        saleFormat: 'INDIVIDUAL',
        pricePence: 899,
        pricingJustification: 'Specialist preparation for admin review.',
        status: 'ACCEPTED'
      }
    })
    const requestResponse = await responseResponse.json()

    expect(responseResponse.status()).toBe(200)
    expect(requestResponse.pricingReviewStatus).toBe('NEEDS_REVIEW')

    await signInPageAs(page, 'e2e-admin@example.com')
    await page.goto('/admin')

    await page.getByRole('tab', { name: /Pricing/i }).click()

    const proposalRow = page.getByRole('row').filter({
      hasText: requestTitle
    })

    await expect(proposalRow).toBeVisible()
    await expect(proposalRow.getByText('£8.99')).toBeVisible()
    await proposalRow.getByRole('button', { name: 'Approve' }).click()
    await expect(proposalRow).toHaveCount(0)
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

  test('admins can bulk approve selected pending tracks in the browser', async ({ page }) => {
    const suffix = `ui-bulk-${Date.now()}`

    await signInPageAs(page, 'e2e-uploader@example.com')

    const firstCreateResponse = await page.request.post('/api/tracks', {
      data: createTrackInput(`${suffix}-one`)
    })
    const secondCreateResponse = await page.request.post('/api/tracks', {
      data: createTrackInput(`${suffix}-two`)
    })
    const firstTrack = await firstCreateResponse.json()
    const secondTrack = await secondCreateResponse.json()

    expect(firstCreateResponse.status()).toBe(200)
    expect(secondCreateResponse.status()).toBe(200)

    await signInPageAs(page, 'e2e-admin@example.com')
    await page.goto('/admin')

    await page.getByRole('tab', { name: /Track Review/i }).click()
    const trackReviewPanel = page.locator('.tab-pane.active')

    const firstReviewRow = trackReviewPanel.getByRole('row').filter({
      hasText: firstTrack.title
    })
    const secondReviewRow = trackReviewPanel.getByRole('row').filter({
      hasText: secondTrack.title
    })

    await expect(firstReviewRow).toBeVisible()
    await expect(secondReviewRow).toBeVisible()

    await firstReviewRow.getByLabel(`Select ${firstTrack.title} for bulk review`).check()
    await secondReviewRow.getByLabel(`Select ${secondTrack.title} for bulk review`).check()
    await expect(trackReviewPanel.getByText('2 selected for this review action.')).toBeVisible()

    await trackReviewPanel.getByPlaceholder('Optional moderation note').fill('Approved together from admin browser flow.')
    await trackReviewPanel.getByRole('button', { name: 'Apply' }).click()

    await expect(firstReviewRow).toHaveCount(0)
    await expect(secondReviewRow).toHaveCount(0)

    await expect.poll(async () => {
      const [firstPublicResponse, secondPublicResponse] = await Promise.all([
        page.request.get(`/api/tracks/${firstTrack.id}`),
        page.request.get(`/api/tracks/${secondTrack.id}`)
      ])

      if (!firstPublicResponse.ok() || !secondPublicResponse.ok()) {
        return []
      }

      const [firstPublicTrack, secondPublicTrack] = await Promise.all([
        firstPublicResponse.json(),
        secondPublicResponse.json()
      ])

      return [firstPublicTrack, secondPublicTrack].map(track => ({
        id: track.id,
        status: track.status,
        moderationStatus: track.moderationStatus
      }))
    }).toEqual([
      {
        id: firstTrack.id,
        status: 'PUBLISHED',
        moderationStatus: 'APPROVED'
      },
      {
        id: secondTrack.id,
        status: 'PUBLISHED',
        moderationStatus: 'APPROVED'
      }
    ])
  })
})
