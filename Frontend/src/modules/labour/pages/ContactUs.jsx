import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import LabourBottomNav from '../components/LabourBottomNav';
import CollapsibleSection from '../../user/components/CollapsibleSection';
import toast from 'react-hot-toast';

const ContactUs = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [formData, setFormData] = useState({
        fullName: '',
        phoneNumber: '',
        message: ''
    });

    const [contactInfo, setContactInfo] = useState('');
    const [termsContent, setTermsContent] = useState('');
    const [privacyContent, setPrivacyContent] = useState('');

    useEffect(() => {
        // Auto-fill name from profile
        const profile = JSON.parse(localStorage.getItem('labour_profile') || '{}');
        if (profile.firstName) {
            setFormData(prev => ({
                ...prev,
                fullName: `${profile.firstName} ${profile.lastName || ''}`.trim()
            }));
        }

        fetchCMSContent();
    }, []);

    const fetchCMSContent = async () => {
        try {
            setLoading(true);
            const [contactRes, termsRes, privacyRes] = await Promise.all([
                fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/admin/cms/contactUs`),
                fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/admin/cms/terms`),
                fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/admin/cms/privacy`)
            ]);

            const contactData = await contactRes.json();
            const termsData = await termsRes.json();
            const privacyData = await privacyRes.json();

            if (contactData.success && contactData.data.content) {
                setContactInfo(contactData.data.content);
            }

            if (termsData.success && termsData.data.content) {
                setTermsContent(termsData.data.content);
            }

            if (privacyData.success && privacyData.data.content) {
                setPrivacyContent(privacyData.data.content);
            }
        } catch (error) {
            console.error('Error fetching CMS content:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.phoneNumber.trim()) {
            toast.error('Please enter your phone number');
            return;
        }

        if (!formData.message.trim()) {
            toast.error('Please enter your message');
            return;
        }

        try {
            const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/admin/notifications/contact-inquiry`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: formData.fullName,
                    phone: formData.phoneNumber,
                    message: formData.message,
                    senderRole: 'labour'
                })
            });

            const data = await response.json();

            if (data.success) {
                toast.success('Thanks for contacting us. Our support team will get back to you soon.');
                setFormData(prev => ({
                    ...prev,
                    phoneNumber: '',
                    message: ''
                }));
            } else {
                toast.error(data.message || 'Failed to send inquiry');
            }
        } catch (error) {
            console.error('Inquiry error:', error);
            toast.error('Something went wrong. Please try again.');
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
                <h1 className="text-xl font-bold text-gray-900">Contact Us</h1>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4 pb-12 space-y-4">
                {loading ? (
                    <div className="flex justify-center items-center py-20">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-400"></div>
                    </div>
                ) : (
                    <>
                        {/* Contact Details */}
                        {contactInfo && (
                            <div className="bg-white rounded-2xl p-4 mb-4 shadow-sm">
                                <h2 className="text-lg font-bold text-gray-900 mb-4">Get in Touch</h2>
                                <div className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                                    {contactInfo}
                                </div>
                            </div>
                        )}

                        {/* Contact Form */}
                        <div className="bg-white rounded-2xl p-4 shadow-sm mb-4">
                            <h2 className="text-lg font-bold text-gray-900 mb-4">Send us a Message</h2>

                            <form onSubmit={handleSubmit} className="space-y-4">
                                {/* Full Name */}
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        Full Name <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        name="fullName"
                                        value={formData.fullName}
                                        onChange={handleChange}
                                        placeholder="Enter your full name"
                                        className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-sm text-gray-700 focus:ring-2 focus:ring-yellow-400 focus:border-transparent outline-none transition-all"
                                        readOnly
                                    />
                                </div>

                                {/* Phone Number */}
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        Phone Number <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="tel"
                                        name="phoneNumber"
                                        value={formData.phoneNumber}
                                        onChange={handleChange}
                                        placeholder="Enter your phone number"
                                        maxLength="10"
                                        className="w-full bg-white border border-gray-200 rounded-xl p-3 text-sm text-gray-700 focus:ring-2 focus:ring-yellow-400 focus:border-transparent outline-none transition-all"
                                    />
                                </div>

                                {/* Message */}
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        Message <span className="text-red-500">*</span>
                                    </label>
                                    <textarea
                                        name="message"
                                        value={formData.message}
                                        onChange={handleChange}
                                        placeholder="Tell us how we can help you..."
                                        rows="5"
                                        className="w-full bg-white border border-gray-200 rounded-xl p-3 text-sm text-gray-700 focus:ring-2 focus:ring-yellow-400 focus:border-transparent outline-none transition-all resize-none"
                                    />
                                </div>

                                {/* Submit Button */}
                                <button
                                    type="submit"
                                    className="w-full py-3 rounded-full bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-bold text-base transition-all shadow-md active:scale-[0.98]"
                                >
                                    Submit
                                </button>
                            </form>
                        </div>

                        {/* Policies Section */}
                        <div className="bg-white rounded-2xl shadow-sm overflow-hidden mb-8">
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

            {/* Bottom Navigation */}
            <LabourBottomNav />
        </div>
    );
};

export default ContactUs;

