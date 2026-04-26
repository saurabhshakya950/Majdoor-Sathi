import { useNavigate } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import { useState } from 'react';
import { useTranslate } from '../../../hooks/useTranslate';

const SelectLanguage = () => {
    const navigate = useNavigate();
    const [currentLang, setCurrentLang] = useState(localStorage.getItem('selected_language') || 'en');

    const languages = [
        { code: 'en', name: 'English', nativeName: 'English' },
        { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी' },
        { code: 'bn', name: 'Bengali', nativeName: 'বাংলা' },
        { code: 'gu', name: 'Gujarati', nativeName: 'ગુજરાતી' },
        { code: 'mr', name: 'Marathi', nativeName: 'मराठी' },
        { code: 'pa', name: 'Punjabi', nativeName: 'ਪੰਜਾਬੀ' },
        { code: 'ta', name: 'Tamil', nativeName: 'தமிழ்' },
        { code: 'te', name: 'Telugu', nativeName: 'తెలుగు' },
        { code: 'ml', name: 'Malayalam', nativeName: 'മലയാളം' },
        { code: 'kn', name: 'Kannada', nativeName: 'ಕನ್ನಡ' },
        { code: 'ur', name: 'Urdu', nativeName: 'اردو' },
        { code: 'as', name: 'Assamese', nativeName: 'অসমীয়া' },
        { code: 'kok', name: 'Konkani', nativeName: 'कोंकणी' },
        { code: 'mni', name: 'Manipuri', nativeName: 'মৈইতৈইলোন্' },
        { code: 'ne', name: 'Nepali', nativeName: 'नेपाली' },
        { code: 'sd', name: 'Sindhi', nativeName: 'سنڌي' },
        { code: 'sat', name: 'Santali', nativeName: 'ᱥᱟᱱᱛᱟᱲᱤ' },
        { code: 'mai', name: 'Maithili', nativeName: 'मैथिली' },
        { code: 'doi', name: 'Dogri', nativeName: 'डोगरी' },
        { code: 'or', name: 'Odia', nativeName: 'ଓଡ଼ିଆ' }
    ];
    
    const textsToTranslate = ["Select language", "Choose your preferred language"];
    const { translations } = useTranslate(textsToTranslate, currentLang);

    const handleLanguageSelect = (language) => {
        // Store selected language in localStorage (for future use)
        localStorage.setItem('selected_language', language.code);
        setCurrentLang(language.code);
        
        // Add a small delay so user can see it's selected (optional)
        setTimeout(() => {
            navigate('/mobile-login');
        }, 300);
    };

    return (
        <div className="bg-gray-50 flex flex-col" style={{ minHeight: '100dvh' }}>
            {/* Header */}
            <div className="px-2 pt-2 flex items-center">
                <button
                    onClick={() => navigate('/get-started')}
                    className="p-2"
                >
                    <ChevronLeft className="w-6 h-6 text-gray-800" />
                </button>
            </div>

            {/* Content */}
            <div className="flex-1 px-4 py-2 overflow-y-auto pb-6">
                <div className="mb-4">
                    <h1 className="text-xl font-bold text-gray-900 mb-1">
                        {translations["Select language"] || "Select language"}
                    </h1>
                    <p className="text-sm text-gray-500">
                        {translations["Choose your preferred language"] || "Choose your preferred language"}
                    </p>
                </div>

                {/* Language Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                    {languages.map((language) => (
                        <button
                            key={language.code}
                            onClick={() => handleLanguageSelect(language)}
                            className="p-4 rounded-xl bg-white border border-gray-200 hover:border-yellow-400 hover:bg-yellow-50 shadow-sm hover:shadow-md transition-all duration-200 active:scale-95"
                        >
                            {/* Native Name */}
                            <div className="text-lg font-bold text-gray-900 mb-1 text-center leading-tight break-words">
                                {language.nativeName}
                            </div>

                            {/* English Name */}
                            <div className="text-xs text-gray-400 text-center">
                                {language.name}
                            </div>
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default SelectLanguage;
