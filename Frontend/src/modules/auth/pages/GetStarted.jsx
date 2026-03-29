import { useNavigate } from 'react-router-dom';
import { ArrowRight, Users, Briefcase, MapPin } from 'lucide-react';
import { useState, useEffect } from 'react';

const GetStarted = () => {
    const navigate = useNavigate();
    const [currentSlide, setCurrentSlide] = useState(0);
    const [displayText, setDisplayText] = useState('');
    const [isTyping, setIsTyping] = useState(true);
    const [backgroundImages, setBackgroundImages] = useState([
        {
            url: "https://images.unsplash.com/photo-1621905251918-48416bd8575a?q=80&w=2069&auto=format&fit=crop",
            alt: "Construction Workers Team",
            text: "Find Skilled Workers"
        },
        {
            url: "https://static.vecteezy.com/system/resources/previews/002/439/960/non_2x/businessman-and-engineer-looking-at-a-building-blueprint-at-a-high-rise-building-construction-site-free-photo.jpg",
            alt: "Contractor at Construction Site",
            text: "Hire Contractors"
        },
        {
            url: "https://images.unsplash.com/photo-1513467535987-fd81bc7d62f8?q=80&w=2072&auto=format&fit=crop",
            alt: "Construction Materials",
            text: "Build Your Dream"
        },
        {
            url: "https://images.unsplash.com/photo-1589939705384-5185137a7f0f?q=80&w=2070&auto=format&fit=crop",
            alt: "Workers at Construction Site",
            text: "Expert Labour Force"
        },
        {
            url: "https://images.unsplash.com/photo-1504307651254-35680f356dfd?q=80&w=2076&auto=format&fit=crop",
            alt: "Building Construction Work",
            text: "Quality Construction"
        }
    ]);

    // Fetch dynamic slides
    useEffect(() => {
        const fetchSlides = async () => {
            try {
                const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/admin/getstarted/public`);
                const data = await response.json();
                if (data.success && data.data.slides && data.data.slides.length > 0) {
                    const dynamicSlides = data.data.slides.map(slide => ({
                        url: slide.imageUrl,
                        alt: slide.title,
                        text: slide.title
                    }));
                    setBackgroundImages(dynamicSlides);
                }
            } catch (error) {
                console.error('Error fetching dynamic slides:', error);
            }
        };
        fetchSlides();
    }, []);

    // Typewriter effect
    useEffect(() => {
        if (!backgroundImages[currentSlide]) return;

        const currentText = backgroundImages[currentSlide].text;
        let charIndex = 0;
        setDisplayText('');
        setIsTyping(true);

        const typingInterval = setInterval(() => {
            if (charIndex < currentText.length) {
                setDisplayText(currentText.substring(0, charIndex + 1));
                charIndex++;
            } else {
                setIsTyping(false);
                clearInterval(typingInterval);
            }
        }, 100);

        return () => clearInterval(typingInterval);
    }, [currentSlide, backgroundImages]);

    // Auto-scroll every 4 seconds
    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentSlide((prev) => (prev + 1) % backgroundImages.length);
        }, 4000);

        return () => clearInterval(interval);
    }, [backgroundImages.length]);

    return (
        <div className="flex flex-col relative bg-gradient-to-br from-gray-900 to-gray-800 overflow-hidden" style={{ height: '100dvh', minHeight: '-webkit-fill-available' }}>
            {/* Background Image Carousel Section with Overlay */}
            <div className="flex-1 relative">
                {/* Image Slides */}
                {backgroundImages.map((image, index) => (
                    <img
                        key={index}
                        src={image.url}
                        alt={image.alt}
                        className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ${index === currentSlide ? 'opacity-100' : 'opacity-0'
                            }`}
                    />
                ))}

                {/* Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/20 to-black/60"></div>

                {/* Animated Typewriter Text - Top Left */}
                <div className="absolute top-8 left-6 z-10">
                    <h2
                        className="text-2xl md:text-3xl font-bold text-white"
                        style={{
                            textShadow: '2px 2px 8px rgba(0,0,0,0.8)'
                        }}
                    >
                        {displayText}
                        <span className={`${isTyping ? 'animate-pulse' : 'opacity-0'}`}>|</span>
                    </h2>
                </div>
            </div>

            {/* Bottom Section - Compact */}
            <div className="bg-gradient-to-br from-amber-400 via-amber-500 to-yellow-500 p-6 pt-8 pb-10 rounded-t-[2.5rem] -mt-12 relative z-10 shadow-2xl">
                {/* Decorative Element */}
                <div className="absolute top-3 left-1/2 transform -translate-x-1/2 w-12 h-1.5 bg-white/30 rounded-full"></div>

                <div className="flex flex-col items-center text-center">
                    {/* Slogan */}
                    <h1 className="text-xl md:text-2xl font-bold text-white mb-6 leading-tight">
                        Your All-in-One Hiring Solution
                    </h1>

                    {/* CTA Button */}
                    <button
                        onClick={() => {
                            const token = localStorage.getItem('access_token');
                            const userType = localStorage.getItem('user_type');
                            
                            if (token && userType) {
                                // Redirect based on role instead of going to login flow
                                const routes = {
                                    'User': '/user/home',
                                    'Contractor': '/contractor/home',
                                    'Labour': '/labour/find-user' // or wherever their home is
                                };
                                navigate(routes[userType] || '/user/home');
                            } else {
                                // Go to normal login flows
                                navigate('/select-language');
                            }
                        }}
                        className="w-full max-w-md bg-white text-gray-900 font-bold py-4 px-6 rounded-full shadow-xl hover:shadow-2xl hover:scale-105 transition-all duration-300 flex items-center justify-center gap-2 group"
                    >
                        <span className="text-lg">Get Started</span>
                        <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-300" />
                    </button>

                    {/* Dots Indicator - Below Button */}
                    <div className="flex gap-2 mt-6">
                        {backgroundImages.map((_, index) => (
                            <button
                                key={index}
                                onClick={() => setCurrentSlide(index)}
                                className={`h-2 rounded-full transition-all duration-300 ${index === currentSlide
                                    ? 'bg-white w-8'
                                    : 'bg-white/50 w-2 hover:bg-white/75'
                                    }`}
                                aria-label={`Go to slide ${index + 1}`}
                            />
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default GetStarted;
