import Chat from '../models/Chat.model.js';
import Message from '../models/Message.model.js';
import User from '../modules/user/models/User.model.js';
import Labour from '../modules/labour/models/Labour.model.js';
import Contractor from '../modules/contractor/models/Contractor.model.js';
import { sendNotificationToUser } from '../utils/notificationHelper.js';

// @desc    Create chat from hire request (called automatically on accept)
// @route   Internal function
// @access  Private
export const createChatFromRequest = async (requestData) => {
    try {
        const isDev = process.env.NODE_ENV === 'development';
        
        if (isDev) {
            console.log('\n🟢 ===== CREATE CHAT FROM REQUEST =====');
            console.log('📦 Request Data:', JSON.stringify(requestData, null, 2));
        }

        const {
            participant1,
            participant2,
            relatedRequest
        } = requestData;

        const userId1 = participant1.userId.toString();
        const userId2 = participant2.userId.toString();

        if (isDev) {
            console.log('👥 Checking for existing chat between:');
            console.log('   Participant 1:', userId1, `(${participant1.userType})`);
            console.log('   Participant 2:', userId2, `(${participant2.userType})`);
        }

        // ✅ FIRST: Check if chat exists between these two participants (most important check)
        let existingChat = await Chat.findOne({
            $and: [
                { 'participants.userId': userId1 },
                { 'participants.userId': userId2 }
            ],
            isActive: true
        });

        if (existingChat) {
            if (isDev) {
                console.log('✅ FOUND existing chat between these participants:', existingChat._id);
                console.log('   Reusing existing chat instead of creating new one');
            }
            
            // Update relatedRequest to link this new interaction to existing chat
            if (!existingChat.relatedRequest || existingChat.relatedRequest.requestId.toString() !== relatedRequest.requestId.toString()) {
                if (isDev) console.log('   Updating relatedRequest reference to new interaction');
                existingChat.relatedRequest = relatedRequest;
                await existingChat.save();
            }
            
            if (isDev) console.log('===========================\n');
            return existingChat;
        }

        // SECOND: Check by specific request ID (in case participants check failed)
        existingChat = await Chat.findOne({
            'relatedRequest.requestId': relatedRequest.requestId
        });

        if (existingChat) {
            if (isDev) {
                console.log('⚠️ Chat already exists for this specific request:', existingChat._id);
                console.log('===========================\n');
            }
            return existingChat;
        }

        // No existing chat found - create new one
        if (isDev) console.log('📝 No existing chat found, creating new chat...');
        
        const chat = await Chat.create({
            participants: [participant1, participant2],
            relatedRequest,
            isActive: true,
            unreadCount: {
                [userId1]: 0,
                [userId2]: 0
            }
        });

        if (isDev) {
            console.log('✅ New chat created successfully:', chat._id);
            console.log('===========================\n');
        }

        return chat;
    } catch (error) {
        console.error('❌ CREATE CHAT ERROR:', error.message);
        if (process.env.NODE_ENV === 'development') {
            console.error('Stack:', error.stack);
            console.log('===========================\n');
        }
        throw error;
    }
};

