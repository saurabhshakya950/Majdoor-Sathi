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

        // CRITICAL FIX: Wait for the Service Worker to be fully active/ready 
        // before requesting a token. This prevents the "AbortError: Subscription failed - no active Service Worker"
        const readyRegistration = await navigator.serviceWorker.ready;

        const token = await getToken(messaging, {
            vapidKey: VAPID_KEY,
            serviceWorkerRegistration: readyRegistration
        });

        if (token) {
            localStorage.setItem('fcm_token_web', token);
            return token;
        } else {
            return null;
        }
    } catch (error) {
        if (error.message && error.message.includes('Failed to fetch')) {
            console.warn('📡 FCM Connectivity issue: Unable to reach Google servers. This usually resolves automatically or with a refresh.');
        } else {
            console.error('An error occurred while retrieving token:', error);
        }
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

        const response = await axios.post(`${API_URL}/auth/fcm-token`, 
            { fcmToken: token, platform: 'web' },
            { headers: { Authorization: `Bearer ${accessToken}` } }
        );

        if (response.data?.success) {
            console.log('FCM Token registered with backend');
        }
    } catch (error) {
        // 401 means token expired - silently skip, user will re-register on next login
        if (error.response?.status === 401) {
            return; // Silent fail - non-critical
        }
        // Log other errors but don't crash the app
        console.warn('FCM token registration skipped:', error.message);
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
                icon: icon || '/MajdoorSathiLogo.png',
                badge: '/MajdoorSathiLogo.png',
                data: payload.data
            });
        }
    });
};
