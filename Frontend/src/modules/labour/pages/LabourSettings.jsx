import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, User, Briefcase, Shield, Phone, Info, LogOut, MessageSquare, X, MessageCircle } from 'lucide-react';
import LabourBottomNav from '../components/LabourBottomNav';
import toast from 'react-hot-toast';
import { authAPI } from '../../../services/api';

const LabourSettings = () => {
    const navigate = useNavigate();
    const [showFeedbackModal, setShowFeedbackModal] = useState(false);
    const [rating, setRating] = useState(0);
    const [feedback, setFeedback] = useState('');

    const handleLogout = async () => {
        // Call backend logout API, clear localStorage, and redirect
        await authAPI.logout();
        // No need to navigate - authAPI.logout() handles redirect
    };

    const handleMenuClick = (path) => {
        if (path === '/labour/feedback') {
            setShowFeedbackModal(true);
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
            const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/labour/feedback`, {
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

    const menuItems = [
        { icon: User, label: 'Personal', path: '/labour/personal-details', color: 'text-gray-700' },
        { icon: Briefcase, label: 'Work', path: '/labour/work-details', color: 'text-gray-700' },
        { icon: Shield, label: 'Legal', path: '/labour/legal-details', color: 'text-gray-700' },
        { icon: Briefcase, label: 'My Card', path: '/labour/my-card', color: 'text-gray-700' },
        { icon: Briefcase, label: 'History', path: '/labour/history', color: 'text-gray-700' },
        { icon: MessageCircle, label: 'Chat', path: '/labour/chat', color: 'text-gray-700' },
        { icon: Phone, label: 'Contact us', path: '/labour/contact-us', color: 'text-gray-700', divider: true },
        { icon: Info, label: 'About us', path: '/labour/about-us', color: 'text-gray-700' },
        { icon: MessageSquare, label: 'Feedback and Reports', path: '/labour/feedback', color: 'text-gray-700' }
    ];

    return (
        <div className="bg-gray-50 flex flex-col overflow-hidden" style={{ height: '100dvh', minHeight: '-webkit-fill-available' }}>
            {/* Header */}
            <div className="bg-white px-4 py-4 shadow-sm flex items-center gap-3">
                <button
                    onClick={() => navigate(-1)}
                    className="p-1 hover:bg-gray-100 rounded-full transition-colors"
                >
                    <ChevronLeft className="w-6 h-6 text-gray-700" />
                </button>
                <h1 className="text-xl font-bold text-gray-900">Labour Settings</h1>
            </div>

            {/* Settings Menu */}
            <div className="flex-1 overflow-y-auto pb-24">
                <div className="bg-white">
                    {menuItems.map((item, index) => {
                        const Icon = item.icon;
                        return (
                            <div key={index}>
                                {item.divider && <div className="h-2 bg-gray-50" />}
                                <button
                                    onClick={() => handleMenuClick(item.path)}
                                    className="w-full flex items-center justify-between px-4 py-4 hover:bg-gray-50 transition-colors border-b border-gray-100"
                                >
                                    <div className="flex items-center gap-3">
                                        <Icon className={`w-6 h-6 ${item.color}`} />
                                        <span className={`text-base font-medium ${item.color}`}>
                                            {item.label}
                                        </span>
                                    </div>
                                    <ChevronRight className="w-5 h-5 text-gray-400" />
                                </button>
                            </div>
                        );
                    })}

                    {/* Log out button */}
                    <div className="h-2 bg-gray-50" />
                    <button
                        onClick={handleLogout}
                        className="w-full flex items-center justify-between px-4 py-4 hover:bg-gray-50 transition-colors border-b border-gray-100"
                    >
                        <div className="flex items-center gap-3">
                            <LogOut className="w-6 h-6 text-red-500" />
                            <span className="text-base font-medium text-red-500">
                                Log out
                            </span>
                        </div>
                        <ChevronRight className="w-5 h-5 text-gray-400" />
                    </button>
                </div>
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

            {/* Bottom Navigation */}
            <LabourBottomNav />
        </div>
    );
};

export default LabourSettings;

