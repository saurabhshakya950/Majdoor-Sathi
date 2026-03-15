import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import LabourBottomNav from '../components/LabourBottomNav';
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

    useEffect(() => {
        // Auto-fill name from profile
        const profile = JSON.parse(localStorage.getItem('labour_profile') || '{}');
        if (profile.firstName) {
            setFormData(prev => ({
                ...prev,
                fullName: `${profile.firstName} ${profile.lastName || ''}`.trim()
            }));
        }

        fetchContactContent();
    }, []);

    const fetchContactContent = async () => {
        try {
            setLoading(true);
            const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/admin/cms/contactUs`);
            const data = await response.json();
            
            if (data.success && data.data.content) {
                setContactInfo(data.data.content);
            }
        } catch (error) {
            console.error('Error fetching Contact Us content:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        if (!formData.phoneNumber.trim()) {
            toast.error('Please enter your phone number');
            return;
        }

        if (!formData.message.trim()) {
            toast.error('Please enter your message');
            return;
        }

        // Show success message
        toast.success('Thanks for contacting us. Our support team will get back to you soon.');

        // Reset form
        setFormData(prev => ({
            ...prev,
            phoneNumber: '',
            message: ''
        }));
    };

    return (
        <div className="h-screen bg-gray-50 flex flex-col">
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
            <div className="flex-1 overflow-y-auto p-4 pb-20">
                {loading ? (
                    <div className="flex justify-center items-center py-20">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-400"></div>
                    </div>
                ) : (
                    <>
                        {/* Contact Details */}
                        {contactInfo && (
                            <div className="bg-white rounded-2xl p-6 mb-4 shadow-sm">
                                <h2 className="text-lg font-bold text-gray-900 mb-4">Get in Touch</h2>
                                <div className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                                    {contactInfo}
                                </div>
                            </div>
                        )}

                        {/* Contact Form */}
                        <div className="bg-white rounded-2xl p-6 shadow-sm">
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
                    </>
                )}
            </div>

            {/* Bottom Navigation */}
            <LabourBottomNav />
        </div>
    );
};

export default ContactUs;

