export const defaultSecurityAlertRules = [
  {
    action: 'rate_limit.exceeded',
    threshold: 5,
    severity: 'high',
    description: 'Repeated route rate-limit events may indicate abuse or a client retry loop.'
  },
  {
    action: 'track_access.denied',
    threshold: 10,
    severity: 'high',
    description: 'Repeated track access denials may indicate ID enumeration or ownership confusion.'
  },
  {
    action: 'auth.sign_in_denied',
    threshold: 10,
    severity: 'medium',
    description: 'Repeated inactive-account sign-in denials may indicate a stale session loop or unwanted account access.'
  },
  {
    action: 'user_access.self_update_denied',
    threshold: 1,
    severity: 'high',
    description: 'An admin attempted to change their own access fields.'
  },
  {
    action: 'user_access_change.requested',
    threshold: 3,
    severity: 'medium',
    description: 'Multiple privileged access change requests were created in the alert window.'
  },
  {
    action: 'user_access_change.approved',
    threshold: 1,
    severity: 'high',
    description: 'Privileged access was approved and applied.'
  },
  {
    action: 'user_access_change.rejected',
    threshold: 3,
    severity: 'medium',
    description: 'Multiple privileged access change requests were rejected in the alert window.'
  },
  {
    action: 'stripe.webhook_signature_failed',
    threshold: 1,
    severity: 'high',
    description: 'Stripe webhook signature verification failed. Verify webhook secret scoping and reject fulfilment assumptions.'
  }
]

export const evaluateSecurityAlertCounts = ({
  counts,
  rules = defaultSecurityAlertRules
}) => {
  return rules
    .map(rule => ({
      ...rule,
      count: counts[rule.action] || 0
    }))
    .filter(result => result.count >= result.threshold)
}

export const hasHighSeverityFindings = findings => {
  return findings.some(finding => ['high', 'critical'].includes(finding.severity))
}
