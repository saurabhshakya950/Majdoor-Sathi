import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Crown, Sparkles, AlertCircle } from 'lucide-react';
import userImg from '../assets/user_subscription.png';
import labourImg from '../assets/labour_subscription.png';
import contractorImg from '../assets/contractor_subscription.png';

const SubscriptionComingSoon = ({ isOpen, onClose, type = 'USER' }) => {
    const [shouldShake, setShouldShake] = useState(false);

    useEffect(() => {
        if (isOpen) {
            // Trigger shake animation shortly after opening
            const timer = setTimeout(() => {
                setShouldShake(true);
            }, 300);
            return () => clearTimeout(timer);
        } else {
            setShouldShake(false);
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const data = {
        USER: {
            title: 'Premium User Experience',
            image: userImg,
            color: 'blue',
            accent: 'text-blue-600',
            bg: 'bg-blue-50',
            borderColor: 'border-blue-100',
            btn: 'bg-blue-600 hover:bg-blue-700'
        },
        LABOUR: {
            title: 'Majdoor Sathi Premium',
            image: labourImg,
            color: 'orange',
            accent: 'text-orange-600',
            bg: 'bg-orange-50',
            borderColor: 'border-orange-100',
            btn: 'bg-orange-600 hover:bg-orange-700'
        },
        CONTRACTOR: {
            title: 'Contractor Pro Hub',
            image: contractorImg,
            color: 'indigo',
            accent: 'text-indigo-600',
            bg: 'bg-indigo-50',
            borderColor: 'border-indigo-100',
            btn: 'bg-indigo-600 hover:bg-indigo-700'
        }
    }[type] || data.USER;

    return createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm transition-opacity duration-300">
            <div 
                className={`relative w-full max-w-md bg-white rounded-3xl overflow-hidden shadow-2xl transform transition-all duration-500 
                    ${shouldShake ? 'animate-shake' : 'scale-105 opacity-100'}`}
            >
                {/* Close Button */}
                <button 
                    onClick={onClose}
                    className="absolute top-4 right-4 z-10 p-2 bg-white/80 hover:bg-white rounded-full text-gray-500 hover:text-gray-800 transition-all shadow-sm"
                >
                    <X size={20} />
                </button>

                {/* Header Decoration */}
                <div className={`h-24 ${data.bg} relative overflow-hidden flex items-center justify-center`}>
                    <div className="absolute inset-0 opacity-10">
                        <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                            <path d="M0 100 C 20 0 50 0 100 100 Z" fill="currentColor"></path>
                        </svg>
                    </div>
                </div>

                {/* Main Content */}
                <div className="px-6 pt-0 pb-8 text-center -mt-12 relative">
                    <div className="relative inline-block mb-4">
                        <div className="w-40 h-40 mx-auto rounded-full border-4 border-white shadow-lg overflow-hidden bg-white">
                            <img 
                                src={data.image} 
                                alt={data.title} 
                                className="w-full h-full object-cover"
                            />
                        </div>
                        <div className="absolute -bottom-2 -right-2 bg-yellow-400 p-2 rounded-xl shadow-lg animate-pulse-crown">
                            <Crown className="text-white w-6 h-6" />
                        </div>
                    </div>

                    <div className="flex items-center justify-center gap-2 mb-2">
                        <Sparkles className="w-4 h-4 text-yellow-500" />
                        <span className={`text-sm font-bold uppercase tracking-wider ${data.accent}`}>Coming Soon</span>
                        <Sparkles className="w-4 h-4 text-yellow-500" />
                    </div>

                    <h2 className="text-2xl font-extrabold text-gray-900 mb-4">{data.title}</h2>
                    
                    <div className={`p-4 rounded-2xl ${data.bg} border ${data.borderColor} mb-6`}>
                        <p className="text-gray-700 font-medium leading-relaxed">
                            अभी यह ऐप कुछ समय के लिए <span className="font-bold text-green-600">पूरी तरह मुफ्त (FREE)</span> है! इसका अच्छे से उपयोग करें। 
                            <br /><br />
                            कुछ महीनों बाद एडमिन द्वारा बेहतरीन <span className="font-bold">Subscription Plans</span> जोड़े जाएंगे।
                        </p>
                    </div>

                    <div className="flex flex-col gap-3">
                        <button 
                            onClick={onClose}
                            className={`w-full py-4 px-6 ${data.btn} text-white font-bold rounded-2xl shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2`}
                        >
                            <Crown className="w-5 h-5" />
                            Get Started for Free
                        </button>
                    </div>
                </div>
            </div>
        </div>,
        document.body
    );
};

export default SubscriptionComingSoon;

