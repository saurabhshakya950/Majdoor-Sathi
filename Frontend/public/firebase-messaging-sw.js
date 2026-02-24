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

// Handle background messages
messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message', payload);
  
  // ⚠️ IMPORTANT: FCM automatically shows the notification if the payload 
  // contains a 'notification' property. Calling registration.showNotification 
  // here causes a DUPLICATE notification. 
  
  // Only call showNotification if you are sending a 'data-only' message
  // and need to construct the notification manually.
  
  /*
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: payload.notification.icon || '/logo.png',
    data: payload.data
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
  */
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
