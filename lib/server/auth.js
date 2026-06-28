import EmailProvider from 'next-auth/providers/email'
import GoogleProvider from 'next-auth/providers/google'
import { PrismaAdapter } from '@next-auth/prisma-adapter'
import prisma from './prisma'

const hasEnv = names => names.every(name => Boolean(process.env[name]))

const providers = []

const enrichTokenWithUserAccess = async token => {
  const email = token.email

  if (!email) {
    return token
  }

  const user = await prisma.user.findUnique({
    where: {
      email
    },
    select: {
      id: true,
      role: true,
      accountStatus: true,
      uploaderStatus: true
    }
  })

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
  callbacks: {
    async jwt({ token }) {
      return enrichTokenWithUserAccess(token)
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub
        session.user.role = token.role
        session.user.accountStatus = token.accountStatus
        session.user.uploaderStatus = token.uploaderStatus
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
