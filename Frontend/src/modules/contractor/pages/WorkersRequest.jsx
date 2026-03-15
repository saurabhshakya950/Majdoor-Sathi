import { useState, useEffect } from 'react';
import { MapPin, Phone, Calendar, Clock } from 'lucide-react';
import toast from 'react-hot-toast';
import ContractorBottomNav from '../components/ContractorBottomNav';
import ContractorHeader from '../components/ContractorHeader';
import RequestPageTitle from '../components/RequestPageTitle';
import { contractorAPI } from '../../../services/api';

const WorkersRequest = () => {
    const [applications, setApplications] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadApplications();

        // Auto-refresh every 5 seconds
        const interval = setInterval(() => {
            if (!document.hidden) {
                console.log('🔄 Auto-refreshing labour applications...');
                loadApplications();
            }
        }, 5000);

        return () => clearInterval(interval);
    }, []);

    const loadApplications = async () => {
        try {
            console.log('🔵 Loading labour applications...');
            const response = await contractorAPI.getContractorJobApplications();

            if (response.success) {
                console.log('✅ Applications loaded:', response.data.applications.length);
                setApplications(response.data.applications);
            }
        } catch (error) {
            console.error('❌ Failed to load applications:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleAccept = async (jobId, applicationId) => {
        try {
            console.log('🟢 Accepting application:', applicationId);

            const response = await contractorAPI.updateContractorJobApplicationStatus(
                jobId,
                applicationId,
                'Accepted'
            );

            if (response.success) {
                toast.success('Application accepted!');

                // Trigger event for labour to update their status
                window.dispatchEvent(new Event('labour-contractor-application-updated'));

                // Refresh applications
                await loadApplications();
            }
        } catch (error) {
            console.error('❌ Failed to accept application:', error);
            toast.error('Failed to accept application');
        }
    };

    const handleDecline = async (jobId, applicationId) => {
        try {
            console.log('🔴 Declining application:', applicationId);

            const response = await contractorAPI.updateContractorJobApplicationStatus(
                jobId,
                applicationId,
                'Rejected'
            );

            if (response.success) {
                toast.success('Application declined');

                // Trigger event for labour to update their status
                window.dispatchEvent(new Event('labour-contractor-application-updated'));

                // Refresh applications
                await loadApplications();
            }
        } catch (error) {
            console.error('❌ Failed to decline application:', error);
            toast.error('Failed to decline application');
        }
    };

    return (
        <div className="bg-gray-50 flex flex-col overflow-hidden" style={{ height: '100dvh', minHeight: '-webkit-fill-available' }}>
            <div className="sticky top-0 z-10 bg-white">
                <ContractorHeader />
            </div>

            <div className="flex-1 overflow-y-auto">
                <div className="p-4 pb-24">
                    <RequestPageTitle title="Workers Request" />

                    {loading ? (
                        <div className="bg-white rounded-lg shadow-sm p-8 text-center">
                            <p className="text-gray-600">Loading applications...</p>
                        </div>
                    ) : applications.length === 0 ? (
                        <div className="bg-white rounded-lg shadow-sm p-8 text-center">
                            <div className="text-6xl mb-4">👷</div>
                            <p className="text-gray-600 font-medium mb-1">No Applications Yet</p>
                            <p className="text-sm text-gray-500">
                                Labour applications will appear here
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {applications.map((app, index) => (
                                <div
                                    key={app._id}
                                    className="premium-card card-fade-in"
                                    style={{ animationDelay: `${index * 0.05}s` }}
                                >
                                    {/* Header with Worker Info */}
                                    <div className="flex items-center gap-3 mb-4">
                                        <div className="w-14 h-14 bg-gradient-to-br from-green-400 to-green-500 rounded-full flex items-center justify-center shadow-md">
                                            <span className="text-xl font-bold text-white">
                                                {app.labourName.charAt(0).toUpperCase()}
                                            </span>
                                        </div>
                                        <div className="flex-1">
                                            <h3 className="font-bold text-gray-900 text-lg">{app.labourName}</h3>
                                            <div className="flex items-center gap-1 text-sm text-gray-600">
                                                <MapPin className="w-4 h-4" />
                                                <span>{app.location}</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Contact Information */}
                                    <div className="space-y-2 mb-4">
                                        <div className="flex items-center gap-2 text-gray-700">
                                            <Phone className="w-4 h-4 text-gray-500" />
                                            <span className="text-sm font-medium">{app.phoneNumber}</span>
                                        </div>

                                        {/* Date and Time */}
                                        <div className="flex items-center gap-4 text-sm text-gray-600">
                                            <div className="flex items-center gap-1">
                                                <Calendar className="w-4 h-4" />
                                                <span>{new Date(app.appliedAt).toLocaleDateString()}</span>
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <Clock className="w-4 h-4" />
                                                <span>{new Date(app.appliedAt).toLocaleTimeString()}</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Job and Skill Info */}
                                    <div className="mb-4 p-3 bg-gray-50 rounded-lg space-y-2">
                                        <div>
                                            <p className="text-xs text-gray-500">Applied for</p>
                                            <p className="text-sm font-semibold text-gray-900">{app.jobTitle}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-gray-500">Skill</p>
                                            <p className="text-sm font-semibold text-gray-900">{app.skillType}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-gray-500">Experience</p>
                                            <p className="text-sm font-semibold text-gray-900">{app.experience}</p>
                                        </div>
                                    </div>

                                    {/* Action Buttons */}
                                    <div className="flex gap-3">
                                        <button
                                            onClick={() => handleDecline(app.jobId, app._id)}
                                            className="flex-1 bg-red-500 hover:bg-red-600 text-white font-bold py-2.5 rounded-lg transition-all duration-200 ease-out hover:shadow-lg active:scale-95"
                                        >
                                            Decline
                                        </button>
                                        <button
                                            onClick={() => handleAccept(app.jobId, app._id)}
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
            </div>

            <ContractorBottomNav />
        </div>
    );
};

export default WorkersRequest;