// @desc    Initialize or Get Chat (WhatsApp-like start)
// @route   POST /api/chat/initialize
// @access  Private
export const initializeChat = async (req, res) => {
    try {
        const { 
            participant2Id, 
            participant2Type, 
            participant2Name, 
            participant2Photo, 
            participant2Phone,
            requestId,
            requestType 
        } = req.body;
        const userId = req.user._id;

        console.log('\n🟢 ===== INITIALIZE CHAT =====');
        console.log('User ID:', userId);
        console.log('Participant 2 ID:', participant2Id);

        // 1. Check for existing chat between these two
        let chat = await Chat.findOne({
            $and: [
                { 'participants.userId': userId },
                { 'participants.userId': participant2Id }
            ],
            isActive: true
        });

        if (chat) {
            console.log('✅ Found existing chat:', chat._id);
            return res.status(200).json({
                success: true,
                data: { chat }
            });
        }

        // 2. Create new chat if not found
        console.log('📝 Creating new chat...');

        // Robust name fetching for sender
        const getParticipantName = async (u) => {
            if (!u) return 'User';
            const firstName = u.firstName || '';
            const lastName = u.lastName || '';
            let fullName = `${firstName} ${lastName}`.trim();
            
            if (!fullName || fullName === 'null null' || fullName === 'Contractor' || fullName === 'Labour') {
                // Try to get from role-specific profile if it's a User object
                // If it's already a Labour/Contractor object, use its name fields
                if (u.userType === 'Labour' || (u.hasOwnProperty('skillType') && !u.hasOwnProperty('businessName'))) {
                    const labour = u.hasOwnProperty('skillType') ? u : await Labour.findOne({ user: u._id });
                    if (labour) {
                        fullName = `${labour.firstName || ''} ${labour.lastName || ''}`.trim() || labour.labourCardDetails?.fullName;
                    }
                } else if (u.userType === 'Contractor' || u.hasOwnProperty('businessName')) {
                    const contractor = u.hasOwnProperty('businessName') ? u : await Contractor.findOne({ user: u._id });
                    if (contractor) {
                        fullName = `${contractor.firstName || ''} ${contractor.lastName || ''}`.trim() || contractor.businessName;
                    }
                }
                
                // Final fallback to User model if still empty
                if (!fullName || fullName === 'null null') {
                    const user = await User.findById(u._id || u.user);
                    if (user) {
                        fullName = `${user.firstName || ''} ${user.lastName || ''}`.trim();
                    }
                }
            }
            
            // Clean up unwanted strings
            if (fullName === 'null null') fullName = '';
            
            return fullName || u.userType || 'User';
        };

        const senderName = await getParticipantName(req.user);
        
        // Robust name fetching for participant 2 if name is invalid
        let finalParticipant2Name = (participant2Name || '').toString().trim();
        if (!finalParticipant2Name || finalParticipant2Name === 'null null') {
            const p2User = await User.findById(participant2Id);
            if (p2User) {
                finalParticipant2Name = await getParticipantName(p2User);
            } else {
                finalParticipant2Name = participant2Type || 'User';
            }
        }
        
        const chatData = {
            participants: [
                {
                    userId: userId,
                    userType: req.user.userType || 'User',
                    name: senderName,
                    profilePhoto: req.user.profilePhoto || '',
                    mobileNumber: req.user.mobileNumber
                },
                {
                    userId: participant2Id,
                    userType: participant2Type,
                    name: finalParticipant2Name,
                    profilePhoto: participant2Photo || '',
                    mobileNumber: participant2Phone
                }
            ],
            unreadCount: {
                [userId.toString()]: 0,
                [participant2Id.toString()]: 0
            },
            isActive: true
        };

        if (requestId && requestType) {
            chatData.relatedRequest = { requestId, requestType };
        }

        chat = await Chat.create(chatData);

        console.log('✅ New chat created:', chat._id);
        console.log('===========================\n');

        res.status(201).json({
            success: true,
            data: { chat }
        });
    } catch (error) {
        console.error('❌ INITIALIZE CHAT ERROR:', error.message);
        res.status(500).json({
            success: false,
            message: 'Failed to initialize chat',
            error: error.message
        });
    }
};

