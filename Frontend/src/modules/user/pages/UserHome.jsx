import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, X } from 'lucide-react';
import UserBottomNav from '../components/UserBottomNav';
import UserHeader from '../components/UserHeader';
import PromotionalBanner from '../../../components/shared/PromotionalBanner';
import { categoryAPI } from '../../../services/api';

const UserHome = () => {
    const navigate = useNavigate();
    const [searchQuery, setSearchQuery] = useState('');
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showAllCategories, setShowAllCategories] = useState(false);
    const [activeCategory, setActiveCategory] = useState(null);

    // Fetch categories from backend
    useEffect(() => {
        fetchCategories();
    }, []);

    const fetchCategories = async () => {
        try {
            setLoading(true);
            const response = await categoryAPI.getAll();
            if (response.data.success) {
                setCategories(response.data.data.categories);
            }
        } catch (error) {
            console.error('Error fetching categories:', error);
            // Fallback to default categories if API fails
            setCategories([
                { _id: 'fallback-1', name: 'Electrician', icon: '👷' },
                { _id: 'fallback-2', name: 'Plumber', icon: '🔧' },
                { _id: 'fallback-3', name: 'Carpenter', icon: '🪚' },
                { _id: 'fallback-4', name: 'Painter', icon: '🎨' }
            ]);
        } finally {
            setLoading(false);
        }
    };

    // Flatten categories into sub-category items for display
    const displayItems = categories.flatMap(cat => {
        if (!cat.subCategories || cat.subCategories.length === 0) {
            return [{
                id: cat._id,
                name: cat.name,
                image: cat.image,
                parentId: cat._id,
                parentName: cat.name
            }];
        }
        return cat.subCategories.map((sub, idx) => ({
            id: sub._id || `${cat._id}-${idx}`,
            name: sub.name,
            image: sub.image,
            parentId: cat._id,
            parentName: cat.name
        }));
    });

    const filteredItems = displayItems.filter(item => {
        const query = searchQuery.toLowerCase();
        return item.name.toLowerCase().includes(query) ||
            item.parentName.toLowerCase().includes(query);
    });

    const displayedItems = showAllCategories ? filteredItems : filteredItems.slice(0, 8);

    const handleCategoryClick = (item) => {
        // Redirection to hire workers with this specific sub-category/skill
        navigate('/user/hire-workers', { state: { selectedCategory: item.name } });
    };

    const handleSeeAllClick = () => {
        setShowAllCategories(!showAllCategories);
    };

    return (
        <div className="bg-gray-50 flex flex-col overflow-hidden" style={{ height: '100dvh', minHeight: '-webkit-fill-available' }}>
            {/* Header Section (Sticky) */}
            <UserHeader />

            {/* Search Bar (Sticky) */}
            <div className="bg-white px-4 py-3 shadow-sm z-10">
                <div className="flex items-center bg-gray-100 rounded-lg px-4 py-3">
                    <Search className="w-5 h-5 text-gray-400 mr-2" />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Find categories"
                        className="flex-1 bg-transparent text-gray-600 outline-none placeholder-gray-400"
                    />
                </div>
            </div>

            {/* Scrollable Content Area */}
            <div className="flex-1 overflow-y-auto pb-24">
                {/* Promotional Banners */}
                <PromotionalBanner />

                {/* Categories Section */}
                <div className="px-4 mt-2 mb-6">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                            <h3 className="text-lg font-bold text-gray-900">Categories</h3>
                        </div>
                        {filteredItems.length > 8 && (
                            <button
                                onClick={handleSeeAllClick}
                                className="text-blue-500 font-semibold text-sm hover:text-blue-600 transition-colors"
                            >
                                {showAllCategories ? 'See less' : 'See all'}
                            </button>
                        )}
                    </div>

                    {loading ? (
                        <div className="bg-white rounded-lg shadow-sm p-6 text-center">
                            <p className="text-gray-600">Loading categories...</p>
                        </div>
                    ) : filteredItems.length === 0 ? (
                        <div className="bg-white rounded-lg shadow-sm p-6 text-center">
                            <p className="text-gray-600">No categories found</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-4 gap-4">
                            {displayedItems.map((item) => (
                                <button
                                    key={item.id}
                                    onClick={() => handleCategoryClick(item)}
                                    className="flex flex-col items-center gap-2 p-3 rounded-xl bg-white shadow-sm hover:shadow-md transition-all active:scale-95 border border-transparent hover:border-orange-200"
                                >
                                    <div className="w-14 h-14 bg-orange-100 rounded-full flex items-center justify-center text-2xl overflow-hidden shadow-inner border border-orange-200">
                                        {(item.image || item.icon) ? (
                                            <img
                                                src={item.image || item.icon}
                                                alt={item.name}
                                                className="w-full h-full object-cover"
                                                onError={(e) => {
                                                    e.target.onerror = null;
                                                    e.target.src = 'https://cdn-icons-png.flaticon.com/512/4825/4825038.png';
                                                }}
                                            />
                                        ) : (
                                            <span>👷</span>
                                        )}
                                    </div>
                                    <span className="text-[10px] text-gray-700 text-center font-bold leading-tight">
                                        {item.name}
                                    </span>
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Bottom Navigation */}
            <UserBottomNav />
        </div>
    );
};

export default UserHome;
