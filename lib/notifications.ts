import webpush from 'web-push'
import { prisma } from './prisma'

// Configure web-push
webpush.setVapidDetails(
  'mailto:your-email@example.com',
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || '',
  process.env.VAPID_PRIVATE_KEY || ''
)

export async function sendNotificationToGroupMembers(
  groupId: string,
  title: string,
  body: string,
  excludeUserId?: string
) {
  try {
    // Get all group members with push subscriptions
    const members = await prisma.groupMember.findMany({
      where: {
        groupId,
        userId: excludeUserId ? { not: excludeUserId } : undefined
      },
      include: {
        user: true
      }
    })

    // Get push subscriptions for these users
    const subscriptions = await prisma.pushSubscription.findMany({
      where: {
        userId: {
          in: members.map(member => member.userId)
        }
      }
    })

    const payload = JSON.stringify({
      title,
      body,
      icon: '/icon-192x192.png',
      badge: '/icon-192x192.png',
      data: {
        groupId,
        url: '/'
      }
    })

    // Send notifications to all subscriptions
    const notifications = subscriptions.map(async (subscription) => {
      try {
        await webpush.sendNotification(
          {
            endpoint: subscription.endpoint,
            keys: {
              p256dh: subscription.p256dh,
              auth: subscription.auth
            }
          },
          payload
        )
      } catch (error) {
        console.error('Error sending notification to subscription:', error)
        // Remove invalid subscription
        if (error.statusCode === 410) {
          await prisma.pushSubscription.delete({
            where: { id: subscription.id }
          })
        }
      }
    })

    await Promise.allSettled(notifications)
  } catch (error) {
    console.error('Error sending group notifications:', error)
    throw error
  }
}

export async function subscribeToPushNotifications(
  userId: string,
  subscription: {
    endpoint: string
    keys: {
      p256dh: string
      auth: string
    }
  }
) {
  try {
    await prisma.pushSubscription.upsert({
      where: {
        userId_endpoint: {
          userId,
          endpoint: subscription.endpoint
        }
      },
      update: {
        p256dh: subscription.keys.p256dh,
        auth: subscription.keys.auth
      },
      create: {
        userId,
        endpoint: subscription.endpoint,
        p256dh: subscription.keys.p256dh,
        auth: subscription.keys.auth
      }
    })
  } catch (error) {
    console.error('Error saving push subscription:', error)
    throw error
  }
}

export async function unsubscribeFromPushNotifications(
  userId: string,
  endpoint: string
) {
  try {
    await prisma.pushSubscription.delete({
      where: {
        userId_endpoint: {
          userId,
          endpoint
        }
      }
    })
  } catch (error) {
    console.error('Error removing push subscription:', error)
    throw error
  }
}
