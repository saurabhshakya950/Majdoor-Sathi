import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import ProfilePhotoUpload from '../../user/components/ProfilePhotoUpload';
import FormInput from '../../user/components/FormInput';
import FormSelect from '../../user/components/FormSelect';
import FormTextarea from '../../user/components/FormTextarea';
import { userAPI } from '../../../services/api';

const PersonalDetailsForm = ({ onSave }) => {
    const [formData, setFormData] = useState({
        firstName: '',
        middleName: '',
        lastName: '',
        gender: '',
        state: '',
        city: '',
        address: '',
        profileImage: null
    });

    useEffect(() => {
        const contractorProfile = JSON.parse(localStorage.getItem('contractor_profile') || '{}');

        setFormData({
            firstName: contractorProfile.firstName || '',
            middleName: contractorProfile.middleName || '',
            lastName: contractorProfile.lastName || '',
            gender: contractorProfile.gender || '',
            state: contractorProfile.state || '',
            city: contractorProfile.city || '',
            address: contractorProfile.address || '',
            profileImage: contractorProfile.profileImage || null
        });
    }, []);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleImageChange = (imageData) => {
        setFormData(prev => ({ ...prev, profileImage: imageData }));
    };

    const handleSaveChanges = async () => {
        try {
            // Validate required fields
            if (!formData.firstName.trim()) {
                toast.error('First name is required');
                return;
            }

            // Check if user has access token
            const token = localStorage.getItem('access_token');

            if (!token) {
                // No token - save to localStorage (fallback)
                console.log('No access token found, saving to localStorage');
                const contractorProfile = JSON.parse(localStorage.getItem('contractor_profile') || '{}');
                const updatedProfile = {
                    ...contractorProfile,
                    ...formData
                };
                localStorage.setItem('contractor_profile', JSON.stringify(updatedProfile));
                toast.success('Personal details updated successfully');
                if (onSave) onSave();
                return;
            }

            // Has token - save to backend with Cloudinary
            console.log('[INFO] Updating contractor profile with backend API...');

            const updateData = {
                firstName: formData.firstName,
                middleName: formData.middleName,
                lastName: formData.lastName,
                gender: formData.gender,
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
                const contractorProfile = JSON.parse(localStorage.getItem('contractor_profile') || '{}');

                // Use response.data.roleSpecificName if available, fallback to formData.firstName
                const updatedFirstName = response.data.roleSpecificName || formData.firstName;

                localStorage.setItem('contractor_profile', JSON.stringify({
                    ...contractorProfile,
                    firstName: updatedFirstName,
                    middleName: formData.middleName,
                    lastName: formData.lastName,
                    gender: formData.gender,
                    state: formData.state,
                    city: formData.city,
                    address: formData.address,
                    profileImage: (response.data.user && response.data.user.profilePhoto) || formData.profileImage
                }));

                // Dispatch event to notify ContractorHeader to re-fetch/update
                window.dispatchEvent(new Event('profileUpdated'));
                console.log('[INFO] Dispatched profileUpdated event');
            }

            toast.success('Personal details updated successfully');
            if (onSave) onSave();
        } catch (error) {
            console.error('[ERROR] Error updating profile:', error);
            toast.error(error.response?.data?.message || 'Failed to update profile');
        }
    };

    const genderOptions = [
        { value: 'Male', label: 'Male' },
        { value: 'Female', label: 'Female' },
        { value: 'Other', label: 'Other' }
    ];

    return (
        <div className="p-4">
            <ProfilePhotoUpload
                profileImage={formData.profileImage}
                onImageChange={handleImageChange}
            />

            <h2 className="text-lg font-bold text-gray-900 mb-4">Enter personal detail</h2>

            <FormInput
                label="First name"
                name="firstName"
                value={formData.firstName}
                onChange={handleChange}
                placeholder="Enter first name"
            />

            <div className="grid grid-cols-2 gap-3 mb-4">
                <div>
                    <label className="block text-sm font-medium text-gray-600 mb-2">
                        Middle name
                    </label>
                    <input
                        type="text"
                        name="middleName"
                        value={formData.middleName}
                        onChange={handleChange}
                        placeholder="Enter middle name"
                        className="w-full bg-gray-200 rounded-xl p-4 text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-yellow-400"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-600 mb-2">
                        Last name
                    </label>
                    <input
                        type="text"
                        name="lastName"
                        value={formData.lastName}
                        onChange={handleChange}
                        placeholder="Enter last name"
                        className="w-full bg-gray-200 rounded-xl p-4 text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-yellow-400"
                    />
                </div>
            </div>

            <FormSelect
                label="Gender"
                name="gender"
                value={formData.gender}
                onChange={handleChange}
                options={genderOptions}
            />

            <FormInput
                label="State"
                name="state"
                value={formData.state}
                onChange={handleChange}
                placeholder="Enter state"
            />

            <FormInput
                label="City"
                name="city"
                value={formData.city}
                onChange={handleChange}
                placeholder="Enter city"
            />

            <FormTextarea
                label="Address"
                name="address"
                value={formData.address}
                onChange={handleChange}
                placeholder="Enter address"
                rows={3}
            />

            <button
                onClick={handleSaveChanges}
                className="w-full py-4 rounded-full bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-bold text-lg transition-all shadow-md active:scale-[0.98]"
            >
                Save changes
            </button>
        </div>
    );
};

export default PersonalDetailsForm;
