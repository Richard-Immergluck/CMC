import {
  canAccessAdminSurface,
  canAccessSupportSurface,
  canUploadTracks,
  roles
} from './access-control.mjs'

export const catalogueModes = {
  public: 'PUBLIC',
  member: 'MEMBER',
  uploader: 'UPLOADER',
  support: 'SUPPORT',
  admin: 'ADMIN'
}

export const getCatalogueMode = user => {
  if (!user) {
    return catalogueModes.public
  }

  if (user.role === roles.admin) {
    return catalogueModes.admin
  }

  if (user.role === roles.support) {
    return catalogueModes.support
  }

  if (canUploadTracks(user)) {
    return catalogueModes.uploader
  }

  return catalogueModes.member
}

export const getCatalogueContext = user => {
  const mode = getCatalogueMode(user)

  return {
    mode,
    isAuthenticated: Boolean(user),
    role: user?.role || null,
    userId: user?.id || null,
    canAccessAdmin: canAccessAdminSurface(user),
    canAccessSupport: canAccessSupportSurface(user),
    canUpload: canUploadTracks(user),
    showMemberActions: mode !== catalogueModes.public,
    showUploaderContext: mode === catalogueModes.uploader || mode === catalogueModes.admin,
    showOperationsOverlay: mode === catalogueModes.admin || mode === catalogueModes.support
  }
}

export const getCatalogueModeLabel = mode => {
  switch (mode) {
    case catalogueModes.admin:
      return 'Admin catalogue'
    case catalogueModes.support:
      return 'Support catalogue'
    case catalogueModes.uploader:
      return 'Uploader catalogue'
    case catalogueModes.member:
      return 'Member catalogue'
    default:
      return 'Public catalogue'
  }
}

