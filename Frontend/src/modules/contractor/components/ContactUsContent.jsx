import { useState, useEffect } from 'react';
import CollapsibleSection from '../../user/components/CollapsibleSection';

const ContactUsContent = () => {
    const [contactData, setContactData] = useState('');
    const [termsContent, setTermsContent] = useState('');
    const [privacyContent, setPrivacyContent] = useState('');
    const [loading, setLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [formData, setFormData] = useState({
        name: '',
        contact: '',
        message: ''
    });

    useEffect(() => {
        const profile = JSON.parse(localStorage.getItem('contractor_profile') || '{}');
        if (profile.firstName) {
            setFormData(prev => ({
                ...prev,
                name: `${profile.firstName} ${profile.lastName || ''}`.trim()
            }));
        }
        fetchCMSContent();
    }, []);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.contact.trim() || !formData.message.trim()) {
            toast.error('Please fill all required fields');
            return;
        }

        try {
            setIsSubmitting(true);
            const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/admin/notifications/contact-inquiry`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...formData,
                    phone: formData.contact, // API expects 'phone'
                    senderRole: 'contractor'
                })
            });

            const data = await response.json();

            if (data.success) {
                toast.success('Inquiry sent successfully');
                setFormData(prev => ({ ...prev, message: '' }));
            } else {
                toast.error(data.message || 'Submission failed');
            }
        } catch (error) {
            toast.error('Connection error. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const fetchCMSContent = async () => {
        try {
            setLoading(true);
            const [contactRes, termsRes, privacyRes] = await Promise.all([
                fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/admin/cms/contactUs`),
                fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/admin/cms/terms`),
                fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/admin/cms/privacy`)
            ]);

            const contactDataRes = await contactRes.json();
            const termsDataRes = await termsRes.json();
            const privacyDataRes = await privacyRes.json();

            if (contactDataRes.success && contactDataRes.data.content) {
                setContactData(contactDataRes.data.content);
            }

            if (termsDataRes.success && termsDataRes.data.content) {
                setTermsContent(termsDataRes.data.content);
            }

            if (privacyDataRes.success && privacyDataRes.data.content) {
                setPrivacyContent(privacyDataRes.data.content);
            }
        } catch (error) {
            console.error('Error fetching CMS content:', error);
        } finally {
            setLoading(false);
        }
    };


    return (
        <div className="p-4 pb-4 space-y-4">
            {loading ? (
                <div className="flex justify-center items-center py-20">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-400"></div>
                </div>
            ) : (
                <>
                    {/* Contact Details */}
                    {contactData && (
                        <div className="bg-white rounded-xl p-6 shadow-sm">
                            <h2 className="text-lg font-bold text-gray-900 mb-4">Get Support</h2>
                            <div className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                                {contactData}
                            </div>
                        </div>
                    )}

                    {/* Contact Form */}
                    <div className="bg-white rounded-xl p-4 shadow-sm">
                        <h2 className="text-lg font-bold text-gray-900 mb-4">Send us a Message</h2>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Name</label>
                                <input
                                    type="text"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleChange}
                                    readOnly
                                    className="w-full bg-gray-50 border border-gray-200 rounded-lg p-3 text-gray-900 outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Email or Phone</label>
                                <input
                                    type="text"
                                    name="contact"
                                    value={formData.contact}
                                    onChange={handleChange}
                                    placeholder="Enter your contact info"
                                    className="w-full bg-white border border-gray-200 rounded-lg p-3 text-gray-900 focus:ring-2 focus:ring-yellow-400 focus:border-transparent outline-none transition-all"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Message</label>
                                <textarea
                                    name="message"
                                    value={formData.message}
                                    onChange={handleChange}
                                    placeholder="Write your message here..."
                                    rows="4"
                                    className="w-full bg-white border border-gray-200 rounded-lg p-3 text-gray-900 focus:ring-2 focus:ring-yellow-400 focus:border-transparent outline-none transition-all resize-none"
                                />
                            </div>
                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className={`w-full py-3 rounded-full font-bold text-gray-900 shadow-md active:scale-95 transition-all ${isSubmitting ? 'bg-gray-200' : 'bg-yellow-400 hover:bg-yellow-500'}`}
                            >
                                {isSubmitting ? 'Sending...' : 'Submit Message'}
                            </button>
                        </form>
                    </div>

                    {/* Additional Info */}
                    <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
                        <p className="text-sm text-blue-700 text-center">
                            We typically respond within 24-48 hours during working days.
                        </p>
                    </div>

                    {/* Policies Section */}
                    <div className="bg-white rounded-xl shadow-sm overflow-hidden mb-4">
                        <h2 className="text-lg font-bold text-gray-900 p-4 pb-2 border-b border-gray-100">Policies</h2>

                        {/* Privacy Policy */}
                        {privacyContent && (
                            <CollapsibleSection title="Privacy Policy">
                                <div className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                                    {privacyContent}
                                </div>
                            </CollapsibleSection>
                        )}

                        {/* Terms & Conditions */}
                        {termsContent && (
                            <CollapsibleSection title="Terms & Conditions">
                                <div className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                                    {termsContent}
                                </div>
                            </CollapsibleSection>
                        )}
                    </div>
                </>
            )}
        </div>
    );
};


export default ContactUsContent;

