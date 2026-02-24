import User from '../modules/user/models/User.model.js';
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

        // Only send to the most recent token for each platform to avoid duplicates
        const tokens = [];
        if (user.fcmTokenWeb && user.fcmTokenWeb.length > 0) {
            tokens.push(user.fcmTokenWeb[user.fcmTokenWeb.length - 1]);
        }
        if (user.fcmTokenMobile && user.fcmTokenMobile.length > 0) {
            tokens.push(user.fcmTokenMobile[user.fcmTokenMobile.length - 1]);
        }

        // Remove duplicates and empty tokens
        const uniqueTokens = [...new Set(tokens)].filter(token => !!token);

        if (uniqueTokens.length === 0) {
            console.log(`No active FCM tokens found for user ${userId}`);
            return;
        }

        // Create a unique key for this notification to prevent duplicates (tagging)
        // Check both payload and payload.data for a type
        const notificationType = payload.type || (payload.data && payload.data.type) || 'general';
        const collapseKey = notificationType + '_' + userId;
        const frontendUrl = (process.env.CORS_ORIGIN || 'http://localhost:5173').split(',')[0];

        // Add default logo if not provided
        const finalPayload = {
            ...payload,
            icon: `${frontendUrl}/logo.png`,
            collapseKey: payload.collapseKey || collapseKey
        };

        console.log(`Sending notification to user ${userId} with ${uniqueTokens.length} tokens`);
        await sendPushNotification(uniqueTokens, finalPayload);
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
        
        // Collect only the most recent token from each user to prevent duplicates
        let allTokens = [];
        users.forEach(user => {
            if (user.fcmTokenWeb && user.fcmTokenWeb.length > 0) {
                allTokens.push(user.fcmTokenWeb[user.fcmTokenWeb.length - 1]);
            }
            if (user.fcmTokenMobile && user.fcmTokenMobile.length > 0) {
                allTokens.push(user.fcmTokenMobile[user.fcmTokenMobile.length - 1]);
            }
        });

        const uniqueTokens = [...new Set(allTokens)].filter(token => !!token);

        if (uniqueTokens.length === 0) {
            console.log('No FCM tokens found for the specified users');
            return;
        }

        const notificationType = payload.type || (payload.data && payload.data.type) || 'multiple';
        const collapseKey = notificationType + '_group';
        const frontendUrl = (process.env.CORS_ORIGIN || 'http://localhost:5173').split(',')[0];

        // Add default logo if not provided
        const finalPayload = {
            ...payload,
            icon: `${frontendUrl}/logo.png`,
            collapseKey: payload.collapseKey || collapseKey
        };

        await sendPushNotification(uniqueTokens, finalPayload);
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

        let allTokens = [];
        users.forEach(user => {
            if (user.fcmTokenWeb && user.fcmTokenWeb.length > 0) {
                allTokens.push(user.fcmTokenWeb[user.fcmTokenWeb.length - 1]);
            }
            if (user.fcmTokenMobile && user.fcmTokenMobile.length > 0) {
                allTokens.push(user.fcmTokenMobile[user.fcmTokenMobile.length - 1]);
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
        
        // Try to get frontend URL from CORS_ORIGIN for absolute icon path
        // This helps browsers load the logo reliably
        const frontendUrl = (process.env.CORS_ORIGIN || 'http://localhost:5173').split(',')[0];
        const absoluteIconUrl = `${frontendUrl}/logo.png`;

        const finalPayload = {
            ...payload,
            icon: absoluteIconUrl,
            collapseKey: collapseKey
        };

        console.log(`📣 Sending broadcast batch to ${uniqueTokens.length} tokens. Tag: ${collapseKey}`);

        for (let i = 0; i < uniqueTokens.length; i += batchSize) {
            const batch = uniqueTokens.slice(i, i + batchSize);
            await sendPushNotification(batch, finalPayload);
        }
    } catch (error) {
        console.error('Error in broadcastNotification:', error);
    }
};
