import { Crown, Check, X, Star } from 'lucide-react';

const SubscriptionPlanCard = ({ 
    plan, 
    billingCycle, 
    isCurrentPlan, 
    onSubscribe 
}) => {
    const price = billingCycle === 'monthly' ? plan.monthlyPrice : plan.yearlyPrice;
    
    return (
        <div
            className={`bg-white rounded-xl shadow-md overflow-hidden ${
                plan.popular ? 'ring-2 ring-yellow-400' : ''
            }`}
        >
            {plan.popular && (
                <div className="bg-yellow-400 text-gray-900 text-center py-2 font-bold text-sm flex items-center justify-center gap-2">
                    <Star className="w-4 h-4 fill-gray-900" />
                    MOST POPULAR
                </div>
            )}

            <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                    <div>
                        <h3 className="text-xl font-bold text-gray-900 mb-1">
                            {plan.name}
                        </h3>
                        <p className="text-sm text-gray-600">{plan.description}</p>
                    </div>
                    {plan.id === 'premium' && (
                        <Crown className="w-8 h-8 text-yellow-500" />
                    )}
                </div>

                <div className="mb-6">
                    <div className="flex items-baseline gap-2 text-3xl font-bold text-gray-900">
                            ₹{price}
                        <span className="text-gray-600 font-normal text-base">
                            /{billingCycle === 'monthly' ? 'month' : 'year'}
                        </span>
                    </div>
                    {billingCycle === 'yearly' && plan.id === 'premium' && (
                        <p className="text-sm text-green-600 mt-1">
                            Save ₹{(plan.monthlyPrice * 12) - plan.yearlyPrice} per year
                        </p>
                    )}
                </div>

                <div className="space-y-3 mb-6">
                    {plan.features.map((feature, index) => (
                        <div key={index} className="flex items-start gap-3">
                            {feature.included ? (
                                <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                            ) : (
                                <X className="w-5 h-5 text-gray-300 flex-shrink-0 mt-0.5" />
                            )}
                            <span
                                className={`text-sm ${
                                    feature.included ? 'text-gray-700' : 'text-gray-400'
                                }`}
                            >
                                {feature.text}
                            </span>
                        </div>
                    ))}
                </div>

                <button
                    onClick={() => onSubscribe(plan.id)}
                    disabled={isCurrentPlan}
                    className={`w-full py-3 rounded-full font-bold text-base transition-all shadow-md ${
                        isCurrentPlan
                            ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                            : plan.id === 'premium'
                            ? 'bg-yellow-400 hover:bg-yellow-500 text-gray-900 active:scale-[0.98]'
                            : 'bg-gray-800 hover:bg-gray-900 text-white active:scale-[0.98]'
                    }`}
                >
                    {isCurrentPlan ? 'Current Plan' : plan.id === 'free' ? 'Downgrade to Free' : 'Upgrade to Premium'}
                </button>
            </div>
        </div>
    );
};

export default SubscriptionPlanCard;
