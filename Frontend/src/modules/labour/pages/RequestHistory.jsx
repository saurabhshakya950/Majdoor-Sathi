import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, MapPin, Phone, Calendar, Clock, CheckCircle, XCircle } from 'lucide-react';
import LabourBottomNav from '../components/LabourBottomNav';
import { labourAPI } from '../../../services/api';

const RequestHistory = () => {
    const navigate = useNavigate();
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all'); // all, accepted, declined

    useEffect(() => {
        loadHistory();

        // Update when page becomes visible
        const handleVisibilityChange = () => {
            if (!document.hidden) {
                loadHistory();
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);

        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange);
        };
    }, []);

    const loadHistory = async () => {
        try {
            setLoading(true);
            
            // Fetch all hire requests (not just pending)
            const response = await labourAPI.getLabourHireRequests({});
            
            if (response.success) {
                // Transform and filter accepted/declined requests
                const transformedHistory = response.data.hireRequests
                    .filter(req => req.status !== 'pending') // Only show responded requests
                    .map(req => ({
                        id: req._id,
                        labourId: req.labourId,
                        labourName: req.labourName,
                        labourSkill: req.labourSkill,
                        labourPhone: req.labourPhone,
                        labourCity: req.labourCity,
                        userName: req.requesterName,
                        userPhone: req.requesterPhone,
                        userLocation: req.requesterLocation,
                        requestDate: new Date(req.createdAt).toLocaleDateString('en-IN'),
                        requestTime: new Date(req.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
                        respondedDate: req.respondedAt ? new Date(req.respondedAt).toLocaleDateString('en-IN') : null,
                        respondedTime: req.respondedAt ? new Date(req.respondedAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : null,
                        status: req.status
                    }))
                    .sort((a, b) => new Date(b.respondedDate) - new Date(a.respondedDate)); // Latest first
                
                setHistory(transformedHistory);
            }
        } catch (error) {
            console.error('Failed to load history:', error);
        } finally {
            setLoading(false);
        }
    };

    const filteredHistory = history.filter(item => {
        if (filter === 'all') return true;
        return item.status === filter;
    });

    return (
        <div className="bg-gray-50 flex flex-col overflow-hidden" style={{ height: '100dvh', minHeight: '-webkit-fill-available' }}>
            {/* Header */}
            <div className="bg-white px-4 py-4 shadow-sm">
                <div className="flex items-center gap-3 mb-3">
                    <button onClick={() => navigate(-1)} className="p-1">
                        <ChevronLeft className="w-6 h-6" />
                    </button>
                    <h1 className="text-xl font-bold">Request History</h1>
                    <span className="ml-auto bg-blue-500 text-white font-bold px-3 py-1 rounded-full text-sm">
                        {filteredHistory.length}
                    </span>
                </div>

                {/* Filter Tabs */}
                <div className="flex gap-2">
                    <button
                        onClick={() => setFilter('all')}
                        className={`flex-1 py-2 px-4 rounded-lg font-medium text-sm transition-all ${
                            filter === 'all'
                                ? 'bg-blue-500 text-white'
                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                    >
                        All ({history.length})
                    </button>
                    <button
                        onClick={() => setFilter('accepted')}
                        className={`flex-1 py-2 px-4 rounded-lg font-medium text-sm transition-all ${
                            filter === 'accepted'
                                ? 'bg-green-500 text-white'
                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                    >
                        Accepted ({history.filter(h => h.status === 'accepted').length})
                    </button>
                    <button
                        onClick={() => setFilter('declined')}
                        className={`flex-1 py-2 px-4 rounded-lg font-medium text-sm transition-all ${
                            filter === 'declined'
                                ? 'bg-red-500 text-white'
                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                    >
                        Declined ({history.filter(h => h.status === 'declined').length})
                    </button>
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4 pb-20">
                {loading ? (
                    <div className="flex flex-col items-center justify-center h-full">
                        <div className="text-6xl mb-4">⏳</div>
                        <p className="text-gray-500 text-center">Loading history...</p>
                    </div>
                ) : filteredHistory.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full">
                        <div className="text-6xl mb-4">📋</div>
                        <p className="text-gray-500 text-center">No history yet</p>
                        <p className="text-gray-400 text-sm text-center mt-2">
                            {filter === 'all' 
                                ? 'Accepted and declined requests will appear here'
                                : `No ${filter} requests found`}
                        </p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {filteredHistory.map((item) => (
                            <div 
                                key={item.id} 
                                className={`bg-white rounded-xl shadow-md p-4 border-l-4 ${
                                    item.status === 'accepted' 
                                        ? 'border-green-500' 
                                        : 'border-red-500'
                                }`}
                            >
                                {/* Status Badge */}
                                <div className="flex items-center justify-between mb-3">
                                    <div className={`flex items-center gap-2 px-3 py-1 rounded-full ${
                                        item.status === 'accepted'
                                            ? 'bg-green-100 text-green-700'
                                            : 'bg-red-100 text-red-700'
                                    }`}>
                                        {item.status === 'accepted' ? (
                                            <CheckCircle className="w-4 h-4" />
                                        ) : (
                                            <XCircle className="w-4 h-4" />
                                        )}
                                        <span className="text-sm font-bold">
                                            {item.status === 'accepted' ? 'Accepted' : 'Declined'}
                                        </span>
                                    </div>
                                    {item.respondedDate && (
                                        <span className="text-xs text-gray-500">
                                            {item.respondedDate}
                                        </span>
                                    )}
                                </div>

                                {/* User Info */}
                                <div className="flex items-start gap-3 mb-3">
                                    <div className={`w-12 h-12 rounded-full flex items-center justify-center shadow-md ${
                                        item.status === 'accepted'
                                            ? 'bg-gradient-to-br from-green-400 to-green-500'
                                            : 'bg-gradient-to-br from-red-400 to-red-500'
                                    }`}>
                                        <span className="text-xl font-bold text-white">
                                            {item.userName.charAt(0).toUpperCase()}
                                        </span>
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="font-bold text-lg text-gray-900">{item.userName}</h3>
                                        <p className="text-sm text-gray-600">Requested for: {item.labourSkill}</p>
                                    </div>
                                </div>

                                {/* Request Details */}
                                <div className="space-y-2 bg-gray-50 rounded-lg p-3">
                                    <div className="flex items-center gap-2 text-gray-700">
                                        <MapPin className="w-4 h-4 text-gray-500" />
                                        <span className="text-sm">{item.userLocation}</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-gray-700">
                                        <Phone className="w-4 h-4 text-gray-500" />
                                        <span className="text-sm font-medium">{item.userPhone || 'Phone not available'}</span>
                                    </div>
                                    <div className="flex items-center gap-4 text-gray-600 text-xs">
                                        <div className="flex items-center gap-1">
                                            <Calendar className="w-4 h-4" />
                                            <span>Requested: {item.requestDate}</span>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <Clock className="w-4 h-4" />
                                            <span>{item.requestTime}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Bottom Navigation */}
            <LabourBottomNav />
        </div>
    );
};

export default RequestHistory;
