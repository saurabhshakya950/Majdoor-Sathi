import { useNavigate, useLocation } from 'react-router-dom';
import { ChevronLeft, X } from 'lucide-react';
import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { getFCMToken } from '../../../services/pushNotificationService';

const OTPVerification = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const phoneNumber = location.state?.phoneNumber || '5000000033'; // Default fallback
    const [otp, setOtp] = useState('');
    const [timer, setTimer] = useState(59);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const interval = setInterval(() => {
            setTimer((prev) => (prev > 0 ? prev - 1 : 0));
        }, 1000);
        return () => clearInterval(interval);
    }, []);

    const handleKeyPress = (num) => {
        if (otp.length < 6) {
            setOtp(prev => prev + num);
        }
    };

    const handleBackspace = () => {
        setOtp(prev => prev.slice(0, -1));
    };

    const handleEnter = async () => {
        if (otp.length === 6) {
            setLoading(true);
            try {
                // Get FCM token if possible (with 2s timeout to prevent blocking login)
                const fcmToken = await Promise.race([
                    getFCMToken(),
                    new Promise(resolve => setTimeout(() => resolve(null), 2000))
                ]);

                // Call real verify OTP API
                const API_URL = import.meta.env.VITE_API_URL || `${import.meta.env.VITE_API_URL || `${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}`}`;
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
                    toast.success('✅ OTP Verified Successfully!');

                    // Store tokens and user info
                    localStorage.setItem('access_token', data.data.accessToken);
                    localStorage.setItem('refresh_token', data.data.refreshToken);
                    localStorage.setItem('mobile_number', phoneNumber);
                    localStorage.setItem('user_id', data.data.user._id);
                    localStorage.setItem('user', JSON.stringify(data.data.user));

                    const { userType, firstName } = data.data.user;

                    // Redirection logic
                    if (userType && firstName) {
                        localStorage.setItem('user_type', userType);
                        toast.success(`Welcome back, ${firstName}!`);

                        // Role based routing
                        const routes = {
                            'User': '/user/home',
                            'Contractor': '/contractor/home',
                            'Labour': '/labour/home'
                        };
                        navigate(routes[userType] || '/complete-profile');
                    } else {
                        toast.success('Welcome! Please complete your profile');
                        navigate('/complete-profile');
                    }
                } else {
                    toast.error(data.message || 'Invalid OTP. Please try again.');
                    setOtp('');
                }
            } catch (error) {
                console.error('Verify OTP error:', error);
                toast.error('Connection error. Please try again.');
            } finally {
                setLoading(false);
            }
        }
    };

    return (
        <div className="flex flex-col bg-gray-50 overflow-hidden" style={{ height: '100dvh', minHeight: '-webkit-fill-available' }}>
            {/* Header */}
            <div className="p-2 flex items-center">
                <button onClick={() => navigate(-1)} className="p-2">
                    <ChevronLeft className="w-6 h-6 text-gray-800" />
                </button>
                <span className="ml-2 text-gray-700 font-medium text-sm">Verify mobile number</span>
            </div>

            <div className="flex-1 px-6 flex flex-col justify-between">
                <div className="pt-2">
                    <div className="mb-4">
                        <h1 className="text-xl font-bold text-gray-900 mb-1">
                            Enter code sent to your number
                        </h1>
                        <p className="text-gray-500 text-sm">
                            We sent it to the number +91 {phoneNumber}
                        </p>
                    </div>

                    {/* OTP Display */}
                    <div className="flex justify-center py-6">
                        <span className="text-2xl text-gray-400 tracking-[0.5em] font-medium">
                            {otp.padEnd(6, '*').split('').map((char, index) => (
                                <span key={index} className={index < otp.length ? 'text-gray-900' : 'text-gray-300'}>
                                    {index < otp.length ? char : '*'}
                                </span>
                            ))}
                        </span>
                    </div>
                </div>

                <div className="flex flex-col justify-end pb-4">
                    {/* Keypad */}
                    <div className="grid grid-cols-3 gap-y-1 mb-4 text-center">
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                            <button
                                key={num}
                                onClick={() => handleKeyPress(num)}
                                className="text-2xl font-medium text-gray-900 py-2.5 hover:bg-gray-100 rounded-lg active:bg-gray-200 transition-colors"
                            >
                                {num}
                            </button>
                        ))}
                        <div className="col-span-1"></div>
                        <button
                            onClick={() => handleKeyPress(0)}
                            className="text-2xl font-medium text-gray-900 py-2.5 hover:bg-gray-100 rounded-lg active:bg-gray-200 transition-colors"
                        >
                            0
                        </button>
                        <button
                            onClick={handleBackspace}
                            className="flex items-center justify-center py-2.5 text-red-500 hover:bg-gray-100 rounded-lg active:bg-gray-200 transition-colors"
                        >
                            <X className="w-6 h-6" />
                        </button>
                    </div>

                    {/* Timer text */}
                    <p className="text-center text-gray-400 text-xs mb-4">
                        Resend code in 00:{timer.toString().padStart(2, '0')}
                    </p>

                    {/* Enter Button */}
                    <div className="mb-2">
                        <button
                            onClick={handleEnter}
                            disabled={otp.length !== 6 || loading}
                            className={`w-full py-3.5 rounded-full text-gray-900 font-bold text-base transition-colors
                  ${otp.length === 6 && !loading ? 'bg-[#fbbf24] hover:bg-yellow-500 shadow-md' : 'bg-yellow-100 text-gray-400 cursor-not-allowed'}
                `}
                        >
                            {loading ? 'Verifying...' : 'Enter'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default OTPVerification;
