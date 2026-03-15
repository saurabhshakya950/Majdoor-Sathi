import { useState, useEffect } from 'react';
import { Search, ArrowLeft } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { chatAPI } from '../../../services/api';
import socketService from '../../../services/socket';

const ChatList = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [searchQuery, setSearchQuery] = useState('');
    const [contacts, setContacts] = useState([]);
    const [loading, setLoading] = useState(true);
    
    useEffect(() => {
        loadChats();
        
        // Connect socket
        const token = localStorage.getItem('access_token');
        if (token) {
            socketService.connect(token);

            // Listen for new messages
            socketService.onReceiveMessage((message) => {
                console.log('📨 New message received:', message);
                updateChatWithNewMessage(message);
            });
        }

        return () => {
            socketService.offReceiveMessage();
        };
    }, []);

    useEffect(() => {
        // If redirected from request page with chatId
        if (location.state?.openChatId) {
            const chat = contacts.find(c => c._id === location.state.openChatId);
            if (chat) {
                navigate(`/contractor/chat/${chat._id}`, { state: { chat } });
            }
        }
    }, [location.state, contacts, navigate]);

    const loadChats = async () => {
        try {
            setLoading(true);
            const response = await chatAPI.getUserChats();
            if (response.success) {
                setContacts(response.data.chats);
            }
        } catch (error) {
            console.error('Failed to load chats:', error);
        } finally {
            setLoading(false);
        }
    };

    const updateChatWithNewMessage = (message) => {
        setContacts(prev => prev.map(chat => 
            chat._id === message.chatId
                ? {
                    ...chat,
                    lastMessage: message.content,
                    lastMessageTime: message.createdAt,
                    unreadCount: chat.unreadCount + 1
                }
                : chat
        ));
    };

    // Get color based on name
    const getAvatarColor = (name) => {
        const colors = [
            'from-blue-400 to-blue-600',
            'from-green-400 to-green-600',
            'from-purple-400 to-purple-600',
            'from-pink-400 to-pink-600',
            'from-orange-400 to-orange-600',
            'from-teal-400 to-teal-600'
        ];
        const index = name.charCodeAt(0) % colors.length;
        return colors[index];
    };

    // Get initials from name
    const getInitials = (name) => {
        return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    };

    // Format time
    const formatTime = (timestamp) => {
        if (!timestamp) return '';
        const date = new Date(timestamp);
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        if (diffDays < 7) return `${diffDays}d ago`;
        return date.toLocaleDateString();
    };

    // Filter contacts based on search
    const filteredContacts = contacts.filter(contact =>
        contact.otherParticipant?.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 flex flex-col overflow-hidden" style={{ height: '100dvh', minHeight: '-webkit-fill-available' }}>
            {/* Header */}
            <div className="bg-white shadow-sm sticky top-0 z-10">
                <div className="px-4 py-4 flex items-center gap-3">
                    <button 
                        onClick={() => navigate('/contractor/settings')} 
                        className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                    >
                        <ArrowLeft className="w-5 h-5 text-gray-700" />
                    </button>
                    <h1 className="text-2xl font-bold text-gray-800">Chat</h1>
                </div>

                {/* Search Bar */}
                <div className="px-4 pb-4">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search contacts..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 bg-gray-100 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                        />
                    </div>
                </div>
            </div>

            {/* Contact List */}
            <div className="pb-20">
                {loading ? (
                    <div className="text-center py-12 text-gray-500">
                        Loading chats...
                    </div>
                ) : filteredContacts.length === 0 ? (
                    <div className="text-center py-12 text-gray-500">
                        {searchQuery ? 'No contacts found' : 'No chats yet. Start by accepting a hire request!'}
                    </div>
                ) : (
                    filteredContacts.map((contact) => (
                        <div
                            key={contact._id}
                            onClick={() => navigate(`/contractor/chat/${contact._id}`, { state: { contact } })}
                            className="bg-white border-b border-gray-100 px-4 py-3 flex items-center gap-3 hover:bg-gray-50 cursor-pointer transition-colors"
                        >
                            {/* Avatar */}
                            <div className="relative">
                                {contact.otherParticipant?.profilePhoto ? (
                                    <img 
                                        src={contact.otherParticipant.profilePhoto} 
                                        alt={contact.otherParticipant.name}
                                        className="w-14 h-14 rounded-full object-cover shadow-md"
                                    />
                                ) : (
                                    <div className={`w-14 h-14 rounded-full bg-gradient-to-br ${getAvatarColor(contact.otherParticipant?.name || 'User')} flex items-center justify-center text-white font-bold text-lg shadow-md`}>
                                        {getInitials(contact.otherParticipant?.name || 'U')}
                                    </div>
                                )}
                            </div>

                            {/* Contact Info */}
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between mb-1">
                                    <h3 className="font-semibold text-gray-800 truncate">
                                        {contact.otherParticipant?.name || 'Unknown'}
                                    </h3>
                                    {contact.unreadCount > 0 && (
                                        <span className="bg-blue-500 text-white text-xs font-bold px-2 py-0.5 rounded-full min-w-[20px] text-center">
                                            {contact.unreadCount}
                                        </span>
                                    )}
                                </div>
                                <p className="text-sm text-gray-500 truncate">{contact.lastMessage}</p>
                                <p className="text-xs text-gray-400 mt-0.5">{formatTime(contact.lastMessageTime)}</p>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default ChatList;
