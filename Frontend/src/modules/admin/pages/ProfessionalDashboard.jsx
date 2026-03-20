import React, { useState, useEffect } from 'react';
import {
    BarChart3,
    Users,
    HardHat,
    Briefcase,
    LayoutDashboard,
    Settings,
    Bell,
    Search,
    MessageSquare,
    X,
    Send,
    Plus,
    Trash2,
    Edit,
    CheckCircle,
    AlertCircle,
    MoreVertical,
    LogOut,
    SlidersHorizontal,
    Image,
    UserCog,
    Activity,
    Zap,
    ShieldCheck,
    ExternalLink,
    RefreshCw
} from 'lucide-react';
import { Outlet, useNavigate, useLocation, Link, NavLink } from 'react-router-dom';
import { adminNotificationAPI } from '../../../services/admin.api';
import './AdminDashboard.css';

// Internal Components
export function AnalyticsCard({ icon, title, value, bg, onClick }) {
    return (
        <div
            className="analytics-card"
            onClick={onClick}
            style={{ cursor: onClick ? 'pointer' : 'default' }}
        >
            <div className="analytics-icon" style={{ backgroundColor: bg }}>
                {icon}
            </div>
            <div className="analytics-info">
                <h3>{title}</h3>
                <p>{value}</p>
            </div>
            {onClick && (
                <div className="card-arrow" style={{ marginLeft: 'auto', opacity: 0.3 }}>
                    <MoreVertical size={16} />
                </div>
            )}
        </div>
    );
}


export function QuickAction({ icon, title, onClick, color }) {
    return (
        <div className="quick-action-card" onClick={onClick}>
            <div className="action-icon" style={{ color: color }}>
                {icon}
            </div>
            <span>{title}</span>
            <ExternalLink size={14} className="action-arrow" />
        </div>
    );
}

export function SystemHealth() {
    return (
        <div className="system-health-panel">
            <div className="health-header">
                <Activity size={18} />
                <span>System Health</span>
            </div>
            <div className="health-grid">
                <div className="health-item">
                    <div className="health-status online"></div>
                    <span>API Server</span>
                    <Zap size={14} className="item-icon" />
                </div>
                <div className="health-item">
                    <div className="health-status online"></div>
                    <span>Database</span>
                    <ShieldCheck size={14} className="item-icon" />
                </div>
                <div className="health-item">
                    <div className="health-status online"></div>
                    <span>Cloudinary</span>
                    <Image size={14} className="item-icon" />
                </div>
            </div>
        </div>
    );
}

