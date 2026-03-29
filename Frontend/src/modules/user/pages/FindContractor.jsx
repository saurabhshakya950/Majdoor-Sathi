import { useState, useEffect } from 'react';
import { Search, SlidersHorizontal, X, Star } from 'lucide-react';
import UserBottomNav from '../components/UserBottomNav';
import UserHeader from '../components/UserHeader';
import UserContractorCard from '../components/UserContractorCard';
import { contractorAPI } from '../../../services/api';


const FindContractor = () => {
    const [cards, setCards] = useState([]);
    const [filteredCards, setFilteredCards] = useState([]);
    const [selectedCard, setSelectedCard] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [showFilterModal, setShowFilterModal] = useState(false);
    const [selectedCity, setSelectedCity] = useState('');
    const [hiredContractors, setHiredContractors] = useState({});
    const [loading, setLoading] = useState(true);

    const cities = ['Indore', 'Bhopal', 'Dewas', 'Ujjain', 'Jabalpur', 'Gwalior', 'Ratlam'];

    // Load contractor cards from database and localStorage
    useEffect(() => {
        // Clean up old localStorage dummy data on mount
        localStorage.removeItem('contractor_cards_for_user');

        fetchContractorJobs();
        loadHiredState();

        // Auto-refresh every 3 seconds when page is visible
        const intervalId = setInterval(() => {
            if (!document.hidden) {
                console.log('[REFRESH] Auto-refreshing contractor hire request status...');
                loadHiredState();
            }
        }, 3000);

        // Poll for card updates every 5 seconds (Silent)
        const cardInterval = setInterval(() => {
            if (!document.hidden) {
                fetchContractorJobs(true);
            }
        }, 5000);

        // Update when page becomes visible
        const handleVisibilityChange = () => {
            if (!document.hidden) {
                console.log('[VISIBILITY] Page visible, reloading cards...');
                fetchContractorJobs();
                loadHiredState();
            }
        };

        // Listen for focus event
        const handleFocus = () => {
            console.log('[FOCUS] Page focused, reloading cards...');
            fetchContractorJobs();
            loadHiredState();
        };

        // Listen for contractor hire request updates
        const handleContractorHireRequestUpdate = () => {
            console.log('[EVENT] Contractor hire request update event received');
            loadHiredState();
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);
        window.addEventListener('focus', handleFocus);
        window.addEventListener('contractor-hire-request-updated', handleContractorHireRequestUpdate);

        // Cleanup
        return () => {
            clearInterval(intervalId);
            clearInterval(cardInterval);
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            window.removeEventListener('focus', handleFocus);
            window.removeEventListener('contractor-hire-request-updated', handleContractorHireRequestUpdate);
        };
    }, []);

    // Separate function to load hired state
    const loadHiredState = async () => {
        try {
            const response = await contractorAPI.getSentContractorHireRequests();

            if (response.success) {
                console.log('[DEBUG] Sent contractor hire requests:', response.data.hireRequests);

                // Create state map from requests
                const uiStateMap = {};
                const requestsMap = {};

                response.data.hireRequests.forEach(req => {
                    const contractorId = req.contractorId; // Already a string from backend

                    console.log(`Mapping contractorId: ${contractorId} → status: ${req.status}, chatId: ${req.chatId}`);

                    // Store full request data for chat access
                    requestsMap[contractorId] = {
                        _id: req._id,
                        status: req.status,
                        chatId: req.chatId,
                        createdAt: req.createdAt,
                        updatedAt: req.updatedAt
                    };

                    // Map status to UI states
                    if (req.status === 'accepted') {
                        uiStateMap[contractorId] = 'approved';
                    } else if (req.status === 'declined') {
                        uiStateMap[contractorId] = 'declined';
                    } else {
                        uiStateMap[contractorId] = 'pending';
                    }
                });

                console.log('[SUCCESS] Final contractor UI state map:', uiStateMap);
                console.log('[SUCCESS] Final contractor requests map:', requestsMap);
                setHiredContractors(uiStateMap);

                // Store requests map in state for chat access
                window.userContractorRequests = requestsMap;
            }
        } catch (error) {
            console.error('Failed to load contractor hired state:', error);
            setHiredContractors({});
            window.userContractorRequests = {};
        }
    };

    const fetchContractorJobs = async (isSilent = false) => {
        try {
            if (!isSilent) setLoading(true);

            // Fetch from database - pass audience: 'User' to get only User-targeted cards
            const response = await contractorAPI.browseContractorJobs({ audience: 'User' });

            if (response.success && response.data.jobs) {
                // Filter only Active status cards
                const activeJobs = response.data.jobs.filter(job => job.profileStatus === 'Active');

                const dbJobs = activeJobs.map(job => ({
                    id: job._id,
                    userId: job.user,
                    contractorName: job.contractorName,
                    phoneNumber: job.phoneNumber,
                    contactNo: job.phoneNumber,
                    city: job.city,
                    address: job.address,
                    businessType: job.businessType,
                    businessName: job.businessName || '',
                    labourSkill: job.labourSkill,
                    primaryWorkCategory: job.labourSkill,
                    experience: job.experience,
                    workDuration: job.workDuration,
                    budgetType: job.budgetType,
                    budgetAmount: job.budgetAmount,
                    rating: job.rating || 0,
                    profileStatus: job.profileStatus,
                    availabilityStatus: 'Available',
                    createdAt: job.createdAt
                }));

                setCards(dbJobs);
                setFilteredCards(dbJobs);
            } else {
                setCards([]);
                setFilteredCards([]);
            }
        } catch (error) {
            console.error('Error fetching contractor jobs:', error);
            setCards([]);
            setFilteredCards([]);
        } finally {
            if (!isSilent) setLoading(false);
        }
    };

    // Filter cards based on selected city and search query
    useEffect(() => {
        let filtered = cards;

        // Filter by city
        if (selectedCity) {
            filtered = filtered.filter(card =>
                card.city.toLowerCase() === selectedCity.toLowerCase()
            );
        }

        // Filter by search query
        if (searchQuery.trim()) {
            filtered = filtered.filter(card =>
                card.contractorName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                card.labourSkill.toLowerCase().includes(searchQuery.toLowerCase()) ||
                card.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
                (card.businessName && card.businessName.toLowerCase().includes(searchQuery.toLowerCase()))
            );
        }

        setFilteredCards(filtered);
    }, [selectedCity, searchQuery, cards]);

    const handleViewDetails = (card) => {
        setSelectedCard(card);
    };

    const handleApplyNow = async (cardId) => {
        const card = cards.find(c => c.id === cardId);
        if (!card) return;

        try {
            // Create hire request in database
            const response = await contractorAPI.createContractorHireRequest(cardId);

            if (response.success) {
                // Update UI state
                const updatedHired = { ...hiredContractors, [cardId]: 'pending' };
                setHiredContractors(updatedHired);

                alert('Request sent successfully!');
                console.log('[SUCCESS] Contractor hire request created:', response.data);
            }
        } catch (error) {
            console.error('Failed to create contractor hire request:', error);
            alert(error.response?.data?.message || 'Failed to send request. Please try again.');
        }
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

    return (
        <div className="bg-gray-50 flex flex-col overflow-hidden" style={{ height: '100dvh', minHeight: '-webkit-fill-available' }}>
            {/* Sticky Header and Search Bar */}
            <div className="sticky top-0 z-10 bg-white">
                {/* Header Section */}
                <UserHeader />

                {/* Search Bar */}
                <div className="px-4 py-3 shadow-sm">
                    <div className="flex items-center gap-3">
                        <div className="flex-1 flex items-center bg-gray-100 rounded-lg px-4 py-2">
                            <Search className="w-5 h-5 text-gray-400 mr-2" />
                            <input
                                type="text"
                                placeholder="Search contractors..."
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

                        Available Contractors
                        {selectedCity && <span className="text-sm font-normal text-gray-600"> in {selectedCity}</span>}
                        <span className="text-sm font-normal text-gray-600"> ({filteredCards.length})</span>
                    </h2>

                    {filteredCards.length === 0 ? (
                        <div className="bg-white rounded-lg shadow-sm p-6 text-center">
                            <p className="text-gray-600">
                                {selectedCity || searchQuery
                                    ? 'No contractors found matching your criteria'
                                    : 'No contractors available at the moment'}
                            </p>
                            {(selectedCity || searchQuery) && (
                                <button
                                    onClick={() => {
                                        setSelectedCity('');
                                        setSearchQuery('');
                                    }}
                                    className="mt-3 text-blue-500 hover:text-blue-600 font-medium"
                                >
                                    Clear filters
                                </button>
                            )}
                        </div>
                    ) : (
                        filteredCards.map((card, index) => (
                            <UserContractorCard
                                key={card.id}
                                card={card}
                                index={index}
                                onViewDetails={handleViewDetails}
                                onApplyNow={handleApplyNow}
                                hiredStatus={hiredContractors[card.id]}
                                hiredRequests={window.userContractorRequests || {}}
                            />
                        ))
                    )}
                </div>
            </div>

            {/* Contractor Details Modal */}
            {selectedCard && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg max-w-md w-full max-h-[80vh] overflow-y-auto">
                        <div className="sticky top-0 bg-white border-b p-4 flex justify-between items-center">
                            <h2 className="text-xl font-bold text-gray-900">Contractor Details</h2>
                            <button
                                onClick={handleCloseModal}
                                className="p-1 hover:bg-gray-100 rounded-full transition-colors"
                            >
                                <X className="w-6 h-6 text-gray-500" />
                            </button>
                        </div>

                        <div className="p-4 space-y-4">
                            <div>
                                <label className="text-sm font-medium text-gray-500">Contractor Name</label>
                                <p className="text-gray-900 font-medium">{selectedCard.contractorName}</p>
                            </div>

                            <div>
                                <label className="text-sm font-medium text-gray-500">Business Type</label>
                                <p className="text-gray-900 font-medium">{selectedCard.businessType}</p>
                            </div>

                            <div>
                                <label className="text-sm font-medium text-gray-500">City / Location</label>
                                <p className="text-gray-900 font-medium">{selectedCard.city}</p>
                            </div>

                            <div>
                                <label className="text-sm font-medium text-gray-500">Address</label>
                                <p className="text-gray-900 font-medium">{selectedCard.address}</p>
                            </div>

                            <div>
                                <label className="text-sm font-medium text-gray-500">Primary Work Category</label>
                                <p className="text-gray-900 font-medium">{selectedCard.primaryWorkCategory}</p>
                            </div>

                            <div>
                                <label className="text-sm font-medium text-gray-500">Experience</label>
                                <p className="text-gray-900 font-medium">{selectedCard.experience}</p>
                            </div>

                            <div>
                                <label className="text-sm font-medium text-gray-500">Rating</label>
                                <div className="flex items-center gap-1">
                                    <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                                    <span className="text-gray-900 font-medium">{selectedCard.rating || 0}.0 / 5</span>
                                </div>
                            </div>

                            <div>
                                <label className="text-sm font-medium text-gray-500">Contact Number</label>
                                <p className="text-gray-900 font-medium">{selectedCard.contactNo}</p>
                            </div>

                            <div>
                                <label className="text-sm font-medium text-gray-500">Budget Amount</label>
                                <p className="text-gray-900 font-medium">{'₹'}{selectedCard.budgetAmount}</p>
                            </div>

                            <div>
                                <label className="text-sm font-medium text-gray-500">Availability Status</label>
                                <span className={`inline-block px-4 py-1.5 rounded-full text-sm font-semibold ${selectedCard.availabilityStatus === 'Available'
                                    ? 'bg-green-100 text-green-700'
                                    : 'bg-red-100 text-red-700'
                                    }`}>
                                    {selectedCard.availabilityStatus === 'Available' ? 'Open' : 'Closed'}
                                </span>
                            </div>
                        </div>

                        <div className="sticky bottom-0 bg-white border-t p-4">
                            <button
                                onClick={handleCloseModal}
                                className="w-full bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-bold py-3 rounded-lg transition-all active:scale-95"
                            >
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

            {/* Bottom Navigation */}
            <UserBottomNav />
        </div>
    );
};

export default FindContractor;
