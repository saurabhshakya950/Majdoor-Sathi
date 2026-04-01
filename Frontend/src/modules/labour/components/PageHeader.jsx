import { ChevronLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const PageHeader = ({ title, onBack, backPath, icon: Icon, sticky = false, rightButton }) => {
    const navigate = useNavigate();

    const handleBack = () => {
        if (onBack) {
            onBack();
        } else if (backPath) {
            navigate(backPath);
        } else {
            navigate(-1);
        }
    };

    return (
        <div className={`bg-white shadow-sm p-4 flex items-center justify-between ${sticky ? 'sticky top-0 z-10' : ''}`}>
            <div className="flex items-center gap-4">
                <button onClick={handleBack} className="text-gray-700">
                    <ChevronLeft className="w-6 h-6" />
                </button>
                {Icon && (
                    <div className="flex items-center gap-2">
                        <Icon className="w-6 h-6 text-yellow-500" />
                        <h1 className="text-xl font-bold text-gray-900">{title}</h1>
                    </div>
                )}
                {!Icon && <h1 className="text-xl font-bold text-gray-900">{title}</h1>}
            </div>
            {rightButton && <div>{rightButton}</div>}
        </div>
    );
};

export default PageHeader;
