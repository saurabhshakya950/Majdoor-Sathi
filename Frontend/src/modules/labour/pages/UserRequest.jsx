import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, MapPin, Phone, Calendar, Clock } from 'lucide-react';
import LabourBottomNav from '../components/LabourBottomNav';
import { labourAPI } from '../../../services/api';

const UserRequest = () => {
    const navigate = useNavigate();
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Load requests from database
        const loadRequests = async () => {
            try {
                setLoading(true);

                const response = await labourAPI.getLabourHireRequests({ status: 'pending' });

                if (response.success) {
                    // Filter only User requests (requesterModel === 'User')
                    const userRequests = response.data.hireRequests.filter(
                        req => req.requesterModel === 'User'
                    );

                    // Transform API data to match UI format
                    const transformedRequests = userRequests.map(req => ({
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
                        status: req.status
                    }));

                    setRequests(transformedRequests);
                }
            } catch (error) {
                console.error('Failed to load hire requests:', error);

                // Fallback to localStorage if API fails
                const savedRequests = JSON.parse(localStorage.getItem('labour_user_requests') || '[]');
                const sortedRequests = savedRequests.sort((a, b) => b.id - a.id);
                setRequests(sortedRequests);
            } finally {
                setLoading(false);
            }
        };

        // Initial load
        loadRequests();

        // Update when page becomes visible (user switches back to this tab/page)
        const handleVisibilityChange = () => {
            if (!document.hidden) {
                loadRequests();
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);

        // Cleanup
        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange);
        };
    }, []);

    const handleAccept = async (requestId) => {
        try {
            // Update status in database
            const response = await labourAPI.updateHireRequestStatus(requestId, 'accepted');

            if (response.success) {
                // Remove from current requests
                const filteredRequests = requests.filter(req => req.id !== requestId);
                setRequests(filteredRequests);

                // Trigger update in user/contractor panel
                // This will notify other tabs/windows to refresh
                window.dispatchEvent(new CustomEvent('hire-request-updated', {
                    detail: { action: 'accepted', requestId }
                }));

                // Show success message
                alert('Request accepted successfully!');
            }
        } catch (error) {
            console.error('Failed to accept request:', error);
            alert(error.response?.data?.message || 'Failed to accept request. Please try again.');
        }
    };

    const handleDecline = async (requestId) => {
        try {
            // Update status in database
            const response = await labourAPI.updateHireRequestStatus(requestId, 'declined');

            if (response.success) {
                // Remove from current requests
                const filteredRequests = requests.filter(req => req.id !== requestId);
                setRequests(filteredRequests);

                // Trigger update in user/contractor panel
                window.dispatchEvent(new CustomEvent('hire-request-updated', {
                    detail: { action: 'declined', requestId }
                }));

                // Show success message
                alert('Request declined successfully!');
            }
        } catch (error) {
            console.error('Failed to decline request:', error);
            alert(error.response?.data?.message || 'Failed to decline request. Please try again.');
        }
    };

    return (
        <div className="bg-gray-50 flex flex-col overflow-hidden" style={{ height: '100dvh', minHeight: '-webkit-fill-available' }}>
            {/* Header */}
            <div className="bg-white px-4 py-4 shadow-sm flex items-center gap-3 sticky top-0 z-10">
                <button onClick={() => navigate(-1)} className="p-1">
                    <ChevronLeft className="w-6 h-6" />
                </button>
                <h1 className="text-xl font-bold">User Requests</h1>
                <span className="ml-auto bg-yellow-400 text-gray-900 font-bold px-3 py-1 rounded-full text-sm">
                    {requests.length}
                </span>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4 pb-20">
                {loading ? (
                    <div className="flex flex-col items-center justify-center h-full">
                        <div className="text-6xl mb-4">⏳</div>
                        <p className="text-gray-500 text-center">Loading requests...</p>
                    </div>
                ) : requests.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full">
                        <div className="text-6xl mb-4">📭</div>
                        <p className="text-gray-500 text-center">No user requests yet</p>
                        <p className="text-gray-400 text-sm text-center mt-2">
                            Requests from users will appear here
                        </p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {requests.map((request) => (
                            <div
                                key={request.id}
                                className="bg-white rounded-xl shadow-md p-4"
                            >
                                {/* User Info Header */}
                                <div className="flex items-start gap-3 mb-4">
                                    <div className="w-14 h-14 bg-gradient-to-br from-blue-400 to-blue-500 rounded-full flex items-center justify-center shadow-md">
                                        <span className="text-2xl font-bold text-white">
                                            {request.userName.charAt(0).toUpperCase()}
                                        </span>
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="font-bold text-lg text-gray-900">{request.userName}</h3>
                                        <p className="text-sm text-gray-600">Requested for: {request.labourSkill}</p>
                                    </div>
                                </div>

                                {/* Request Details */}
                                <div className="space-y-2 mb-4">
                                    <div className="flex items-center gap-2 text-gray-700">
                                        <MapPin className="w-4 h-4 text-gray-500" />
                                        <span className="text-sm">{request.userLocation}</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-gray-700">
                                        <Phone className="w-4 h-4 text-gray-500" />
                                        <span className="text-sm font-medium">{request.userPhone || 'Phone not available'}</span>
                                    </div>
                                    <div className="flex items-center gap-4 text-gray-600 text-xs">
                                        <div className="flex items-center gap-1">
                                            <Calendar className="w-4 h-4" />
                                            <span>{request.requestDate}</span>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <Clock className="w-4 h-4" />
                                            <span>{request.requestTime}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Action Buttons */}
                                <div className="flex gap-3">
                                    <button
                                        onClick={() => handleAccept(request.id)}
                                        className="flex-1 bg-green-500 hover:bg-green-600 text-white font-bold py-3 rounded-lg transition-all active:scale-95"
                                    >
                                        Accept
                                    </button>
                                    <button
                                        onClick={() => handleDecline(request.id)}
                                        className="flex-1 bg-red-500 hover:bg-red-600 text-white font-bold py-3 rounded-lg transition-all active:scale-95"
                                    >
                                        Decline
                                    </button>
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

export default UserRequest;