// @desc    Get all chats for logged-in user
// @route   GET /api/chat/chats
// @access  Private
export const getUserChats = async (req, res) => {
    try {
        const userId = req.user._id;

        // Find all chats where user is a participant
        const chats = await Chat.find({
            'participants.userId': userId,
            isActive: true
        }).sort({ 'lastMessage.timestamp': -1, createdAt: -1 });

        // Format chats for frontend
        const formattedChats = await Promise.all(chats.map(async (chat) => {
            // Find the other participant
            const otherParticipant = chat.participants.find(
                p => p.userId.toString() !== userId.toString()
            );

            let displayName = otherParticipant.name;

            // Robust name resolution for existing bad data
            if (!displayName || displayName === 'null null' || displayName === otherParticipant.userType || displayName === 'User') {
                // Try User model first
                const user = await User.findById(otherParticipant.userId);
                if (user) {
                    const first = user.firstName || '';
                    const last = user.lastName || '';
                    displayName = `${first} ${last}`.trim();
                }

                // If still bad, try role-specific profiles
                if (!displayName || displayName === 'null null' || displayName === '') {
                    if (otherParticipant.userType === 'Labour') {
                        const labour = await Labour.findOne({ user: otherParticipant.userId });
                        if (labour) displayName = `${labour.firstName || ''} ${labour.lastName || ''}`.trim() || labour.labourCardDetails?.fullName;
                    } else if (otherParticipant.userType === 'Contractor') {
                        const contractor = await Contractor.findOne({ user: otherParticipant.userId });
                        if (contractor) displayName = `${contractor.firstName || ''} ${contractor.lastName || ''}`.trim() || contractor.businessName;
                    }
                }

                // Final cleanup and fallback
                displayName = (displayName && displayName !== 'null null') ? displayName : (otherParticipant.userType || 'User');

                // Lazy-update the database so we don't have to fetch again
                if (displayName && displayName !== otherParticipant.name) {
                    Chat.updateOne(
                        { _id: chat._id, 'participants.userId': otherParticipant.userId },
                        { '$set': { 'participants.$.name': displayName } }
                    ).catch(err => console.error('Lazy update name error:', err));
                }
            }

            return {
                _id: chat._id,
                otherParticipant: {
                    userId: otherParticipant.userId,
                    userType: otherParticipant.userType,
                    name: displayName,
                    profilePhoto: otherParticipant.profilePhoto,
                    mobileNumber: otherParticipant.mobileNumber
                },
                lastMessage: chat.lastMessage.text || 'No messages yet',
                lastMessageTime: chat.lastMessage.timestamp || chat.createdAt,
                unreadCount: chat.unreadCount.get(userId.toString()) || 0,
                createdAt: chat.createdAt
            };
        }));

        res.status(200).json({
            success: true,
            data: {
                chats: formattedChats,
                count: formattedChats.length
            }
        });
    } catch (error) {
        console.error('❌ GET USER CHATS ERROR:', error.message);
        res.status(500).json({
            success: false,
            message: 'Failed to get chats',
            error: error.message
        });
    }
};

// @desc    Get specific chat by ID
// @route   GET /api/chat/chats/:chatId
// @access  Private
export const getChatById = async (req, res) => {
    try {
        const { chatId } = req.params;
        const userId = req.user._id;

        console.log('\n🔵 ===== GET CHAT BY ID =====');
        console.log('Chat ID:', chatId);
        console.log('User ID:', userId);

        const chat = await Chat.findById(chatId);

        if (!chat) {
            return res.status(404).json({
                success: false,
                message: 'Chat not found'
            });
        }

        // Verify user is a participant
        const isParticipant = chat.participants.some(
            p => p.userId.toString() === userId.toString()
        );

        if (!isParticipant) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to access this chat'
            });
        }

        // Find the other participant
        const otherParticipant = chat.participants.find(
            p => p.userId.toString() !== userId.toString()
        );

        let otherName = otherParticipant.name;
        // Resolve bad name in details view
        if (!otherName || otherName === 'null null' || otherName === otherParticipant.userType || otherName === 'User') {
            const user = await User.findById(otherParticipant.userId);
            if (user) otherName = `${user.firstName || ''} ${user.lastName || ''}`.trim();
            
            if (!otherName || otherName === 'null null' || otherName === '') {
                if (otherParticipant.userType === 'Labour') {
                    const labour = await Labour.findOne({ user: otherParticipant.userId });
                    if (labour) otherName = `${labour.firstName || ''} ${labour.lastName || ''}`.trim() || labour.labourCardDetails?.fullName;
                } else if (otherParticipant.userType === 'Contractor') {
                    const contractor = await Contractor.findOne({ user: otherParticipant.userId });
                    if (contractor) otherName = `${contractor.firstName || ''} ${contractor.lastName || ''}`.trim() || contractor.businessName;
                }
            }
            
            otherName = (otherName && otherName !== 'null null') ? otherName : (otherParticipant.userType || 'User');

            // Lazy update
            if (otherName !== otherParticipant.name) {
                Chat.updateOne(
                    { _id: chat._id, 'participants.userId': otherParticipant.userId },
                    { '$set': { 'participants.$.name': otherName } }
                ).catch(e => console.error(e));
            }
        }

        console.log('✅ Chat found');
        console.log('===========================\n');

        res.status(200).json({
            success: true,
            data: {
                chat: {
                    _id: chat._id,
                    otherParticipant: {
                        ...otherParticipant.toObject(),
                        name: otherName
                    },
                    participants: chat.participants.map(p => {
                        const isOther = p.userId.toString() === otherParticipant.userId.toString();
                        return {
                            ...p.toObject(),
                            name: isOther ? otherName : p.name
                        };
                    }),
                    createdAt: chat.createdAt
                }
            }
        });
    } catch (error) {
        console.error('❌ GET CHAT BY ID ERROR:', error.message);
        console.log('===========================\n');
        res.status(500).json({
            success: false,
            message: 'Failed to get chat',
            error: error.message
        });
    }
};

