import { useEffect } from 'react';
import { Toaster } from 'react-hot-toast';
import AppRoutes from './routes/AppRoutes';
import { initializePushNotifications, getFCMToken, registerTokenWithBackend } from './services/pushNotificationService';
import './App.css'

function App() {
  useEffect(() => {
    // Initialize push notifications
    initializePushNotifications();

    // Check if user is logged in and try to get/register token
    const token = localStorage.getItem('access_token');
    if (token) {
      getFCMToken().then(fcmToken => {
        if (fcmToken) {
          registerTokenWithBackend(fcmToken);
        }
      });
    }
  }, []);

  return (
    <>
      <Toaster position="top-center" reverseOrder={false} />
      <AppRoutes />
    </>
  )
}

export default App
