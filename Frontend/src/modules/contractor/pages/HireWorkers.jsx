import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Search, SlidersHorizontal, X } from 'lucide-react';
import ContractorBottomNav from '../components/ContractorBottomNav';
import ContractorHeader from '../components/ContractorHeader';
import { labourAPI } from '../../../services/api';


const HireWorkers = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const [labourCards, setLabourCards] = useState([]);
    const [filteredCards, setFilteredCards] = useState([]);
    const [selectedCard, setSelectedCard] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [showFilterModal, setShowFilterModal] = useState(false);
    const [selectedCity, setSelectedCity] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('');
    const [hiredWorkers, setHiredWorkers] = useState({});
    const [chatIds, setChatIds] = useState({}); // Store chatIds for approved workers

    const cities = ['Indore', 'Bhopal', 'Dewas', 'Ujjain', 'Jabalpur', 'Gwalior', 'Ratlam'];

    useEffect(() => {
        // Clean up old localStorage dummy data on mount
        localStorage.removeItem('labour_cards');

        fetchLabourCards();

        // Check if category was passed from home page
        if (location.state?.selectedCategory) {
            setSelectedCategory(location.state.selectedCategory);
        }

        // Load hired workers state from database
        const loadHiredState = async () => {
            try {
                // Fetch sent hire requests from database
                const response = await labourAPI.getSentHireRequests({ requesterModel: 'Contractor' });

                if (response.success) {
                    console.log('📊 Sent hire requests:', response.data.hireRequests);

                    // Create state map from requests
                    const uiStateMap = {};
                    const chatIdMap = {};
                    response.data.hireRequests.forEach(req => {
                        const labourId = req.labourId; // Already a string from backend

                        console.log(`Mapping labourId: ${labourId} → status: ${req.status}, chatId: ${req.chatId}`);

                        // Map status to UI states
                        if (req.status === 'accepted') {
                            uiStateMap[labourId] = 'approved';
                            if (req.chatId) {
                                chatIdMap[labourId] = req.chatId;
                            }
                        } else if (req.status === 'declined') {
                            uiStateMap[labourId] = 'declined';
                        } else {
                            uiStateMap[labourId] = 'pending';
                        }
                    });

                    console.log('✅ Final UI state map:', uiStateMap);
                    console.log('✅ Final chatId map:', chatIdMap);
                    setHiredWorkers(uiStateMap);
                    setChatIds(chatIdMap);
                }
            } catch (error) {
                console.error('Failed to load hired state:', error);
                setHiredWorkers({});
            }
        };

        loadHiredState();

        // Update when page becomes visible (user switches back to this tab/page)
        const handleVisibilityChange = () => {
            if (!document.hidden) {
                loadHiredState();
            }
        };

        // Listen for hire request updates from labour panel
        const handleHireRequestUpdate = () => {
            loadHiredState();
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);
        window.addEventListener('hire-request-updated', handleHireRequestUpdate);

        // Cleanup
        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            window.removeEventListener('hire-request-updated', handleHireRequestUpdate);
        };
    }, [location.state]);

    const fetchLabourCards = async () => {
        try {
            // Always fetch from database - no localStorage or dummy cards
            const response = await labourAPI.browseLabourCards();

            if (response.success && response.data.labours) {
                // Transform API data
                const dbCards = response.data.labours.map(labour => ({
                    id: labour._id,
                    userId: labour.user?._id || labour.user,
                    fullName: labour.labourCardDetails?.fullName || '',
                    primarySkill: labour.skillType,
                    rating: labour.rating || 0,
                    gender: labour.labourCardDetails?.gender || '',
                    mobileNumber: labour.labourCardDetails?.mobileNumber || '',
                    city: labour.labourCardDetails?.city || '',
                    address: labour.labourCardDetails?.address || '',
                    skills: labour.labourCardDetails?.skills || labour.skillType,
                    experience: labour.experience || '',
                    previousWorkLocation: labour.previousWorkLocation || '',
                    availability: labour.availability || 'Full Time',
                    availabilityStatus: labour.availabilityStatus || 'Available',
                    createdAt: labour.createdAt
                }));

                setLabourCards(dbCards);
                setFilteredCards(dbCards);
            } else {
                setLabourCards([]);
                setFilteredCards([]);
            }
        } catch (error) {
            console.error('Failed to fetch labour cards:', error);
            setLabourCards([]);
            setFilteredCards([]);
        }
    };

    // Filter cards based on selected city, category, and search query
    useEffect(() => {
        let filtered = labourCards;

        // Filter by category
        if (selectedCategory) {
            filtered = filtered.filter(card =>
                card.primarySkill.toLowerCase() === selectedCategory.toLowerCase()
            );
        }

        // Filter by city
        if (selectedCity) {
            filtered = filtered.filter(card =>
                card.city.toLowerCase() === selectedCity.toLowerCase()
            );
        }

        // Filter by search query
        if (searchQuery.trim()) {
            filtered = filtered.filter(card =>
                card.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                card.primarySkill.toLowerCase().includes(searchQuery.toLowerCase()) ||
                card.city.toLowerCase().includes(searchQuery.toLowerCase())
            );
        }

        setFilteredCards(filtered);
    }, [selectedCity, selectedCategory, searchQuery, labourCards]);

    const handleViewDetails = (card) => {
        setSelectedCard(card);
    };

    const handleCloseModal = () => {
        setSelectedCard(null);
    };

    const handleOpenFilter = () => {
        setShowFilterModal(true);
    };

    const handleCloseFilter = () => {
        setShowFilterModal(false);
    };

    const handleCitySelect = (city) => {
        setSelectedCity(city);
        setShowFilterModal(false);
    };

    const handleClearFilter = () => {
        setSelectedCity('');
        setShowFilterModal(false);
    };

    const handleHireWorker = async (card) => {
        try {
            // Check if this is a dummy card (string ID) or real database card (ObjectId)
            const isDummyCard = typeof card.id === 'string' && card.id.length < 10;

            if (isDummyCard) {
                alert('⚠️ This is a demo worker. Please hire a real worker from the database.');
                return;
            }

            // Get user/contractor info from localStorage
            const userId = localStorage.getItem('user_id');
            const mobileNumber = localStorage.getItem('mobile_number') || '';
            const contractorProfile = JSON.parse(localStorage.getItem('contractor_profile') || '{}');
            const contractorPhone = contractorProfile.phoneNumber || mobileNumber || '';

            if (!userId) {
                alert('Please login first');
                return;
            }

            // Create request object for API
            const requestData = {
                labourId: card.id,
                labourName: card.fullName,
                labourSkill: card.primarySkill,
                labourPhone: card.mobileNumber,
                labourCity: card.city,
                requesterId: userId,
                requesterModel: 'Contractor',
                requesterName: contractorProfile.firstName || 'Contractor',
                requesterPhone: contractorPhone,
                requesterLocation: contractorProfile.city || 'N/A'
            };

            // Send request to database
            const response = await labourAPI.createHireRequest(requestData);

            if (response.success) {
                // Update button state immediately
                const updatedHired = { ...hiredWorkers, [card.id]: 'pending' };
                setHiredWorkers(updatedHired);

                // Show success message
                alert('✅ Hire request sent successfully!');
            }

        } catch (error) {
            // Show user-friendly error message
            if (error.response?.data?.message) {
                const errorMsg = error.response.data.message;
                if (errorMsg.includes('pending hire request already exists')) {
                    alert('⚠️ You already sent a request to this worker');
                } else {
                    alert(errorMsg);
                }
            } else {
                alert('Failed to send hire request. Please try again.');
            }
        }
    };

    return (
        <div className="bg-gray-50 flex flex-col overflow-hidden" style={{ height: '100dvh', minHeight: '-webkit-fill-available' }}>
            {/* Sticky Header and Search Bar */}
            <div className="sticky top-0 z-10 bg-white">
                <ContractorHeader />

                {/* Search Bar */}
                <div className="px-4 py-3 shadow-sm">
                    <div className="flex items-center gap-3">
                        <div className="flex-1 flex items-center bg-gray-100 rounded-lg px-4 py-2">
                            <Search className="w-5 h-5 text-gray-400 mr-2" />
                            <input
                                type="text"
                                placeholder="Search workers..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="flex-1 bg-transparent outline-none text-gray-700 placeholder-gray-400"
                            />
                        </div>
                        <button
                            onClick={handleOpenFilter}
                            className={`p-2 rounded-lg relative ${selectedCity ? 'bg-blue-500' : 'bg-gray-100'}`}
                        >
                            <SlidersHorizontal className={`w-5 h-5 ${selectedCity ? 'text-white' : 'text-gray-600'}`} />
                            {selectedCity && (
                                <span className="absolute -top-1 -right-1 bg-red-500 w-3 h-3 rounded-full"></span>
                            )}
                        </button>
                    </div>
                    {/* Active Filter Badge */}
                    {selectedCity && (
                        <div className="mt-2 flex items-center gap-2">
                            <span className="text-xs text-gray-600">Filtered by:</span>
                            <div className="inline-flex items-center gap-1 bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm">
                                <span>{selectedCity}</span>
                                <button onClick={handleClearFilter} className="hover:bg-blue-200 rounded-full p-0.5">
                                    <X className="w-3 h-3" />
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Main Content Area - Scrollable */}
            <div className="flex-1 overflow-y-auto pb-24">
                <div className="p-4">
                    <h2 className="text-xl font-bold text-gray-900 mb-4">

                        Available Workers
                        {selectedCategory && <span className="text-sm font-normal text-gray-600"> - {selectedCategory}</span>}
                        {selectedCity && <span className="text-sm font-normal text-gray-600"> in {selectedCity}</span>}
                        <span className="text-sm font-normal text-gray-600"> ({filteredCards.length})</span>
                    </h2>

                    {/* Active Filters */}
                    {(selectedCategory || selectedCity) && (
                        <div className="mb-4 flex items-center gap-2 flex-wrap">
                            <span className="text-xs text-gray-600">Active filters:</span>
                            {selectedCategory && (
                                <div className="inline-flex items-center gap-1 bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm">
                                    <span>{selectedCategory}</span>
                                    <button onClick={() => setSelectedCategory('')} className="hover:bg-blue-200 rounded-full p-0.5">
                                        <X className="w-3 h-3" />
                                    </button>
                                </div>
                            )}
                            {selectedCity && (
                                <div className="inline-flex items-center gap-1 bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm">
                                    <span>{selectedCity}</span>
                                    <button onClick={handleClearFilter} className="hover:bg-blue-200 rounded-full p-0.5">
                                        <X className="w-3 h-3" />
                                    </button>
                                </div>
                            )}
                        </div>
                    )}

                    {filteredCards.length === 0 ? (
                        <div className="bg-white rounded-lg shadow-sm p-6 text-center">
                            <p className="text-gray-600">
                                {selectedCity || searchQuery || selectedCategory
                                    ? 'No workers found matching your criteria'
                                    : 'No workers available at the moment'}
                            </p>
                            {(selectedCity || searchQuery || selectedCategory) && (
                                <button
                                    onClick={() => {
                                        setSelectedCity('');
                                        setSearchQuery('');
                                        setSelectedCategory('');
                                    }}
                                    className="mt-3 text-blue-500 hover:text-blue-600 font-medium"
                                >
                                    Clear filters
                                </button>
                            )}
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {filteredCards.map((card, index) => (
                                <div key={card.id} className="premium-card card-fade-in">
                                    {/* Header */}
                                    <div className="flex items-start gap-3 mb-3">
                                        <div className="w-16 h-16 bg-gradient-to-br from-yellow-400 to-yellow-500 rounded-full flex items-center justify-center shadow-md">
                                            <span className="text-2xl font-bold text-gray-900">
                                                {card.fullName.charAt(0).toUpperCase()}
                                            </span>
                                        </div>
                                        <div className="flex-1">
                                            <h3 className="font-bold text-lg text-gray-900">{card.fullName}</h3>
                                            <p className="text-sm text-gray-600">🔧 {card.primarySkill}</p>
                                            <div className="flex gap-1 mt-1">
                                                {[1, 2, 3, 4, 5].map((star) => (
                                                    <span key={star} className={`text-lg transition-all ${star <= card.rating ? 'text-yellow-400' : 'text-gray-300'}`}>
                                                        ★
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Basic Info */}
                                    <div className="grid grid-cols-2 gap-3 mb-3 text-sm">
                                        <div>
                                            <p className="text-gray-500 text-xs">Gender</p>
                                            <p className="font-medium text-gray-900">{card.gender}</p>
                                        </div>
                                        <div>
                                            <p className="text-gray-500 text-xs">City</p>
                                            <p className="font-medium text-gray-900">{card.city}</p>
                                        </div>
                                        <div>
                                            <p className="text-gray-500 text-xs">Mobile</p>
                                            <p className="font-medium text-gray-900">{card.mobileNumber}</p>
                                        </div>
                                        <div>
                                            <p className="text-gray-500 text-xs">Experience</p>
                                            <p className="font-medium text-gray-900">{card.experience} years</p>
                                        </div>
                                    </div>

                                    {/* Availability Status */}
                                    <div className="mb-3">
                                        <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium transition-all ${card.availabilityStatus === 'Available'
                                            ? 'bg-green-100 text-green-700'
                                            : card.availabilityStatus === 'Busy'
                                                ? 'bg-orange-100 text-orange-700'
                                                : 'bg-gray-100 text-gray-700'
                                            }`}>
                                            {card.availabilityStatus || 'Available'}
                                        </span>
                                    </div>

                                    {/* Buttons */}
                                    <div className="flex gap-3">
                                        <button
                                            onClick={() => handleViewDetails(card)}
                                            className="flex-1 btn-secondary"
                                        >
                                            View Details
                                        </button>
                                        {hiredWorkers[card.id] === 'approved' ? (
                                            <>
                                                <button
                                                    disabled
                                                    className="flex-1 bg-green-500 text-white cursor-default shadow-lg font-bold py-3 rounded-lg"
                                                >
                                                    ✓ Approved
                                                </button>
                                                <button
                                                    onClick={async () => {
                                                        const directChatId = chatIds[card.id];
                                                        if (directChatId) {
                                                            navigate(`/contractor/chat/${directChatId}`);
                                                            return;
                                                        }

                                                        // Fallback: Initialize new chat
                                                        try {
                                                            const { chatAPI } = await import('../../../services/api');
                                                            console.log('🚀 Initializing new chat with worker...');
                                                            const initResponse = await chatAPI.initializeChat({
                                                                participant2Id: card.userId,
                                                                participant2Type: 'Labour',
                                                                participant2Name: card.fullName,
                                                                participant2Photo: '', // Add phot if available
                                                                participant2Phone: card.mobileNumber || '',
                                                                requestId: card.id,
                                                                requestType: 'HireRequest'
                                                            });

                                                            if (initResponse.success && initResponse.data.chat) {
                                                                console.log('✅ Chat initialized:', initResponse.data.chat._id);
                                                                navigate(`/contractor/chat/${initResponse.data.chat._id}`);
                                                                return;
                                                            }

                                                            alert('Failed to initialize chat. Please try again.');
                                                        } catch (err) {
                                                            console.error('Failed to initialize chat:', err);
                                                            navigate('/contractor/chat');
                                                        }
                                                    }}
                                                    className="flex-1 bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 rounded-lg transition-all active:scale-95"
                                                >
                                                    Chat
                                                </button>
                                            </>
                                        ) : (
                                            <button
                                                onClick={() => handleHireWorker(card)}
                                                disabled={hiredWorkers[card.id]}
                                                className={`flex-1 font-bold py-3 rounded-lg transition-all ${hiredWorkers[card.id] === 'declined'
                                                    ? 'bg-gray-400 text-white cursor-not-allowed'
                                                    : hiredWorkers[card.id] === 'pending'
                                                        ? 'bg-orange-500 text-white cursor-not-allowed'
                                                        : 'btn-primary hover:bg-yellow-500 active:scale-95'
                                                    }`}
                                            >
                                                {hiredWorkers[card.id] === 'declined'
                                                    ? '✗ Declined'
                                                    : hiredWorkers[card.id] === 'pending'
                                                        ? '⏳ Request Sent'
                                                        : 'Hire Worker'}
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Details Modal */}
            {selectedCard && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg max-w-md w-full max-h-[80vh] overflow-y-auto">
                        <div className="sticky top-0 bg-white border-b p-4 flex justify-between items-center">
                            <h2 className="text-xl font-bold">Worker Details</h2>
                            <button onClick={handleCloseModal} className="text-2xl">×</button>
                        </div>

                        <div className="p-4 space-y-3">
                            <div><label className="text-sm text-gray-500">Full Name</label><p className="font-medium">{selectedCard.fullName}</p></div>
                            <div><label className="text-sm text-gray-500">Primary Skill</label><p className="font-medium">{selectedCard.primarySkill}</p></div>
                            <div><label className="text-sm text-gray-500">Rating</label><p className="font-medium">{selectedCard.rating} ⭐</p></div>
                            <div><label className="text-sm text-gray-500">Gender</label><p className="font-medium">{selectedCard.gender}</p></div>
                            <div><label className="text-sm text-gray-500">Mobile</label><p className="font-medium">{selectedCard.mobileNumber}</p></div>
                            <div><label className="text-sm text-gray-500">City</label><p className="font-medium">{selectedCard.city}</p></div>
                            <div><label className="text-sm text-gray-500">Address</label><p className="font-medium">{selectedCard.address}</p></div>
                            <div><label className="text-sm text-gray-500">Skills</label><p className="font-medium">{selectedCard.skills}</p></div>
                            <div><label className="text-sm text-gray-500">Experience</label><p className="font-medium">{selectedCard.experience} years</p></div>
                            <div><label className="text-sm text-gray-500">Previous Work Location</label><p className="font-medium">{selectedCard.previousWorkLocation || 'N/A'}</p></div>
                            <div><label className="text-sm text-gray-500">Availability</label><p className="font-medium">{selectedCard.availability}</p></div>
                        </div>

                        <div className="sticky bottom-0 bg-white border-t p-4">
                            <button onClick={handleCloseModal} className="w-full bg-yellow-400 text-gray-900 font-bold py-3 rounded-lg">
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Filter Modal */}
            {showFilterModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end justify-center z-50">
                    <div className="bg-white rounded-t-3xl w-full max-w-md animate-slide-up">
                        {/* Header */}
                        <div className="flex items-center justify-between p-6 border-b">
                            <h2 className="text-2xl font-bold text-gray-900">Filter by City</h2>
                            <button
                                onClick={handleCloseFilter}
                                className="p-1 hover:bg-gray-100 rounded-full transition-colors"
                            >
                                <X className="w-6 h-6 text-gray-500" />
                            </button>
                        </div>

                        {/* Content */}
                        <div className="p-6 max-h-[60vh] overflow-y-auto">
                            <div className="space-y-2">
                                {/* All Cities Option */}
                                <button
                                    onClick={handleClearFilter}
                                    className={`w-full text-left px-4 py-3 rounded-lg transition-all ${!selectedCity
                                        ? 'bg-blue-500 text-white font-medium'
                                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                        }`}
                                >
                                    All Cities
                                </button>

                                {/* City Options */}
                                {cities.map((city) => (
                                    <button
                                        key={city}
                                        onClick={() => handleCitySelect(city)}
                                        className={`w-full text-left px-4 py-3 rounded-lg transition-all ${selectedCity === city
                                            ? 'bg-blue-500 text-white font-medium'
                                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                            }`}
                                    >
                                        {city}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="p-6 border-t">
                            <button
                                onClick={handleCloseFilter}
                                className="w-full bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-bold py-3 rounded-lg transition-all active:scale-95"
                            >
                                Apply Filter
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <ContractorBottomNav />
        </div>
    );
};

export default HireWorkers;
