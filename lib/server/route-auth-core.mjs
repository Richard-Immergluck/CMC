import { createForbiddenError } from './api-core.mjs'
import { isActiveUser } from './permissions.mjs'

const maxSessionAgeUpperBoundMinutes = 24 * 60

export const parseSensitiveSessionMaxAgeMinutes = value => {
  if (value === undefined || value === null || value === '') {
    return null
  }

  const parsed = Number(value)

  if (!Number.isInteger(parsed) || parsed <= 0 || parsed > maxSessionAgeUpperBoundMinutes) {
    return null
  }

  return parsed
}

export const getSensitiveSessionMaxAgeMinutes = () => {
  return parseSensitiveSessionMaxAgeMinutes(process.env.CMC_SENSITIVE_SESSION_MAX_AGE_MINUTES)
}

export const getRouteSessionAgePosture = ({
  session,
  maxSessionAgeMinutes,
  now = new Date()
}) => {
  if (!maxSessionAgeMinutes) {
    return {
      valid: true,
      reason: 'not_required'
    }
  }

  const issuedAt = session?.user?.sessionIssuedAt

  if (!issuedAt) {
    return {
      valid: false,
      reason: 'missing_session_issued_at'
    }
  }

  const issuedAtDate = new Date(issuedAt)

  if (Number.isNaN(issuedAtDate.getTime())) {
    return {
      valid: false,
      reason: 'invalid_session_issued_at'
    }
  }

  const ageMs = now.getTime() - issuedAtDate.getTime()

  if (ageMs < 0) {
    return {
      valid: false,
      reason: 'future_session_issued_at'
    }
  }

  const ageMinutes = ageMs / (60 * 1000)

  if (ageMinutes > maxSessionAgeMinutes) {
    return {
      valid: false,
      reason: 'session_too_old',
      ageMinutes
    }
  }

  return {
    valid: true,
    reason: 'fresh',
    ageMinutes
  }
}

export const getRouteSessionRevocationPosture = ({ session, user }) => {
  if (!user?.sessionRevokedBefore) {
    return {
      valid: true,
      reason: 'not_revoked'
    }
  }

  const issuedAt = session?.user?.sessionIssuedAt

  if (!issuedAt) {
    return {
      valid: false,
      reason: 'missing_session_issued_at'
    }
  }

  const issuedAtDate = new Date(issuedAt)
  const revokedBeforeDate = new Date(user.sessionRevokedBefore)

  if (Number.isNaN(issuedAtDate.getTime()) || Number.isNaN(revokedBeforeDate.getTime())) {
    return {
      valid: false,
      reason: 'invalid_session_revocation_posture'
    }
  }

  if (issuedAtDate <= revokedBeforeDate) {
    return {
      valid: false,
      reason: 'session_revoked'
    }
  }

  return {
    valid: true,
    reason: 'not_revoked'
  }
}

export const getRouteSessionIdentityPosture = ({ session, user }) => {
  if (!session?.user?.email || !user) {
    return {
      valid: false,
      reason: 'missing_user'
    }
  }

  if (session.user.id && session.user.id !== user.id) {
    return {
      valid: false,
      reason: 'user_id_mismatch'
    }
  }

  if (session.user.email !== user.email) {
    return {
      valid: false,
      reason: 'email_mismatch'
    }
  }

  return {
    valid: true,
    reason: 'matched'
  }
}

export const requireFreshRouteSessionUser = ({ session, user, maxSessionAgeMinutes }) => {
  const posture = getRouteSessionIdentityPosture({ session, user })

  if (!posture.valid) {
    throw createForbiddenError('Fresh authenticated session required')
  }

  const agePosture = getRouteSessionAgePosture({
    session,
    maxSessionAgeMinutes
  })

  if (!agePosture.valid) {
    throw createForbiddenError('Recent authenticated session required')
  }

  const revocationPosture = getRouteSessionRevocationPosture({ session, user })

  if (!revocationPosture.valid) {
    throw createForbiddenError('Fresh authenticated session required')
  }

  return user
}

export const getActiveApiUserPosture = user => {
  if (!user) {
    return {
      valid: false,
      reason: 'missing_user'
    }
  }

  if (!isActiveUser(user)) {
    return {
      valid: false,
      reason: 'inactive_account'
    }
  }

  return {
    valid: true,
    reason: 'active'
  }
}

export const requireActiveApiUser = user => {
  const posture = getActiveApiUserPosture(user)

  if (!posture.valid) {
    throw createForbiddenError('Active account required')
  }

  return user
}
