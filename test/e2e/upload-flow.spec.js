const { expect, test } = require('@playwright/test')
const { signInPageAs } = require('./helpers/e2e-session')

const createTinyMp3 = (durationSeconds = 18) => {
  const sampleRate = 44100
  const numSamples = durationSeconds * sampleRate
  const dataSize = numSamples * 2
  const buffer = Buffer.alloc(44 + dataSize)

  buffer.write('RIFF', 0)
  buffer.writeUInt32LE(36 + dataSize, 4)
  buffer.write('WAVE', 8)
  buffer.write('fmt ', 12)
  buffer.writeUInt32LE(16, 16)
  buffer.writeUInt16LE(1, 20)
  buffer.writeUInt16LE(1, 22)
  buffer.writeUInt32LE(sampleRate, 24)
  buffer.writeUInt32LE(sampleRate * 2, 28)
  buffer.writeUInt16LE(2, 32)
  buffer.writeUInt16LE(16, 34)
  buffer.write('data', 36)
  buffer.writeUInt32LE(dataSize, 40)

  for (let index = 0; index < numSamples; index += 1) {
    const time = index / sampleRate
    const sample = Math.round(Math.sin(2 * Math.PI * 220 * time) * 0.55 * 32767)
    buffer.writeInt16LE(sample, 44 + index * 2)
  }

  return buffer
}

