import { useNavigate } from 'react-router-dom';
import { Briefcase, Users, ArrowRight, Sparkles } from 'lucide-react';
import UserBottomNav from '../components/UserBottomNav';
import UserHeader from '../components/UserHeader';

const Requests = () => {
    const navigate = useNavigate();

    const requestOptions = [
        {
            title: 'Contractor Request',
            subtitle: 'Find experienced contractors for your project',
            icon: Briefcase,
            path: '/user/contractor-request',
            gradient: 'from-blue-500 to-blue-600',
            iconBg: 'bg-blue-100',
            iconColor: 'text-blue-600'
        },
        {
            title: 'Workers Request',
            subtitle: 'Hire skilled workers for your needs',
            icon: Users,
            path: '/user/workers-request',
            gradient: 'from-green-500 to-green-600',
            iconBg: 'bg-green-100',
            iconColor: 'text-green-600'
        }
    ];

    const handleOptionClick = (path) => {
        navigate(path);
    };

    return (
        <div className="bg-gradient-to-br from-gray-50 to-blue-50 flex flex-col overflow-hidden" style={{ height: '100dvh', minHeight: '-webkit-fill-available' }}>
            {/* Header (Sticky by container) */}
            <UserHeader />

            {/* Scrollable Content Area */}
            <div className="flex-1 overflow-y-auto">
                {/* Hero Banner */}
                <div className="relative overflow-hidden bg-gradient-to-r from-blue-600 via-blue-500 to-purple-600 mx-4 mt-4 rounded-2xl shadow-lg">
                    <div className="absolute inset-0 bg-black opacity-10"></div>
                    <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-10 rounded-full -mr-32 -mt-32"></div>
                    <div className="absolute bottom-0 left-0 w-48 h-48 bg-white opacity-10 rounded-full -ml-24 -mb-24"></div>

                    <div className="relative p-6 text-white">
                        <div className="flex items-center gap-2 mb-2">
                            <Sparkles className="w-5 h-5" />
                            <span className="text-sm font-medium">Quick Access</span>
                        </div>
                        <h1 className="text-2xl font-bold mb-2">Submit Your Request</h1>
                        <p className="text-blue-100 text-sm">Choose the type of service you need and get started</p>
                    </div>
                </div>

                <div className="p-4 mt-6">
                    <h2 className="text-lg font-semibold text-gray-700 mb-4 flex items-center gap-2">
                        <span className="w-1 h-6 bg-blue-600 rounded-full"></span>
                        Select Request Type
                    </h2>

                    <div className="space-y-4">
                        {requestOptions.map((option, index) => (
                            <div
                                key={option.path}
                                onClick={() => handleOptionClick(option.path)}
                                className="group cursor-pointer transform transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
                                style={{ animationDelay: `${index * 100}ms` }}
                            >
                                <div className="bg-white rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100">
                                    {/* Gradient Header */}
                                    <div className={`h-2 bg-gradient-to-r ${option.gradient}`}></div>

                                    <div className="p-5">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-4 flex-1">
                                                {/* Icon */}
                                                <div className={`${option.iconBg} p-4 rounded-xl group-hover:scale-110 transition-transform duration-300`}>
                                                    <option.icon className={`w-7 h-7 ${option.iconColor}`} />
                                                </div>

                                                {/* Content */}
                                                <div className="flex-1">
                                                    <h3 className="text-lg font-bold text-gray-900 mb-1 group-hover:text-blue-600 transition-colors">
                                                        {option.title}
                                                    </h3>
                                                    <p className="text-sm text-gray-500">
                                                        {option.subtitle}
                                                    </p>
                                                </div>
                                            </div>

                                            {/* Arrow */}
                                            <div className="ml-2">
                                                <div className="bg-gray-100 p-2 rounded-full group-hover:bg-blue-600 transition-all duration-300">
                                                    <ArrowRight className="w-5 h-5 text-gray-600 group-hover:text-white group-hover:translate-x-1 transition-all duration-300" />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Info Card */}
                    <div className="mt-6 mb-24 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-xl p-4">
                        <div className="flex items-start gap-3">
                            <div className="bg-amber-100 p-2 rounded-lg">
                                <Sparkles className="w-5 h-5 text-amber-600" />
                            </div>
                            <div>
                                <h4 className="font-semibold text-gray-900 mb-1">Need Help?</h4>
                                <p className="text-sm text-gray-600">
                                    Our team is here to assist you with your requests 24/7
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <UserBottomNav />
        </div>
    );
};

export default Requests;
