import { useEffect, useState } from 'react';
import { Search, SlidersHorizontal, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import LabourBottomNav from '../components/LabourBottomNav';
import LabourJobCard from '../components/LabourJobCard';
import LabourHeader from '../components/LabourHeader';
import PromotionalBanner from '../../../components/shared/PromotionalBanner';
import { jobAPI } from '../../../services/api';

const FindUser = () => {
    const navigate = useNavigate();
    const [jobs, setJobs] = useState([]);
    const [filteredJobs, setFilteredJobs] = useState([]);
    const [selectedJob, setSelectedJob] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [showFilterModal, setShowFilterModal] = useState(false);
    const [selectedCity, setSelectedCity] = useState('');
    const [appliedJobs, setAppliedJobs] = useState({});
    const [loading, setLoading] = useState(true);

    const cities = ['Indore', 'Bhopal', 'Dewas', 'Ujjain', 'Jabalpur', 'Gwalior', 'Ratlam'];

    useEffect(() => {
        fetchJobs();
        loadApplicationStatuses();

        // Auto-refresh every 5 seconds
        const interval = setInterval(() => {
            if (!document.hidden) {
                console.log('🔄 Auto-refreshing labour application statuses...');
                loadApplicationStatuses();
            }
        }, 5000);

        // Listen for application updates
        const handleApplicationUpdate = () => {
            console.log('📢 Labour application update event received');
            loadApplicationStatuses();
        };

        window.addEventListener('labour-application-updated', handleApplicationUpdate);

        return () => {
            clearInterval(interval);
            window.removeEventListener('labour-application-updated', handleApplicationUpdate);
        };
    }, []);

    const loadApplicationStatuses = async () => {
        try {
            const response = await jobAPI.getMyApplications();

            if (response.success) {
                console.log('✅ Loaded labour application statuses:', response.data.applications);
                setAppliedJobs(response.data.applications);
            }
        } catch (error) {
            console.error('Failed to load labour application statuses:', error);
            // Fallback to localStorage
            const labourAppliedJobs = JSON.parse(localStorage.getItem('labour_applied_jobs') || '[]');
            const statusMap = {};
            labourAppliedJobs.forEach(jobId => {
                statusMap[jobId] = { status: 'Pending' };
            });
            setAppliedJobs(statusMap);
        }
    };

    const fetchJobs = async (isSilent = false) => {
        try {
            if (!isSilent) setLoading(true);

            // Try to fetch from database first
            try {
                const response = await jobAPI.browseJobs({ status: 'Open' });

                if (response.success && response.data.jobs) {
                    // Transform API data to match component expectations
                    const transformedJobs = response.data.jobs.map(job => ({
                        id: job._id,
                        userId: job.user, // Add the user ID who posted the job
                        userName: job.userName,
                        city: job.city,
                        address: job.address,
                        mobileNumber: job.mobileNumber,
                        jobTitle: job.jobTitle,
                        jobDescription: job.jobDescription,
                        category: job.category,
                        workDuration: job.workDuration,
                        budgetType: job.budgetType,
                        budgetAmount: job.budgetAmount,
                        status: job.status,
                        createdAt: job.createdAt
                    }));

                    // Also load from localStorage and merge
                    const localJobs = JSON.parse(localStorage.getItem('user_jobs') || '[]');
                    const allJobs = [...transformedJobs, ...localJobs];

                    // Remove duplicates based on id
                    const uniqueJobs = allJobs.filter((job, index, self) =>
                        index === self.findIndex((j) => j.id === job.id)
                    );

                    setJobs(uniqueJobs);
                    setFilteredJobs(uniqueJobs);
                    return;
                }
            } catch (apiError) {
                console.log('API fetch failed, loading from localStorage:', apiError.message);
            }

            // Fallback to localStorage if API fails
            const localJobs = JSON.parse(localStorage.getItem('user_jobs') || '[]');
            setJobs(localJobs);
            setFilteredJobs(localJobs);

        } catch (error) {
            console.error('Failed to fetch jobs:', error);
            toast.error('Failed to load jobs', {
                duration: 3000,
                position: 'top-center',
            });
        } finally {
            if (!isSilent) setLoading(false);
        }
    };

    // Filter jobs based on selected city and search query
    useEffect(() => {
        let filtered = jobs;

        // Filter by city
        if (selectedCity) {
            filtered = filtered.filter(job =>
                job.city.toLowerCase() === selectedCity.toLowerCase()
            );
        }

        // Filter by search query
        if (searchQuery.trim()) {
            filtered = filtered.filter(job =>
                job.userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                job.jobTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
                job.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
                job.category.toLowerCase().includes(searchQuery.toLowerCase())
            );
        }

        setFilteredJobs(filtered);
    }, [selectedCity, searchQuery, jobs]);

    const handleViewDetails = (job) => {
        setSelectedJob(job);
    };

    const handleApplyNow = async (jobId) => {
        try {
            console.log('🔵 Applying to job:', jobId);

            // Fetch fresh profile from database
            const token = localStorage.getItem('access_token');
            if (!token) {
                toast.error('Please login first');
                navigate('/mobile-input');
                return;
            }

            // Get labour profile from database
            const profileResponse = await fetch(`${import.meta.env.VITE_API_URL || `${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}`}/labour/profile`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            const profileData = await profileResponse.json();

            if (!profileData.success || !profileData.data.labour) {
                toast.error('Please complete your profile first', {
                    duration: 3000,
                    position: 'top-center',
                });
                navigate('/labour/details');
                return;
            }

            const labour = profileData.data.labour;
            const user = profileData.data.user;

            // Check if profile is complete
            const firstName = labour.firstName || user?.firstName;
            const lastName = labour.lastName || user?.lastName;
            const city = labour.city || user?.city;
            const mobileNumber = user?.mobileNumber || localStorage.getItem('mobile_number');

            if (!firstName || !lastName) {
                toast.error('Please complete your profile first', {
                    duration: 3000,
                    position: 'top-center',
                });
                navigate('/labour/details');
                return;
            }

            console.log('✅ Profile verified:', { firstName, lastName, city });

            // Find the job
            const job = jobs.find(j => j.id === jobId);
            if (!job) {
                toast.error('Job not found');
                return;
            }

            // Submit application to database
            const response = await jobAPI.applyToJob(jobId, {
                applicantType: 'Labour',
                applicantName: `${firstName} ${lastName}`,
                phoneNumber: mobileNumber || 'Not specified',
                location: city || 'Not specified',
                message: `I am interested in this ${job.category} job.`
            });

            if (response.success) {
                // Update applied jobs state with pending status
                const updatedAppliedJobs = {
                    ...appliedJobs,
                    [jobId]: { status: 'Pending', jobId: jobId }
                };
                setAppliedJobs(updatedAppliedJobs);

                toast.success('Application sent successfully!', {
                    duration: 3000,
                    position: 'top-center',
                });

                // Reload statuses to get the latest
                loadApplicationStatuses();
            }
        } catch (error) {
            console.error('Failed to apply:', error);
            const errorMessage = error.response?.data?.message || 'Failed to send application';
            toast.error(errorMessage, {
                duration: 3000,
                position: 'top-center',
            });
        }
    };

    const handleCloseModal = () => {
        setSelectedJob(null);
    };

    const handleOpenFilter = () => {
        setShowFilterModal(true);
    };

    const handleCloseFilter = () => {
        setShowFilterModal(false);
    };

    const handleCitySelect = (city) => {
        setSelectedCity(city);
        setShowFilterModal(false);
    };

    const handleClearFilter = () => {
        setSelectedCity('');
        setShowFilterModal(false);
    };

    return (
        <div className="h-screen bg-gray-50 flex flex-col overflow-hidden">
            {/* Sticky Header and Search Bar */}
            <div className="sticky top-0 z-10 bg-white">
                <LabourHeader />

                {/* Search Bar */}
                <div className="px-4 py-3 shadow-sm">
                    <div className="flex items-center gap-3">
                        <div className="flex-1 flex items-center bg-gray-100 rounded-lg px-4 py-2">
                            <Search className="w-5 h-5 text-gray-400 mr-2" />
                            <input
                                type="text"
                                placeholder="Search jobs..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="flex-1 bg-transparent outline-none text-gray-700 placeholder-gray-400"
                            />
                        </div>
                        <button
                            onClick={handleOpenFilter}
                            className={`p-2 rounded-lg relative ${selectedCity ? 'bg-blue-500' : 'bg-gray-100'}`}
                        >
                            <SlidersHorizontal className={`w-5 h-5 ${selectedCity ? 'text-white' : 'text-gray-600'}`} />
                            {selectedCity && (
                                <span className="absolute -top-1 -right-1 bg-red-500 w-3 h-3 rounded-full"></span>
                            )}
                        </button>
                    </div>
                    {/* Active Filter Badge */}
                    {selectedCity && (
                        <div className="mt-2 flex items-center gap-2">
                            <span className="text-xs text-gray-600">Filtered by:</span>
                            <div className="inline-flex items-center gap-1 bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm">
                                <span>{selectedCity}</span>
                                <button onClick={handleClearFilter} className="hover:bg-blue-200 rounded-full p-0.5">
                                    <X className="w-3 h-3" />
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Main Content Area - Scrollable */}
            <div className="flex-1 overflow-y-auto pb-24">
                <div className="p-4">
                    {/* Promotional Banners */}
                    <PromotionalBanner />

                    <h2 className="text-xl font-bold text-gray-900 mb-4">
                        Available Jobs
                        {selectedCity && <span className="text-sm font-normal text-gray-600"> in {selectedCity}</span>}
                        <span className="text-sm font-normal text-gray-600"> ({filteredJobs.length})</span>
                    </h2>

                    {loading ? (
                        <div className="bg-white rounded-lg shadow-sm p-6 text-center">
                            <p className="text-gray-600">Loading jobs...</p>
                        </div>
                    ) : filteredJobs.length === 0 ? (
                        <div className="bg-white rounded-lg shadow-sm p-6 text-center">
                            <p className="text-gray-600">
                                {selectedCity || searchQuery
                                    ? 'No jobs found matching your criteria'
                                    : 'No jobs available at the moment'}
                            </p>
                            {(selectedCity || searchQuery) && (
                                <button
                                    onClick={() => {
                                        setSelectedCity('');
                                        setSearchQuery('');
                                    }}
                                    className="mt-3 text-blue-500 hover:text-blue-600 font-medium"
                                >
                                    Clear filters
                                </button>
                            )}
                        </div>
                    ) : (
                        filteredJobs.map((job, index) => (
                            <LabourJobCard
                                key={job.id}
                                job={job}
                                index={index}
                                appliedJobs={appliedJobs}
                                onViewDetails={handleViewDetails}
                                onApplyNow={handleApplyNow}
                            />
                        ))
                    )}
                </div>

                {/* Job Details Modal */}
                {selectedJob && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-lg max-w-md w-full max-h-[80vh] overflow-y-auto">
                            <div className="sticky top-0 bg-white border-b p-4 flex justify-between items-center">
                                <h2 className="text-xl font-bold text-gray-900">Job Details</h2>
                                <button
                                    onClick={handleCloseModal}
                                    className="text-gray-500 hover:text-gray-700 text-2xl"
                                >
                                    ×
                                </button>
                            </div>

                            <div className="p-4 space-y-4">
                                <div>
                                    <label className="text-sm font-medium text-gray-500">User Name</label>
                                    <p className="text-gray-900 font-medium">{selectedJob.userName}</p>
                                </div>

                                <div>
                                    <label className="text-sm font-medium text-gray-500">City / Location</label>
                                    <p className="text-gray-900 font-medium">{selectedJob.city}</p>
                                </div>

                                <div>
                                    <label className="text-sm font-medium text-gray-500">Job Title</label>
                                    <p className="text-gray-900 font-medium">{selectedJob.jobTitle}</p>
                                </div>

                                <div>
                                    <label className="text-sm font-medium text-gray-500">Job Description</label>
                                    <p className="text-gray-900">{selectedJob.jobDescription}</p>
                                </div>

                                <div>
                                    <label className="text-sm font-medium text-gray-500">Category</label>
                                    <p className="text-gray-900 font-medium">{selectedJob.category}</p>
                                </div>

                                <div>
                                    <label className="text-sm font-medium text-gray-500">Work Duration</label>
                                    <p className="text-gray-900 font-medium">{selectedJob.workDuration}</p>
                                </div>

                                <div>
                                    <label className="text-sm font-medium text-gray-500">Budget</label>
                                    <p className="text-gray-900 font-medium">
                                        {selectedJob.budgetType === 'Negotiable'
                                            ? 'Negotiable'
                                            : `₹${selectedJob.budgetAmount}`}
                                    </p>
                                </div>

                                <div>
                                    <label className="text-sm font-medium text-gray-500">Status</label>
                                    <p className={`font-medium ${selectedJob.status === 'Open'
                                        ? 'text-green-600'
                                        : 'text-gray-600'
                                        }`}>
                                        {selectedJob.status}
                                    </p>
                                </div>
                            </div>

                            <div className="sticky bottom-0 bg-white border-t p-4">
                                <button
                                    onClick={handleCloseModal}
                                    className="w-full bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-bold py-3 rounded-lg transition-all active:scale-95"
                                >
                                    Close
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Filter Modal */}
                {showFilterModal && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end justify-center z-50">
                        <div className="bg-white rounded-t-3xl w-full max-w-md animate-slide-up">
                            {/* Header */}
                            <div className="flex items-center justify-between p-6 border-b">
                                <h2 className="text-2xl font-bold text-gray-900">Filter by City</h2>
                                <button
                                    onClick={handleCloseFilter}
                                    className="p-1 hover:bg-gray-100 rounded-full transition-colors"
                                >
                                    <X className="w-6 h-6 text-gray-500" />
                                </button>
                            </div>

                            {/* Content */}
                            <div className="p-6 max-h-[60vh] overflow-y-auto">
                                <div className="space-y-2">
                                    {/* All Cities Option */}
                                    <button
                                        onClick={handleClearFilter}
                                        className={`w-full text-left px-4 py-3 rounded-lg transition-all ${!selectedCity
                                            ? 'bg-blue-500 text-white font-medium'
                                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                            }`}
                                    >
                                        All Cities
                                    </button>

                                    {/* City Options */}
                                    {cities.map((city) => (
                                        <button
                                            key={city}
                                            onClick={() => handleCitySelect(city)}
                                            className={`w-full text-left px-4 py-3 rounded-lg transition-all ${selectedCity === city
                                                ? 'bg-blue-500 text-white font-medium'
                                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                                }`}
                                        >
                                            {city}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Footer */}
                            <div className="p-6 border-t">
                                <button
                                    onClick={handleCloseFilter}
                                    className="w-full bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-bold py-3 rounded-lg transition-all active:scale-95"
                                >
                                    Apply Filter
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Bottom Navigation */}
            <LabourBottomNav />
        </div>
    );
};

export default FindUser;
