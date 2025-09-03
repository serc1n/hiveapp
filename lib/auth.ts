import { NextAuthOptions } from 'next-auth'
import TwitterProvider from 'next-auth/providers/twitter'
import { prisma } from './prisma'

export const authOptions: NextAuthOptions = {
  providers: [
    TwitterProvider({
      clientId: process.env.TWITTER_CLIENT_ID!,
      clientSecret: process.env.TWITTER_CLIENT_SECRET!,
      authorization: {
        params: {
          scope: "users.read tweet.read offline.access",
        },
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      if (account?.provider === 'twitter' && profile) {
        try {
          const twitterProfile = profile as any
          console.log('Twitter profile:', twitterProfile) // Debug log
          
          // Handle both v1.1 and v2.0 API response formats
          const profileData = twitterProfile.data || twitterProfile
          const userId = profileData.id || profileData.id_str
          const username = profileData.username || profileData.screen_name
          const displayName = profileData.name
          const profileImageUrl = profileData.profile_image_url || profileData.profile_image_url_https
          
          if (!userId || !username) {
            console.error('Missing required profile data:', { userId, username, profileData })
            return false
          }
          
          // Check if user exists
          let existingUser = await prisma.user.findUnique({
            where: { twitterId: userId }
          })

          if (!existingUser) {
            // Create new user
            existingUser = await prisma.user.create({
              data: {
                twitterId: userId,
                twitterHandle: username,
                name: displayName || username,
                profileImage: profileImageUrl,
              }
            })
          } else {
            // Update existing user
            existingUser = await prisma.user.update({
              where: { twitterId: userId },
              data: {
                name: displayName || existingUser.name,
                profileImage: profileImageUrl || existingUser.profileImage,
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
          session.user.walletAddress = user.walletAddress || undefined
          session.user.bio = user.bio || undefined
        }
      }
      return session
    },
    async jwt({ token, account, profile }) {
      if (account?.provider === 'twitter' && profile) {
        const twitterProfile = profile as any
        const profileData = twitterProfile.data || twitterProfile
        const userId = profileData.id || profileData.id_str
        token.sub = userId
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
