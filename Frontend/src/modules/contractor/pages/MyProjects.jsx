import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus } from 'lucide-react';
import ContractorProfileCard from '../components/ContractorProfileCard';
import { contractorAPI } from '../../../services/api';

const MyProjects = () => {
    const navigate = useNavigate();
    const [cards, setCards] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedCard, setSelectedCard] = useState(null);

    // Load contractor cards from database
    const loadCards = async (isSilent = false) => {
        try {
            if (!isSilent) setLoading(true);
            console.log('🔄 [MyProjects] Loading contractor cards for Labour...');

            // Fetch jobs with targetAudience='Labour' filter
            const response = await contractorAPI.getContractorJobs({ targetAudience: 'Labour' });

            if (response && response.success && response.data && response.data.jobs) {
                const formattedCards = response.data.jobs.map(job => ({
                    id: job._id,
                    contractorName: job.contractorName || 'N/A',
                    phoneNumber: job.phoneNumber || 'N/A',
                    city: job.city || 'N/A',
                    address: job.address || 'N/A',
                    businessType: job.businessType || 'Individual',
                    businessName: job.businessName || '',
                    labourSkill: job.labourSkill || 'Other',
                    experience: job.experience || '0',
                    workDuration: job.workDuration || 'Contract',
                    budgetType: job.budgetType || 'Fixed Amount',
                    budgetAmount: job.budgetAmount || '0',
                    profileStatus: job.profileStatus || 'Active',
                    rating: job.rating || 0,
                    availabilityStatus: job.profileStatus === 'Active' ? 'Available' : 'Closed',
                    targetAudience: job.targetAudience || 'Labour',
                    createdAt: job.createdAt
                }));

                setCards(formattedCards);
            } else {
                setCards([]);
            }
        } catch (error) {
            console.error('❌ [MyProjects] Error loading cards:', error);
            setCards([]);
        } finally {
            if (!isSilent) setLoading(false);
        }
    };

    useEffect(() => {
        loadCards();

        // Auto-refresh every 10 seconds (Silent)
        const interval = setInterval(() => {
            loadCards(true);
        }, 10000);

        return () => {
            console.log('🛑 [MyProjects] Component unmounting');
            clearInterval(interval);
        };
    }, []);

    const handleViewDetails = (card) => {
        setSelectedCard(card);
    };

    const handleToggleAvailability = async (cardId) => {
        try {
            // Always update in database - no localStorage
            const currentCard = cards.find(c => c.id === cardId);
            const newStatus = currentCard.profileStatus === 'Active' ? 'Closed' : 'Active';

            await contractorAPI.updateContractorJob(cardId, {
                profileStatus: newStatus
            });

            // Reload cards from database silently
            await loadCards(true);
        } catch (error) {
            console.error('Error toggling availability:', error);
        }
    };

    const handleCloseModal = () => {
        setSelectedCard(null);
    };

    const handlePostJob = () => {
        navigate('/contractor/post-job');
    };

    return (
        <div className="h-screen bg-gray-50 flex flex-col overflow-hidden">
            {/* Custom Header with + icon in title row */}
            <div className="bg-white shadow-sm p-4 sticky top-0 z-10">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => navigate('/contractor/settings')}
                            className="text-gray-700"
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                            </svg>
                        </button>
                        <h1 className="text-xl font-bold text-gray-900">My Projects</h1>
                    </div>
                    {cards.length > 0 && (
                        <button
                            onClick={handlePostJob}
                            className="bg-yellow-400 hover:bg-yellow-500 p-2 rounded-full shadow-md transition-all active:scale-95"
                        >
                            <Plus className="w-5 h-5 text-gray-900" />
                        </button>
                    )}
                </div>
            </div>

            <div className="flex-1 overflow-y-auto">
                <div className="p-4 pb-24">
                    {loading ? (
                        <div className="flex items-center justify-center min-h-[60vh]">
                            <div className="text-center">
                                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-400 mx-auto mb-4"></div>
                                <p className="text-gray-500">Loading projects...</p>
                            </div>
                        </div>
                    ) : cards.length === 0 ? (
                        <div className="flex flex-col items-center justify-center min-h-[60vh]">
                            <button
                                onClick={handlePostJob}
                                className="w-24 h-24 bg-yellow-400 hover:bg-yellow-500 rounded-full flex items-center justify-center shadow-lg transition-all active:scale-95"
                            >
                                <Plus className="w-12 h-12 text-gray-900" />
                            </button>
                            <h3 className="text-lg font-bold text-gray-900 mt-4">No Projects Yet</h3>
                            <p className="text-gray-500 text-center mt-2">Create your first project card</p>
                        </div>
                    ) : (
                        cards.map((card) => (
                            <ContractorProfileCard
                                key={card.id}
                                data={card}
                                onViewDetails={() => handleViewDetails(card)}
                                onToggleAvailability={handleToggleAvailability}
                            />
                        ))
                    )}
                </div>
            </div>

            {/* Card Details Modal */}
            {selectedCard && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg max-w-md w-full max-h-[80vh] overflow-y-auto">
                        <div className="sticky top-0 bg-white border-b p-4 flex justify-between items-center">
                            <h2 className="text-xl font-bold text-gray-900">Contractor Details</h2>
                            <button
                                onClick={handleCloseModal}
                                className="text-gray-500 hover:text-gray-700 text-2xl"
                            >
                                ×
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
        </div>
    );
};

export default MyProjects;
