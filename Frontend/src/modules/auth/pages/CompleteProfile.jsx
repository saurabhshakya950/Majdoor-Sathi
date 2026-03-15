import { useNavigate } from 'react-router-dom';
import { useState, useRef } from 'react';
import { User, Hammer, Briefcase } from 'lucide-react';
import toast from 'react-hot-toast';

const CompleteProfile = () => {
    const navigate = useNavigate();
    const fileInputRef = useRef(null);
    const [formData, setFormData] = useState({
        firstName: '',
        middleName: '',
        lastName: '',
        gender: '',
        dob: '',
        aadharNumber: '',
        city: '',
        state: '',
        address: '',
        userType: 'User', // Default
        profileImage: null
    });
    const [errors, setErrors] = useState({});

    const validateField = (name, value) => {
        let error = '';

        switch (name) {
            case 'firstName':
                if (!value.trim()) {
                    error = 'First name is required';
                } else if (value.trim().length < 2) {
                    error = 'First name must be at least 2 characters';
                } else if (!/^[a-zA-Z\s]+$/.test(value)) {
                    error = 'First name can only contain letters';
                }
                break;

            case 'middleName':
                if (value && !/^[a-zA-Z\s]+$/.test(value)) {
                    error = 'Middle name can only contain letters';
                }
                break;

            case 'lastName':
                if (!value.trim()) {
                    error = 'Last name is required';
                } else if (value.trim().length < 2) {
                    error = 'Last name must be at least 2 characters';
                } else if (!/^[a-zA-Z\s]+$/.test(value)) {
                    error = 'Last name can only contain letters';
                }
                break;

            case 'gender':
                if (!value) {
                    error = 'Gender is required';
                }
                break;

            case 'dob':
                if (!value) {
                    error = 'Date of birth is required';
                } else {
                    const today = new Date();
                    const birthDate = new Date(value);
                    let age = today.getFullYear() - birthDate.getFullYear();
                    const monthDiff = today.getMonth() - birthDate.getMonth();

                    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
                        age--;
                    }

                    if (birthDate > today) {
                        error = 'Date of birth cannot be in the future';
                    } else if (age < 18) {
                        error = 'You must be at least 18 years old';
                    } else if (age > 100) {
                        error = 'Please enter a valid date of birth';
                    }
                }
                break;

            case 'aadharNumber':
                if (value && !/^\d{12}$/.test(value.replace(/\s/g, ''))) {
                    error = 'Aadhar number must be exactly 12 digits';
                }
                break;

            case 'city':
                if (value && !/^[a-zA-Z\s]+$/.test(value)) {
                    error = 'City name can only contain letters';
                }
                break;

            case 'state':
                if (value && !/^[a-zA-Z\s]+$/.test(value)) {
                    error = 'State name can only contain letters';
                }
                break;

            case 'address':
                if (value && value.length > 200) {
                    error = 'Address cannot exceed 200 characters';
                }
                break;

            default:
                break;
        }

        return error;
    };

    const handleChange = (e) => {
        const { name, value } = e.target;

        // For aadhar number, only allow digits
        if (name === 'aadharNumber') {
            const digitsOnly = value.replace(/\D/g, '');
            if (digitsOnly.length <= 12) {
                setFormData(prev => ({ ...prev, [name]: digitsOnly }));
                const error = validateField(name, digitsOnly);
                setErrors(prev => ({ ...prev, [name]: error }));
            }
            return;
        }

        setFormData(prev => ({ ...prev, [name]: value }));

        // Validate on change
        const error = validateField(name, value);
        setErrors(prev => ({ ...prev, [name]: error }));
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
                toast.success('Photo added successfully');
            };
            reader.readAsDataURL(file);
        }
    };

    const handleContinue = async () => {
        // Validate all required fields
        const newErrors = {};

        // Validate required fields
        newErrors.firstName = validateField('firstName', formData.firstName);
        newErrors.lastName = validateField('lastName', formData.lastName);
        newErrors.gender = validateField('gender', formData.gender);
        newErrors.dob = validateField('dob', formData.dob);

        // Validate optional fields if they have values
        if (formData.middleName) {
            newErrors.middleName = validateField('middleName', formData.middleName);
        }
        if (formData.aadharNumber) {
            newErrors.aadharNumber = validateField('aadharNumber', formData.aadharNumber);
        }
        if (formData.city) {
            newErrors.city = validateField('city', formData.city);
        }
        if (formData.state) {
            newErrors.state = validateField('state', formData.state);
        }
        if (formData.address) {
            newErrors.address = validateField('address', formData.address);
        }

        // Filter out empty errors
        const filteredErrors = Object.fromEntries(
            Object.entries(newErrors).filter(([_, value]) => value !== '')
        );

        setErrors(filteredErrors);

        // If there are any errors, show the first one and stop
        if (Object.keys(filteredErrors).length > 0) {
            const firstError = Object.values(filteredErrors)[0];
            toast.error(firstError);
            return;
        }

        try {
            // Get mobile number and token
            const mobileNumber = localStorage.getItem('mobile_number') || '';
            const token = localStorage.getItem('access_token');

            if (!token) {
                toast.error('Authentication token missing. Please login again.');
                navigate('/mobile-input');
                return;
            }

            localStorage.setItem('user_type', formData.userType);

            // Handle different user types separately
            if (formData.userType === 'User') {
                // Only for User type - update User database
                const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/users/profile`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({
                        firstName: formData.firstName.trim(),
                        middleName: formData.middleName.trim(),
                        lastName: formData.lastName.trim(),
                        gender: formData.gender,
                        dob: formData.dob,
                        aadharNumber: formData.aadharNumber,
                        city: formData.city.trim(),
                        state: formData.state.trim(),
                        address: formData.address.trim(),
                        userType: formData.userType,
                        profileImage: formData.profileImage
                    })
                });

                const data = await response.json();

                if (data.success) {
                    console.log('User profile updated successfully:', data.data.user);
                    toast.success('Profile updated successfully!');
                } else {
                    toast.error(data.message || 'Failed to update profile');
                    return;
                }

                // Save to localStorage for offline access
                const userProfile = { ...formData, phoneNumber: mobileNumber };
                localStorage.setItem('user_profile', JSON.stringify(userProfile));
                console.log('User profile saved:', userProfile);
                navigate('/user/home', { state: { profile: userProfile } });

            } else if (formData.userType === 'Contractor') {
                // For Contractor - only create contractor profile, NOT user profile
                // Save to localStorage
                const existingProfile = JSON.parse(localStorage.getItem('contractor_profile') || '{}');
                const contractorProfile = {
                    ...existingProfile,
                    ...formData,
                    mobileNumber: mobileNumber
                };
                localStorage.setItem('contractor_profile', JSON.stringify(contractorProfile));
                console.log('Contractor profile saved to localStorage:', contractorProfile);

                // Create contractor profile in database (this will also update User model)
                try {
                    const contractorResponse = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/contractor/profile`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${token}`
                        },
                        body: JSON.stringify({
                            firstName: formData.firstName.trim(),
                            middleName: formData.middleName.trim(),
                            lastName: formData.lastName.trim(),
                            gender: formData.gender,
                            dob: formData.dob,
                            city: formData.city.trim(),
                            state: formData.state.trim(),
                            address: formData.address.trim(),
                            mobileNumber: mobileNumber
                        })
                    });

                    const contractorData = await contractorResponse.json();
                    if (contractorData.success) {
                        console.log('Contractor profile saved to database:', contractorData.data);
                        toast.success('Contractor profile created!');
                    } else {
                        toast.error(contractorData.message || 'Failed to create contractor profile');
                        return;
                    }
                } catch (error) {
                    console.error('Error creating contractor profile:', error);
                    toast.error('Failed to create contractor profile');
                    return;
                }

                navigate('/contractor/business-details');

            } else if (formData.userType === 'Labour') {
                // For Labour - create labour profile in database
                console.log('Creating Labour profile...');

                try {
                    const labourResponse = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/labour/create-profile`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${token}`
                        },
                        body: JSON.stringify({
                            mobileNumber: mobileNumber,
                            firstName: formData.firstName.trim(),
                            middleName: formData.middleName.trim(),
                            lastName: formData.lastName.trim(),
                            gender: formData.gender,
                            city: formData.city.trim(),
                            state: formData.state.trim()
                        })
                    });

                    const labourData = await labourResponse.json();
                    if (labourData.success) {
                        console.log('âœ… Labour profile created in database:', labourData.data);
                        toast.success('Profile created successfully!');

                        // Navigate to labour details page
                        navigate('/labour/details');
                    } else {
                        toast.error(labourData.message || 'Failed to create labour profile');
                        return;
                    }
                } catch (error) {
                    console.error('Error creating labour profile:', error);
                    toast.error('Failed to create labour profile');
                    return;
                }
            }
        } catch (error) {
            console.error('Error updating profile:', error);
            toast.error('Failed to update profile. Please try again.');
        }
    };

    return (
        <div className="h-screen bg-gray-50 flex flex-col p-4 overflow-hidden">
            <h1 className="text-lg font-bold text-gray-900 mb-4 text-center">Complete profile</h1>

            {/* Photo Placeholder */}
            <div className="flex justify-center items-center gap-4 mb-4">
                <div className="relative">
                    <div className="w-16 h-16 bg-gray-300 rounded-full flex items-center justify-center overflow-hidden border-2 border-white shadow-sm">
                        {formData.profileImage ? (
                            <img src={formData.profileImage} alt="Profile" className="w-full h-full object-cover" />
                        ) : (
                            <User className="w-8 h-8 text-gray-500" />
                        )}
                    </div>
                </div>
                <div>
                    <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileChange}
                        className="hidden"
                        accept="image/*"
                    />
                    <button
                        onClick={handlePhotoClick}
                        className="bg-white border border-gray-200 px-3 py-1.5 rounded-full text-xs font-semibold text-gray-700 hover:bg-gray-50 transition-colors shadow-sm"
                    >
                        {formData.profileImage ? 'Change photo' : 'Add photo'}
                    </button>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto pr-1 custom-scrollbar">
                {/* Name Fields */}
                <div className="mb-3">
                    <label className="block text-xs font-semibold text-gray-700 mb-1">First name <span className="text-red-500">*</span></label>
                    <input
                        type="text"
                        name="firstName"
                        value={formData.firstName}
                        onChange={handleChange}
                        placeholder="Ex: John"
                        className={`w-full bg-white border rounded-lg p-2.5 text-sm text-gray-700 focus:ring-2 focus:ring-yellow-400 focus:border-transparent outline-none transition-all ${errors.firstName ? 'border-red-500' : 'border-gray-200'}`}
                    />
                    {errors.firstName && <p className="text-xs text-red-500 mt-1">{errors.firstName}</p>}
                </div>

                <div className="grid grid-cols-2 gap-3 mb-3">
                    <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">Middle name</label>
                        <input
                            type="text"
                            name="middleName"
                            value={formData.middleName}
                            onChange={handleChange}
                            placeholder="Ex: Kumar"
                            className={`w-full bg-white border rounded-lg p-2.5 text-sm text-gray-700 focus:ring-2 focus:ring-yellow-400 focus:border-transparent outline-none transition-all ${errors.middleName ? 'border-red-500' : 'border-gray-200'}`}
                        />
                        {errors.middleName && <p className="text-xs text-red-500 mt-1">{errors.middleName}</p>}
                    </div>
                    <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">Last name <span className="text-red-500">*</span></label>
                        <input
                            type="text"
                            name="lastName"
                            value={formData.lastName}
                            onChange={handleChange}
                            placeholder="Ex: Doe"
                            className={`w-full bg-white border rounded-lg p-2.5 text-sm text-gray-700 focus:ring-2 focus:ring-yellow-400 focus:border-transparent outline-none transition-all ${errors.lastName ? 'border-red-500' : 'border-gray-200'}`}
                        />
                        {errors.lastName && <p className="text-xs text-red-500 mt-1">{errors.lastName}</p>}
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-3 mb-3">
                    <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">Gender <span className="text-red-500">*</span></label>
                        <select
                            name="gender"
                            value={formData.gender}
                            onChange={handleChange}
                            className={`w-full bg-white border rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-yellow-400 outline-none transition-all ${formData.gender ? 'text-gray-700' : 'text-gray-400'} ${errors.gender ? 'border-red-500' : 'border-gray-200'}`}
                        >
                            <option value="" disabled hidden>Select Gender</option>
                            <option value="Male" className="text-gray-700">Male</option>
                            <option value="Female" className="text-gray-700">Female</option>
                            <option value="Other" className="text-gray-700">Other</option>
                        </select>
                        {errors.gender && <p className="text-xs text-red-500 mt-1">{errors.gender}</p>}
                    </div>
                    <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">Date of birth <span className="text-red-500">*</span></label>
                        <input
                            type="date"
                            name="dob"
                            value={formData.dob}
                            onChange={handleChange}
                            max={new Date(new Date().setFullYear(new Date().getFullYear() - 18)).toISOString().split('T')[0]}
                            className={`w-full bg-white border rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-yellow-400 outline-none transition-all ${formData.dob ? 'text-gray-700' : 'text-gray-400'} ${errors.dob ? 'border-red-500' : 'border-gray-200'}`}
                        />
                        {errors.dob && <p className="text-xs text-red-500 mt-1">{errors.dob}</p>}
                    </div>
                </div>

                {/* City and State */}
                <div className="grid grid-cols-2 gap-3 mb-3">
                    <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">City</label>
                        <input
                            type="text"
                            name="city"
                            value={formData.city}
                            onChange={handleChange}
                            placeholder="Enter city"
                            className={`w-full bg-white border rounded-lg p-2.5 text-sm text-gray-700 focus:ring-2 focus:ring-yellow-400 focus:border-transparent outline-none transition-all ${errors.city ? 'border-red-500' : 'border-gray-200'}`}
                        />
                        {errors.city && <p className="text-xs text-red-500 mt-1">{errors.city}</p>}
                    </div>
                    <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">State</label>
                        <input
                            type="text"
                            name="state"
                            value={formData.state}
                            onChange={handleChange}
                            placeholder="Enter state"
                            className={`w-full bg-white border rounded-lg p-2.5 text-sm text-gray-700 focus:ring-2 focus:ring-yellow-400 focus:border-transparent outline-none transition-all ${errors.state ? 'border-red-500' : 'border-gray-200'}`}
                        />
                        {errors.state && <p className="text-xs text-red-500 mt-1">{errors.state}</p>}
                    </div>
                </div>

                {/* Address */}
                <div className="mb-3">
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Address</label>
                    <textarea
                        name="address"
                        value={formData.address}
                        onChange={handleChange}
                        placeholder="Enter address"
                        rows="2"
                        maxLength="200"
                        className={`w-full bg-white border rounded-lg p-2.5 text-sm text-gray-700 focus:ring-2 focus:ring-yellow-400 focus:border-transparent outline-none transition-all resize-none ${errors.address ? 'border-red-500' : 'border-gray-200'}`}
                    />
                    {errors.address && <p className="text-xs text-red-500 mt-1">{errors.address}</p>}
                    {formData.address && <p className="text-xs text-gray-400 mt-1">{formData.address.length}/200</p>}
                </div>

                {/* Aadhar Card Number */}
                <div className="mb-3">
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Aadhar Card Number</label>
                    <input
                        type="text"
                        name="aadharNumber"
                        value={formData.aadharNumber}
                        onChange={handleChange}
                        placeholder="Ex: 123456789012"
                        maxLength="12"
                        className={`w-full bg-white border rounded-lg p-2.5 text-sm text-gray-700 focus:ring-2 focus:ring-yellow-400 focus:border-transparent outline-none transition-all ${errors.aadharNumber ? 'border-red-500' : 'border-gray-200'}`}
                    />
                    {errors.aadharNumber && <p className="text-xs text-red-500 mt-1">{errors.aadharNumber}</p>}
                    {formData.aadharNumber && <p className="text-xs text-gray-400 mt-1">{formData.aadharNumber.length}/12 digits</p>}
                </div>

                {/* User Type Selection */}
                <div className="bg-white border border-gray-100 p-3 rounded-xl shadow-sm mb-2">
                    <label className="block text-xs font-bold text-gray-900 mb-2">User Type <span className="text-red-500">*</span></label>
                    <div className="grid grid-cols-2 gap-2">
                        <div
                            onClick={() => setFormData(prev => ({ ...prev, userType: 'User' }))}
                            className={`flex items-center p-2 rounded-lg border transition-all cursor-pointer ${formData.userType === 'User' ? 'border-yellow-400 bg-yellow-50' : 'border-gray-50 hover:bg-gray-50'}`}
                        >
                            <User className="w-4 h-4 mr-2 text-gray-600" />
                            <span className="text-xs font-medium">User</span>
                        </div>

                        <div
                            onClick={() => setFormData(prev => ({ ...prev, userType: 'Labour' }))}
                            className={`flex items-center p-2 rounded-lg border transition-all cursor-pointer ${formData.userType === 'Labour' ? 'border-yellow-400 bg-yellow-50' : 'border-gray-50 hover:bg-gray-50'}`}
                        >
                            <Hammer className="w-4 h-4 mr-2 text-yellow-600" />
                            <span className="text-xs font-medium">Labour</span>
                        </div>

                        <div
                            onClick={() => setFormData(prev => ({ ...prev, userType: 'Contractor' }))}
                            className={`flex items-center p-2 rounded-lg border transition-all cursor-pointer ${formData.userType === 'Contractor' ? 'border-yellow-400 bg-yellow-50' : 'border-gray-50 hover:bg-gray-50'}`}
                        >
                            <Briefcase className="w-4 h-4 mr-2 text-gray-600" />
                            <span className="text-xs font-medium">Contractor</span>
                        </div>
                    </div>
                </div>
            </div>

            <button
                onClick={handleContinue}
                className="w-full py-3.5 rounded-full bg-[#fbbf24] hover:bg-yellow-500 text-gray-900 font-bold text-base transition-all shadow-md active:scale-[0.98] mt-4"
            >
                Continue
            </button>
        </div>
    );
};

export default CompleteProfile;

