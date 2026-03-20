import { MapPin, Briefcase, Phone, Calendar, IndianRupee, MessageSquare } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { memo } from 'react';

const LabourContractorCard = memo(({ card, onViewDetails, onApplyNow, index = 0, appliedJobs = {} }) => {
    const navigate = useNavigate();
    const applicationStatus = appliedJobs[card.id];
    const isApplied = applicationStatus && applicationStatus.status;
    const chatId = applicationStatus?.chatId;

    const getButtonConfig = () => {
        if (!isApplied) {
            return {
                text: 'Apply Now',
                className: 'flex-1 btn-primary',
                disabled: false
            };
        }

        switch (applicationStatus.status) {
            case 'Pending':
                return {
                    text: '⌛ Request Sent',
                    className: 'flex-1 bg-orange-500 text-white font-bold py-2.5 rounded-lg cursor-not-allowed',
                    disabled: true
                };
            case 'Accepted':
                return {
                    text: '✓ Approved',
                    className: 'flex-1 bg-green-500 text-white font-bold py-2.5 rounded-lg cursor-not-allowed',
                    disabled: true
                };
            case 'Rejected':
                return {
                    text: '✗ Declined',
                    className: 'flex-1 bg-gray-400 text-white font-bold py-2.5 rounded-lg cursor-not-allowed',
                    disabled: true
                };
            default:
                return {
                    text: 'Apply Now',
                    className: 'flex-1 btn-primary',
                    disabled: false
                };
        }
    };

    const buttonConfig = getButtonConfig();

    const handleChatClick = async () => {
        console.log('[INFO] Chat button clicked');
        console.log('Current chatId:', chatId);
        console.log('Card ID:', card.id);
        console.log('Card Contractor Name:', card.contractorName);
        console.log('Application Status:', applicationStatus);
        
        try {
            // Import API modules
            const { contractorAPI, chatAPI } = await import('../../../services/api');
            
            // ALWAYS check for existing chats first (most reliable method)
            console.log('[INFO] Checking for existing chats...');
            const chatsResponse = await chatAPI.getUserChats();
            console.log('[DEBUG] User Chats Response:', chatsResponse);
            
            if (chatsResponse.success && chatsResponse.data.chats && chatsResponse.data.chats.length > 0) {
                console.log('📋 Available chats:', chatsResponse.data.chats.map(c => ({
                    id: c._id,
                    name: c.otherParticipant?.name
                })));
                
                // Find chat with this contractor by name (case-insensitive, trimmed)
                const existingChat = chatsResponse.data.chats.find(chat => {
                    const otherName = (chat.otherParticipant?.name || '').toLowerCase().trim();
                    const cardName = (card.contractorName || '').toLowerCase().trim();
                    console.log(`Comparing: "${otherName}" === "${cardName}"`);
                    return otherName === cardName;
                });
                
                if (existingChat) {
                    console.log('[SUCCESS] Found existing chat with contractor:', existingChat._id);
                    navigate(`/labour/chat/${existingChat._id}`);
                    return;
                }
                
                console.log('[INFO] No existing chat found with this contractor name');
            } else {
                console.log('[INFO] No chats available or API failed');
            }
            
            // If chatId is available in application status, use it
            if (chatId) {
                console.log('[SUCCESS] ChatId available in application status, navigating to:', `/labour/chat/${chatId}`);
                navigate(`/labour/chat/${chatId}`);
                return;
            }
            
            // Fetch latest application status to get chatId
            console.log('[REFRESH] Fetching latest application status...');
            const response = await contractorAPI.getLabourApplications();
            console.log('[DEBUG] Applications Response:', response);
            
            if (response.success && response.data.applications) {
                const updatedStatus = response.data.applications[card.id];
                console.log('📋 Updated Status for card:', updatedStatus);
                
                if (updatedStatus?.chatId) {
                    console.log('[SUCCESS] ChatId found in updated application, navigating to:', `/labour/chat/${updatedStatus.chatId}`);
                    navigate(`/labour/chat/${updatedStatus.chatId}`);
                    return;
                }
            }
            
            // If still no chat found, navigate to chat list page
            console.log('[ERROR] No chat available through any method, redirecting to chat list');
            navigate('/labour/chat');
            
        } catch (error) {
            console.error('[ERROR] Failed to open chat:', error);
            // On error, still try to navigate to chat list
            navigate('/labour/chat');
        }
    };

    return (
        <div className="premium-card card-fade-in" style={{ animationDelay: `${index * 0.05}s` }}>
            {/* Header with Contractor Info and Status Badge */}
            <div className="flex justify-between items-start mb-3">
                <div className="flex items-start gap-3">
                    <div className="w-16 h-16 bg-gradient-to-br from-yellow-400 to-yellow-500 rounded-full flex items-center justify-center shadow-md">
                        <span className="text-2xl font-bold text-gray-900">
                            {card.contractorName.charAt(0).toUpperCase()}
                        </span>
                    </div>
                    <div className="flex-1">
                        <h3 className="font-bold text-lg text-gray-900">{card.contractorName}</h3>
                        <div className="flex items-center gap-1 text-sm text-gray-600">
                            <MapPin className="w-4 h-4" />
                            <span>{card.city}</span>
                        </div>
                    </div>
                </div>
                <span className={`px-3 py-1 rounded-full text-sm font-medium transition-all ${
                    card.profileStatus === 'Active' 
                        ? 'bg-green-100 text-green-700' 
                        : 'bg-gray-100 text-gray-700'
                }`}>
                    {card.profileStatus === 'Active' ? 'Open' : 'Closed'}
                </span>
            </div>

            {/* Primary Work */}
            <div className="mb-3">
                <p className="text-xs text-gray-500">Primary Work:</p>
                <p className="text-lg font-bold text-gray-900">{card.labourSkill}</p>
            </div>

            {/* Experience and Work Duration */}
            <div className="flex gap-4 mb-3 flex-wrap">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Briefcase className="w-4 h-4" />
                    <span>Exp: {card.experience}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Calendar className="w-4 h-4" />
                    <span>{card.workDuration}</span>
                </div>
            </div>

            {/* Budget and Phone */}
            <div className="flex gap-4 mb-4 flex-wrap">
                <div className="flex items-center gap-2 text-sm text-yellow-600 font-medium">
                    <IndianRupee className="w-4 h-4" />
                    <span>
                        {card.budgetType === 'Negotiable' 
                            ? 'Negotiable' 
                            : `₹${card.budgetAmount}`}
                    </span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Phone className="w-4 h-4" />
                    <span>{card.phoneNumber}</span>
                </div>
            </div>

            {/* Action Buttons */}
            {applicationStatus?.status === 'Accepted' ? (
                <div className="space-y-2">
                    <button
                        onClick={() => onViewDetails(card)}
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
                            className="flex-1 bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 rounded-lg transition-all active:scale-95 text-sm flex items-center justify-center gap-2"
                        >
                            <MessageSquare className="w-4 h-4" />
                            Chat
                        </button>
                    </div>
                </div>
            ) : (
                <div className="flex gap-3">
                    <button
                        onClick={() => onViewDetails(card)}
                        className="flex-1 btn-secondary py-2.5"
                    >
                        View Details
                    </button>
                    <button
                        onClick={() => !buttonConfig.disabled && onApplyNow(card.id)}
                        className={buttonConfig.className}
                        disabled={buttonConfig.disabled}
                    >
                        {buttonConfig.text}
                    </button>
                </div>
            )}
        </div>
    );
});

LabourContractorCard.displayName = 'LabourContractorCard';

export default LabourContractorCard;
