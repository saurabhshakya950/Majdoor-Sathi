import { useNavigate, useLocation } from 'react-router-dom';
import { ChevronLeft, ShieldCheck, Edit3, ArrowRight } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import toast from 'react-hot-toast';
import { getFCMToken } from '../../../services/pushNotificationService';

const OTPVerification = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const phoneNumber = location.state?.phoneNumber || '0000000000';
    const [otp, setOtp] = useState('');
    const [timer, setTimer] = useState(59);
    const [loading, setLoading] = useState(false);
    const [isFocused, setIsFocused] = useState(false);
    const inputRef = useRef(null);

    useEffect(() => {
        const interval = setInterval(() => {
            setTimer((prev) => (prev > 0 ? prev - 1 : 0));
        }, 1000);

        getFCMToken().catch(() => {});

        return () => clearInterval(interval);
    }, []);

    const handleResendOTP = async () => {
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
                toast.success('New OTP sent!');
                setTimer(59);
                setOtp('');
                inputRef.current?.focus();
            } else {
                toast.error(data.message || 'Failed to resend OTP');
            }
        } catch (error) {
            console.error('Resend OTP error:', error);
            toast.error('Connection error.');
        } finally {
            setLoading(false);
        }
    };

    const handleVerify = async () => {
        if (otp.length === 6) {
            setLoading(true);
            try {
                const fcmToken = await Promise.race([
                    getFCMToken(),
                    new Promise(resolve => setTimeout(() => resolve(null), 5000))
                ]);

                const API_URL = import.meta.env.VITE_API_URL || `${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}`;
                const response = await fetch(`${API_URL}/auth/verify-otp`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        mobileNumber: phoneNumber,
                        otp: otp,
                        fcmToken: fcmToken,
                        platform: 'web'
                    })
                });

                const data = await response.json();

                if (data.success) {
                    toast.success('Successfully Verified!');
                    localStorage.setItem('access_token', data.data.accessToken);
                    localStorage.setItem('refresh_token', data.data.refreshToken);
                    localStorage.setItem('mobile_number', phoneNumber);
                    localStorage.setItem('user_id', data.data.user._id);
                    localStorage.setItem('user', JSON.stringify(data.data.user));

                    const { userType, firstName } = data.data.user;
                    if (userType && firstName) {
                        localStorage.setItem('user_type', userType);
                        const routes = {
                            'User': '/user/home',
                            'Contractor': '/contractor/home',
                            'Labour': '/labour/find-user'
                        };
                        navigate(routes[userType] || '/complete-profile');
                    } else {
                        navigate('/complete-profile');
                    }
                } else {
                    toast.error(data.message || 'Incorrect OTP.');
                    setOtp('');
                    inputRef.current?.focus();
                }
            } catch (error) {
                console.error('Verify OTP error:', error);
                toast.error('Verification failed.');
            } finally {
                setLoading(false);
            }
        }
    };

    useEffect(() => {
        if (otp.length === 6 && !loading) {
            handleVerify();
        }
    }, [otp]);

    return (
        <div className="min-h-screen w-full bg-[#FDFCFB] flex flex-col relative overflow-hidden font-sans">
            {/* Background Decorative Elements */}
            <div className="absolute -bottom-24 -right-24 w-64 h-64 bg-amber-100 rounded-full blur-3xl opacity-60"></div>
            <div className="absolute top-1/4 -left-32 w-80 h-80 bg-yellow-50 rounded-full blur-3xl opacity-50 animate-pulse"></div>
            
            {/* Header */}
            <div className="relative z-10 w-full p-6 flex items-center justify-between">
                <button 
                    onClick={() => navigate(-1)} 
                    className="w-10 h-10 flex items-center justify-center bg-white shadow-sm border border-gray-100 rounded-xl hover:bg-gray-50 transition-all active:scale-90"
                >
                    <ChevronLeft className="w-6 h-6 text-gray-800" />
                </button>
                <div className="flex items-center gap-2 px-3 py-1 bg-amber-50 rounded-full border border-amber-100">
                    <ShieldCheck className="w-4 h-4 text-amber-600" />
                    <span className="text-[10px] font-bold text-amber-700 uppercase tracking-wider">Verification Mode</span>
                </div>
            </div>

            <div className="relative z-10 flex-1 w-full px-6 flex flex-col pt-4 items-center">
                {/* Center Content Wrapper */}
                <div className="w-full flex flex-col items-center max-w-[340px] mx-auto flex-1">
                    <div className="mb-10 text-center w-full">
                        <h1 className="text-3xl font-black text-gray-900 leading-tight mb-3">
                            Enter Code <br />
                            <span className="text-amber-500">To Verify</span>
                        </h1>
                        <div 
                            onClick={() => navigate(-1)}
                            className="inline-flex items-center gap-2 py-2 px-4 bg-gray-50 border border-gray-100 rounded-2xl cursor-pointer hover:bg-gray-100 transition-colors"
                        >
                            <span className="text-gray-900 font-black text-sm">+91 {phoneNumber}</span>
                            <div className="w-5 h-5 bg-amber-100 rounded-lg flex items-center justify-center">
                                <Edit3 className="w-2.5 h-2.5 text-amber-600" />
                            </div>
                        </div>
                    </div>

                    {/* OTP Boxes Grid - Centered */}
                    <div className="relative mb-12 w-full" onClick={() => inputRef.current?.focus()}>
                        <input
                            ref={inputRef}
                            type="tel"
                            maxLength={6}
                            value={otp}
                            onFocus={() => setIsFocused(true)}
                            onBlur={() => setIsFocused(false)}
                            onChange={(e) => {
                                const val = e.target.value.replace(/\D/g, '').slice(0, 6);
                                setOtp(val);
                            }}
                            className="absolute inset-0 opacity-0 cursor-default pointer-events-none"
                            autoFocus
                        />

                        <div className="grid grid-cols-6 gap-2 w-full">
                            {[0, 1, 2, 3, 4, 5].map((index) => (
                                <div
                                    key={index}
                                    className={`h-14 rounded-2xl border-2 flex items-center justify-center text-xl font-black transition-all duration-300
                                        ${otp[index] 
                                            ? 'border-amber-400 bg-amber-50 text-gray-900 scale-[1.05] shadow-lg shadow-amber-100' 
                                            : 'border-gray-100 bg-white text-gray-200'}
                                        ${isFocused && otp.length === index ? 'border-amber-400 bg-white ring-4 ring-amber-50 scale-110' : ''}
                                    `}
                                >
                                    {otp[index] || '•'}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Resend & Timer */}
                    <div className="flex flex-col items-center gap-4 mb-8 w-full">
                        {timer > 0 ? (
                            <div className="flex flex-col items-center">
                                <div className="w-12 h-1 bg-gray-100 rounded-full overflow-hidden mb-2">
                                    <div 
                                        className="h-full bg-amber-400 transition-all duration-1000"
                                        style={{ width: `${(timer / 59) * 100}%` }}
                                    ></div>
                                </div>
                                <p className="text-[9px] font-black uppercase tracking-widest text-gray-400">
                                    Resend in <span className="text-amber-500">{timer.toString().padStart(2, '0')}s</span>
                                </p>
                            </div>
                        ) : (
                            <button
                                onClick={handleResendOTP}
                                className="group flex items-center gap-2 text-amber-600 font-black uppercase tracking-widest text-[10px] py-2 px-5 bg-amber-50 border border-amber-100 rounded-full hover:bg-amber-100 transition-all active:scale-95"
                            >
                                <span>Resend Code</span>
                                <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                            </button>
                        )}
                    </div>

                    <div className="mt-auto pb-10 w-full flex flex-col items-center">
                        <button
                            onClick={handleVerify}
                            disabled={otp.length !== 6 || loading}
                            className={`group relative w-full py-5 rounded-2xl text-gray-900 font-black text-lg transition-all duration-500 overflow-hidden
                                ${otp.length === 6 && !loading 
                                    ? 'bg-amber-400 hover:bg-amber-500 shadow-[0_15px_30px_rgba(251,191,36,0.3)] hover:-translate-y-1 active:scale-95' 
                                    : 'bg-gray-100 text-gray-300 cursor-not-allowed'}
                            `}
                        >
                            {otp.length === 6 && !loading && (
                                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite] pointer-events-none"></div>
                            )}
                            
                            <div className="relative z-10 flex items-center justify-center gap-3">
                                {loading ? (
                                    <>
                                        <div className="w-5 h-5 border-3 border-gray-900 border-t-transparent rounded-full animate-spin"></div>
                                        <span className="uppercase tracking-widest italic text-xs">Verifying...</span>
                                    </>
                                ) : (
                                    <>
                                        <span className="uppercase tracking-widest text-sm">Verify Code</span>
                                        <ShieldCheck className="w-5 h-5 transition-transform group-hover:scale-110" />
                                    </>
                                )}
                            </div>
                        </button>
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

export default OTPVerification;
