import { User, Briefcase, Hammer, Shield, Phone, HelpCircle, LogOut, MessageSquare, FolderKanban, History, MessageCircle, Globe } from 'lucide-react';
import SettingsMenuItem from '../../user/components/SettingsMenuItem';
import { useTranslate } from '../../../hooks/useTranslate';

const SettingsMenu = ({ onMenuClick, currentLang }) => {
    const labels = [
        'Personal', 'Business', 'My Projects', 'My Project for User', 
        'History', 'Legal', 'Chat', 'Contact us', 'About us', 
        'Choose Language', 'Feedback and Reports', 'Log out'
    ];
    const { translations } = useTranslate(labels, currentLang || localStorage.getItem('selected_language') || 'en');

    const menuItems = [
        { icon: User, label: translations['Personal'] || 'Personal', path: '/contractor/personal-details', color: 'text-gray-700' },
        { icon: Briefcase, label: translations['Business'] || 'Business', path: '/contractor/business-details', color: 'text-gray-700' },
        { icon: Hammer, label: translations['My Projects'] || 'My Projects', path: '/contractor/my-projects', color: 'text-gray-700' },
        { icon: FolderKanban, label: translations['My Project for User'] || 'My Project for User', path: '/contractor/my-project-for-user', color: 'text-gray-700' },
        { icon: History, label: translations['History'] || 'History', path: '/contractor/history', color: 'text-gray-700' },
        { icon: Shield, label: translations['Legal'] || 'Legal', path: '/contractor/legal', color: 'text-gray-700' },
        { icon: MessageCircle, label: translations['Chat'] || 'Chat', path: '/contractor/chat', color: 'text-gray-700' },
        { icon: Phone, label: translations['Contact us'] || 'Contact us', path: '/contractor/contact-us', color: 'text-gray-700' },
        { icon: HelpCircle, label: translations['About us'] || 'About us', path: '/contractor/about-us', color: 'text-gray-700' },
        { icon: Globe, label: translations['Choose Language'] || 'Choose Language', path: '/contractor/choose-language', color: 'text-gray-700' },
        { icon: MessageSquare, label: translations['Feedback and Reports'] || 'Feedback and Reports', path: '/contractor/feedback', color: 'text-gray-700' },
        { icon: LogOut, label: translations['Log out'] || 'Log out', path: '/logout', color: 'text-red-500' }
    ];

    return (
        <div className="mt-4">
            {menuItems.map((item, index) => {
                const isLastItem = index === menuItems.length - 1;
                const isSecondLastItem = index === menuItems.length - 2;
                
                return (
                    <div key={item.label}>
                        <SettingsMenuItem
                            icon={item.icon}
                            label={item.label}
                            color={item.color}
                            onClick={() => onMenuClick(item.path)}
                        />
                        {!isLastItem && !isSecondLastItem && (
                            <div className="border-b border-gray-100" />
                        )}
                        {isSecondLastItem && (
                            <div className="h-4 bg-gray-50" />
                        )}
                    </div>
                );
            })}
        </div>
    );
};

export default SettingsMenu;
