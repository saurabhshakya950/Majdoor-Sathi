import { useEffect, useState } from 'react';
import { Search, SlidersHorizontal, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import LabourBottomNav from '../components/LabourBottomNav';
import LabourContractorCard from '../components/LabourContractorCard';
import LabourHeader from '../components/LabourHeader';
import PromotionalBanner from '../../../components/shared/PromotionalBanner';
import { contractorAPI } from '../../../services/api';

const FindContractor = () => {
    const navigate = useNavigate();
    const [cards, setCards] = useState([]);
    const [filteredCards, setFilteredCards] = useState([]);
    const [selectedCard, setSelectedCard] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [showFilterModal, setShowFilterModal] = useState(false);
    const [selectedCity, setSelectedCity] = useState('');
    const [loading, setLoading] = useState(true);
    const [appliedJobs, setAppliedJobs] = useState({});

    const cities = ['Indore', 'Bhopal', 'Dewas', 'Ujjain', 'Jabalpur', 'Gwalior', 'Ratlam'];

    useEffect(() => {
        // Clean up old localStorage dummy data on mount
        localStorage.removeItem('contractor_cards_for_labour');

        fetchContractorJobs();
        fetchApplicationStatus();

        // Auto-refresh every 5 seconds
        const interval = setInterval(() => {
            if (!document.hidden) {
                console.log('[REFRESH] Auto-refreshing contractor jobs and application status...');
                fetchApplicationStatus();
            }
        }, 5000);

        // Listen for application updates
        const handleApplicationUpdate = () => {
            console.log('[EVENT] Application updated event received');
            fetchApplicationStatus();
        };

        window.addEventListener('labour-contractor-application-updated', handleApplicationUpdate);

        return () => {
            clearInterval(interval);
            window.removeEventListener('labour-contractor-application-updated', handleApplicationUpdate);
        };
    }, []);

    const fetchApplicationStatus = async () => {
        try {
            const response = await contractorAPI.getLabourApplications();

            if (response.success) {
                console.log('[SUCCESS] Application status loaded:', response.data.applications);
                setAppliedJobs(response.data.applications);
            }
        } catch (error) {
            console.error('Failed to fetch application status:', error);
        }
    };

    const fetchContractorJobs = async () => {
        try {
            setLoading(true);

            // Fetch from database - pass audience: 'Labour' to get only Labour-targeted cards
            const response = await contractorAPI.browseContractorJobs({ audience: 'Labour' });

            if (response.success && response.data.jobs) {
                const dbJobs = response.data.jobs.map(job => ({
                    id: job._id,
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
                    availabilityStatus: job.profileStatus === 'Active' ? 'Available' : 'Closed',
                    createdAt: job.createdAt
                }));

                console.log('Loaded contractor jobs from database:', dbJobs.length);
                setCards(dbJobs);
                setFilteredCards(dbJobs);
            } else {
                // No cards available
                setCards([]);
                setFilteredCards([]);
            }
        } catch (error) {
            console.error('Error fetching contractor jobs:', error);
            // Show empty state on error
            setCards([]);
            setFilteredCards([]);
        } finally {
            setLoading(false);
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
        try {
            console.log('[INFO] Applying to contractor job:', cardId);

            const response = await contractorAPI.applyToContractorJob(cardId);

            if (response.success) {
                console.log('[SUCCESS] Application submitted successfully');
                toast.success('Application submitted successfully!');

                // Refresh application status
                await fetchApplicationStatus();
            }
        } catch (error) {
            console.error('[ERROR] Failed to apply:', error);
            if (error.response?.data?.message) {
                toast.error(error.response.data.message);
            } else {
                toast.error('Failed to submit application');
            }
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
                <LabourHeader />

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
                    {/* Promotional Banners */}
                    <PromotionalBanner />

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
                            <LabourContractorCard
                                key={card.id}
                                card={card}
                                index={index}
                                onViewDetails={handleViewDetails}
                                onApplyNow={handleApplyNow}
                                appliedJobs={appliedJobs}
                            />
                        ))
                    )}
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
                                    <label className="text-sm font-medium text-gray-500">Phone Number</label>
                                    <p className="text-gray-900 font-medium">{selectedCard.phoneNumber}</p>
                                </div>

                                <div>
                                    <label className="text-sm font-medium text-gray-500">City</label>
                                    <p className="text-gray-900 font-medium">{selectedCard.city}</p>
                                </div>

                                <div>
                                    <label className="text-sm font-medium text-gray-500">Address</label>
                                    <p className="text-gray-900">{selectedCard.address}</p>
                                </div>

                                <div>
                                    <label className="text-sm font-medium text-gray-500">Business Type</label>
                                    <p className="text-gray-900 font-medium">{selectedCard.businessType}</p>
                                </div>

                                {selectedCard.businessName && (
                                    <div>
                                        <label className="text-sm font-medium text-gray-500">Business Name</label>
                                        <p className="text-gray-900 font-medium">{selectedCard.businessName}</p>
                                    </div>
                                )}

                                <div>
                                    <label className="text-sm font-medium text-gray-500">Labour Skill</label>
                                    <p className="text-gray-900 font-medium">{selectedCard.labourSkill}</p>
                                </div>

                                <div>
                                    <label className="text-sm font-medium text-gray-500">Experience</label>
                                    <p className="text-gray-900 font-medium">{selectedCard.experience}</p>
                                </div>

                                <div>
                                    <label className="text-sm font-medium text-gray-500">Work Duration</label>
                                    <p className="text-gray-900 font-medium">{selectedCard.workDuration}</p>
                                </div>

                                <div>
                                    <label className="text-sm font-medium text-gray-500">Budget</label>
                                    <p className="text-gray-900 font-medium">
                                        {selectedCard.budgetType === 'Negotiable'
                                            ? 'Negotiable'
                                            : `₹${selectedCard.budgetAmount}`}
                                    </p>
                                </div>

                                <div>
                                    <label className="text-sm font-medium text-gray-500">Profile Status</label>
                                    <p className={`font-medium ${selectedCard.profileStatus === 'Active'
                                        ? 'text-green-600'
                                        : 'text-gray-600'
                                        }`}>
                                        {selectedCard.profileStatus === 'Active' ? 'Open' : 'Closed'}
                                    </p>
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
            </div>

            {/* Bottom Navigation */}
            <LabourBottomNav />
        </div>
    );
};

export default FindContractor;
