import { messaging } from '../firebase';
import { getToken, onMessage } from 'firebase/messaging';
import axios from 'axios';

const VAPID_KEY = "BH8WsSZMruTu_hgzDW590DzCVdtp7ggt-qOYygjXPcmk9MyQYLpyoU7eaHwV07LEgxLxgtE_Se4q7jCbuHoqIug";
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

/**
 * Register the Service Worker for FCM
 */
export const registerServiceWorker = async () => {
    if ('serviceWorker' in navigator) {
        try {
            const registration = await navigator.serviceWorker.getRegistration('/firebase-messaging-sw.js');
            if (registration) return registration;
            
            return await navigator.serviceWorker.register('/firebase-messaging-sw.js');
        } catch (error) {
            console.error('Service Worker registration failed:', error);
            return null;
        }
    }
    return null;
};

/**
 * Get FCM Token for the current browser
 */
export const getFCMToken = async () => {
    try {
        const permission = await Notification.requestPermission();
        if (permission !== 'granted') {
            console.log('Notification permission not granted');
            return null;
        }

        const registration = await registerServiceWorker();
        if (!registration) return null;

        const token = await getToken(messaging, {
            vapidKey: VAPID_KEY,
            serviceWorkerRegistration: registration
        });

        if (token) {
            console.log('FCM Token generated:', token);
            localStorage.setItem('fcm_token_web', token);
            return token;
        } else {
            console.log('No registration token available. Request permission to generate one.');
            return null;
        }
    } catch (error) {
        console.error('An error occurred while retrieving token:', error);
        return null;
    }
};

/**
 * Send the FCM token to the backend
 */
export const registerTokenWithBackend = async (token) => {
    try {
        const accessToken = localStorage.getItem('access_token');
        if (!accessToken || !token) return;

        await axios.post(`${API_URL}/auth/fcm-token`, 
            { fcmToken: token, platform: 'web' },
            { headers: { Authorization: `Bearer ${accessToken}` } }
        );
        console.log('FCM Token registered with backend');
    } catch (error) {
        console.error('Failed to register FCM token with backend:', error);
    }
};

/**
 * Initialize Push Notifications and handle foreground messages
 */
export const initializePushNotifications = () => {
    onMessage(messaging, (payload) => {
        console.log('Message received in foreground: ', payload);
        
        // Browsers typically don't show notifications automatically in the foreground
        // ⚠️ To prevent duplicates when multiple tabs are open, only show if this tab is visible
        if (Notification.permission === 'granted' && payload.notification && document.visibilityState === 'visible') {
            const { title, body, icon } = payload.notification;
            new Notification(title, {
                body,
                icon: icon || '/logo.png', // Default to logo.png
                badge: '/logo.png',
                data: payload.data
            });
        }
    });
};
