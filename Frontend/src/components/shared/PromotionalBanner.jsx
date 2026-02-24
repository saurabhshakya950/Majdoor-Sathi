import { useState, useEffect, useRef, useCallback } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
// import { broadcastAPI } from '../../services/api';

const PromotionalBanner = ({ targetAudience = 'ALL' }) => {
    const [currentSlide, setCurrentSlide] = useState(0);
    const [isAnimating, setIsAnimating] = useState(false);
    const [touchStart, setTouchStart] = useState(0);
    const [touchEnd, setTouchEnd] = useState(0);
    const [adminBroadcasts, setAdminBroadcasts] = useState([]);
    const [loading, setLoading] = useState(true);
    const autoPlayRef = useRef(null);
    const sliderRef = useRef(null);

    // Fetching admin broadcasts removed as per user request
    // Admin broadcasts should only appear in notifications, not as banners
    useEffect(() => {
        setAdminBroadcasts([]);
        setLoading(false);
    }, []);

    // Default banner data - Construction materials theme with realistic images
    const defaultBanners = [
        {
            id: 1,
            title: 'Build Strong Foundations',
            subtitle: 'Premium Quality Cement',
            description: 'High-grade cement for all construction needs',
            price: '₹350',
            unit: 'per bag',
            discount: 'Up to 20% Off',
            badge: '🔥 Limited Time Offer',
            bgImage: 'https://images.unsplash.com/photo-1590856029826-c7a73142bbf1?w=1200&q=80&auto=format&fit=crop',
            bgGradient: 'from-gray-800 via-gray-700 to-gray-900',
            icon: '🧱',
            secondaryIcon: '🏗️',
            ctaPrimary: 'Shop Now',
            ctaSecondary: 'View Details'
        },
        {
            id: 2,
            title: 'High-Strength TMT Bars',
            subtitle: 'Premium Steel & Sariya',
            description: 'Corrosion-resistant steel for maximum durability',
            price: '₹60',
            unit: 'per kg',
            discount: 'Save 15%',
            badge: '⚡ Best Quality',
            bgImage: 'https://images.unsplash.com/photo-1621905252507-b35492cc74b4?w=1200&q=80&auto=format&fit=crop',
            bgGradient: 'from-slate-800 via-slate-700 to-slate-900',
            icon: '🏗️',
            secondaryIcon: '⚙️',
            ctaPrimary: 'Order Now',
            ctaSecondary: 'Learn More'
        },
        {
            id: 3,
            title: 'Combo Bulk Offer',
            subtitle: 'Cement + Steel Package',
            description: 'Complete construction material bundle',
            price: '₹25,000',
            unit: 'combo pack',
            discount: 'Save ₹5,000',
            badge: '💰 Best Deal',
            bgImage: 'https://images.unsplash.com/photo-1541888946425-d81bb19240f5?w=1200&q=80&auto=format&fit=crop',
            bgGradient: 'from-zinc-800 via-zinc-700 to-zinc-900',
            icon: '📦',
            secondaryIcon: '🎯',
            ctaPrimary: 'Get Combo',
            ctaSecondary: 'View Offers'
        }
    ];

    // Admin banners mapping removed - broadcasts now only for notifications
    const adminBannersFormatted = [];

    // Combine admin broadcasts with default banners
    const banners = adminBannersFormatted.length > 0 ? [...adminBannersFormatted, ...defaultBanners] : defaultBanners;

    const totalSlides = banners.length;

    // Auto-play functionality
    const startAutoPlay = useCallback(() => {
        autoPlayRef.current = setInterval(() => {
            nextSlide();
        }, 6000); // Auto-scroll every 6 seconds
    }, []);

    const stopAutoPlay = () => {
        if (autoPlayRef.current) {
            clearInterval(autoPlayRef.current);
        }
    };

    // Navigation functions
    const nextSlide = useCallback(() => {
        if (isAnimating) return;
        setIsAnimating(true);
        setCurrentSlide((prev) => (prev + 1) % totalSlides);
        setTimeout(() => setIsAnimating(false), 600);
    }, [isAnimating, totalSlides]);

    const prevSlide = useCallback(() => {
        if (isAnimating) return;
        setIsAnimating(true);
        setCurrentSlide((prev) => (prev - 1 + totalSlides) % totalSlides);
        setTimeout(() => setIsAnimating(false), 600);
    }, [isAnimating, totalSlides]);

    const goToSlide = (index) => {
        if (isAnimating || index === currentSlide) return;
        setIsAnimating(true);
        setCurrentSlide(index);
        setTimeout(() => setIsAnimating(false), 600);
    };

    // Touch handlers for mobile swipe
    const handleTouchStart = (e) => {
        setTouchStart(e.targetTouches[0].clientX);
    };

    const handleTouchMove = (e) => {
        setTouchEnd(e.targetTouches[0].clientX);
    };

    const handleTouchEnd = () => {
        if (!touchStart || !touchEnd) return;

        const distance = touchStart - touchEnd;
        const isLeftSwipe = distance > 50;
        const isRightSwipe = distance < -50;

        if (isLeftSwipe) {
            nextSlide();
        } else if (isRightSwipe) {
            prevSlide();
        }

        setTouchStart(0);
        setTouchEnd(0);
    };

    // Initialize auto-play
    useEffect(() => {
        startAutoPlay();
        return () => stopAutoPlay();
    }, [startAutoPlay]);

    // Pause on hover (desktop)
    const handleMouseEnter = () => stopAutoPlay();
    const handleMouseLeave = () => startAutoPlay();

    return (
        <div className="w-full px-4 py-4 bg-gray-50 overflow-hidden">
            <div
                ref={sliderRef}
                className="relative w-full h-60 sm:h-64 md:h-64 rounded-2xl overflow-hidden shadow-2xl group"
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
            >
                {/* Slider Container */}
                <div
                    className="flex h-full w-full transition-transform duration-600 ease-in-out"
                    style={{ transform: `translateX(-${currentSlide * 100}%)` }}
                >
                    {banners.map((banner, index) => (
                        <div
                            key={banner.id}
                            className="min-w-full w-full h-full flex-shrink-0"
                        >
                            {/* Background with realistic construction image */}
                            <div className={`relative h-full bg-gradient-to-br ${banner.bgGradient}`}>
                                {/* Background Image */}
                                <img
                                    src={banner.bgImage}
                                    alt={banner.title}
                                    className="absolute inset-0 w-full h-full object-cover"
                                    loading="lazy"
                                    onError={(e) => {
                                        // Fallback to gradient if image fails to load
                                        e.target.style.display = 'none';
                                    }}
                                />

                                {/* Dark overlay for text readability - subtle but effective */}
                                <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/50 to-black/60"></div>

                                {/* Additional bottom gradient for better text contrast */}
                                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>

                                {/* Content Container */}
                                <div className="relative h-full flex flex-col sm:flex-row items-start justify-between px-5 sm:px-6 md:px-8 py-5 sm:py-6">
                                    {/* Left Side - Text Content */}
                                    <div
                                        className={`flex-1 w-full sm:w-auto transition-all duration-700 ${currentSlide === index
                                            ? 'opacity-100 translate-y-0'
                                            : 'opacity-0 translate-y-4'
                                            }`}
                                    >
                                        {/* Offer Badge */}
                                        <div className="inline-flex items-center gap-1.5 bg-gradient-to-r from-orange-500 to-red-500 text-white px-3 py-1 rounded-full text-xs font-bold mb-2 animate-pulse">
                                            <span>{banner.badge}</span>
                                        </div>

                                        {/* Main Heading */}
                                        <h2 className="text-white text-xl sm:text-2xl md:text-3xl font-bold leading-tight mb-1.5">
                                            {banner.title}
                                        </h2>

                                        {/* Subtitle */}
                                        <p className="text-yellow-300 text-sm sm:text-base font-semibold mb-2">
                                            {banner.subtitle}
                                        </p>

                                        {/* Description */}
                                        <p className="text-gray-300 text-xs sm:text-sm mb-2.5 max-w-md line-clamp-2">
                                            {banner.description}
                                        </p>

                                        {/* Price Section */}
                                        <div className="flex items-baseline gap-2 mb-2.5">
                                            <span className="text-yellow-400 text-2xl sm:text-3xl md:text-4xl font-bold">
                                                {banner.price}
                                            </span>
                                            <span className="text-white text-xs sm:text-sm">
                                                {banner.unit}
                                            </span>
                                        </div>

                                        {/* Discount Highlight */}
                                        <div className="inline-block bg-yellow-400 text-gray-900 px-3 py-1.5 rounded-md text-xs sm:text-sm font-bold">
                                            {banner.discount}
                                        </div>
                                    </div>

                                    {/* Right Side - Visual Elements (Hidden on mobile) */}
                                    <div
                                        className={`hidden md:flex flex-col items-center justify-center gap-4 transition-all duration-700 delay-200 ${currentSlide === index
                                            ? 'opacity-100 translate-x-0'
                                            : 'opacity-0 translate-x-4'
                                            }`}
                                    >
                                        <div className="w-24 h-24 bg-yellow-500/20 backdrop-blur-sm rounded-full flex items-center justify-center border-2 border-yellow-500/40 shadow-xl">
                                            <span className="text-6xl">{banner.icon}</span>
                                        </div>
                                        <div className="w-20 h-20 bg-gray-600/20 backdrop-blur-sm rounded-full flex items-center justify-center border-2 border-gray-400/40 shadow-lg">
                                            <span className="text-5xl">{banner.secondaryIcon}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Decorative corner accents */}
                                <div className="absolute top-0 right-0 w-32 h-32 bg-yellow-500/10 rounded-bl-full"></div>
                                <div className="absolute bottom-0 left-0 w-24 h-24 bg-orange-500/10 rounded-tr-full"></div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Navigation Arrows */}
                <button
                    onClick={prevSlide}
                    disabled={isAnimating}
                    className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/60 backdrop-blur-sm text-white p-2 rounded-full transition-all duration-300 hover:scale-110 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed z-10 opacity-0 group-hover:opacity-100"
                    aria-label="Previous slide"
                >
                    <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6" />
                </button>

                <button
                    onClick={nextSlide}
                    disabled={isAnimating}
                    className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/60 backdrop-blur-sm text-white p-2 rounded-full transition-all duration-300 hover:scale-110 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed z-10 opacity-0 group-hover:opacity-100"
                    aria-label="Next slide"
                >
                    <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6" />
                </button>

                {/* Slide Indicators */}
                <div className="absolute bottom-3 sm:bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-10">
                    {banners.map((_, index) => (
                        <button
                            key={index}
                            onClick={() => goToSlide(index)}
                            disabled={isAnimating}
                            className={`h-1.5 rounded-full transition-all duration-300 ${index === currentSlide
                                ? 'w-8 bg-yellow-400'
                                : 'w-1.5 bg-white/50 hover:bg-white/80'
                                }`}
                            aria-label={`Go to slide ${index + 1}`}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
};

export default PromotionalBanner;
