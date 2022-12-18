import NextAuth from 'next-auth'

// Providers
import GithubProvider from 'next-auth/providers/github'
import GoogleProvider from "next-auth/providers/google"

// DB adapter and Client imports
import { PrismaAdapter } from "@next-auth/prisma-adapter" 
import prisma from '/components/prisma'

export default NextAuth({
  site: process.env.NEXTAUTH_URL,

  secret: process.env.NEXTAUTH_SECRET,

  adapter: PrismaAdapter(prisma), // NextAuth adapter for Prisma

  session: {
    strategy: 'jwt',

  },
  providers: [
    GithubProvider({
      clientId: process.env.GITHUB_ID,
      clientSecret: process.env.GITHUB_SECRET,
    }),
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET
    }),
  ],
  callbacks: {
    async jwt({token, account}) {
      if (account) {
        token.accessToken = account.access_token
      }
      return token
    },
    async session({session, token, user}) {
      session.accessToken = token.accessToken
      return session
    },   
    async redirect({ url, baseUrl }) {
      // Allows relative callback URLs
      if (url.startsWith("/")) return `${baseUrl}${url}`
      // Allows callback URLs on the same origin
      else if (new URL(url).origin === baseUrl) return url
      return baseUrl
    }
  },
})
