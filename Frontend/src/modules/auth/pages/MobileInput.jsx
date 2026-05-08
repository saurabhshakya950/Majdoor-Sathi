import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ChevronLeft, Phone, ShieldCheck } from 'lucide-react';
import { useState } from 'react';

const MobileInput = () => {
    const navigate = useNavigate();
    const [phoneNumber, setPhoneNumber] = useState('');
    const [loading, setLoading] = useState(false);
    const [isFocused, setIsFocused] = useState(false);

    const handleContinue = async () => {
        if (phoneNumber.length === 10) {
            setLoading(true);
            try {
                const API_URL = import.meta.env.VITE_API_URL || `${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}`;
                const response = await fetch(`${API_URL}/auth/send-otp`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ mobileNumber: phoneNumber })
                });

                const data = await response.json();

                if (data.success) {
                    navigate('/otp-verify', { state: { phoneNumber } });
                } else {
                    alert(data.message || 'Failed to send OTP');
                }
            } catch (error) {
                console.error('Error sending OTP:', error);
                alert('Connection error. Please check if backend is running.');
            } finally {
                setLoading(false);
            }
        }
    };

    return (
        <div className="min-h-screen w-full bg-[#FDFCFB] flex flex-col relative overflow-hidden font-sans">
            {/* Background Decorative Elements */}
            <div className="absolute -top-24 -right-24 w-64 h-64 bg-amber-100 rounded-full blur-3xl opacity-60 animate-pulse"></div>
            <div className="absolute top-1/2 -left-32 w-80 h-80 bg-yellow-50 rounded-full blur-3xl opacity-50"></div>
            
            {/* Header */}
            <div className="relative z-10 w-full p-6 flex items-center justify-between">
                <button 
                    onClick={() => navigate('/get-started')} 
                    className="w-10 h-10 flex items-center justify-center bg-white shadow-sm border border-gray-100 rounded-xl hover:bg-gray-50 transition-all active:scale-90"
                >
                    <ChevronLeft className="w-6 h-6 text-gray-800" />
                </button>
                <div className="flex items-center gap-2 px-3 py-1 bg-amber-50 rounded-full border border-amber-100">
                    <ShieldCheck className="w-4 h-4 text-amber-600" />
                    <span className="text-[10px] font-bold text-amber-700 uppercase tracking-wider">Secure Login</span>
                </div>
            </div>

            <div className="relative z-10 flex-1 w-full flex flex-col pt-4 items-center px-6">
                {/* Center Content Wrapper */}
                <div className="w-full flex flex-col items-center max-w-[340px] mx-auto flex-1">
                    <div className="mb-10 text-center w-full">
                        <h1 className="text-3xl font-black text-gray-900 leading-tight mb-3">
                            Welcome to <br />
                            <span className="text-amber-500">Majdoor Sathi</span>
                        </h1>
                        <p className="text-gray-500 text-sm font-medium leading-relaxed max-w-[260px] mx-auto">
                            Enter your mobile number to continue your journey with us.
                        </p>
                    </div>

                    {/* Modern Input Design - Centered */}
                    <div className="w-full space-y-6 flex flex-col items-center">
                        <div className="group w-full">
                            <label className={`text-[10px] font-bold uppercase tracking-widest mb-2 block text-center transition-colors duration-300 ${isFocused ? 'text-amber-500' : 'text-gray-400'}`}>
                                Mobile Number
                            </label>
                            <div 
                                className={`flex items-center p-1 rounded-2xl border-2 transition-all duration-500 w-full
                                    ${isFocused 
                                        ? 'border-amber-400 bg-white shadow-[0_20px_50px_rgba(251,191,36,0.15)] scale-[1.02]' 
                                        : 'border-gray-100 bg-gray-50/50 hover:border-gray-200'}
                                `}
                            >
                                <div className="flex items-center gap-2 pl-3 pr-2 py-2 bg-white rounded-xl shadow-sm border border-gray-50">
                                    <img src="https://flagcdn.com/w40/in.png" alt="India" className="w-5 h-3 rounded-sm object-cover" />
                                    <span className="text-base font-black text-gray-900">+91</span>
                                </div>
                                
                                <input
                                    type="tel"
                                    value={phoneNumber}
                                    onFocus={() => setIsFocused(true)}
                                    onBlur={() => setIsFocused(false)}
                                    onChange={(e) => {
                                        const val = e.target.value.replace(/\D/g, '').slice(0, 10);
                                        setPhoneNumber(val);
                                    }}
                                    className="flex-1 bg-transparent text-xl text-gray-900 font-bold tracking-[0.05em] outline-none px-3 placeholder:text-gray-200 placeholder:font-medium min-w-0"
                                    placeholder="00000 00000"
                                    autoFocus
                                />
                            </div>
                        </div>

                        {phoneNumber.length > 0 && phoneNumber.length < 10 && (
                            <div className="flex items-center gap-2 text-amber-600 bg-amber-50 p-2 px-4 rounded-full border border-amber-100 animate-in fade-in slide-in-from-top-2 duration-300">
                                <div className="w-1 h-1 rounded-full bg-amber-500 animate-ping"></div>
                                <p className="text-[10px] font-bold uppercase tracking-wider">Enter 10 digits</p>
                            </div>
                        )}
                    </div>

                    <div className="mt-auto pb-10 w-full space-y-6 flex flex-col items-center">
                        <button
                            onClick={handleContinue}
                            disabled={phoneNumber.length !== 10 || loading}
                            className={`group relative w-full py-5 rounded-2xl text-gray-900 font-black text-lg transition-all duration-500 overflow-hidden
                                ${phoneNumber.length === 10 && !loading 
                                    ? 'bg-amber-400 hover:bg-amber-500 shadow-[0_15px_30px_rgba(251,191,36,0.3)] hover:-translate-y-1 active:scale-95' 
                                    : 'bg-gray-100 text-gray-300 cursor-not-allowed'}
                            `}
                        >
                            {phoneNumber.length === 10 && !loading && (
                                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite] pointer-events-none"></div>
                            )}
                            
                            <div className="relative z-10 flex items-center justify-center gap-3">
                                {loading ? (
                                    <>
                                        <div className="w-5 h-5 border-3 border-gray-900 border-t-transparent rounded-full animate-spin"></div>
                                        <span className="uppercase tracking-widest italic text-sm">Wait...</span>
                                    </>
                                ) : (
                                    <>
                                        <span className="uppercase tracking-widest text-sm">Get Started</span>
                                        <ChevronLeft className="w-4 h-4 rotate-180 transition-transform group-hover:translate-x-1" />
                                    </>
                                )}
                            </div>
                        </button>
                        
                        <p className="text-center text-[9px] text-gray-400 leading-relaxed px-6 font-medium uppercase tracking-widest w-full">
                            By signing up, you agree to our <br />
                            <span className="text-gray-900 font-bold hover:text-amber-500 cursor-pointer">Terms</span> & <span className="text-gray-900 font-bold hover:text-amber-500 cursor-pointer">Privacy Policy</span>
                        </p>
                    </div>
                </div>
            </div>

            <style dangerouslySetInnerHTML={{ __html: `
                @keyframes shimmer {
                    100% { transform: translateX(100%); }
                }
            `}} />
        </div>
    );
};

export default MobileInput;
