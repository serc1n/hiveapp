import webpush from 'web-push'
import { prisma } from './prisma'

// Configure web-push with VAPID keys
if (process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY && process.env.VAPID_EMAIL) {
  webpush.setVapidDetails(
    `mailto:${process.env.VAPID_EMAIL}`,
    process.env.VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
  )
}

export async function sendNotificationToGroupMembers(
  groupId: string,
  title: string,
  body: string,
  excludeUserId?: string
) {
  try {
    // Get all push subscriptions for group members
    const groupMembers = await prisma.groupMember.findMany({
      where: {
        groupId,
        userId: excludeUserId ? { not: excludeUserId } : undefined,
      },
      select: {
        userId: true
      }
    })

    const userIds = groupMembers.map(member => member.userId)
    
    const subscriptions = await prisma.pushSubscription.findMany({
      where: {
        userId: {
          in: userIds
        }
      }
    })

    const notifications = []

    for (const subscription of subscriptions) {
      try {
        const pushSubscription = {
          endpoint: subscription.endpoint,
          keys: {
            p256dh: subscription.p256dh,
            auth: subscription.auth
          }
        }

        const payload = JSON.stringify({
          title,
          body,
          icon: '/icon-192x192.png',
          badge: '/icon-192x192.png',
          tag: `group-${groupId}`,
          data: {
            groupId,
            url: `/?groupId=${groupId}`
          }
        })

        notifications.push(
          webpush.sendNotification(pushSubscription, payload)
            .catch(error => {
              console.error('Failed to send notification to:', subscription.id, error)
              // Remove invalid subscriptions
              if (error.statusCode === 410) {
                prisma.pushSubscription.delete({ 
                  where: { id: subscription.id } 
                }).catch(console.error)
              }
            })
        )
      } catch (error) {
        console.error('Error preparing notification:', error)
      }
    }

    await Promise.allSettled(notifications)
    console.log(`Sent ${notifications.length} notifications for group ${groupId}`)
  } catch (error) {
    console.error('Error sending notifications:', error)
  }
}

export async function savePushSubscription(userId: string, subscription: any) {
  try {
    // Remove existing subscription for this user and endpoint
    await prisma.pushSubscription.deleteMany({
      where: {
        userId,
        endpoint: subscription.endpoint
      }
    })

    // Save new subscription
    await prisma.pushSubscription.create({
      data: {
        userId,
        endpoint: subscription.endpoint,
        p256dh: subscription.keys.p256dh,
        auth: subscription.keys.auth
      }
    })

    console.log('Push subscription saved for user:', userId)
  } catch (error) {
    console.error('Error saving push subscription:', error)
    throw error
  }
}