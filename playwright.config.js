const { defineConfig, devices } = require('@playwright/test')

const port = process.env.PORT || 3000
const baseURL = process.env.PLAYWRIGHT_BASE_URL || `http://127.0.0.1:${port}`

module.exports = defineConfig({
  testDir: './test/e2e',
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI ? [['list'], ['html', { open: 'never' }]] : 'list',
  use: {
    baseURL,
    trace: 'on-first-retry'
  },
  webServer: {
    command: `yarn next start --hostname 127.0.0.1 --port ${port}`,
    env: {
      ...process.env,
      ALLOW_SIMULATED_PURCHASES: process.env.ALLOW_SIMULATED_PURCHASES || 'false',
      CMC_ENABLE_E2E_AUTH: process.env.CMC_ENABLE_E2E_AUTH || 'true',
      CMC_ENABLE_E2E_STRIPE: process.env.CMC_ENABLE_E2E_STRIPE || 'true',
      DATABASE_URL: process.env.DATABASE_URL || 'postgresql://prisma:prisma@localhost:5432/prisma?schema=public',
      GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID || 'ci-placeholder',
      GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET || 'ci-placeholder',
      NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || 'pk_test_ci_placeholder',
      NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET || 'ci-nextauth-secret',
      NEXTAUTH_URL: baseURL,
      S3_ACCESS_ID: process.env.S3_ACCESS_ID || 'ci-placeholder',
      S3_APP_ACCESS_KEY: process.env.S3_APP_ACCESS_KEY || 'ci-placeholder',
      S3_BUCKET_NAME: process.env.S3_BUCKET_NAME || 'ci-placeholder',
      S3_REGION: process.env.S3_REGION || 'eu-west-2',
      STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY || 'sk_test_ci_placeholder',
      STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET || 'whsec_ci_placeholder'
    },
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] }
    }
  ]
})
