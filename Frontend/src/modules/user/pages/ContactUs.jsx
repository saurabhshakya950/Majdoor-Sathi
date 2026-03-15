import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import PageHeader from '../components/PageHeader';
import ContactForm from '../components/ContactForm';
import InfoBox from '../components/InfoBox';
import CollapsibleSection from '../components/CollapsibleSection';

const ContactUs = () => {
    const navigate = useNavigate();
    const [initialFormData, setInitialFormData] = useState({});
    const [loading, setLoading] = useState(true);

    const [contactData, setContactData] = useState('');
    const [termsContent, setTermsContent] = useState('');
    const [privacyContent, setPrivacyContent] = useState('');

    useEffect(() => {
        const userProfile = JSON.parse(localStorage.getItem('user_profile') || '{}');
        const mobileNumber = localStorage.getItem('mobile_number') || '';

        const fullName = `${userProfile.firstName || ''} ${userProfile.middleName || ''} ${userProfile.lastName || ''}`.trim();

        setInitialFormData({
            fullName: fullName || '',
            contact: mobileNumber || '',
            message: ''
        });

        fetchCMSContent();
    }, []);

    const fetchCMSContent = async () => {
        try {
            setLoading(true);
            
            // Fetch all CMS content in parallel
            const [contactRes, termsRes, privacyRes] = await Promise.all([
                fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/admin/cms/contactUs`),
                fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/admin/cms/terms`),
                fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/admin/cms/privacy`)
            ]);

            const contactData = await contactRes.json();
            const termsData = await termsRes.json();
            const privacyData = await privacyRes.json();

            if (contactData.success && contactData.data.content) {
                setContactData(contactData.data.content);
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

    return (
        <div className="bg-gray-50 flex flex-col overflow-hidden" style={{ height: '100dvh', minHeight: '-webkit-fill-available' }}>
            <PageHeader title="Contact us" backPath="/user/settings" sticky />

            <div className="p-4 pb-8 space-y-6">
                {loading ? (
                    <div className="flex justify-center items-center py-20">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-400"></div>
                    </div>
                ) : (
                    <>
                        {/* Contact Information */}
                        {contactData && (
                            <div className="bg-white rounded-xl p-6 shadow-sm">
                                <h2 className="text-lg font-bold text-gray-900 mb-4">Get in Touch</h2>
                                <div className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                                    {contactData}
                                </div>
                            </div>
                        )}

                        {/* Contact Form */}
                        <div className="bg-white rounded-xl p-6 shadow-sm">
                            <h2 className="text-lg font-bold text-gray-900 mb-2">Send us a Message</h2>
                            <p className="text-gray-600 mb-6 text-sm">
                                Fill out the form below and we'll get back to you as soon as possible.
                            </p>
                            <ContactForm initialData={initialFormData} />
                        </div>

                        <InfoBox
                            variant="info"
                            message="We typically respond within 24-48 hours during working days."
                        />

                        {/* Policies Section */}
                        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                            <h2 className="text-lg font-bold text-gray-900 p-6 pb-4">Policies</h2>

                            {/* Terms & Conditions */}
                            {termsContent && (
                                <CollapsibleSection title="Terms & Conditions">
                                    <div className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                                        {termsContent}
                                    </div>
                                </CollapsibleSection>
                            )}

                            {/* Privacy Policy */}
                            {privacyContent && (
                                <CollapsibleSection title="Privacy Policy">
                                    <div className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                                        {privacyContent}
                                    </div>
                                </CollapsibleSection>
                            )}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default ContactUs;

