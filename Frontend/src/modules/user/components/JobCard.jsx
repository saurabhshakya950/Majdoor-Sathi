import { MapPin, Briefcase, Calendar, IndianRupee, Phone } from 'lucide-react';
import { memo } from 'react';

const JobCard = memo(({ job, onViewDetails, onToggleJobStatus, index = 0 }) => {
    return (
        <div className="premium-card card-fade-in" style={{ animationDelay: `${index * 0.05}s` }}>
            {/* Header with User Info and Status */}
            <div className="flex justify-between items-start mb-3">
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-yellow-400 to-yellow-500 rounded-full flex items-center justify-center shadow-md">
                        <span className="text-lg font-bold text-gray-900">
                            {job.userName.charAt(0).toUpperCase()}
                        </span>
                    </div>
                    <div>
                        <h3 className="font-semibold text-gray-900">{job.userName}</h3>
                        <div className="flex items-center gap-1 text-sm text-gray-600">
                            <MapPin className="w-4 h-4" />
                            <span>{job.city}</span>
                        </div>
                    </div>
                </div>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                    job.status === 'Open' 
                        ? 'bg-green-100 text-green-700' 
                        : 'bg-gray-100 text-gray-700'
                }`}>
                    {job.status}
                </span>
            </div>

            {/* Job Title */}
            <h2 className="text-lg font-bold text-gray-900 mb-2">{job.jobTitle}</h2>

            {/* Job Description */}
            <p className="text-gray-600 text-sm mb-4">{job.jobDescription}</p>

            {/* Job Details */}
            <div className="flex items-center gap-4 mb-2 text-sm text-gray-600 flex-wrap">
                <div className="flex items-center gap-1">
                    <Briefcase className="w-4 h-4" />
                    <span>{job.category}</span>
                </div>
                <div className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    <span>{job.workDuration}</span>
                </div>
                <div className="flex items-center gap-1 text-yellow-600 font-medium">
                    <IndianRupee className="w-4 h-4" />
                    <span>
                        {job.budgetType === 'Negotiable' 
                            ? 'Negotiable' 
                            : `\u20B9${job.budgetAmount}`}
                    </span>
                </div>
            </div>

            {/* Mobile Number */}
            <div className="flex items-center gap-1 text-sm text-gray-600 mb-4">
                <Phone className="w-4 h-4" />
                <span>{job.mobileNumber}</span>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
                <button
                    onClick={() => onViewDetails(job)}
                    className="btn-secondary flex-1"
                >
                    View Details
                </button>
                {job.status === 'Open' ? (
                    <button
                        onClick={() => onToggleJobStatus(job.id)}
                        className="btn-primary flex-1"
                    >
                        Close Job
                    </button>
                ) : (
                    <button
                        onClick={() => onToggleJobStatus(job.id)}
                        className="flex-1 bg-green-500 hover:bg-green-600 text-white font-bold py-2 rounded-lg transition-all duration-200 ease-out hover:shadow-lg active:scale-95"
                    >
                        Open Job
                    </button>
                )}
            </div>
        </div>
    );
});

JobCard.displayName = 'JobCard';

export default JobCard;
