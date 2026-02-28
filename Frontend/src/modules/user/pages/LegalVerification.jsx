import { useNavigate } from 'react-router-dom';
import { useState, useEffect, useRef } from 'react';
import { Shield, Upload, X, CheckCircle, XCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import PageHeader from '../components/PageHeader';
import InfoBox from '../components/InfoBox';

const LegalVerification = () => {
    const navigate = useNavigate();
    const fileInputRef = useRef(null);
    const [aadharNumber, setAadharNumber] = useState('');
    const [uploadedPhotos, setUploadedPhotos] = useState([]);
    const [verificationStatus, setVerificationStatus] = useState('pending');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const userProfile = JSON.parse(localStorage.getItem('user_profile') || '{}');
        setAadharNumber(userProfile.aadharNumber || '');
        fetchVerificationStatus();
    }, []);

    const fetchVerificationStatus = async () => {
        try {
            const token = localStorage.getItem('access_token');

            if (token) {
                const response = await fetch(`${import.meta.env.VITE_API_URL || `${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}`}/users/verification-status`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });

                const data = await response.json();

                if (data.success && data.data.verificationRequest) {
                    const request = data.data.verificationRequest;

                    if (request.status === 'Approved') setVerificationStatus('verified');
                    else if (request.status === 'Rejected') setVerificationStatus('rejected');
                    else if (request.status === 'Pending') setVerificationStatus('submitted');

                    if (request.aadhaarFrontUrl && request.aadhaarBackUrl) {
                        setUploadedPhotos([request.aadhaarFrontUrl, request.aadhaarBackUrl]);
                    }

                    const verificationData = {
                        aadharNumber: request.aadhaarNumber,
                        photos: [request.aadhaarFrontUrl, request.aadhaarBackUrl],
                        status: request.status === 'Approved' ? 'verified' :
                            request.status === 'Rejected' ? 'rejected' : 'submitted',
                        requestId: request.requestId
                    };
                    localStorage.setItem('user_verification', JSON.stringify(verificationData));
                } else {
                    const verificationData = JSON.parse(localStorage.getItem('user_verification') || '{}');
                    if (verificationData.photos) setUploadedPhotos(verificationData.photos);
                    if (verificationData.status) setVerificationStatus(verificationData.status);
                }
            } else {
                const verificationData = JSON.parse(localStorage.getItem('user_verification') || '{}');
                if (verificationData.photos) setUploadedPhotos(verificationData.photos);
                if (verificationData.status) setVerificationStatus(verificationData.status);
            }
        } catch (error) {
            console.error('Error fetching verification status:', error);
            const verificationData = JSON.parse(localStorage.getItem('user_verification') || '{}');
            if (verificationData.photos) setUploadedPhotos(verificationData.photos);
            if (verificationData.status) setVerificationStatus(verificationData.status);
        }
    };

    const handleUploadClick = () => {
        if (verificationStatus === 'verified') {
            toast.error('Already verified');
            return;
        }
        fileInputRef.current?.click();
    };

    const handleFileChange = (e) => {
        const files = Array.from(e.target.files);
        if (files.length > 0) {
            const newPhotos = files.map(file => {
                return new Promise((resolve) => {
                    const reader = new FileReader();
                    reader.onloadend = () => resolve(reader.result);
                    reader.readAsDataURL(file);
                });
            });

            Promise.all(newPhotos).then(photos => {
                const updatedPhotos = [...uploadedPhotos, ...photos];
                setUploadedPhotos(updatedPhotos);

                const verificationData = JSON.parse(localStorage.getItem('user_verification') || '{}');
                verificationData.photos = updatedPhotos;
                if (!verificationData.status) verificationData.status = 'pending';
                localStorage.setItem('user_verification', JSON.stringify(verificationData));

                toast.success('Document uploaded successfully');
            });
        }
    };

    const handleRemovePhoto = (index) => {
        if (verificationStatus === 'verified') {
            toast.error('Cannot remove verified documents');
            return;
        }

        const updatedPhotos = uploadedPhotos.filter((_, i) => i !== index);
        setUploadedPhotos(updatedPhotos);

        if (updatedPhotos.length === 0) {
            const verificationData = { status: 'pending', photos: [] };
            localStorage.setItem('user_verification', JSON.stringify(verificationData));
            setVerificationStatus('pending');
        } else {
            const verificationData = JSON.parse(localStorage.getItem('user_verification') || '{}');
            verificationData.photos = updatedPhotos;
            localStorage.setItem('user_verification', JSON.stringify(verificationData));
        }

        toast.success('Document removed');
    };

    const handleSubmitVerification = async () => {
        if (!aadharNumber) {
            toast.error('Aadhaar number is required');
            return;
        }

        if (uploadedPhotos.length < 2) {
            toast.error('Please upload at least 2 documents (front and back of Aadhaar)');
            return;
        }

        if (verificationStatus === 'submitted') {
            toast.error('Verification already submitted. Waiting for admin approval.');
            return;
        }

        if (verificationStatus === 'verified') {
            toast.error('Already verified');
            return;
        }

        try {
            setLoading(true);
            const token = localStorage.getItem('access_token');
            const userProfile = JSON.parse(localStorage.getItem('user_profile') || '{}');
            const mobileNumber = localStorage.getItem('mobile_number');

            if (!token) {
                toast.error('Please login first');
                return;
            }

            const response = await fetch(`${import.meta.env.VITE_API_URL || `${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}`}/admin/verification/submit`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    entityType: 'user',
                    name: `${userProfile.firstName || ''} ${userProfile.lastName || ''}`.trim() || 'User',
                    phone: mobileNumber || userProfile.phoneNumber || '',
                    aadhaarNumber: aadharNumber,
                    aadhaarFrontUrl: uploadedPhotos[0],
                    aadhaarBackUrl: uploadedPhotos[1]
                })
            });

            const data = await response.json();

            if (data.success) {
                const verificationData = {
                    aadharNumber,
                    photos: uploadedPhotos,
                    status: 'submitted',
                    submittedAt: new Date().toISOString(),
                    requestId: data.data.verificationRequest.requestId
                };

                localStorage.setItem('user_verification', JSON.stringify(verificationData));
                setVerificationStatus('submitted');

                toast.success('Submitted for verification! Admin will review your documents.');
            } else {
                toast.error(data.message || 'Failed to submit verification');
            }
        } catch (error) {
            console.error('Error submitting verification:', error);

            const verificationData = {
                aadharNumber,
                photos: uploadedPhotos,
                status: 'submitted',
                submittedAt: new Date().toISOString()
            };

            localStorage.setItem('user_verification', JSON.stringify(verificationData));
            setVerificationStatus('submitted');

            toast.success('Submitted for verification! Admin will review your documents.');
        } finally {
            setLoading(false);
        }
    };

    const getButtonStyle = () => {
        switch (verificationStatus) {
            case 'verified': return 'bg-green-500 hover:bg-green-600';
            case 'rejected': return 'bg-red-500 hover:bg-red-600';
            case 'submitted': return 'bg-blue-500 hover:bg-blue-600';
            default: return 'bg-yellow-400 hover:bg-yellow-500';
        }
    };

    const getButtonText = () => {
        switch (verificationStatus) {
            case 'verified':
                return <span className="flex items-center justify-center gap-2"><CheckCircle className="w-5 h-5" />Verified</span>;
            case 'rejected':
                return <span className="flex items-center justify-center gap-2"><XCircle className="w-5 h-5" />Not Verified</span>;
            case 'submitted':
                return 'Pending Verification';
            default:
                return 'Submit for Verification';
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 pb-6">
            <PageHeader title="Legal Verification" backPath="/user/settings" />

            <div className="p-4">
                <InfoBox variant="info" message="Verified users get more visibility and trust. Your documents are stored securely." />

                <div className="mb-6 mt-6">
                    <label className="block text-sm font-semibold text-gray-700 mb-3">Aadhaar Number (12 Digit)</label>
                    <div className="bg-white border border-gray-200 rounded-xl p-4 flex items-center gap-3">
                        <Shield className="w-5 h-5 text-gray-400" />
                        <span className="text-gray-900 font-medium tracking-wide">{aadharNumber || 'Not provided'}</span>
                    </div>
                </div>

                <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*" multiple />

                {uploadedPhotos.length > 0 ? (
                    <div className="mb-6">
                        <label className="block text-sm font-semibold text-gray-700 mb-3">Uploaded Documents</label>
                        <div className="grid grid-cols-2 gap-3 mb-3">
                            {uploadedPhotos.map((photo, index) => (
                                <div key={index} className="relative">
                                    <img src={photo} alt={`Document ${index + 1}`} className="w-full h-32 object-cover rounded-xl border-2 border-gray-200" />
                                    {verificationStatus !== 'verified' && (
                                        <button onClick={() => handleRemovePhoto(index)} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-lg hover:bg-red-600 transition-all">
                                            <X className="w-4 h-4" />
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>
                        {verificationStatus !== 'verified' && (
                            <button onClick={handleUploadClick} className="w-full py-3 rounded-xl border-2 border-dashed border-gray-300 bg-white hover:border-yellow-400 hover:bg-yellow-50 transition-all flex items-center justify-center gap-2 text-gray-600 font-medium">
                                <Upload className="w-5 h-5" />Add More Documents
                            </button>
                        )}
                    </div>
                ) : (
                    <div onClick={handleUploadClick} className="bg-white border-2 border-dashed border-gray-300 rounded-xl p-8 mb-6 cursor-pointer hover:border-yellow-400 hover:bg-yellow-50 transition-all">
                        <div className="flex flex-col items-center justify-center text-center">
                            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                                <Upload className="w-6 h-6 text-gray-400" />
                            </div>
                            <p className="text-gray-500 font-medium">Upload Document Photos</p>
                            <p className="text-xs text-gray-400 mt-1">Tap to upload Aadhaar card photos</p>
                        </div>
                    </div>
                )}

                {verificationStatus === 'submitted' && (
                    <div className="mb-4 bg-blue-50 border border-blue-200 rounded-xl p-4">
                        <p className="text-sm text-blue-700 font-medium">⏳ Your verification is pending. Admin will review your documents soon.</p>
                    </div>
                )}

                {verificationStatus === 'verified' && (
                    <div className="mb-4 bg-green-50 border border-green-200 rounded-xl p-4">
                        <p className="text-sm text-green-700 font-medium">✅ Your documents have been verified successfully!</p>
                    </div>
                )}

                {verificationStatus === 'rejected' && (
                    <div className="mb-4 bg-red-50 border border-red-200 rounded-xl p-4">
                        <p className="text-sm text-red-700 font-medium">❌ Your verification was rejected. Please upload correct documents and try again.</p>
                    </div>
                )}

                <button
                    onClick={handleSubmitVerification}
                    disabled={verificationStatus === 'submitted' || verificationStatus === 'verified' || loading}
                    className={`w-full py-4 rounded-full text-white font-bold text-lg transition-all shadow-md active:scale-[0.98] ${getButtonStyle()} ${(verificationStatus === 'submitted' || verificationStatus === 'verified' || loading) ? 'opacity-90 cursor-not-allowed' : ''
                        }`}
                >
                    {loading ? 'Submitting...' : getButtonText()}
                </button>
            </div>
        </div>
    );
};

export default LegalVerification;
