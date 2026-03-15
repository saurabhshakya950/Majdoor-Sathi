import { useNavigate } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import LabourBottomNav from '../components/LabourBottomNav';

const LabourPaymentDetails = () => {
    const navigate = useNavigate();

    return (
        <div className="bg-gray-50 flex flex-col overflow-hidden" style={{ height: '100dvh', minHeight: '-webkit-fill-available' }}>
            <div className="bg-white px-4 py-4 shadow-sm flex items-center gap-3">
                <button onClick={() => navigate(-1)} className="p-1">
                    <ChevronLeft className="w-6 h-6" />
                </button>
                <h1 className="text-xl font-bold">Payment Details</h1>
            </div>
            <div className="flex-1 overflow-y-auto p-4 pb-20">
                <p className="text-gray-400 text-center">Payment details will be displayed here</p>
            </div>
            <LabourBottomNav />
        </div>
    );
};

export default LabourPaymentDetails;
