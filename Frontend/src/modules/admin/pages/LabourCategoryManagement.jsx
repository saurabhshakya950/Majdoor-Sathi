import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Image as ImageIcon, Save, X, Upload, Search } from 'lucide-react';
import toast from 'react-hot-toast';
import { labourCategoryAPI } from '../../../services/admin.api';

const LabourCategoryManagement = () => {
    const [categories, setCategories] = useState([]);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);

    const [searchQuery, setSearchQuery] = useState('');

    // New Category Form State
    const [newCategoryName, setNewCategoryName] = useState('');

    // New Sub-categories State
    const [newSubCategories, setNewSubCategories] = useState([{ name: '', image: '' }]);

    useEffect(() => {
        fetchCategories();
    }, []);

    const fetchCategories = async () => {
        try {
            setLoading(true);
            const response = await labourCategoryAPI.getAll();
            setCategories(response.data.categories || []);
        } catch (error) {
            console.error('Error fetching categories:', error);
            toast.error('Failed to load categories');
        } finally {
            setLoading(false);
        }
    };


    const handleAddCategory = async () => {
        if (!newCategoryName.trim()) {
            toast.error('Category Name is required');
            return;
        }

        try {
            setUploading(true);

            console.log('📤 Uploading category:', {
                name: newCategoryName,
                subCount: newSubCategories.length
            });

            const categoryData = {
                name: newCategoryName.trim(),
                subCategories: newSubCategories.filter(s => s.name.trim() !== '')
            };

            console.log('🚀 Sending request to backend...');
            const response = await labourCategoryAPI.create(categoryData);

            console.log('✅ Category created:', response);

            toast.success(response.message || 'Category processed successfully');

            // Reset form and refresh
            setNewCategoryName('');
            setNewSubCategories([{ name: '', image: '' }]);
            setIsAddModalOpen(false);
            fetchCategories();
        } catch (error) {
            console.error('❌ Error adding category:', error);
            console.error('Error response:', error.response);

            // Extract error message
            let errorMessage = 'Failed to add category';

            if (error.response?.data?.message) {
                errorMessage = error.response.data.message;
            } else if (error.response?.data?.error) {
                errorMessage = error.response.data.error;
            } else if (error.message) {
                errorMessage = error.message;
            }

            // Show specific error or generic message
            if (errorMessage.includes('already exists')) {
                toast.error('Category with this name already exists');
            } else if (errorMessage.includes('upload')) {
                toast.error('Image upload failed. Category created with default icon.');
                // Still refresh to show the category
                fetchCategories();
                setIsAddModalOpen(false);
            } else {
                toast.error(errorMessage);
            }
        } finally {
            setUploading(false);
        }
    };

    const handleDeleteCategory = async (id) => {
        if (window.confirm('Are you sure you want to delete this category?')) {
            try {
                await labourCategoryAPI.delete(id);
                toast.success('Category deleted');
                fetchCategories();
            } catch (error) {
                console.error('Error deleting category:', error);
                toast.error(error.response?.data?.message || 'Failed to delete category');
            }
        }
    };

    const closeModal = () => {
        setIsAddModalOpen(false);
        setNewCategoryName('');
        setNewSubCategories([{ name: '', image: '' }]);
    };

    const addSubCategoryField = () => {
        setNewSubCategories([...newSubCategories, { name: '', image: '' }]);
    };

    const removeSubCategoryField = (index) => {
        setNewSubCategories(newSubCategories.filter((_, i) => i !== index));
    };

    const handleSubCategoryChange = (index, field, value) => {
        const updated = [...newSubCategories];
        updated[index][field] = value;
        setNewSubCategories(updated);
    };

    const handleSubCategoryImageUpload = (index, e) => {
        const file = e.target.files[0];
        if (!file) return;

        if (!file.type.startsWith('image/')) {
            toast.error('Please select an image file');
            return;
        }

        const reader = new FileReader();
        reader.onloadend = () => {
            handleSubCategoryChange(index, 'image', reader.result);
        };
        reader.readAsDataURL(file);
    };

    // Flatten categories into sub-category items for display
    const displayItems = categories.flatMap(cat => {
        if (!cat.subCategories || cat.subCategories.length === 0) {
            return [{
                id: cat._id,
                name: cat.name,
                image: cat.image,
                parentId: cat._id,
                parentName: cat.name,
                isSub: false
            }];
        }
        return cat.subCategories.map((sub, idx) => ({
            id: sub._id || `${cat._id}-${idx}`,
            name: sub.name,
            image: sub.image,
            parentId: cat._id,
            parentName: cat.name,
            isSub: true
        }));
    });

    const filteredItems = displayItems.filter(item => {
        const query = searchQuery.toLowerCase();
        return item.name.toLowerCase().includes(query) ||
            item.parentName.toLowerCase().includes(query);
    });

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Labour Categories</h1>
                    <p className="text-gray-500 text-sm">Manage types of labourers available in the system</p>
                </div>
                <div className="flex items-center gap-4">
                    <div className="relative">
                        <input
                            type="text"
                            placeholder="Search categories..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none w-64"
                        />
                        <Search className="absolute left-3 top-2.5 text-gray-400 w-5 h-5" />
                    </div>
                    <button
                        onClick={() => setIsAddModalOpen(true)}
                        className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg transition-colors"
                    >
                        <Plus size={20} />
                        <span>Add Category</span>
                    </button>
                </div>
            </div>

            {/* Categories Grid */}
            {loading ? (
                <div className="flex justify-center items-center py-20">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
                </div>
            ) : categories.length === 0 ? (
                <div className="text-center py-20">
                    <ImageIcon size={48} className="mx-auto text-gray-300 mb-4" />
                    <p className="text-gray-500">No categories found. Add your first category!</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                    {filteredItems.map((item) => (
                        <div key={item.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 flex flex-col hover:shadow-md transition-shadow relative group">
                            <div className="flex flex-col items-center mb-4">
                                <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-3 overflow-hidden border">
                                    {item.image ? (
                                        <img
                                            src={item.image}
                                            alt={item.name}
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <ImageIcon size={32} className="text-gray-400" />
                                    )}
                                </div>
                                <div className="flex flex-col items-center">
                                    {item.isSub && (
                                        <span className="text-[10px] text-orange-500 font-bold uppercase tracking-widest mb-1 opacity-70">
                                            {item.parentName}
                                        </span>
                                    )}
                                    <h3 className="font-bold text-gray-800 text-lg text-center leading-tight">
                                        {item.name}
                                    </h3>
                                </div>
                            </div>

                            <button
                                onClick={() => handleDeleteCategory(item.parentId)}
                                className="absolute top-2 right-2 p-1.5 text-red-500 hover:bg-red-50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                title="Delete Category"
                            >
                                <Trash2 size={18} />
                            </button>
                        </div>
                    ))}
                </div>
            )}

            {/* Add Category Modal */}
            {isAddModalOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-xl animate-in fade-in zoom-in duration-200">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-bold text-gray-800">Add New Category</h2>
                            <button onClick={closeModal} className="text-gray-400 hover:text-gray-600">
                                <X size={24} />
                            </button>
                        </div>

                        <div className="space-y-4 max-h-[80vh] overflow-y-auto pr-2 custom-scrollbar">
                            {/* Category Name */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Category Name
                                </label>
                                <input
                                    type="text"
                                    value={newCategoryName}
                                    onChange={(e) => setNewCategoryName(e.target.value)}
                                    placeholder="e.g. Agriculture"
                                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none"
                                />
                            </div>

                            {/* Sub-categories Section (Moved Up) */}
                            <div className="pt-2 border-t mt-2">
                                <div className="flex justify-between items-center mb-3">
                                    <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wider">Sub-categories (Skills)</h3>
                                    <button
                                        onClick={addSubCategoryField}
                                        className="text-xs bg-orange-50 hover:bg-orange-100 text-orange-600 px-2 py-1 rounded flex items-center gap-1 transition-colors border border-orange-200"
                                    >
                                        <Plus size={14} />
                                        <span>Add Skill</span>
                                    </button>
                                </div>

                                <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
                                    {newSubCategories.length === 0 ? (
                                        <p className="text-xs text-gray-400 text-center py-4 bg-gray-50 rounded-lg border border-dashed border-gray-200">No skills added yet.</p>
                                    ) : (
                                        newSubCategories.map((sub, index) => (
                                            <div key={index} className="flex gap-3 items-center bg-gray-50 p-2.5 rounded-xl border border-gray-100 group">
                                                <div className="relative w-10 h-10 bg-white rounded-lg flex-shrink-0 border flex items-center justify-center overflow-hidden">
                                                    {sub.image ? (
                                                        <img src={sub.image} className="w-full h-full object-cover" alt="Sub" />
                                                    ) : (
                                                        <Upload size={14} className="text-gray-400" />
                                                    )}
                                                    <input
                                                        type="file"
                                                        accept="image/*"
                                                        className="absolute inset-0 opacity-0 cursor-pointer"
                                                        onChange={(e) => handleSubCategoryImageUpload(index, e)}
                                                    />
                                                </div>
                                                <div className="flex-1">
                                                    <input
                                                        type="text"
                                                        value={sub.name}
                                                        onChange={(e) => handleSubCategoryChange(index, 'name', e.target.value)}
                                                        placeholder="Skill Name (e.g. Cultivator)"
                                                        className="w-full text-sm border-none bg-transparent focus:ring-0 p-0 font-semibold text-gray-700"
                                                    />
                                                    <p className="text-[10px] text-gray-400">Click icon to upload</p>
                                                </div>
                                                <button
                                                    onClick={() => removeSubCategoryField(index)}
                                                    className="text-gray-300 hover:text-red-500 transition-colors"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>


                            <button
                                onClick={handleAddCategory}
                                disabled={uploading}
                                className="w-full bg-orange-500 hover:bg-orange-600 disabled:bg-gray-400 text-white font-bold py-3.5 rounded-xl transition-all shadow-lg active:scale-[0.98] flex items-center justify-center gap-2"
                            >
                                {uploading ? (
                                    <>
                                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                                        <span>Saving Category...</span>
                                    </>
                                ) : (
                                    <>
                                        <Save size={20} />
                                        <span>Save Category</span>
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default LabourCategoryManagement;
