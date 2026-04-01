// Import Firebase scripts
importScripts('https://www.gstatic.com/firebasejs/9.1.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.1.1/firebase-messaging-compat.js');

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBOHzM06N1rsJmICtZN3ufnUyCVtB_qFnk",
  authDomain: "majdoor-aa733.firebaseapp.com",
  projectId: "majdoor-aa733",
  storageBucket: "majdoor-aa733.firebasestorage.app",
  messagingSenderId: "86971981788",
  appId: "1:86971981788:web:c9a5423d4be2d7ad343919"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Get messaging instance
const messaging = firebase.messaging();

// 🔥 Force the Service Worker to update immediately
self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(clients.claim());
});

// Handle background messages
messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message (Enhanced):', payload);
  
  // 🔥 Extract notification data with prioritized fallbacks
  // FCM sends parameters either in notification object or inside data object
  const title = payload.notification?.title || payload.data?.title || 'Majdoor Sathi Message 📢';
  const body = payload.notification?.body || payload.data?.body || 'New update from Majdoor Sathi';
  const icon = payload.notification?.icon || payload.data?.icon || '/MajdoorSathiLogo.png';
  
  console.log(`[firebase-messaging-sw.js] Dispatching: "${title}" - "${body}"`);

  const options = {
      body: body,
      icon: icon,
      data: payload.data || {},
      tag: payload.data?.collapseKey || 'general_notification',
      vibrate: [200, 100, 200],
      requireInteraction: true // Keep it showing until the user clicks it!
  };
  
  return self.registration.showNotification(title, options)
    .then(() => console.log('[firebase-messaging-sw.js] Notification successfully displayed! ✅'))
    .catch((err) => console.error('[firebase-messaging-sw.js] CRITICAL: Display failed ❌', err));
});

// Handle notification click
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  const data = event.notification.data;
  const urlToOpen = data?.link || '/';
  
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Check if app is already open
      for (const client of clientList) {
        if (client.url === urlToOpen && 'focus' in client) {
          return client.focus();
        }
      }
      // Open new window
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});
