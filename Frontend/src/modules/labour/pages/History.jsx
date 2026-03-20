import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, MapPin, Phone, Calendar, Clock, Users } from 'lucide-react';
import toast from 'react-hot-toast';
import LabourBottomNav from '../components/LabourBottomNav';
import { labourAPI } from '../../../services/api';

const History = () => {
    const navigate = useNavigate();
    const [history, setHistory] = useState([]);
    const [activeTab, setActiveTab] = useState('user'); // 'user' or 'contractor'
    const [statusFilter, setStatusFilter] = useState('all'); // 'all', 'accepted', 'declined'
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadHistory();

        // Auto-refresh every 10 seconds
        const interval = setInterval(() => {
            if (!document.hidden) {
                console.log('[REFRESH] Auto-refreshing labour history...');
                loadHistory();
            }
        }, 10000);

        return () => clearInterval(interval);
    }, []);

    const loadHistory = async () => {
        try {
            console.log('[INFO] Loading labour hire request history from database...');

            // Get accepted and declined hire requests
            const acceptedResponse = await labourAPI.getLabourHireRequests({ status: 'accepted' });
            const declinedResponse = await labourAPI.getLabourHireRequests({ status: 'declined' });

            const acceptedRequests = acceptedResponse.success ? acceptedResponse.data.hireRequests : [];
            const declinedRequests = declinedResponse.success ? declinedResponse.data.hireRequests : [];

            // Combine and format the requests
            const allRequests = [...acceptedRequests, ...declinedRequests];

            const formattedHistory = allRequests.map(req => {
                // Format date and time
                const requestDate = new Date(req.createdAt);
                const formattedDate = requestDate.toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric'
                });
                const formattedTime = requestDate.toLocaleTimeString('en-US', {
                    hour: '2-digit',
                    minute: '2-digit'
                });

                return {
                    id: req._id,
                    _id: req._id,
                    jobTitle: req.labourSkill || 'Labour Work',
                    category: req.labourSkill,
                    userName: req.requesterName,
                    contractorName: req.requesterName,
                    phoneNumber: req.requesterPhone,
                    location: req.requesterLocation,
                    date: formattedDate,
                    time: formattedTime,
                    status: req.status,
                    type: req.requesterModel === 'User' ? 'user' : 'contractor',
                    appliedAt: req.createdAt
                };
            });

            // Sort by most recent first
            formattedHistory.sort((a, b) => new Date(b.appliedAt) - new Date(a.appliedAt));

            console.log('[SUCCESS] History loaded:', formattedHistory.length, 'items');
            console.log('[DEBUG] History data sample:', formattedHistory[0]);
            setHistory(formattedHistory);
        } catch (error) {
            console.error('[ERROR] Failed to load history:', error);
            setHistory([]);
        } finally {
            setLoading(false);
        }
    };

    // Get filtered history based on active tab and status filter
    const getFilteredHistory = () => {
        let filtered = history;

        // Filter by tab
        if (activeTab === 'user') {
            filtered = filtered.filter(item => item.type === 'user');
        } else if (activeTab === 'contractor') {
            filtered = filtered.filter(item => item.type === 'contractor');
        }

        // Filter by status
        if (statusFilter !== 'all') {
            filtered = filtered.filter(req => req.status === statusFilter);
        }

        return filtered;
    };

    const filteredHistory = getFilteredHistory();
    const userCount = history.filter(h => h.type === 'user').length;
    const contractorCount = history.filter(h => h.type === 'contractor').length;

    return (
        <div className="bg-gray-50 flex flex-col overflow-hidden" style={{ height: '100dvh', minHeight: '-webkit-fill-available' }}>
            {/* Header */}
            <div className="bg-white px-4 py-4 shadow-sm sticky top-0 z-10">
                <div className="flex items-center gap-3 mb-4">
                    <button onClick={() => navigate(-1)} className="p-1">
                        <ChevronLeft className="w-6 h-6" />
                    </button>
                    <h1 className="text-xl font-bold">Request History</h1>
                    <span className="ml-auto bg-yellow-400 text-gray-900 font-bold px-3 py-1 rounded-full text-sm">
                        {filteredHistory.length}
                    </span>
                </div>

                {/* Tab Buttons */}
                <div className="flex gap-2 mb-3">
                    <button
                        onClick={() => setActiveTab('user')}
                        className={`flex-1 py-2 px-4 rounded-lg font-semibold transition-all ${activeTab === 'user'
                                ? 'bg-blue-500 text-white'
                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                            }`}
                    >
                        User Requests ({userCount})
                    </button>
                    <button
                        onClick={() => setActiveTab('contractor')}
                        className={`flex-1 py-2 px-4 rounded-lg font-semibold transition-all ${activeTab === 'contractor'
                                ? 'bg-yellow-500 text-gray-900'
                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                            }`}
                    >
                        Contractor Requests ({contractorCount})
                    </button>
                </div>

                {/* Status Filter Buttons */}
                <div className="flex gap-2">
                    <button
                        onClick={() => setStatusFilter('all')}
                        className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all ${statusFilter === 'all'
                                ? 'bg-gray-800 text-white'
                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                            }`}
                    >
                        All
                    </button>
                    <button
                        onClick={() => setStatusFilter('accepted')}
                        className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all ${statusFilter === 'accepted'
                                ? 'bg-green-500 text-white'
                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                            }`}
                    >
                        Accepted
                    </button>
                    <button
                        onClick={() => setStatusFilter('declined')}
                        className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all ${statusFilter === 'declined'
                                ? 'bg-red-500 text-white'
                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                            }`}
                    >
                        Declined
                    </button>
                </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto">
                <div className="p-4 pb-24">
                    {loading ? (
                        <div className="bg-white rounded-lg shadow-sm p-8 text-center">
                            <p className="text-gray-600">Loading history...</p>
                        </div>
                    ) : filteredHistory.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full">
                            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Users className="w-8 h-8 text-gray-400" />
                            </div>
                            <p className="text-gray-500 text-center">No history found</p>
                            <p className="text-gray-400 text-sm text-center mt-2">
                                {statusFilter === 'all'
                                    ? `No ${activeTab} requests yet`
                                    : `No ${statusFilter} ${activeTab} requests`
                                }
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {filteredHistory.map((request, index) => (
                                <div
                                    key={request.id}
                                    className={`premium-card card-fade-in border-2 ${request.status === 'accepted'
                                            ? 'border-green-500'
                                            : 'border-red-500'
                                        }`}
                                    style={{ animationDelay: `${index * 0.05}s` }}
                                >
                                    {/* Header */}
                                    <div className="flex items-start gap-3 mb-4">
                                        <div className={`w-14 h-14 bg-gradient-to-br rounded-full flex items-center justify-center shadow-md ${activeTab === 'user'
                                                ? 'from-blue-400 to-blue-500'
                                                : 'from-yellow-400 to-yellow-500'
                                            }`}>
                                            <span className={`text-2xl font-bold ${activeTab === 'user' ? 'text-white' : 'text-gray-900'
                                                }`}>
                                                {activeTab === 'user'
                                                    ? (request.userName || 'U').charAt(0).toUpperCase()
                                                    : (request.contractorName || 'C').charAt(0).toUpperCase()
                                                }
                                            </span>
                                        </div>
                                        <div className="flex-1">
                                            <h3 className="font-bold text-lg text-gray-900">
                                                {activeTab === 'user' ? request.userName : request.contractorName}
                                            </h3>
                                            <p className="text-sm text-gray-600">
                                                Applied for: {request.jobTitle}
                                            </p>
                                        </div>
                                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${request.status === 'accepted'
                                                ? 'bg-green-100 text-green-700'
                                                : 'bg-red-100 text-red-700'
                                            }`}>
                                            {request.status === 'accepted' ? 'Accepted' : 'Declined'}
                                        </span>
                                    </div>

                                    {/* Request Details */}
                                    <div className="space-y-2">
                                        <div className="flex items-center gap-2 text-gray-700">
                                            <MapPin className="w-4 h-4 text-gray-500" />
                                            <span className="text-sm">{request.location}</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-gray-700">
                                            <Phone className="w-4 h-4 text-gray-500" />
                                            <span className="text-sm font-medium">{request.phoneNumber}</span>
                                        </div>
                                        <div className="flex items-center gap-4 text-gray-600 text-xs">
                                            <div className="flex items-center gap-1">
                                                <Calendar className="w-4 h-4" />
                                                <span>{request.date}</span>
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <Clock className="w-4 h-4" />
                                                <span>{request.time}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Bottom Navigation */}
            <LabourBottomNav />
        </div>
    );
};

export default History;
