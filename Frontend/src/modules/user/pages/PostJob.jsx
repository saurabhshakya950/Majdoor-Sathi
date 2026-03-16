import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import PageHeader from '../components/PageHeader';
import FormInput from '../components/FormInput';
import FormSelect from '../components/FormSelect';
import FormTextarea from '../components/FormTextarea';
import { jobAPI, categoryAPI } from '../../../services/api';

const PostJob = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [categoriesLoading, setCategoriesLoading] = useState(true);
    const [categoriesList, setCategoriesList] = useState([]);

    const [formData, setFormData] = useState({
        userName: '',
        city: '',
        address: '',
        mobileNumber: '',
        jobTitle: '',
        jobDescription: '',
        category: '',
        workDuration: '',
        budgetType: 'Fixed Amount',
        budgetAmount: '',
        status: 'Open'
    });

    // Auto-fill user information and fetch dynamic categories
    useEffect(() => {
        const fetchInitialData = async () => {
            try {
                // Load profile
                const profile = JSON.parse(localStorage.getItem('user_profile') || '{}');
                setFormData(prev => ({
                    ...prev,
                    userName: profile.firstName || 'User',
                    city: profile.city || '',
                    address: profile.address || '',
                    mobileNumber: profile.phoneNumber || profile.mobile || ''
                }));

                // Fetch dynamic categories
                setCategoriesLoading(true);
                const response = await categoryAPI.getAll();
                if (response.data.success && response.data.data.categories) {
                    // Flatten all sub-categories into a single list
                    const flattened = response.data.data.categories.flatMap(cat =>
                        cat.subCategories && cat.subCategories.length > 0
                            ? cat.subCategories.map(sub => ({ value: sub.name, label: sub.name }))
                            : [{ value: cat.name, label: cat.name }]
                    );

                    // Add default option
                    setCategoriesList([
                        { value: '', label: 'Select Category' },
                        ...flattened.sort((a, b) => a.label.localeCompare(b.label))
                    ]);
                }
            } catch (error) {
                console.error('Error fetching initial data:', error);
                // Fallback to basic categories if API fails
                setCategoriesList([
                    { value: '', label: 'Select Category' },
                    { value: 'Painter', label: 'Painter' },
                    { value: 'Plumber', label: 'Plumber' },
                    { value: 'Electrician', label: 'Electrician' },
                    { value: 'Carpenter', label: 'Carpenter' },
                    { value: 'Mason', label: 'Mason' },
                    { value: 'Welder', label: 'Welder' }
                ]);
            } finally {
                setCategoriesLoading(false);
            }
        };

        fetchInitialData();
    }, []);

    const workDurations = [
        { value: '', label: 'Select Duration' },
        { value: 'One Day', label: 'One Day' },
        { value: 'Multiple Days', label: 'Multiple Days' },
        { value: 'Contract', label: 'Contract' }
    ];

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Basic Validation
        if (!formData.address || !formData.mobileNumber || !formData.jobTitle || !formData.jobDescription || !formData.category || !formData.workDuration) {
            toast.error('Please fill all required fields');
            return;
        }

        if (formData.budgetType === 'Fixed Amount' && !formData.budgetAmount) {
            toast.error('Please enter budget amount');
            return;
        }

        setLoading(true);
        try {
            const token = localStorage.getItem('access_token');
            
            if (token) {
                // Save to database
                const response = await jobAPI.createJob(formData);
                if (response.success) {
                    toast.success('Job posted successfully!');
                    navigate('/user/my-projects');
                } else {
                    throw new Error(response.message || 'Failed to post job');
                }
            } else {
                // Fallback to localStorage if no token (offline/guest mode)
                const existingJobs = JSON.parse(localStorage.getItem('user_posted_jobs') || '[]');
                const newJob = {
                    ...formData,
                    id: Date.now(),
                    createdAt: new Date().toISOString()
                };
                existingJobs.push(newJob);
                localStorage.setItem('user_posted_jobs', JSON.stringify(existingJobs));
                
                toast.success('Job saved locally!');
                navigate('/user/my-projects');
            }
        } catch (error) {
            console.error('Error posting job:', error);
            toast.error(error.message || 'Failed to post job. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-gray-50 flex flex-col overflow-hidden" style={{ height: '100dvh', minHeight: '-webkit-fill-available' }}>
            <PageHeader title="Post a Job" backPath="/user/hire-workers" />

            <div className="flex-1 overflow-y-auto">
                <div className="p-4 pb-20">
                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* User Information */}
                    <div className="bg-white rounded-lg shadow-sm p-4">
                        <h2 className="text-lg font-semibold text-gray-900 mb-4">User Information</h2>

                        <FormInput
                            label="User Name"
                            name="userName"
                            value={formData.userName}
                            onChange={handleChange}
                            disabled
                        />

                        <FormInput
                            label="City / Location"
                            name="city"
                            value={formData.city}
                            onChange={handleChange}
                            placeholder="Enter your city"
                        />

                        <FormInput
                            label="Address *"
                            name="address"
                            value={formData.address}
                            onChange={handleChange}
                            placeholder="Enter your address"
                            required
                        />

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
                                pattern="[0-9]{10}"
                                required
                            />
                        </div>
                    </div>

                    {/* Job Details */}
                    <div className="bg-white rounded-lg shadow-sm p-4">
                        <h2 className="text-lg font-semibold text-gray-900 mb-4">Job Details</h2>

                        <FormInput
                            label="Job Title *"
                            name="jobTitle"
                            value={formData.jobTitle}
                            onChange={handleChange}
                            placeholder="e.g., Need Painter for 2BHK Flat"
                            required
                        />

                        <FormTextarea
                            label="Job Description *"
                            name="jobDescription"
                            value={formData.jobDescription}
                            onChange={handleChange}
                            placeholder="e.g., Interior wall painting work"
                            rows={4}
                            required
                        />
                    </div>

                    {/* Work Information */}
                    <div className="bg-white rounded-lg shadow-sm p-4">
                        <h2 className="text-lg font-semibold text-gray-900 mb-4">Work Information</h2>

                        <FormSelect
                            label={categoriesLoading ? "Category / Skill (Loading...)" : "Category / Skill *"}
                            name="category"
                            value={formData.category}
                            onChange={handleChange}
                            options={categoriesList}
                            required
                        />

                        <FormSelect
                            label="Work Duration / Type *"
                            name="workDuration"
                            value={formData.workDuration}
                            onChange={handleChange}
                            options={workDurations}
                            required
                        />
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
                            <FormInput
                                label="Budget Amount (₹)"
                                name="budgetAmount"
                                type="number"
                                value={formData.budgetAmount}
                                onChange={handleChange}
                                placeholder="Enter amount"
                                required
                            />
                        )}
                    </div>

                    {/* Submit Button */}
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-bold py-3 rounded-lg shadow-md transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? 'Posting Job...' : 'Post Job'}
                    </button>
                </form>
            </div>
        </div>
    </div>
    );
};

export default PostJob;
