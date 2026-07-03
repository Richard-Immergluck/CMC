import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import path from 'node:path'
import test from 'node:test'

const root = process.cwd()
const node = process.execPath
const script = path.join(root, 'scripts/deployment-readiness.js')

const runReadiness = env => spawnSync(node, [script], {
  cwd: root,
  env: {
    ...process.env,
    ...env
  },
  encoding: 'utf8'
})

test('deployment readiness blocks production deploys from non-production branches', () => {
  const result = runReadiness({
    VERCEL_ENV: 'production',
    VERCEL_GIT_COMMIT_REF: 'dev',
    CMC_EXPECTED_PRODUCTION_BRANCH: 'master',
    NEXTAUTH_URL: 'https://classical-music-catalogue.vercel.app'
  })

  assert.notEqual(result.status, 0)
  assert.match(result.stderr, /Production deployments must come from master; got dev/)
})

test('deployment readiness blocks production auth URLs that point at preview alias', () => {
  const result = runReadiness({
    VERCEL_ENV: 'production',
    VERCEL_GIT_COMMIT_REF: 'master',
    NEXTAUTH_URL: 'https://classical-music-catalogue-richardimmerglucks-projects.vercel.app',
    S3_KEY_PREFIX: 'production/'
  })

  assert.notEqual(result.status, 0)
  assert.match(result.stderr, /stable Preview alias/)
})

test('deployment readiness blocks production storage prefixes that point at development', () => {
  const result = runReadiness({
    VERCEL_ENV: 'production',
    VERCEL_GIT_COMMIT_REF: 'master',
    NEXTAUTH_URL: 'https://classical-music-catalogue.vercel.app',
    S3_KEY_PREFIX: 'development/'
  })

  assert.notEqual(result.status, 0)
  assert.match(result.stderr, /development prefix in Production/)
})

test('deployment readiness blocks preview deploys from unexpected branches when configured', () => {
  const result = runReadiness({
    VERCEL_ENV: 'preview',
    VERCEL_GIT_COMMIT_REF: 'feature/ui-experiment',
    CMC_EXPECTED_PREVIEW_BRANCH: 'dev',
    NEXTAUTH_URL: 'https://classical-music-catalogue-richardimmerglucks-projects.vercel.app'
  })

  assert.notEqual(result.status, 0)
  assert.match(result.stderr, /Preview deployments must come from dev; got feature\/ui-experiment/)
})

test('deployment readiness blocks preview auth URLs that point at production', () => {
  const result = runReadiness({
    VERCEL_ENV: 'preview',
    VERCEL_GIT_COMMIT_REF: 'dev',
    CMC_EXPECTED_PREVIEW_BRANCH: 'dev',
    NEXTAUTH_URL: 'https://classical-music-catalogue.vercel.app',
    S3_KEY_PREFIX: 'development/'
  })

  assert.notEqual(result.status, 0)
  assert.match(result.stderr, /Production host in Preview/)
})

test('deployment readiness blocks preview storage prefixes that point at production', () => {
  const result = runReadiness({
    VERCEL_ENV: 'preview',
    VERCEL_GIT_COMMIT_REF: 'dev',
    CMC_EXPECTED_PREVIEW_BRANCH: 'dev',
    NEXTAUTH_URL: 'https://classical-music-catalogue-richardimmerglucks-projects.vercel.app',
    S3_KEY_PREFIX: 'production/'
  })

  assert.notEqual(result.status, 0)
  assert.match(result.stderr, /production prefix in Preview/)
})

test('deployment readiness accepts the documented dev and production branch split', () => {
  const preview = runReadiness({
    VERCEL_ENV: 'preview',
    VERCEL_GIT_COMMIT_REF: 'dev',
    CMC_EXPECTED_PREVIEW_BRANCH: 'dev',
    NEXTAUTH_URL: 'https://classical-music-catalogue-richardimmerglucks-projects.vercel.app',
    S3_KEY_PREFIX: 'development/'
  })

  const production = runReadiness({
    VERCEL_ENV: 'production',
    VERCEL_GIT_COMMIT_REF: 'master',
    CMC_EXPECTED_PRODUCTION_BRANCH: 'master',
    NEXTAUTH_URL: 'https://classical-music-catalogue.vercel.app',
    S3_KEY_PREFIX: 'production/'
  })

  assert.equal(preview.status, 0, preview.stderr)
  assert.equal(production.status, 0, production.stderr)
})