test.describe('upload browser flow', () => {
  test('approved uploaders start with an audio-only upload stage', async ({ page }) => {
    await signInPageAs(page, 'e2e-uploader@example.com')
    await page.goto('/upload')

    await expect(page.getByRole('heading', { name: 'Share a Track.' })).toBeVisible()
    await page.waitForLoadState('networkidle')
    await expect(page.getByRole('radio', { name: /Single track/i })).toHaveAttribute('aria-checked', 'true')
    await expect(page.getByRole('radio', { name: /Batch upload/i })).toHaveAttribute('aria-checked', 'false')
    await expect(page.getByLabel('Select a File')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Upload audio' })).toBeEnabled()
    await expect(page.getByRole('heading', { name: 'Choose the buyer preview' })).toHaveCount(0)
    await expect(page.getByRole('textbox', { name: 'Title' })).toHaveCount(0)
    await expect(page.getByRole('button', { name: 'Submit' })).toHaveCount(0)
    await expect(page.getByRole('dialog', { name: 'Track submitted for review' })).toHaveCount(0)
  })

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

    await expect(page.getByRole('heading', { name: 'Share a Track.' })).toBeVisible()
    await page.waitForLoadState('networkidle')

    await page.locator('input[type="file"]').setInputFiles({
      name: `browser-upload-${suffix}.mp3`,
      mimeType: 'audio/mpeg',
      buffer: createTinyMp3()
    })
    await expect(page.getByRole('button', { name: 'Upload audio' })).toBeEnabled()
    await page.getByRole('button', { name: 'Upload audio' }).click()
    await page.getByRole('button', { name: 'Confirm preview' }).click()
    await page.getByRole('textbox', { name: 'Title' }).fill(title)
    await page.getByRole('textbox', { name: 'Composer' }).fill('Synthetic Upload Fixture')
    await page.getByRole('textbox', { name: 'Key' }).fill('E minor')
    await page.getByRole('textbox', { name: 'Instrumentation' }).fill('Piano')
    await page.getByRole('textbox', { name: 'Additional Information' }).fill('Synthetic browser upload test.')
    await page.getByRole('button', { name: 'Confirm details' }).click()
    await page.getByLabel('£3.99').check()
    await page.getByRole('button', { name: 'Confirm price' }).click()
    await page.getByLabel('I have read and agree to the upload rights confirmation').check()

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

  test('approved uploaders can attach a submitted track to an upload batch', async ({ page }) => {
    const suffix = Date.now()
    const title = `E2E Batch Upload ${suffix}`
    const batchLabel = `E2E Batch ${suffix}`

    await page.route(/https:\/\/.*amazonaws\.com\/.*/, async route => {
      if (route.request().method() === 'PUT') {
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
    await page.waitForLoadState('networkidle')

    await page.getByRole('radio', { name: /Batch upload/i }).click()
    await expect(page.getByRole('radio', { name: /Batch upload/i })).toHaveAttribute('aria-checked', 'true')
    await page.getByLabel('Batch label').fill(batchLabel)

    await page.locator('input[type="file"]').setInputFiles([
      {
        name: `batch-upload-${suffix}-one.mp3`,
        mimeType: 'audio/mpeg',
        buffer: createTinyMp3()
      },
      {
        name: `batch-upload-${suffix}-two.mp3`,
        mimeType: 'audio/mpeg',
        buffer: createTinyMp3()
      }
    ])
    const selectedBatchFiles = page.getByLabel('Selected batch files')

    await expect(selectedBatchFiles).toContainText('2 files selected')
    await expect(selectedBatchFiles.getByText(`batch-upload-${suffix}-one.mp3`)).toBeVisible()
    await expect(selectedBatchFiles.getByText(`batch-upload-${suffix}-two.mp3`)).toBeVisible()
    await page.getByRole('button', { name: 'Upload audio' }).click()
    await page.getByRole('button', { name: 'Confirm preview' }).click()
    await page.getByRole('textbox', { name: 'Title' }).fill(title)
    await page.getByRole('textbox', { name: 'Composer' }).fill('Synthetic Batch Fixture')
    await page.getByRole('textbox', { name: 'Key' }).fill('F major')
    await page.getByRole('textbox', { name: 'Instrumentation' }).fill('Piano')
    await page.getByRole('textbox', { name: 'Additional Information' }).fill('Synthetic browser batch upload test.')
    await page.getByRole('button', { name: 'Confirm details' }).click()
    await page.getByLabel('£3.99').check()
    await page.getByRole('button', { name: 'Confirm price' }).click()
    await page.getByLabel('I have read and agree to the upload rights confirmation').check()
    await page.getByRole('button', { name: 'Submit' }).click()

    const reviewDialog = page.getByRole('dialog', {
      name: 'Track submitted for review'
    })

    await expect(reviewDialog).toBeVisible()
    await expect(reviewDialog.getByText(batchLabel)).toBeVisible()
    await expect(reviewDialog.getByText(/next queued file/i)).toBeVisible()
    await expect(reviewDialog.getByRole('button', { name: 'Add Another to Batch' })).toBeVisible()
    await expect(reviewDialog.getByRole('link', { name: 'Manage Uploads' })).toHaveAttribute('href', '/upload/manage')
    await reviewDialog.getByRole('button', { name: 'Add Another to Batch' }).click()
    await expect(page.getByRole('dialog', { name: 'Track submitted for review' })).toHaveCount(0)
    await expect(selectedBatchFiles.getByText(`batch-upload-${suffix}-two.mp3`)).toBeVisible()
    await expect(page.getByRole('button', { name: 'Upload audio' })).toBeEnabled()

    const batchResponse = await page.request.get('/api/upload-batches')
    const batchBody = await batchResponse.json()

    expect(batchResponse.status()).toBe(200)
    expect(batchBody.batches).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          label: batchLabel,
          summary: expect.objectContaining({
            totalTracks: 1
          }),
          tracks: expect.arrayContaining([
            expect.objectContaining({
              title,
              composer: 'Synthetic Batch Fixture'
            })
          ])
        })
      ])
    )

    const adminSessionResponse = await page.request.post('/api/e2e/session', {
      data: {
        email: 'e2e-admin@example.com'
      }
    })

    expect(adminSessionResponse.status()).toBe(200)

    const adminTracksResponse = await page.request.get('/api/admin/tracks')
    const adminTracksBody = await adminTracksResponse.json()

    expect(adminTracksResponse.status()).toBe(200)
    expect(adminTracksBody.tracks).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          title,
          uploadBatch: expect.objectContaining({
            label: batchLabel,
            trackCount: 1
          })
        })
      ])
    )

    await page.goto('/admin')
    await page.getByRole('tab', { name: /Track Review/i }).click()
    const adminTrackRow = page.getByRole('row').filter({
      hasText: title
    })

    await expect(adminTrackRow.getByText(`Import batch: ${batchLabel}`)).toBeVisible()
  })

  test('batch upload selection is capped at 50 files', async ({ page }) => {
    const suffix = Date.now()
    const files = Array.from({ length: 51 }, (_, index) => ({
      name: `batch-limit-${suffix}-${String(index + 1).padStart(2, '0')}.mp3`,
      mimeType: 'audio/mpeg',
      buffer: createTinyMp3(1)
    }))

    await signInPageAs(page, 'e2e-uploader@example.com')
    await page.goto('/upload')
    await page.waitForLoadState('networkidle')

    await page.getByRole('radio', { name: /Batch upload/i }).click()
    await page.locator('input[type="file"]').setInputFiles(files)

    const selectedBatchFiles = page.getByLabel('Selected batch files')

    await expect(selectedBatchFiles).toContainText('50 files selected')
    await expect(selectedBatchFiles).toContainText('Maximum 50 per batch')
    await expect(selectedBatchFiles.getByText(`batch-limit-${suffix}-50.mp3`)).toBeVisible()
    await expect(selectedBatchFiles.getByText(`batch-limit-${suffix}-51.mp3`)).toHaveCount(0)
  })

  test('approved uploaders can resume an existing upload batch', async ({ page }) => {
    const suffix = Date.now()
    const batchLabel = `E2E Resumable Batch ${suffix}`

    await signInPageAs(page, 'e2e-uploader@example.com')
    const createResponse = await page.request.post('/api/upload-batches', {
      data: {
        label: batchLabel
      }
    })
    const createBody = await createResponse.json()

    expect(createResponse.status()).toBe(200)

    await page.goto('/upload/manage')
    const batchRow = page.getByRole('listitem').filter({
      hasText: batchLabel
    })
    await expect(batchRow.getByText('0/50 tracks')).toBeVisible()
    await expect(batchRow.getByText('50 slots remaining')).toBeVisible()

    await page.goto(`/upload/manage/${createBody.batch.id}`)
    await page.waitForLoadState('networkidle')

    await expect(page.getByRole('heading', { name: `${batchLabel}.` })).toBeVisible()
    await expect(page.getByRole('heading', { name: '0/50 tracks used' })).toBeVisible()
    await expect(page.getByText('50 upload slots remaining in this batch.')).toBeVisible()
    await expect(page.getByRole('link', { name: 'Back to management' })).toHaveAttribute('href', '/upload/manage')
    await expect(page.getByRole('link', { name: 'Continue batch' })).toHaveAttribute('href', `/upload?batchId=${createBody.batch.id}`)

    await page.goto(`/upload?batchId=${createBody.batch.id}`)
    await page.waitForLoadState('networkidle')

    await expect(page.getByRole('radio', { name: /Batch upload/i })).toHaveAttribute('aria-checked', 'true')
    await expect(page.getByLabel('Batch label')).toHaveValue(batchLabel)
    await expect(page.getByText('New tracks will be attached to this batch.')).toBeVisible()
  })

  test('approved uploaders can update descriptive metadata for approved tracks', async ({ page }) => {
    const suffix = Date.now()
    const newTitle = `E2E Managed Metadata ${suffix}`

    await signInPageAs(page, 'e2e-uploader@example.com')
    await page.goto('/upload/manage')
    await page.waitForLoadState('networkidle')

    await expect(page.getByRole('heading', { name: 'Manage Track Metadata' })).toBeVisible()

    const trackRow = page.getByRole('listitem').filter({
      hasText: 'E2E Catalogue Navigation Study'
    })

    await expect(trackRow).toBeVisible()
    await trackRow.getByRole('button', { name: 'Edit metadata' }).click()
    await trackRow.getByLabel('Title').fill(newTitle)
    await trackRow.getByLabel('Composer').fill('Synthetic Managed Composer')
    await trackRow.getByLabel('Key').fill('F major')
    await trackRow.getByLabel('Instrumentation').fill('Voice and piano')
    await trackRow.getByLabel('Download filename').fill(`managed-metadata-${suffix}.wav`)
    await trackRow.getByLabel('Additional notes').fill('Updated through the uploader management console.')
    await trackRow.getByRole('button', { name: 'Save metadata' }).click()

    await expect(page.getByText(`${newTitle} updated.`)).toBeVisible()
    await expect(page.getByRole('listitem').filter({ hasText: newTitle })).toContainText('Synthetic Managed Composer')
    await expect(page.getByRole('listitem').filter({ hasText: newTitle })).toContainText('F major')

    await page.getByLabel('Search uploaded tracks').fill(`managed-metadata-${suffix}`)
    await expect(page.getByRole('listitem').filter({ hasText: newTitle })).toBeVisible()
  })

  test('approved uploaders can search filter and sort large uploaded libraries', async ({ page }) => {
    await signInPageAs(page, 'e2e-uploader@example.com')
    await page.goto('/upload/manage')
    await page.waitForLoadState('networkidle')

    const uploadedTracksSection = page.locator('.cmc-upload-management-tracks')

    await uploadedTracksSection.getByLabel('Search uploaded tracks').fill('E2E Catalogue')
    await uploadedTracksSection.getByLabel('Sort').selectOption('title')
    await uploadedTracksSection.getByRole('button', { name: /Complete/i }).click()

    const filteredRows = uploadedTracksSection.locator('.cmc-upload-management-track-list > li')

    await expect(filteredRows.first()).toContainText('E2E Catalogue')
    expect(await filteredRows.count()).toBeGreaterThan(10)
    await expect(uploadedTracksSection.getByText(/of \d+$/).first()).toBeVisible()
  })

  test('accepted requests show fulfilment feedback after upload submission', async ({ page }) => {
    const suffix = Date.now()
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

    const createTrackResponse = await page.request.post('/api/tracks', {
      data: {
        title: `E2E Request Source ${suffix}`,
        composer: 'Synthetic Upload Fixture',
        key: 'C major',
        instrumentation: 'Piano',
        newFileName: `e2e-fixtures/request-source-${suffix}.mp3`,
        previewStart: 0,
        previewEnd: 15,
        durationSeconds: 30,
        sourceContentType: 'audio/mpeg',
        additionalInfo: 'Synthetic source track for request fulfilment upload.',
        price: 3.99,
        pricePence: 399,
        currency: 'gbp',
        formattedPrice: '£3.99',
        downloadName: `request-source-${suffix}.mp3`,
        downloadCount: 0
      }
    })
    const requestedTrack = await createTrackResponse.json()

    expect(createTrackResponse.status()).toBe(200)

    await signInPageAs(page, 'e2e-admin@example.com')

    const approvalResponse = await page.request.patch(`/api/admin/tracks/${requestedTrack.id}`, {
      data: {
        decision: 'approve',
        moderationNotes: 'Approved for fulfilment upload E2E.'
      }
    })

    expect(approvalResponse.status()).toBe(200)

    await signInPageAs(page, 'e2e-customer@example.com')

    const requestResponse = await page.request.post('/api/track-requests', {
      data: {
        trackId: requestedTrack.id,
        title: `E2E Upload Fulfilment ${suffix}`,
        notes: 'Please prepare a short requested fulfilment upload.'
      }
    })
    const trackRequest = await requestResponse.json()

    expect(requestResponse.status()).toBe(200)

    await signInPageAs(page, 'e2e-uploader@example.com')

    const acceptResponse = await page.request.patch(`/api/track-requests/${trackRequest.id}`, {
      data: {
        status: 'ACCEPTED'
      }
    })

    expect(acceptResponse.status()).toBe(200)

    await page.goto(`/upload?fulfilledRequestId=${trackRequest.id}`)
    await expect(page.getByText(`This upload will be attached to request #${trackRequest.id} after submission.`)).toBeVisible()

    await page.locator('input[type="file"]').setInputFiles({
      name: `fulfilled-request-${suffix}.mp3`,
      mimeType: 'audio/mpeg',
      buffer: createTinyMp3()
    })
    await page.getByRole('button', { name: 'Upload audio' }).click()
    await page.getByRole('button', { name: 'Confirm preview' }).click()
    await page.getByRole('textbox', { name: 'Title' }).fill(`E2E Fulfilment Upload ${suffix}`)
    await page.getByRole('textbox', { name: 'Composer' }).fill('Synthetic Upload Fixture')
    await page.getByRole('textbox', { name: 'Key' }).fill('G major')
    await page.getByRole('textbox', { name: 'Instrumentation' }).fill('Piano')
    await page.getByRole('textbox', { name: 'Additional Information' }).fill('Synthetic request fulfilment upload.')
    await page.getByRole('button', { name: 'Confirm details' }).click()
    await page.getByLabel('£3.99').check()
    await page.getByRole('button', { name: 'Confirm price' }).click()
    await page.getByLabel('I have read and agree to the upload rights confirmation').check()
    await page.getByRole('button', { name: 'Submit' }).click()

    const reviewDialog = page.getByRole('dialog', {
      name: 'Track submitted for review'
    })

    await expect(reviewDialog).toBeVisible()
    await expect(reviewDialog.getByText(`linked to request #${trackRequest.id}`)).toBeVisible()
    expect(interceptedUpload).toBe(true)

    await page.goto(`/catalogue/${requestedTrack.id}?tab=requests&requestId=${trackRequest.id}`)

    const requestCard = page.locator(`#request-${trackRequest.id}`)

    await expect(requestCard.getByText('Fulfilment uploaded:')).toBeVisible()
    await expect(requestCard.getByText(`E2E Fulfilment Upload ${suffix}`)).toBeVisible()
    await expect(requestCard.getByText('(waiting for review)')).toBeVisible()
  })
})
