export const healthEnvGroups = {
  database: ['DATABASE_URL'],
  storage: ['S3_ACCESS_ID', 'S3_APP_ACCESS_KEY', 'S3_BUCKET_NAME', 'S3_REGION'],
  stripe: ['STRIPE_SECRET_KEY', 'STRIPE_WEBHOOK_SECRET'],
  auth: ['NEXTAUTH_SECRET', 'NEXTAUTH_URL']
}

export const checkRequiredEnv = ({ env = process.env, names }) => {
  const missing = names.filter(name => !env[name])

  return {
    status: missing.length > 0 ? 'fail' : 'pass',
    missing
  }
}

export const buildEnvChecks = ({ env = process.env, groups = healthEnvGroups } = {}) => {
  return Object.fromEntries(
    Object.entries(groups).map(([name, requiredEnv]) => [
      name,
      checkRequiredEnv({ env, names: requiredEnv })
    ])
  )
}

export const buildShallowHealth = ({
  env = process.env,
  now = () => new Date()
} = {}) => ({
  status: 'ok',
  service: 'cmc',
  environment: env.VERCEL_ENV || env.NODE_ENV || 'local',
  commit: env.VERCEL_GIT_COMMIT_SHA || null,
  timestamp: now().toISOString()
})

export const buildDeepHealth = ({
  checks,
  env = process.env,
  now = () => new Date()
}) => {
  const failed = Object.values(checks).some(check => check.status !== 'pass')

  return {
    ...buildShallowHealth({ env, now }),
    status: failed ? 'degraded' : 'ok',
    checks
  }
}
