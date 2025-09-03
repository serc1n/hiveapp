import { NextAuthOptions } from 'next-auth'
import TwitterProvider from 'next-auth/providers/twitter'
import { prisma } from './prisma'

export const authOptions: NextAuthOptions = {
  providers: [
    TwitterProvider({
      clientId: process.env.TWITTER_CLIENT_ID!,
      clientSecret: process.env.TWITTER_CLIENT_SECRET!,
      version: '2.0',
    }),
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      if (account?.provider === 'twitter' && profile) {
        try {
          const twitterProfile = profile as any
          
          // Check if user exists
          let existingUser = await prisma.user.findUnique({
            where: { twitterId: twitterProfile.data.id }
          })

          if (!existingUser) {
            // Create new user
            existingUser = await prisma.user.create({
              data: {
                twitterId: twitterProfile.data.id,
                twitterHandle: twitterProfile.data.username,
                name: twitterProfile.data.name,
                profileImage: twitterProfile.data.profile_image_url,
              }
            })
          } else {
            // Update existing user
            existingUser = await prisma.user.update({
              where: { twitterId: twitterProfile.data.id },
              data: {
                name: twitterProfile.data.name,
                profileImage: twitterProfile.data.profile_image_url,
              }
            })
          }

          return true
        } catch (error) {
          console.error('Error during sign in:', error)
          return false
        }
      }
      return true
    },
    async session({ session, token }) {
      if (session.user && token.sub) {
        const user = await prisma.user.findUnique({
          where: { twitterId: token.sub }
        })
        
        if (user) {
          session.user.id = user.id
          session.user.twitterHandle = user.twitterHandle
          session.user.walletAddress = user.walletAddress
          session.user.bio = user.bio
        }
      }
      return session
    },
    async jwt({ token, account, profile }) {
      if (account?.provider === 'twitter' && profile) {
        const twitterProfile = profile as any
        token.sub = twitterProfile.data.id
      }
      return token
    },
  },
  pages: {
    signIn: '/auth/signin',
  },
  session: {
    strategy: 'jwt',
  },
}

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      name: string
      email?: string
      image?: string
      twitterHandle: string
      walletAddress?: string
      bio?: string
    }
  }
}
