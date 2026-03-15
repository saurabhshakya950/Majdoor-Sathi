import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import ContractorPageHeader from '../components/ContractorPageHeader';
import BusinessDetailForm from '../components/BusinessDetailForm';
import BusinessAddressForm from '../components/BusinessAddressForm';

const BusinessDetails = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        businessType: 'Proprietorship',
        businessName: '',
        city: '',
        state: '',
        addressLine1: '',
        landmark: ''
    });

    useEffect(() => {
        // Load existing business details from localStorage
        const contractorProfile = JSON.parse(localStorage.getItem('contractor_profile') || '{}');
        if (contractorProfile.businessDetails) {
            setFormData(contractorProfile.businessDetails);
        }
    }, []);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const validateForm = () => {
        if (!formData.businessName.trim()) {
            toast.error('Please enter business name');
            return false;
        }
        if (!formData.addressLine1.trim()) {
            toast.error('Please enter address line 1');
            return false;
        }
        return true;
    };

    const handleSaveBusinessDetails = async () => {
        if (!validateForm()) return;

        try {
            const token = localStorage.getItem('access_token');

            // Save to database
            if (token) {
                const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/contractor/business-details`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify(formData)
                });

                const data = await response.json();

                if (data.success) {
                    console.log('Business details saved to database:', data.data);
                    toast.success('Business details saved successfully');
                } else {
                    toast.error(data.message || 'Failed to save business details');
                    return;
                }
            }

            // Also save to localStorage
            const contractorProfile = JSON.parse(localStorage.getItem('contractor_profile') || '{}');
            const updatedProfile = {
                ...contractorProfile,
                businessDetails: formData
            };
            localStorage.setItem('contractor_profile', JSON.stringify(updatedProfile));

            // Check if coming from settings or onboarding
            const isFromSettings = contractorProfile.businessDetails !== undefined;
            if (isFromSettings) {
                navigate('/contractor/settings');
            } else {
                navigate('/contractor/hire-workers');
            }
        } catch (error) {
            console.error('Error saving business details:', error);
            toast.error('Failed to save business details');
        }
    };

    return (
        <div className="bg-gray-50 flex flex-col overflow-hidden" style={{ height: '100dvh', minHeight: '-webkit-fill-available' }}>
            <ContractorPageHeader title="Business details" sticky />

            <div className="flex-1 overflow-y-auto">
                <div className="p-4 space-y-6 pb-12">
                    <BusinessDetailForm formData={formData} onChange={handleChange} />
                    <BusinessAddressForm formData={formData} onChange={handleChange} />

                    <button
                        onClick={handleSaveBusinessDetails}
                        className="w-full py-4 rounded-xl bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-bold text-lg transition-all shadow-md active:scale-95 mt-4"
                    >
                        Save business details
                    </button>
                </div>
            </div>
        </div>
    );
};

export default BusinessDetails;

