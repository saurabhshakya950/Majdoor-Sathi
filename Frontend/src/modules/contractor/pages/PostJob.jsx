import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import ContractorPageHeader from '../components/ContractorPageHeader';
import { contractorAPI } from '../../../services/api';

const PostJob = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        contractorName: '',
        phoneNumber: '',
        city: '',
        address: '',
        businessType: '',
        businessName: '',
        labourSkill: '',
        experience: '',
        workDuration: '',
        budgetType: 'Fixed Amount',
        budgetAmount: '',
        rating: 0,
        profileStatus: 'Active'
    });

    const [skillsList, setSkillsList] = useState([]);
    const [skillsLoading, setSkillsLoading] = useState(true);

    // Auto-fill contractor information and fetch dynamic skills
    useEffect(() => {
        const fetchInitialData = async () => {
            try {
                // Load profile
                const profile = JSON.parse(localStorage.getItem('contractor_profile') || '{}');
                setFormData(prev => ({
                    ...prev,
                    contractorName: profile.firstName || profile.name || 'Contractor',
                    phoneNumber: profile.phoneNumber || profile.mobile || profile.phone || '',
                    city: profile.city || '',
                    address: profile.address || ''
                }));

                // Fetch dynamic skills
                setSkillsLoading(true);
                const response = await categoryAPI.getAll();
                if (response.data.success && response.data.data.categories) {
                    // Flatten all sub-categories into a single list of skill names
                    const flattenedSkills = response.data.data.categories.flatMap(cat =>
                        cat.subCategories && cat.subCategories.length > 0
                            ? cat.subCategories.map(sub => sub.name)
                            : [cat.name]
                    );
                    // Remove duplicates and sort
                    const uniqueSkills = [...new Set(flattenedSkills)].sort();
                    setSkillsList(uniqueSkills);
                }
            } catch (error) {
                console.error('Error fetching initial data:', error);
                // Fallback to basic skills if API fails
                setSkillsList(['Construction', 'Interior', 'Painting', 'Plumbing', 'Electrical', 'Other']);
            } finally {
                setSkillsLoading(false);
            }
        };

        fetchInitialData();
    }, []);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Validation
        if (!formData.city || !formData.address || !formData.businessType || !formData.labourSkill || !formData.experience) {
            alert('Please fill all required fields');
            return;
        }

        if (!formData.workDuration) {
            alert('Please fill work information fields');
            return;
        }

        if (formData.budgetType === 'Fixed Amount' && !formData.budgetAmount) {
            alert('Please enter budget amount');
            return;
        }

        if (!formData.rating || formData.rating === 0) {
            alert('Please select a rating');
            return;
        }

        try {
            const token = localStorage.getItem('access_token');

            if (token) {
                // Save to database with targetAudience: 'Labour'
                const jobData = {
                    ...formData,
                    targetAudience: 'Labour' // This card is for Labour only
                };

                console.log('Creating contractor job for Labour:', jobData);
                const response = await contractorAPI.createContractorJob(jobData);

                if (response.success) {
                    console.log('Contractor job created:', response);
                    alert('Job posted successfully!');
                    navigate('/contractor/my-projects');
                } else {
                    throw new Error(response.message || 'Failed to create job');
                }
            } else {
                // Fallback to localStorage
                const newCard = {
                    id: Date.now(),
                    contractorName: formData.contractorName,
                    phoneNumber: formData.phoneNumber,
                    contactNo: formData.phoneNumber,
                    city: formData.city,
                    address: formData.address,
                    businessType: formData.businessType,
                    businessName: formData.businessName,
                    labourSkill: formData.labourSkill,
                    primaryWorkCategory: formData.labourSkill,
                    experience: formData.experience,
                    workDuration: formData.workDuration,
                    budgetType: formData.budgetType,
                    budgetAmount: formData.budgetAmount,
                    rating: formData.rating,
                    profileStatus: formData.profileStatus,
                    availabilityStatus: 'Available',
                    createdAt: new Date().toISOString()
                };

                const existingCards = JSON.parse(localStorage.getItem('contractor_cards_for_labour') || '[]');
                existingCards.push(newCard);
                localStorage.setItem('contractor_cards_for_labour', JSON.stringify(existingCards));

                alert('Job posted successfully!');
                navigate('/contractor/my-projects');
            }
        } catch (error) {
            console.error('Error creating contractor job:', error);
            alert(error.message || 'Failed to post job. Please try again.');
        }
    };

    return (
        <div className="min-h-screen bg-gray-50">
            <ContractorPageHeader title="Create Contractor Card" backPath="/contractor/hire-workers" />

            <div className="p-4 pb-20">
                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Contractor Information */}
                    <div className="bg-white rounded-lg shadow-sm p-4">
                        <h2 className="text-lg font-semibold text-gray-900 mb-4">Contractor Information</h2>

                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Contractor Name *
                            </label>
                            <input
                                type="text"
                                name="contractorName"
                                value={formData.contractorName}
                                onChange={handleChange}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
                                placeholder="Company or Individual Name"
                                required
                            />
                        </div>

                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Phone Number *
                            </label>
                            <input
                                type="tel"
                                name="phoneNumber"
                                value={formData.phoneNumber}
                                onChange={handleChange}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
                                placeholder="Enter phone number"
                                maxLength={10}
                                pattern="[0-9]{10}"
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
                                placeholder="Enter full address"
                                rows={3}
                                required
                            />
                        </div>
                    </div>

                    {/* Business Details */}
                    <div className="bg-white rounded-lg shadow-sm p-4">
                        <h2 className="text-lg font-semibold text-gray-900 mb-4">Business Details</h2>

                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Business Type *
                            </label>
                            <select
                                name="businessType"
                                value={formData.businessType}
                                onChange={handleChange}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
                                required
                            >
                                <option value="">Select Business Type</option>
                                <option value="Individual Contractor">Individual Contractor</option>
                                <option value="Business">Business</option>
                            </select>
                        </div>

                        {formData.businessType === 'Business' && (
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Business Name
                                </label>
                                <input
                                    type="text"
                                    name="businessName"
                                    value={formData.businessName}
                                    onChange={handleChange}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
                                    placeholder="Enter business name"
                                />
                            </div>
                        )}

                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Labour Skill *
                            </label>
                            <select
                                name="labourSkill"
                                value={formData.labourSkill}
                                onChange={handleChange}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
                                required
                            >
                                <option value="">{skillsLoading ? 'Loading Skills...' : 'Select Skill'}</option>
                                {skillsList.map(skill => (
                                    <option key={skill} value={skill}>{skill}</option>
                                ))}
                            </select>
                        </div>

                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Experience Required (Years) *
                            </label>
                            <input
                                type="text"
                                name="experience"
                                value={formData.experience}
                                onChange={handleChange}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
                                placeholder="e.g., 3 Years, 10+ Years"
                                required
                            />
                        </div>
                    </div>

                    {/* Work Information */}
                    <div className="bg-white rounded-lg shadow-sm p-4">
                        <h2 className="text-lg font-semibold text-gray-900 mb-4">Work Information</h2>

                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Work Duration / Type *
                            </label>
                            <select
                                name="workDuration"
                                value={formData.workDuration}
                                onChange={handleChange}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
                                required
                            >
                                <option value="">Select Duration</option>
                                <option value="One Day">One Day</option>
                                <option value="Multiple Days">Multiple Days</option>
                                <option value="Contract">Contract</option>
                            </select>
                        </div>
                    </div>

                    {/* Budget */}
                    <div className="bg-white rounded-lg shadow-sm p-4">
                        <h2 className="text-lg font-semibold text-gray-900 mb-4">Budget</h2>

                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Budget Type *
                            </label>
                            <div className="flex gap-4">
                                <label className="flex items-center">
                                    <input
                                        type="radio"
                                        name="budgetType"
                                        value="Fixed Amount"
                                        checked={formData.budgetType === 'Fixed Amount'}
                                        onChange={handleChange}
                                        className="mr-2"
                                    />
                                    <span className="text-sm text-gray-700">Fixed Amount</span>
                                </label>
                                <label className="flex items-center">
                                    <input
                                        type="radio"
                                        name="budgetType"
                                        value="Negotiable"
                                        checked={formData.budgetType === 'Negotiable'}
                                        onChange={handleChange}
                                        className="mr-2"
                                    />
                                    <span className="text-sm text-gray-700">Negotiable</span>
                                </label>
                            </div>
                        </div>

                        {formData.budgetType === 'Fixed Amount' && (
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Budget Amount (₹) *
                                </label>
                                <input
                                    type="number"
                                    name="budgetAmount"
                                    value={formData.budgetAmount}
                                    onChange={handleChange}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
                                    placeholder="Enter amount"
                                    required
                                />
                            </div>
                        )}
                    </div>

                    {/* Rating Section */}
                    <div className="mb-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Rating</h3>
                        <div className="flex justify-center gap-2 mb-2">
                            {[1, 2, 3, 4, 5].map((star) => (
                                <button
                                    key={star}
                                    type="button"
                                    onClick={() => setFormData(prev => ({ ...prev, rating: star }))}
                                    className="transition-transform hover:scale-110"
                                >
                                    <span className={`text-4xl ${star <= formData.rating
                                            ? 'text-yellow-400'
                                            : 'text-gray-300'
                                        }`}>
                                        ★
                                    </span>
                                </button>
                            ))}
                        </div>
                        <p className="text-center text-sm text-gray-600">
                            {formData.rating > 0 ? `${formData.rating}.0 / 5` : 'Tap stars to rate'}
                        </p>
                    </div>

                    {/* Submit Button */}
                    <button
                        type="submit"
                        className="w-full bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-bold py-3 rounded-lg shadow-md transition-all active:scale-95"
                    >
                        Create Card
                    </button>
                </form>
            </div>
        </div>
    );
};

export default PostJob;
