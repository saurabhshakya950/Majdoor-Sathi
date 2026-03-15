import { useNavigate } from 'react-router-dom';
import ContractorPageHeader from '../components/ContractorPageHeader';
import ContactUsContent from '../components/ContactUsContent';

const ContactUs = () => {
    const navigate = useNavigate();

    return (
        <div className="bg-gray-50 flex flex-col overflow-hidden" style={{ height: '100dvh', minHeight: '-webkit-fill-available' }}>
            <ContractorPageHeader title="Contact us" backPath="/contractor/settings" sticky />

            <ContactUsContent />
        </div>
    );
};

export default ContactUs;
