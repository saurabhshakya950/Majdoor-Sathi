import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Briefcase } from 'lucide-react';
import LabourBottomNav from '../components/LabourBottomNav';

const AboutUs = () => {
    const navigate = useNavigate();

    const [content, setContent] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchAboutUsContent();
    }, []);

    const fetchAboutUsContent = async () => {
        try {
            setLoading(true);
            const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/admin/cms/aboutUs`);
            const data = await response.json();
            
            if (data.success && data.data.content) {
                setContent(data.data.content);
            }
        } catch (error) {
            console.error('Error fetching About Us content:', error);
        } finally {
            setLoading(false);
        }
    };

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
                <h1 className="text-xl font-bold text-gray-900">About Us</h1>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4 pb-20">
                {loading ? (
                    <div className="flex justify-center items-center py-20">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-400"></div>
                    </div>
                ) : content ? (
                    <div className="bg-white rounded-2xl p-6 shadow-sm">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
                                <Briefcase className="w-6 h-6 text-yellow-600" />
                            </div>
                            <h2 className="text-lg font-bold text-gray-900">About Us</h2>
                        </div>
                        <div className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                            {content}
                        </div>
                    </div>
                ) : (
                    <div className="bg-white rounded-2xl p-6 shadow-sm text-center">
                        <p className="text-gray-500">No content available</p>
                    </div>
                )}
            </div>

            {/* Bottom Navigation */}
            <LabourBottomNav />
        </div>
    );
};

export default AboutUs;

