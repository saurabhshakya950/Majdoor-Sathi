import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { Info } from 'lucide-react';
import PageHeader from '../components/PageHeader';

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
            <PageHeader title="About us" backPath="/user/settings" sticky />

            <div className="p-4 pb-8 space-y-6">
                {loading ? (
                    <div className="flex justify-center items-center py-20">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-400"></div>
                    </div>
                ) : content ? (
                    <div className="bg-white rounded-xl p-6 shadow-sm">
                        <div className="flex items-start gap-3 mb-4">
                            <div className="bg-yellow-400 p-2 rounded-full">
                                <Info className="w-6 h-6 text-gray-900" />
                            </div>
                            <h2 className="text-xl font-bold text-gray-900 mt-1">About Us</h2>
                        </div>
                        <div className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                            {content}
                        </div>
                    </div>
                ) : (
                    <div className="bg-white rounded-xl p-6 shadow-sm text-center">
                        <p className="text-gray-500">No content available</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AboutUs;

