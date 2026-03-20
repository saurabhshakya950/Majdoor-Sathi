import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, User } from 'lucide-react';
import LabourBottomNav from '../components/LabourBottomNav';
import toast from 'react-hot-toast';
import { userAPI } from '../../../services/api';

const LabourPersonalDetails = () => {
    const navigate = useNavigate();
    const fileInputRef = useRef(null);
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

    useEffect(() => {
        const profile = JSON.parse(localStorage.getItem('labour_profile') || '{}');
        setFormData({
            profileImage: profile.photo || null,
            firstName: profile.firstName || '',
            middleName: profile.middleName || '',
            lastName: profile.lastName || '',
            gender: profile.gender || '',
            dob: profile.dob || '',
            state: profile.state || '',
            city: profile.city || '',
            address: profile.address || ''
        });
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
            // Check if user has access token
            const token = localStorage.getItem('access_token');

            if (!token) {
                // No token - save to localStorage (fallback)
                console.log('No access token found, saving to localStorage');
                const existingProfile = JSON.parse(localStorage.getItem('labour_profile') || '{}');
                const updatedProfile = {
                    ...existingProfile,
                    photo: formData.profileImage,
                    firstName: formData.firstName,
                    middleName: formData.middleName,
                    lastName: formData.lastName,
                    gender: formData.gender,
                    dob: formData.dob,
                    state: formData.state,
                    city: formData.city,
                    address: formData.address
                };
                localStorage.setItem('labour_profile', JSON.stringify(updatedProfile));
                window.dispatchEvent(new Event('profileUpdated'));
                toast.success('Changes saved successfully!');
                return;
            }

            // Has token - save to backend with Cloudinary
            console.log('[INFO] Updating labour profile with backend API...');

            const updateData = {
                firstName: formData.firstName,
                middleName: formData.middleName,
                lastName: formData.lastName,
                gender: formData.gender,
                dob: formData.dob,
                state: formData.state,
                city: formData.city,
                address: formData.address
            };

            // Add profile photo if it's base64 (new upload)
            if (formData.profileImage && formData.profileImage.startsWith('data:image')) {
                console.log('[INFO] Profile photo detected (base64), will upload to Cloudinary');
                updateData.profilePhoto = formData.profileImage;
            }

            const response = await userAPI.updateProfile(updateData);

            console.log('[SUCCESS] Profile updated:', response);

            // Update localStorage with response data
            if (response.success) {
                const existingProfile = JSON.parse(localStorage.getItem('labour_profile') || '{}');

                // Use response.data.roleSpecificName if available, fallback to formData.firstName
                const updatedFirstName = response.data.roleSpecificName || formData.firstName;

                localStorage.setItem('labour_profile', JSON.stringify({
                    ...existingProfile,
                    photo: (response.data.user && response.data.user.profilePhoto) || formData.profileImage,
                    firstName: updatedFirstName,
                    middleName: formData.middleName,
                    lastName: formData.lastName,
                    gender: formData.gender,
                    dob: formData.dob,
                    state: formData.state,
                    city: formData.city,
                    address: formData.address
                }));
            }

            // Dispatch event to update header
            window.dispatchEvent(new Event('profileUpdated'));

            toast.success('Changes saved successfully!');
        } catch (error) {
            console.error('[ERROR] Error updating profile:', error);
            toast.error(error.response?.data?.message || 'Failed to update profile');
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
                    className="w-full py-3.5 rounded-full bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-bold text-base transition-all shadow-md active:scale-[0.98]"
                >
                    Save changes
                </button>
            </div>

            <LabourBottomNav />
        </div>
    );
};

export default LabourPersonalDetails;