export function DashboardHome() {
    const [analytics, setAnalytics] = React.useState(null);
    const [interactions, setInteractions] = React.useState([]);
    const [loading, setLoading] = React.useState(true);
    const navigate = useNavigate();

    React.useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        try {
            const { dashboardAPI } = await import('../../../services/admin.api');

            // Fetch analytics
            const analyticsResponse = await dashboardAPI.getAnalytics();
            if (analyticsResponse.success) {
                setAnalytics(analyticsResponse.data.analytics);
            }

            // Fetch interactions
            const interactionsResponse = await dashboardAPI.getInteractions({ limit: 10 });
            if (interactionsResponse.success) {
                setInteractions(interactionsResponse.data.interactions);
            }
        } catch (error) {
            console.error('Error fetching dashboard data:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="dashboard-loading-spinner">
                <RefreshCw className="animate-spin" size={40} />
                <p>Analyzing Platform Data...</p>
            </div>
        );
    }

    return (
        <>
            <div className="dashboard-top-row">
                <SystemHealth />
                <div className="quick-actions-grid">
                    <QuickAction
                        icon={<Image size={20} />}
                        title="Add Banner"
                        color="#f97316"
                        onClick={() => navigate('/admin/dashboard/banners')}
                    />
                    <QuickAction
                        icon={<SlidersHorizontal size={20} />}
                        title="Update Slides"
                        color="#3b82f6"
                        onClick={() => navigate('/admin/dashboard/get-started-slides')}
                    />
                    <QuickAction
                        icon={<Bell size={20} />}
                        title="Broadcast"
                        color="#8b5cf6"
                        onClick={() => navigate('/admin/dashboard/broadcasts')}
                    />
                </div>
            </div>

            <div className="analytics-grid">
                <AnalyticsCard
                    icon={<Users color="#3b82f6" />}
                    title="Total Users"
                    value={analytics?.totalUsers || 0}
                    bg="#eff6ff"
                    onClick={() => navigate('/admin/dashboard/users')}
                />
                <AnalyticsCard
                    icon={<HardHat color="#f97316" />}
                    title="Total Labours"
                    value={analytics?.totalLabours || 0}
                    bg="#fff7ed"
                    onClick={() => navigate('/admin/dashboard/labours')}
                />
                <AnalyticsCard
                    icon={<Briefcase color="#10b981" />}
                    title="Total Contractors"
                    value={analytics?.totalContractors || 0}
                    bg="#ecfdf5"
                    onClick={() => navigate('/admin/dashboard/contractors')}
                />
                <AnalyticsCard
                    icon={<CheckCircle color="#f43f5e" />}
                    title="Verification Queue"
                    value={analytics?.verificationQueue || 0}
                    bg="#fff1f2"
                    onClick={() => navigate('/admin/dashboard/verification')}
                />
            </div>

            <div className="dashboard-content-grid">
                <div className="interaction-monitor">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                        <h2>Interaction Monitor</h2>
                        <div style={{ fontSize: '0.85rem', color: '#6b7280' }}>Request Type: All</div>
                    </div>
                    <table className="admin-table">
                        <thead>
                            <tr>
                                <th>Sender</th>
                                <th>Receiver</th>
                                <th>Request Type</th>
                                <th>Context</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {interactions.length > 0 ? (
                                interactions.map((interaction) => (
                                    <tr key={interaction._id}>
                                        <td>
                                            <div style={{ fontSize: '0.85rem' }}>
                                                <div style={{ fontWeight: 600 }}>{interaction.senderType}</div>
                                                <div style={{ color: '#6b7280', fontSize: '0.75rem' }}>
                                                    {interaction.senderId?.firstName || 'N/A'} {interaction.senderId?.lastName || ''}
                                                </div>
                                            </div>
                                        </td>
                                        <td>
                                            <div style={{ fontSize: '0.85rem' }}>
                                                <div style={{ fontWeight: 600 }}>{interaction.receiverType}</div>
                                                <div style={{ color: '#6b7280', fontSize: '0.75rem' }}>
                                                    {interaction.receiverId?.firstName || 'N/A'} {interaction.receiverId?.lastName || ''}
                                                </div>
                                            </div>
                                        </td>
                                        <td>
                                            <span style={{
                                                padding: '4px 8px',
                                                borderRadius: '6px',
                                                fontSize: '0.75rem',
                                                fontWeight: 600,
                                                background: interaction.requestType === 'LABOUR_HIRE' ? '#eff6ff' :
                                                    interaction.requestType === 'CONTRACTOR_HIRE' ? '#ecfdf5' :
                                                        '#fff7ed',
                                                color: interaction.requestType === 'LABOUR_HIRE' ? '#3b82f6' :
                                                    interaction.requestType === 'CONTRACTOR_HIRE' ? '#10b981' :
                                                        '#f97316'
                                            }}>
                                                {interaction.requestType.replace('_', ' ')}
                                            </span>
                                        </td>
                                        <td style={{ maxWidth: '200px' }}>
                                            <div style={{
                                                fontSize: '0.8rem',
                                                color: '#4b5563',
                                                overflow: 'hidden',
                                                textOverflow: 'ellipsis',
                                                whiteSpace: 'nowrap'
                                            }}>
                                                {interaction.requestContext}
                                            </div>
                                        </td>
                                        <td>
                                            <span className={`status-badge ${interaction.status === 'ACCEPTED' ? 'status-completed' :
                                                interaction.status === 'REJECTED' ? 'status-cancelled' :
                                                    'status-pending'
                                                }`}>
                                                {interaction.status}
                                            </span>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="5" style={{ textAlign: 'center', padding: '20px', color: '#94a3b8' }}>
                                        No interactions found
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                <div className="right-panel">
                    <div className="right-panel-item" style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                        <div style={{ background: '#3b82f6', padding: '10px', borderRadius: '10px' }}>
                            <CheckCircle color="#fff" size={24} />
                        </div>
                        <div>
                            <h3 style={{ margin: 0, fontSize: '0.9rem' }}>Completed Requests:</h3>
                            <p style={{ margin: 0, fontWeight: 700, fontSize: '1.1rem', color: '#10b981' }}>
                                {analytics?.completedRequests || 0}
                            </p>
                        </div>
                    </div>

                    <div className="right-panel-item" style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                        <div style={{ background: '#f97316', padding: '10px', borderRadius: '10px' }}>
                            <AlertCircle color="#fff" size={24} />
                        </div>
                        <div>
                            <h3 style={{ margin: 0, fontSize: '0.9rem' }}>Pending Requests:</h3>
                            <p style={{ margin: 0, fontWeight: 700, fontSize: '1.1rem', color: '#f97316' }}>
                                {analytics?.activeRequests || 0}
                            </p>
                        </div>
                    </div>

                    <div className="right-panel-item">
                        <h3 style={{ marginBottom: '16px' }}>Verification Queue</h3>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <HardHat size={20} color="#3b82f6" />
                                </div>
                                <div>
                                    <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>Pending Verifications</div>
                                    <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                                        {analytics?.verificationQueue || 0} items in queue
                                    </div>
                                </div>
                            </div>
                            <button className="crud-btn btn-add" style={{ padding: '6px 12px', margin: 0 }}>Verify</button>
                        </div>
                    </div>

                    <div className="right-panel-item">
                        <h3>Dispute Center</h3>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px' }}>
                            <span style={{ fontSize: '0.9rem' }}>Open Cases: {analytics?.disputes?.openCases || 0}</span>
                            <button className="crud-btn btn-edit" style={{ background: '#3b82f6', color: 'white' }}>Review Disputes</button>
                        </div>
                    </div>

                    <div className="right-panel-item">
                        <h3>Platform Activity</h3>
                        <div style={{ marginTop: '12px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                <span style={{ fontSize: '0.85rem', color: '#6b7280' }}>Today's Requests</span>
                                <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>
                                    {analytics?.todayRequests || 0}
                                </span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                <span style={{ fontSize: '0.85rem', color: '#6b7280' }}>This Week</span>
                                <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>
                                    {analytics?.weekRequests || 0}
                                </span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span style={{ fontSize: '0.85rem', color: '#6b7280' }}>Success Rate</span>
                                <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#10b981' }}>
                                    {analytics?.successRate || 0}%
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="right-panel-item">
                        <h3>Revenue Tracking</h3>
                        <p style={{ fontSize: '1.5rem', fontWeight: 700, margin: '10px 0' }}>
                            \u20B9{analytics?.revenue?.total?.toLocaleString() || '0'}
                        </p>
                        <div style={{ height: '100px', display: 'flex', alignItems: 'flex-end', gap: '8px', marginTop: '16px', position: 'relative' }}>
                            {(() => {
                                const data = analytics?.revenue?.weeklyData || [10, 20, 15, 40, 70];
                                const maxValue = Math.max(...data);
                                return data.map((value, i) => {
                                    const heightPercent = maxValue > 0 ? (value / maxValue) * 100 : 0;
                                    return (
                                        <div
                                            key={i}
                                            style={{
                                                flex: 1,
                                                height: `${heightPercent}%`,
                                                background: '#3b82f6',
                                                borderRadius: '4px 4px 0 0',
                                                minHeight: '5px',
                                                transition: 'height 0.3s ease'
                                            }}
                                        ></div>
                                    );
                                });
                            })()}
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: '#6b7280', marginTop: '4px' }}>
                            <span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span>
                        </div>
                    </div>

                    <div className="right-panel-item">
                        <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Bell size={18} color="#f97316" /> Broadcast Message</h3>
                        <p style={{ fontSize: '0.85rem', color: '#6b7280', margin: '10px 0' }}>Send to All Users</p>
                        <button className="crud-btn" style={{ width: '100%', border: '1px solid #ddd', background: 'none' }}>Draft Message</button>
                    </div>
                </div>
            </div>
        </>
    );
}

const ProfessionalDashboard = () => {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [showNotifDropdown, setShowNotifDropdown] = useState(false);
    const notifRef = React.useRef(null);
    const navigate = useNavigate();
    const location = useLocation();
    const [adminData, setAdminData] = useState(() => {
        const username = localStorage.getItem('adminUsername');
        const role = localStorage.getItem('adminRole');
        const profileStr = localStorage.getItem('adminProfile');

        // Priority: 1. username from login, 2. name from profile, 3. fallback to 'Admin'
        let displayName = username || 'Admin';

        try {
            if (profileStr && profileStr !== 'undefined' && profileStr !== 'null') {
                const profile = JSON.parse(profileStr);
                // User specifically wants the name they logged in with (username)
                displayName = username || profile.username || profile.name || profile.fullName || 'Admin';
            }
        } catch (e) {
            console.error('Error parsing admin profile:', e);
        }

        return { name: displayName, role: role || 'Admin' };
    });

    useEffect(() => {
        const refreshAdminInfo = () => {
            const username = localStorage.getItem('adminUsername');
            const role = localStorage.getItem('adminRole');
            const profileStr = localStorage.getItem('adminProfile');

            let displayName = username || 'Admin';

            try {
                if (profileStr && profileStr !== 'undefined' && profileStr !== 'null') {
                    const profile = JSON.parse(profileStr);
                    displayName = username || profile.username || profile.name || profile.fullName || 'Admin';
                }
            } catch (e) {
                console.error('Error parsing admin profile:', e);
            }

            setAdminData({ name: displayName, role: role || 'Admin' });
        };

        refreshAdminInfo();
    }, [location.pathname]);

    // Fetch admin notifications
    const fetchNotifications = React.useCallback(async () => {
        try {
            const data = await adminNotificationAPI.getNotifications({ limit: 15 });
            if (data.success) {
                setNotifications(data.data.notifications || []);
                setUnreadCount(data.data.unreadCount || 0);
            }
        } catch (err) {
            // Silently fail — bell icon is non-critical
        }
    }, []);

    React.useEffect(() => {
        fetchNotifications();
        const interval = setInterval(fetchNotifications, 30000); // Poll every 30s
        return () => clearInterval(interval);
    }, [fetchNotifications]);

    // Close dropdown when clicking outside
    React.useEffect(() => {
        const handleClickOutside = (e) => {
            if (notifRef.current && !notifRef.current.contains(e.target)) {
                setShowNotifDropdown(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleNotifClick = async (notif) => {
        try { await adminNotificationAPI.markAsRead(notif._id); } catch (_) {}
        setNotifications(prev => prev.map(n => n._id === notif._id ? { ...n, isRead: true } : n));
        setUnreadCount(prev => Math.max(0, prev - 1));
        setShowNotifDropdown(false);

        // Redirect to verification with correct filter
        const entityType = notif.metadata?.entityType || 'labour';
        navigate(`/admin/dashboard/verification?filter=${entityType}`);
    };

    const handleMarkAllRead = async () => {
        try { await adminNotificationAPI.markAllAsRead(); } catch (_) {}
        setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
        setUnreadCount(0);
    };

    const adminRole = adminData.role;
    const adminName = adminData.name;

    const handleLogout = () => {
        localStorage.removeItem('adminAuth');
        localStorage.removeItem('adminRole');
        localStorage.removeItem('adminToken');
        localStorage.removeItem('adminUsername');
        localStorage.removeItem('adminProfile');
        navigate('/admin/login');
    };

    const handleSearch = (e) => {
        setSearchQuery(e.target.value);
        // Search functionality can be implemented here
        console.log('Searching for:', e.target.value);
    };

    const hasAccess = (allowedRoles) => {
        return allowedRoles.includes(adminRole);
    };

    const getRoleTitle = () => {
        switch (adminRole) {
            case 'SUPER_ADMIN': return 'Super Admin';
            case 'ADMIN_USER': return 'User Admin';
            case 'ADMIN_LABOUR': return 'Labour Admin';
            case 'ADMIN_CONTRACTOR': return 'Contractor Admin';
            default: return 'Admin';
        }
    };

    const toggleMobileMenu = () => {
        setIsMobileMenuOpen(!isMobileMenuOpen);
    };

    const closeMobileMenu = () => {
        setIsMobileMenuOpen(false);
    };

    return (
        <div className="admin-dashboard-container">
            {/* Mobile Menu Toggle Button */}
            <button className="mobile-menu-toggle" onClick={toggleMobileMenu}>
                {isMobileMenuOpen ? <X size={24} /> : <BarChart3 size={24} />}
            </button>

            {/* Mobile Overlay */}
            <div
                className={`mobile-sidebar-overlay ${isMobileMenuOpen ? 'active' : ''}`}
                onClick={closeMobileMenu}
            ></div>

            {/* Sidebar */}
            <aside className={`admin-sidebar ${isMobileMenuOpen ? 'mobile-open' : ''}`}>
                <div className="admin-sidebar-logo">
                    <HardHat size={32} color="#f97316" />
                    <span>Majdoor Sathi</span>
                </div>
                <nav className="admin-sidebar-nav">
                    <NavLink
                        to="/admin/dashboard/home"
                        onClick={closeMobileMenu}
                        className={({ isActive }) => `admin-nav-item ${isActive ? 'active' : ''}`}
                    >
                        <LayoutDashboard size={20} />
                        <span>Dashboard</span>
                    </NavLink>

                    {hasAccess(['SUPER_ADMIN', 'ADMIN_USER']) && (
                        <NavLink
                            to="/admin/dashboard/users"
                            onClick={closeMobileMenu}
                            className={({ isActive }) => `admin-nav-item ${isActive ? 'active' : ''}`}
                        >
                            <Users size={20} />
                            <span>User Options</span>
                        </NavLink>
                    )}

                    {hasAccess(['SUPER_ADMIN', 'ADMIN_LABOUR']) && (
                        <NavLink
                            to="/admin/dashboard/labours"
                            onClick={closeMobileMenu}
                            className={({ isActive }) => `admin-nav-item ${isActive ? 'active' : ''}`}
                        >
                            <HardHat size={20} />
                            <span>Labour Options</span>
                        </NavLink>
                    )}

                    {hasAccess(['SUPER_ADMIN', 'ADMIN_LABOUR']) && (
                        <NavLink
                            to="/admin/dashboard/categories"
                            onClick={closeMobileMenu}
                            className={({ isActive }) => `admin-nav-item ${isActive ? 'active' : ''}`}
                        >
                            <SlidersHorizontal size={20} />
                            <span>Labour Category</span>
                        </NavLink>
                    )}

                    {hasAccess(['SUPER_ADMIN', 'ADMIN_CONTRACTOR']) && (
                        <NavLink
                            to="/admin/dashboard/contractors"
                            onClick={closeMobileMenu}
                            className={({ isActive }) => `admin-nav-item ${isActive ? 'active' : ''}`}
                        >
                            <Briefcase size={20} />
                            <span>Contractor Options</span>
                        </NavLink>
                    )}

                    {hasAccess(['SUPER_ADMIN']) && (
                        <NavLink
                            to="/admin/dashboard/verification"
                            onClick={closeMobileMenu}
                            className={({ isActive }) => `admin-nav-item ${isActive ? 'active' : ''}`}
                        >
                            <CheckCircle size={20} />
                            <span>Verification</span>
                        </NavLink>
                    )}

                    {hasAccess(['SUPER_ADMIN', 'ADMIN_USER']) && (
                        <NavLink
                            to="/admin/dashboard/broadcasts"
                            onClick={closeMobileMenu}
                            className={({ isActive }) => `admin-nav-item ${isActive ? 'active' : ''}`}
                        >
                            <Bell size={20} />
                            <span>Broadcast</span>
                        </NavLink>
                    )}

                    {hasAccess(['SUPER_ADMIN']) && (
                        <NavLink
                            to="/admin/dashboard/banners"
                            onClick={closeMobileMenu}
                            className={({ isActive }) => `admin-nav-item ${isActive ? 'active' : ''}`}
                        >
                            <Image size={20} />
                            <span>Banner Section</span>
                        </NavLink>
                    )}

                    {hasAccess(['SUPER_ADMIN']) && (
                        <NavLink
                            to="/admin/dashboard/get-started-slides"
                            onClick={closeMobileMenu}
                            className={({ isActive }) => `admin-nav-item ${isActive ? 'active' : ''}`}
                        >
                            <SlidersHorizontal size={20} />
                            <span>GetStarted Slides</span>
                        </NavLink>
                    )}

                    {hasAccess(['SUPER_ADMIN']) && (
                        <NavLink
                            to="/admin/dashboard/admins"
                            onClick={closeMobileMenu}
                            className={({ isActive }) => `admin-nav-item ${isActive ? 'active' : ''}`}
                        >
                            <UserCog size={20} />
                            <span>Admin Management</span>
                        </NavLink>
                    )}

                    <NavLink
                        to="/admin/dashboard/settings"
                        onClick={closeMobileMenu}
                        className={({ isActive }) => `admin-nav-item ${isActive ? 'active' : ''}`}
                    >
                        <Settings size={20} />
                        <span>Settings</span>
                    </NavLink>

                    <div
                        className="admin-nav-item"
                        style={{ marginTop: 'auto', color: '#ef4444' }}
                        onClick={handleLogout}
                    >
                        <LogOut size={20} />
                        <span>Logout</span>
                    </div>
                </nav>
            </aside>

            {/* Main Content */}
            <main className="admin-main">
                <header className="admin-header">
                    <div></div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>

                        {/* Bell Icon with Notification Dropdown */}
                        <div ref={notifRef} style={{ position: 'relative' }}>
                            <button
                                id="admin-bell-btn"
                                onClick={() => setShowNotifDropdown(prev => !prev)}
                                style={{
                                    position: 'relative', background: 'none', border: 'none',
                                    cursor: 'pointer', padding: '8px', borderRadius: '50%',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    transition: 'background 0.2s'
                                }}
                                title="Notifications"
                            >
                                <Bell size={22} color={unreadCount > 0 ? '#f97316' : '#6b7280'} />
                                {unreadCount > 0 && (
                                    <span style={{
                                        position: 'absolute', top: '2px', right: '2px',
                                        background: '#ef4444', color: 'white',
                                        borderRadius: '50%', width: '18px', height: '18px',
                                        fontSize: '0.65rem', fontWeight: 700,
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        border: '2px solid white'
                                    }}>
                                        {unreadCount > 9 ? '9+' : unreadCount}
                                    </span>
                                )}
                            </button>

                            {/* Dropdown */}
                            {showNotifDropdown && (
                                <div id="admin-notif-dropdown" style={{
                                    position: 'absolute', right: 0, top: '48px',
                                    width: '340px', background: 'white',
                                    borderRadius: '16px', boxShadow: '0 20px 40px rgba(0,0,0,0.15)',
                                    border: '1px solid #f3f4f6', zIndex: 1000, overflow: 'hidden'
                                }}>
                                    <div style={{
                                        padding: '16px 20px', borderBottom: '1px solid #f3f4f6',
                                        display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                                    }}>
                                        <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>Notifications</span>
                                        {unreadCount > 0 && (
                                            <button onClick={handleMarkAllRead} style={{
                                                background: 'none', border: 'none', color: '#f97316',
                                                fontSize: '0.8rem', cursor: 'pointer', fontWeight: 600
                                            }}>Mark all read</button>
                                        )}
                                    </div>
                                    <div style={{ maxHeight: '360px', overflowY: 'auto' }}>
                                        {notifications.length === 0 ? (
                                            <div style={{ padding: '32px', textAlign: 'center', color: '#9ca3af' }}>
                                                <Bell size={32} style={{ margin: '0 auto 12px', opacity: 0.3 }} />
                                                <p style={{ margin: 0, fontSize: '0.9rem' }}>No notifications yet</p>
                                            </div>
                                        ) : (
                                            notifications.map(notif => (
                                                <div
                                                    key={notif._id}
                                                    id={`notif-${notif._id}`}
                                                    onClick={() => handleNotifClick(notif)}
                                                    style={{
                                                        padding: '14px 20px',
                                                        cursor: 'pointer',
                                                        background: notif.isRead ? 'white' : '#fff7ed',
                                                        borderBottom: '1px solid #f9fafb',
                                                        transition: 'background 0.2s'
                                                    }}
                                                    onMouseEnter={e => e.currentTarget.style.background = '#f9fafb'}
                                                    onMouseLeave={e => e.currentTarget.style.background = notif.isRead ? 'white' : '#fff7ed'}
                                                >
                                                    <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                                                        <div style={{
                                                            width: '36px', height: '36px', borderRadius: '50%',
                                                            background: notif.isRead ? '#f3f4f6' : '#fff7ed',
                                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                            flexShrink: 0
                                                        }}>
                                                            <Bell size={16} color={notif.isRead ? '#9ca3af' : '#f97316'} />
                                                        </div>
                                                        <div style={{ flex: 1 }}>
                                                            <p style={{ margin: 0, fontWeight: notif.isRead ? 500 : 700, fontSize: '0.85rem', color: '#1a233a' }}>{notif.title}</p>
                                                            <p style={{ margin: '4px 0 0', fontSize: '0.78rem', color: '#6b7280', lineHeight: 1.4 }}>{notif.message}</p>
                                                            <p style={{ margin: '6px 0 0', fontSize: '0.72rem', color: '#9ca3af' }}>
                                                                {new Date(notif.createdAt).toLocaleString('en-IN', { hour: '2-digit', minute: '2-digit', day: 'numeric', month: 'short' })}
                                                            </p>
                                                        </div>
                                                        {!notif.isRead && <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#f97316', flexShrink: 0, marginTop: '4px' }}></div>}
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#ccc', overflow: 'hidden' }}>
                                <img src={`https://ui-avatars.com/api/?name=${encodeURIComponent(adminName)}&background=f97316&color=fff`} alt="Admin" style={{ width: '100%' }} />
                            </div>
                            <div style={{ cursor: 'default' }}>
                                <p style={{ fontWeight: 600, fontSize: '0.9rem', margin: 0 }}>{adminName}</p>
                                <p style={{ fontSize: '0.75rem', color: '#6b7280', margin: 0 }}>{getRoleTitle()}</p>
                            </div>
                        </div>
                    </div>
                </header>
                <div className="admin-tab-content">
                    <Outlet />
                </div>
            </main>
        </div>
    );
};

export default ProfessionalDashboard;
