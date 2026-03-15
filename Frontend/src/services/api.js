import axios from 'axios';

// API Base URL
const API_BASE_URL = import.meta.env.VITE_API_URL || `${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}`;

// Create axios instance
const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json'
    }
});

// Public API for categories (no auth required)
export const categoryAPI = {
    getAll: () => axios.get(`${API_BASE_URL}/categories`)
};

// Public CMS API (no auth required)
export const cmsAPI = {
    getAboutUs: () => axios.get(`${API_BASE_URL}/admin/cms/aboutUs`),
    getContactUs: () => axios.get(`${API_BASE_URL}/admin/cms/contactUs`),
    getTerms: () => axios.get(`${API_BASE_URL}/admin/cms/terms`),
    getPrivacy: () => axios.get(`${API_BASE_URL}/admin/cms/privacy`)
};

// Public API for broadcasts (no auth required)
export const broadcastAPI = {
    getActiveBroadcasts: (targetAudience) => axios.get(`${API_BASE_URL}/admin/broadcasts/active`, {
        params: { targetAudience }
    })
};

// Public API for banners (no auth required)
export const bannerAPI = {
    getActiveBanners: (targetAudience) => axios.get(`${API_BASE_URL}/banners/active`, {
        params: { targetAudience }
    })
};

// Add token to requests
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('access_token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Handle token refresh on 401
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;

            try {
                const refreshToken = localStorage.getItem('refresh_token');
                const response = await axios.post(`${API_BASE_URL}/auth/refresh-token`, {
                    refreshToken
                });

                const { accessToken } = response.data.data;
                localStorage.setItem('access_token', accessToken);

                originalRequest.headers.Authorization = `Bearer ${accessToken}`;
                return api(originalRequest);
            } catch (err) {
                // Refresh failed, logout user
                localStorage.clear();
                window.location.href = '/';
                return Promise.reject(err);
            }
        }

        return Promise.reject(error);
    }
);

// Auth APIs
export const authAPI = {
    // Login with mobile number
    login: async (mobileNumber) => {
        const response = await api.post('/auth/login', { mobileNumber });
        return response.data;
    },

    // Register/Complete Profile
    register: async (userData) => {
        const response = await api.post('/auth/register', userData);
        return response.data;
    },

    // Logout
    logout: async () => {
        try {
            const token = localStorage.getItem('access_token');
            if (token) {
                await api.post('/auth/logout');
            }
        } catch (error) {
            console.error('Logout API error:', error);
            // Continue with logout even if API fails
        } finally {
            // Clear all localStorage data
            localStorage.clear();
            // Use window.location for complete page reload and URL change
            window.location.href = '/get-started';
        }
    }
};

// User APIs
export const userAPI = {
    // Get user profile
    getProfile: async () => {
        const response = await api.get('/users/profile');
        return response.data;
    },

    // Update user profile
    updateProfile: async (userData) => {
        const response = await api.put('/users/profile', userData);
        return response.data;
    }
};

// Job APIs
export const jobAPI = {
    // Create a new job
    createJob: async (jobData) => {
        const response = await api.post('/users/jobs', jobData);
        return response.data;
    },

    // Get user's jobs
    getUserJobs: async (params = {}) => {
        const response = await api.get('/users/jobs', { params });
        return response.data;
    },

    // Get single job by ID
    getJobById: async (jobId) => {
        const response = await api.get(`/users/jobs/${jobId}`);
        return response.data;
    },

    // Update job
    updateJob: async (jobId, jobData) => {
        const response = await api.put(`/users/jobs/${jobId}`, jobData);
        return response.data;
    },

    // Delete job
    deleteJob: async (jobId) => {
        const response = await api.delete(`/users/jobs/${jobId}`);
        return response.data;
    },

    // Browse all open jobs (public)
    browseJobs: async (params = {}) => {
        const response = await api.get('/jobs/browse', { params });
        return response.data;
    },

    // Apply to a job (for labour/contractor)
    applyToJob: async (jobId, applicationData) => {
        const response = await api.post(`/jobs/${jobId}/apply`, applicationData);
        return response.data;
    },

    // Get job applications (for user who posted the job)
    getJobApplications: async (jobId) => {
        const response = await api.get(`/users/jobs/${jobId}/applications`);
        return response.data;
    },

    // Get all contractor applications for user's jobs
    getContractorApplications: async () => {
        const response = await api.get('/users/contractor-applications');
        return response.data;
    },

    // Get my own applications (for contractor to see their application statuses)
    getMyApplications: async () => {
        const response = await api.get('/users/my-applications');
        return response.data;
    },

    // Get application history (accepted/rejected applications for user)
    getApplicationHistory: async () => {
        const response = await api.get('/users/application-history');
        return response.data;
    },

    // Update application status (accept/reject)
    updateApplicationStatus: async (jobId, applicationId, status) => {
        const response = await api.put(`/users/jobs/${jobId}/applications/${applicationId}`, { status });
        return response.data;
    }
};

