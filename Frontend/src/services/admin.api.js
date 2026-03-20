import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || `${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}`;

// Create axios instance with default config
const adminApi = axios.create({
    baseURL: `${API_URL}/admin`,
    withCredentials: true,
    headers: {
        'Content-Type': 'application/json'
    }
});

// Add token to requests
adminApi.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('adminToken');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Handle response errors
adminApi.interceptors.response.use(
    (response) => response,
    (error) => {
        // Only logout on specific token-related errors
        if (error.response?.status === 401) {
            const errorMessage = error.response?.data?.message || '';
            
            console.log('[ERROR] Admin API 401 Error:', errorMessage);
            
            // Only logout on these specific error codes from backend
            const logoutErrors = ['TOKEN_MISSING', 'TOKEN_EXPIRED', 'TOKEN_INVALID', 'ADMIN_NOT_FOUND'];
            
            if (logoutErrors.includes(errorMessage)) {
                console.log('[LOGOUT] Logging out due to:', errorMessage);
                
                // Clear all admin data
                localStorage.removeItem('adminToken');
                localStorage.removeItem('adminAuth');
                localStorage.removeItem('adminRole');
                localStorage.removeItem('adminUsername');
                localStorage.removeItem('adminProfile');
                
                // Only redirect if not already on login page
                if (!window.location.pathname.includes('/admin/login')) {
                    window.location.href = '/admin/login';
                }
            } else {
                // Log but don't logout for other 401 errors (like permission issues)
                console.warn('[WARNING] 401 error but not a token issue:', errorMessage);
            }
        }
        
        // For network errors (no response), don't logout
        if (!error.response) {
            console.warn('[WARNING] Network error - keeping session active');
        }
        
        return Promise.reject(error);
    }
);

// ==================== AUTH APIs ====================
export const adminAuthAPI = {
    login: async (username, password) => {
        const response = await adminApi.post('/auth/login', { username, password });
        return response.data;
    },

    logout: async () => {
        const response = await adminApi.post('/auth/logout');
        return response.data;
    },

    changePassword: async (currentPassword, newPassword) => {
        const response = await adminApi.put('/auth/change-password', {
            currentPassword,
            newPassword
        });
        return response.data;
    },

    verifyToken: async () => {
        try {
            const response = await adminApi.get('/auth/verify-token');
            return response.data;
        } catch (error) {
            // Don't throw error, just return invalid status
            console.warn('[WARNING] Token verification failed:', error.message);
            return { success: false, valid: false };
        }
    },

    getProfile: async () => {
        const response = await adminApi.get('/auth/profile');
        return response.data;
    },

    updateProfile: async (profileData) => {
        const response = await adminApi.put('/auth/profile', profileData);
        return response.data;
    }
};

// ==================== USER MANAGEMENT APIs ====================
export const userManagementAPI = {
    getAllUsers: async (params = {}) => {
        const response = await adminApi.get('/users', { params });
        return response.data;
    },

    getUserById: async (id) => {
        const response = await adminApi.get(`/users/${id}`);
        return response.data;
    },

    createUser: async (userData) => {
        const response = await adminApi.post('/users', userData);
        return response.data;
    },

    updateUser: async (id, userData) => {
        const response = await adminApi.put(`/users/${id}`, userData);
        return response.data;
    },

    deleteUser: async (id) => {
        const response = await adminApi.delete(`/users/${id}`);
        return response.data;
    },

    getUserContractorRequests: async (id) => {
        const response = await adminApi.get(`/users/${id}/contractor-requests`);
        return response.data;
    },

    getUserLabourRequests: async (id) => {
        const response = await adminApi.get(`/users/${id}/labour-requests`);
        return response.data;
    },

    getUserFeedbacks: async (id) => {
        const response = await adminApi.get(`/users/${id}/feedbacks`);
        return response.data;
    }
};

// ==================== LABOUR MANAGEMENT APIs ====================
export const labourManagementAPI = {
    getAllLabours: async (params = {}) => {
        const response = await adminApi.get('/labours', { params });
        return response.data;
    },

    getLabourById: async (id) => {
        const response = await adminApi.get(`/labours/${id}`);
        return response.data;
    },

    createLabour: async (labourData) => {
        const response = await adminApi.post('/labours', labourData);
        return response.data;
    },

    updateLabour: async (id, labourData) => {
        const response = await adminApi.put(`/labours/${id}`, labourData);
        return response.data;
    },

    deleteLabour: async (id) => {
        const response = await adminApi.delete(`/labours/${id}`);
        return response.data;
    },

    getLabourContractorRequests: async (id) => {
        const response = await adminApi.get(`/labours/${id}/contractor-requests`);
        return response.data;
    },

    getLabourUserRequests: async (id) => {
        const response = await adminApi.get(`/labours/${id}/user-requests`);
        return response.data;
    },

    getLabourFeedbacks: async (id) => {
        const response = await adminApi.get(`/labours/${id}/feedbacks`);
        return response.data;
    }
};

