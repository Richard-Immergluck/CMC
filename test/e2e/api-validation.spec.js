const { expect, test } = require('@playwright/test')

test.describe('API validation contracts', () => {
  test('comments require a valid track id', async ({ request }) => {
    const response = await request.get('/api/comments?trackId=abc')
    const body = await response.json()

    expect(response.status()).toBe(400)
    expect(body.message).toBe('Invalid track id')
    expect(body.details).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          field: 'trackId'
        })
      ])
    )
  })

  test('signed track URLs reject unsupported modes', async ({ request }) => {
    const response = await request.get('/api/tracks/1/signed-url?mode=admin')
    const body = await response.json()

    expect(response.status()).toBe(400)
    expect(body.message).toBe('Invalid signed URL request')
    expect(body.details).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          field: 'mode'
        })
      ])
    )
  })

  test('signed track URLs require a valid track id', async ({ request }) => {
    const response = await request.get('/api/tracks/not-a-track/signed-url?mode=sample')
    const body = await response.json()

    expect(response.status()).toBe(400)
    expect(body.message).toBe('Invalid signed URL request')
    expect(body.details).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          field: 'trackId'
        })
      ])
    )
  })

  test('demo fixtures are hidden unless synthetic fixtures are enabled', async ({ request }) => {
    const response = await request.get('/api/demo-fixtures/bach-style-warmup.wav')
    const body = await response.json()

    expect(response.status()).toBe(404)
    expect(body.message).toBe('Demo fixtures are not enabled')
  })

  test('catalogue detail requires a valid track id', async ({ request }) => {
    const response = await request.get('/api/tracks/not-a-track')
    const body = await response.json()

    expect(response.status()).toBe(400)
    expect(body.message).toBe('Invalid track id')
    expect(body.details).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          field: 'trackId'
        })
      ])
    )
  })

  test('catalogue detail returns a typed not found response', async ({ request }) => {
    const response = await request.get('/api/tracks/999999')
    const body = await response.json()

    expect(response.status()).toBe(404)
    expect(body.message).toBe('Track not found')
  })
})
