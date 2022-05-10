import NextAuth from 'next-auth'

// Providers
import GithubProvider from 'next-auth/providers/github'
import GoogleProvider from "next-auth/providers/google"

// Adapter
// import {MongoDBAdapter} from '@next-auth/mongodb-adapter'
// import clientPromise from '../../../lib/mongodb'

export default NextAuth({
  secret: process.env.SECRET,
  // adapter: MongoDBAdapter(clientPromise),
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
  },
  // pages: {
  //   signIn: '/auth/signin',
  //   signOut: '/auth/signout',
  //   error: '/auth/error', // Error code passed in query string as ?error=
  //   verifyRequest: '/auth/verify-request', // (used for check email message)
  //   newUser: '/auth/new-user' // New users will be directed here on first sign in
  // }
})
