import { MapPin, Briefcase, Calendar, Phone, Star, X } from 'lucide-react';

const ContractorProfileCard = ({ data, onViewDetails, onToggleAvailability, onDelete }) => {
    // Safety check - if data is not available, return null
    if (!data || !data.contractorName) {
        return null;
    }

    // Get first letter of contractor name for avatar
    const getInitial = (name) => {
        return name ? name.charAt(0).toUpperCase() : 'C';
    };

    const isAvailable = data.availabilityStatus === 'Available';

    return (
        <div className="bg-white rounded-2xl shadow-md p-4 mb-4 relative overflow-visible">
            {/* Delete Icon - Absolute Top Right Corner */}
            <button
                onClick={(e) => {
                    e.stopPropagation();
                    onDelete(data.id);
                }}
                className="absolute -top-2 -right-2 p-1.5 bg-white shadow-md border rounded-full hover:bg-gray-100 transition-colors z-20 active:scale-95"
                title="Delete Project"
            >
                <X className="w-4 h-4 text-red-500" />
            </button>

            {/* Status Badge - Top Right Corner (Current Status) */}
            <div className="absolute top-4 right-4">
                <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
                    isAvailable
                        ? 'bg-green-100 text-green-700'
                        : 'bg-red-100 text-red-700'
                }`}>
                    {data.availabilityStatus}
                </span>
            </div>

            {/* Header Section */}
            <div className="flex items-start justify-between mb-4 pr-20">
                <div className="flex items-center gap-3">
                    {/* Avatar */}
                    <div className="w-20 h-20 bg-yellow-400 rounded-full flex items-center justify-center">
                        <span className="text-3xl font-bold text-gray-900">
                            {getInitial(data.contractorName)}
                        </span>
                    </div>
                    
                    {/* Name and Location */}
                    <div>
                        <h3 className="text-xl font-bold text-gray-900 mb-1">
                            {data.contractorName}
                        </h3>
                        <div className="flex items-center gap-1 text-gray-600">
                            <MapPin className="w-4 h-4" />
                            <span className="text-sm">{data.city}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Primary Work */}
            <div className="mb-4">
                <p className="text-sm text-gray-500 mb-1">Primary Work:</p>
                <h4 className="text-lg font-bold text-gray-900">{data.primaryWorkCategory}</h4>
            </div>

            {/* Experience and Business Type */}
            <div className="flex items-center gap-4 mb-4 text-gray-600">
                <div className="flex items-center gap-2">
                    <Briefcase className="w-5 h-5" />
                    <span className="text-sm">Exp: {data.experience}</span>
                </div>
                <div className="flex items-center gap-2">
                    <Calendar className="w-5 h-5" />
                    <span className="text-sm">{data.businessType}</span>
                </div>
            </div>

            {/* Rating and Contact */}
            <div className="flex items-center gap-4 mb-4">
                <div className="flex items-center gap-1">
                    <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                    <span className="text-lg font-bold text-gray-900">{data.rating || 0}.0/5</span>
                </div>
                <div className="flex items-center gap-2 text-gray-600">
                    <Phone className="w-5 h-5" />
                    <span className="text-sm">{data.contactNo}</span>
                </div>
            </div>

            {/* Buttons - View Details and Toggle Button (shows opposite action) */}
            <div className="grid grid-cols-2 gap-3">
                <button
                    onClick={onViewDetails}
                    className="py-3 rounded-xl border-2 border-blue-500 text-blue-500 font-bold text-base transition-all hover:bg-blue-50 active:scale-[0.98]"
                >
                    View Details
                </button>
                <button
                    onClick={() => onToggleAvailability(data.id)}
                    className={`py-3 rounded-xl font-bold text-base transition-all active:scale-[0.98] ${
                        isAvailable
                            ? 'bg-red-500 hover:bg-red-600 text-white'
                            : 'bg-green-500 hover:bg-green-600 text-white'
                    }`}
                >
                    {isAvailable ? 'Busy' : 'Available'}
                </button>
            </div>
        </div>
    );
};

export default ContractorProfileCard;
