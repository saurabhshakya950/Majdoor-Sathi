import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import UserBottomNav from '../components/UserBottomNav';
import UserHeader from '../components/UserHeader';
import ContractorRequestCard from '../components/ContractorRequestCard';
import { Users } from 'lucide-react';
import { jobAPI } from '../../../services/api';

const ContractorRequest = () => {
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadContractorApplications();

        // Auto-refresh every 5 seconds
        const interval = setInterval(() => {
            if (!document.hidden) {
                console.log('[REFRESH] Auto-refreshing contractor applications...');
                loadContractorApplications();
            }
        }, 5000);

        return () => clearInterval(interval);
    }, []);

    const loadContractorApplications = async () => {
        try {
            const response = await jobAPI.getContractorApplications();

            if (response.success) {
                console.log('[SUCCESS] Loaded contractor applications:', response.data.applications);

                // Transform to match component expectations
                const formattedRequests = response.data.applications.map(app => ({
                    id: app._id,
                    jobId: app.jobId,
                    jobTitle: app.jobTitle,
                    jobCategory: app.jobCategory,
                    contractorName: app.applicantName,
                    phoneNumber: app.phoneNumber,
                    location: app.location,
                    message: app.message,
                    appliedAt: app.appliedAt,
                    date: new Date(app.appliedAt).toLocaleDateString('en-IN', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric'
                    }),
                    time: new Date(app.appliedAt).toLocaleTimeString('en-IN', {
                        hour: '2-digit',
                        minute: '2-digit',
                        hour12: true
                    }),
                    status: app.status,
                    chatId: app.chatId,
                    applicantUserId: app.applicantUserId
                }));

                setRequests(formattedRequests);
            }
        } catch (error) {
            console.error('Failed to load contractor applications:', error);
            // Fallback to localStorage
            const savedRequests = JSON.parse(localStorage.getItem('contractor_requests') || '[]');
            setRequests(savedRequests);
        } finally {
            setLoading(false);
        }
    };

    const handleAccept = async (requestId) => {
        // Find the request
        const request = requests.find(r => r.id === requestId);
        if (!request) return;

        try {
            // Update status in database
            const response = await jobAPI.updateApplicationStatus(
                request.jobId,
                requestId,
                'Accepted'
            );

            if (response.success) {
                // Remove from pending requests
                const updatedRequests = requests.filter(r => r.id !== requestId);
                setRequests(updatedRequests);

                toast.success('Contractor request accepted!', {
                    duration: 3000,
                    position: 'top-center',
                });

                // Trigger event for other components
                window.dispatchEvent(new Event('contractor-application-updated'));
            }
        } catch (error) {
            console.error('Failed to accept request:', error);
            toast.error('Failed to accept request. Please try again.', {
                duration: 3000,
                position: 'top-center',
            });
        }
    };

    const handleDecline = async (requestId) => {
        // Find the request
        const request = requests.find(r => r.id === requestId);
        if (!request) return;

        try {
            // Update status in database
            const response = await jobAPI.updateApplicationStatus(
                request.jobId,
                requestId,
                'Rejected'
            );

            if (response.success) {
                // Remove from pending requests
                const updatedRequests = requests.filter(r => r.id !== requestId);
                setRequests(updatedRequests);

                toast.error('Contractor request declined', {
                    duration: 3000,
                    position: 'top-center',
                });

                // Trigger event for other components
                window.dispatchEvent(new Event('contractor-application-updated'));
            }
        } catch (error) {
            console.error('Failed to decline request:', error);
            toast.error('Failed to decline request. Please try again.', {
                duration: 3000,
                position: 'top-center',
            });
        }
    };

    return (
        <div className="bg-gray-50 flex flex-col overflow-hidden" style={{ height: '100dvh', minHeight: '-webkit-fill-available' }}>
            {/* Header Section */}
            <div className="sticky top-0 z-10 bg-white shadow-sm">
                <UserHeader />
            </div>

            {/* Main Content Area */}
            <div className="flex-1 overflow-y-auto">
                <div className="p-4 pb-24">
                    <h2 className="text-xl font-bold text-gray-900 mb-4">
                        Contractor Requests
                        <span className="text-sm font-normal text-gray-600 ml-2">({requests.length})</span>
                    </h2>

                    {loading ? (
                        <div className="bg-white rounded-lg shadow-sm p-8 text-center">
                            <p className="text-gray-600">Loading requests...</p>
                        </div>
                    ) : requests.length === 0 ? (
                        <div className="bg-white rounded-lg shadow-sm p-8 text-center">
                            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Users className="w-8 h-8 text-gray-400" />
                            </div>
                            <p className="text-gray-600 font-medium mb-1">No Contractor Requests</p>
                            <p className="text-sm text-gray-500">Requests from contractors will appear here</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {requests.map((request, index) => (
                                <ContractorRequestCard
                                    key={request.id}
                                    request={request}
                                    index={index}
                                    onAccept={handleAccept}
                                    onDecline={handleDecline}
                                />
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Bottom Navigation */}
            <UserBottomNav />
        </div>
    );
};

export default ContractorRequest;