// Labour APIs
export const labourAPI = {
    // Update work details
    updateWorkDetails: async (workData) => {
        const response = await api.put('/labour/work-details', workData);
        
        // Update localStorage
        if (response.data.success) {
            const existingProfile = JSON.parse(localStorage.getItem('labour_profile') || '{}');
            localStorage.setItem('labour_profile', JSON.stringify({
                ...existingProfile,
                ...workData
            }));
        }
        
        return response.data;
    },

    // Create labour card
    createLabourCard: async (cardData) => {
        const response = await api.post('/labour/card', cardData);
        
        // Update localStorage
        if (response.data.success) {
            const labour = response.data.data?.labour || response.data.labour;
            const newCard = {
                id: labour?._id || Date.now(),
                ...cardData,
                createdAt: labour?.createdAt || new Date().toISOString()
            };
            
            const existingCards = JSON.parse(localStorage.getItem('labour_cards') || '[]');
            existingCards.push(newCard);
            localStorage.setItem('labour_cards', JSON.stringify(existingCards));
        }
        
        return response.data;
    },

    // Get labour profile
    getLabourProfile: async () => {
        const response = await api.get('/labour/profile');
        
        // Update localStorage
        if (response.data.success && response.data.data.labour) {
            const labour = response.data.data.labour;
            localStorage.setItem('labour_profile', JSON.stringify({
                skillType: labour.skillType,
                experience: labour.experience,
                workPhotos: labour.workPhotos,
                previousWorkLocation: labour.previousWorkLocation,
                rating: labour.rating,
                availability: labour.availability,
                hasLabourCard: labour.hasLabourCard,
                ...labour.labourCardDetails
            }));
        }
        
        return response.data;
    },

    // Update labour card
    updateLabourCard: async (cardData) => {
        const response = await api.put('/labour/card', cardData);
        
        // Update localStorage
        if (response.data.success) {
            const existingProfile = JSON.parse(localStorage.getItem('labour_profile') || '{}');
            localStorage.setItem('labour_profile', JSON.stringify({
                ...existingProfile,
                ...cardData
            }));
        }
        
        return response.data;
    },

    // Browse labour cards (public)
    browseLabourCards: async (params = {}) => {
        const response = await api.get('/labour/browse', { params });
        
        // Update localStorage
        if (response.data.success && response.data.data.labours) {
            const cards = response.data.data.labours.map(labour => ({
                id: labour._id,
                fullName: labour.labourCardDetails?.fullName || '',
                primarySkill: labour.skillType,
                rating: labour.rating,
                gender: labour.labourCardDetails?.gender || '',
                mobileNumber: labour.labourCardDetails?.mobileNumber || '',
                city: labour.labourCardDetails?.city || '',
                address: labour.labourCardDetails?.address || '',
                skills: labour.labourCardDetails?.skills || labour.skillType,
                experience: labour.experience,
                previousWorkLocation: labour.previousWorkLocation,
                availability: labour.availability,
                availabilityStatus: labour.availabilityStatus,
                createdAt: labour.createdAt
            }));
            localStorage.setItem('labour_cards', JSON.stringify(cards));
        }
        
        return response.data;
    },

    // Sync labour cards from API to localStorage
    syncLabourCards: async () => {
        try {
            const response = await api.get('/labour/browse');
            if (response.data.success && response.data.data.labours) {
                const cards = response.data.data.labours.map(labour => ({
                    id: labour._id,
                    fullName: labour.labourCardDetails?.fullName || '',
                    primarySkill: labour.skillType,
                    rating: labour.rating,
                    gender: labour.labourCardDetails?.gender || '',
                    mobileNumber: labour.labourCardDetails?.mobileNumber || '',
                    city: labour.labourCardDetails?.city || '',
                    address: labour.labourCardDetails?.address || '',
                    skills: labour.labourCardDetails?.skills || labour.skillType,
                    experience: labour.experience,
                    previousWorkLocation: labour.previousWorkLocation,
                    availability: labour.availability,
                    availabilityStatus: labour.availabilityStatus,
                    createdAt: labour.createdAt
                }));
                localStorage.setItem('labour_cards', JSON.stringify(cards));
            }
        } catch (error) {
            console.error('Failed to sync labour cards:', error);
        }
    },

    // ==================== HIRE REQUEST APIs ====================

    // Create hire request (User/Contractor hiring Labour)
    createHireRequest: async (requestData) => {
        const response = await api.post('/labour/hire-request', requestData);
        return response.data;
    },

    // Get hire requests for labour (received requests)
    getLabourHireRequests: async (params = {}) => {
        const response = await api.get('/labour/hire-requests', { params });
        return response.data;
    },

    // Get sent hire requests (User/Contractor)
    getSentHireRequests: async (params = {}) => {
        const response = await api.get('/labour/hire-requests/sent', { params });
        return response.data;
    },

    // Update hire request status (Accept/Decline)
    updateHireRequestStatus: async (requestId, status) => {
        const response = await api.patch(`/labour/hire-request/${requestId}`, { status });
        return response.data;
    },

    // Delete hire request
    deleteHireRequest: async (requestId) => {
        const response = await api.delete(`/labour/hire-request/${requestId}`);
        return response.data;
    },

    // Get labour's application history
    getLabourApplicationHistory: async () => {
        const response = await api.get('/labour/application-history');
        return response.data;
    }
};

