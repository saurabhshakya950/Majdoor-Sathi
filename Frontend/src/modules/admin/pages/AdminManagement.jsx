import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Key, Search, UserCog, Shield, Users as UsersIcon, Briefcase, HardHat, X } from 'lucide-react';
import { adminManagementAPI } from '../../../services/admin.api';
import toast from 'react-hot-toast';

const AdminManagement = () => {
    const [admins, setAdmins] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterRole, setFilterRole] = useState('');
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showPasswordModal, setShowPasswordModal] = useState(false);
    const [selectedAdmin, setSelectedAdmin] = useState(null);
    const [stats, setStats] = useState(null);

    // Form states
    const [formData, setFormData] = useState({
        username: '',
        password: '',
        name: '',
        email: '',
        phone: '',
        role: 'ADMIN_USER'
    });

    const [newPassword, setNewPassword] = useState('');

    useEffect(() => {
        fetchAdmins();
        fetchStats();
    }, [searchQuery, filterRole]);

    const fetchAdmins = async () => {
        try {
            setLoading(true);
            const params = {};
            if (searchQuery) params.search = searchQuery;
            if (filterRole) params.role = filterRole;

            const response = await adminManagementAPI.getAllAdmins(params);
            if (response.success) {
                setAdmins(response.data.admins);
            }
        } catch (error) {
            console.error('Error fetching admins:', error);
            toast.error('Failed to fetch admins');
        } finally {
            setLoading(false);
        }
    };

    const fetchStats = async () => {
        try {
            const response = await adminManagementAPI.getAdminStats();
            if (response.success) {
                setStats(response.data.stats);
            }
        } catch (error) {
            console.error('Error fetching stats:', error);
        }
    };

    const handleCreateAdmin = async (e) => {
        e.preventDefault();
        try {
            const response = await adminManagementAPI.createAdmin(formData);
            if (response.success) {
                toast.success('Admin created successfully!');
                setShowCreateModal(false);
                resetForm();
                fetchAdmins();
                fetchStats();
            }
        } catch (error) {
            console.error('Error creating admin:', error);
            toast.error(error.response?.data?.message || 'Failed to create admin');
        }
    };

    const handleUpdateAdmin = async (e) => {
        e.preventDefault();
        try {
            const response = await adminManagementAPI.updateAdmin(selectedAdmin._id, formData);
            if (response.success) {
                toast.success('Admin updated successfully!');
                setShowEditModal(false);
                resetForm();
                fetchAdmins();
            }
        } catch (error) {
            console.error('Error updating admin:', error);
            toast.error(error.response?.data?.message || 'Failed to update admin');
        }
    };

    const handleDeleteAdmin = async (id, username) => {
        if (!window.confirm(`Are you sure you want to delete admin "${username}"?`)) return;

        try {
            const response = await adminManagementAPI.deleteAdmin(id);
            if (response.success) {
                toast.success('Admin deleted successfully!');
                fetchAdmins();
                fetchStats();
            }
        } catch (error) {
            console.error('Error deleting admin:', error);
            toast.error(error.response?.data?.message || 'Failed to delete admin');
        }
    };

    const handleResetPassword = async (e) => {
        e.preventDefault();
        try {
            const response = await adminManagementAPI.resetAdminPassword(selectedAdmin._id, newPassword);
            if (response.success) {
                toast.success('Password reset successfully!');
                setShowPasswordModal(false);
                setNewPassword('');
                setSelectedAdmin(null);
            }
        } catch (error) {
            console.error('Error resetting password:', error);
            toast.error(error.response?.data?.message || 'Failed to reset password');
        }
    };

    const openEditModal = (admin) => {
        setSelectedAdmin(admin);
        setFormData({
            username: admin.username,
            password: '',
            name: admin.name,
            email: admin.email,
            phone: admin.phone,
            role: admin.role
        });
        setShowEditModal(true);
    };

    const openPasswordModal = (admin) => {
        setSelectedAdmin(admin);
        setNewPassword('');
        setShowPasswordModal(true);
    };

    const resetForm = () => {
        setFormData({
            username: '',
            password: '',
            name: '',
            email: '',
            phone: '',
            role: 'ADMIN_USER'
        });
        setSelectedAdmin(null);
    };

    const getRoleIcon = (role) => {
        switch (role) {
            case 'SUPER_ADMIN': return <Shield size={16} />;
            case 'ADMIN_USER': return <UsersIcon size={16} />;
            case 'ADMIN_LABOUR': return <HardHat size={16} />;
            case 'ADMIN_CONTRACTOR': return <Briefcase size={16} />;
            default: return <UserCog size={16} />;
        }
    };

    const getRoleBadgeColor = (role) => {
        switch (role) {
            case 'SUPER_ADMIN': return 'bg-purple-100 text-purple-700';
            case 'ADMIN_USER': return 'bg-blue-100 text-blue-700';
            case 'ADMIN_LABOUR': return 'bg-orange-100 text-orange-700';
            case 'ADMIN_CONTRACTOR': return 'bg-green-100 text-green-700';
            default: return 'bg-gray-100 text-gray-700';
        }
    };

    return (
        <div>
            {/* Header */}
            <div style={{ marginBottom: '24px' }}>
                <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '8px' }}>Admin Management</h1>
                <p style={{ color: '#6b7280', fontSize: '0.9rem' }}>Manage admin users and their permissions</p>
            </div>

            {/* Stats Cards */}
            {stats && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }}>
                    <div style={{ background: 'white', padding: '20px', borderRadius: '12px', border: '1px solid #e5e7eb' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <div style={{ background: '#eff6ff', padding: '12px', borderRadius: '10px' }}>
                                <UserCog size={24} color="#3b82f6" />
                            </div>
                            <div>
                                <p style={{ fontSize: '0.85rem', color: '#6b7280', margin: 0 }}>Total Admins</p>
                                <p style={{ fontSize: '1.5rem', fontWeight: 700, margin: 0 }}>{stats.total}</p>
                            </div>
                        </div>
                    </div>
                    <div style={{ background: 'white', padding: '20px', borderRadius: '12px', border: '1px solid #e5e7eb' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <div style={{ background: '#ecfdf5', padding: '12px', borderRadius: '10px' }}>
                                <Shield size={24} color="#10b981" />
                            </div>
                            <div>
                                <p style={{ fontSize: '0.85rem', color: '#6b7280', margin: 0 }}>Active</p>
                                <p style={{ fontSize: '1.5rem', fontWeight: 700, margin: 0, color: '#10b981' }}>{stats.active}</p>
                            </div>
                        </div>
                    </div>
                    <div style={{ background: 'white', padding: '20px', borderRadius: '12px', border: '1px solid #e5e7eb' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <div style={{ background: '#fef2f2', padding: '12px', borderRadius: '10px' }}>
                                <X size={24} color="#ef4444" />
                            </div>
                            <div>
                                <p style={{ fontSize: '0.85rem', color: '#6b7280', margin: 0 }}>Inactive</p>
                                <p style={{ fontSize: '1.5rem', fontWeight: 700, margin: 0, color: '#ef4444' }}>{stats.inactive}</p>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Filters and Actions */}
            <div style={{ background: 'white', padding: '20px', borderRadius: '12px', marginBottom: '20px', border: '1px solid #e5e7eb' }}>
                <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', gap: '12px', flex: 1, flexWrap: 'wrap' }}>
                        <div style={{ position: 'relative', flex: '1', minWidth: '200px' }}>
                            <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
                            <input
                                type="text"
                                placeholder="Search by username, name, or email..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                style={{
                                    width: '100%',
                                    padding: '10px 10px 10px 40px',
                                    border: '1px solid #e5e7eb',
                                    borderRadius: '8px',
                                    fontSize: '0.9rem'
                                }}
                            />
                        </div>
                        <select
                            value={filterRole}
                            onChange={(e) => setFilterRole(e.target.value)}
                            style={{
                                padding: '10px 16px',
                                border: '1px solid #e5e7eb',
                                borderRadius: '8px',
                                fontSize: '0.9rem',
                                minWidth: '150px'
                            }}
                        >
                            <option value="">All Roles</option>
                            <option value="SUPER_ADMIN">Super Admin</option>
                            <option value="ADMIN_USER">User Admin</option>
                            <option value="ADMIN_LABOUR">Labour Admin</option>
                            <option value="ADMIN_CONTRACTOR">Contractor Admin</option>
                        </select>
                    </div>
                    <button
                        onClick={() => setShowCreateModal(true)}
                        className="crud-btn btn-add"
                        style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}
                    >
                        <Plus size={18} />
                        Create Admin
                    </button>
                </div>
            </div>

            {/* Admins Table */}
            <div style={{ background: 'white', borderRadius: '12px', overflow: 'hidden', border: '1px solid #e5e7eb' }}>
                {loading ? (
                    <div style={{ padding: '40px', textAlign: 'center', color: '#6b7280' }}>Loading admins...</div>
                ) : admins.length === 0 ? (
                    <div style={{ padding: '40px', textAlign: 'center', color: '#6b7280' }}>No admins found</div>
                ) : (
                    <table className="admin-table" style={{ width: '100%' }}>
                        <thead>
                            <tr>
                                <th>Admin Details</th>
                                <th>Contact</th>
                                <th>Role</th>
                                <th>Status</th>
                                <th>Last Login</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {admins.map((admin) => (
                                <tr key={admin._id}>
                                    <td>
                                        <div>
                                            <div style={{ fontWeight: 600, marginBottom: '4px' }}>{admin.name}</div>
                                            <div style={{ fontSize: '0.85rem', color: '#6b7280' }}>@{admin.username}</div>
                                        </div>
                                    </td>
                                    <td>
                                        <div style={{ fontSize: '0.85rem' }}>
                                            <div>{admin.email}</div>
                                            <div style={{ color: '#6b7280' }}>{admin.phone}</div>
                                        </div>
                                    </td>
                                    <td>
                                        <span className={`status-badge ${getRoleBadgeColor(admin.role)}`} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                                            {getRoleIcon(admin.role)}
                                            {admin.role.replace('ADMIN_', '').replace('_', ' ')}
                                        </span>
                                    </td>
                                    <td>
                                        <span className={`status-badge ${admin.isActive ? 'status-completed' : 'status-cancelled'}`}>
                                            {admin.isActive ? 'Active' : 'Inactive'}
                                        </span>
                                    </td>
                                    <td style={{ fontSize: '0.85rem', color: '#6b7280' }}>
                                        {admin.lastLogin ? new Date(admin.lastLogin).toLocaleDateString() : 'Never'}
                                    </td>
                                    <td>
                                        <div style={{ display: 'flex', gap: '8px' }}>
                                            <button
                                                onClick={() => openEditModal(admin)}
                                                className="crud-btn btn-edit"
                                                title="Edit Admin"
                                            >
                                                <Edit size={16} />
                                            </button>
                                            <button
                                                onClick={() => openPasswordModal(admin)}
                                                className="crud-btn"
                                                style={{ background: '#f59e0b', color: 'white' }}
                                                title="Reset Password"
                                            >
                                                <Key size={16} />
                                            </button>
                                            <button
                                                onClick={() => handleDeleteAdmin(admin._id, admin.username)}
                                                className="crud-btn btn-delete"
                                                title="Delete Admin"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {/* Create Admin Modal */}
            {showCreateModal && (
                <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '500px' }}>
                        <div className="modal-header">
                            <h2>Create New Admin</h2>
                            <button onClick={() => setShowCreateModal(false)} className="modal-close">
                                <X size={20} />
                            </button>
                        </div>
                        <form onSubmit={handleCreateAdmin}>
                            <div className="modal-body">
                                <div className="form-group">
                                    <label>Username *</label>
                                    <input
                                        type="text"
                                        value={formData.username}
                                        onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                                        required
                                        placeholder="Enter username"
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Password *</label>
                                    <input
                                        type="password"
                                        value={formData.password}
                                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                        required
                                        minLength={6}
                                        placeholder="Enter password (min 6 characters)"
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Full Name *</label>
                                    <input
                                        type="text"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        required
                                        placeholder="Enter full name"
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Email *</label>
                                    <input
                                        type="email"
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                        required
                                        placeholder="Enter email"
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Phone *</label>
                                    <input
                                        type="tel"
                                        value={formData.phone}
                                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                        required
                                        pattern="[0-9]{10}"
                                        placeholder="Enter 10-digit phone number"
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Role *</label>
                                    <select
                                        value={formData.role}
                                        onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                                        required
                                    >
                                        <option value="ADMIN_USER">User Admin</option>
                                        <option value="ADMIN_LABOUR">Labour Admin</option>
                                        <option value="ADMIN_CONTRACTOR">Contractor Admin</option>
                                        <option value="SUPER_ADMIN">Super Admin</option>
                                    </select>
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button type="button" onClick={() => setShowCreateModal(false)} className="crud-btn">
                                    Cancel
                                </button>
                                <button type="submit" className="crud-btn btn-add">
                                    Create Admin
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Edit Admin Modal */}
            {showEditModal && (
                <div className="modal-overlay" onClick={() => setShowEditModal(false)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '500px' }}>
                        <div className="modal-header">
                            <h2>Edit Admin</h2>
                            <button onClick={() => setShowEditModal(false)} className="modal-close">
                                <X size={20} />
                            </button>
                        </div>
                        <form onSubmit={handleUpdateAdmin}>
                            <div className="modal-body">
                                <div className="form-group">
                                    <label>Username</label>
                                    <input
                                        type="text"
                                        value={formData.username}
                                        disabled
                                        style={{ background: '#f3f4f6', cursor: 'not-allowed' }}
                                    />
                                    <small style={{ color: '#6b7280' }}>Username cannot be changed</small>
                                </div>
                                <div className="form-group">
                                    <label>Full Name *</label>
                                    <input
                                        type="text"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Email *</label>
                                    <input
                                        type="email"
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Phone *</label>
                                    <input
                                        type="tel"
                                        value={formData.phone}
                                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                        required
                                        pattern="[0-9]{10}"
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Role *</label>
                                    <select
                                        value={formData.role}
                                        onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                                        required
                                    >
                                        <option value="ADMIN_USER">User Admin</option>
                                        <option value="ADMIN_LABOUR">Labour Admin</option>
                                        <option value="ADMIN_CONTRACTOR">Contractor Admin</option>
                                        <option value="SUPER_ADMIN">Super Admin</option>
                                    </select>
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button type="button" onClick={() => setShowEditModal(false)} className="crud-btn">
                                    Cancel
                                </button>
                                <button type="submit" className="crud-btn btn-edit">
                                    Update Admin
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Reset Password Modal */}
            {showPasswordModal && (
                <div className="modal-overlay" onClick={() => setShowPasswordModal(false)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '400px' }}>
                        <div className="modal-header">
                            <h2>Reset Password</h2>
                            <button onClick={() => setShowPasswordModal(false)} className="modal-close">
                                <X size={20} />
                            </button>
                        </div>
                        <form onSubmit={handleResetPassword}>
                            <div className="modal-body">
                                <p style={{ marginBottom: '16px', color: '#6b7280' }}>
                                    Reset password for <strong>{selectedAdmin?.username}</strong>
                                </p>
                                <div className="form-group">
                                    <label>New Password *</label>
                                    <input
                                        type="password"
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)}
                                        required
                                        minLength={6}
                                        placeholder="Enter new password (min 6 characters)"
                                    />
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button type="button" onClick={() => setShowPasswordModal(false)} className="crud-btn">
                                    Cancel
                                </button>
                                <button type="submit" className="crud-btn" style={{ background: '#f59e0b', color: 'white' }}>
                                    Reset Password
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminManagement;
