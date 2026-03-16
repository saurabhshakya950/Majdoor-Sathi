import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, Trash2, Check, CheckCheck } from 'lucide-react';
import toast from 'react-hot-toast';
import ContractorPageHeader from '../components/ContractorPageHeader';
import ContractorBottomNav from '../components/ContractorBottomNav';

const Notifications = () => {
    const navigate = useNavigate();
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [unreadCount, setUnreadCount] = useState(0);

    useEffect(() => {
        fetchNotifications();
    }, []);

    const fetchNotifications = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('access_token');

            if (!token) {
                setLoading(false);
                return;
            }

            const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/notifications?userType=CONTRACTOR`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            const data = await response.json();

            if (data.success) {
                setNotifications(data.data.notifications || []);
                setUnreadCount(data.data.unreadCount || 0);
            }
        } catch (error) {
            console.error('Error fetching notifications:', error);
        } finally {
            setLoading(false);
        }
    };

    const markAsRead = async (id) => {
        try {
            const token = localStorage.getItem('access_token');

            const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/notifications/${id}/read`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            const data = await response.json();

            if (data.success) {
                fetchNotifications();
            }
        } catch (error) {
            console.error('Error marking as read:', error);
        }
    };

    const markAllAsRead = async () => {
        try {
            const token = localStorage.getItem('access_token');

            const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/notifications/read-all`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            const data = await response.json();

            if (data.success) {
                toast.success('All notifications marked as read');
                fetchNotifications();
            }
        } catch (error) {
            console.error('Error marking all as read:', error);
            toast.error('Failed to mark all as read');
        }
    };

    const deleteNotification = async (id) => {
        try {
            const token = localStorage.getItem('access_token');

            const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/notifications/${id}?userType=CONTRACTOR`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            const data = await response.json();

            if (data.success) {
                toast.success('Notification deleted');
                fetchNotifications();
            }
        } catch (error) {
            console.error('Error deleting notification:', error);
            toast.error('Failed to delete notification');
        }
    };

    const getPriorityColor = (priority) => {
        switch (priority) {
            case 'URGENT': return 'bg-red-100 border-red-300 text-red-800';
            case 'HIGH': return 'bg-orange-100 border-orange-300 text-orange-800';
            case 'MEDIUM': return 'bg-blue-100 border-blue-300 text-blue-800';
            case 'LOW': return 'bg-gray-100 border-gray-300 text-gray-800';
            default: return '🔔';
        }
    };

    const getTypeIcon = (type) => {
        switch (type) {
            case 'BROADCAST': return '📢';
            case 'JOB': return '💼';
            case 'APPLICATION': return '📄';
            case 'VERIFICATION': return '✅';
            default: return '🔔';
        }
    };

    return (
        <div className="bg-gray-50 flex flex-col overflow-hidden" style={{ height: '100dvh', minHeight: '-webkit-fill-available' }}>
            <ContractorPageHeader title="Notifications" backPath="/contractor/hire-workers" />

            {/* Scrollable Content Area */}
            <div className="flex-1 overflow-y-auto pb-24">
                {/* Header Actions */}
                {notifications.length > 0 && (
                    <div className="bg-white px-4 py-3 border-b flex justify-between items-center sticky top-0 z-[5] shadow-sm">
                        <span className="text-sm text-gray-600">
                            {unreadCount > 0 ? `${unreadCount} unread` : 'All caught up!'}
                        </span>
                        {unreadCount > 0 && (
                            <button
                                onClick={markAllAsRead}
                                className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
                            >
                                <CheckCheck className="w-4 h-4" />
                                Mark all as read
                            </button>
                        )}
                    </div>
                )}

                <div className="p-4">
                    {loading ? (
                        <div className="flex justify-center items-center py-20">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-400"></div>
                        </div>
                    ) : notifications.length === 0 ? (
                        <div className="bg-white rounded-lg shadow-sm p-8 text-center">
                            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Bell className="w-10 h-10 text-gray-400" />
                            </div>
                            <h2 className="text-xl font-bold text-gray-900 mb-2">No Notifications Yet</h2>
                            <p className="text-gray-500">
                                You'll see notifications here when you receive updates about your projects and requests.
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {notifications.map((notification) => (
                                <div
                                    key={notification._id}
                                    className={`bg-white rounded-lg shadow-sm border-l-4 ${notification.isRead ? 'border-gray-300' : 'border-yellow-400'
                                        } overflow-hidden`}
                                >
                                    <div className="p-4">
                                        <div className="flex items-start justify-between gap-3">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <span className="text-2xl">{getTypeIcon(notification.type)}</span>
                                                    <h3 className={`font-bold ${notification.isRead ? 'text-gray-700' : 'text-gray-900'}`}>
                                                        {notification.title}
                                                    </h3>
                                                    {notification.priority && notification.priority !== 'MEDIUM' && (
                                                        <span className={`text-xs px-2 py-0.5 rounded-full border ${getPriorityColor(notification.priority)}`}>
                                                            {notification.priority}
                                                        </span>
                                                    )}
                                                </div>
                                                <p className={`text-sm ${notification.isRead ? 'text-gray-500' : 'text-gray-700'} mb-2`}>
                                                    {notification.message}
                                                </p>
                                                <p className="text-xs text-gray-400">
                                                    {new Date(notification.createdAt).toLocaleString('en-IN', {
                                                        day: 'numeric',
                                                        month: 'short',
                                                        year: 'numeric',
                                                        hour: '2-digit',
                                                        minute: '2-digit'
                                                    })}
                                                </p>
                                            </div>
                                            <div className="flex flex-col gap-2">
                                                <button
                                                    onClick={() => deleteNotification(notification._id)}
                                                    className="p-2 hover:bg-red-50 rounded-lg transition-colors"
                                                    title="Delete"
                                                >
                                                    <Trash2 className="w-5 h-5 text-red-600" />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            <ContractorBottomNav />
        </div>
    );
};

export default Notifications;

