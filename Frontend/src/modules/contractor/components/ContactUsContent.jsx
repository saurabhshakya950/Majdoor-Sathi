import { useState, useEffect } from 'react';

const ContactUsContent = () => {
    const [contactData, setContactData] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchContactContent();
    }, []);

    const fetchContactContent = async () => {
        try {
            setLoading(true);
            const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/admin/cms/contactUs`);
            const data = await response.json();
            
            if (data.success && data.data.content) {
                setContactData(data.data.content);
            }
        } catch (error) {
            console.error('Error fetching Contact Us content:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-4 pb-8 space-y-6">
            {loading ? (
                <div className="flex justify-center items-center py-20">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-400"></div>
                </div>
            ) : contactData ? (
                <>
                    {/* Contact Details */}
                    <div className="bg-white rounded-xl p-6 shadow-sm">
                        <h2 className="text-lg font-bold text-gray-900 mb-4">Get Support</h2>
                        <div className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                            {contactData}
                        </div>
                    </div>

                    {/* Additional Info */}
                    <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
                        <p className="text-sm text-blue-700 text-center">
                            We typically respond within 24-48 hours during working days.
                        </p>
                    </div>
                </>
            ) : (
                <div className="bg-white rounded-xl p-6 shadow-sm text-center">
                    <p className="text-gray-500">No contact information available</p>
                </div>
            )}
        </div>
    );
};

export default ContactUsContent;

