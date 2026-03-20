import React, { useState, useEffect } from 'react';
import { Image, Plus, Save, Trash2, Edit, Eye, EyeOff, X } from 'lucide-react';
import './AdminDashboard.css';
import { bannerAPI } from '../../../services/admin.api';

const BannerSection = () => {
    const [formData, setFormData] = useState({
        badgeText: '',
        title: '',
        subtitle: '',
        description: '',
        price: '',
        priceUnit: '',
        discount: '',
        backgroundImage: '',
        targetAudience: 'ALL',
        priority: 0
    });

    const [banners, setBanners] = useState([]);
    const [loading, setLoading] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [showForm, setShowForm] = useState(false);
    const [imagePreview, setImagePreview] = useState('');

    // Fetch banners on component mount
    useEffect(() => {
        fetchBanners();
    }, []);

    const fetchBanners = async () => {
        try {
            setLoading(true);
            const response = await bannerAPI.getAll({ limit: 50 });
            if (response.success) {
                setBanners(response.data.banners);
            }
        } catch (error) {
            console.error('Error fetching banners:', error);
            alert('Failed to fetch banners');
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleImageChange = (e) => {
        const { value } = e.target;
        setFormData(prev => ({
            ...prev,
            backgroundImage: value
        }));
        setImagePreview(value);
    };

    const handleFileUpload = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                const base64String = reader.result;
                setFormData(prev => ({
                    ...prev,
                    backgroundImage: base64String
                }));
                setImagePreview(base64String);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        try {
            setLoading(true);
            
            if (editingId) {
                // Update existing banner
                const response = await bannerAPI.update(editingId, formData);
                if (response.success) {
                    alert('Banner updated successfully!');
                    resetForm();
                    fetchBanners();
                }
            } else {
                // Create new banner
                const response = await bannerAPI.create(formData);
                if (response.success) {
                    alert('Banner created successfully!');
                    resetForm();
                    fetchBanners();
                }
            }
        } catch (error) {
            console.error('Error saving banner:', error);
            alert(error.response?.data?.message || 'Failed to save banner');
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (banner) => {
        setFormData({
            badgeText: banner.badgeText,
            title: banner.title,
            subtitle: banner.subtitle,
            description: banner.description,
            price: banner.price,
            priceUnit: banner.priceUnit,
            discount: banner.discount,
            backgroundImage: banner.backgroundImage,
            targetAudience: banner.targetAudience,
            priority: banner.priority
        });
        setImagePreview(banner.backgroundImage);
        setEditingId(banner._id);
        setShowForm(true);
    };

    const handleDelete = async (id) => {
        if (!confirm('Are you sure you want to delete this banner?')) return;
        
        try {
            setLoading(true);
            const response = await bannerAPI.delete(id);
            if (response.success) {
                alert('Banner deleted successfully!');
                fetchBanners();
            }
        } catch (error) {
            console.error('Error deleting banner:', error);
            alert('Failed to delete banner');
        } finally {
            setLoading(false);
        }
    };

    const handleToggleStatus = async (id) => {
        try {
            setLoading(true);
            const response = await bannerAPI.toggleStatus(id);
            if (response.success) {
                alert(response.message);
                fetchBanners();
            }
        } catch (error) {
            console.error('Error toggling banner status:', error);
            alert('Failed to toggle banner status');
        } finally {
            setLoading(false);
        }
    };

    const resetForm = () => {
        setFormData({
            badgeText: '',
            title: '',
            subtitle: '',
            description: '',
            price: '',
            priceUnit: '',
            discount: '',
            backgroundImage: '',
            targetAudience: 'ALL',
            priority: 0
        });
        setImagePreview('');
        setEditingId(null);
        setShowForm(false);
    };

    return (
        <div className="broadcast-management-container">
            {/* Page Header */}
            <div className="broadcast-page-header">
                <div className="header-content">
                    <h2 className="page-title">Banner Section</h2>
                    <p className="page-subtitle">Create and manage promotional banners for user home page</p>
                </div>
                <button 
                    className="create-broadcast-btn"
                    onClick={() => setShowForm(!showForm)}
                    disabled={loading}
                >
                    {showForm ? <X size={20} /> : <Plus size={20} />}
                    {showForm ? 'Cancel' : 'Upload Banner'}
                </button>
            </div>

            {/* Banner Form */}
            {showForm && (
                <div className="settings-content">
                    <div className="settings-section">
                        <div className="section-info" style={{ marginBottom: '24px' }}>
                            <h3>{editingId ? 'Edit Banner' : 'Add New Banner'}</h3>
                            <p>Fill in the details below to {editingId ? 'update' : 'create'} a promotional banner</p>
                        </div>

                        <form onSubmit={handleSubmit} className="settings-form">
                            {/* Badge Text (Offer Type) */}
                            <div className="form-grid">
                                <div className="form-group">
                                    <label>Badge Text (Offer Type) <span className="required">*</span></label>
                                    <div className="input-with-icon">
                                        <input
                                            type="text"
                                            name="badgeText"
                                            value={formData.badgeText}
                                            onChange={handleInputChange}
                                            placeholder="e.g., \uD83D\uDD25 Limited Time Offer"
                                            required
                                        />
                                    </div>
                                    <small style={{ color: '#6b7280', fontSize: '0.85rem' }}>
                                        Example: "\uD83D\uDD25 Limited Time Offer", "\u26A1 Best Quality"
                                    </small>
                                </div>

                                {/* Target Audience */}
                                <div className="form-group">
                                    <label>Target Audience <span className="required">*</span></label>
                                    <select
                                        name="targetAudience"
                                        value={formData.targetAudience}
                                        onChange={handleInputChange}
                                        required
                                    >
                                        <option value="ALL">All Users</option>
                                        <option value="USERS">Users Only</option>
                                        <option value="LABOUR">Labour Only</option>
                                        <option value="CONTRACTORS">Contractors Only</option>
                                    </select>
                                </div>
                            </div>

                            {/* Background Image */}
                            <div className="form-group">
                                <label>Background Image <span className="required">*</span></label>
                                <div className="input-with-icon">
                                    <Image size={18} />
                                    <input
                                        type="url"
                                        name="backgroundImage"
                                        value={formData.backgroundImage}
                                        onChange={handleImageChange}
                                        placeholder="https://images.unsplash.com/... or upload file below"
                                        required
                                    />
                                </div>
                                <small style={{ color: '#6b7280', fontSize: '0.85rem', display: 'block', marginTop: '8px' }}>
                                    Or upload an image file:
                                </small>
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={handleFileUpload}
                                    style={{ marginTop: '8px' }}
                                />
                                {imagePreview && (
                                    <img 
                                        src={imagePreview} 
                                        alt="Preview" 
                                        style={{ 
                                            marginTop: '12px', 
                                            maxWidth: '200px', 
                                            maxHeight: '150px', 
                                            borderRadius: '8px',
                                            objectFit: 'cover'
                                        }} 
                                    />
                                )}
                            </div>

                            {/* Title */}
                            <div className="form-group">
                                <label>Banner Title <span className="required">*</span></label>
                                <div className="input-with-icon">
                                    <input
                                        type="text"
                                        name="title"
                                        value={formData.title}
                                        onChange={handleInputChange}
                                        placeholder="e.g., Build Strong Foundations"
                                        required
                                    />
                                </div>
                            </div>

                            {/* Subtitle */}
                            <div className="form-group">
                                <label>Subtitle <span className="required">*</span></label>
                                <div className="input-with-icon">
                                    <input
                                        type="text"
                                        name="subtitle"
                                        value={formData.subtitle}
                                        onChange={handleInputChange}
                                        placeholder="e.g., Premium Quality Cement"
                                        required
                                    />
                                </div>
                            </div>

                            {/* Description */}
                            <div className="form-group">
                                <label>Description <span className="required">*</span></label>
                                <textarea
                                    name="description"
                                    value={formData.description}
                                    onChange={handleInputChange}
                                    placeholder="e.g., High-grade cement for all construction needs"
                                    rows="3"
                                    required
                                />
                            </div>

                            {/* Price and Unit */}
                            <div className="form-grid">
                                <div className="form-group">
                                    <label>Price <span className="required">*</span></label>
                                    <div className="input-with-icon">
                                        <input
                                            type="text"
                                            name="price"
                                            value={formData.price}
                                            onChange={handleInputChange}
                                            placeholder="e.g., \u20B9350"
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="form-group">
                                    <label>Price Unit <span className="required">*</span></label>
                                    <div className="input-with-icon">
                                        <input
                                            type="text"
                                            name="priceUnit"
                                            value={formData.priceUnit}
                                            onChange={handleInputChange}
                                            placeholder="e.g., per bag, per kg"
                                            required
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Discount and Priority */}
                            <div className="form-grid">
                                <div className="form-group">
                                    <label>Discount/Offer Text <span className="required">*</span></label>
                                    <div className="input-with-icon">
                                        <input
                                            type="text"
                                            name="discount"
                                            value={formData.discount}
                                            onChange={handleInputChange}
                                            placeholder="e.g., Up to 20% Off"
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="form-group">
                                    <label>Priority (Higher = Shows First)</label>
                                    <div className="input-with-icon">
                                        <input
                                            type="number"
                                            name="priority"
                                            value={formData.priority}
                                            onChange={handleInputChange}
                                            placeholder="0"
                                            min="0"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Submit Button */}
                            <div style={{ display: 'flex', gap: '12px', marginTop: '32px' }}>
                                <button type="submit" className="save-btn" disabled={loading}>
                                    <Save size={20} />
                                    {loading ? 'Saving...' : (editingId ? 'Update Banner' : 'Create Banner')}
                                </button>
                                <button 
                                    type="button" 
                                    className="save-btn" 
                                    style={{ background: '#6b7280' }}
                                    onClick={resetForm}
                                    disabled={loading}
                                >
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Banners List */}
            <div className="settings-content" style={{ marginTop: '24px' }}>
                <div className="settings-section">
                    <div className="section-info" style={{ marginBottom: '24px' }}>
                        <h3>Existing Banners ({banners.length})</h3>
                        <p>Manage your promotional banners</p>
                    </div>

                    {loading && <p>Loading banners...</p>}

                    {!loading && banners.length === 0 && (
                        <div style={{ textAlign: 'center', padding: '40px', color: '#9ca3af' }}>
                            <Image size={64} style={{ margin: '0 auto 16px', opacity: 0.5 }} />
                            <p>No banners created yet. Click "Upload Banner" to create your first banner.</p>
                        </div>
                    )}

                    {!loading && banners.length > 0 && (
                        <div style={{ display: 'grid', gap: '16px' }}>
                            {banners.map((banner) => (
                                <div 
                                    key={banner._id} 
                                    style={{
                                        border: '1px solid #e5e7eb',
                                        borderRadius: '12px',
                                        padding: '16px',
                                        display: 'flex',
                                        gap: '16px',
                                        alignItems: 'center',
                                        background: banner.isActive ? '#fff' : '#f9fafb'
                                    }}
                                >
                                    <img 
                                        src={banner.backgroundImage} 
                                        alt={banner.title}
                                        style={{
                                            width: '120px',
                                            height: '80px',
                                            objectFit: 'cover',
                                            borderRadius: '8px'
                                        }}
                                    />
                                    <div style={{ flex: 1 }}>
                                        <h4 style={{ margin: '0 0 4px 0', fontSize: '16px', fontWeight: '600' }}>
                                            {banner.title}
                                        </h4>
                                        <p style={{ margin: '0 0 8px 0', fontSize: '14px', color: '#6b7280' }}>
                                            {banner.subtitle}
                                        </p>
                                        <div style={{ display: 'flex', gap: '12px', fontSize: '12px', color: '#9ca3af' }}>
                                            <span>Target: {banner.targetAudience}</span>
                                            <span>Priority: {banner.priority}</span>
                                            <span>Status: {banner.isActive ? 'Active' : 'Inactive'}</span>
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', gap: '8px' }}>
                                        <button
                                            onClick={() => handleToggleStatus(banner._id)}
                                            style={{
                                                padding: '8px',
                                                borderRadius: '6px',
                                                border: 'none',
                                                background: banner.isActive ? '#fef3c7' : '#d1fae5',
                                                color: banner.isActive ? '#92400e' : '#065f46',
                                                cursor: 'pointer'
                                            }}
                                            title={banner.isActive ? 'Deactivate' : 'Activate'}
                                        >
                                            {banner.isActive ? <EyeOff size={16} /> : <Eye size={16} />}
                                        </button>
                                        <button
                                            onClick={() => handleEdit(banner)}
                                            style={{
                                                padding: '8px',
                                                borderRadius: '6px',
                                                border: 'none',
                                                background: '#dbeafe',
                                                color: '#1e40af',
                                                cursor: 'pointer'
                                            }}
                                            title="Edit"
                                        >
                                            <Edit size={16} />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(banner._id)}
                                            style={{
                                                padding: '8px',
                                                borderRadius: '6px',
                                                border: 'none',
                                                background: '#fee2e2',
                                                color: '#991b1b',
                                                cursor: 'pointer'
                                            }}
                                            title="Delete"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default BannerSection;
