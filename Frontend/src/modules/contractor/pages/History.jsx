import { useState, useEffect } from 'react';
import { MapPin, Phone, Calendar, Clock, Bell, Crown, MessageCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import ContractorBottomNav from '../components/ContractorBottomNav';
import { contractorAPI } from '../../../services/api';

const History = () => {
    const navigate = useNavigate();
    const [history, setHistory] = useState([]);
    const [typeFilter, setTypeFilter] = useState('all'); // 'all', 'worker', 'user'
    const [loading, setLoading] = useState(true);
    const [userName, setUserName] = useState('User');

    useEffect(() => {
        // Get user name from localStorage
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        if (user.firstName) {
            setUserName(user.firstName);
        }

        loadHistory();

        // Auto-refresh every 10 seconds (Silent)
        const interval = setInterval(() => {
            if (!document.hidden) {
                loadHistory(true);
            }
        }, 10000);

        return () => clearInterval(interval);
    }, []);

    const loadHistory = async (isSilent = false) => {
        try {
            if (!isSilent) setLoading(true);
            console.log('[INFO] Loading contractor application history from database...');
            const response = await contractorAPI.getContractorApplicationHistory();

            if (response.success) {
                console.log('[SUCCESS] History loaded:', response.data.history.length, 'items');
                setHistory(response.data.history);
            }
        } catch (error) {
            console.error('[ERROR] Failed to load history:', error);
            setHistory([]);
        } finally {
            if (!isSilent) setLoading(false);
        }
    };

    const handleChatClick = async (request) => {
        console.log('[INFO] Chat button clicked (Contractor History)');
        
        try {
            const { chatAPI } = await import('../../../services/api');

            // Prefer direct chatId if available
            if (request.chatId) {
                console.log('[SUCCESS] Using existing chatId:', request.chatId);
                navigate(`/contractor/chat/${request.chatId}`);
                return;
            }

            // Fallback: Initialize new chat
            console.log('[INFO] Initializing new chat...');
            const initResponse = await chatAPI.initializeChat({
                participant2Id: request.applicantUserId || request.requesterUserId,
                participant2Type: request.type === 'worker' ? 'Labour' : 'User',
                participant2Name: request.workerName,
                participant2Phone: request.phoneNumber,
                requestId: request.id || request._id,
                requestType: 'ContractorHireRequest'
            });

            if (initResponse.success && initResponse.data.chat) {
                console.log('[SUCCESS] Chat initialized:', initResponse.data.chat._id);
                navigate(`/contractor/chat/${initResponse.data.chat._id}`);
                return;
            }

            console.log('[ERROR] No chat found, navigating to chat list');
            navigate('/contractor/chat');
        } catch (error) {
            console.error('[ERROR] Failed to open chat:', error);
            navigate('/contractor/chat');
        }
    };

    // Get filtered history based on type filter
    const getFilteredHistory = () => {
        if (typeFilter === 'all') {
            return history;
        }
        return history.filter(req => req.type === typeFilter);
    };

    const filteredHistory = getFilteredHistory();

    // Get counts for each type
    const allCount = history.length;
    const userCount = history.filter(req => req.type === 'user').length;
    const workerCount = history.filter(req => req.type === 'worker').length;

    return (
        <div className="bg-gray-50 flex flex-col overflow-hidden" style={{ height: '100dvh', minHeight: '-webkit-fill-available' }}>
            {/* Header with User Info */}
            <div className="bg-white px-4 py-4 shadow-sm sticky top-0 z-10">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <img
                            src="/src/assets/Majdoor Sathi.png"
                            alt="Logo"
                            className="w-10 h-10 object-contain"
                            onError={(e) => {
                                e.target.style.display = 'none';
                            }}
                        />
                        <div>
                            <p className="text-sm text-gray-500">Hey, Welcome 👋</p>
                            <p className="font-bold text-gray-900">{userName}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => navigate('/contractor/notifications')}
                            className="p-2 bg-blue-500 rounded-full hover:bg-blue-600 transition-colors"
                        >
                            <Bell className="w-5 h-5 text-white" />
                        </button>
                        <button
                            onClick={() => navigate('/contractor/subscription')}
                            className="p-2 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors"
                        >
                            <Crown className="w-5 h-5 text-gray-600" />
                        </button>
                    </div>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto">
                <div className="p-4 pb-20">
                    {/* Title */}
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">Request History</h2>

                    {/* Type Filter Tabs - Sticky within scroll container */}
                    <div className="flex gap-2 mb-4 sticky top-0 z-10 py-1 bg-gray-50">
                        <button
                            onClick={() => setTypeFilter('all')}
                            className={`flex-1 py-3 px-4 rounded-lg text-sm font-semibold transition-all ${typeFilter === 'all'
                                ? 'bg-yellow-400 text-gray-900 shadow-md'
                                : 'bg-white text-gray-600 hover:bg-gray-50 border'
                                }`}
                        >
                            All ({allCount})
                        </button>
                        <button
                            onClick={() => setTypeFilter('user')}
                            className={`flex-1 py-3 px-4 rounded-lg text-sm font-semibold transition-all ${typeFilter === 'user'
                                ? 'bg-yellow-400 text-gray-900 shadow-md'
                                : 'bg-white text-gray-600 hover:bg-gray-50 border'
                                }`}
                        >
                            Contr. ({userCount})
                        </button>
                        <button
                            onClick={() => setTypeFilter('worker')}
                            className={`flex-1 py-3 px-4 rounded-lg text-sm font-semibold transition-all ${typeFilter === 'worker'
                                ? 'bg-yellow-400 text-gray-900 shadow-md'
                                : 'bg-white text-gray-600 hover:bg-gray-50 border'
                                }`}
                        >
                            Workers ({workerCount})
                        </button>
                    </div>

                    {loading ? (
                        <div className="bg-white rounded-lg shadow-sm p-8 text-center">
                            <p className="text-gray-600">Loading history...</p>
                        </div>
                    ) : filteredHistory.length === 0 ? (
                        <div className="flex flex-col items-center justify-center min-h-[60vh]">
                            <div className="text-6xl mb-4">📭</div>
                            <p className="text-gray-500 text-center font-medium">No history found</p>
                            <p className="text-gray-400 text-sm text-center mt-2">
                                {typeFilter === 'all'
                                    ? 'No requests yet'
                                    : `No ${typeFilter === 'user' ? 'contractor' : 'worker'} requests`
                                }
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {filteredHistory.map((request, index) => (
                                <div
                                    key={request.id}
                                    className="bg-white rounded-2xl shadow-sm p-4 hover:shadow-md transition-shadow"
                                    style={{ animationDelay: `${index * 0.05}s` }}
                                >
                                    {/* Header with Avatar, Name, and Status */}
                                    <div className="flex items-start justify-between mb-3">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg ${request.type === 'user'
                                                ? 'bg-blue-500'
                                                : 'bg-green-500'
                                                }`}>
                                                {request.workerName.charAt(0).toUpperCase()}
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-gray-900">{request.workerName}</h3>
                                                <div className="flex items-center gap-1 text-sm text-gray-500">
                                                    <MapPin className="w-3.5 h-3.5" />
                                                    <span>{request.location}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <span className={`px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1 ${request.status === 'accepted'
                                            ? 'bg-green-100 text-green-700'
                                            : 'bg-red-100 text-red-700'
                                            }`}>
                                            {request.status === 'accepted' ? '✓' : '✕'}
                                            {request.status === 'accepted' ? 'Accepted' : 'Declined'}
                                        </span>
                                    </div>

                                    {/* Contact Info */}
                                    <div className="flex items-center gap-2 text-gray-600 text-sm mb-3">
                                        <Phone className="w-4 h-4" />
                                        <span>{request.phoneNumber}</span>
                                    </div>

                                    {/* Date and Time */}
                                    <div className="flex items-center gap-4 text-gray-500 text-xs mb-3">
                                        <div className="flex items-center gap-1">
                                            <Calendar className="w-3.5 h-3.5" />
                                            <span>{request.date}</span>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <Clock className="w-3.5 h-3.5" />
                                            <span>{request.time}</span>
                                        </div>
                                    </div>

                                    {/* Applied For Section */}
                                    {request.type === 'worker' && request.jobTitle && (
                                        <div className="bg-gray-50 rounded-lg p-3">
                                            <p className="text-xs text-gray-500 mb-1">Applied for</p>
                                            <p className="font-semibold text-gray-900">{request.jobTitle}</p>
                                        </div>
                                    )}

                                    {request.type === 'user' && (
                                        <div className="bg-gray-50 rounded-lg p-3">
                                            <p className="text-xs text-gray-500 mb-1">Request Type</p>
                                            <p className="font-semibold text-gray-900">Contractor Hire Request</p>
                                        </div>
                                    )}
                                    {/* Chat Button for Accepted Status */}
                                    {request.status === 'accepted' && (
                                        <button
                                            onClick={() => handleChatClick(request)}
                                            className="w-full mt-4 bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-all active:scale-95 shadow-md"
                                        >
                                            <MessageCircle className="w-5 h-5" />
                                            <span>Chat with {request.type === 'worker' ? 'Worker' : 'Customer'}</span>
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            <ContractorBottomNav />
        </div>
    );
};

export default History;
