import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { X } from 'lucide-react';
import toast from 'react-hot-toast';
import ContractorBottomNav from '../components/ContractorBottomNav';
import ContractorPageHeader from '../components/ContractorPageHeader';
import SettingsMenu from '../components/SettingsMenu';
import { authAPI } from '../../../services/api';

const Settings = () => {
    const navigate = useNavigate();
    const [showFeedbackModal, setShowFeedbackModal] = useState(false);
    const [rating, setRating] = useState(0);
    const [feedback, setFeedback] = useState('');

    const handleMenuClick = async (path) => {
        if (path === '/contractor/feedback') {
            setShowFeedbackModal(true);
        } else if (path === '/logout') {
            // Call backend logout API, clear localStorage, and redirect
            await authAPI.logout();
            // No need to navigate - authAPI.logout() handles redirect
        } else {
            navigate(path);
        }
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
            <ContractorPageHeader title="Settings" backPath="/contractor/hire-workers" />

            {/* Scrollable Content Area */}
            <div className="flex-1 overflow-y-auto pb-24">
                <SettingsMenu onMenuClick={handleMenuClick} />
            </div>

            {/* Feedback Modal */}
            {showFeedbackModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end justify-center z-50">
                    <div className="bg-white rounded-t-3xl w-full max-w-md animate-slide-up">
                        {/* Header */}
                        <div className="flex items-center justify-between p-6 border-b">
                            <h2 className="text-2xl font-bold text-gray-900">Feedback</h2>
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
                                        <span className={`text-5xl ${star <= rating ? 'text-green-600' : 'text-gray-300'
                                            }`}>
                                            â˜…
                                        </span>
                                    </button>
                                ))}
                            </div>

                            {/* Feedback Text Area */}
                            <div>
                                <textarea
                                    value={feedback}
                                    onChange={(e) => setFeedback(e.target.value)}
                                    placeholder="Good service."
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                                    rows={6}
                                />
                            </div>

                            {/* Submit Button */}
                            <button
                                onClick={handleSubmitFeedback}
                                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 rounded-xl shadow-lg transition-all active:scale-95"
                            >
                                Submit
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

