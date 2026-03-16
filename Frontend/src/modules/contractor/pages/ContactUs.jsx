import { useNavigate } from 'react-router-dom';
import ContractorPageHeader from '../components/ContractorPageHeader';
import ContactUsContent from '../components/ContactUsContent';

const ContactUs = () => {
    const navigate = useNavigate();

    return (
        <div className="bg-gray-50 flex flex-col overflow-hidden" style={{ height: '100dvh', minHeight: '-webkit-fill-available' }}>
            <ContractorPageHeader title="Contact us" backPath="/contractor/settings" sticky />

            <div className="flex-1 overflow-y-auto">
                <ContactUsContent />
            </div>
        </div>
    );
};

export default ContactUs;
