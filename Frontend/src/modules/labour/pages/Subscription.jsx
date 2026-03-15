import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Check, X } from 'lucide-react';
import LabourBottomNav from '../components/LabourBottomNav';
import toast from 'react-hot-toast';

const Subscription = () => {
    const navigate = useNavigate();
    const [billingCycle, setBillingCycle] = useState('monthly');
    const [currentPlan, setCurrentPlan] = useState('free'); // 'free' or 'premium'

    const plans = [
        {
            id: 'free',
            name: 'Free Plan',
            monthlyPrice: 0,
            yearlyPrice: 0,
            description: 'Basic features for getting started',
            features: [
                { text: 'View limited user job postings', included: true },
                { text: 'Apply to a limited number of jobs', included: true },
                { text: 'Basic labour profile visibility', included: true },
                { text: 'Unlimited job applications', included: false },
                { text: 'Higher visibility to users', included: false },
                { text: 'Priority listing in search', included: false },
                { text: 'Profile verification badge', included: false }
            ],
            color: 'gray'
        },
        {
            id: 'premium',
            name: 'Skilled / Premium Labour Plan',
            monthlyPrice: 499,
            yearlyPrice: 4999,
            description: 'Advanced features for professional labours',
            features: [
                { text: 'View limited user job postings', included: true },
                { text: 'Apply to a limited number of jobs', included: true },
                { text: 'Basic labour profile visibility', included: true },
                { text: 'Unlimited job applications', included: true },
                { text: 'Higher visibility to users and contractors', included: true },
                { text: 'Priority listing in search results', included: true },
                { text: 'Profile verification badge', included: true }
            ],
            color: 'yellow',
            popular: true
        }
    ];

    const handleSubscribe = (planId) => {
        if (planId === currentPlan) return;

        setCurrentPlan(planId);
        localStorage.setItem('labour_subscription', planId);
        toast.success('Subscription activated successfully!');
    };

    return (
        <div className="bg-gray-50 flex flex-col overflow-hidden" style={{ height: '100dvh', minHeight: '-webkit-fill-available' }}>
            {/* Header */}
            <div className="bg-white px-4 py-4 shadow-sm flex items-center gap-3 sticky top-0 z-10">
                <button
                    onClick={() => navigate(-1)}
                    className="p-1 hover:bg-gray-100 rounded-full transition-colors"
                >
                    <ChevronLeft className="w-6 h-6 text-gray-700" />
                </button>
                <h1 className="text-xl font-bold text-gray-900">Subscription Plans</h1>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4 pb-20">
                {/* Billing Cycle Toggle */}
                <div className="bg-white rounded-2xl p-1 flex mb-6 shadow-sm">
                    <button
                        onClick={() => setBillingCycle('monthly')}
                        className={`flex-1 py-3 rounded-xl font-semibold text-sm transition-all ${billingCycle === 'monthly'
                                ? 'bg-yellow-400 text-gray-900'
                                : 'text-gray-600'
                            }`}
                    >
                        Monthly
                    </button>
                    <button
                        onClick={() => setBillingCycle('yearly')}
                        className={`flex-1 py-3 rounded-xl font-semibold text-sm transition-all ${billingCycle === 'yearly'
                                ? 'bg-yellow-400 text-gray-900'
                                : 'text-gray-600'
                            }`}
                    >
                        Yearly
                        <span className="ml-1 text-xs text-green-600">(Save 17%)</span>
                    </button>
                </div>

                {/* Plans */}
                <div className="space-y-4">
                    {plans.map((plan) => (
                        <div
                            key={plan.id}
                            className={`bg-white rounded-2xl p-6 shadow-sm border-2 ${plan.popular ? 'border-yellow-400' : 'border-transparent'
                                } relative`}
                        >
                            {plan.popular && (
                                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-yellow-400 text-gray-900 px-4 py-1 rounded-full text-xs font-bold">
                                    RECOMMENDED
                                </div>
                            )}

                            {/* Plan Header */}
                            <div className="mb-4">
                                <h3 className="text-xl font-bold text-gray-900 mb-2">
                                    {plan.name}
                                </h3>
                                <div className="flex items-baseline gap-2 mb-2">
                                    <span className="text-3xl font-bold text-gray-900">
                                        ₹{billingCycle === 'monthly' ? plan.monthlyPrice : plan.yearlyPrice}
                                    </span>
                                    <span className="text-gray-500">
                                        /{billingCycle === 'monthly' ? 'month' : 'year'}
                                    </span>
                                </div>
                                <p className="text-sm text-gray-600">{plan.description}</p>
                            </div>

                            {/* Features */}
                            <div className="space-y-3 mb-6">
                                {plan.features.map((feature, index) => (
                                    <div key={index} className="flex items-start gap-3">
                                        {feature.included ? (
                                            <div className="w-5 h-5 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                                                <Check className="w-3 h-3 text-green-600" />
                                            </div>
                                        ) : (
                                            <div className="w-5 h-5 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                                                <X className="w-3 h-3 text-gray-400" />
                                            </div>
                                        )}
                                        <span className={`text-sm ${feature.included ? 'text-gray-700' : 'text-gray-400'
                                            }`}>
                                            {feature.text}
                                        </span>
                                    </div>
                                ))}
                            </div>

                            {/* Subscribe Button */}
                            {currentPlan === plan.id ? (
                                <button
                                    disabled
                                    className="w-full py-3 rounded-full bg-gray-200 text-gray-500 font-semibold cursor-not-allowed"
                                >
                                    Current Plan
                                </button>
                            ) : (
                                <button
                                    onClick={() => handleSubscribe(plan.id)}
                                    className={`w-full py-3 rounded-full font-semibold transition-all ${plan.color === 'yellow'
                                            ? 'bg-yellow-400 hover:bg-yellow-500 text-gray-900'
                                            : 'bg-gray-900 hover:bg-gray-800 text-white'
                                        }`}
                                >
                                    {plan.id === 'free' ? 'Downgrade' : 'Upgrade to Premium'}
                                </button>
                            )}
                        </div>
                    ))}
                </div>

                {/* Info Note */}
                <div className="mt-6 bg-blue-50 border border-blue-200 rounded-xl p-4">
                    <p className="text-sm text-blue-800">
                        <span className="font-semibold">Note:</span> Payment integration will be available in future updates.
                        For now, you can explore the subscription features.
                    </p>
                </div>
            </div>

            {/* Bottom Navigation */}
            <LabourBottomNav />
        </div>
    );
};

export default Subscription;
