import { useNavigate } from 'react-router-dom';
import ContractorPageHeader from '../components/ContractorPageHeader';
import AboutUsContent from '../components/AboutUsContent';

const AboutUs = () => {
    const navigate = useNavigate();

    return (
        <div className="bg-gray-50 flex flex-col overflow-hidden" style={{ height: '100dvh', minHeight: '-webkit-fill-available' }}>
            <ContractorPageHeader title="About us" backPath="/contractor/settings" sticky />

            <AboutUsContent />
        </div>
    );
};

export default AboutUs;
