import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { Crown } from 'lucide-react';
import toast from 'react-hot-toast';
import ContractorPageHeader from '../components/ContractorPageHeader';
import BillingCycleToggle from '../../user/components/BillingCycleToggle';
import SubscriptionPlanCard from '../../user/components/SubscriptionPlanCard';
import InfoBox from '../../user/components/InfoBox';

const Subscription = () => {
    const navigate = useNavigate();
    const [currentPlan, setCurrentPlan] = useState('free');
    const [billingCycle, setBillingCycle] = useState('monthly');

    useEffect(() => {
        const savedPlan = localStorage.getItem('contractor_subscription_plan') || 'free';
        setCurrentPlan(savedPlan);
    }, []);

    const plans = [
        {
            id: 'free',
            name: 'Free Plan',
            description: 'Perfect for getting started',
            monthlyPrice: 0,
            yearlyPrice: 0,
            color: 'gray',
            features: [
                { text: 'View limited user job postings', included: true },
                { text: 'Apply to a limited number of projects', included: true },
                { text: 'Basic contractor profile visibility', included: true },
                { text: 'Unlimited job applications', included: false },
                { text: 'Highlighted contractor profile', included: false },
                { text: 'Access to premium user projects', included: false },
                { text: 'Team and labour management features', included: false },
                { text: 'Higher ranking in search results', included: false }
            ]
        },
        {
            id: 'pro',
            name: 'Pro Contractor Plan',
            description: 'Best for professional contractors',
            monthlyPrice: 799,
            yearlyPrice: 7999,
            color: 'yellow',
            popular: true,
            features: [
                { text: 'View limited user job postings', included: true },
                { text: 'Apply to a limited number of projects', included: true },
                { text: 'Basic contractor profile visibility', included: true },
                { text: 'Unlimited job applications', included: true },
                { text: 'Highlighted contractor profile', included: true },
                { text: 'Access to premium user projects', included: true },
                { text: 'Team and labour management features', included: true },
                { text: 'Higher ranking in search results', included: true }
            ]
        }
    ];

    const handleSubscribe = (planId) => {
        if (planId === currentPlan) return;

        localStorage.setItem('contractor_subscription_plan', planId);
        setCurrentPlan(planId);
        toast.success('Subscription activated successfully');
    };

    return (
        <div className="bg-gray-50 flex flex-col overflow-hidden" style={{ height: '100dvh', minHeight: '-webkit-fill-available' }}>
            <ContractorPageHeader title="Subscription Plans" icon={Crown} sticky />

            <div className="flex-1 overflow-y-auto">
                <div className="p-4 pb-12">
                    <BillingCycleToggle
                        billingCycle={billingCycle}
                        onChange={setBillingCycle}
                    />

                    <div className="space-y-4 mt-6">
                        {plans.map((plan) => (
                            <SubscriptionPlanCard
                                key={plan.id}
                                plan={plan}
                                billingCycle={billingCycle}
                                isCurrentPlan={currentPlan === plan.id}
                                onSubscribe={handleSubscribe}
                            />
                        ))}
                    </div>

                    <div className="mt-6">
                        <InfoBox
                            variant="info"
                            message="💡 You can upgrade or downgrade your plan anytime. Changes take effect immediately."
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Subscription;
