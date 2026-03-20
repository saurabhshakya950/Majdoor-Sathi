import React, { useState, useEffect } from 'react';
import { Send, Plus, Edit, Trash2, Users, Clock, CheckCircle, XCircle, AlertCircle, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { broadcastAPI } from '../../../services/admin.api';
import './AdminDashboard.css';

const BroadcastManagement = () => {
    const [broadcasts, setBroadcasts] = useState([]);
    const [loading, setLoading] = useState(false);
    const [stats, setStats] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [modalMode, setModalMode] = useState('create');
    const [selectedBroadcast, setSelectedBroadcast] = useState(null);
    const [filterStatus, setFilterStatus] = useState('');
    const [filterAudience, setFilterAudience] = useState('');

    const [formData, setFormData] = useState({
        title: '',
        message: '',
        targetAudience: 'ALL',
        priority: 'MEDIUM',
        scheduledAt: '',
        expiresAt: ''
    });

    useEffect(() => {
        fetchBroadcasts();
        fetchStats();
    }, [filterStatus, filterAudience]);

    const fetchBroadcasts = async () => {
        try {
            setLoading(true);
            const params = {};
            if (filterStatus) params.status = filterStatus;
            if (filterAudience) params.targetAudience = filterAudience;

            const response = await broadcastAPI.getAll(params);
            setBroadcasts(response.data.broadcasts || []);
        } catch (error) {
            console.error('Error fetching broadcasts:', error);
            toast.error('Failed to load broadcasts');
        } finally {
            setLoading(false);
        }
    };

    const fetchStats = async () => {
        try {
            const response = await broadcastAPI.getStats();
            setStats(response.data.stats);
        } catch (error) {
            console.error('Error fetching stats:', error);
        }
    };

    const handleOpenModal = (mode, broadcast = null) => {
        setModalMode(mode);
        setSelectedBroadcast(broadcast);

        if (mode === 'edit' && broadcast) {
            setFormData({
                title: broadcast.title,
                message: broadcast.message,
                targetAudience: broadcast.targetAudience,
                priority: broadcast.priority,
                scheduledAt: broadcast.scheduledAt ? new Date(broadcast.scheduledAt).toISOString().slice(0, 16) : '',
                expiresAt: broadcast.expiresAt ? new Date(broadcast.expiresAt).toISOString().slice(0, 16) : ''
            });
        } else {
            setFormData({
                title: '',
                message: '',
                targetAudience: 'ALL',
                priority: 'MEDIUM',
                scheduledAt: '',
                expiresAt: ''
            });
        }

        setShowModal(true);
    };

    const handleCloseModal = () => {
        setShowModal(false);
        setSelectedBroadcast(null);
        setFormData({
            title: '',
            message: '',
            targetAudience: 'ALL',
            priority: 'MEDIUM',
            scheduledAt: '',
            expiresAt: ''
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.title || !formData.message) {
            toast.error('Title and message are required');
            return;
        }

        try {
            setLoading(true);

            const submitData = {
                ...formData,
                scheduledAt: formData.scheduledAt || null,
                expiresAt: formData.expiresAt || null
            };

            console.log('Submitting broadcast:', submitData);

            if (modalMode === 'create') {
                const response = await broadcastAPI.create(submitData);
                console.log('Create response:', response);
                toast.success('Broadcast created successfully');
            } else {
                const response = await broadcastAPI.update(selectedBroadcast._id, submitData);
                console.log('Update response:', response);
                toast.success('Broadcast updated successfully');
            }

            handleCloseModal();
            fetchBroadcasts();
            fetchStats();
        } catch (error) {
            console.error('Error saving broadcast:', error);
            console.error('Error response:', error.response);
            const errorMessage = error.response?.data?.message || error.message || 'Failed to save broadcast';
            toast.error(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this broadcast?')) {
            return;
        }

        try {
            setLoading(true);
            await broadcastAPI.delete(id);
            toast.success('Broadcast deleted successfully');
            fetchBroadcasts();
            fetchStats();
        } catch (error) {
            console.error('Error deleting broadcast:', error);
            toast.error(error.response?.data?.message || 'Failed to delete broadcast');
        } finally {
            setLoading(false);
        }
    };

    const handleSend = async (id) => {
        if (!window.confirm('Are you sure you want to send this broadcast? This action cannot be undone.')) {
            return;
        }

        try {
            setLoading(true);
            const response = await broadcastAPI.send(id);
            toast.success(response.message || 'Broadcast sent successfully');
            fetchBroadcasts();
            fetchStats();
        } catch (error) {
            console.error('Error sending broadcast:', error);
            toast.error(error.response?.data?.message || 'Failed to send broadcast');
        } finally {
            setLoading(false);
        }
    };

    const getStatusBadge = (status) => {
        const badges = {
            DRAFT: { color: 'gray', icon: <Edit size={14} />, text: 'Draft' },
            SCHEDULED: { color: 'blue', icon: <Clock size={14} />, text: 'Scheduled' },
            SENDING: { color: 'orange', icon: <Clock size={14} />, text: 'Sending...' },
            SENT: { color: 'green', icon: <CheckCircle size={14} />, text: 'Sent' },
            FAILED: { color: 'red', icon: <XCircle size={14} />, text: 'Failed' }
        };

        const badge = badges[status] || badges.DRAFT;

        return (
            <span className={`status-badge status-${badge.color}`}>
                {badge.icon} {badge.text}
            </span>
        );
    };

    const getPriorityBadge = (priority) => {
        const colors = {
            LOW: 'gray',
            MEDIUM: 'blue',
            HIGH: 'orange',
            URGENT: 'red'
        };

        return (
            <span className={`priority-badge priority-${colors[priority]}`}>
                {priority}
            </span>
        );
    };

    const getAudienceBadge = (audience) => {
        const badges = {
            ALL: { icon: <Users size={14} />, text: 'All Users' },
            USERS: { icon: <Users size={14} />, text: 'Users' },
            LABOUR: { icon: <Users size={14} />, text: 'Labour' },
            CONTRACTORS: { icon: <Users size={14} />, text: 'Contractors' }
        };

        const badge = badges[audience] || badges.ALL;

        return (
            <span className="audience-badge">
                {badge.icon} {badge.text}
            </span>
        );
    };

    return (
        <div className="broadcast-management-container">
            <div className="broadcast-page-header">
                <div className="header-content">
                    <h1 className="page-title">Broadcast Management</h1>
                    <p className="page-subtitle">Send targeted notifications to users, labour, and contractors</p>
                </div>
                <button className="create-broadcast-btn" onClick={() => handleOpenModal('create')}>
                    <Plus size={20} /> Create Broadcast
                </button>
            </div>

            {/* Statistics Cards */}
            {stats && (
                <div className="broadcast-stats-grid">
                    <div className="broadcast-stat-card">
                        <div className="stat-icon-wrapper blue">
                            <Send size={28} />
                        </div>
                        <div className="stat-details">
                            <p className="stat-label">Total Broadcasts</p>
                            <h2 className="stat-value">{stats.total}</h2>
                        </div>
                    </div>
                    <div className="broadcast-stat-card">
                        <div className="stat-icon-wrapper green">
                            <CheckCircle size={28} />
                        </div>
                        <div className="stat-details">
                            <p className="stat-label">Sent</p>
                            <h2 className="stat-value">{stats.sent}</h2>
                        </div>
                    </div>
                    <div className="broadcast-stat-card">
                        <div className="stat-icon-wrapper orange">
                            <Clock size={28} />
                        </div>
                        <div className="stat-details">
                            <p className="stat-label">Scheduled</p>
                            <h2 className="stat-value">{stats.scheduled}</h2>
                        </div>
                    </div>
                    <div className="broadcast-stat-card">
                        <div className="stat-icon-wrapper purple">
                            <Users size={28} />
                        </div>
                        <div className="stat-details">
                            <p className="stat-label">Total Delivered</p>
                            <h2 className="stat-value">{stats.totalDelivered}</h2>
                        </div>
                    </div>
                </div>
            )}

            {/* Filters */}
            <div className="broadcast-filters-section">
                <div className="filters-wrapper">
                    <div className="filter-group">
                        <label className="filter-label">Status</label>
                        <select
                            value={filterStatus}
                            onChange={(e) => setFilterStatus(e.target.value)}
                            className="broadcast-filter-select"
                        >
                            <option value="">All Status</option>
                            <option value="DRAFT">Draft</option>
                            <option value="SCHEDULED">Scheduled</option>
                            <option value="SENT">Sent</option>
                            <option value="FAILED">Failed</option>
                        </select>
                    </div>

                    <div className="filter-group">
                        <label className="filter-label">Audience</label>
                        <select
                            value={filterAudience}
                            onChange={(e) => setFilterAudience(e.target.value)}
                            className="broadcast-filter-select"
                        >
                            <option value="">All Audiences</option>
                            <option value="ALL">All Users</option>
                            <option value="USERS">Users</option>
                            <option value="LABOUR">Labour</option>
                            <option value="CONTRACTORS">Contractors</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Broadcasts List */}
            <div className="broadcasts-list-container">
                {loading && broadcasts.length === 0 ? (
                    <div className="broadcast-loading-state">
                        <div className="loading-spinner"></div>
                        <p>Loading broadcasts...</p>
                    </div>
                ) : broadcasts.length === 0 ? (
                    <div className="broadcast-empty-state">
                        <div className="empty-icon">
                            <AlertCircle size={64} />
                        </div>
                        <h3>No broadcasts found</h3>
                        <p>Create your first broadcast to start sending notifications</p>
                        <button className="create-broadcast-btn" onClick={() => handleOpenModal('create')}>
                            <Plus size={20} /> Create First Broadcast
                        </button>
                    </div>
                ) : (
                    <div className="broadcasts-grid">
                        {broadcasts.map((broadcast) => (
                            <div key={broadcast._id} className="broadcast-item-card">
                                <div className="broadcast-card-header">
                                    <div className="broadcast-title-section">
                                        <h3 className="broadcast-title">{broadcast.title}</h3>
                                        <div className="broadcast-badges">
                                            {getStatusBadge(broadcast.status)}
                                            {getPriorityBadge(broadcast.priority)}
                                            {getAudienceBadge(broadcast.targetAudience)}
                                        </div>
                                    </div>
                                    <div className="broadcast-card-actions">
                                        {/* Show Send and Edit only if not already sent or sending */}
                                        {broadcast.status !== 'SENT' && broadcast.status !== 'SENDING' && (
                                            <>
                                                <button
                                                    className="action-btn send-btn"
                                                    onClick={() => handleSend(broadcast._id)}
                                                    title="Send Now"
                                                    disabled={loading}
                                                >
                                                    <Send size={18} />
                                                </button>
                                                <button
                                                    className="action-btn edit-btn"
                                                    onClick={() => handleOpenModal('edit', broadcast)}
                                                    title="Edit"
                                                >
                                                    <Edit size={18} />
                                                </button>
                                            </>
                                        )}
                                        
                                        {/* Always show delete button to manage history */}
                                        <button
                                            className="action-btn delete-btn"
                                            onClick={() => handleDelete(broadcast._id)}
                                            title="Delete"
                                            disabled={loading}
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                </div>

                                <p className="broadcast-message-text">{broadcast.message}</p>

                                <div className="broadcast-card-footer">
                                    <div className="broadcast-info-row">
                                        <div className="info-item">
                                            <Users size={16} />
                                            <span>{broadcast.recipientCount} Recipients</span>
                                        </div>
                                        {broadcast.status === 'SENT' && (
                                            <>
                                                <div className="info-item success">
                                                    <CheckCircle size={16} />
                                                    <span>{broadcast.deliveredCount} Delivered</span>
                                                </div>
                                                {broadcast.failedCount > 0 && (
                                                    <div className="info-item error">
                                                        <XCircle size={16} />
                                                        <span>{broadcast.failedCount} Failed</span>
                                                    </div>
                                                )}
                                            </>
                                        )}
                                    </div>
                                    <div className="broadcast-timestamp">
                                        {broadcast.sentAt && (
                                            <span>Sent: {new Date(broadcast.sentAt).toLocaleString()}</span>
                                        )}
                                        {broadcast.scheduledAt && broadcast.status === 'SCHEDULED' && (
                                            <span>Scheduled: {new Date(broadcast.scheduledAt).toLocaleString()}</span>
                                        )}
                                        {!broadcast.sentAt && !broadcast.scheduledAt && (
                                            <span>Created: {new Date(broadcast.createdAt).toLocaleString()}</span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Create/Edit Modal */}
            {showModal && (
                <div className="broadcast-modal-overlay" onClick={handleCloseModal}>
                    <div className="broadcast-modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="broadcast-modal-header">
                            <h2>{modalMode === 'create' ? 'Create New Broadcast' : 'Edit Broadcast'}</h2>
                            <button className="broadcast-modal-close" onClick={handleCloseModal}>
                                <X size={24} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="broadcast-modal-form">
                            <div className="broadcast-form-group">
                                <label className="broadcast-form-label">
                                    Title <span className="required">*</span>
                                </label>
                                <input
                                    type="text"
                                    className="broadcast-form-input"
                                    value={formData.title}
                                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                    placeholder="Enter broadcast title"
                                    required
                                    maxLength={200}
                                />
                            </div>

                            <div className="broadcast-form-group">
                                <label className="broadcast-form-label">
                                    Message <span className="required">*</span>
                                </label>
                                <textarea
                                    className="broadcast-form-textarea"
                                    value={formData.message}
                                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                                    placeholder="Enter broadcast message"
                                    required
                                    rows={6}
                                    maxLength={2000}
                                />
                                <small className="character-count">{formData.message.length}/2000 characters</small>
                            </div>

                            <div className="broadcast-form-row">
                                <div className="broadcast-form-group">
                                    <label className="broadcast-form-label">
                                        Target Audience <span className="required">*</span>
                                    </label>
                                    <select
                                        className="broadcast-form-select"
                                        value={formData.targetAudience}
                                        onChange={(e) => setFormData({ ...formData, targetAudience: e.target.value })}
                                        required
                                    >
                                        <option value="ALL">All Users</option>
                                        <option value="USERS">Users Only</option>
                                        <option value="LABOUR">Labour Only</option>
                                        <option value="CONTRACTORS">Contractors Only</option>
                                    </select>
                                </div>

                                <div className="broadcast-form-group">
                                    <label className="broadcast-form-label">
                                        Priority <span className="required">*</span>
                                    </label>
                                    <select
                                        className="broadcast-form-select"
                                        value={formData.priority}
                                        onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                                        required
                                    >
                                        <option value="LOW">Low</option>
                                        <option value="MEDIUM">Medium</option>
                                        <option value="HIGH">High</option>
                                        <option value="URGENT">Urgent</option>
                                    </select>
                                </div>
                            </div>

                            <div className="broadcast-form-row">
                                <div className="broadcast-form-group">
                                    <label className="broadcast-form-label">Schedule At (Optional)</label>
                                    <input
                                        type="datetime-local"
                                        className="broadcast-form-input"
                                        value={formData.scheduledAt}
                                        onChange={(e) => setFormData({ ...formData, scheduledAt: e.target.value })}
                                    />
                                </div>

                                <div className="broadcast-form-group">
                                    <label className="broadcast-form-label">Expires At (Optional)</label>
                                    <input
                                        type="datetime-local"
                                        className="broadcast-form-input"
                                        value={formData.expiresAt}
                                        onChange={(e) => setFormData({ ...formData, expiresAt: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="broadcast-modal-actions">
                                <button type="button" className="broadcast-btn-cancel" onClick={handleCloseModal}>
                                    Cancel
                                </button>
                                <button type="submit" className="broadcast-btn-submit" disabled={loading}>
                                    {loading ? 'Saving...' : modalMode === 'create' ? 'Create Broadcast' : 'Update Broadcast'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default BroadcastManagement;
