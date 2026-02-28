import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Upload, User } from 'lucide-react';
import LabourBottomNav from '../components/LabourBottomNav';
import toast from 'react-hot-toast';
import { labourAPI } from '../../../services/api';

const CreateLabourCard = () => {
    const navigate = useNavigate();
    const photoInputRef = useRef(null);
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        fullName: '',
        primarySkill: '',
        rating: 0,
        gender: '',
        mobileNumber: '',
        city: '',
        address: '',
        skills: '',
        experience: '',
        previousWorkLocation: '',
        availability: 'Full Time',
        availabilityStatus: 'Available',
        cardPhoto: null // Add card photo field
    });

    // Auto-fill from labour profile
    useEffect(() => {
        const profile = JSON.parse(localStorage.getItem('labour_profile') || '{}');
        setFormData(prev => ({
            ...prev,
            fullName: profile.firstName || '',
            primarySkill: profile.skillType || '',
            rating: profile.rating || 0,
            gender: profile.gender || '',
            mobileNumber: profile.phoneNumber || profile.mobile || '',
            city: profile.city || '',
            address: profile.address || '',
            skills: profile.skillType || '',
            experience: profile.experience || '',
            previousWorkLocation: profile.previousWorkLocation || '',
            availability: profile.availability || 'Full Time'
        }));
    }, []);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleRating = (rating) => {
        setFormData(prev => ({ ...prev, rating }));
    };

    const handlePhotoUpload = () => {
        photoInputRef.current?.click();
    };

    const handlePhotoChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // Validate file type
        if (!file.type.startsWith('image/')) {
            toast.error('Please select an image file');
            return;
        }

        // Validate file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
            toast.error('Image size should be less than 5MB');
            return;
        }

        // Convert to base64
        const reader = new FileReader();
        reader.onloadend = () => {
            setFormData(prev => ({ ...prev, cardPhoto: reader.result }));
            toast.success('Photo added successfully');
        };
        reader.readAsDataURL(file);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Validation
        if (!formData.fullName || !formData.primarySkill || !formData.gender || !formData.mobileNumber) {
            toast.error('Please fill all required fields');
            return;
        }

        try {
            setLoading(true);

            // Prepare card data
            const cardData = {
                labourCardDetails: {
                    fullName: formData.fullName,
                    gender: formData.gender,
                    mobileNumber: formData.mobileNumber,
                    city: formData.city,
                    address: formData.address,
                    skills: formData.skills || formData.primarySkill
                },
                skillType: formData.primarySkill,
                experience: formData.experience,
                previousWorkLocation: formData.previousWorkLocation,
                availability: formData.availability,
                availabilityStatus: formData.availabilityStatus,
                rating: formData.rating,
                hasLabourCard: true
            };

            // Add card photo if uploaded (base64)
            if (formData.cardPhoto && formData.cardPhoto.startsWith('data:image')) {
                console.log('📸 Card photo detected, will upload to Cloudinary');
                cardData.labourCardDetails.photo = formData.cardPhoto;
            }

            console.log('Creating labour card:', cardData);

            // Check if user has access token
            const token = localStorage.getItem('access_token');

            if (!token) {
                // No token - save to localStorage (fallback)
                console.log('No access token found, saving to localStorage');
                const newCard = {
                    id: Date.now(),
                    ...formData,
                    createdAt: new Date().toISOString()
                };

                const existingCards = JSON.parse(localStorage.getItem('labour_cards') || '[]');
                existingCards.push(newCard);
                localStorage.setItem('labour_cards', JSON.stringify(existingCards));

                toast.success('Labour card created successfully!');
                navigate('/labour/my-card');
                return;
            }

            // Has token - save to backend
            const response = await labourAPI.createLabourCard(cardData);

            console.log('Labour card created:', response);

            toast.success('Labour card created successfully!');

            // Navigate to my card
            navigate('/labour/my-card');
        } catch (error) {
            console.error('Error creating labour card:', error);
            toast.error(error.response?.data?.message || 'Failed to create labour card');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="h-screen bg-gray-50 flex flex-col">
            <div className="bg-white px-4 py-4 shadow-sm flex items-center gap-3">
                <button onClick={() => navigate(-1)} className="p-1">
                    <ChevronLeft className="w-6 h-6" />
                </button>
                <h1 className="text-xl font-bold">Create Labour Card</h1>
            </div>

            <div className="flex-1 overflow-y-auto p-4 pb-20">
                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Card Photo Upload */}
                    <div className="bg-white rounded-lg shadow-sm p-4">
                        <h2 className="text-lg font-semibold text-gray-900 mb-4">Card Photo</h2>

                        <div className="flex flex-col items-center">
                            <div className="w-32 h-32 bg-gray-100 rounded-full flex items-center justify-center overflow-hidden mb-3 border-2 border-gray-200">
                                {formData.cardPhoto ? (
                                    <img src={formData.cardPhoto} alt="Card" className="w-full h-full object-cover" />
                                ) : (
                                    <User className="w-16 h-16 text-gray-400" />
                                )}
                            </div>

                            <input
                                type="file"
                                ref={photoInputRef}
                                onChange={handlePhotoChange}
                                className="hidden"
                                accept="image/*"
                            />

                            <button
                                type="button"
                                onClick={handlePhotoUpload}
                                className="flex items-center gap-2 bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-semibold px-6 py-2 rounded-full transition-all"
                            >
                                <Upload size={18} />
                                <span>Upload Photo</span>
                            </button>
                            <p className="text-xs text-gray-500 mt-2">Optional - Add your photo to the card</p>
                        </div>
                    </div>

                    {/* Header Section */}
                    <div className="bg-white rounded-lg shadow-sm p-4">
                        <h2 className="text-lg font-semibold text-gray-900 mb-4">Header Information</h2>

                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Full Name *
                            </label>
                            <input
                                type="text"
                                name="fullName"
                                value={formData.fullName}
                                onChange={handleChange}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
                                placeholder="Enter full name"
                                required
                            />
                        </div>

                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Primary Skill *
                            </label>
                            <input
                                type="text"
                                name="primarySkill"
                                value={formData.primarySkill}
                                onChange={handleChange}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
                                placeholder="e.g. Plumber, Mason, Welder"
                                required
                            />
                        </div>

                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-2 text-center">
                                Self Rating
                            </label>
                            <div className="flex justify-center gap-2">
                                {[1, 2, 3, 4, 5].map((star) => (
                                    <button
                                        key={star}
                                        type="button"
                                        onClick={() => handleRating(star)}
                                        className={`text-3xl ${star <= formData.rating ? 'text-yellow-400' : 'text-gray-300'
                                            }`}
                                    >
                                        ★
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Basic Information */}
                    <div className="bg-white rounded-lg shadow-sm p-4">
                        <h2 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h2>

                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Gender *
                            </label>
                            <select
                                name="gender"
                                value={formData.gender}
                                onChange={handleChange}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
                                required
                            >
                                <option value="">Select Gender</option>
                                <option value="Male">Male</option>
                                <option value="Female">Female</option>
                                <option value="Other">Other</option>
                            </select>
                        </div>

                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Mobile Number *
                            </label>
                            <input
                                type="tel"
                                name="mobileNumber"
                                value={formData.mobileNumber}
                                onChange={handleChange}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
                                placeholder="Enter mobile number"
                                maxLength={10}
                                required
                            />
                        </div>

                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                City *
                            </label>
                            <input
                                type="text"
                                name="city"
                                value={formData.city}
                                onChange={handleChange}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
                                placeholder="Enter city"
                                required
                            />
                        </div>

                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Address *
                            </label>
                            <textarea
                                name="address"
                                value={formData.address}
                                onChange={handleChange}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
                                placeholder="Enter address (max 2 lines)"
                                rows={2}
                                required
                            />
                        </div>
                    </div>

                    {/* Submit Button */}
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-bold py-3 rounded-lg shadow-md transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? 'Creating...' : 'Create Card'}
                    </button>
                </form>
            </div>

            <LabourBottomNav />
        </div>
    );
};

export default CreateLabourCard;
