const CACHE_NAME = 'hiveapp-v4'; // Increment version to force cache update
const urlsToCache = [
  '/',
  '/manifest.json',
  '/icon-192x192.png',
  '/icon-512x512.png'
];

// Install event
self.addEventListener('install', (event) => {
  // Force the waiting service worker to become the active service worker
  self.skipWaiting();
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(urlsToCache))
  );
});

// Activate event
self.addEventListener('activate', (event) => {
  // Take control of all clients immediately
  self.clients.claim();
  
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Fetch event
self.addEventListener('fetch', (event) => {
  // For API calls, always fetch fresh content
  if (event.request.url.includes('/api/')) {
    event.respondWith(fetch(event.request));
    return;
  }
  
  // For other resources, use cache-first strategy with network fallback
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        if (response) {
          // Also fetch fresh content in background to update cache
          fetch(event.request).then((freshResponse) => {
            if (freshResponse.ok) {
              caches.open(CACHE_NAME).then((cache) => {
                cache.put(event.request, freshResponse.clone());
              });
            }
          }).catch(() => {}); // Ignore network errors
          
          return response;
        }
        return fetch(event.request);
      })
  );
});

// Push event for notifications
self.addEventListener('push', (event) => {
  let notificationData = {
    title: 'HiveApp',
    body: 'New message received',
    icon: '/icon-192x192.png',
    badge: '/icon-192x192.png',
    tag: 'default',
    data: {
      url: '/'
    }
  };

  if (event.data) {
    try {
      const payload = event.data.json();
      notificationData = {
        title: payload.title || 'HiveApp',
        body: payload.body || 'New message received',
        icon: payload.icon || '/icon-192x192.png',
        badge: payload.badge || '/icon-192x192.png',
        tag: payload.tag || 'default',
        vibrate: [100, 50, 100],
        data: payload.data || { url: '/' },
        actions: [
          {
            action: 'open',
            title: 'Open',
            icon: '/icon-192x192.png'
          },
          {
            action: 'close',
            title: 'Close',
            icon: '/icon-192x192.png'
          }
        ]
      };
    } catch (error) {
      console.error('Error parsing notification payload:', error);
    }
  }

  event.waitUntil(
    self.registration.showNotification(notificationData.title, {
      body: notificationData.body,
      icon: notificationData.icon,
      badge: notificationData.badge,
      tag: notificationData.tag,
      vibrate: notificationData.vibrate,
      data: notificationData.data,
      actions: notificationData.actions
    })
  );
});

// Notification click event
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'open' || !event.action) {
    const urlToOpen = event.notification.data?.url || '/';
    
    event.waitUntil(
      clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
        // Check if there's already a window/tab open with the target URL
        for (const client of clientList) {
          if (client.url === urlToOpen && 'focus' in client) {
            return client.focus();
          }
        }
        
        // If no window/tab is open, open a new one
        if (clients.openWindow) {
          return clients.openWindow(urlToOpen);
        }
      })
    );
  }
});

// Listen for messages from clients
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
