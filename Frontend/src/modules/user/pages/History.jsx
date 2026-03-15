import { useState, useEffect } from 'react';
import { Filter, Users } from 'lucide-react';
import UserBottomNav from '../components/UserBottomNav';
import UserHeader from '../components/UserHeader';
import ContractorRequestCard from '../components/ContractorRequestCard';
import WorkerRequestCard from '../components/WorkerRequestCard';
import { jobAPI } from '../../../services/api';
import toast from 'react-hot-toast';

const History = () => {
    const [activeFilter, setActiveFilter] = useState('all'); // all, contractor, worker
    const [history, setHistory] = useState([]);
    const [filteredHistory, setFilteredHistory] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadHistory();

        // Auto-refresh every 10 seconds
        const interval = setInterval(() => {
            if (!document.hidden) {
                console.log('🔄 Auto-refreshing history...');
                loadHistory();
            }
        }, 10000);

        return () => clearInterval(interval);
    }, []);

    const loadHistory = async () => {
        try {
            console.log('🔵 Loading application history from database...');
            const response = await jobAPI.getApplicationHistory();

            if (response.success) {
                console.log('✅ History loaded:', response.data.history.length, 'items');
                console.log('📊 History data sample:', response.data.history[0]);
                setHistory(response.data.history);
                setFilteredHistory(response.data.history);
            }
        } catch (error) {
            console.error('❌ Failed to load history:', error);
            // Fallback to localStorage
            const savedHistory = JSON.parse(localStorage.getItem('request_history') || '[]');
            setHistory(savedHistory);
            setFilteredHistory(savedHistory);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        // Filter history based on active filter
        if (activeFilter === 'all') {
            setFilteredHistory(history);
        } else if (activeFilter === 'contractor') {
            setFilteredHistory(history.filter(item => item.type === 'contractor'));
        } else if (activeFilter === 'worker') {
            setFilteredHistory(history.filter(item => item.type === 'worker'));
        }
    }, [activeFilter, history]);

    return (
        <div className="bg-gray-50 flex flex-col overflow-hidden" style={{ height: '100dvh', minHeight: '-webkit-fill-available' }}>
            <div className="sticky top-0 z-10 bg-white">
                <UserHeader />
            </div>

            <div className="flex-1 overflow-y-auto">
                <div className="p-4 pb-24">
                    <h2 className="text-xl font-bold text-gray-900 mb-4">Request History</h2>

                    {/* Filter Tabs */}
                    <div className="flex gap-2 mb-4 bg-white p-2 rounded-lg shadow-sm sticky top-0 z-10">
                        <button
                            onClick={() => setActiveFilter('all')}
                            className={`flex-1 py-2 px-4 rounded-lg font-medium text-sm transition-all ${activeFilter === 'all'
                                    ? 'bg-yellow-400 text-gray-900'
                                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                }`}
                        >
                            All ({history.length})
                        </button>
                        <button
                            onClick={() => setActiveFilter('contractor')}
                            className={`flex-1 py-2 px-4 rounded-lg font-medium text-sm transition-all ${activeFilter === 'contractor'
                                    ? 'bg-blue-500 text-white'
                                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                }`}
                        >
                            Contr. ({history.filter(h => h.type === 'contractor').length})
                        </button>
                        <button
                            onClick={() => setActiveFilter('worker')}
                            className={`flex-1 py-2 px-4 rounded-lg font-medium text-sm transition-all ${activeFilter === 'worker'
                                    ? 'bg-green-500 text-white'
                                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                }`}
                        >
                            Workers ({history.filter(h => h.type === 'worker').length})
                        </button>
                    </div>

                    {/* History Cards */}
                    {loading ? (
                        <div className="bg-white rounded-lg shadow-sm p-8 text-center">
                            <p className="text-gray-600">Loading history...</p>
                        </div>
                    ) : filteredHistory.length === 0 ? (
                        <div className="bg-white rounded-lg shadow-sm p-8 text-center">
                            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Users className="w-8 h-8 text-gray-400" />
                            </div>
                            <p className="text-gray-600 font-medium mb-1">No History Found</p>
                            <p className="text-sm text-gray-500">
                                {activeFilter === 'all'
                                    ? 'Your request history will appear here'
                                    : `No ${activeFilter} requests in history`}
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {filteredHistory.map((item, index) => (
                                <div key={item.id} className="relative">
                                    {item.type === 'contractor' ? (
                                        <ContractorRequestCard
                                            request={item}
                                            index={index}
                                            showButtons={false}
                                            showStatus={true}
                                        />
                                    ) : (
                                        <WorkerRequestCard
                                            request={item}
                                            index={index}
                                            showButtons={false}
                                            showStatus={true}
                                        />
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            <UserBottomNav />
        </div>
    );
};

export default History;
