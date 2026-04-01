import admin from 'firebase-admin';
import { readFileSync, existsSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let serviceAccount;

try {
    // 1. First try to load from Environment Variable (Render/Production)
    if (process.env.FIREBASE_SERVICE_ACCOUNT) {
        serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
    } 
    // 2. Fallback to Local JSON file (Localhost development)
    else {
        const serviceAccountPath = path.join(__dirname, '../config/majdoor-aa733-firebase-adminsdk-fbsvc-af716dcd7d.json');
        if (existsSync(serviceAccountPath)) {
            serviceAccount = JSON.parse(readFileSync(serviceAccountPath, 'utf8'));
        }
    }

    if (serviceAccount && !admin.apps.length) {
        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount)
        });
        console.log('✅ Firebase Admin initialized successfully');
    } else if (!serviceAccount) {
        console.warn('⚠️ Firebase Credentials missing. Push notifications will not work.');
    }
} catch (error) {
    console.error('🔥 Error Initializing Firebase Admin:', error.message);
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
                    .then(res => ({ success: true, res, token: msg.token }))
                    .catch(error => {
                        console.error(`❌ FCM Send Error for token ${msg.token.substring(0, 10)}...:`, error.message);
                        return { success: false, error, token: msg.token };
                    })
            )
        );

        const successCount = results.filter(r => r.success).length;
        const failures = results.filter(r => !r.success);
        const failureCount = failures.length;

        // Collect failed tokens for cleanup
        const failedTokens = failures.map(f => f.token);

        console.log(`🚀 Push Notification Summary: ${successCount} sent, ${failureCount} failed.`);
        
        if (failureCount > 0) {
            console.log('⚠️ Some notifications failed. Returning failed tokens for cleanup.');
        }
        
        return { successCount, failureCount, failedTokens };
    } catch (error) {
        console.error('CRITICAL: Error in push notification delivery:', error);
        return { successCount: 0, failureCount: 0, failedTokens: [] };
    }
};

export default admin;
