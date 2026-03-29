import { useState, useEffect } from 'react';
import { Save, User, FileText, Mail, Lock } from 'lucide-react';
import toast from 'react-hot-toast';
import { adminAuthAPI, cmsAPI } from '../../../services/admin.api';
import './AdminDashboard.css';

const AdminSettings = () => {
    const [activeTab, setActiveTab] = useState('profile');
    const [loading, setLoading] = useState(false);
    const [adminProfile, setAdminProfile] = useState({
        username: '',
        email: '',
        role: '',
        currentPassword: '',
        newPassword: ''
    });

    const [cmsContent, setCmsContent] = useState({
        aboutUs: '',
        contactUs: '',
        terms: '',
        privacy: ''
    });

    useEffect(() => {
        fetchAdminProfile();
        fetchCMSContent();
    }, []);

    const fetchAdminProfile = async () => {
        try {
            const response = await adminAuthAPI.getProfile();
            const profile = response.data.admin;
            setAdminProfile({
                username: profile.username || '',
                email: profile.email || '',
                role: profile.role || '',
                currentPassword: '',
                newPassword: ''
            });
        } catch (error) {
            console.error('Error fetching profile:', error);
            toast.error('Failed to load profile');
        }
    };

    const fetchCMSContent = async () => {
        try {
            const response = await cmsAPI.getAll();
            const content = response.data.content || [];
            
            // Convert array to object for easier access
            const contentObj = {};
            content.forEach(item => {
                contentObj[item.key] = item.value;
            });
            
            setCmsContent({
                aboutUs: contentObj.aboutUs || '',
                contactUs: contentObj.contactUs || '',
                termsAndConditions: contentObj.termsAndConditions || '',
                privacyPolicy: contentObj.privacyPolicy || ''
            });
        } catch (error) {
            console.error('Error fetching CMS content:', error);
            toast.error('Failed to load CMS content');
        }
    };

    const handleProfileSave = async (e) => {
        e.preventDefault();

        try {
            setLoading(true);
            const updateData = {
                email: adminProfile.email
            };

            // Only include password if both fields are filled
            if (adminProfile.currentPassword && adminProfile.newPassword) {
                updateData.currentPassword = adminProfile.currentPassword;
                updateData.newPassword = adminProfile.newPassword;
            }

            await adminAuthAPI.updateProfile(updateData);
            toast.success('Profile updated successfully!');
            
            // Clear password fields
            setAdminProfile(prev => ({ 
                ...prev, 
                currentPassword: '', 
                newPassword: '' 
            }));
        } catch (error) {
            console.error('Error updating profile:', error);
            toast.error(error.response?.data?.message || 'Failed to update profile');
        } finally {
            setLoading(false);
        }
    };

    const handleCmsSave = async (e) => {
        e.preventDefault();

        try {
            setLoading(true);
            
            // Only update fields that have content (not empty)
            const updates = [];
            
            if (cmsContent.aboutUs && cmsContent.aboutUs.trim()) {
                updates.push(cmsAPI.update('aboutUs', { value: cmsContent.aboutUs }));
            }
            
            if (cmsContent.contactUs && cmsContent.contactUs.trim()) {
                updates.push(cmsAPI.update('contactUs', { value: cmsContent.contactUs }));
            }
            
            if (cmsContent.terms && cmsContent.terms.trim()) {
                updates.push(cmsAPI.update('terms', { value: cmsContent.terms }));
            }
            
            if (cmsContent.privacy && cmsContent.privacy.trim()) {
                updates.push(cmsAPI.update('privacy', { value: cmsContent.privacy }));
            }

            // Check if there's at least one field to update
            if (updates.length === 0) {
                toast.error('Please enter content in at least one field');
                setLoading(false);
                return;
            }

            await Promise.all(updates);
            toast.success('Content updated successfully!');
        } catch (error) {
            console.error('Error updating CMS:', error);
            toast.error(error.response?.data?.message || 'Failed to update content');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="admin-settings-container">
            <div className="admin-settings-header">
                <h2>Settings</h2>
                <div className="settings-tabs">
                    <button
                        className={`tab-btn ${activeTab === 'profile' ? 'active' : ''}`}
                        onClick={() => setActiveTab('profile')}
                    >
                        <User size={18} /> Edit Profile
                    </button>
                    <button
                        className={`tab-btn ${activeTab === 'cms' ? 'active' : ''}`}
                        onClick={() => setActiveTab('cms')}
                    >
                        <FileText size={18} /> Manage Content
                    </button>
                </div>
            </div>

            <div className="settings-content">
                {activeTab === 'profile' ? (
                    <div className="settings-section">
                        <div className="section-info">
                            <h3>Admin Profile</h3>
                            <p>Update your personal information and contact details.</p>
                        </div>
                        <form className="settings-form" onSubmit={handleProfileSave}>
                            <div className="form-grid">
                                <div className="form-group">
                                    <label>Username</label>
                                    <div className="input-with-icon disabled">
                                        <User size={18} />
                                        <input
                                            type="text"
                                            value={adminProfile.username}
                                            disabled
                                        />
                                    </div>
                                </div>
                                <div className="form-group">
                                    <label>Email Address</label>
                                    <div className="input-with-icon">
                                        <Mail size={18} />
                                        <input
                                            type="email"
                                            value={adminProfile.email}
                                            onChange={(e) => setAdminProfile({ ...adminProfile, email: e.target.value })}
                                            placeholder="Enter email"
                                        />
                                    </div>
                                </div>
                                <div className="form-group">
                                    <label>Current Password</label>
                                    <div className="input-with-icon">
                                        <Lock size={18} />
                                        <input
                                            type="password"
                                            value={adminProfile.currentPassword || ''}
                                            onChange={(e) => setAdminProfile({ ...adminProfile, currentPassword: e.target.value })}
                                            placeholder="Enter current password"
                                        />
                                    </div>
                                </div>
                                <div className="form-group">
                                    <label>New Password</label>
                                    <div className="input-with-icon">
                                        <Lock size={18} />
                                        <input
                                            type="password"
                                            value={adminProfile.newPassword || ''}
                                            onChange={(e) => setAdminProfile({ ...adminProfile, newPassword: e.target.value })}
                                            placeholder="Enter new password"
                                        />
                                    </div>
                                </div>
                                <div className="form-group">
                                    <label>Role</label>
                                    <div className="input-with-icon disabled">
                                        <Lock size={18} />
                                        <input type="text" value={adminProfile.role} disabled />
                                    </div>
                                </div>
                            </div>
                            <button type="submit" className="save-btn" disabled={loading}>
                                <Save size={18} /> {loading ? 'Saving...' : 'Save Profile Changes'}
                            </button>
                        </form>
                    </div>
                ) : (
                    <div className="settings-section">
                        <div className="section-info">
                            <h3>CMS Management</h3>
                            <p>Manage the content displayed on About Us and Contact Us pages.</p>
                        </div>
                        <form className="settings-form" onSubmit={handleCmsSave}>
                            <div className="cms-section">
                                <h4 className="cms-subtitle"><FileText size={18} /> About Us Page</h4>
                                <div className="form-group">
                                    <label>About Us Content</label>
                                    <textarea
                                        rows="8"
                                        value={cmsContent.aboutUs}
                                        onChange={(e) => setCmsContent({
                                            ...cmsContent,
                                            aboutUs: e.target.value
                                        })}
                                        placeholder="Enter about us content..."
                                    />
                                </div>
                            </div>

                            <div className="cms-section" style={{ marginTop: '40px' }}>
                                <h4 className="cms-subtitle"><Mail size={18} /> Contact Us Page</h4>
                                <div className="form-group">
                                    <label>Contact Information</label>
                                    <textarea
                                        rows="6"
                                        value={cmsContent.contactUs}
                                        onChange={(e) => setCmsContent({
                                            ...cmsContent,
                                            contactUs: e.target.value
                                        })}
                                        placeholder="Enter contact information..."
                                    />
                                </div>
                            </div>

                            <div className="cms-section" style={{ marginTop: '40px' }}>
                                <h4 className="cms-subtitle"><FileText size={18} /> Legal Content</h4>
                                <div className="form-group">
                                    <label>Terms & Conditions</label>
                                    <textarea
                                        rows="10"
                                        value={cmsContent.terms}
                                        onChange={(e) => setCmsContent({
                                            ...cmsContent,
                                            terms: e.target.value
                                        })}
                                        placeholder="Enter terms and conditions..."
                                        style={{ whiteSpace: 'pre-wrap' }}
                                    />
                                </div>
                                <div className="form-group" style={{ marginTop: '20px' }}>
                                    <label>Privacy Policy</label>
                                    <textarea
                                        rows="10"
                                        value={cmsContent.privacy}
                                        onChange={(e) => setCmsContent({
                                            ...cmsContent,
                                            privacy: e.target.value
                                        })}
                                        placeholder="Enter privacy policy..."
                                        style={{ whiteSpace: 'pre-wrap' }}
                                    />
                                </div>
                            </div>
                            <button type="submit" className="save-btn" style={{ marginTop: '20px' }} disabled={loading}>
                                <Save size={18} /> {loading ? 'Updating...' : 'Update Content'}
                            </button>
                        </form>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdminSettings;
