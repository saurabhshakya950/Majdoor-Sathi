import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, MapPin, Phone, Calendar, Clock, Users } from 'lucide-react';
import toast from 'react-hot-toast';
import LabourBottomNav from '../components/LabourBottomNav';
import { labourAPI } from '../../../services/api';

const ContractorRequest = () => {
    const navigate = useNavigate();
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadRequests();

        // Auto-refresh every 5 seconds
        const interval = setInterval(() => {
            if (!document.hidden) {
                console.log('[REFRESH] Auto-refreshing contractor requests...');
                loadRequests();
            }
        }, 5000);

        return () => clearInterval(interval);
    }, []);

    const loadRequests = async () => {
        try {
            console.log('[INFO] Loading contractor hire requests from database...');
            const response = await labourAPI.getLabourHireRequests({ status: 'pending' });

            if (response.success) {
                console.log('[SUCCESS] Requests loaded:', response.data.hireRequests.length);

                // Filter only contractor requests
                const contractorRequests = response.data.hireRequests.filter(
                    req => req.requesterModel === 'Contractor'
                );

                // Format for display
                const formattedRequests = contractorRequests.map(req => ({
                    id: req._id,
                    _id: req._id,
                    contractorName: req.requesterName,
                    contractorPhone: req.requesterPhone,
                    contractorLocation: req.requesterLocation,
                    labourSkill: req.labourSkill,
                    labourId: req.labourId,
                    requestDate: new Date(req.createdAt).toLocaleDateString(),
                    requestTime: new Date(req.createdAt).toLocaleTimeString(),
                    status: req.status
                }));

                setRequests(formattedRequests);
            }
        } catch (error) {
            console.error('[ERROR] Failed to load requests:', error);
            // Fallback to localStorage
            const savedRequests = JSON.parse(localStorage.getItem('labour_contractor_requests') || '[]');
            const sortedRequests = savedRequests.sort((a, b) => b.id - a.id);
            setRequests(sortedRequests);
        } finally {
            setLoading(false);
        }
    };

    const handleAccept = async (requestId) => {
        try {
            console.log('[INFO] Accepting contractor request:', requestId);

            const response = await labourAPI.updateHireRequestStatus(requestId, 'accepted');

            if (response.success) {
                toast.success('Request accepted!');

                // Trigger event for contractor to update their status
                window.dispatchEvent(new Event('hire-request-updated'));

                // Refresh requests
                await loadRequests();
            }
        } catch (error) {
            console.error('[ERROR] Failed to accept request:', error);
            toast.error('Failed to accept request');
        }
    };

    const handleDecline = async (requestId) => {
        try {
            console.log('[INFO] Declining contractor request:', requestId);

            const response = await labourAPI.updateHireRequestStatus(requestId, 'declined');

            if (response.success) {
                toast.success('Request declined');

                // Trigger event for contractor to update their status
                window.dispatchEvent(new Event('hire-request-updated'));

                // Refresh requests
                await loadRequests();
            }
        } catch (error) {
            console.error('[ERROR] Failed to decline request:', error);
            toast.error('Failed to decline request');
        }
    };

    return (
        <div className="bg-gray-50 flex flex-col overflow-hidden" style={{ height: '100dvh', minHeight: '-webkit-fill-available' }}>
            {/* Header */}
            <div className="bg-white px-4 py-4 shadow-sm flex items-center gap-3 sticky top-0 z-10">
                <button onClick={() => navigate(-1)} className="p-1">
                    <ChevronLeft className="w-6 h-6" />
                </button>
                <h1 className="text-xl font-bold">Contractor Requests</h1>
                <span className="ml-auto bg-yellow-400 text-gray-900 font-bold px-3 py-1 rounded-full text-sm">
                    {requests.length}
                </span>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4 pb-20">
                {loading ? (
                    <div className="bg-white rounded-lg shadow-sm p-8 text-center">
                        <p className="text-gray-600">Loading requests...</p>
                    </div>
                ) : requests.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full">
                        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Users className="w-8 h-8 text-gray-400" />
                        </div>
                        <p className="text-gray-500 text-center">No contractor requests yet</p>
                        <p className="text-gray-400 text-sm text-center mt-2">
                            Requests from contractors will appear here
                        </p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {requests.map((request, index) => (
                            <div
                                key={request.id}
                                className="premium-card card-fade-in"
                                style={{ animationDelay: `${index * 0.05}s` }}
                            >
                                {/* Contractor Info Header */}
                                <div className="flex items-start gap-3 mb-4">
                                    <div className="w-14 h-14 bg-gradient-to-br from-yellow-400 to-yellow-500 rounded-full flex items-center justify-center shadow-md">
                                        <span className="text-2xl font-bold text-gray-900">
                                            {request.contractorName.charAt(0).toUpperCase()}
                                        </span>
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="font-bold text-lg text-gray-900">{request.contractorName}</h3>
                                        <p className="text-sm text-gray-600">Requested for: {request.labourSkill}</p>
                                    </div>
                                </div>

                                {/* Request Details */}
                                <div className="space-y-2 mb-4">
                                    <div className="flex items-center gap-2 text-gray-700">
                                        <MapPin className="w-4 h-4 text-gray-500" />
                                        <span className="text-sm">{request.contractorLocation}</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-gray-700">
                                        <Phone className="w-4 h-4 text-gray-500" />
                                        <span className="text-sm font-medium">{request.contractorPhone || 'Phone not available'}</span>
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
                                        onClick={() => handleDecline(request.id)}
                                        className="flex-1 bg-red-500 hover:bg-red-600 text-white font-bold py-2.5 rounded-lg transition-all duration-200 ease-out hover:shadow-lg active:scale-95"
                                    >
                                        Decline
                                    </button>
                                    <button
                                        onClick={() => handleAccept(request.id)}
                                        className="flex-1 bg-green-500 hover:bg-green-600 text-white font-bold py-2.5 rounded-lg transition-all duration-200 ease-out hover:shadow-lg active:scale-95"
                                    >
                                        Accept
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

export default ContractorRequest;