// ==================== CONTRACTOR MANAGEMENT APIs ====================
export const contractorManagementAPI = {
    getAllContractors: async (params = {}) => {
        const response = await adminApi.get('/contractors', { params });
        return response.data;
    },

    getContractorById: async (id) => {
        const response = await adminApi.get(`/contractors/${id}`);
        return response.data;
    },

    createContractor: async (contractorData) => {
        const response = await adminApi.post('/contractors', contractorData);
        return response.data;
    },

    updateContractor: async (id, contractorData) => {
        const response = await adminApi.put(`/contractors/${id}`, contractorData);
        return response.data;
    },

    deleteContractor: async (id) => {
        const response = await adminApi.delete(`/contractors/${id}`);
        return response.data;
    },

    getContractorUserRequests: async (id) => {
        const response = await adminApi.get(`/contractors/${id}/user-requests`);
        return response.data;
    },

    getContractorLabourRequests: async (id) => {
        const response = await adminApi.get(`/contractors/${id}/labour-requests`);
        return response.data;
    },

    getContractorFeedbacks: async (id) => {
        const response = await adminApi.get(`/contractors/${id}/feedbacks`);
        return response.data;
    }
};

// ==================== LABOUR CATEGORY APIs ====================
export const labourCategoryAPI = {
    getAll: async () => {
        const response = await adminApi.get('/labour-categories');
        return response.data;
    },

    getAllCategories: async () => {
        const response = await adminApi.get('/labour-categories');
        return response.data;
    },

    getCategoryById: async (id) => {
        const response = await adminApi.get(`/labour-categories/${id}`);
        return response.data;
    },

    create: async (categoryData) => {
        const response = await adminApi.post('/labour-categories', categoryData);
        return response.data;
    },

    createCategory: async (categoryData) => {
        const response = await adminApi.post('/labour-categories', categoryData);
        return response.data;
    },

    updateCategory: async (id, categoryData) => {
        const response = await adminApi.put(`/labour-categories/${id}`, categoryData);
        return response.data;
    },

    delete: async (id) => {
        const response = await adminApi.delete(`/labour-categories/${id}`);
        return response.data;
    },

    deleteCategory: async (id) => {
        const response = await adminApi.delete(`/labour-categories/${id}`);
        return response.data;
    }
};

// ==================== VERIFICATION APIs ====================
export const verificationAPI = {
    getAllRequests: async (params = {}) => {
        const response = await adminApi.get('/verification/requests', { params });
        return response.data;
    },

    getRequestById: async (id) => {
        const response = await adminApi.get(`/verification/requests/${id}`);
        return response.data;
    },

    createRequest: async (requestData) => {
        const response = await adminApi.post('/verification/requests', requestData);
        return response.data;
    },

    approveRequest: async (id) => {
        const response = await adminApi.put(`/verification/requests/${id}/approve`);
        return response.data;
    },

    rejectRequest: async (id, reason) => {
        const response = await adminApi.put(`/verification/requests/${id}/reject`, { reason });
        return response.data;
    },

    uploadDocument: async (formData) => {
        const response = await adminApi.post('/verification/upload-document', formData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        });
        return response.data;
    }
};

// ==================== CMS APIs ====================
export const cmsAPI = {
    getAll: async () => {
        const response = await adminApi.get('/cms');
        return response.data;
    },

    getAllContent: async () => {
        const response = await adminApi.get('/cms');
        return response.data;
    },

    getContentBySection: async (section) => {
        const response = await axios.get(`${API_URL}/admin/cms/${section}`);
        return response.data;
    },

    updateAllContent: async (contentData) => {
        const response = await adminApi.put('/cms', contentData);
        return response.data;
    },

    update: async (section, data) => {
        const response = await adminApi.put(`/cms/${section}`, data);
        return response.data;
    },

    updateSection: async (section, content) => {
        const response = await adminApi.put(`/cms/${section}`, { content });
        return response.data;
    }
};

// ==================== DASHBOARD APIs ====================
export const dashboardAPI = {
    getAnalytics: async () => {
        const response = await adminApi.get('/dashboard/analytics');
        return response.data;
    },

    getInteractions: async (params = {}) => {
        const response = await adminApi.get('/dashboard/interactions', { params });
        return response.data;
    },

    getVerificationQueue: async () => {
        const response = await adminApi.get('/dashboard/verification-queue');
        return response.data;
    },

    getDisputes: async () => {
        const response = await adminApi.get('/dashboard/disputes');
        return response.data;
    },

    getRevenue: async (params = {}) => {
        const response = await adminApi.get('/dashboard/revenue', { params });
        return response.data;
    },

    getAudioLogs: async () => {
        const response = await adminApi.get('/dashboard/audio-logs');
        return response.data;
    }
};

