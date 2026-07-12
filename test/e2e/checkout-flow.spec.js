const { expect, test } = require('@playwright/test')
const { signInPageAs } = require('./helpers/e2e-session')

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
  price: 4.99,
  pricePence: 499,
  currency: 'gbp',
  formattedPrice: '£4.99',
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

const addTrackToCart = async (page, track) => {
  await page.goto(`/catalogue/${track.id}`)

  await expect(page.getByRole('heading', { name: track.title })).toBeVisible()

  await page.getByRole('button', { name: 'Add to Cart' }).click()
  await expect(page.getByRole('heading', { name: `${track.title} has been added to your cart.` })).toBeVisible()
  await page.goto('/cart')

  await expect(page.getByText('Shopping Cart')).toBeVisible()
  const cartItems = page.getByLabel('Tracks in cart')
  await expect(cartItems.getByRole('link', { name: track.title })).toBeVisible()
  await expect(cartItems.getByText('£4.99')).toBeVisible()
}

const createPublishedCollection = async (page, suffix) => {
  await signInPageAs(page, 'e2e-uploader@example.com')

  const firstCreateResponse = await page.request.post('/api/tracks', {
    data: createTrackInput(`${suffix}-collection-one`)
  })
  const firstTrack = await firstCreateResponse.json()
  const secondCreateResponse = await page.request.post('/api/tracks', {
    data: createTrackInput(`${suffix}-collection-two`)
  })
  const secondTrack = await secondCreateResponse.json()

  expect(firstCreateResponse.status()).toBe(200)
  expect(secondCreateResponse.status()).toBe(200)

  await signInPageAs(page, 'e2e-admin@example.com')

  for (const track of [firstTrack, secondTrack]) {
    const approvalResponse = await page.request.patch(`/api/admin/tracks/${track.id}`, {
      data: {
        decision: 'approve',
        moderationNotes: 'Approved for collection checkout E2E.'
      }
    })

    expect(approvalResponse.status()).toBe(200)
  }

  await signInPageAs(page, 'e2e-uploader@example.com')

  const collectionResponse = await page.request.post('/api/works-collections', {
    data: {
      catalogueType: 'COLLECTION',
      composer: 'Synthetic Checkout Fixture',
      pricePence: 1499,
      saleFormat: 'BOTH',
      title: `E2E Checkout Collection ${suffix}`,
      trackIds: [firstTrack.id, secondTrack.id]
    }
  })
  const collectionBody = await collectionResponse.json()

  expect(collectionResponse.status()).toBe(200)

  return {
    collection: collectionBody.collection,
    tracks: [firstTrack, secondTrack]
  }
}

const denyDownload = async (page, trackId) => {
  const response = await page.request.get(`/api/tracks/${trackId}/signed-url?mode=download`)

  expect(response.status()).toBe(403)
}

const forceCheckoutMode = async (page, mode) => {
  await page.route('**/api/stripe/checkout_sessions', async route => {
    await route.continue({
      headers: {
        ...route.request().headers(),
        'x-cmc-e2e-checkout-mode': mode
      }
    })
  })
}

test.describe('checkout browser flow', () => {
  test('customers can buy a catalogue track and receive profile ownership', async ({ page }) => {
    const suffix = `${Date.now()}`
    const track = await createPublishedTrack(page, suffix)

    await signInPageAs(page, 'e2e-customer@example.com')
    await addTrackToCart(page, track)
    await denyDownload(page, track.id)

    await page.getByRole('button', { name: 'Buy Now' }).click()

    await expect(page).toHaveURL(/\/profile\?checkout=success&session_id=cs_e2e_paid_/)
    const downloadsTable = page.getByRole('table', { name: 'Downloaded tracks' })
    await expect(downloadsTable.getByRole('link', { name: track.title, exact: true })).toBeVisible()

    const signedUrlResponse = await page.request.get(`/api/tracks/${track.id}/signed-url?mode=download`)
    const signedUrlBody = await signedUrlResponse.json()

    expect(signedUrlResponse.status()).toBe(200)
    expect(signedUrlBody).toEqual(
      expect.objectContaining({
        url: expect.any(String)
      })
    )
  })

  test('customers can buy a Work or Collection and receive included tracks', async ({ page }) => {
    const suffix = `${Date.now()}`
    const { collection, tracks } = await createPublishedCollection(page, suffix)

    await signInPageAs(page, 'e2e-customer@example.com')
    await page.goto(`/works-collections/${collection.id}`)
    await expect(page.getByRole('heading', { name: `${collection.title}.` })).toBeVisible()
    await expect(page.getByText('Individual total')).toBeVisible()
    await expect(page.getByText('£9.98')).toBeVisible()

    for (const track of tracks) {
      await denyDownload(page, track.id)
    }

    await page.getByRole('button', { name: 'Add Collection to Cart' }).click()
    await expect(page.getByRole('button', { name: 'Added to Cart' })).toBeVisible()
    await page.goto('/cart')

    const cartItems = page.getByLabel('Tracks in cart')
    await expect(cartItems.getByRole('link', { name: collection.title })).toBeVisible()
    await expect(cartItems.getByText('2 track collection')).toBeVisible()
    await expect(cartItems.getByText('£14.99')).toBeVisible()

    await page.getByRole('button', { name: 'Buy Now' }).click()

    await expect(page).toHaveURL(/\/profile\?checkout=success&session_id=cs_e2e_paid_/)
    const downloadsTable = page.getByRole('table', { name: 'Downloaded tracks' })

    for (const track of tracks) {
      await expect(downloadsTable.getByRole('link', { name: track.title, exact: true })).toBeVisible()

      const signedUrlResponse = await page.request.get(`/api/tracks/${track.id}/signed-url?mode=download`)
      expect(signedUrlResponse.status()).toBe(200)
    }
  })

  test('cancelled checkout returns to cart without granting ownership', async ({ page }) => {
    const suffix = `cancel-${Date.now()}`
    const track = await createPublishedTrack(page, suffix)

    await signInPageAs(page, 'e2e-customer@example.com')
    await addTrackToCart(page, track)
    await forceCheckoutMode(page, 'cancel')

    await page.getByRole('button', { name: 'Buy Now' }).click()

    await expect(page).toHaveURL(/\/cart\?checkout=canceled/)
    await expect(
      page.getByText('Checkout was cancelled. Your cart has been kept so you can review it or try again when you are ready.')
    ).toBeVisible()
    await expect(page.getByRole('link', { name: track.title })).toBeVisible()
    await denyDownload(page, track.id)
  })

  test('unpaid checkout reconciliation does not grant ownership', async ({ page }) => {
    const suffix = `unpaid-${Date.now()}`
    const track = await createPublishedTrack(page, suffix)

    await signInPageAs(page, 'e2e-customer@example.com')
    await addTrackToCart(page, track)
    await forceCheckoutMode(page, 'unpaid')

    const reconciliationResponsePromise = page.waitForResponse(response => {
      return response.url().includes('/api/stripe/checkout_sessions/reconcile') &&
        response.request().method() === 'POST'
    })

    await page.getByRole('button', { name: 'Buy Now' }).click()

    await expect(page).toHaveURL(/\/profile\?checkout=success&session_id=cs_e2e_unpaid_/)
    const reconciliationResponse = await reconciliationResponsePromise
    const reconciliationBody = await reconciliationResponse.json()

    expect(reconciliationResponse.status()).toBe(200)
    expect(reconciliationBody).toEqual(
      expect.objectContaining({
        status: 'unpaid',
        orderId: expect.any(Number)
      })
    )
    await denyDownload(page, track.id)
  })
})
