import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Star, Globe } from 'lucide-react';
import toast from 'react-hot-toast';
import ContractorBottomNav from '../components/ContractorBottomNav';
import ContractorPageHeader from '../components/ContractorPageHeader';
import SettingsMenu from '../components/SettingsMenu';
import { authAPI } from '../../../services/api';
import { useTranslate } from '../../../hooks/useTranslate';

const Settings = () => {
    const navigate = useNavigate();
    const [showFeedbackModal, setShowFeedbackModal] = useState(false);
    const [rating, setRating] = useState(0);
    const [feedback, setFeedback] = useState('');
    const [showLanguageModal, setShowLanguageModal] = useState(false);
    const [currentLang, setCurrentLang] = useState(localStorage.getItem('selected_language') || 'en');

    const languages = [
        { code: 'en', name: 'English', nativeName: 'English' },
        { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी' },
        { code: 'bn', name: 'Bengali', nativeName: 'বাংলা' },
        { code: 'gu', name: 'Gujarati', nativeName: 'ગુજરાતી' },
        { code: 'mr', name: 'Marathi', nativeName: 'मराठी' },
        { code: 'pa', name: 'Punjabi', nativeName: 'ਪੰਜਾਬੀ' },
        { code: 'ta', name: 'Tamil', nativeName: 'தமிழ்' },
        { code: 'te', name: 'Telugu', nativeName: 'తెలుగు' },
        { code: 'ml', name: 'Malayalam', nativeName: 'മലയാളം' },
        { code: 'kn', name: 'Kannada', nativeName: 'ಕನ್ನಡ' },
        { code: 'ur', name: 'Urdu', nativeName: 'اردو' },
        { code: 'as', name: 'Assamese', nativeName: 'অসমীয়া' },
        { code: 'kok', name: 'Konkani', nativeName: 'कोंकणी' },
        { code: 'mni', name: 'Manipuri', nativeName: 'মৈইতৈইলোন্' },
        { code: 'ne', name: 'Nepali', nativeName: 'नेपाली' },
        { code: 'sd', name: 'Sindhi', nativeName: 'سنڌي' },
        { code: 'sat', name: 'Santali', nativeName: 'ᱥᱟᱱᱛᱟᱲᱤ' },
        { code: 'mai', name: 'Maithili', nativeName: 'मैथिली' },
        { code: 'doi', name: 'Dogri', nativeName: 'डोगरी' },
        { code: 'or', name: 'Odia', nativeName: 'ଓଡ଼ିଆ' }
    ];

    const textsToTranslate = [
        "Settings", "Feedback", "Submit", "Good service.", "Select Language",
        "Please select a rating", "Please enter your feedback", 
        "Feedback submitted successfully!", "Failed to submit feedback",
        "Failed to submit feedback. Please try again."
    ];
    const { translations } = useTranslate(textsToTranslate, currentLang);

    const handleMenuClick = async (path) => {
        if (path === '/contractor/feedback') {
            setShowFeedbackModal(true);
        } else if (path === '/contractor/choose-language') {
            setShowLanguageModal(true);
        } else if (path === '/logout') {
            // Call backend logout API, clear localStorage, and redirect
            await authAPI.logout();
            // No need to navigate - authAPI.logout() handles redirect
        } else {
            navigate(path);
        }
    };

    const handleLanguageSelect = (language) => {
        localStorage.setItem('selected_language', language.code);
        setCurrentLang(language.code);
        setShowLanguageModal(false);
    };

    const handleCloseFeedback = () => {
        setShowFeedbackModal(false);
        setRating(0);
        setFeedback('');
    };

    const handleSubmitFeedback = async () => {
        if (!rating) {
            toast.error('Please select a rating');
            return;
        }

        if (!feedback.trim()) {
            toast.error('Please enter your feedback');
            return;
        }

        try {
            const token = localStorage.getItem('access_token');
            const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/contractor/feedback`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    rating,
                    comment: feedback
                })
            });

            const data = await response.json();

            if (data.success) {
                toast.success('Feedback submitted successfully!');
                handleCloseFeedback();
            } else {
                toast.error(data.message || 'Failed to submit feedback');
            }
        } catch (error) {
            console.error('Error submitting feedback:', error);
            toast.error('Failed to submit feedback. Please try again.');
        }
    };

    return (
        <div className="bg-gray-50 flex flex-col overflow-hidden" style={{ height: '100dvh', minHeight: '-webkit-fill-available' }}>
            {/* Header (Sticky) */}
            <ContractorPageHeader title={translations["Settings"] || "Settings"} backPath="/contractor/hire-workers" />

            {/* Scrollable Content Area */}
            <div className="flex-1 overflow-y-auto pb-24">
                <SettingsMenu onMenuClick={handleMenuClick} currentLang={currentLang} />
            </div>

            {/* Language Selection Modal */}
            {showLanguageModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end justify-center z-50" onClick={() => setShowLanguageModal(false)}>
                    <div className="bg-white rounded-t-3xl w-full max-w-md animate-slide-up" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-between p-6 border-b">
                            <h2 className="text-2xl font-bold text-gray-900">
                                {translations["Select Language"] || "Select Language"}
                            </h2>
                            <button
                                onClick={() => setShowLanguageModal(false)}
                                className="p-1 hover:bg-gray-100 rounded-full transition-colors"
                            >
                                <X className="w-6 h-6 text-red-500" />
                            </button>
                        </div>
                        <div className="p-4 overflow-y-auto" style={{ maxHeight: '60vh' }}>
                            <div className="grid grid-cols-2 gap-3">
                                {languages.map((language) => (
                                    <button
                                        key={language.code}
                                        onClick={() => handleLanguageSelect(language)}
                                        className="p-4 rounded-xl bg-white border border-gray-200 hover:border-yellow-400 hover:bg-yellow-50 shadow-sm hover:shadow-md transition-all duration-200 active:scale-95"
                                    >
                                        <div className="text-lg font-bold text-gray-900 mb-1 text-center leading-tight break-words">
                                            {language.nativeName}
                                        </div>
                                        <div className="text-xs text-gray-400 text-center">
                                            {language.name}
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Feedback Modal */}
            {showFeedbackModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end justify-center z-50">
                    <div className="bg-white rounded-t-3xl w-full max-w-md animate-slide-up">
                        {/* Header */}
                        <div className="flex items-center justify-between p-6 border-b">
                            <h2 className="text-2xl font-bold text-gray-900">
                                {translations["Feedback"] || "Feedback"}
                            </h2>
                            <button
                                onClick={handleCloseFeedback}
                                className="p-1 hover:bg-gray-100 rounded-full transition-colors"
                            >
                                <X className="w-6 h-6 text-red-500" />
                            </button>
                        </div>

                        {/* Content */}
                        <div className="p-6 space-y-6">
                            {/* Star Rating */}
                            <div className="flex justify-center gap-4">
                                {[1, 2, 3, 4, 5].map((star) => (
                                    <button
                                        key={star}
                                        onClick={() => setRating(star)}
                                        className="transition-transform hover:scale-110"
                                    >
                                        <Star
                                            className={`w-12 h-12 transition-all ${star <= rating
                                                ? 'text-green-600 fill-green-600'
                                                : 'text-gray-300'
                                                }`}
                                        />
                                    </button>
                                ))}
                            </div>

                            {/* Feedback Text Area */}
                            <div>
                                <textarea
                                    value={feedback}
                                    onChange={(e) => setFeedback(e.target.value)}
                                    placeholder={translations["Good service."] || "Good service."}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                                    rows={6}
                                />
                            </div>

                            {/* Submit Button */}
                            <button
                                onClick={handleSubmitFeedback}
                                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 rounded-xl shadow-lg transition-all active:scale-95"
                            >
                                {translations["Submit"] || "Submit"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <ContractorBottomNav />
        </div>
    );
};

export default Settings;

