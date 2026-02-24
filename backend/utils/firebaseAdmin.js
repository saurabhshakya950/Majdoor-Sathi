import admin from 'firebase-admin';
import { readFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const serviceAccountPath = path.join(__dirname, '../config/majdoor-aa733-firebase-adminsdk-fbsvc-af716dcd7d.json');
const serviceAccount = JSON.parse(readFileSync(serviceAccountPath, 'utf8'));

if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });
}

/**
 * Send push notification to specific users
 * @param {Array<string>} tokens - Array of FCM tokens
 * @param {Object} payload - Notification payload { title, body, data, icon }
 */
export const sendPushNotification = async (tokens, payload) => {
    if (!tokens || tokens.length === 0) {
        console.log('No FCM tokens provided to send notification');
        return;
    }

    try {
        const messages = tokens.map(token => ({
            token,
            notification: {
                title: payload.title,
                body: payload.body,
            },
            data: payload.data || {},
            android: {
                collapseKey: payload.collapseKey || 'broadcast_tag',
                notification: {
                    icon: 'stock_ticker_update',
                    color: '#fbbf24',
                    imageUrl: payload.image || undefined,
                    notificationCount: 1,
                    tag: payload.collapseKey || 'broadcast_tag'
                }
            },
            webpush: {
                headers: {
                    Urgency: 'high'
                },
                notification: {
                    title: payload.title,
                    body: payload.body,
                    icon: payload.icon || 'https://majdoorgroup.com/wp-content/uploads/2023/07/cropped-Favicon-32x32.png', // Fallback to a stable URL if local fails
                    badge: payload.icon || '/logo.png',
                    image: payload.image || undefined,
                    tag: payload.collapseKey || 'broadcast_tag',
                    renotify: false, // Prevents multiple beeps if duplicates arrive
                    requireInteraction: true,
                    data: payload.data || {}
                }
            }
        }));

        const results = await Promise.all(
            messages.map(msg => 
                admin.messaging().send(msg)
                    .then(res => ({ success: true, res }))
                    .catch(error => ({ success: false, error }))
            )
        );

        const successCount = results.filter(r => r.success).length;
        const failureCount = results.length - successCount;

        console.log(`🚀 Push Notification Summary: ${successCount} sent, ${failureCount} failed.`);
        
        return { successCount, failureCount };
    } catch (error) {
        console.error('CRITICAL: Error in push notification delivery:', error);
    }
};

export default admin;