// Contractor APIs
export const contractorAPI = {
    // Update business details
    updateBusinessDetails: async (businessData) => {
        const response = await api.put('/contractor/business-details', businessData);
        
        // Update localStorage
        if (response.data.success) {
            const existingProfile = JSON.parse(localStorage.getItem('contractor_profile') || '{}');
            localStorage.setItem('contractor_profile', JSON.stringify({
                ...existingProfile,
                businessDetails: businessData
            }));
        }
        
        return response.data;
    },

    // Get contractor profile
    getContractorProfile: async () => {
        const response = await api.get('/contractor/profile');
        
        // Update localStorage
        if (response.data.success && response.data.data.contractor) {
            const contractor = response.data.data.contractor;
            localStorage.setItem('contractor_profile', JSON.stringify({
                businessDetails: {
                    businessType: contractor.businessType,
                    businessName: contractor.businessName,
                    city: contractor.city,
                    state: contractor.state,
                    addressLine1: contractor.addressLine1,
                    addressLine2: contractor.addressLine2,
                    landmark: contractor.landmark,
                    ...contractor
                }
            }));
        }
        
        return response.data;
    },

    // Browse contractors (public)
    browseContractors: async (params = {}) => {
        const response = await api.get('/contractor/browse', { params });
        return response.data;
    },

    // Create contractor job
    createContractorJob: async (jobData) => {
        const response = await api.post('/contractor/jobs', jobData);
        return response.data;
    },

    // Get contractor's jobs
    getContractorJobs: async (params = {}) => {
        const response = await api.get('/contractor/jobs', { params });
        return response.data;
    },

    // Browse contractor jobs (public)
    browseContractorJobs: async (params = {}) => {
        const response = await api.get('/contractor/jobs/browse', { params });
        return response.data;
    },

    // Update contractor job
    updateContractorJob: async (jobId, jobData) => {
        const response = await api.put(`/contractor/jobs/${jobId}`, jobData);
        return response.data;
    },

    // Delete contractor job
    deleteContractorJob: async (jobId) => {
        const response = await api.delete(`/contractor/jobs/${jobId}`);
        return response.data;
    },

    // Contractor Hire Request APIs
    createContractorHireRequest: async (contractorId) => {
        const response = await api.post('/contractor/hire-request', { contractorId });
        return response.data;
    },

    getContractorHireRequests: async (params = {}) => {
        const response = await api.get('/contractor/hire-requests', { params });
        return response.data;
    },

    getSentContractorHireRequests: async () => {
        const response = await api.get('/contractor/hire-requests/sent');
        return response.data;
    },

    updateContractorHireRequestStatus: async (requestId, status) => {
        const response = await api.patch(`/contractor/hire-request/${requestId}`, { status });
        return response.data;
    },

    deleteContractorHireRequest: async (requestId) => {
        const response = await api.delete(`/contractor/hire-request/${requestId}`);
        return response.data;
    },

    // Contractor Job Application APIs (Labour â†’ Contractor Job)
    applyToContractorJob: async (jobId, message = '') => {
        const response = await api.post(`/contractor/jobs/${jobId}/apply`, { message });
        return response.data;
    },

    getContractorJobApplications: async () => {
        const response = await api.get('/contractor/job-applications');
        return response.data;
    },

    getLabourApplications: async () => {
        const response = await api.get('/contractor/my-applications');
        return response.data;
    },

    updateContractorJobApplicationStatus: async (jobId, applicationId, status) => {
        const response = await api.patch(`/contractor/jobs/${jobId}/applications/${applicationId}`, { status });
        return response.data;
    },

    getContractorApplicationHistory: async () => {
        const response = await api.get('/contractor/application-history');
        return response.data;
    }
};

// Chat APIs
export const chatAPI = {
    // Get all chats for current user
    getUserChats: async () => {
        const response = await api.get('/chat/chats');
        return response.data;
    },
    
    // Initialize or get existing chat
    initializeChat: async (chatData) => {
        const response = await api.post('/chat/initialize', chatData);
        return response.data;
    },

    // Get specific chat details
    getChatById: async (chatId) => {
        const response = await api.get(`/chat/chats/${chatId}`);
        return response.data;
    },

    // Get messages for a chat
    getChatMessages: async (chatId, page = 1, limit = 50) => {
        const response = await api.get(`/chat/chats/${chatId}/messages`, {
            params: { page, limit }
        });
        return response.data;
    },

    // Send message
    sendMessage: async (chatId, messageData) => {
        const response = await api.post(`/chat/chats/${chatId}/messages`, messageData);
        return response.data;
    },

    // Mark messages as read
    markAsRead: async (chatId) => {
        const response = await api.patch(`/chat/chats/${chatId}/read`);
        return response.data;
    },

    // Delete chat
    deleteChat: async (chatId) => {
        const response = await api.delete(`/chat/chats/${chatId}`);
        return response.data;
    }
};

export default api;




