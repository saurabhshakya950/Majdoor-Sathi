import User from '../modules/user/models/User.model.js';
import Admin from '../modules/admin/models/Admin.model.js';
import { sendPushNotification } from './firebaseAdmin.js';

/**
 * Send notification to a specific user by their ID
 * @param {string} userId - The unique identifier of the user
 * @param {Object} payload - Notification details { title, body, data }
 */
export const sendNotificationToUser = async (userId, payload) => {
    try {
        const user = await User.findById(userId);
        if (!user) {
            console.log(`User ${userId} not found for notification`);
            return;
        }

        // 🚀 Collect ALL tokens from both platforms for reliable delivery
        // This ensures that if the user has multiple active sessions (browsers/devices), they receive it on all of them.
        let tokens = [];
        if (user.fcmTokenWeb && Array.isArray(user.fcmTokenWeb)) {
            tokens.push(...user.fcmTokenWeb);
        }
        if (user.fcmTokenMobile && Array.isArray(user.fcmTokenMobile)) {
            tokens.push(...user.fcmTokenMobile);
        }

        // Remove duplicates and empty tokens
        const uniqueTokens = [...new Set(tokens)].filter(token => !!token);

        if (uniqueTokens.length === 0) {
            console.log(`❌ Notification aborted: No active FCM tokens found for user ${userId}`);
            return;
        }

        // Create a unique key for this notification to prevent duplicates (tagging)
        // Check both payload and payload.data for a type
        const notificationType = payload.type || (payload.data && payload.data.type) || 'general';
        const collapseKey = notificationType + '_' + userId;
        
        // Fix: Use localhost during development, otherwise use the first origin from CORS_ORIGIN
        const originUrl = (process.env.CORS_ORIGIN || 'http://localhost:5173').split(',')[0];
        const frontendUrl = process.env.NODE_ENV === 'development' ? 'http://localhost:5173' : originUrl;

        // 🔥 Specific Push logic for BROADCAST type - doesn't affect DB
        let pushTitle = payload.title;
        let pushBody = payload.body;

        if (payload.data?.type === 'BROADCAST' || payload.type === 'BROADCAST') {
            pushTitle = 'admin send new broascast message 📢';
            pushBody = `${payload.title}: ${payload.body}`;
        }

        // Add default logo if not provided
        const finalPayload = {
            ...payload,
            title: pushTitle,
            body: pushBody,
            icon: payload.icon || `${frontendUrl}/MajdoorSathiLogo.png`,
            collapseKey: payload.collapseKey || collapseKey
        };

        console.log(`Sending notification to user ${userId} with ${uniqueTokens.length} tokens`);
        const { failedTokens } = await sendPushNotification(uniqueTokens, finalPayload);
        
        if (failedTokens && failedTokens.length > 0) {
            await cleanupInvalidTokens(failedTokens);
        }
    } catch (error) {
        console.error(`Error in sendNotificationToUser for ${userId}:`, error);
    }
};

/**
 * Send notification to multiple users
 * @param {Array<string>} userIds - Array of user IDs
 * @param {Object} payload - Notification details
 */
export const sendNotificationToMultipleUsers = async (userIds, payload) => {
    try {
        const users = await User.find({ _id: { $in: userIds } });
        
        // Collect all active tokens from all users (both mobile and web platforms)
        let allTokens = [];
        users.forEach(user => {
            if (user.fcmTokenWeb && Array.isArray(user.fcmTokenWeb)) {
                allTokens.push(...user.fcmTokenWeb);
            }
            if (user.fcmTokenMobile && Array.isArray(user.fcmTokenMobile)) {
                allTokens.push(...user.fcmTokenMobile);
            }
        });

        const uniqueTokens = [...new Set(allTokens)].filter(token => !!token);

        if (uniqueTokens.length === 0) {
            console.log('No FCM tokens found for the specified users');
            return;
        }

        const notificationType = payload.type || (payload.data && payload.data.type) || 'multiple';
        const collapseKey = notificationType + '_group';
        
        // Fix: Use localhost during development
        const originUrl = (process.env.CORS_ORIGIN || 'http://localhost:5173').split(',')[0];
        const frontendUrl = process.env.NODE_ENV === 'development' ? 'http://localhost:5173' : originUrl;

        // 🔥 Specific Push logic for BROADCAST type - doesn't affect DB
        let pushTitle = payload.title;
        let pushBody = payload.body;

        if (payload.data?.type === 'BROADCAST' || payload.type === 'BROADCAST') {
            pushTitle = 'admin send new broascast message 📢';
            pushBody = `${payload.title}: ${payload.body}`;
        }

        // Add default logo if not provided
        const finalPayload = {
            ...payload,
            title: pushTitle,
            body: pushBody,
            icon: payload.icon || `${frontendUrl}/MajdoorSathiLogo.png`,
            collapseKey: payload.collapseKey || collapseKey
        };

        const { failedTokens } = await sendPushNotification(uniqueTokens, finalPayload);
        
        if (failedTokens && failedTokens.length > 0) {
            await cleanupInvalidTokens(failedTokens);
        }
    } catch (error) {
        console.error('Error in sendNotificationToMultipleUsers:', error);
    }
};

/**
 * Send notification to all users (Broadcast)
 * @param {Object} payload - Notification details
 */
