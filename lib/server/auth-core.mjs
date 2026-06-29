export const authErrors = {
  inactiveAccount: 'AccountNotActive'
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
    return true
  }

  if (!canSignInWithAccountStatus(user.accountStatus)) {
    return `/auth/signin?error=${authErrors.inactiveAccount}`
  }

  return true
}
