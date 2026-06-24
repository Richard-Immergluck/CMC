import NextAuth from 'next-auth'

// Providers
import EmailProvider from 'next-auth/providers/email'
import GoogleProvider from 'next-auth/providers/google'

// DB adapter and Client imports
import { PrismaAdapter } from '@next-auth/prisma-adapter'
import prisma from '../../../components/prisma'

const hasEnv = names => names.every(name => Boolean(process.env[name]))

const providers = []

if (hasEnv(['GOOGLE_CLIENT_ID', 'GOOGLE_CLIENT_SECRET'])) {
  providers.push(
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET
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

export default NextAuth({
  site: process.env.NEXTAUTH_URL,

  secret: process.env.NEXTAUTH_SECRET,

  adapter: PrismaAdapter(prisma), // NextAuth adapter for Prisma

  session: {
    strategy: 'jwt'
  },
  providers,
  callbacks: {
    async redirect({ url, baseUrl }) {
      // Allows relative callback URLs
      if (url.startsWith('/')) return `${baseUrl}${url}`
      // Allows callback URLs on the same origin
      else if (new URL(url).origin === baseUrl) return url
      return baseUrl
    }
  },
})