export const broadcastNotification = async (payload) => {
    try {
        // This might be expensive for many users, ideally we'd use FCM topics
        // but for now we follow the token-based approach from SOP
        const users = await User.find({ 
            $or: [
                { fcmTokenWeb: { $exists: true, $ne: [] } },
                { fcmTokenMobile: { $exists: true, $ne: [] } }
            ]
        });

        console.log(`📣 Broadcasting to ${users.length} unique users`);

        // 🚀 Collect ALL active tokens for broadcast from every user
        let allTokens = [];
        users.forEach(user => {
            if (user.fcmTokenWeb && Array.isArray(user.fcmTokenWeb)) {
                allTokens.push(...user.fcmTokenWeb);
            }
            if (user.fcmTokenMobile && Array.isArray(user.fcmTokenMobile)) {
                allTokens.push(...user.fcmTokenMobile);
            }
        });

        const uniqueTokens = [...new Set(allTokens)].filter(token => !!token);

        console.log(`🎫 Unique tokens for broadcast: ${uniqueTokens.length}`);

        if (uniqueTokens.length === 0) {
            console.log('No tokens found for broadcast');
            return;
        }

        // Send in batches of 500 (FCM limit for multicast)
        const batchSize = 500;
        
        // Use a unique ID for this specific broadcast to prevent duplicates
        const broadcastId = payload.broadcastId || Date.now().toString();
        const collapseKey = `broadcast_${broadcastId}`;
        
        // Fix: Use localhost during development
        const originUrl = (process.env.CORS_ORIGIN || 'http://localhost:5173').split(',')[0];
        const frontendUrl = process.env.NODE_ENV === 'development' ? 'http://localhost:5173' : originUrl;
        const absoluteIconUrl = `${frontendUrl}/MajdoorSathiLogo.png`;

        const finalPayload = {
            ...payload,
            title: 'admin send new broascast message 📢',
            body: `${payload.title}: ${payload.body}`,
            icon: payload.icon || absoluteIconUrl,
            collapseKey: collapseKey
        };

        console.log(`📣 Sending broadcast batch to ${uniqueTokens.length} tokens. Tag: ${collapseKey}`);

        for (let i = 0; i < uniqueTokens.length; i += batchSize) {
            const batch = uniqueTokens.slice(i, i + batchSize);
            const { failedTokens } = await sendPushNotification(batch, finalPayload);
            
            if (failedTokens && failedTokens.length > 0) {
                await cleanupInvalidTokens(failedTokens);
            }
        }
    } catch (error) {
        console.error('Error in broadcastNotification:', error);
    }
};

/**
 * Send push notification to all active admins
 * @param {Object} payload - Notification details { title, body, data }
 */
export const sendNotificationToAdmin = async (payload) => {
    try {
        const admins = await Admin.find({ isActive: true });

        let allTokens = [];
        admins.forEach(admin => {
            if (admin.fcmTokenWeb && admin.fcmTokenWeb.length > 0) {
                allTokens.push(admin.fcmTokenWeb[admin.fcmTokenWeb.length - 1]);
            }
            if (admin.fcmTokenMobile && admin.fcmTokenMobile.length > 0) {
                allTokens.push(admin.fcmTokenMobile[admin.fcmTokenMobile.length - 1]);
            }
        });

        const uniqueTokens = [...new Set(allTokens)].filter(token => !!token);

        if (uniqueTokens.length === 0) {
            console.log('[ADMIN NOTIFY] No active FCM tokens found for admins');
            return;
        }

        // Fix: Use localhost during development
        const originUrl = (process.env.CORS_ORIGIN || 'http://localhost:5173').split(',')[0];
        const frontendUrl = process.env.NODE_ENV === 'development' ? 'http://localhost:5173' : originUrl;
        
        const finalPayload = {
            ...payload,
            icon: payload.icon || `${frontendUrl}/MajdoorSathiLogo.png`,
        };

        console.log(`[ADMIN NOTIFY] Sending notification to ${uniqueTokens.length} admin token(s)`);
        const { failedTokens } = await sendPushNotification(uniqueTokens, finalPayload);
        
        if (failedTokens && failedTokens.length > 0) {
            // We need to implement cleanup for admins too if they have fcm tokens
            await Admin.updateMany(
                {},
                { 
                    $pull: { 
                        fcmTokenWeb: { $in: failedTokens },
                        fcmTokenMobile: { $in: failedTokens }
                    } 
                }
            );
        }
    } catch (error) {
        console.error('Error in sendNotificationToAdmin:', error);
    }
};
/**
 * Remove invalid FCM tokens from all users
 * @param {Array<string>} failedTokens - List of tokens that failed with NotRegistered error
 */
const cleanupInvalidTokens = async (failedTokens) => {
    try {
        if (!failedTokens || failedTokens.length === 0) return;
        
        console.log(`🧹 Cleaning up ${failedTokens.length} invalid tokens...`);
        
        await User.updateMany(
            {},
            { 
                $pull: { 
                    fcmTokenWeb: { $in: failedTokens },
                    fcmTokenMobile: { $in: failedTokens }
                } 
            }
        );
        
        console.log('✅ Token cleanup complete');
    } catch (error) {
        console.error('Error during token cleanup:', error);
    }
};
