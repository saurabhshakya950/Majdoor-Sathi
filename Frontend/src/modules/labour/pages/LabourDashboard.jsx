import { useEffect, useState } from 'react';
import { Search, SlidersHorizontal } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import LabourBottomNav from '../components/LabourBottomNav';
import LabourHeader from '../components/LabourHeader';
import PromotionalBanner from '../../../components/shared/PromotionalBanner';


const LabourDashboard = () => {
    const navigate = useNavigate();
    const [searchQuery, setSearchQuery] = useState('');

    return (
        <div className="bg-gray-50 flex flex-col overflow-hidden" style={{ height: '100dvh', minHeight: '-webkit-fill-available' }}>
            {/* Header */}
            <LabourHeader />

            {/* Search Bar */}
            <div className="bg-white px-4 py-3 shadow-sm">
                <div className="flex items-center gap-3">
                    <div className="flex-1 flex items-center bg-gray-100 rounded-lg px-4 py-2">
                        <Search className="w-5 h-5 text-gray-400 mr-2" />
                        <input
                            type="text"
                            placeholder="Search"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="flex-1 bg-transparent outline-none text-gray-700 placeholder-gray-400"
                        />
                    </div>
                    <button className="p-2 bg-gray-100 rounded-lg">
                        <SlidersHorizontal className="w-5 h-5 text-gray-600" />
                    </button>
                </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto pb-20">
                <div className="p-4">
                    {/* Promotional Banners */}
                    <PromotionalBanner />
                </div>

                <div className="flex items-center justify-center p-8">
                    <p className="text-gray-400 text-center">
                        Hire Workers content will be displayed here
                    </p>
                </div>
            </div>


            {/* Bottom Navigation */}
            <LabourBottomNav />
        </div>
    );
};

export default LabourDashboard;
