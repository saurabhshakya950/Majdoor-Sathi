import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { Plus, Star } from 'lucide-react';
import toast from 'react-hot-toast';
import ContractorPageHeader from '../components/ContractorPageHeader';
import ContractorBottomNav from '../components/ContractorBottomNav';
import ContractorProfileCard from '../components/ContractorProfileCard';
import { contractorAPI } from '../../../services/api';

const MyProjectForUser = () => {
    const navigate = useNavigate();
    const [showForm, setShowForm] = useState(false);
    const [cards, setCards] = useState([]);
    const [loading, setLoading] = useState(true);
    const [rating, setRating] = useState(0);
    const [showDetailsModal, setShowDetailsModal] = useState(false);
    const [selectedCard, setSelectedCard] = useState(null);
    const [formData, setFormData] = useState({
        contractorName: '',
        businessType: 'Individual',
        city: '',
        primaryWorkCategory: '',
        experience: '',
        contactNo: '',
        budgetAmount: ''
    });

    const workCategories = [
        'Construction',
        'Interior',
        'Painting',
        'Plumbing',
        'Electrical',
        'Carpentry',
        'Masonry',
        'Waterproofing',
        'Fabrication',
        'Renovation'
    ];

    // Load contractor cards from database
    const loadCards = async (isSilent = false) => {
        try {
            if (!isSilent) setLoading(true);
            console.log('🔄 Loading contractor cards...');
            const token = localStorage.getItem('access_token');

            if (token) {
                const response = await contractorAPI.getContractorJobs({ targetAudience: 'User' });

                if (response && response.success && response.data && response.data.jobs) {
                    if (response.data.jobs.length > 0) {
                        const formattedCards = response.data.jobs.map(job => {
                            return {
                                id: job._id,
                                contractorName: job.contractorName || 'N/A',
                                businessType: job.businessType || 'Individual',
                                city: job.city || 'N/A',
                                primaryWorkCategory: job.labourSkill || 'Other',
                                experience: job.experience || '0',
                                contactNo: job.phoneNumber || 'N/A',
                                budgetAmount: job.budgetAmount || '0',
                                rating: job.rating || 0,
                                availabilityStatus: job.profileStatus === 'Active' ? 'Available' : 'Closed',
                                createdAt: job.createdAt
                            };
                        });

                        setCards(formattedCards);
                    } else {
                        setCards([]);
                    }
                } else {
                    setCards([]);
                }
            } else {
                const savedCards = JSON.parse(localStorage.getItem('contractor_cards_for_user') || '[]');
                setCards(savedCards);
            }
        } catch (error) {
            console.error('❌ Error loading contractor cards:', error);
            // Fallback to localStorage
            const savedCards = JSON.parse(localStorage.getItem('contractor_cards_for_user') || '[]');
            setCards(savedCards);
        } finally {
            if (!isSilent) setLoading(false);
        }
    };

    useEffect(() => {
        console.log('🚀 Component mounted, loading cards...');
        loadCards();

        // Auto-refresh every 10 seconds (Silent)
        const interval = setInterval(() => {
            loadCards(true);
        }, 10000);

        return () => {
            console.log('🛑 Component unmounting, clearing interval');
            clearInterval(interval);
        };
    }, []);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleRating = (star) => {
        setRating(star);
    };

    const handleCreateCard = async () => {
        // Validation
        if (!formData.contractorName.trim()) {
            toast.error('Contractor name is required');
            return;
        }
        if (!formData.city.trim()) {
            toast.error('City/Location is required');
            return;
        }
        if (!formData.primaryWorkCategory) {
            toast.error('Primary work category is required');
            return;
        }
        if (!formData.experience.trim()) {
            toast.error('Experience is required');
            return;
        }
        if (!formData.contactNo.trim()) {
            toast.error('Contact number is required');
            return;
        }
        if (!formData.budgetAmount.trim()) {
            toast.error('Budget amount is required');
            return;
        }

        try {
            const token = localStorage.getItem('access_token');

            if (token) {
                // Map frontend businessType to backend enum
                let mappedBusinessType = 'Individual Contractor';
                if (formData.businessType === 'Company' || formData.businessType === 'Firm') {
                    mappedBusinessType = 'Business';
                }

                // Map primaryWorkCategory to labourSkill enum (use 'Other' if not in enum)
                const validSkills = ['Construction', 'Interior', 'Painting', 'Plumbing', 'Electrical'];
                const mappedSkill = validSkills.includes(formData.primaryWorkCategory)
                    ? formData.primaryWorkCategory
                    : 'Other';

                // Save to database
                const jobData = {
                    contractorName: formData.contractorName,
                    phoneNumber: formData.contactNo,
                    city: formData.city,
                    address: formData.city, // Using city as address
                    businessType: mappedBusinessType,
                    businessName: formData.contractorName,
                    labourSkill: mappedSkill,
                    experience: formData.experience,
                    workDuration: 'Contract',
                    budgetType: 'Fixed Amount',
                    budgetAmount: formData.budgetAmount,
                    rating: rating,
                    profileStatus: 'Active',
                    targetAudience: 'User' // Only for User, not Labour
                };

                console.log('Creating contractor job:', jobData);

                const response = await contractorAPI.createContractorJob(jobData);
                console.log('📦 Create response:', response);

                if (response.success) {
                    console.log('✅ Contractor job created in database:', response);

                    toast.success('Card created successfully!');
                    setShowForm(false);

                    // Reset form
                    setFormData({
                        contractorName: '',
                        businessType: 'Individual',
                        city: '',
                        primaryWorkCategory: '',
                        experience: '',
                        contactNo: '',
                        budgetAmount: ''
                    });
                    setRating(0);

                    // Reload cards from database silently
                    await loadCards(true);
                } else {
                    throw new Error(response.message || 'Failed to create card');
                }
            } else {
                // Fallback to localStorage if no token
                const newCard = {
                    ...formData,
                    rating: rating,
                    availabilityStatus: 'Available',
                    id: Date.now(),
                    createdAt: new Date().toISOString()
                };

                const updatedCards = [...cards, newCard];
                setCards(updatedCards);
                localStorage.setItem('contractor_cards_for_user', JSON.stringify(updatedCards));

                toast.success('Card created successfully!');
                setShowForm(false);

                // Reset form
                setFormData({
                    contractorName: '',
                    businessType: 'Individual',
                    city: '',
                    primaryWorkCategory: '',
                    experience: '',
                    contactNo: '',
                    budgetAmount: ''
                });
                setRating(0);
            }
        } catch (error) {
            console.error('Error creating contractor card:', error);
            toast.error(error.message || 'Failed to create card. Please try again.');
        }
    };

    const handleViewDetails = (card) => {
        setSelectedCard(card);
        setShowDetailsModal(true);
    };

    const handleCloseModal = () => {
        setShowDetailsModal(false);
        setSelectedCard(null);
    };

    const handleToggleAvailability = async (cardId) => {
        const card = cards.find(c => c.id === cardId);
        if (!card) return;

        const newStatus = card.availabilityStatus === 'Available' ? 'Busy' : 'Available';
        const newProfileStatus = newStatus === 'Available' ? 'Active' : 'Closed';

        console.log(`🔄 Toggling card ${cardId} from ${card.availabilityStatus} to ${newStatus}`);

        try {
            const token = localStorage.getItem('access_token');

            if (token) {
                // Update in database
                const response = await contractorAPI.updateContractorJob(cardId, {
                    profileStatus: newProfileStatus
                });

                if (response.success) {
                    console.log('✅ Status updated in database');

                    // Update local state
                    const updatedCards = cards.map(c => {
                        if (c.id === cardId) {
                            return {
                                ...c,
                                availabilityStatus: newStatus,
                                profileStatus: newProfileStatus
                            };
                        }
                        return c;
                    });

                    setCards(updatedCards);
                    toast.success(`Status changed to ${newStatus}`);
                } else {
                    throw new Error('Failed to update status');
                }
            } else {
                // Fallback to localStorage
                const updatedCards = cards.map(c => {
                    if (c.id === cardId) {
                        return {
                            ...c,
                            availabilityStatus: newStatus
                        };
                    }
                    return c;
                });

                setCards(updatedCards);
                localStorage.setItem('contractor_cards_for_user', JSON.stringify(updatedCards));
                console.log('💾 Saved updated cards to localStorage:', updatedCards);
            }

            // Trigger a custom event to notify other tabs/windows
            window.dispatchEvent(new Event('storage'));
        } catch (error) {
            console.error('❌ Error updating availability status:', error);
            toast.error('Failed to update status. Please try again.');
        }
    };

    return (
        <div className="bg-gray-50 flex flex-col overflow-hidden" style={{ height: '100dvh', minHeight: '-webkit-fill-available' }}>
            <ContractorPageHeader title="My Project for User" backPath="/contractor/settings" />

            <div className="flex-1 overflow-y-auto p-4 pb-24">
                {loading ? (
                    // Loading State
                    <div className="flex items-center justify-center min-h-[60vh]">
                        <div className="text-center">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-400 mx-auto mb-4"></div>
                            <p className="text-gray-500">Loading cards...</p>
                        </div>
                    </div>
                ) : cards.length === 0 && !showForm ? (
                    // Empty State with + Icon
                    <div className="flex items-center justify-center min-h-[60vh]">
                        <button
                            onClick={() => setShowForm(true)}
                            className="w-24 h-24 bg-yellow-400 hover:bg-yellow-500 rounded-full flex items-center justify-center shadow-lg transition-all active:scale-95"
                        >
                            <Plus className="w-12 h-12 text-gray-900" />
                        </button>
                    </div>
                ) : showForm ? (
                    // Form View
                    <div className="bg-white rounded-xl shadow-sm p-4 mb-4">
                        <h3 className="text-lg font-bold text-gray-900 mb-4">Create Contractor Card</h3>

                        {/* Basic Information */}
                        <div className="mb-6">
                            <h4 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
                                <span className="text-blue-500">ℹ️</span>
                                Basic Information
                            </h4>
                            <p className="text-xs text-gray-500 mb-3">(User will only view this)</p>

                            {/* Contractor Name */}
                            <div className="mb-3">
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Contractor Name <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    name="contractorName"
                                    value={formData.contractorName}
                                    onChange={handleChange}
                                    placeholder="Individual name or Company name"
                                    className="w-full bg-white border border-gray-200 rounded-lg p-3 text-sm text-gray-700 focus:ring-2 focus:ring-yellow-400 focus:border-transparent outline-none"
                                />
                            </div>

                            {/* Business Type */}
                            <div className="mb-3">
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Business Type <span className="text-red-500">*</span>
                                </label>
                                <select
                                    name="businessType"
                                    value={formData.businessType}
                                    onChange={handleChange}
                                    className="w-full bg-white border border-gray-200 rounded-lg p-3 text-sm text-gray-700 focus:ring-2 focus:ring-yellow-400 outline-none"
                                >
                                    <option value="Individual">Individual</option>
                                    <option value="Company">Company</option>
                                    <option value="Firm">Firm</option>
                                </select>
                            </div>

                            {/* City/Location */}
                            <div className="mb-3">
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    City / Location <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    name="city"
                                    value={formData.city}
                                    onChange={handleChange}
                                    placeholder="Enter city or location"
                                    className="w-full bg-white border border-gray-200 rounded-lg p-3 text-sm text-gray-700 focus:ring-2 focus:ring-yellow-400 focus:border-transparent outline-none"
                                />
                            </div>
                        </div>

                        {/* Work & Skills Info */}
                        <div className="mb-6">
                            <h4 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
                                <span className="text-green-500">🛠️</span>
                                Work & Skills Info
                            </h4>
                            <p className="text-xs text-gray-500 mb-3">(User will understand what work contractor does)</p>

                            {/* Primary Work Category */}
                            <div className="mb-3">
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Primary Work Category <span className="text-red-500">*</span>
                                </label>
                                <select
                                    name="primaryWorkCategory"
                                    value={formData.primaryWorkCategory}
                                    onChange={handleChange}
                                    className="w-full bg-white border border-gray-200 rounded-lg p-3 text-sm text-gray-700 focus:ring-2 focus:ring-yellow-400 outline-none"
                                >
                                    <option value="">Select Category</option>
                                    {workCategories.map((category) => (
                                        <option key={category} value={category}>
                                            {category}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Experience */}
                            <div className="mb-3">
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Experience <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    name="experience"
                                    value={formData.experience}
                                    onChange={handleChange}
                                    placeholder="Example: 5+ Years"
                                    className="w-full bg-white border border-gray-200 rounded-lg p-3 text-sm text-gray-700 focus:ring-2 focus:ring-yellow-400 focus:border-transparent outline-none"
                                />
                            </div>

                            {/* Rating */}
                            <div className="mb-3">
                                <label className="block text-sm font-semibold text-gray-700 mb-2 text-center">
                                    Rating
                                </label>
                                <div className="flex justify-center gap-2 mb-2">
                                    {[1, 2, 3, 4, 5].map((star) => (
                                        <button
                                            key={star}
                                            type="button"
                                            onClick={() => handleRating(star)}
                                            className="transition-transform hover:scale-110"
                                        >
                                            <Star
                                                className={`w-8 h-8 ${star <= rating
                                                        ? 'fill-yellow-400 text-yellow-400'
                                                        : 'fill-gray-200 text-gray-200'
                                                    }`}
                                            />
                                        </button>
                                    ))}
                                </div>
                                <p className="text-center text-sm text-gray-600">
                                    {rating > 0 ? `${rating}.0 / 5` : 'Tap stars to rate'}
                                </p>
                            </div>

                            {/* Contact Number */}
                            <div className="mb-3">
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Contact No <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="tel"
                                    name="contactNo"
                                    value={formData.contactNo}
                                    onChange={handleChange}
                                    placeholder="Enter contact number"
                                    maxLength="10"
                                    className="w-full bg-white border border-gray-200 rounded-lg p-3 text-sm text-gray-700 focus:ring-2 focus:ring-yellow-400 focus:border-transparent outline-none"
                                />
                            </div>

                            {/* Budget Amount */}
                            <div className="mb-3">
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Budget Amount (₹) <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="number"
                                    name="budgetAmount"
                                    value={formData.budgetAmount}
                                    onChange={handleChange}
                                    placeholder="Enter amount"
                                    className="w-full bg-white border border-gray-200 rounded-lg p-3 text-sm text-gray-700 focus:ring-2 focus:ring-yellow-400 focus:border-transparent outline-none"
                                />
                            </div>
                        </div>

                        {/* Create Button */}
                        <button
                            onClick={handleCreateCard}
                            className="w-full py-4 rounded-full bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-bold text-lg transition-all shadow-md active:scale-[0.98]"
                        >
                            Create
                        </button>
                    </div>
                ) : (
                    // Cards List View
                    <div>
                        {/* Floating + Button */}
                        <button
                            onClick={() => setShowForm(true)}
                            className="fixed bottom-24 right-6 w-14 h-14 bg-yellow-400 hover:bg-yellow-500 rounded-full flex items-center justify-center shadow-lg transition-all active:scale-95 z-10"
                        >
                            <Plus className="w-7 h-7 text-gray-900" />
                        </button>

                        {/* Cards Grid */}
                        {cards.map((card) => (
                            <ContractorProfileCard
                                key={card.id}
                                data={card}
                                onViewDetails={() => handleViewDetails(card)}
                                onToggleAvailability={handleToggleAvailability}
                            />
                        ))}
                    </div>
                )}

                {/* Details Modal */}
                {showDetailsModal && selectedCard && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-2xl w-full max-w-md max-h-[80vh] overflow-y-auto">
                            {/* Modal Header */}
                            <div className="sticky top-0 bg-white border-b border-gray-200 p-4 flex items-center justify-between">
                                <h3 className="text-xl font-bold text-gray-900">Contractor Details</h3>
                                <button
                                    onClick={handleCloseModal}
                                    className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                                >
                                    <Plus className="w-6 h-6 text-gray-600 rotate-45" />
                                </button>
                            </div>

                            {/* Modal Content */}
                            <div className="p-4 space-y-4">
                                <div>
                                    <p className="text-sm text-gray-500 mb-1">Contractor Name</p>
                                    <p className="text-base font-semibold text-gray-900">{selectedCard.contractorName}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500 mb-1">Business Type</p>
                                    <p className="text-base font-semibold text-gray-900">{selectedCard.businessType}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500 mb-1">City / Location</p>
                                    <p className="text-base font-semibold text-gray-900">{selectedCard.city}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500 mb-1">Primary Work Category</p>
                                    <p className="text-base font-semibold text-gray-900">{selectedCard.primaryWorkCategory}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500 mb-1">Experience</p>
                                    <p className="text-base font-semibold text-gray-900">{selectedCard.experience}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500 mb-1">Availability Status</p>
                                    <span className={`inline-block px-4 py-1.5 rounded-full text-sm font-semibold ${selectedCard.availabilityStatus === 'Available'
                                            ? 'bg-green-100 text-green-700'
                                            : 'bg-red-100 text-red-700'
                                        }`}>
                                        {selectedCard.availabilityStatus}
                                    </span>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500 mb-1">Rating</p>
                                    <div className="flex items-center gap-1">
                                        <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                                        <span className="text-base font-semibold text-gray-900">{selectedCard.rating || 0}.0 / 5</span>
                                    </div>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500 mb-1">Contact Number</p>
                                    <p className="text-base font-semibold text-gray-900">{selectedCard.contactNo}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            <ContractorBottomNav />
        </div>
    );
};

export default MyProjectForUser;
