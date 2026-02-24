import { MapPin, Phone, Calendar, Clock, CheckCircle, XCircle, MessageCircle } from 'lucide-react';
import { memo } from 'react';
import { useNavigate } from 'react-router-dom';

const ContractorRequestCard = memo(({ request, onAccept, onDecline, index = 0, showButtons = true, showStatus = false }) => {
    // Safety checks for required fields
    const navigate = useNavigate();
    const contractorName = request.contractorName || request.applicantName || 'Unknown';
    const location = request.location || 'Not specified';
    const phoneNumber = request.phoneNumber || 'N/A';
    const jobTitle = request.jobTitle || 'Job Application';
    const date = request.date || 'N/A';
    const time = request.time || 'N/A';

    const handleChatClick = async () => {
        console.log('🔵 Chat button clicked (ContractorRequestCard)');

        try {
            const { chatAPI } = await import('../../../services/api');

            // Prefer direct chatId if available
            if (request.chatId) {
                console.log('✅ Using direct chatId from request');
                navigate(`/user/chat/${request.chatId}`);
                return;
            }

            // Fallback: Search for existing chats
            console.log('🔍 Searching for existing chats...');
            const chatsResponse = await chatAPI.getUserChats();

            if (chatsResponse.success && chatsResponse.data.chats && chatsResponse.data.chats.length > 0) {
                // Find by applicantUserId (most accurate)
                const existingChat = chatsResponse.data.chats.find(chat => {
                    const otherId = chat.otherParticipant?.userId?.toString();
                    const applicantId = (request.applicantUserId || '').toString();
                    return otherId === applicantId && applicantId !== '';
                });

                if (existingChat) {
                    console.log('✅ Found existing chat by applicant ID');
                    navigate(`/user/chat/${existingChat._id}`);
                    return;
                }

                // Fallback: Find by name
                const existingChatByName = chatsResponse.data.chats.find(chat => {
                    const otherName = (chat.otherParticipant?.name || '').toLowerCase().trim();
                    const cardName = contractorName.toLowerCase().trim();
                    return otherName === cardName && cardName !== '';
                });

                if (existingChatByName) {
                    console.log('✅ Found existing chat by name');
                    navigate(`/user/chat/${existingChatByName._id}`);
                    return;
                }
            }

            // Fallback: Initialize new chat
            console.log('🚀 Initializing new chat with contractor...');
            const initResponse = await chatAPI.initializeChat({
                participant2Id: request.applicantUserId,
                participant2Type: 'Contractor',
                participant2Name: contractorName,
                participant2Phone: phoneNumber,
                requestId: request.applicationId || request.id,
                requestType: 'JobApplication'
            });

            if (initResponse.success && initResponse.data.chat) {
                console.log('✅ Chat initialized:', initResponse.data.chat._id);
                navigate(`/user/chat/${initResponse.data.chat._id}`);
                return;
            }

            console.log('❌ No chat found, navigating to chat list');
            navigate('/user/chat');
        } catch (error) {
            console.error('❌ Failed to open chat:', error);
            navigate('/user/chat');
        }
    };

    return (
        <div className="premium-card card-fade-in" style={{ animationDelay: `${index * 0.05}s` }}>
            {/* Header with Contractor Info */}
            <div className="flex items-center gap-3 mb-4">
                <div className="w-14 h-14 bg-gradient-to-br from-blue-400 to-blue-500 rounded-full flex items-center justify-center shadow-md">
                    <span className="text-xl font-bold text-white">
                        {contractorName.charAt(0).toUpperCase()}
                    </span>
                </div>
                <div className="flex-1">
                    <h3 className="font-bold text-gray-900 text-lg">{contractorName}</h3>
                    <div className="flex items-center gap-1 text-sm text-gray-600">
                        <MapPin className="w-4 h-4" />
                        <span>{location}</span>
                    </div>
                </div>
                {/* Status Badge for History */}
                {showStatus && (
                    <div className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 ${request.status === 'accepted'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-red-100 text-red-700'
                        }`}>
                        {request.status === 'accepted' ? (
                            <>
                                <CheckCircle className="w-3 h-3" />
                                <span>Accepted</span>
                            </>
                        ) : (
                            <>
                                <XCircle className="w-3 h-3" />
                                <span>Declined</span>
                            </>
                        )}
                    </div>
                )}
            </div>

            {/* Contact Information */}
            <div className="space-y-2 mb-4">
                <div className="flex items-center gap-2 text-gray-700">
                    <Phone className="w-4 h-4 text-gray-500" />
                    <span className="text-sm font-medium">{phoneNumber}</span>
                </div>

                {/* Date and Time */}
                <div className="flex items-center gap-4 text-sm text-gray-600">
                    <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        <span>{date}</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        <span>{time}</span>
                    </div>
                </div>
            </div>

            {/* Job Title */}
            <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                <p className="text-xs text-gray-500 mb-1">Applied for</p>
                <p className="text-sm font-semibold text-gray-900">{jobTitle}</p>
            </div>

            {/* Action Buttons - Only show if showButtons is true */}
            {showButtons && (
                <div className="flex gap-3">
                    <button
                        onClick={() => onDecline(request.id)}
                        className="flex-1 bg-red-500 hover:bg-red-600 text-white font-bold py-2.5 rounded-lg transition-all duration-200 ease-out hover:shadow-lg active:scale-95 text-sm"
                    >
                        Decline
                    </button>
                    <button
                        onClick={() => onAccept(request.id)}
                        className="flex-1 bg-green-500 hover:bg-green-600 text-white font-bold py-2.5 rounded-lg transition-all duration-200 ease-out hover:shadow-lg active:scale-95 text-sm"
                    >
                        Accept
                    </button>
                </div>
            )}

            {/* Chat Button for History or Accepted Status */}
            {request.status === 'accepted' && (
                <button
                    onClick={handleChatClick}
                    className="w-full mt-2 bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 rounded-lg flex items-center justify-center gap-2 transition-all active:scale-95 shadow-md"
                >
                    <MessageCircle className="w-5 h-5" />
                    <span>Chat with Contractor</span>
                </button>
            )}
        </div>
    );
});

ContractorRequestCard.displayName = 'ContractorRequestCard';

export default ContractorRequestCard;
