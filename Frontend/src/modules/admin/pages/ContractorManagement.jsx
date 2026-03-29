import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Edit, X, Briefcase, HardHat, MessageSquare, Star, Users, Search } from 'lucide-react';
import toast from 'react-hot-toast';
import { useSearchParams } from 'react-router-dom';
import { contractorManagementAPI } from '../../../services/admin.api';

const ContractorManagement = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    const highlightId = searchParams.get('highlightId');
    const [contractors, setContractors] = useState([]);
    const [filteredContractors, setFilteredContractors] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(false);
    const [pagination, setPagination] = useState({ page: 1, limit: 5, total: 0 });

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentContractor, setCurrentContractor] = useState(null);
    const [formData, setFormData] = useState({ 
        firstName: '', 
        lastName: '', 
        mobileNumber: '', 
        businessName: '',
        gender: 'Male', 
        city: '', 
        state: '', 
        isActive: true 
    });

    // Action modals
    const [actionModal, setActionModal] = useState({ type: null, userId: null, data: [] });

    // Fetch contractors on component mount
    useEffect(() => {
        fetchContractors();
    }, [pagination.page]);

    const fetchContractors = async () => {
        setLoading(true);
        try {
            const response = await contractorManagementAPI.getAllContractors({
                page: pagination.page,
                limit: pagination.limit
            });
            
            if (response.success) {
                setContractors(response.data.contractors);
                setFilteredContractors(response.data.contractors);
                setPagination(prev => ({
                    ...prev,
                    total: response.data.total,
                    totalPages: response.data.totalPages
                }));
            }
        } catch (error) {
            console.error('Error fetching contractors:', error);
            toast.error('Failed to fetch contractors');
        } finally {
            setLoading(false);
        }
    };

    // Search functionality
    const handleSearch = (e) => {
        const query = e.target.value;
        setSearchQuery(query);
        
        if (query.trim() === '') {
            setFilteredContractors(contractors);
        } else {
            const filtered = contractors.filter(contractor => {
                const searchLower = query.toLowerCase();
                const firstName = contractor.user?.firstName || contractor.firstName || '';
                const lastName = contractor.user?.lastName || contractor.lastName || '';
                const fullName = `${firstName} ${lastName}`.toLowerCase();
                const phone = contractor.user?.mobileNumber || contractor.mobileNumber || '';
                const company = contractor.businessName || '';
                
                return fullName.includes(searchLower) ||
                       phone.includes(searchLower) ||
                       company.toLowerCase().includes(searchLower);
            });
            setFilteredContractors(filtered);
        }
    };

    const handleOpenModal = (contractor = null) => {
        setCurrentContractor(contractor);
        if (contractor) {
            setFormData({
                firstName: contractor.user?.firstName || contractor.firstName || '',
                lastName: contractor.user?.lastName || contractor.lastName || '',
                mobileNumber: contractor.user?.mobileNumber || contractor.mobileNumber || '',
                businessName: contractor.businessName || '',
                businessType: contractor.businessType || 'Proprietorship',
                gender: contractor.user?.gender || contractor.gender || 'Male',
                city: contractor.user?.city || contractor.city || '',
                state: contractor.user?.state || contractor.state || '',
                isActive: contractor.isActive !== undefined ? contractor.isActive : true
            });
        } else {
            setFormData({ 
                firstName: '', 
                lastName: '', 
                mobileNumber: '', 
                businessName: '',
                businessType: 'Proprietorship',
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
            if (currentContractor) {
                // Update contractor
                await contractorManagementAPI.updateContractor(currentContractor._id, formData);
                toast.success('Contractor updated successfully');
            } else {
                // Create contractor
                await contractorManagementAPI.createContractor(formData);
                toast.success('Contractor created successfully');
            }
            setIsModalOpen(false);
            fetchContractors();
        } catch (error) {
            console.error('Error saving contractor:', error);
            toast.error(error.response?.data?.message || 'Failed to save contractor');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this contractor?')) {
            try {
                await contractorManagementAPI.deleteContractor(id);
                toast.success('Contractor deleted successfully');
                fetchContractors();
            } catch (error) {
                console.error('Error deleting contractor:', error);
                toast.error('Failed to delete contractor');
            }
        }
    };

    const openActionModal = async (type, contractor) => {
        console.log('[INFO] Opening action modal:', type, 'for contractor:', contractor._id);
        setActionModal({ type, userId: contractor._id, data: [] });
        setLoading(true);

        try {
            let response;
            if (type === 'user') {
                console.log('[INFO] Calling getContractorUserRequests for contractor:', contractor._id);
                response = await contractorManagementAPI.getContractorUserRequests(contractor._id);
                console.log('[INFO] Full API Response (User Requests):', JSON.stringify(response, null, 2));
                
                // Backend returns response.data.requests
                const requests = response.data.requests || [];
                console.log('[SUCCESS] Setting modal data with', requests.length, 'user requests');
                setActionModal({ type, userId: contractor._id, data: requests });
            } else if (type === 'labour') {
                console.log('[INFO] Calling getContractorLabourRequests for contractor:', contractor._id);
                response = await contractorManagementAPI.getContractorLabourRequests(contractor._id);
                console.log('[INFO] Full API Response (Labour Requests):', JSON.stringify(response, null, 2));
                
                // Backend returns response.data.requests
                const requests = response.data.requests || [];
                console.log('[SUCCESS] Setting modal data with', requests.length, 'labour requests');
                setActionModal({ type, userId: contractor._id, data: requests });
            } else if (type === 'feedback') {
                response = await contractorManagementAPI.getContractorFeedbacks(contractor._id);
                setActionModal({ type, userId: contractor._id, data: response.data.feedbacks || [] });

                // Clear the count locally so badge disappears immediately
                setContractors(prev => prev.map(c => c._id === contractor._id ? { ...c, unreadFeedbackCount: 0 } : c));
                setFilteredContractors(prev => prev.map(c => c._id === contractor._id ? { ...c, unreadFeedbackCount: 0 } : c));

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

    const getFullName = (contractor) => {
        const firstName = contractor.user?.firstName || contractor.firstName || '';
        const lastName = contractor.user?.lastName || contractor.lastName || '';
        return `${firstName} ${lastName}`.trim() || 'N/A';
    };

    return (
        <div className="management-container">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h2 style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <Briefcase color="#3b82f6" /> Contractor Management
                </h2>
                <button className="crud-btn btn-add" onClick={() => handleOpenModal()}>
                    <Plus size={18} style={{ marginRight: '8px' }} /> Add Contractor
                </button>
            </div>

            {/* Search Bar */}
            <div style={{ marginBottom: '20px' }}>
                <div className="admin-search-bar" style={{ maxWidth: '400px' }}>
                    <Search size={18} color="#6b7280" />
                    <input 
                        type="text" 
                        placeholder="Search contractors..." 
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
                            <th>Company</th>
                            <th>Phone</th>
                            <th>City</th>
                            <th>Status</th>
                            <th>Contractor Action</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredContractors.map(contractor => (
                            <tr key={contractor._id} className={highlightId === contractor._id ? 'highlight-row' : ''}>
                                <td>{getFullName(contractor)}</td>
                                <td>{contractor.businessName || 'N/A'}</td>
                                <td>{contractor.user?.mobileNumber || contractor.mobileNumber || 'N/A'}</td>
                                <td>{contractor.user?.city || contractor.city || 'N/A'}</td>
                                <td>
                                    <span className={`status-badge ${contractor.isActive ? 'status-completed' : 'status-pending'}`}>
                                        {contractor.isActive ? 'Active' : 'Inactive'}
                                    </span>
                                </td>
                                <td>
                                    <div style={{ display: 'flex', gap: '10px' }}>
                                        <button className="action-icon-btn user" title="User Action" onClick={() => openActionModal('user', contractor)}>
                                            <Users size={18} />
                                        </button>
                                        <button className="action-icon-btn labour" title="Labour Action" onClick={() => openActionModal('labour', contractor)}>
                                            <HardHat size={18} />
                                        </button>
                                        <button 
                                            className="action-icon-btn feedback" 
                                            title="Feedback" 
                                            onClick={() => openActionModal('feedback', contractor)}
                                            style={{ position: 'relative' }}
                                        >
                                            <MessageSquare size={18} />
                                            {contractor.unreadFeedbackCount > 0 && (
                                                <span className="feedback-notif-badge">{contractor.unreadFeedbackCount}</span>
                                            )}
                                        </button>
                                    </div>
                                </td>
                                <td>
                                    <button className="crud-btn btn-edit" onClick={() => handleOpenModal(contractor)}>
                                        <Edit size={16} />
                                    </button>
                                    <button className="crud-btn btn-delete" onClick={() => handleDelete(contractor._id)}>
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
                        <div className="chat-header" style={{ background: '#3b82f6' }}>
                            <span>{currentContractor ? 'Edit Contractor' : 'Add New Contractor'}</span>
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
                                <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem' }}>Company Name</label>
                                <input
                                    type="text"
                                    className="admin-search-input"
                                    style={{ width: '100%', border: '1px solid #ddd', borderRadius: '8px', padding: '10px' }}
                                    value={formData.businessName}
                                    onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
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
                                    disabled={currentContractor}
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
                            <button type="submit" className="crud-btn btn-add" style={{ width: '100%', margin: 0, background: '#3b82f6' }} disabled={loading}>
                                {loading ? 'Saving...' : (currentContractor ? 'Update Contractor' : 'Create Contractor')}
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* Action Modals - Same as LabourManagement */}
            {actionModal.type && (
                <div className="modal-overlay">
                    <div className="admin-modal mobile-style-modal large-modal">
                        <div className="chat-header" style={{ 
                            background: actionModal.type === 'feedback' ? '#10b981' : 
                                       actionModal.type === 'labour' ? '#f97316' : '#3b82f6' 
                        }}>
                            <span>
                                {actionModal.type === 'user' && 'User Requests'}
                                {actionModal.type === 'labour' && 'Labour Requests'}
                                {actionModal.type === 'feedback' && 'Contractor Feedbacks'}
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
                                ) : actionModal.type === 'labour' ? (
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
                                                        <strong>Labour:</strong> {request.labourName}
                                                    </div>
                                                    <div className="detail-row">
                                                        <strong>Skill:</strong> {request.labourSkill}
                                                    </div>
                                                    <div className="detail-row">
                                                        <strong>Experience:</strong> {request.labourExperience}
                                                    </div>
                                                    <div className="detail-row">
                                                        <strong>Phone:</strong> {request.labourPhone}
                                                    </div>
                                                    <div className="detail-row">
                                                        <strong>City:</strong> {request.labourCity}
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

export default ContractorManagement;
