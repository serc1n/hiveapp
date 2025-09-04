import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Providers } from './providers'
import { NotificationPermissionPrompt } from './components/NotificationPermissionPrompt'
import { ServiceWorkerRegistration } from './components/ServiceWorkerRegistration'
import { UpdateNotification } from '@/components/UpdateNotification'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'HiveApp - Token Gated Chat',
  description: 'Modern token-gated chat application with Twitter authentication',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'HiveApp',
  },
  formatDetection: {
    telephone: false,
  },
  icons: {
    icon: '/hive.png',
    apple: '/hive.png',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.className} bg-black text-white min-h-screen`}>
        <Providers>
          {children}
          <NotificationPermissionPrompt />
          <ServiceWorkerRegistration />
          <UpdateNotification />
        </Providers>
      </body>
    </html>
  )
}
