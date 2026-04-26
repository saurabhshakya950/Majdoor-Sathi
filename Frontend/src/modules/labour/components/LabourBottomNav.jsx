import { useNavigate, useLocation } from 'react-router-dom';
import { Users, UserSearch, FileText, Settings } from 'lucide-react';
import { useState, useEffect } from 'react';
import { labourAPI } from '../../../services/api';

const LabourBottomNav = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [requestCount, setRequestCount] = useState(0);

    useEffect(() => {
        const fetchRequestCounts = async () => {
            try {
                const token = localStorage.getItem('access_token');
                if (!token) return;

                // Fetch all pending hire requests for this labour
                const response = await labourAPI.getLabourHireRequests({ status: 'pending' });
                
                if (response.success && response.data.hireRequests) {
                    setRequestCount(response.data.hireRequests.length);
                }
            } catch (error) {
                console.error('Error fetching labour request counts:', error);
            }
        };

        fetchRequestCounts();
        
        // Polling every 30 seconds to keep the badge up-to-date
        const interval = setInterval(fetchRequestCounts, 30000);
        
        return () => clearInterval(interval);
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
