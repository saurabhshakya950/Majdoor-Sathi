import { initializeApp } from 'firebase/app';
import { getMessaging } from 'firebase/messaging';

const firebaseConfig = {
  apiKey: "AIzaSyBOHzM06N1rsJmICtZN3ufnUyCVtB_qFnk",
  authDomain: "majdoor-aa733.firebaseapp.com",
  projectId: "majdoor-aa733",
  storageBucket: "majdoor-aa733.firebasestorage.app",
  messagingSenderId: "86971981788",
  appId: "1:86971981788:web:c9a5423d4be2d7ad343919",
  measurementId: "G-R8BRZ67VY8"
};

const app = initializeApp(firebaseConfig);
const messaging = getMessaging(app);

export { messaging };
