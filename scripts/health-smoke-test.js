const DEFAULT_BASE_URL = 'http://localhost:3000'

const baseUrl = (process.env.HEALTH_SMOKE_BASE_URL || process.env.SMOKE_BASE_URL || DEFAULT_BASE_URL)
  .replace(/\/$/, '')

const isLocalSmokeTarget = url => ['localhost', '127.0.0.1', '::1'].includes(url.hostname)

const fail = message => {
  console.error(`Health smoke failed: ${message}`)
  process.exitCode = 1
}

const validateBaseUrl = () => {
  let parsedUrl

  try {
    parsedUrl = new URL(baseUrl)
  } catch {
    fail(`HEALTH_SMOKE_BASE_URL is not a valid URL: ${baseUrl}`)
    return
  }

  if (parsedUrl.protocol !== 'https:' && !isLocalSmokeTarget(parsedUrl)) {
    fail('HEALTH_SMOKE_BASE_URL must use https:// for non-local smoke targets')
  }
}

const run = async () => {
  console.log(`Running health smoke against ${baseUrl}`)
  validateBaseUrl()

  if (process.exitCode) {
    process.exit()
  }

  const response = await fetch(`${baseUrl}/api/health`, {
    headers: {
      accept: 'application/json'
    }
  })
  const bodyText = await response.text()

  if (response.status !== 200) {
    fail(`/api/health returned ${response.status}; expected 200`)
    process.exit()
  }

  let body

  try {
    body = JSON.parse(bodyText)
  } catch {
    fail('/api/health did not return valid JSON')
    process.exit()
  }

  if (body.status !== 'ok') {
    fail(`/api/health status was ${body.status}; expected ok`)
  }

  if (body.service !== 'cmc') {
    fail(`/api/health service was ${body.service}; expected cmc`)
  }

  const requestId = response.headers.get('x-request-id')

  if (!requestId) {
    fail('/api/health did not include x-request-id')
  }

  if (process.exitCode) {
    process.exit()
  }

  console.log('Health smoke passed')
}

run().catch(error => {
  fail(error.message)
  process.exit()
})
