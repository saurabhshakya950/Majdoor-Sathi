import { MapPin, Briefcase, Calendar, IndianRupee } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { memo } from 'react';

const ContractorJobCard = memo(({ job, onViewDetails, onApplyNow, appliedJobs = {}, index = 0 }) => {
    const navigate = useNavigate();

    // Check if this job has been applied to and get its status
    const applicationData = appliedJobs[job.id];
    const isApplied = !!applicationData;
    const applicationStatus = applicationData?.status;
    const chatId = applicationData?.chatId;

    const handleChatClick = async () => {
        console.log('[INFO] Chat button clicked (Contractor Panel - User Job)');
        console.log('Current chatId:', chatId);
        console.log('Job ID:', job.id);
        console.log('Job User Name:', job.userName);
        console.log('Application Data:', applicationData);

        try {
            // Import API modules
            const { jobAPI, chatAPI } = await import('../../../services/api');

            // ALWAYS check for existing chats first (most reliable method)
            console.log('[INFO] Checking for existing chats...');
            const chatsResponse = await chatAPI.getUserChats();
            console.log('[DEBUG] User Chats Response:', chatsResponse);

            if (chatsResponse.success && chatsResponse.data.chats && chatsResponse.data.chats.length > 0) {
                // Find chat with this user by ID (most accurate)
                const existingChat = chatsResponse.data.chats.find(chat => {
                    const otherId = chat.otherParticipant?.userId?.toString();
                    const jobOwnerId = (job.userId || '').toString();
                    return otherId === jobOwnerId;
                });

                if (existingChat) {
                    console.log('[SUCCESS] Found existing chat by ID:', existingChat._id);
                    navigate(`/contractor/chat/${existingChat._id}`);
                    return;
                }

                // Fallback: Find by name (if ID mismatch or missing)
                const existingChatByName = chatsResponse.data.chats.find(chat => {
                    const otherName = (chat.otherParticipant?.name || '').toLowerCase().trim();
                    const jobUserName = (job.userName || '').toLowerCase().trim();
                    return otherName === jobUserName && jobUserName !== '';
                });

                if (existingChatByName) {
                    console.log('[SUCCESS] Found existing chat by name:', existingChatByName._id);
                    navigate(`/contractor/chat/${existingChatByName._id}`);
                    return;
                }

                console.log('[INFO] No existing chat found with this user');
            }

            // If no chat found via list, OR if chatId is null, INITIALIZE it
            console.log('[INFO] Initializing new chat with user...');
            const initResponse = await chatAPI.initializeChat({
                participant2Id: job.userId,
                participant2Type: 'User',
                participant2Name: job.userName,
                participant2Phone: job.mobileNumber || '',
                requestId: applicationData?.applicationId || job.id,
                requestType: 'JobApplication'
            });

            if (initResponse.success && initResponse.data.chat) {
                console.log('[SUCCESS] Chat initialized:', initResponse.data.chat._id);
                navigate(`/contractor/chat/${initResponse.data.chat._id}`);
                return;
            }

            console.log('[ERROR] Failed to initialize chat, redirecting to chat list');
            navigate('/contractor/chat');

        } catch (error) {
            console.error('[ERROR] Failed to open chat:', error);
            // On error, still try to navigate to chat list
            navigate('/contractor/chat');
        }
    };

    const handleApplyClick = () => {
        if (job.status !== 'Open') {
            // Show toast message for closed job
            toast.error('This job is closed, you cannot apply.', {
                duration: 3000,
                position: 'top-center',
            });
            return;
        }

        if (isApplied) {
            toast.info('You have already applied for this job.', {
                duration: 2000,
                position: 'top-center',
            });
            return;
        }

        onApplyNow(job.id);
    };

    // Determine button style and text based on status
    let buttonClass = '';
    let buttonText = 'Apply Now';

    if (applicationStatus === 'Accepted') {
        buttonClass = 'bg-green-500 text-white cursor-default';
        buttonText = '✓ Approved';
    } else if (applicationStatus === 'Rejected') {
        buttonClass = 'bg-gray-500 text-white cursor-default';
        buttonText = '✗ Declined';
    } else if (isApplied) {
        buttonClass = 'bg-orange-500 text-white cursor-default';
        buttonText = '⏳ Request Sent';
    } else if (job.status === 'Open') {
        buttonClass = 'btn-primary';
    } else {
        buttonClass = 'bg-gray-300 text-gray-500 cursor-not-allowed';
    }

    return (
        <div className="premium-card card-fade-in" style={{ animationDelay: `${index * 0.05}s` }}>
            {/* Header with User Info and Status */}
            <div className="flex justify-between items-start mb-3">
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-yellow-400 to-yellow-500 rounded-full flex items-center justify-center shadow-md">
                        <span className="text-lg font-bold text-gray-900">
                            {job.userName.charAt(0).toUpperCase()}
                        </span>
                    </div>
                    <div>
                        <h3 className="font-semibold text-gray-900">{job.userName}</h3>
                        <div className="flex items-center gap-1 text-sm text-gray-600">
                            <MapPin className="w-4 h-4" />
                            <span>{job.city}</span>
                        </div>
                    </div>
                </div>
                <span className={`px-3 py-1 rounded-full text-sm font-medium transition-all ${job.status === 'Open'
                    ? 'bg-green-100 text-green-700'
                    : 'bg-gray-100 text-gray-700'
                    }`}>
                    {job.status}
                </span>
            </div>

            {/* Job Title */}
            <h2 className="text-lg font-bold text-gray-900 mb-2">{job.jobTitle}</h2>

            {/* Job Description */}
            <p className="text-gray-600 text-sm mb-4 line-clamp-2">{job.jobDescription}</p>

            {/* Job Details */}
            <div className="flex items-center gap-4 mb-4 text-sm text-gray-600 flex-wrap">
                <div className="flex items-center gap-1">
                    <Briefcase className="w-4 h-4" />
                    <span>{job.category}</span>
                </div>
                <div className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    <span>{job.workDuration}</span>
                </div>
                <div className="flex items-center gap-1 text-yellow-600 font-medium">
                    <IndianRupee className="w-4 h-4" />
                    <span>
                        {job.budgetType === 'Negotiable'
                            ? 'Negotiable'
                            : `₹${job.budgetAmount}`}
                    </span>
                </div>
            </div>

            {/* Action Buttons */}
            {applicationStatus === 'Accepted' ? (
                <div className="space-y-2">
                    <button
                        onClick={() => onViewDetails(job)}
                        className="w-full btn-secondary py-2.5"
                    >
                        View Details
                    </button>
                    <div className="flex gap-2">
                        <button
                            disabled
                            className="flex-1 bg-green-500 text-white cursor-default shadow-md font-semibold py-2 rounded-lg text-sm"
                        >
                            ✓ Approved
                        </button>
                        <button
                            onClick={handleChatClick}
                            className="flex-1 bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 rounded-lg transition-all active:scale-95 text-sm"
                        >
                            💬 Chat
                        </button>
                    </div>
                </div>
            ) : (
                <div className="flex gap-3">
                    <button
                        onClick={() => onViewDetails(job)}
                        className="flex-1 btn-secondary py-2.5"
                    >
                        View Details
                    </button>
                    <button
                        onClick={handleApplyClick}
                        disabled={job.status !== 'Open' || isApplied}
                        className={`flex-1 font-bold py-2.5 rounded-lg transition-all duration-200 ease-out ${buttonClass}`}
                    >
                        {buttonText}
                    </button>
                </div>
            )}
        </div>
    );
});

ContractorJobCard.displayName = 'ContractorJobCard';

export default ContractorJobCard;
