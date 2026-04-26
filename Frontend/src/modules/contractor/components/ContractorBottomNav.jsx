import { useNavigate, useLocation } from 'react-router-dom';
import { Home, Users, Search, FileText, Settings } from 'lucide-react';
import { useState, useEffect } from 'react';
import { contractorAPI, jobAPI } from '../../../services/api';

const ContractorBottomNav = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [requestCount, setRequestCount] = useState(0);

    useEffect(() => {
        const fetchRequestCounts = async () => {
            try {
                const token = localStorage.getItem('access_token');
                if (!token) return;

                // 1. Fetch Hire Requests from Users
                const hireRes = await contractorAPI.getContractorHireRequests();
                const pendingUserRequests = hireRes.success 
                    ? hireRes.data.requests.filter(r => r.status === 'Pending').length 
                    : 0;

                // 2. Fetch Labour Applications for Contractor's Jobs
                const jobsRes = await contractorAPI.getContractorJobs();
                let pendingWorkerApps = 0;
                if (jobsRes.success && jobsRes.data.jobs) {
                    jobsRes.data.jobs.forEach(job => {
                        if (job.applications) {
                            pendingWorkerApps += job.applications.filter(a => a.status === 'Pending').length;
                        }
                    });
                }

                setRequestCount(pendingUserRequests + pendingWorkerApps);
            } catch (error) {
                console.error('Error fetching contractor request counts:', error);
            }
        };

        fetchRequestCounts();
        const interval = setInterval(fetchRequestCounts, 30000);
        return () => clearInterval(interval);
    }, []);

    const navItems = [
        { path: '/contractor/home', label: 'Home', icon: Home },
        { path: '/contractor/hire-workers', label: 'Hire Workers', icon: Users },
        { path: '/contractor/find-user', label: 'Find User', icon: Search },
        { path: '/contractor/requests', label: 'Requests', icon: FileText, badge: requestCount },
        { path: '/contractor/settings', label: 'Settings', icon: Settings }
    ];

    return (
        <div className="fixed bottom-0 left-0 right-0 bg-black shadow-lg z-40">
            <div className="flex justify-around items-center h-16 px-2">
                {navItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = location.pathname === item.path;

                    return (
                        <button
                            key={item.path}
                            onClick={() => {
                                if (isActive) {
                                    window.location.reload();
                                } else {
                                    navigate(item.path);
                                }
                            }}
                            className={`flex flex-col items-center justify-center flex-1 h-full transition-colors relative ${isActive ? 'text-yellow-400' : 'text-white'
                                }`}
                        >
                            <div className="relative">
                                <Icon className={`w-6 h-6 mb-1 ${isActive ? 'text-yellow-400' : 'text-white'}`} />
                                {item.badge > 0 && (
                                    <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                                        {item.badge > 9 ? '9+' : item.badge}
                                    </span>
                                )}
                            </div>
                            <span className={`text-xs font-medium ${isActive ? 'text-yellow-400' : 'text-white'}`}>
                                {item.label}
                            </span>
                        </button>
                    );
                })}
            </div>
        </div>
    );
};

export default ContractorBottomNav;
