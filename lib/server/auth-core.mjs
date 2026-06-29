export const authErrors = {
  inactiveAccount: 'AccountNotActive'
}

export const authDenialReasons = {
  inactiveAccount: 'inactive_account'
}

export const canSignInWithAccountStatus = accountStatus => {
  return accountStatus === 'ACTIVE'
}

export const enrichTokenWithUserAccessData = ({ token, user }) => {
  if (!user) {
    return token
  }

  return {
    ...token,
    sub: user.id,
    role: user.role,
    accountStatus: user.accountStatus,
    uploaderStatus: user.uploaderStatus
  }
}

export const getSignInDecision = user => {
  if (!user) {
    return {
      allowed: true
    }
  }

  if (!canSignInWithAccountStatus(user.accountStatus)) {
    return {
      allowed: false,
      reason: authDenialReasons.inactiveAccount,
      redirect: `/auth/signin?error=${authErrors.inactiveAccount}`
    }
  }

  return {
    allowed: true
  }
}
