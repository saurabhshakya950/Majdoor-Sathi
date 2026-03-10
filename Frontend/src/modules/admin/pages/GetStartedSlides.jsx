import React, { useState, useEffect } from 'react';
import { Image, Plus, Save, Trash2, Edit, Eye, EyeOff, X, Upload } from 'lucide-react';
import './AdminDashboard.css';
import { getStartedSlidesAPI } from '../../../services/admin.api';
import toast from 'react-hot-toast';

const GetStartedSlides = () => {
    const [formData, setFormData] = useState({
        title: '',
        imageUrl: '',
        isActive: true,
        order: 0
    });

    const [slides, setSlides] = useState([]);
    const [loading, setLoading] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [showForm, setShowForm] = useState(false);
    const [imagePreview, setImagePreview] = useState('');

    useEffect(() => {
        fetchSlides();
    }, []);

    const fetchSlides = async () => {
        try {
            setLoading(true);
            const response = await getStartedSlidesAPI.getAll();
            if (response.success) {
                setSlides(response.data.slides);
            }
        } catch (error) {
            console.error('Error fetching slides:', error);
            toast.error('Failed to fetch slides');
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: name === 'order' ? parseInt(value) : value
        }));
    };

    const handleFileUpload = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                const base64String = reader.result;
                setFormData(prev => ({
                    ...prev,
                    imageUrl: base64String
                }));
                setImagePreview(base64String);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.imageUrl) {
            toast.error('Image is required');
            return;
        }

        try {
            setLoading(true);
            let response;
            if (editingId) {
                response = await getStartedSlidesAPI.update(editingId, formData);
            } else {
                response = await getStartedSlidesAPI.create(formData);
            }

            if (response.success) {
                toast.success(editingId ? 'Slide updated!' : 'Slide created!');
                resetForm();
                fetchSlides();
            }
        } catch (error) {
            console.error('Error saving slide:', error);
            toast.error(error.response?.data?.message || 'Failed to save slide');
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (slide) => {
        setFormData({
            title: slide.title,
            imageUrl: slide.imageUrl,
            isActive: slide.isActive,
            order: slide.order
        });
        setImagePreview(slide.imageUrl);
        setEditingId(slide._id);
        setShowForm(true);
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this slide?')) return;

        try {
            setLoading(true);
            const response = await getStartedSlidesAPI.delete(id);
            if (response.success) {
                toast.success('Slide deleted');
                fetchSlides();
            }
        } catch (error) {
            console.error('Error deleting slide:', error);
            toast.error('Failed to delete slide');
        } finally {
            setLoading(false);
        }
    };

    const handleToggleStatus = async (id) => {
        try {
            setLoading(true);
            const response = await getStartedSlidesAPI.toggleStatus(id);
            if (response.success) {
                toast.success(response.message);
                fetchSlides();
            }
        } catch (error) {
            toast.error('Failed to toggle status');
        } finally {
            setLoading(false);
        }
    };

    const resetForm = () => {
        setFormData({
            title: '',
            imageUrl: '',
            isActive: true,
            order: 0
        });
        setImagePreview('');
        setEditingId(null);
        setShowForm(false);
    };

    return (
        <div className="broadcast-management-container">
            <div className="broadcast-page-header">
                <div className="header-content">
                    <h2 className="page-title">Get Started Slides</h2>
                    <p className="page-subtitle">Manage background images and titles for the landing page carousel</p>
                </div>
                <button
                    className="create-broadcast-btn"
                    onClick={() => setShowForm(!showForm)}
                    disabled={loading}
                >
                    {showForm ? <X size={20} /> : <Plus size={20} />}
                    {showForm ? 'Cancel' : 'Add New Slide'}
                </button>
            </div>

            {showForm && (
                <div className="settings-content">
                    <div className="settings-section">
                        <div className="section-info" style={{ marginBottom: '24px' }}>
                            <h3>{editingId ? 'Edit Slide' : 'New Slide'}</h3>
                        </div>

                        <form onSubmit={handleSubmit} className="settings-form">
                            <div className="form-group">
                                <label>Background Image</label>
                                <div className="input-with-icon">
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={handleFileUpload}
                                        className="hidden"
                                        id="slide-upload"
                                    />
                                    <label htmlFor="slide-upload" style={{
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '10px',
                                        padding: '12px',
                                        border: '2px dashed #e5e7eb',
                                        borderRadius: '12px',
                                        width: '100%',
                                        justifyContent: 'center',
                                        background: '#f9fafb'
                                    }}>
                                        <Upload size={20} className="text-gray-400" />
                                        <span>{imagePreview ? 'Change Image' : 'Select Background Image'}</span>
                                    </label>
                                </div>
                                {imagePreview && (
                                    <div style={{ marginTop: '12px', position: 'relative', width: 'fit-content' }}>
                                        <img
                                            src={imagePreview}
                                            alt="Preview"
                                            style={{ maxHeight: '200px', borderRadius: '12px', objectFit: 'cover' }}
                                        />
                                    </div>
                                )}
                            </div>

                            <div className="form-group">
                                <label>Animated Title (Typewriter Text)</label>
                                <div className="input-with-icon">
                                    <input
                                        type="text"
                                        name="title"
                                        value={formData.title}
                                        onChange={handleInputChange}
                                        placeholder="e.g. Find Skilled Workers"
                                        required
                                        maxLength="100"
                                    />
                                </div>
                            </div>

                            <div className="form-group">
                                <label>Display Order</label>
                                <div className="input-with-icon">
                                    <input
                                        type="number"
                                        name="order"
                                        value={formData.order}
                                        onChange={handleInputChange}
                                        placeholder="0"
                                        min="0"
                                    />
                                </div>
                            </div>

                            <div style={{ display: 'flex', gap: '12px', marginTop: '32px' }}>
                                <button type="submit" className="save-btn" disabled={loading}>
                                    <Save size={20} />
                                    {loading ? 'Processing...' : (editingId ? 'Update Slide' : 'Save Slide')}
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

            <div className="settings-content" style={{ marginTop: '24px' }}>
                <div className="settings-section">
                    <div className="section-info" style={{ marginBottom: '24px' }}>
                        <h3>Active Slides ({slides.length})</h3>
                    </div>

                    {loading && !slides.length ? <p>Loading slides...</p> : null}

                    {!loading && slides.length === 0 && (
                        <div style={{ textAlign: 'center', padding: '40px', color: '#9ca3af' }}>
                            <Image size={64} style={{ margin: '0 auto 16px', opacity: 0.5 }} />
                            <p>No slides found. Add your first dynamic slide!</p>
                        </div>
                    )}

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
                        {slides.map((slide) => (
                            <div
                                key={slide._id}
                                style={{
                                    border: '1px solid #e5e7eb',
                                    borderRadius: '16px',
                                    padding: '16px',
                                    background: slide.isActive ? '#fff' : '#f9fafb',
                                    transition: 'all 0.3s ease'
                                }}
                            >
                                <div style={{ position: 'relative', height: '180px', marginBottom: '16px', borderRadius: '12px', overflow: 'hidden' }}>
                                    <img
                                        src={slide.imageUrl}
                                        alt={slide.title}
                                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                    />
                                    <div style={{ position: 'absolute', top: '10px', left: '10px', background: 'rgba(0,0,0,0.6)', color: 'white', padding: '4px 10px', borderRadius: '20px', fontSize: '12px' }}>
                                        Order: {slide.order}
                                    </div>
                                </div>
                                <h4 style={{ margin: '0 0 8px 0', fontSize: '18px', fontWeight: '700', color: '#1f2937' }}>{slide.title}</h4>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px' }}>
                                    <div style={{ display: 'flex', gap: '8px' }}>
                                        <button onClick={() => handleToggleStatus(slide._id)} style={{ padding: '8px', borderRadius: '8px', border: 'none', background: slide.isActive ? '#dcfce7' : '#fee2e2', color: slide.isActive ? '#166534' : '#991b1b', cursor: 'pointer' }}>
                                            {slide.isActive ? <Eye size={18} /> : <EyeOff size={18} />}
                                        </button>
                                        <button onClick={() => handleEdit(slide)} style={{ padding: '8px', borderRadius: '8px', border: 'none', background: '#dbeafe', color: '#1e40af', cursor: 'pointer' }}>
                                            <Edit size={18} />
                                        </button>
                                        <button onClick={() => handleDelete(slide._id)} style={{ padding: '8px', borderRadius: '8px', border: 'none', background: '#fee2e2', color: '#991b1b', cursor: 'pointer' }}>
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                    <span style={{ fontSize: '12px', color: '#6b7280' }}>
                                        {new Date(slide.createdAt).toLocaleDateString()}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default GetStartedSlides;
