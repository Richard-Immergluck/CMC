import assert from 'node:assert/strict'
import test from 'node:test'
import {
  buildDeepHealth,
  buildEnvChecks,
  buildShallowHealth,
  checkRequiredEnv
} from '../lib/server/health-core.mjs'

const fixedNow = () => new Date('2026-06-29T08:00:00.000Z')

test('shallow health exposes stable service metadata', () => {
  assert.deepEqual(
    buildShallowHealth({
      env: {
        VERCEL_ENV: 'preview',
        VERCEL_GIT_COMMIT_SHA: 'abc123'
      },
      now: fixedNow
    }),
    {
      status: 'ok',
      service: 'cmc',
      environment: 'preview',
      commit: 'abc123',
      timestamp: '2026-06-29T08:00:00.000Z'
    }
  )
})

test('required environment checks return names but not values', () => {
  assert.deepEqual(
    checkRequiredEnv({
      env: {
        DATABASE_URL: 'postgresql://secret'
      },
      names: ['DATABASE_URL', 'STRIPE_SECRET_KEY']
    }),
    {
      status: 'fail',
      missing: ['STRIPE_SECRET_KEY']
    }
  )
})

test('environment check groups summarize dependency readiness', () => {
  assert.deepEqual(
    buildEnvChecks({
      env: {
        DATABASE_URL: 'set',
        STRIPE_SECRET_KEY: 'set'
      },
      groups: {
        database: ['DATABASE_URL'],
        stripe: ['STRIPE_SECRET_KEY', 'STRIPE_WEBHOOK_SECRET']
      }
    }),
    {
      database: {
        status: 'pass',
        missing: []
      },
      stripe: {
        status: 'fail',
        missing: ['STRIPE_WEBHOOK_SECRET']
      }
    }
  )
})

test('deep health degrades when any dependency check fails', () => {
  assert.deepEqual(
    buildDeepHealth({
      env: {
        NODE_ENV: 'test'
      },
      now: fixedNow,
      checks: {
        database: {
          status: 'pass'
        },
        stripe: {
          status: 'fail',
          missing: ['STRIPE_WEBHOOK_SECRET']
        }
      }
    }),
    {
      status: 'degraded',
      service: 'cmc',
      environment: 'test',
      commit: null,
      timestamp: '2026-06-29T08:00:00.000Z',
      checks: {
        database: {
          status: 'pass'
        },
        stripe: {
          status: 'fail',
          missing: ['STRIPE_WEBHOOK_SECRET']
        }
      }
    }
  )
})
