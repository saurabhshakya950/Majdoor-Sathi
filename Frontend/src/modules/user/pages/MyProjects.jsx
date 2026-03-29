import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, X } from 'lucide-react';
import toast from 'react-hot-toast';
import PageHeader from '../components/PageHeader';
import JobCard from '../components/JobCard';
import EmptyState from '../components/EmptyState';
import { jobAPI } from '../../../services/api';

const MyProjects = () => {
    const navigate = useNavigate();
    const [jobs, setJobs] = useState([]);
    const [selectedJob, setSelectedJob] = useState(null);
    const [loading, setLoading] = useState(true);

    // Load jobs from database
    useEffect(() => {
        fetchJobs();
    }, []);

    const fetchJobs = async () => {
        try {
            setLoading(true);

            // Always fetch from API - no localStorage
            const response = await jobAPI.getUserJobs();

            if (response.success && response.data.jobs) {
                // Transform API data to match component expectations
                const transformedJobs = response.data.jobs.map(job => ({
                    id: job._id,
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

                setJobs(transformedJobs);
            } else {
                setJobs([]);
            }
        } catch (error) {
            console.error('Failed to fetch jobs:', error);
            toast.error('Failed to load jobs');
            setJobs([]);
        } finally {
            setLoading(false);
        }
    };

    const handleViewDetails = (job) => {
        setSelectedJob(job);
    };

    const handleToggleJobStatus = async (jobId) => {
        const job = jobs.find(j => j.id === jobId);
        if (!job) return;

        const newStatus = job.status === 'Open' ? 'Closed' : 'Open';

        // Check if user has access token
        const token = localStorage.getItem('access_token');

        if (!token) {
            // No token - update localStorage
            console.log('No access token found, updating localStorage');
            const updatedJobs = jobs.map(j =>
                j.id === jobId ? { ...j, status: newStatus } : j
            );
            setJobs(updatedJobs);
            localStorage.setItem('user_jobs', JSON.stringify(updatedJobs));

            toast.success(`Job ${newStatus === 'Open' ? 'opened' : 'closed'} successfully`, {
                duration: 2000,
                position: 'top-center',
            });
            return;
        }

        // Has token - update via API
        try {
            const response = await jobAPI.updateJob(jobId, { status: newStatus });

            if (response.success) {
                // Update local state
                const updatedJobs = jobs.map(j =>
                    j.id === jobId ? { ...j, status: newStatus } : j
                );
                setJobs(updatedJobs);

                toast.success(`Job ${newStatus === 'Open' ? 'opened' : 'closed'} successfully`, {
                    duration: 2000,
                    position: 'top-center',
                });
            }
        } catch (error) {
            console.error('Failed to update job status:', error);
            toast.error('Failed to update job status', {
                duration: 3000,
                position: 'top-center',
            });
        }
    };

    const handleDeleteJob = async (jobId) => {
        // Confirmation Toast
        toast((t) => (
            <div className="flex flex-col gap-3 p-1">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                        <X className="w-5 h-5 text-red-500" />
                    </div>
                    <p className="font-semibold text-gray-800">Delete this project?</p>
                </div>
                <p className="text-sm text-gray-600 px-1">This action cannot be undone and will remove the job for everyone.</p>
                <div className="flex gap-3 mt-1">
                    <button
                        onClick={async () => {
                            toast.dismiss(t.id);
                            try {
                                const response = await jobAPI.deleteJob(jobId);
                                if (response.success) {
                                    setJobs(prev => prev.filter(j => j.id !== jobId));
                                    toast.success('Job deleted permanently', {
                                        icon: '🗑️',
                                        style: { borderRadius: '10px', background: '#333', color: '#fff' }
                                    });
                                }
                            } catch (error) {
                                console.error('Delete error:', error);
                                toast.error('Failed to delete job');
                            }
                        }}
                        className="flex-1 bg-red-500 hover:bg-red-600 text-white font-bold py-2 rounded-lg text-sm transition-all active:scale-95"
                    >
                        Delete
                    </button>
                    <button
                        onClick={() => toast.dismiss(t.id)}
                        className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-2 rounded-lg text-sm transition-all active:scale-95"
                    >
                        Cancel
                    </button>
                </div>
            </div>
        ), {
            duration: 6000,
            position: 'top-center',
            style: {
                borderRadius: '16px',
                padding: '12px',
                minWidth: '280px',
                border: '1px solid #fee2e2'
            }
        });
    };

    const handleCloseModal = () => {
        setSelectedJob(null);
    };

    const handlePostJob = () => {
        navigate('/user/post-job');
    };

    return (
        <div className="bg-gray-50 flex flex-col overflow-hidden" style={{ height: '100dvh', minHeight: '-webkit-fill-available' }}>
            <PageHeader
                title="My Projects"
                backPath="/user/settings"
                rightButton={jobs.length > 0 && (
                    <button
                        onClick={handlePostJob}
                        className="bg-yellow-400 hover:bg-yellow-500 p-2 rounded-full shadow-md transition-all active:scale-95"
                    >
                        <Plus className="w-5 h-5 text-gray-900" />
                    </button>
                )}
            />

            <div className="flex-1 overflow-y-auto">
                <div className="p-4 pb-12">
                    {loading ? (
                        <div className="flex items-center justify-center min-h-[60vh]">
                            <p className="text-gray-600">Loading jobs...</p>
                        </div>
                    ) : jobs.length === 0 ? (
                        <div className="flex flex-col items-center justify-center min-h-[60vh]">
                            <button
                                onClick={handlePostJob}
                                className="w-32 h-32 bg-yellow-100 rounded-full flex items-center justify-center mb-6 hover:bg-yellow-200 transition-all active:scale-95"
                            >
                                <Plus className="w-16 h-16 text-yellow-600" />
                            </button>
                            <h3 className="text-xl font-bold text-gray-900 mb-2">No jobs posted yet</h3>
                            <p className="text-gray-500 text-center">Post your first job to see it here</p>
                        </div>
                    ) : (
                        jobs.map((job, index) => (
                            <JobCard
                                key={job.id}
                                job={job}
                                index={index}
                                onViewDetails={handleViewDetails}
                                onToggleJobStatus={handleToggleJobStatus}
                                onDelete={handleDeleteJob}
                            />
                        ))
                    )}
                </div>
            </div>

            {/* Job Details Modal */}
            {selectedJob && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg max-w-md w-full max-h-[80vh] overflow-y-auto">
                        <div className="sticky top-0 bg-white border-b p-4 flex justify-between items-center">
                            <h2 className="text-xl font-bold text-gray-900">Job Details</h2>
                            <button
                                onClick={handleCloseModal}
                                className="p-1 hover:bg-gray-100 rounded-full transition-colors"
                            >
                                <X className="w-6 h-6 text-gray-500" />
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
                                <label className="text-sm font-medium text-gray-500">Address</label>
                                <p className="text-gray-900">{selectedJob.address}</p>
                            </div>

                            <div>
                                <label className="text-sm font-medium text-gray-500">Mobile Number</label>
                                <p className="text-gray-900 font-medium">{selectedJob.mobileNumber}</p>
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
        </div>
    );
};

export default MyProjects;
