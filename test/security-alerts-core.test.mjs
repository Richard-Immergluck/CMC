import assert from 'node:assert/strict'
import test from 'node:test'
import {
  evaluateSecurityAlertCounts,
  hasHighSeverityFindings
} from '../lib/server/security-alerts-core.mjs'

test('security alert counts report threshold findings', () => {
  assert.deepEqual(
    evaluateSecurityAlertCounts({
      counts: {
        'rate_limit.exceeded': 5,
        'auth.sign_in_denied': 9,
        'user_access_change.approved': 1
      }
    }).map(finding => ({
      action: finding.action,
      count: finding.count,
      severity: finding.severity
    })),
    [
      {
        action: 'rate_limit.exceeded',
        count: 5,
        severity: 'high'
      },
      {
        action: 'user_access_change.approved',
        count: 1,
        severity: 'high'
      }
    ]
  )
})

test('security alert findings identify high severity results', () => {
  assert.equal(hasHighSeverityFindings([
    {
      severity: 'medium'
    }
  ]), false)
  assert.equal(hasHighSeverityFindings([
    {
      severity: 'high'
    }
  ]), true)
})

test('stripe webhook signature failures are high severity findings', () => {
  assert.deepEqual(
    evaluateSecurityAlertCounts({
      counts: {
        'stripe.webhook_signature_failed': 1
      }
    }).map(finding => ({
      action: finding.action,
      count: finding.count,
      severity: finding.severity
    })),
    [
      {
        action: 'stripe.webhook_signature_failed',
        count: 1,
        severity: 'high'
      }
    ]
  )
})
