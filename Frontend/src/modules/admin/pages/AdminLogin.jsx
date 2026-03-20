import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { HardHat, Lock, User, Eye, EyeOff } from 'lucide-react';
import toast from 'react-hot-toast';
import { adminAuthAPI } from '../../../services/admin.api';
import { getFCMToken } from '../../../services/pushNotificationService';
import './AdminDashboard.css';

const AdminLogin = () => {
    const [formData, setFormData] = useState({ username: '', password: '' });
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            const response = await adminAuthAPI.login(formData.username, formData.password);

            if (response.success) {
                // Validate token before storing
                const token = response.data.token;

                if (!token || token === 'null' || token === 'undefined') {
                    throw new Error('Invalid token received from server');
                }

                console.log('[SUCCESS] Login successful, storing auth data...');
                console.log('   Admin role:', response.data.admin.role);
                console.log('   Admin username:', response.data.admin.username);

                // Store token and basic info
                localStorage.setItem('adminToken', token);
                localStorage.setItem('adminAuth', 'true');
                localStorage.setItem('adminRole', response.data.admin.role);
                localStorage.setItem('adminUsername', response.data.admin.username);
                localStorage.setItem('adminProfile', JSON.stringify(response.data.admin));

                toast.success('Login successful!');
                navigate('/admin/dashboard/home');

                // Register FCM Token for admin push notifications (non-blocking)
                try {
                    const fcmToken = await getFCMToken();
                    if (fcmToken) {
                        await adminAuthAPI.saveFcmToken(fcmToken, 'web');
                        console.log('[ADMIN] FCM Token registered successfully');
                    }
                } catch (fcmErr) {
                    console.warn('[ADMIN] FCM token registration skipped:', fcmErr.message);
                }
            }
        } catch (error) {
            console.error('[ERROR] Login error:', error);
            const errorMessage = error.response?.data?.message || error.message || 'Login failed. Please check your credentials.';
            toast.error(errorMessage);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="admin-login-container" style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'linear-gradient(135deg, #1a233a 0%, #0f172a 100%)',
            fontFamily: "'Outfit', sans-serif"
        }}>
            <div className="admin-login-card" style={{
                width: '100%',
                maxWidth: '400px',
                background: 'rgba(255, 255, 255, 0.05)',
                backdropFilter: 'blur(10px)',
                borderRadius: '24px',
                padding: '40px',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
            }}>
                <div style={{ textAlign: 'center', marginBottom: '40px' }}>
                    <div style={{
                        width: '64px',
                        height: '64px',
                        background: '#f97316',
                        borderRadius: '16px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        margin: '0 auto 16px',
                        boxShadow: '0 10px 15px -3px rgba(249, 115, 22, 0.4)'
                    }}>
                        <HardHat size={32} color="white" />
                    </div>
                    <h1 style={{ color: 'white', fontSize: '1.8rem', fontWeight: 700, margin: 0 }}>Rajghar Admin</h1>
                    <p style={{ color: '#94a3b8', marginTop: '8px' }}>Sign in to manage your marketplace</p>
                </div>

                <form onSubmit={handleLogin}>
                    <div style={{ marginBottom: '20px' }}>
                        <label style={{ display: 'block', color: '#e2e8f0', marginBottom: '8px', fontSize: '0.9rem' }}>Username / Email</label>
                        <div style={{ position: 'relative' }}>
                            <User style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} size={18} />
                            <input
                                type="text"
                                placeholder="Enter admin username"
                                style={{
                                    width: '100%',
                                    padding: '12px 12px 12px 40px',
                                    background: 'rgba(255, 255, 255, 0.05)',
                                    border: '1px solid rgba(255, 255, 255, 0.1)',
                                    borderRadius: '12px',
                                    color: 'white',
                                    outline: 'none',
                                    transition: 'border-color 0.2s'
                                }}
                                onFocus={(e) => e.target.style.borderColor = '#f97316'}
                                onBlur={(e) => e.target.style.borderColor = 'rgba(255, 255, 255, 0.1)'}
                                value={formData.username}
                                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                                required
                            />
                        </div>
                    </div>

                    <div style={{ marginBottom: '32px' }}>
                        <label style={{ display: 'block', color: '#e2e8f0', marginBottom: '8px', fontSize: '0.9rem' }}>Password</label>
                        <div style={{ position: 'relative' }}>
                            <Lock style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} size={18} />
                            <input
                                type={showPassword ? 'text' : 'password'}
                                placeholder="Enter your password"
                                style={{
                                    width: '100%',
                                    padding: '12px 40px 12px 40px',
                                    background: 'rgba(255, 255, 255, 0.05)',
                                    border: '1px solid rgba(255, 255, 255, 0.1)',
                                    borderRadius: '12px',
                                    color: 'white',
                                    outline: 'none',
                                    transition: 'border-color 0.2s'
                                }}
                                onFocus={(e) => e.target.style.borderColor = '#f97316'}
                                onBlur={(e) => e.target.style.borderColor = 'rgba(255, 255, 255, 0.1)'}
                                value={formData.password}
                                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                required
                            />
                            <div
                                onClick={() => setShowPassword(!showPassword)}
                                style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', cursor: 'pointer', color: '#64748b' }}
                            >
                                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </div>
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={isLoading}
                        style={{
                            width: '100%',
                            padding: '14px',
                            background: '#f97316',
                            color: 'white',
                            border: 'none',
                            borderRadius: '12px',
                            fontWeight: 600,
                            fontSize: '1rem',
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '8px'
                        }}
                        onMouseOver={(e) => {
                            e.target.style.background = '#ea580c';
                            e.target.style.transform = 'translateY(-2px)';
                        }}
                        onMouseOut={(e) => {
                            e.target.style.background = '#f97316';
                            e.target.style.transform = 'translateY(0)';
                        }}
                    >
                        {isLoading ? 'Signing in...' : 'Sign In to Dashboard'}
                    </button>
                </form>

                <div style={{ textAlign: 'center', marginTop: '24px' }}>
                    <p style={{ color: '#64748b', fontSize: '0.85rem' }}>
                        Protected by Rajghar Security System v1.1
                    </p>
                </div>
            </div>
        </div>
    );
};

export default AdminLogin;
