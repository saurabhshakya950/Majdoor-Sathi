import { useNavigate, useLocation } from 'react-router-dom';
import { useState, useEffect, memo } from 'react';
import { Crown, Bell } from 'lucide-react';
import logo from '../../../assets/Majdoor Sathi.png';
import SubscriptionComingSoon from '../../../components/SubscriptionComingSoon';

const UserHeader = memo(() => {
    const navigate = useNavigate();
    const location = useLocation();
    const [userName, setUserName] = useState('');
    const [notificationCount, setNotificationCount] = useState(0);
    const [isSubModalOpen, setIsSubModalOpen] = useState(false);

    useEffect(() => {
        // Load name from localStorage immediately for instant display
        const loadNameFromStorage = () => {
            try {
                const profile = JSON.parse(localStorage.getItem('user_profile') || '{}');
                if (profile.firstName) {
                    setUserName(profile.firstName);
                    return true;
                }
            } catch (error) {
                console.error('Error reading user profile from localStorage:', error);
            }
            return false;
        };

        // Load from localStorage first
        loadNameFromStorage();

        // Fetch user profile from API to sync
        const fetchUserProfile = async () => {
            try {
                const token = localStorage.getItem('access_token');
                if (!token) return;

                const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/users/profile`, {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });

                const data = await response.json();
                if (data.success && data.data.user) {
                    const user = data.data.user;
                    if (user.firstName) {
                        setUserName(user.firstName);
                        
                        // Update localStorage for next time
                        try {
                            const existingProfile = JSON.parse(localStorage.getItem('user_profile') || '{}');
                            existingProfile.firstName = user.firstName;
                            localStorage.setItem('user_profile', JSON.stringify(existingProfile));
                        } catch (error) {
                            console.error('Error updating localStorage:', error);
                        }
                    } else {
                        // If no firstName, show mobile number or "User"
                        const mobileNumber = localStorage.getItem('mobile_number');
                        setUserName(mobileNumber ? `User ${mobileNumber.slice(-4)}` : 'User');
                    }
                }
            } catch (error) {
                console.error('Error fetching user profile:', error);
                // Keep the localStorage name if API fails
            }
        };

        // Fetch from API (will update if different)
        fetchUserProfile();

        // Listen for custom profile update event
        const handleProfileUpdate = () => {
            loadNameFromStorage();
            fetchUserProfile();
        };

        window.addEventListener('profileUpdated', handleProfileUpdate);

        // Cleanup
        return () => {
            window.removeEventListener('profileUpdated', handleProfileUpdate);
        };
    }, []); // Empty dependency array - only run once on mount

    useEffect(() => {
        // Fetch notification count
        const fetchNotificationCount = async () => {
            try {
                const token = localStorage.getItem('access_token');
                if (!token) return;

                const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/notifications/unread-count?userType=USER`, {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });

                const data = await response.json();
                if (data.success) {
                    setNotificationCount(data.data.count || 0);
                }
            } catch (error) {
                console.error('Error fetching notification count:', error);
            }
        };

        fetchNotificationCount();

        // Listen for notificationsRead event to update count instantly
        const handleNotificationsRead = () => {
            setNotificationCount(0);
        };
        window.addEventListener('notificationsRead', handleNotificationsRead);

        // Refresh count every 30 seconds
        const interval = setInterval(fetchNotificationCount, 30000);

        return () => {
            clearInterval(interval);
            window.removeEventListener('notificationsRead', handleNotificationsRead);
        };
    }, [location]);

    const handleSubscription = () => {
        setIsSubModalOpen(true);
    };

    const handleNotifications = () => {
        navigate('/user/notifications');
    };

    return (
        <div className="bg-white px-3 py-4 border-b border-gray-100">
            <div className="flex items-center justify-between">
                {/* Left Side - Logo and Welcome Text */}
                <div className="flex items-center gap-2">
                    {/* Logo */}
                    <img 
                        src={logo} 
                        alt="Majdoor Sathi" 
                        className="h-16 w-auto object-contain"
                    />
                    
                    {/* Welcome Text and Name */}
                    <div>
                        <p className="text-xs text-gray-500 leading-tight whitespace-nowrap">Hey, Welcome 👋</p>
                        <h1 className="text-sm font-bold text-gray-900 leading-tight whitespace-nowrap">
                            {userName || '\u00A0'}
                        </h1>
                    </div>
                </div>

                {/* Right Side - Bell Icon & Subscription Icon */}
                <div className="flex items-center gap-2.5">
                    <button
                        onClick={handleNotifications}
                        className="bg-blue-500 hover:bg-blue-600 p-2.5 rounded-full transition-colors active:scale-95 relative"
                    >
                        <Bell className="w-5 h-5 text-white" />
                        {/* Notification Badge */}
                        {notificationCount > 0 && (
                            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center font-bold">
                                {notificationCount > 99 ? '99+' : notificationCount}
                            </span>
                        )}
                    </button>

                    <button
                        onClick={handleSubscription}
                        className="bg-gray-200 hover:bg-gray-300 p-2.5 rounded-full transition-colors active:scale-95"
                    >
                        <Crown className="w-5 h-5 text-gray-700" />
                    </button>
                </div>
            </div>

            <SubscriptionComingSoon 
                isOpen={isSubModalOpen} 
                onClose={() => setIsSubModalOpen(false)} 
                type="USER" 
            />
        </div>
    );
});

UserHeader.displayName = 'UserHeader';

export default UserHeader;

