import { NextAuthOptions } from 'next-auth'
import TwitterProvider from 'next-auth/providers/twitter'
import CredentialsProvider from 'next-auth/providers/credentials'
import { prisma } from './prisma'

export const authOptions: NextAuthOptions = {
  providers: [
    // Temporary bypass provider for testing
    CredentialsProvider({
      id: 'demo',
      name: 'Demo Login',
      credentials: {
        username: { label: 'Username', type: 'text', placeholder: 'demo' }
      },
      async authorize(credentials) {
        if (credentials?.username === 'demo') {
          // Create or find demo user
          let user = await prisma.user.findUnique({
            where: { twitterId: 'demo-user' }
          })
          
          if (!user) {
            user = await prisma.user.create({
              data: {
                twitterId: 'demo-user',
                twitterHandle: 'demo_user',
                name: 'Demo User',
                profileImage: '/default-avatar.png',
              }
            })
          }
          
          return {
            id: user.id,
            name: user.name,
            email: 'demo@example.com',
            image: user.profileImage,
          }
        }
        return null
      }
    }),
    TwitterProvider({
      clientId: process.env.TWITTER_CLIENT_ID!,
      clientSecret: process.env.TWITTER_CLIENT_SECRET!,
    }),
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      if (account?.provider === 'twitter' && profile) {
        try {
          const twitterProfile = profile as any
          console.log('🐦 Twitter profile received:', twitterProfile)
          
          // Handle Twitter OAuth 1.0a response format (more stable)
          const userId = twitterProfile.id_str || twitterProfile.id || twitterProfile.sub
          const username = twitterProfile.screen_name || twitterProfile.username
          const displayName = twitterProfile.name
          const profileImageUrl = twitterProfile.profile_image_url_https || twitterProfile.profile_image_url
          
          if (!userId || !username) {
            console.error('❌ Missing required profile data:', { userId, username, twitterProfile })
            return false
          }
          
          console.log('🔍 Looking for user with twitterId:', userId)
          
          // Check if user exists
          let existingUser = await prisma.user.findUnique({
            where: { twitterId: userId }
          })

          if (!existingUser) {
            console.log('👤 Creating new user:', { userId, username, displayName })
            // Create new user
            existingUser = await prisma.user.create({
              data: {
                twitterId: userId,
                twitterHandle: username,
                name: displayName || username,
                profileImage: profileImageUrl,
              }
            })
            console.log('✅ User created successfully:', existingUser.id)
          } else {
            console.log('🔄 Updating existing user:', existingUser.id)
            // Update existing user
            existingUser = await prisma.user.update({
              where: { twitterId: userId },
              data: {
                name: displayName || existingUser.name,
                profileImage: profileImageUrl || existingUser.profileImage,
              }
            })
            console.log('✅ User updated successfully')
          }

          return true
        } catch (error) {
          console.error('❌ Error during Twitter sign in:', error)
          // Return false to deny access and show error
          return false
        }
      }
      return true
    },
    async session({ session, token }) {
      if (session.user && token.sub) {
        try {
          console.log('🔍 Finding user for session with twitterId:', token.sub)
          const user = await prisma.user.findUnique({
            where: { twitterId: token.sub }
          })
          
          if (user) {
            console.log('✅ User found for session:', user.id)
            session.user.id = user.id
            session.user.twitterHandle = user.twitterHandle
            session.user.walletAddress = user.walletAddress || undefined
            session.user.bio = user.bio || undefined
          } else {
            console.error('❌ User not found for session with twitterId:', token.sub)
          }
        } catch (error) {
          console.error('❌ Error in session callback:', error)
        }
      }
      return session
    },
    async jwt({ token, account, profile, user }) {
      if (account?.provider === 'twitter' && profile) {
        const twitterProfile = profile as any
        const userId = twitterProfile.id_str || twitterProfile.id || twitterProfile.sub
        token.sub = userId
      } else if (account?.provider === 'demo' && user) {
        // For demo login, set the token.sub to the demo user's twitterId
        token.sub = 'demo-user'
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
