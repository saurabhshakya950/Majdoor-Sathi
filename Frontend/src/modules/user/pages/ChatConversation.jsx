import { useState, useCallback, useRef, useEffect } from 'react';
import { ArrowLeft, Send, MoreVertical, Trash2, Ban } from 'lucide-react';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import { chatAPI } from '../../../services/api';
import socketService from '../../../services/socket';

const ChatConversation = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { id: chatId } = useParams();
    const messagesEndRef = useRef(null);
    const messagesContainerRef = useRef(null);
    const inputRef = useRef(null);

    const [chat, setChat] = useState(location.state?.chat || null);
    const [message, setMessage] = useState('');
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const [showMenu, setShowMenu] = useState(false);
    const [messages, setMessages] = useState([]);
    const [loading, setLoading] = useState(true);
    const [currentUserId, setCurrentUserId] = useState(null);

    const emojis = [
        '😊', '😂', '🤣', '😍', '😘', '😎', '🥰', '😇', '🤗', '🤔',
        '😢', '😭', '😡', '🤬', '😱', '😨', '🥺', '😳', '🙄', '😴',
        '❤️', '💕', '💖', '💗', '💙', '💚', '💛', '🧡', '💜', '🖤',
        '👍', '👎', '👏', '🙏', '💪', '👌', '✌️', '🤝', '👋', '🤚',
        '👷', '🔧', '🔨', '🪚', '🏗️', '🏠', '🚧', '⚠️', '✅', '❌',
        '🎉', '🎊', '🔥', '💯', '⭐', '✨', '💫', '🌟', '☀️', '🌙',
        '📞', '📱', '💼', '📋', '📝', '💰', '💵', '💳', '🏆', '🎯'
    ];

    useEffect(() => {
        // Get current user ID from localStorage
        const userStr = localStorage.getItem('user');
        if (userStr) {
            const user = JSON.parse(userStr);
            setCurrentUserId(user._id);
        }

        loadChatAndMessages();

        // Connect socket and join chat room
        const token = localStorage.getItem('access_token');
        if (token) {
            socketService.connect(token);
            socketService.joinChat(chatId);

            // Listen for new messages
            socketService.onReceiveMessage((newMessage) => {
                if (newMessage.chatId === chatId) {
                    console.log('📨 New message received:', newMessage);

                    // ✅ Avoid duplicate messages - only add if not already in state
                    setMessages(prev => {
                        const messageExists = prev.some(msg => msg._id === newMessage._id);
                        if (messageExists) {
                            return prev;
                        }
                        return [...prev, newMessage];
                    });

                    // Mark as read
                    chatAPI.markAsRead(chatId);
                }
            });
        }

        return () => {
            socketService.leaveChat(chatId);
            socketService.offReceiveMessage();
        };
    }, [chatId]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    useEffect(() => {
        const container = messagesContainerRef.current;
        const handleScroll = () => showMenu && setShowMenu(false);
        container?.addEventListener('scroll', handleScroll);
        return () => container?.removeEventListener('scroll', handleScroll);
    }, [showMenu]);

    const loadChatAndMessages = async () => {
        try {
            setLoading(true);

            // Load chat details if not provided
            if (!chat) {
                const chatResponse = await chatAPI.getChatById(chatId);
                if (chatResponse.success) {
                    setChat(chatResponse.data.chat);
                }
            }

            // Load messages
            const messagesResponse = await chatAPI.getChatMessages(chatId);
            if (messagesResponse.success) {
                setMessages(messagesResponse.data.messages);
            }

            // Mark messages as read
            await chatAPI.markAsRead(chatId);
        } catch (error) {
            console.error('Failed to load chat:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSendMessage = useCallback(async () => {
        if (!message.trim()) return;

        try {
            const messageData = {
                content: message,
                messageType: 'text'
            };

            // Send via API
            const response = await chatAPI.sendMessage(chatId, messageData);

            if (response.success) {
                const newMessage = response.data.message;

                // ✅ Add message to local state immediately
                setMessages(prev => [...prev, newMessage]);

                // Emit via Socket.io for real-time delivery to other user
                socketService.sendMessage({
                    ...newMessage,
                    chatId
                });

                setMessage('');
                setShowEmojiPicker(false);
            }
        } catch (error) {
            console.error('Failed to send message:', error);
            alert('Failed to send message. Please try again.');
        }
    }, [message, chatId]);

    const handleKeyPress = useCallback((e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    }, [handleSendMessage]);

    // Get other participant info
    const otherParticipant = chat?.otherParticipant || chat?.participants?.find(
        p => p.userId !== currentUserId
    );

    // Get initials for avatar
    const getInitials = (name) => {
        if (!name) return 'U';
        return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    };

    // Get avatar color
    const getAvatarColor = (name) => {
        const colors = [
            'from-blue-400 to-blue-600',
            'from-green-400 to-green-600',
            'from-purple-400 to-purple-600',
            'from-pink-400 to-pink-600',
            'from-orange-400 to-orange-600',
            'from-teal-400 to-teal-600'
        ];
        const index = (name || 'User').charCodeAt(0) % colors.length;
        return colors[index];
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center">
                <div className="text-gray-500">Loading chat...</div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex flex-col">
            {/* Header */}
            <div className="bg-white shadow-sm px-4 py-3 flex items-center gap-3 sticky top-0 z-10">
                <button onClick={() => navigate('/user/chat')} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                    <ArrowLeft className="w-5 h-5 text-gray-700" />
                </button>

                {/* Avatar */}
                {otherParticipant?.profilePhoto ? (
                    <img
                        src={otherParticipant.profilePhoto}
                        alt={otherParticipant.name}
                        className="w-10 h-10 rounded-full object-cover shadow-md"
                    />
                ) : (
                    <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${getAvatarColor(otherParticipant?.name)} flex items-center justify-center text-white font-bold shadow-md`}>
                        {getInitials(otherParticipant?.name)}
                    </div>
                )}

                <div className="flex-1">
                    <h2 className="font-semibold text-gray-900">{otherParticipant?.name || 'User'}</h2>
                    <p className="text-xs text-gray-500">{otherParticipant?.mobileNumber || ''}</p>
                </div>

                <div className="relative">
                    <button onClick={() => setShowMenu(!showMenu)} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                        <MoreVertical className="w-5 h-5 text-gray-700" />
                    </button>
                    {showMenu && (
                        <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-20">
                            <button
                                onClick={() => {
                                    if (window.confirm('Clear chat history?')) {
                                        setMessages([]);
                                        setShowMenu(false);
                                    }
                                }}
                                className="w-full px-4 py-2 text-left hover:bg-gray-100 flex items-center gap-3 text-gray-700"
                            >
                                <Trash2 className="w-4 h-4" />
                                <span>Clear Chat</span>
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Messages */}
            <div ref={messagesContainerRef} className="flex-1 overflow-y-auto p-4 space-y-3">
                {messages.length === 0 ? (
                    <div className="text-center py-12 text-gray-500">No messages yet. Start the conversation!</div>
                ) : (
                    messages.map((msg) => {
                        const isSender = msg.senderId === currentUserId;
                        return (
                            <div key={msg._id} className={`flex ${isSender ? 'justify-end' : 'justify-start'}`}>
                                <div className={`max-w-[75%] rounded-2xl px-4 py-2 shadow-sm ${isSender ? 'bg-blue-500 text-white rounded-br-md' : 'bg-white text-gray-800 rounded-bl-md'}`}>
                                    <p className="text-sm break-words">{msg.content}</p>
                                    <p className={`text-xs mt-1 ${isSender ? 'text-blue-100' : 'text-gray-400'}`}>
                                        {new Date(msg.createdAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })}
                                    </p>
                                </div>
                            </div>
                        );
                    })
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Emoji Picker */}
            {showEmojiPicker && (
                <div className="bg-white border-t border-gray-200 p-3">
                    <div className="flex gap-2 overflow-x-auto pb-2" style={{ scrollbarWidth: 'thin' }}>
                        {emojis.map((emoji, i) => (
                            <button
                                key={i}
                                type="button"
                                onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    setMessage(prev => prev + emoji);
                                    setTimeout(() => inputRef.current?.focus(), 0);
                                }}
                                className="text-2xl hover:bg-gray-100 rounded p-2 transition-colors flex-shrink-0"
                            >
                                {emoji}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Input */}
            <div className="bg-white border-t border-gray-200 p-4">
                <div className="flex items-center gap-2">
                    <input
                        ref={inputRef}
                        type="text"
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        onKeyPress={handleKeyPress}
                        placeholder="Type a message..."
                        className="flex-1 px-4 py-2.5 bg-gray-100 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                    />
                    <button onClick={() => setShowEmojiPicker(!showEmojiPicker)} className="p-2.5 hover:bg-gray-100 rounded-full transition-colors text-xl">😊</button>
                    <button
                        onClick={handleSendMessage}
                        disabled={!message.trim()}
                        className={`p-3 rounded-full transition-all shadow-md ${message.trim() ? 'bg-blue-500 hover:bg-blue-600 text-white' : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}
                    >
                        <Send className="w-5 h-5" />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ChatConversation;
