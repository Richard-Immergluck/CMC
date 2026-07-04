const { expect } = require('@playwright/test')

const parseSetCookie = setCookie => {
  const [cookiePair, ...attributes] = setCookie.split(';').map(part => part.trim())
  const separatorIndex = cookiePair.indexOf('=')
  const name = cookiePair.slice(0, separatorIndex)
  const value = cookiePair.slice(separatorIndex + 1)
  const maxAgeAttribute = attributes.find(attribute => attribute.toLowerCase().startsWith('max-age='))
  const maxAge = maxAgeAttribute ? Number(maxAgeAttribute.split('=')[1]) : 60 * 60

  return {
    name,
    value,
    maxAge
  }
}

const addSessionCookieToBrowser = async ({ page, response }) => {
  const setCookie = response.headers()['set-cookie']

  if (!setCookie) {
    throw new Error('E2E session response did not include a Set-Cookie header')
  }

  const cookie = parseSetCookie(setCookie)
  const responseUrl = new URL(response.url())

  await page.context().addCookies([
    {
      name: cookie.name,
      value: cookie.value,
      url: responseUrl.origin,
      httpOnly: true,
      sameSite: 'Lax',
      secure: responseUrl.protocol === 'https:',
      expires: Math.floor(Date.now() / 1000) + cookie.maxAge
    }
  ])
}

const signInPageAs = async (page, email) => {
  const response = await page.request.post('/api/e2e/session', {
    data: {
      email
    }
  })

  expect(response.status()).toBe(200)
  await addSessionCookieToBrowser({ page, response })

  return response.json()
}

module.exports = {
  signInPageAs
}
