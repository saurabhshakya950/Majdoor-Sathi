import React, { useState } from 'react';
import { Crown } from 'lucide-react';
import PageHeader from '../components/PageHeader';
import SubscriptionComingSoon from '../../../components/SubscriptionComingSoon';

const Subscription = () => {
    // Page state to show the modal automatically on this page
    const [isModalOpen, setIsModalOpen] = useState(true);

    return (
        <div className="bg-gray-50 flex flex-col min-h-screen">
            <PageHeader title="Subscription Plans" icon={Crown} sticky />

            <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
                <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 max-w-sm w-full">
                    <div className="w-20 h-20 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-6">
                        <Crown className="w-10 h-10 text-yellow-600 animate-pulse" />
                    </div>
                    <h2 className="text-xl font-bold text-gray-900 mb-2">Premium Plans Coming Soon</h2>
                    <p className="text-gray-500 mb-6 text-sm">
                        We are currently offering all premium features for free. Enjoy the full experience!
                    </p>
                    <button 
                        onClick={() => setIsModalOpen(true)}
                        className="w-full py-3 px-6 bg-blue-600 text-white font-bold rounded-xl shadow-md hover:bg-blue-700 transition-all"
                    >
                        Learn More
                    </button>
                </div>
            </div>

            {/* This modal provides the detailed information and 'Shake' effect */}
            <SubscriptionComingSoon 
                isOpen={isModalOpen} 
                onClose={() => setIsModalOpen(false)} 
                type="USER" 
            />
        </div>
    );
};

export default Subscription;