export default adminApi;


// ==================== BROADCAST APIs ====================
export const broadcastAPI = {
    getAll: async (params = {}) => {
        const response = await adminApi.get('/broadcasts', { params });
        return response.data;
    },

    getById: async (id) => {
        const response = await adminApi.get(`/broadcasts/${id}`);
        return response.data;
    },

    create: async (broadcastData) => {
        const response = await adminApi.post('/broadcasts', broadcastData);
        return response.data;
    },

    update: async (id, broadcastData) => {
        const response = await adminApi.put(`/broadcasts/${id}`, broadcastData);
        return response.data;
    },

    delete: async (id) => {
        const response = await adminApi.delete(`/broadcasts/${id}`);
        return response.data;
    },

    send: async (id) => {
        const response = await adminApi.post(`/broadcasts/${id}/send`);
        return response.data;
    },

    getStats: async () => {
        const response = await adminApi.get('/broadcasts/stats');
        return response.data;
    }
};

// ==================== ADMIN MANAGEMENT APIs ====================
export const adminManagementAPI = {
    getAllAdmins: async (params = {}) => {
        const response = await adminApi.get('/management/admins', { params });
        return response.data;
    },

    getAdminById: async (id) => {
        const response = await adminApi.get(`/management/admins/${id}`);
        return response.data;
    },

    createAdmin: async (adminData) => {
        const response = await adminApi.post('/management/admins', adminData);
        return response.data;
    },

    updateAdmin: async (id, adminData) => {
        const response = await adminApi.put(`/management/admins/${id}`, adminData);
        return response.data;
    },

    deleteAdmin: async (id) => {
        const response = await adminApi.delete(`/management/admins/${id}`);
        return response.data;
    },

    resetAdminPassword: async (id, newPassword) => {
        const response = await adminApi.put(`/management/admins/${id}/reset-password`, { newPassword });
        return response.data;
    },

    getAdminStats: async () => {
        const response = await adminApi.get('/management/stats');
        return response.data;
    }
};

// ==================== BANNER APIs ====================
export const bannerAPI = {
    getAll: async (params = {}) => {
        const response = await adminApi.get('/banners', { params });
        return response.data;
    },

    getById: async (id) => {
        const response = await adminApi.get(`/banners/${id}`);
        return response.data;
    },

    create: async (bannerData) => {
        const response = await adminApi.post('/banners', bannerData);
        return response.data;
    },

    update: async (id, bannerData) => {
        const response = await adminApi.put(`/banners/${id}`, bannerData);
        return response.data;
    },

    delete: async (id) => {
        const response = await adminApi.delete(`/banners/${id}`);
        return response.data;
    },

    toggleStatus: async (id) => {
        const response = await adminApi.patch(`/banners/${id}/toggle`);
        return response.data;
    }
};

// ==================== GET STARTED SLIDES APIs ====================
export const getStartedSlidesAPI = {
    getAll: async () => {
        const response = await adminApi.get('/getstarted');
        return response.data;
    },
    create: async (slideData) => {
        const response = await adminApi.post('/getstarted', slideData);
        return response.data;
    },
    update: async (id, slideData) => {
        const response = await adminApi.put(`/getstarted/${id}`, slideData);
        return response.data;
    },
    delete: async (id) => {
        const response = await adminApi.delete(`/getstarted/${id}`);
        return response.data;
    },
    toggleStatus: async (id) => {
        const response = await adminApi.patch(`/getstarted/${id}/toggle`);
        return response.data;
    },
    // Public method for GetStarted page (uses direct axios since it's public)
    getActiveSlides: async () => {
        const response = await axios.get(`${API_URL}/admin/getstarted/public`);
        return response.data;
    }
};


// ==================== ADMIN NOTIFICATION APIs ====================
export const adminNotificationAPI = {
    getNotifications: async (params = {}) => {
        const response = await adminApi.get('/notifications', { params });
        return response.data;
    },

    markAsRead: async (id) => {
        const response = await adminApi.patch(`/notifications/${id}/read`);
        return response.data;
    },

    markAllAsRead: async () => {
        const response = await adminApi.patch('/notifications/read-all');
        return response.data;
    },

    saveFcmToken: async (fcmToken, platform = 'web') => {
        const response = await adminApi.post('/auth/fcm-token', { fcmToken, platform });
        return response.data;
    }
};
