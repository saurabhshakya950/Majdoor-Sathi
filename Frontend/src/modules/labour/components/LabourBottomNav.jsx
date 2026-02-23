import { useNavigate, useLocation } from 'react-router-dom';
import { Users, UserSearch, FileText, Settings } from 'lucide-react';
import { useState, useEffect } from 'react';

const LabourBottomNav = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [requestCount, setRequestCount] = useState(0);

    useEffect(() => {
        // Calculate total requests from localStorage
        const calculateRequests = () => {
            try {
                // Get user requests
                const userRequests = JSON.parse(localStorage.getItem('labour_user_requests') || '[]');
                // Get contractor requests
                const contractorRequests = JSON.parse(localStorage.getItem('labour_contractor_requests') || '[]');

                const total = userRequests.length + contractorRequests.length;
                setRequestCount(total);
            } catch (error) {
                console.error('Error calculating requests:', error);
                setRequestCount(0);
            }
        };

        calculateRequests();

        // Listen for storage changes
        window.addEventListener('storage', calculateRequests);

        return () => window.removeEventListener('storage', calculateRequests);
    }, []);

    const navItems = [
        { path: '/labour/find-user', icon: UserSearch, label: 'Find User' },
        { path: '/labour/find-contractor', icon: Users, label: 'Find Contractor' },
        { path: '/labour/requests', icon: FileText, label: 'Requests', badge: requestCount },
        { path: '/labour/settings', icon: Settings, label: 'Settings' }
    ];

    return (
        <nav className="fixed bottom-0 left-0 right-0 bg-black px-4 py-2 z-40">
            <div className="flex justify-around items-center max-w-md mx-auto">
                {navItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = location.pathname === item.path;

                    return (
                        <button
                            key={item.path}
                            onClick={() => navigate(item.path)}
                            className="flex flex-col items-center gap-1 py-1 px-3 transition-colors relative"
                        >
                            <div className="relative">
                                <Icon
                                    className={`w-6 h-6 ${isActive ? 'text-yellow-400' : 'text-white'
                                        }`}
                                />
                                {item.badge > 0 && (
                                    <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                                        {item.badge > 9 ? '9+' : item.badge}
                                    </span>
                                )}
                            </div>
                            <span
                                className={`text-xs font-medium ${isActive ? 'text-yellow-400' : 'text-white'
                                    }`}
                            >
                                {item.label}
                            </span>
                        </button>
                    );
                })}
            </div>
        </nav>
    );
};

export default LabourBottomNav;
