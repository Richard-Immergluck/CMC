import EmailProvider from 'next-auth/providers/email'
import GoogleProvider from 'next-auth/providers/google'
import { PrismaAdapter } from '@next-auth/prisma-adapter'
import prisma from './prisma'
import { logServerEvent } from './logging'
import {
  enrichTokenWithUserAccessData,
  getSignInDecision
} from './auth-core.mjs'
import {
  auditActions,
  buildAuthSignOutMetadata,
  buildAuditEventData,
  buildAuthSignInDeniedMetadata
} from './audit-core.mjs'

const hasEnv = names => names.every(name => Boolean(process.env[name]))

const providers = []

const findUserAccessByEmail = email => {
  if (!email) {
    return null
  }

  return prisma.user.findUnique({
    where: {
      email
    },
    select: {
      id: true,
      role: true,
      accountStatus: true,
      uploaderStatus: true,
      sessionRevokedBefore: true
    }
  })
}

const enrichTokenWithUserAccess = async token => {
  const user = await findUserAccessByEmail(token.email)

  return enrichTokenWithUserAccessData({ token, user })
}

const recordSignInDenied = ({ account, decision, user }) => {
  return prisma.auditEvent.create({
    data: buildAuditEventData({
      action: auditActions.authSignInDenied,
      actorId: user.id,
      entityType: 'User',
      entityId: user.id,
      metadata: buildAuthSignInDeniedMetadata({
        accountStatus: user.accountStatus,
        provider: account?.provider,
        reason: decision.reason
      })
    })
  })
}

const recordSignOut = async ({ token }) => {
  if (!token?.sub) {
    return
  }

  await prisma.auditEvent.create({
    data: buildAuditEventData({
      action: auditActions.authSignOut,
      actorId: token.sub,
      entityType: 'User',
      entityId: token.sub,
      metadata: buildAuthSignOutMetadata({
        provider: token.provider
      })
    })
  })
}

const authorizeSignIn = async ({ account, user }) => {
  const storedUser = await findUserAccessByEmail(user?.email)
  const decision = getSignInDecision(storedUser)

  if (!decision.allowed && storedUser) {
    await recordSignInDenied({
      account,
      decision,
      user: storedUser
    })
  }

  return decision.allowed ? true : decision.redirect
}

if (hasEnv(['GOOGLE_CLIENT_ID', 'GOOGLE_CLIENT_SECRET'])) {
  providers.push(
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      // Google verifies email ownership, so invited/pre-seeded users can claim
      // the matching account on first sign-in.
      allowDangerousEmailAccountLinking: true
    })
  )
}

if (hasEnv(['EMAIL_SERVER', 'EMAIL_FROM'])) {
  providers.push(
    EmailProvider({
      server: process.env.EMAIL_SERVER,
      from: process.env.EMAIL_FROM
    })
  )
}

export const authOptions = {
  site: process.env.NEXTAUTH_URL,
  secret: process.env.NEXTAUTH_SECRET,
  adapter: PrismaAdapter(prisma),
  session: {
    strategy: 'jwt'
  },
  pages: {
    signIn: '/auth/signin',
    error: '/auth/signin'
  },
  providers,
  events: {
    async signOut({ token }) {
      try {
        await recordSignOut({ token })
      } catch (error) {
        logServerEvent({
          level: 'warn',
          event: 'auth.sign_out_audit_failed',
          message: 'Failed to persist sign-out audit event',
          metadata: {
            userId: token?.sub,
            error: error.message
          }
        })
      }
    }
  },
  callbacks: {
    async signIn({ account, user }) {
      return authorizeSignIn({ account, user })
    },
    async jwt({ token }) {
      if (!token.sessionIssuedAt) {
        token.sessionIssuedAt = new Date().toISOString()
      }

      return enrichTokenWithUserAccess(token)
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub
        session.user.role = token.role
        session.user.accountStatus = token.accountStatus
        session.user.uploaderStatus = token.uploaderStatus
        session.user.sessionIssuedAt = token.sessionIssuedAt
        session.user.sessionRevokedBefore = token.sessionRevokedBefore
      }

      return session
    },
    async redirect({ url, baseUrl }) {
      if (url.startsWith('/')) return `${baseUrl}${url}`
      if (new URL(url).origin === baseUrl) return url
      return baseUrl
    }
  }
}
