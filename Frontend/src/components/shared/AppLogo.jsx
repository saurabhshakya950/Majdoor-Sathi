const AppLogo = ({ size = 'md', className = '' }) => {
    const sizeClasses = {
        sm: 'h-10 w-10',
        md: 'h-14 w-14',
        lg: 'h-16 w-16',
        xl: 'h-20 w-20'
    };

    return (
        <div className="flex-shrink-0">
            <img
                src="/logo.png"
                alt="Majdoor Sathi"
                className={`${sizeClasses[size]} object-contain drop-shadow-sm`}
                style={{ filter: 'drop-shadow(0 1px 2px rgba(0, 0, 0, 0.1))' }}
                onError={(e) => {
                    e.target.style.display = 'none';
                    const parent = e.target.parentNode;
                    if (!parent.querySelector('.logo-fallback')) {
                        const fallback = document.createElement('div');
                        fallback.className = 'logo-fallback flex items-center justify-center bg-gradient-to-br from-orange-400 to-orange-600 rounded-full shadow-md';
                        fallback.innerHTML = '<span class="text-2xl"></span>';
                        parent.appendChild(fallback);
                    }
                }}
            />
        </div>
    );
};

export default AppLogo;
