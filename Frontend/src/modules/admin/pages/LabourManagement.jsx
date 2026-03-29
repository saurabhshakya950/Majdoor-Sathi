import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Edit, X, HardHat, Briefcase, MessageSquare, Star, Users, Search } from 'lucide-react';
import toast from 'react-hot-toast';
import { useSearchParams } from 'react-router-dom';
import { labourManagementAPI } from '../../../services/admin.api';

const LabourManagement = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    const highlightId = searchParams.get('highlightId');
    const [labours, setLabours] = useState([]);
    const [filteredLabours, setFilteredLabours] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(false);
    const [pagination, setPagination] = useState({ page: 1, limit: 5, total: 0 });

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentLabour, setCurrentLabour] = useState(null);
    const [formData, setFormData] = useState({ 
        firstName: '', 
        lastName: '', 
        mobileNumber: '', 
        trade: '',
        gender: 'Male', 
        city: '', 
        state: '', 
        isActive: true 
    });

    // Action modals
    const [actionModal, setActionModal] = useState({ type: null, userId: null, data: [] });

    // Fetch labours on component mount
    useEffect(() => {
        fetchLabours();
    }, [pagination.page]);

    const fetchLabours = async () => {
        setLoading(true);
        try {
            console.log('[INFO] Fetching labours from admin API...');
            const response = await labourManagementAPI.getAllLabours({
                page: pagination.page,
                limit: pagination.limit
            });
            
            console.log('[INFO] Labour API Response:', response);
            
            if (response.success) {
                console.log('[SUCCESS] Labours received:', response.data.labours.length);
                setLabours(response.data.labours);
                setFilteredLabours(response.data.labours);
                setPagination(prev => ({
                    ...prev,
                    total: response.data.total,
                    totalPages: response.data.totalPages
                }));
            } else {
                console.log('[WARNING] API returned success: false');
                toast.error(response.message || 'Failed to fetch labours');
            }
        } catch (error) {
            console.error('[ERROR] Error fetching labours:', error);
            console.error('Error details:', error.response?.data);
            toast.error(error.response?.data?.message || 'Failed to fetch labours');
        } finally {
            setLoading(false);
        }
    };

    // Search functionality
    const handleSearch = (e) => {
        const query = e.target.value;
        setSearchQuery(query);
        
        if (query.trim() === '') {
            setFilteredLabours(labours);
        } else {
            const filtered = labours.filter(labour => {
                const searchLower = query.toLowerCase();
                const fullName = `${labour.firstName || ''} ${labour.lastName || ''}`.toLowerCase();
                const phone = labour.mobileNumber || '';
                const trade = labour.trade || '';
                
                return fullName.includes(searchLower) ||
                       phone.includes(searchLower) ||
                       trade.toLowerCase().includes(searchLower);
            });
            setFilteredLabours(filtered);
        }
    };

    const handleOpenModal = (labour = null) => {
        setCurrentLabour(labour);
        if (labour) {
            setFormData({
                firstName: labour.user?.firstName || labour.firstName || '',
                lastName: labour.user?.lastName || labour.lastName || '',
                mobileNumber: labour.user?.mobileNumber || labour.mobileNumber || '',
                trade: labour.skillType || labour.trade || '',
                gender: labour.user?.gender || labour.gender || 'Male',
                city: labour.user?.city || labour.city || '',
                state: labour.user?.state || labour.state || '',
                isActive: labour.isActive !== undefined ? labour.isActive : true
            });
        } else {
            setFormData({ 
                firstName: '', 
                lastName: '', 
                mobileNumber: '', 
                trade: '',
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
            if (currentLabour) {
                // Update labour
                await labourManagementAPI.updateLabour(currentLabour._id, formData);
                toast.success('Labour updated successfully');
            } else {
                // Create labour
                await labourManagementAPI.createLabour(formData);
                toast.success('Labour created successfully');
            }
            setIsModalOpen(false);
            fetchLabours();
        } catch (error) {
            console.error('Error saving labour:', error);
            toast.error(error.response?.data?.message || 'Failed to save labour');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this labour?')) {
            try {
                await labourManagementAPI.deleteLabour(id);
                toast.success('Labour deleted successfully');
                fetchLabours();
            } catch (error) {
                console.error('Error deleting labour:', error);
                toast.error('Failed to delete labour');
            }
        }
    };

    const openActionModal = async (type, labour) => {
        console.log('[INFO] Opening action modal:', type, 'for labour:', labour._id);
        setActionModal({ type, userId: labour._id, data: [] });
        setLoading(true);

        try {
            let response;
            if (type === 'contractor') {
                console.log('[INFO] Calling getLabourContractorRequests for labour:', labour._id);
                response = await labourManagementAPI.getLabourContractorRequests(labour._id);
                console.log('[INFO] Full API Response (Contractor Requests):', JSON.stringify(response, null, 2));
                
                // Backend returns response.data.requests
                const requests = response.data.requests || [];
                console.log('[SUCCESS] Setting modal data with', requests.length, 'contractor requests');
                setActionModal({ type, userId: labour._id, data: requests });
            } else if (type === 'user') {
                console.log('[INFO] Calling getLabourUserRequests for labour:', labour._id);
                response = await labourManagementAPI.getLabourUserRequests(labour._id);
                console.log('[INFO] Full API Response (User Requests):', JSON.stringify(response, null, 2));
                
                // Backend returns response.data.requests
                const requests = response.data.requests || [];
                console.log('[SUCCESS] Setting modal data with', requests.length, 'user requests');
                setActionModal({ type, userId: labour._id, data: requests });
            } else if (type === 'feedback') {
                response = await labourManagementAPI.getLabourFeedbacks(labour._id);
                setActionModal({ type, userId: labour._id, data: response.data.feedbacks || [] });

                // Clear the count locally so badge disappears immediately
                setLabours(prev => prev.map(l => l._id === labour._id ? { ...l, unreadFeedbackCount: 0 } : l));
                setFilteredLabours(prev => prev.map(l => l._id === labour._id ? { ...l, unreadFeedbackCount: 0 } : l));

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

    const getFullName = (labour) => {
        const firstName = labour.user?.firstName || labour.firstName || '';
        const lastName = labour.user?.lastName || labour.lastName || '';
        return `${firstName} ${lastName}`.trim() || 'N/A';
    };

    return (
        <div className="management-container">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h2 style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <HardHat color="#f97316" /> Labour Management
                </h2>
                <button className="crud-btn btn-add" onClick={() => handleOpenModal()}>
                    <Plus size={18} style={{ marginRight: '8px' }} /> Add Labour
                </button>
            </div>

            {/* Search Bar */}
            <div style={{ marginBottom: '20px' }}>
                <div className="admin-search-bar" style={{ maxWidth: '400px' }}>
                    <Search size={18} color="#6b7280" />
                    <input 
                        type="text" 
                        placeholder="Search labours..." 
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
                            <th>Trade</th>
                            <th>Phone</th>
                            <th>City</th>
                            <th>Status</th>
                            <th>Labour Action</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredLabours.map(labour => (
                            <tr key={labour._id} className={highlightId === labour._id ? 'highlight-row' : ''}>
                                <td>{getFullName(labour)}</td>
                                <td>{labour.skillType || labour.trade || 'N/A'}</td>
                                <td>{labour.user?.mobileNumber || labour.mobileNumber || 'N/A'}</td>
                                <td>{labour.user?.city || labour.city || 'N/A'}</td>
                                <td>
                                    <span className={`status-badge ${labour.isActive ? 'status-completed' : 'status-pending'}`}>
                                        {labour.isActive ? 'Active' : 'Inactive'}
                                    </span>
                                </td>
                                <td>
                                    <div style={{ display: 'flex', gap: '10px' }}>
                                        <button className="action-icon-btn user" title="User Action" onClick={() => openActionModal('user', labour)}>
                                            <Users size={18} />
                                        </button>
                                        <button className="action-icon-btn contractor" title="Contractor Action" onClick={() => openActionModal('contractor', labour)}>
                                            <Briefcase size={18} />
                                        </button>
                                        <button 
                                            className="action-icon-btn feedback" 
                                            title="Feedback" 
                                            onClick={() => openActionModal('feedback', labour)}
                                            style={{ position: 'relative' }}
                                        >
                                            <MessageSquare size={18} />
                                            {labour.unreadFeedbackCount > 0 && (
                                                <span className="feedback-notif-badge">{labour.unreadFeedbackCount}</span>
                                            )}
                                        </button>
                                    </div>
                                </td>
                                <td>
                                    <button className="crud-btn btn-edit" onClick={() => handleOpenModal(labour)}>
                                        <Edit size={16} />
                                    </button>
                                    <button className="crud-btn btn-delete" onClick={() => handleDelete(labour._id)}>
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
                        <div className="chat-header" style={{ background: '#f97316' }}>
                            <span>{currentLabour ? 'Edit Labour' : 'Add New Labour'}</span>
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
                                <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem' }}>Trade/Skill</label>
                                <input
                                    type="text"
                                    className="admin-search-input"
                                    style={{ width: '100%', border: '1px solid #ddd', borderRadius: '8px', padding: '10px' }}
                                    value={formData.trade}
                                    placeholder="e.g. Mason, Plumber, Electrician"
                                    onChange={(e) => setFormData({ ...formData, trade: e.target.value })}
                                    required
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
                                    disabled={currentLabour}
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
                            <button type="submit" className="crud-btn btn-add" style={{ width: '100%', margin: 0, background: '#f97316' }} disabled={loading}>
                                {loading ? 'Saving...' : (currentLabour ? 'Update Labour' : 'Create Labour')}
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* Action Modals */}
            {actionModal.type && (
                <div className="modal-overlay">
                    <div className="admin-modal mobile-style-modal large-modal">
                        <div className="chat-header" style={{ 
                            background: actionModal.type === 'feedback' ? '#10b981' : 
                                       actionModal.type === 'user' ? '#3b82f6' : '#f97316' 
                        }}>
                            <span>
                                {actionModal.type === 'contractor' && 'Contractor Requests'}
                                {actionModal.type === 'user' && 'User Requests'}
                                {actionModal.type === 'feedback' && 'Labour Feedbacks'}
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
                                ) : actionModal.type === 'user' ? (
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
                                                        <strong>User:</strong> {request.requesterName}
                                                    </div>
                                                    <div className="detail-row">
                                                        <strong>Phone:</strong> {request.requesterPhone}
                                                    </div>
                                                    <div className="detail-row">
                                                        <strong>Location:</strong> {request.requesterLocation}
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
                                ) : actionModal.type === 'contractor' ? (
                                    <div className="request-list">
                                        {actionModal.data.map((request, index) => (
                                            <div key={request._id} className="request-card">
                                                <div className="request-header">
                                                    <span className="request-number">Application #{index + 1}</span>
                                                    <span className={`status-badge status-${request.status}`}>
                                                        {request.status}
                                                    </span>
                                                </div>
                                                <div className="request-details">
                                                    <div className="detail-row">
                                                        <strong>Contractor:</strong> {request.contractorName}
                                                    </div>
                                                    <div className="detail-row">
                                                        <strong>Business:</strong> {request.businessName}
                                                    </div>
                                                    <div className="detail-row">
                                                        <strong>Phone:</strong> {request.contractorPhone}
                                                    </div>
                                                    <div className="detail-row">
                                                        <strong>City:</strong> {request.contractorCity}
                                                    </div>
                                                    <div className="detail-row">
                                                        <strong>Skill Required:</strong> {request.labourSkill}
                                                    </div>
                                                    <div className="detail-row">
                                                        <strong>Applied:</strong> {new Date(request.appliedAt).toLocaleDateString('en-IN', {
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
                .action-icon-btn.user { background: #f0f9ff; color: #0369a1; }
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

export default LabourManagement;