// @desc    Get messages for a chat
// @route   GET /api/chat/chats/:chatId/messages
// @access  Private
export const getChatMessages = async (req, res) => {
    try {
        const { chatId } = req.params;
        const userId = req.user._id;
        const { page = 1, limit = 50 } = req.query;

        console.log('\n🔵 ===== GET CHAT MESSAGES =====');
        console.log('Chat ID:', chatId);
        console.log('User ID:', userId);

        // Verify chat exists and user is participant
        const chat = await Chat.findById(chatId);

        if (!chat) {
            return res.status(404).json({
                success: false,
                message: 'Chat not found'
            });
        }

        const isParticipant = chat.participants.some(
            p => p.userId.toString() === userId.toString()
        );

        if (!isParticipant) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to access this chat'
            });
        }

        // Get messages with pagination
        const messages = await Message.find({ chatId })
            .sort({ createdAt: 1 })
            .limit(limit * 1)
            .skip((page - 1) * limit);

        const total = await Message.countDocuments({ chatId });

        console.log('✅ Found', messages.length, 'messages');
        console.log('===========================\n');

        res.status(200).json({
            success: true,
            data: {
                messages,
                pagination: {
                    total,
                    page: parseInt(page),
                    pages: Math.ceil(total / limit)
                }
            }
        });
    } catch (error) {
        console.error('❌ GET CHAT MESSAGES ERROR:', error.message);
        console.log('===========================\n');
        res.status(500).json({
            success: false,
            message: 'Failed to get messages',
            error: error.message
        });
    }
};

