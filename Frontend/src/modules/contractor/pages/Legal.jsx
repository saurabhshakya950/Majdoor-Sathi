import { useNavigate } from 'react-router-dom';
import ContractorPageHeader from '../components/ContractorPageHeader';
import LegalVerificationSection from '../components/LegalVerificationSection';

const Legal = () => {
    const navigate = useNavigate();

    return (
        <div className="bg-gray-50 flex flex-col overflow-hidden" style={{ height: '100dvh', minHeight: '-webkit-fill-available' }}>
            <ContractorPageHeader title="Legal Verification" backPath="/contractor/settings" sticky />

            <div className="flex-1 overflow-y-auto">
                <div className="pb-12">
                    <LegalVerificationSection />
                </div>
            </div>
        </div>
    );
};

export default Legal;
