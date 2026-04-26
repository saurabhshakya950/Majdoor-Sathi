import { useNavigate, useLocation } from 'react-router-dom';
import { Home, Users, Search, FileText, Settings } from 'lucide-react';
import { useState, useEffect } from 'react';
import { jobAPI } from '../../../services/api';

const UserBottomNav = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [requestCount, setRequestCount] = useState(0);

    useEffect(() => {
        const fetchRequestCounts = async () => {
            try {
                const token = localStorage.getItem('access_token');
                if (!token) return;

                // 1. Fetch Contractor Applications
                const contractorRes = await jobAPI.getContractorApplications();
                const pendingContractors = contractorRes.success 
                    ? contractorRes.data.applications.filter(a => a.status === 'Pending').length 
                    : 0;

                // 2. Fetch Worker Applications from all User Jobs
                const jobsRes = await jobAPI.getUserJobs();
                let pendingWorkers = 0;
                if (jobsRes.success && jobsRes.data.jobs) {
                    jobsRes.data.jobs.forEach(job => {
                        if (job.applications) {
                            pendingWorkers += job.applications.filter(a => 
                                a.status === 'Pending' && a.applicantType === 'Labour'
                            ).length;
                        }
                    });
                }

                setRequestCount(pendingContractors + pendingWorkers);
            } catch (error) {
                console.error('Error fetching request counts:', error);
            }
        };

        fetchRequestCounts();

        // Refresh every 30 seconds (Standard polling)
        const interval = setInterval(fetchRequestCounts, 30000);

        return () => clearInterval(interval);
    }, []);

    const navItems = [
        { path: '/user/home', label: 'Home', icon: Home },
        { path: '/user/hire-workers', label: 'Hire Workers', icon: Users },
        { path: '/user/find-contractor', label: 'Find Contractor', icon: Search },
        { path: '/user/requests', label: 'Requests', icon: FileText, badge: requestCount },
        { path: '/user/settings', label: 'Settings', icon: Settings }
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

export default UserBottomNav;
