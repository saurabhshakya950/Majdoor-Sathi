import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, User } from 'lucide-react';
import LabourBottomNav from '../components/LabourBottomNav';
import toast from 'react-hot-toast';
import { userAPI } from '../../../services/api';

const LabourPersonalDetails = () => {
    const navigate = useNavigate();
    const fileInputRef = useRef(null);
    const [loading, setLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [formData, setFormData] = useState({
        profileImage: null,
        firstName: '',
        middleName: '',
        lastName: '',
        gender: '',
        dob: '',
        state: '',
        city: '',
        address: ''
    });

    // Helper to format string in Title Case
    const toTitleCase = (str) => {
        if (!str) return '';
        return str.trim().split(/\s+/).map(word => 
            word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
        ).join(' ');
    };

    // Helper to format Date for input
    const formatDateForInput = (dateStr) => {
        if (!dateStr) return '';
        try {
            const date = new Date(dateStr);
            if (isNaN(date.getTime())) return '';
            return date.toISOString().split('T')[0];
        } catch (e) {
            return '';
        }
    };

    useEffect(() => {
        const fetchPersonalDetails = async () => {
            try {
                setLoading(true);
                // Call API to fetch fresh data from Labour collection (uniquely identified by token)
                const response = await userAPI.getProfile();
                
                if (response.success && response.data.user) {
                    const user = response.data.user;
                    // Also get role-specific labour details from localStorage if they aren't in the user object
                    const labourProfile = JSON.parse(localStorage.getItem('labour_profile') || '{}');
                    
                    setFormData({
                        profileImage: user.profilePhoto || labourProfile.photo || null,
                        firstName: toTitleCase(user.firstName || labourProfile.firstName || ''),
                        middleName: toTitleCase(user.middleName || labourProfile.middleName || ''),
                        lastName: toTitleCase(user.lastName || labourProfile.lastName || ''),
                        gender: user.gender || labourProfile.gender || '',
                        dob: formatDateForInput(user.dob || labourProfile.dob || ''),
                        state: toTitleCase(user.state || labourProfile.state || ''),
                        city: toTitleCase(user.city || labourProfile.city || ''),
                        address: user.address || labourProfile.address || ''
                    });
                }
            } catch (error) {
                console.error('Error fetching profile:', error);
                // Fallback to localStorage if API fails
                const profile = JSON.parse(localStorage.getItem('labour_profile') || '{}');
                setFormData({
                    profileImage: profile.photo || null,
                    firstName: toTitleCase(profile.firstName || ''),
                    middleName: toTitleCase(profile.middleName || ''),
                    lastName: toTitleCase(profile.lastName || ''),
                    gender: profile.gender || '',
                    dob: formatDateForInput(profile.dob || ''),
                    state: toTitleCase(profile.state || ''),
                    city: toTitleCase(profile.city || ''),
                    address: profile.address || ''
                });
            } finally {
                setLoading(false);
            }
        };

        fetchPersonalDetails();
    }, []);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handlePhotoClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setFormData(prev => ({ ...prev, profileImage: reader.result }));
                toast.success('Photo updated successfully');
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSaveChanges = async () => {
        if (!formData.firstName.trim()) {
            toast.error('First name is required');
            return;
        }

        if (!formData.lastName.trim()) {
            toast.error('Last name is required');
            return;
        }

        try {
            setIsSaving(true);
            // Check if user has access token
            const token = localStorage.getItem('access_token');

            if (!token) {
                // No token - save to localStorage (fallback)
                const updatedProfile = {
                    photo: formData.profileImage,
                    firstName: toTitleCase(formData.firstName),
                    middleName: toTitleCase(formData.middleName),
                    lastName: toTitleCase(formData.lastName),
                    gender: formData.gender,
                    dob: formData.dob,
                    state: toTitleCase(formData.state),
                    city: toTitleCase(formData.city),
                    address: formData.address
                };
                localStorage.setItem('labour_profile', JSON.stringify(updatedProfile));
                window.dispatchEvent(new Event('profileUpdated'));
                toast.success('Changes saved successfully!');
                return;
            }

            // Formatting strings before saving (Title Case as per tester requirement)
            const formattedFirstName = toTitleCase(formData.firstName);
            const formattedMiddleName = toTitleCase(formData.middleName);
            const formattedLastName = toTitleCase(formData.lastName);
            const formattedCity = toTitleCase(formData.city);
            const formattedState = toTitleCase(formData.state);

            const updateData = {
                firstName: formattedFirstName,
                middleName: formattedMiddleName,
                lastName: formattedLastName,
                gender: formData.gender,
                dob: formData.dob,
                state: formattedState,
                city: formattedCity,
                address: formData.address
            };

            if (formData.profileImage && formData.profileImage.startsWith('data:image')) {
                updateData.profilePhoto = formData.profileImage;
            }

            const response = await userAPI.updateProfile(updateData);

            if (response.success) {
                const existingProfile = JSON.parse(localStorage.getItem('labour_profile') || '{}');
                const updatedPhoto = (response.data.user && response.data.user.profilePhoto) || formData.profileImage;
                
                localStorage.setItem('labour_profile', JSON.stringify({
                    ...existingProfile,
                    photo: updatedPhoto,
                    firstName: formattedFirstName,
                    middleName: formattedMiddleName,
                    lastName: formattedLastName,
                    gender: formData.gender,
                    dob: formData.dob,
                    state: formattedState,
                    city: formattedCity,
                    address: formData.address
                }));

                // Update local form state with formatted data
                setFormData(prev => ({
                    ...prev,
                    firstName: formattedFirstName,
                    middleName: formattedMiddleName,
                    lastName: formattedLastName,
                    city: formattedCity,
                    state: formattedState
                }));
            }

            window.dispatchEvent(new Event('profileUpdated'));
            toast.success('Changes saved successfully!');
        } catch (error) {
            console.error('[ERROR] Error updating profile:', error);
            toast.error(error.response?.data?.message || 'Failed to update profile');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="bg-gray-50 flex flex-col overflow-hidden" style={{ height: '100dvh', minHeight: '-webkit-fill-available' }}>
            <div className="bg-white px-4 py-4 shadow-sm flex items-center gap-3 sticky top-0 z-10">
                <button onClick={() => navigate(-1)} className="p-1">
                    <ChevronLeft className="w-6 h-6" />
                </button>
                <h1 className="text-xl font-bold">Personal details</h1>
            </div>

            <div className="flex-1 overflow-y-auto p-4 pb-20">
                {loading ? (
                    <div className="flex flex-col items-center justify-center h-full gap-3">
                        <div className="w-10 h-10 border-4 border-yellow-400 border-t-transparent rounded-full animate-spin"></div>
                        <p className="text-gray-500 animate-pulse">Fetching your details...</p>
                    </div>
                ) : (
                    <>
                        {/* Profile Photo */}
                <div className="flex items-center gap-4 mb-6">
                    <div className="w-24 h-24 bg-gray-200 rounded-full flex items-center justify-center overflow-hidden">
                        {formData.profileImage ? (
                            <img src={formData.profileImage} alt="Profile" className="w-full h-full object-cover" />
                        ) : (
                            <User className="w-12 h-12 text-gray-400" />
                        )}
                    </div>
                    <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileChange}
                        className="hidden"
                        accept="image/*"
                    />
                    <button
                        onClick={handlePhotoClick}
                        className="bg-white border border-gray-300 px-6 py-2 rounded-full text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                        Change photo
                    </button>
                </div>

                <h2 className="text-lg font-bold text-gray-900 mb-4">Enter personal detail</h2>

                {/* First Name */}
                <div className="mb-4">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                        First name
                    </label>
                    <input
                        type="text"
                        name="firstName"
                        value={formData.firstName}
                        onChange={handleChange}
                        placeholder="Enter first name"
                        className="w-full bg-white border border-gray-200 rounded-xl p-3 text-sm text-gray-700 focus:ring-2 focus:ring-yellow-400 focus:border-transparent outline-none"
                    />
                </div>

                {/* Middle and Last Name */}
                <div className="grid grid-cols-2 gap-3 mb-4">
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Middle name
                        </label>
                        <input
                            type="text"
                            name="middleName"
                            value={formData.middleName}
                            onChange={handleChange}
                            placeholder="Enter middle name"
                            className="w-full bg-white border border-gray-200 rounded-xl p-3 text-sm text-gray-700 focus:ring-2 focus:ring-yellow-400 outline-none"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Last name
                        </label>
                        <input
                            type="text"
                            name="lastName"
                            value={formData.lastName}
                            onChange={handleChange}
                            placeholder="Enter last name"
                            className="w-full bg-white border border-gray-200 rounded-xl p-3 text-sm text-gray-700 focus:ring-2 focus:ring-yellow-400 outline-none"
                        />
                    </div>
                </div>

                {/* Gender */}
                <div className="mb-4">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Gender
                    </label>
                    <select
                        name="gender"
                        value={formData.gender}
                        onChange={handleChange}
                        className="w-full bg-white border border-gray-200 rounded-xl p-3 text-sm text-gray-700 focus:ring-2 focus:ring-yellow-400 outline-none"
                    >
                        <option value="">Select Gender</option>
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Other">Other</option>
                    </select>
                </div>

                {/* Date of Birth */}
                <div className="mb-4">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Date of Birth
                    </label>
                    <input
                        type="date"
                        name="dob"
                        value={formData.dob}
                        onChange={handleChange}
                        className="w-full bg-white border border-gray-200 rounded-xl p-3 text-sm text-gray-700 focus:ring-2 focus:ring-yellow-400 outline-none"
                    />
                </div>

                {/* State */}
                <div className="mb-4">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                        State
                    </label>
                    <input
                        type="text"
                        name="state"
                        value={formData.state}
                        onChange={handleChange}
                        placeholder="Enter state"
                        className="w-full bg-white border border-gray-200 rounded-xl p-3 text-sm text-gray-700 focus:ring-2 focus:ring-yellow-400 outline-none"
                    />
                </div>

                {/* City */}
                <div className="mb-4">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                        City
                    </label>
                    <input
                        type="text"
                        name="city"
                        value={formData.city}
                        onChange={handleChange}
                        placeholder="Enter city"
                        className="w-full bg-white border border-gray-200 rounded-xl p-3 text-sm text-gray-700 focus:ring-2 focus:ring-yellow-400 outline-none"
                    />
                </div>

                {/* Address */}
                <div className="mb-6">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Address
                    </label>
                    <textarea
                        name="address"
                        value={formData.address}
                        onChange={handleChange}
                        placeholder="Enter address"
                        rows="3"
                        className="w-full bg-white border border-gray-200 rounded-xl p-3 text-sm text-gray-700 focus:ring-2 focus:ring-yellow-400 outline-none resize-none"
                    />
                </div>

                {/* Save Button */}
                <button
                    onClick={handleSaveChanges}
                    disabled={isSaving || loading}
                    className={`w-full py-3.5 rounded-full font-bold text-base transition-all shadow-md active:scale-[0.98] flex items-center justify-center gap-2 ${
                        isSaving || loading ? 'bg-gray-300 text-gray-500 cursor-not-allowed' : 'bg-yellow-400 hover:bg-yellow-500 text-gray-900'
                    }`}
                >
                    {isSaving ? (
                        <>
                            <div className="w-5 h-5 border-2 border-gray-600 border-t-transparent rounded-full animate-spin"></div>
                            <span>Saving Changes...</span>
                        </>
                    ) : (
                        'Save changes'
                    )}
                </button>
                    </>
                )}
            </div>

            <LabourBottomNav />
        </div>
    );
};

export default LabourPersonalDetails;
