import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { Crown } from 'lucide-react';
import toast from 'react-hot-toast';
import PageHeader from '../components/PageHeader';
import BillingCycleToggle from '../components/BillingCycleToggle';
import SubscriptionPlanCard from '../components/SubscriptionPlanCard';
import InfoBox from '../components/InfoBox';

const Subscription = () => {
    const navigate = useNavigate();
    const [currentPlan, setCurrentPlan] = useState('free');
    const [billingCycle, setBillingCycle] = useState('monthly');

    useEffect(() => {
        const savedPlan = localStorage.getItem('subscription_plan') || 'free';
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
                { text: 'View labour profiles', included: true },
                { text: 'View contractor profiles', included: true },
                { text: 'Post limited jobs (1-2 jobs)', included: true },
                { text: 'Receive basic requests', included: true },
                { text: 'Unlimited job posting', included: false },
                { text: 'Priority visibility', included: false },
                { text: 'Direct contact access', included: false },
                { text: 'Faster response time', included: false }
            ]
        },
        {
            id: 'premium',
            name: 'Premium User Plan',
            description: 'Best for active users',
            monthlyPrice: 499,
            yearlyPrice: 4999,
            color: 'yellow',
            popular: true,
            features: [
                { text: 'View labour profiles', included: true },
                { text: 'View contractor profiles', included: true },
                { text: 'Unlimited job posting', included: true },
                { text: 'Priority visibility to labours & contractors', included: true },
                { text: 'Direct contact access (call/chat)', included: true },
                { text: 'Faster response time', included: true },
                { text: 'Highlighted user profile', included: true },
                { text: '24/7 Priority support', included: true }
            ]
        }
    ];

    const handleSubscribe = (planId) => {
        if (planId === currentPlan) return;

        localStorage.setItem('subscription_plan', planId);
        setCurrentPlan(planId);
        toast.success('Subscription activated successfully');
    };

    return (
        <div className="bg-gray-50 flex flex-col overflow-hidden" style={{ height: '100dvh', minHeight: '-webkit-fill-available' }}>
            <PageHeader title="Subscription Plans" icon={Crown} sticky />

            <div className="flex-1 overflow-y-auto">
                <div className="p-4 pb-8">
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
