import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000';

class SocketService {
    constructor() {
        this.socket = null;
        this.connected = false;
    }

    connect(token) {
        if (this.socket && this.connected) {
            console.log('[SUCCESS] Socket already connected');
            return this.socket;
        }

        console.log('[INFO] Connecting to Socket.io server:', SOCKET_URL);

        this.socket = io(SOCKET_URL, {
            auth: { token },
            transports: ['websocket', 'polling'],
            reconnection: true,
            reconnectionDelay: 1000,
            reconnectionAttempts: 5
        });

        this.socket.on('connect', () => {
            console.log('[SUCCESS] Socket connected:', this.socket.id);
            this.connected = true;
        });

        this.socket.on('disconnect', (reason) => {
            console.log('[ERROR] Socket disconnected:', reason);
            this.connected = false;
        });

        this.socket.on('connect_error', (error) => {
            console.error('[ERROR] Socket connection error:', error.message);
            this.connected = false;
        });

        return this.socket;
    }

    disconnect() {
        if (this.socket) {
            console.log('[INFO] Disconnecting socket...');
            this.socket.disconnect();
            this.socket = null;
            this.connected = false;
        }
    }

    isConnected() {
        return this.connected && this.socket?.connected;
    }

    // Join a chat room
    joinChat(chatId) {
        if (this.socket && this.connected) {
            console.log('[INFO] Joining chat:', chatId);
            this.socket.emit('join-chat', chatId);
        }
    }

    // Leave a chat room
    leaveChat(chatId) {
        if (this.socket && this.connected) {
            console.log('[INFO] Leaving chat:', chatId);
            this.socket.emit('leave-chat', chatId);
        }
    }

    // Send a message
    sendMessage(data) {
        if (this.socket && this.connected) {
            console.log('[INFO] Sending message:', data);
            this.socket.emit('send-message', data);
        }
    }

    // Listen for incoming messages
    onReceiveMessage(callback) {
        if (this.socket) {
            this.socket.on('receive-message', callback);
        }
    }

    // Remove message listener
    offReceiveMessage() {
        if (this.socket) {
            this.socket.off('receive-message');
        }
    }

    // Mark messages as read
    markAsRead(chatId) {
        if (this.socket && this.connected) {
            console.log('[INFO] Marking messages as read:', chatId);
            this.socket.emit('mark-read', { chatId });
        }
    }

    // Listen for read receipts
    onMessagesRead(callback) {
        if (this.socket) {
            this.socket.on('messages-read', callback);
        }
    }

    // Remove read receipt listener
    offMessagesRead() {
        if (this.socket) {
            this.socket.off('messages-read');
        }
    }

    // Send typing indicator
    sendTyping(chatId, isTyping) {
        if (this.socket && this.connected) {
            this.socket.emit('typing', { chatId, isTyping });
        }
    }

    // Listen for typing indicator
    onUserTyping(callback) {
        if (this.socket) {
            this.socket.on('user-typing', callback);
        }
    }

    // Remove typing listener
    offUserTyping() {
        if (this.socket) {
            this.socket.off('user-typing');
        }
    }
}

export default new SocketService();
