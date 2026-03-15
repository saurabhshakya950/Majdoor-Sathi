import { useNavigate, useLocation } from 'react-router-dom';
import { useState, useEffect, memo } from 'react';
import { Crown, Bell } from 'lucide-react';
import logo from '../../../assets/Majdoor Sathi.png';

const LabourHeader = memo(() => {
    const navigate = useNavigate();
    const location = useLocation();
    const [labourName, setLabourName] = useState('');
    const [notificationCount, setNotificationCount] = useState(0);

    useEffect(() => {
        // Load name from localStorage immediately for instant display
        const loadNameFromStorage = () => {
            try {
                const profile = JSON.parse(localStorage.getItem('labour_profile') || '{}');
                if (profile.firstName) {
                    setLabourName(profile.firstName);
                    return true;
                }
            } catch (error) {
                console.error('Error reading labour profile from localStorage:', error);
            }
            return false;
        };

        // Load from localStorage first (instant display, no flash)
        loadNameFromStorage();

        // Fetch labour profile from API to sync
        const fetchLabourProfile = async () => {
            try {
                const token = localStorage.getItem('access_token');
                if (!token) {
                    console.log('No access token found');
                    return;
                }

                const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/labour/profile`, {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });

                const data = await response.json();
                console.log('âœ… Labour profile fetched:', data);

                if (data.success && data.data) {
                    const labour = data.data.labour;
                    const displayName = data.data.displayName;

                    if (displayName) {
                        setLabourName(displayName);
                        console.log('âœ… Name set:', displayName);

                        // Update localStorage for next time
                        try {
                            const existingProfile = JSON.parse(localStorage.getItem('labour_profile') || '{}');
                            existingProfile.firstName = displayName;
                            localStorage.setItem('labour_profile', JSON.stringify(existingProfile));
                        } catch (error) {
                            console.error('Error updating localStorage:', error);
                        }
                    } else {
                        // Fallback to mobile number
                        const mobileNumber = localStorage.getItem('mobile_number');
                        setLabourName(mobileNumber ? `Labour ${mobileNumber.slice(-4)}` : 'Labour');
                        console.log('âš ï¸ No name found, using fallback');
                    }
                }
            } catch (error) {
                console.error('âŒ Error fetching labour profile:', error);
                // Keep the localStorage name if API fails
            }
        };

        // Fetch from API (will update if different)
        fetchLabourProfile();

        // Listen for profile update events
        const handleProfileUpdate = () => {
            console.log('ðŸ“¢ Profile update event received');
            loadNameFromStorage();
            fetchLabourProfile();
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

                const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/notifications/unread-count?userType=LABOUR`, {
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

        // Refresh count every 30 seconds
        const interval = setInterval(fetchNotificationCount, 30000);

        return () => clearInterval(interval);
    }, [location]);

    const handleNotifications = () => {
        navigate('/labour/notifications');
    };

    const handleSubscription = () => {
        navigate('/labour/subscription');
    };

    return (
        <div className="bg-white px-3 py-4 border-b border-gray-100">
            <div className="flex items-center justify-between">
                {/* Left Side - Logo and Welcome Text (compact, no extra space) */}
                <div className="flex items-center gap-2">
                    {/* Logo - Exact size, no extra width */}
                    <img
                        src={logo}
                        alt="Majdoor Sathi"
                        className="h-16 w-auto object-contain"
                    />

                    {/* Welcome Text and Name - Right next to logo */}
                    <div>
                        <p className="text-xs text-gray-500 leading-tight whitespace-nowrap">Hey, Welcome 👋</p>
                        <h1 className="text-sm font-bold text-gray-900 leading-tight whitespace-nowrap">
                            {labourName || '\u00A0'}
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
        </div>
    );
});

LabourHeader.displayName = 'LabourHeader';

export default LabourHeader;

