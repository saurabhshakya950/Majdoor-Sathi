import { useState } from 'react';
import toast from 'react-hot-toast';

const ContactForm = ({ initialData = {} }) => {
    const [formData, setFormData] = useState({
        fullName: initialData.fullName || '',
        contact: initialData.contact || '',
        message: initialData.message || ''
    });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.fullName.trim()) {
            toast.error('Please enter your name');
            return;
        }

        if (!formData.contact.trim()) {
            toast.error('Please enter your email or phone number');
            return;
        }

        if (!formData.message.trim()) {
            toast.error('Please enter your message');
            return;
        }

        try {
            const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/admin/notifications/contact-inquiry`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: formData.fullName,
                    phone: formData.contact,
                    message: formData.message,
                    senderRole: 'user'
                })
            });

            const data = await response.json();

            if (data.success) {
                toast.success("Thanks for contacting us, we'll get back to you soon.");
                setFormData(prev => ({ ...prev, message: '' }));
            } else {
                toast.error(data.message || 'Failed to submit inquiry');
            }
        } catch (error) {
            console.error('Inquiry submission error:', error);
            toast.error('Something went wrong. Please try again.');
        }
    };


    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    Full Name
                </label>
                <input
                    type="text"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleChange}
                    placeholder="Enter your full name"
                    className="w-full bg-gray-50 border border-gray-200 rounded-lg p-3 text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
                />
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email or Phone Number
                </label>
                <input
                    type="text"
                    name="contact"
                    value={formData.contact}
                    onChange={handleChange}
                    placeholder="Enter your email or phone number"
                    className="w-full bg-gray-50 border border-gray-200 rounded-lg p-3 text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
                />
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    Message
                </label>
                <textarea
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    placeholder="Tell us how we can help you..."
                    rows="5"
                    className="w-full bg-gray-50 border border-gray-200 rounded-lg p-3 text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent resize-none"
                />
            </div>

            <button
                type="submit"
                className="w-full py-3 rounded-full bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-bold text-base transition-all shadow-md active:scale-[0.98]"
            >
                Submit
            </button>
        </form>
    );
};

export default ContactForm;