// @desc    Send message
// @route   POST /api/chat/chats/:chatId/messages
// @access  Private
export const sendMessage = async (req, res) => {
    try {
        const { chatId } = req.params;
        const userId = req.user._id;
        const { content, messageType = 'text', imageUrl = '' } = req.body;

        console.log('\n🟢 ===== SEND MESSAGE =====');
        console.log('Chat ID:', chatId);
        console.log('Sender ID:', userId);
        console.log('Content:', content);

        // Verify chat exists and user is participant
        const chat = await Chat.findById(chatId);

        if (!chat) {
            return res.status(404).json({
                success: false,
                message: 'Chat not found'
            });
        }

        const sender = chat.participants.find(
            p => p.userId.toString() === userId.toString()
        );

        if (!sender) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to send messages in this chat'
            });
        }

        const receiver = chat.participants.find(
            p => p.userId.toString() !== userId.toString()
        );

        // Create message
        const message = await Message.create({
            chatId,
            senderId: sender.userId,
            senderType: sender.userType,
            senderName: sender.name,
            receiverId: receiver.userId,
            receiverType: receiver.userType,
            messageType,
            content,
            imageUrl,
            isRead: false
        });

        // Update chat's lastMessage
        chat.lastMessage = {
            text: content,
            senderId: sender.userId,
            timestamp: new Date()
        };

        // Increment unread count for receiver
        const receiverUnreadCount = chat.unreadCount.get(receiver.userId.toString()) || 0;
        chat.unreadCount.set(receiver.userId.toString(), receiverUnreadCount + 1);

        await chat.save();

        // Send Push Notification to receiver
        if (receiver && receiver.userId) {
            const senderDisplayName = (sender.name || '').toString().trim();
            const notificationTitle = `New message from ${senderDisplayName && senderDisplayName !== 'null null' ? senderDisplayName : 'someone'}`;
            
            await sendNotificationToUser(receiver.userId.toString(), {
                title: notificationTitle,
                body: messageType === 'image' ? 'Sent an image' : content,
                data: {
                    type: 'chat_message',
                    chatId: chatId.toString(),
                    senderId: userId.toString(),
                    link: `/chat/${chatId}` // Assuming this is the link structure
                }
            });
        }

        console.log('✅ Message sent successfully');
        console.log('===========================\n');

        res.status(201).json({
            success: true,
            message: 'Message sent successfully',
            data: { message }
        });
    } catch (error) {
        console.error('❌ SEND MESSAGE ERROR:', error.message);
        console.log('===========================\n');
        res.status(500).json({
            success: false,
            message: 'Failed to send message',
            error: error.message
        });
    }
};

// @desc    Mark messages as read
// @route   PATCH /api/chat/chats/:chatId/read
// @access  Private
export const markMessagesAsRead = async (req, res) => {
    try {
        const { chatId } = req.params;
        const userId = req.user._id;

        console.log('\n🟡 ===== MARK MESSAGES AS READ =====');
        console.log('Chat ID:', chatId);
        console.log('User ID:', userId);

        // Verify chat exists and user is participant
        const chat = await Chat.findById(chatId);

        if (!chat) {
            return res.status(404).json({
                success: false,
                message: 'Chat not found'
            });
        }

        const isParticipant = chat.participants.some(
            p => p.userId.toString() === userId.toString()
        );

        if (!isParticipant) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to access this chat'
            });
        }

        // Mark all unread messages as read
        await Message.updateMany(
            {
                chatId,
                receiverId: userId,
                isRead: false
            },
            {
                isRead: true,
                readAt: new Date()
            }
        );

        // Reset unread count for this user
        chat.unreadCount.set(userId.toString(), 0);
        await chat.save();

        console.log('✅ Messages marked as read');
        console.log('===========================\n');

        res.status(200).json({
            success: true,
            message: 'Messages marked as read'
        });
    } catch (error) {
        console.error('❌ MARK MESSAGES AS READ ERROR:', error.message);
        console.log('===========================\n');
        res.status(500).json({
            success: false,
            message: 'Failed to mark messages as read',
            error: error.message
        });
    }
};

// @desc    Delete chat (soft delete)
// @route   DELETE /api/chat/chats/:chatId
// @access  Private
export const deleteChat = async (req, res) => {
    try {
        const { chatId } = req.params;
        const userId = req.user._id;

        console.log('\n🔴 ===== DELETE CHAT =====');
        console.log('Chat ID:', chatId);
        console.log('User ID:', userId);

        const chat = await Chat.findById(chatId);

        if (!chat) {
            return res.status(404).json({
                success: false,
                message: 'Chat not found'
            });
        }

        const isParticipant = chat.participants.some(
            p => p.userId.toString() === userId.toString()
        );

        if (!isParticipant) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to delete this chat'
            });
        }

        // Soft delete
        chat.isActive = false;
        await chat.save();

        console.log('✅ Chat deleted');
        console.log('===========================\n');

        res.status(200).json({
            success: true,
            message: 'Chat deleted successfully'
        });
    } catch (error) {
        console.error('❌ DELETE CHAT ERROR:', error.message);
        console.log('===========================\n');
        res.status(500).json({
            success: false,
            message: 'Failed to delete chat',
            error: error.message
        });
    }
};
