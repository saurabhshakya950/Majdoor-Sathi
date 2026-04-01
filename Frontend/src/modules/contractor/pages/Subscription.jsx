import React, { useState } from 'react';
import { Crown } from 'lucide-react';
import ContractorPageHeader from '../components/ContractorPageHeader';
import SubscriptionComingSoon from '../../../components/SubscriptionComingSoon';

const Subscription = () => {
    const [isModalOpen, setIsModalOpen] = useState(true);

    return (
        <div className="bg-gray-50 flex flex-col min-h-screen">
            <ContractorPageHeader title="Subscription Plans" icon={Crown} sticky />

            <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
                <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 max-w-sm w-full">
                    <div className="w-20 h-20 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-6">
                        <Crown className="w-10 h-10 text-indigo-600 animate-pulse" />
                    </div>
                    <h2 className="text-xl font-bold text-gray-900 mb-2">Contractor Pro Subscriptions</h2>
                    <p className="text-gray-500 mb-6 text-sm">
                        Boost your business! Currently all features are free for some time.
                    </p>
                    <button 
                        onClick={() => setIsModalOpen(true)}
                        className="w-full py-3 px-6 bg-indigo-600 text-white font-bold rounded-xl shadow-md hover:bg-indigo-700 transition-all"
                    >
                        More Info
                    </button>
                </div>
            </div>

            <SubscriptionComingSoon 
                isOpen={isModalOpen} 
                onClose={() => setIsModalOpen(false)} 
                type="CONTRACTOR" 
            />
        </div>
    );
};

export default Subscription;
