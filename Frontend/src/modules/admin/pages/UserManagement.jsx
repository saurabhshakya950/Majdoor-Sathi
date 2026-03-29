import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Edit, X, Briefcase, HardHat, MessageSquare, Star, Search } from 'lucide-react';
import toast from 'react-hot-toast';
import { useSearchParams } from 'react-router-dom';
import { userManagementAPI } from '../../../services/admin.api';

const UserManagement = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    const highlightId = searchParams.get('highlightId');
    const [users, setUsers] = useState([]);
    const [filteredUsers, setFilteredUsers] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(false);
    const [pagination, setPagination] = useState({ page: 1, limit: 5, total: 0 });

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentUser, setCurrentUser] = useState(null);
    const [formData, setFormData] = useState({ 
        firstName: '', 
        lastName: '', 
        mobileNumber: '', 
        gender: 'Male', 
        city: '', 
        state: '', 
        isActive: true 
    });

    // Action modals
    const [actionModal, setActionModal] = useState({ type: null, userId: null, data: [] });

    // Fetch users on component mount
    useEffect(() => {
        fetchUsers();
    }, [pagination.page]);

    const fetchUsers = async () => {
        setLoading(true);
        try {
            console.log('[INFO] Fetching users from admin API...');
            const response = await userManagementAPI.getAllUsers({
                page: pagination.page,
                limit: pagination.limit
            });
            
            console.log('[INFO] User API Response:', response);
            
            if (response.success) {
                console.log('[SUCCESS] Users received:', response.data.users.length);
                setUsers(response.data.users);
                setFilteredUsers(response.data.users);
                setPagination(prev => ({
                    ...prev,
                    total: response.data.total,
                    totalPages: response.data.totalPages
                }));
            } else {
                console.log('[WARNING] API returned success: false');
                toast.error(response.message || 'Failed to fetch users');
            }
        } catch (error) {
            console.error('[ERROR] Error fetching users:', error);
            console.error('Error details:', error.response?.data);
            toast.error(error.response?.data?.message || 'Failed to fetch users');
        } finally {
            setLoading(false);
        }
    };

    // Search functionality
    const handleSearch = (e) => {
        const query = e.target.value;
        setSearchQuery(query);
        
        if (query.trim() === '') {
            setFilteredUsers(users);
        } else {
            const filtered = users.filter(user => {
                const searchLower = query.toLowerCase();
                const fullName = `${user.firstName || ''} ${user.lastName || ''}`.toLowerCase();
                const phone = user.mobileNumber || '';
                const email = user.email || '';
                
                return fullName.includes(searchLower) ||
                       phone.includes(searchLower) ||
                       email.toLowerCase().includes(searchLower);
            });
            setFilteredUsers(filtered);
        }
    };

    const handleOpenModal = (user = null) => {
        setCurrentUser(user);
        if (user) {
            setFormData({
                firstName: user.firstName || '',
                lastName: user.lastName || '',
                mobileNumber: user.mobileNumber || '',
                gender: user.gender || 'Male',
                city: user.city || '',
                state: user.state || '',
                isActive: user.isActive !== undefined ? user.isActive : true
            });
        } else {
            setFormData({ 
                firstName: '', 
                lastName: '', 
                mobileNumber: '', 
                gender: 'Male', 
                city: '', 
                state: '', 
                isActive: true 
            });
        }
        setIsModalOpen(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            if (currentUser) {
                // Update user
                await userManagementAPI.updateUser(currentUser._id, formData);
                toast.success('User updated successfully');
            } else {
                // Create user
                await userManagementAPI.createUser(formData);
                toast.success('User created successfully');
            }
            setIsModalOpen(false);
            fetchUsers();
        } catch (error) {
            console.error('Error saving user:', error);
            toast.error(error.response?.data?.message || 'Failed to save user');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this user?')) {
            try {
                await userManagementAPI.deleteUser(id);
                toast.success('User deleted successfully');
                fetchUsers();
            } catch (error) {
                console.error('Error deleting user:', error);
                toast.error('Failed to delete user');
            }
        }
    };

    const openActionModal = async (type, user) => {
        console.log('[INFO] Opening action modal:', type, 'for user:', user._id);
        setActionModal({ type, userId: user._id, data: [] });
        setLoading(true);

        try {
            let response;
            if (type === 'contractor') {
                console.log('[INFO] Calling getUserContractorRequests for user:', user._id);
                response = await userManagementAPI.getUserContractorRequests(user._id);
                console.log('[INFO] Full API Response (Contractor Requests):', JSON.stringify(response, null, 2));
                console.log('[INFO] Response.data:', response.data);
                console.log('[INFO] Response.data.requests:', response.data.requests);
                console.log('[INFO] Requests count:', response.data.requests?.length || 0);
                
                // Backend returns response.data.requests
                const requests = response.data.requests || [];
                console.log('[SUCCESS] Setting modal data with', requests.length, 'requests');
                setActionModal({ type, userId: user._id, data: requests });
            } else if (type === 'labour') {
                console.log('[INFO] Calling getUserLabourRequests for user:', user._id);
                response = await userManagementAPI.getUserLabourRequests(user._id);
                console.log('[INFO] Full API Response (Labour Requests):', JSON.stringify(response, null, 2));
                
                // Backend returns response.data.requests
                const requests = response.data.requests || [];
                console.log('[SUCCESS] Setting modal data with', requests.length, 'labour requests');
                setActionModal({ type, userId: user._id, data: requests });
            } else if (type === 'feedback') {
                response = await userManagementAPI.getUserFeedbacks(user._id);
                setActionModal({ type, userId: user._id, data: response.data.feedbacks || [] });
                
                // Clear the count locally so badge disappears immediately
                setUsers(prev => prev.map(u => u._id === user._id ? { ...u, unreadFeedbackCount: 0 } : u));
                setFilteredUsers(prev => prev.map(u => u._id === user._id ? { ...u, unreadFeedbackCount: 0 } : u));

                // Clear the highlight from URL as the user is now viewing the feedback
                setSearchParams({});
            }
        } catch (error) {
            console.error('[ERROR] Error fetching action data:', error);
            console.error('Error response:', error.response);
            console.error('Error message:', error.message);
            toast.error('Failed to fetch data');
        } finally {
            setLoading(false);
        }
    };

    const closeActionModal = () => setActionModal({ type: null, userId: null, data: [] });

    const getFullName = (user) => {
        return `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'N/A';
    };

    return (
        <div className="management-container">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h2>User Management</h2>
                <button className="crud-btn btn-add" onClick={() => handleOpenModal()}>
                    <Plus size={18} style={{ marginRight: '8px' }} /> Add User
                </button>
            </div>

            {/* Search Bar */}
            <div style={{ marginBottom: '20px' }}>
                <div className="admin-search-bar" style={{ maxWidth: '400px' }}>
                    <Search size={18} color="#6b7280" />
                    <input 
                        type="text" 
                        placeholder="Search users..." 
                        className="admin-search-input"
                        value={searchQuery}
                        onChange={handleSearch}
                    />
                </div>
            </div>

            {loading && <div style={{ textAlign: 'center', padding: '20px' }}>Loading...</div>}

            <div className="interaction-monitor">
                <table className="admin-table">
                    <thead>
                        <tr>
                            <th>Name</th>
                            <th>Phone</th>
                            <th>City</th>
                            <th>Status</th>
                            <th>User Action</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredUsers.map(user => (
                            <tr key={user._id} className={highlightId === user._id ? 'highlight-row' : ''}>
                                <td>{getFullName(user)}</td>
                                <td>{user.mobileNumber}</td>
                                <td>{user.city || 'N/A'}</td>
                                <td>
                                    <span className={`status-badge ${user.isActive ? 'status-completed' : 'status-pending'}`}>
                                        {user.isActive ? 'Active' : 'Inactive'}
                                    </span>
                                </td>
                                <td>
                                    <div style={{ display: 'flex', gap: '10px' }}>
                                        <button className="action-icon-btn contractor" title="Contractor Action" onClick={() => openActionModal('contractor', user)}>
                                            <Briefcase size={18} />
                                        </button>
                                        <button className="action-icon-btn labour" title="Labour Action" onClick={() => openActionModal('labour', user)}>
                                            <HardHat size={18} />
                                        </button>
                                        <button 
                                            className="action-icon-btn feedback" 
                                            title="User Feedback" 
                                            onClick={() => openActionModal('feedback', user)}
                                            style={{ position: 'relative' }}
                                        >
                                            <MessageSquare size={18} />
                                            {user.unreadFeedbackCount > 0 && (
                                                <span className="feedback-notif-badge">{user.unreadFeedbackCount}</span>
                                            )}
                                        </button>
                                    </div>
                                </td>
                                <td>
                                    <button className="crud-btn btn-edit" onClick={() => handleOpenModal(user)}>
                                        <Edit size={16} />
                                    </button>
                                    <button className="crud-btn btn-delete" onClick={() => handleDelete(user._id)}>
                                        <Trash2 size={16} />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                {/* Numerical Pagination */}
                {pagination.totalPages > 1 && (
                    <div className="admin-pagination">
                        <button 
                            onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                            disabled={pagination.page === 1}
                            className="pagi-btn"
                            title="Previous Page"
                        >
                            &laquo;
                        </button>
                        
                        {[...Array(pagination.totalPages)].map((_, i) => (
                            <button
                                key={i + 1}
                                className={`pagi-btn ${pagination.page === i + 1 ? 'active' : ''}`}
                                onClick={() => setPagination(prev => ({ ...prev, page: i + 1 }))}
                            >
                                {i + 1}
                            </button>
                        ))}

                        <button 
                            onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                            disabled={pagination.page === pagination.totalPages}
                            className="pagi-btn"
                            title="Next Page"
                        >
                            &raquo;
                        </button>
                    </div>
                )}
            </div>

            {/* Add/Edit Modal */}
            {isModalOpen && (
                <div className="modal-overlay">
                    <div className="admin-modal">
                        <div className="chat-header">
                            <span>{currentUser ? 'Edit User' : 'Add New User'}</span>
                            <X size={18} onClick={() => setIsModalOpen(false)} style={{ cursor: 'pointer' }} />
                        </div>
                        <form onSubmit={handleSubmit} style={{ padding: '20px' }}>
                            <div style={{ marginBottom: '16px' }}>
                                <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem' }}>First Name</label>
                                <input
                                    type="text"
                                    className="admin-search-input"
                                    style={{ width: '100%', border: '1px solid #ddd', borderRadius: '8px', padding: '10px' }}
                                    value={formData.firstName}
                                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                                    required
                                />
                            </div>
                            <div style={{ marginBottom: '16px' }}>
                                <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem' }}>Last Name</label>
                                <input
                                    type="text"
                                    className="admin-search-input"
                                    style={{ width: '100%', border: '1px solid #ddd', borderRadius: '8px', padding: '10px' }}
                                    value={formData.lastName}
                                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                                />
                            </div>
                            <div style={{ marginBottom: '16px' }}>
                                <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem' }}>Mobile Number</label>
                                <input
                                    type="text"
                                    className="admin-search-input"
                                    style={{ width: '100%', border: '1px solid #ddd', borderRadius: '8px', padding: '10px' }}
                                    value={formData.mobileNumber}
                                    onChange={(e) => setFormData({ ...formData, mobileNumber: e.target.value })}
                                    required
                                    disabled={currentUser} // Can't change mobile number
                                />
                            </div>
                            <div style={{ marginBottom: '16px' }}>
                                <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem' }}>City</label>
                                <input
                                    type="text"
                                    className="admin-search-input"
                                    style={{ width: '100%', border: '1px solid #ddd', borderRadius: '8px', padding: '10px' }}
                                    value={formData.city}
                                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                                />
                            </div>
                            <div style={{ marginBottom: '24px' }}>
                                <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem' }}>Status</label>
                                <select
                                    style={{ width: '100%', border: '1px solid #ddd', borderRadius: '8px', padding: '10px' }}
                                    value={formData.isActive}
                                    onChange={(e) => setFormData({ ...formData, isActive: e.target.value === 'true' })}
                                >
                                    <option value="true">Active</option>
                                    <option value="false">Inactive</option>
                                </select>
                            </div>
                            <button type="submit" className="crud-btn btn-add" style={{ width: '100%', margin: 0 }} disabled={loading}>
                                {loading ? 'Saving...' : (currentUser ? 'Update User' : 'Create User')}
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* Action Modals */}
            {actionModal.type && (
                <div className="modal-overlay">
                    <div className="admin-modal mobile-style-modal large-modal">
                        <div className="chat-header" style={{ background: actionModal.type === 'feedback' ? '#10b981' : actionModal.type === 'labour' ? '#f97316' : '#3b82f6' }}>
                            <span>
                                {actionModal.type === 'contractor' && 'Contractor Requests'}
                                {actionModal.type === 'labour' && 'Labour Requests'}
                                {actionModal.type === 'feedback' && 'User Feedbacks'}
                            </span>
                            <X size={18} onClick={closeActionModal} style={{ cursor: 'pointer' }} />
                        </div>
                        <div className="modal-list-container">
                            {actionModal.data.length > 0 ? (
                                actionModal.type === 'feedback' ? (
                                    <div className="feedback-list">
                                        {actionModal.data.map((feedback) => (
                                            <div key={feedback._id} className="feedback-item-card">
                                                <div className="feedback-item-header">
                                                    <div className="stars-mini">
                                                        {[...Array(5)].map((_, i) => (
                                                            <Star
                                                                key={i}
                                                                size={14}
                                                                fill={i < feedback.rating ? "#facc15" : "none"}
                                                                color={i < feedback.rating ? "#facc15" : "#cbd5e1"}
                                                            />
                                                        ))}
                                                    </div>
                                                    <span className="feedback-date">{new Date(feedback.createdAt).toLocaleDateString()}</span>
                                                </div>
                                                <p className="feedback-comment">{feedback.comment}</p>
                                            </div>
                                        ))}
                                    </div>
                                ) : actionModal.type === 'contractor' ? (
                                    <div className="request-list">
                                        {actionModal.data.map((request, index) => (
                                            <div key={request._id} className="request-card">
                                                <div className="request-header">
                                                    <span className="request-number">Request #{index + 1}</span>
                                                    <span className={`status-badge status-${request.status}`}>
                                                        {request.status}
                                                    </span>
                                                </div>
                                                <div className="request-details">
                                                    <div className="detail-row">
                                                        <strong>Contractor:</strong> {request.contractorName}
                                                    </div>
                                                    <div className="detail-row">
                                                        <strong>Phone:</strong> {request.contractorPhone}
                                                    </div>
                                                    <div className="detail-row">
                                                        <strong>Business:</strong> {request.contractorBusiness}
                                                    </div>
                                                    <div className="detail-row">
                                                        <strong>City:</strong> {request.contractorCity}
                                                    </div>
                                                    <div className="detail-row">
                                                        <strong>Requested:</strong> {new Date(request.createdAt).toLocaleDateString('en-IN', {
                                                            day: 'numeric',
                                                            month: 'short',
                                                            year: 'numeric',
                                                            hour: '2-digit',
                                                            minute: '2-digit'
                                                        })}
                                                    </div>
                                                    {request.respondedAt && (
                                                        <div className="detail-row">
                                                            <strong>Responded:</strong> {new Date(request.respondedAt).toLocaleDateString('en-IN', {
                                                                day: 'numeric',
                                                                month: 'short',
                                                                year: 'numeric',
                                                                hour: '2-digit',
                                                                minute: '2-digit'
                                                            })}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : actionModal.type === 'labour' ? (
                                    <div className="request-list">
                                        {actionModal.data.map((request, index) => (
                                            <div key={request._id} className="request-card">
                                                <div className="request-header">
                                                    <span className="request-number">Request #{index + 1}</span>
                                                    <span className={`status-badge status-${request.status}`}>
                                                        {request.status}
                                                    </span>
                                                </div>
                                                <div className="request-details">
                                                    <div className="detail-row">
                                                        <strong>Labour:</strong> {request.labourName}
                                                    </div>
                                                    <div className="detail-row">
                                                        <strong>Skill:</strong> {request.labourSkill}
                                                    </div>
                                                    <div className="detail-row">
                                                        <strong>Phone:</strong> {request.labourPhone}
                                                    </div>
                                                    <div className="detail-row">
                                                        <strong>City:</strong> {request.labourCity}
                                                    </div>
                                                    <div className="detail-row">
                                                        <strong>Requested:</strong> {new Date(request.createdAt).toLocaleDateString('en-IN', {
                                                            day: 'numeric',
                                                            month: 'short',
                                                            year: 'numeric',
                                                            hour: '2-digit',
                                                            minute: '2-digit'
                                                        })}
                                                    </div>
                                                    {request.respondedAt && (
                                                        <div className="detail-row">
                                                            <strong>Responded:</strong> {new Date(request.respondedAt).toLocaleDateString('en-IN', {
                                                                day: 'numeric',
                                                                month: 'short',
                                                                year: 'numeric',
                                                                hour: '2-digit',
                                                                minute: '2-digit'
                                                            })}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div style={{ padding: '20px' }}>
                                        {actionModal.data.map((item, index) => (
                                            <div key={item._id} style={{ padding: '10px', borderBottom: '1px solid #eee' }}>
                                                <div><strong>Request #{index + 1}</strong></div>
                                                <div>Type: {item.requestType}</div>
                                                <div>Context: {item.requestContext}</div>
                                                <div>Status: {item.status}</div>
                                                <div>Date: {new Date(item.createdAt).toLocaleString()}</div>
                                            </div>
                                        ))}
                                    </div>
                                )
                            ) : (
                                <div className="empty-state">No data found</div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            <style>{`
                .modal-overlay {
                    position: fixed;
                    top: 0; left: 0; right: 0; bottom: 0;
                    background: rgba(0,0,0,0.5);
                    display: flex; justify-content: center; align-items: center;
                    z-index: 2000;
                }
                .admin-modal {
                    background: white;
                    width: 400px;
                    border-radius: 16px;
                    overflow: hidden;
                    display: flex;
                    flex-direction: column;
                }
                .admin-modal.large-modal {
                    width: 700px;
                    max-height: 85vh;
                }
                .action-icon-btn {
                    width: 34px;
                    height: 34px;
                    border-radius: 8px;
                    border: none;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    cursor: pointer;
                    transition: all 0.2s;
                }
                .action-icon-btn.contractor { background: #eff6ff; color: #3b82f6; }
                .action-icon-btn.labour { background: #fff7ed; color: #f97316; }
                .action-icon-btn.feedback { background: #ecfdf5; color: #10b981; }
                .action-icon-btn:hover { transform: scale(1.1); filter: brightness(0.9); }
                .empty-state {
                    text-align: center;
                    padding: 40px 20px;
                    color: #94a3b8;
                    font-style: italic;
                }
                .modal-list-container {
                    padding: 10px;
                    background: #fff;
                    overflow-y: auto;
                    flex: 1;
                }
                .feedback-list {
                    display: flex;
                    flex-direction: column;
                    gap: 12px;
                    padding: 10px;
                }
                .feedback-item-card {
                    background: #f8fafc;
                    border-radius: 12px;
                    padding: 14px;
                    border: 1px solid #f1f5f9;
                }
                .feedback-item-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 8px;
                }
                .stars-mini {
                    display: flex;
                    gap: 2px;
                }
                .feedback-date {
                    font-size: 0.75rem;
                    color: #94a3b8;
                }
                .feedback-comment {
                    font-size: 0.9rem;
                    color: #475569;
                    margin: 0;
                    line-height: 1.4;
                }
                .request-list {
                    display: flex;
                    flex-direction: column;
                    gap: 12px;
                    padding: 10px;
                }
                .request-card {
                    background: #f8fafc;
                    border-radius: 12px;
                    padding: 16px;
                    border: 1px solid #e2e8f0;
                }
                .request-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 12px;
                    padding-bottom: 10px;
                    border-bottom: 1px solid #e2e8f0;
                }
                .request-number {
                    font-weight: 600;
                    color: #1e293b;
                    font-size: 0.95rem;
                }
                .status-badge {
                    padding: 4px 12px;
                    border-radius: 12px;
                    font-size: 0.75rem;
                    font-weight: 600;
                    text-transform: capitalize;
                }
                .status-pending {
                    background: #fef3c7;
                    color: #92400e;
                }
                .status-accepted {
                    background: #d1fae5;
                    color: #065f46;
                }
                .status-declined {
                    background: #fee2e2;
                    color: #991b1b;
                }
                .request-details {
                    display: flex;
                    flex-direction: column;
                    gap: 8px;
                }
                .detail-row {
                    font-size: 0.875rem;
                    color: #475569;
                    display: flex;
                    gap: 8px;
                }
                .detail-row strong {
                    color: #1e293b;
                    min-width: 90px;
                }
                .highlight-row {
                    background-color: #fff9db !important;
                    animation: pulse-highlight 2s infinite;
                }
                @keyframes pulse-highlight {
                    0% { background-color: #fff9db; }
                    50% { background-color: #fff3bf; }
                    100% { background-color: #fff9db; }
                }
                .feedback-notif-badge {
                    position: absolute;
                    top: -6px;
                    right: -6px;
                    background: #ef4444;
                    color: white;
                    font-size: 10px;
                    font-weight: 800;
                    min-width: 18px;
                    height: 18px;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    border: 2px solid white;
                    box-shadow: 0 2px 4px rgba(0,0,0,0.2);
                    z-index: 10;
                }
            `}</style>
        </div>
    );
};

export default UserManagement;
