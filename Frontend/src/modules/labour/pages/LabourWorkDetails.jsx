import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Hammer, Clock, MapPin, Upload, Star } from 'lucide-react';
import LabourBottomNav from '../components/LabourBottomNav';
import toast from 'react-hot-toast';
import { labourAPI } from '../../../services/api';

const LabourWorkDetails = () => {
    const navigate = useNavigate();
    const fileInputRef = useRef(null);
    const [formData, setFormData] = useState({
        skillType: '',
        experience: '',
        previousWorkLocation: '',
        workPhotos: [],
        rating: 0,
        availability: 'Full Time'
    });

    useEffect(() => {
        const profile = JSON.parse(localStorage.getItem('labour_profile') || '{}');
        setFormData({
            skillType: profile.skillType || '',
            experience: profile.experience || '',
            previousWorkLocation: profile.previousWorkLocation || '',
            workPhotos: profile.workPhotos || [],
            rating: profile.rating || 0,
            availability: profile.availability || 'Full Time'
        });
    }, []);



    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handlePhotoUpload = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = (e) => {
        const files = Array.from(e.target.files);
        if (files.length > 0) {
            const newPhotos = files.map(file => {
                return new Promise((resolve) => {
                    const reader = new FileReader();
                    reader.onloadend = () => resolve(reader.result);
                    reader.readAsDataURL(file);
                });
            });

            Promise.all(newPhotos).then(photos => {
                setFormData(prev => ({
                    ...prev,
                    workPhotos: [...prev.workPhotos, ...photos]
                }));
                toast.success('Photos added successfully');
            });
        }
    };

    const handleRating = (rating) => {
        setFormData(prev => ({ ...prev, rating }));
    };

    const handleSaveWorkDetails = async () => {
        if (!formData.skillType) {
            toast.error('Please select a skill type');
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
                    skillType: formData.skillType,
                    experience: formData.experience,
                    previousWorkLocation: formData.previousWorkLocation,
                    workPhotos: formData.workPhotos,
                    rating: formData.rating,
                    availability: formData.availability
                };
                localStorage.setItem('labour_profile', JSON.stringify(updatedProfile));
                window.dispatchEvent(new Event('profileUpdated'));
                toast.success('Work details saved successfully!');
                return;
            }

            // Has token - save to backend with Cloudinary
            console.log('📤 Updating work details with backend API...');

            const updateData = {
                skillType: formData.skillType,
                experience: formData.experience,
                previousWorkLocation: formData.previousWorkLocation,
                rating: formData.rating,
                availability: formData.availability
            };

            // Filter work photos - separate new uploads (base64) from existing URLs
            const newPhotos = formData.workPhotos.filter(photo => photo.startsWith('data:image'));
            const existingPhotos = formData.workPhotos.filter(photo => !photo.startsWith('data:image'));

            if (newPhotos.length > 0) {
                console.log(`📸 ${newPhotos.length} new work photos detected, will upload to Cloudinary`);
                updateData.workPhotos = formData.workPhotos; // Send all photos, backend will handle filtering
            } else if (existingPhotos.length > 0) {
                updateData.workPhotos = existingPhotos; // Keep existing photos
            }

            const response = await labourAPI.updateWorkDetails(updateData);

            console.log('✅ Work details updated:', response);

            // Update localStorage with response data
            if (response.success && response.data.labour) {
                const updatedLabour = response.data.labour;
                const existingProfile = JSON.parse(localStorage.getItem('labour_profile') || '{}');
                localStorage.setItem('labour_profile', JSON.stringify({
                    ...existingProfile,
                    skillType: updatedLabour.skillType,
                    experience: updatedLabour.experience,
                    previousWorkLocation: updatedLabour.previousWorkLocation,
                    workPhotos: updatedLabour.workPhotos || formData.workPhotos,
                    rating: updatedLabour.rating,
                    availability: updatedLabour.availability
                }));
            }

            // Dispatch event to update header
            window.dispatchEvent(new Event('profileUpdated'));

            toast.success('Work details saved successfully!');
        } catch (error) {
            console.error('❌ Error updating work details:', error);
            toast.error(error.response?.data?.message || 'Failed to update work details');
        }
    };

    return (
        <div className="bg-gray-50 flex flex-col overflow-hidden" style={{ height: '100dvh', minHeight: '-webkit-fill-available' }}>
            <div className="bg-white px-4 py-4 shadow-sm flex items-center gap-3 sticky top-0 z-10">
                <button onClick={() => navigate(-1)} className="p-1">
                    <ChevronLeft className="w-6 h-6" />
                </button>
                <h1 className="text-xl font-bold">Work Details</h1>
            </div>

            <div className="flex-1 overflow-y-auto p-4 pb-20">
                {/* Primary Skill */}
                <div className="mb-4">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Primary Skill
                    </label>
                    <div className="relative">
                        <Hammer className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                            type="text"
                            name="skillType"
                            value={formData.skillType}
                            onChange={handleChange}
                            placeholder="e.g. Plumber, Mason, Welder"
                            className="w-full bg-white border border-gray-200 rounded-xl pl-11 pr-4 py-3 text-sm text-gray-700 focus:ring-2 focus:ring-yellow-400 outline-none"
                        />
                    </div>
                </div>

                {/* Experience */}
                <div className="mb-4">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Experience (Years)
                    </label>
                    <div className="relative">
                        <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                            type="text"
                            name="experience"
                            value={formData.experience}
                            onChange={handleChange}
                            placeholder="e.g. 5"
                            className="w-full bg-white border border-gray-200 rounded-xl pl-11 pr-4 py-3 text-sm text-gray-700 focus:ring-2 focus:ring-yellow-400 outline-none"
                        />
                    </div>
                </div>

                {/* Previous Work Location */}
                <div className="mb-4">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Previous Work Location
                    </label>
                    <div className="relative">
                        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                            type="text"
                            name="previousWorkLocation"
                            value={formData.previousWorkLocation}
                            onChange={handleChange}
                            placeholder="City, Area"
                            className="w-full bg-white border border-gray-200 rounded-xl pl-11 pr-4 py-3 text-sm text-gray-700 focus:ring-2 focus:ring-yellow-400 outline-none"
                        />
                    </div>
                </div>

                {/* Previous Work Photos */}
                <div className="mb-4">
                    <label className="block text-sm font-semibold text-gray-700 mb-3">
                        Previous Work Photos
                    </label>
                    <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileChange}
                        className="hidden"
                        accept="image/*"
                        multiple
                    />

                    <div className="grid grid-cols-3 gap-3">
                        {formData.workPhotos.map((photo, index) => (
                            <div key={index} className="aspect-square rounded-xl overflow-hidden border-2 border-gray-200">
                                <img src={photo} alt={`Work ${index + 1}`} className="w-full h-full object-cover" />
                            </div>
                        ))}
                        <button
                            onClick={handlePhotoUpload}
                            className="aspect-square border-2 border-dashed border-gray-300 rounded-xl flex flex-col items-center justify-center hover:border-yellow-400 hover:bg-yellow-50 transition-all"
                        >
                            <Upload className="w-8 h-8 text-gray-400 mb-1" />
                            <span className="text-xs text-gray-500 font-medium">Add</span>
                        </button>
                    </div>
                </div>

                {/* Self Rating */}
                <div className="mb-4">
                    <label className="block text-sm font-semibold text-gray-900 mb-2 text-center">
                        Self Rating
                    </label>
                    <div className="flex justify-center gap-2 mb-2">
                        {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                                key={star}
                                onClick={() => handleRating(star)}
                                className={`w-10 h-10 cursor-pointer transition-all ${star <= formData.rating
                                    ? 'fill-yellow-400 text-yellow-400'
                                    : 'fill-gray-200 text-gray-200'
                                    }`}
                            />
                        ))}
                    </div>
                    <p className="text-center text-sm text-gray-500">Rate your skills</p>
                </div>

                {/* Availability */}
                <div className="mb-6">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Availability
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                        <button
                            onClick={() => setFormData(prev => ({ ...prev, availability: 'Full Time' }))}
                            className={`py-3 rounded-xl font-semibold text-sm transition-all ${formData.availability === 'Full Time'
                                ? 'bg-yellow-400 text-gray-900 border-2 border-yellow-400'
                                : 'bg-white text-gray-600 border-2 border-gray-200'
                                }`}
                        >
                            Full Time
                        </button>
                        <button
                            onClick={() => setFormData(prev => ({ ...prev, availability: 'Part Time' }))}
                            className={`py-3 rounded-xl font-semibold text-sm transition-all ${formData.availability === 'Part Time'
                                ? 'bg-yellow-400 text-gray-900 border-2 border-yellow-400'
                                : 'bg-white text-gray-600 border-2 border-gray-200'
                                }`}
                        >
                            Part Time
                        </button>
                    </div>
                </div>

                {/* Save Button */}
                <button
                    onClick={handleSaveWorkDetails}
                    className="w-full py-3.5 rounded-full bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-bold text-base transition-all shadow-md active:scale-[0.98]"
                >
                    Save Work Details
                </button>
            </div>

            <LabourBottomNav />
        </div>
    );
};

export default LabourWorkDetails;
