import LabourCategory from '../models/LabourCategory.model.js';
import { uploadToCloudinary, deleteFromCloudinary } from '../../../utils/cloudinary.utils.js';

// @desc    Get all labour categories
// @route   GET /api/admin/labour-categories
// @access  Private (SUPER_ADMIN, ADMIN_LABOUR)
export const getAllCategories = async (req, res) => {
    try {
        const categories = await LabourCategory.find({ isActive: true })
            .sort({ name: 1 });

        res.status(200).json({
            success: true,
            data: { categories }
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Server error fetching categories',
            error: error.message
        });
    }
};

// @desc    Get category by ID
// @route   GET /api/admin/labour-categories/:id
// @access  Private (SUPER_ADMIN, ADMIN_LABOUR)
export const getCategoryById = async (req, res) => {
    try {
        const category = await LabourCategory.findById(req.params.id);

        if (!category) {
            return res.status(404).json({
                success: false,
                message: 'Category not found'
            });
        }

        res.status(200).json({
            success: true,
            data: { category }
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Server error fetching category',
            error: error.message
        });
    }
};

// @desc    Create labour category
// @route   POST /api/admin/labour-categories
// @access  Private (SUPER_ADMIN, ADMIN_LABOUR)
export const createCategory = async (req, res) => {
    try {
        console.log('\n🟢 ===== CREATE CATEGORY =====');
        console.log('📦 Request Body:', { 
            name: req.body.name, 
            hasImage: !!req.body.image,
            imageLength: req.body.image?.length 
        });
        
        const { name, image } = req.body;

        // Validate name
        if (!name || !name.trim()) {
            console.log('❌ Category name is required');
            return res.status(400).json({
                success: false,
                message: 'Category name is required'
            });
        }

        // Check if category exists
        const existingCategory = await LabourCategory.findOne({ 
            name: { $regex: new RegExp(`^${name}$`, 'i') }
        });

        if (existingCategory) {
            console.log('🔄 Category already exists:', name, '- Appending new sub-categories.');
            
            if (!req.body.subCategories || !Array.isArray(req.body.subCategories) || req.body.subCategories.length === 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Category already exists. Please provide sub-categories to add.'
                });
            }

            let addedCount = 0;
            for (const sub of req.body.subCategories) {
                const subName = sub.name.trim();
                // Check if subCategory already exists
                const subExists = existingCategory.subCategories.find(
                    s => s.name.toLowerCase() === subName.toLowerCase()
                );

                if (!subExists) {
                    let subImage = 'https://cdn-icons-png.flaticon.com/512/4825/4825038.png';
                    if (sub.image) {
                        if (sub.image.startsWith('data:image')) {
                            try {
                                subImage = await uploadToCloudinary(sub.image, 'rajghar/categories/sub');
                            } catch (err) {
                                console.error(`❌ Sub-category image upload failed for ${sub.name}:`, err.message);
                            }
                        } else if (sub.image.startsWith('http')) {
                            subImage = sub.image;
                        }
                    }
                    existingCategory.subCategories.push({ name: subName, image: subImage });
                    addedCount++;
                }
            }

            if (addedCount > 0) {
                await existingCategory.save();
                console.log(`✅ Appended ${addedCount} new sub-categories to ${name}`);
                
                return res.status(200).json({
                    success: true,
                    message: `Successfully added ${addedCount} new skill(s) to ${name}`,
                    data: { category: existingCategory }
                });
            } else {
                return res.status(400).json({
                    success: false,
                    message: 'All provided skills already exist in this category'
                });
            }
        }

        // Handle category image
        let categoryImage = 'https://cdn-icons-png.flaticon.com/512/4825/4825038.png'; // Default
        
        if (image) {
            if (image.startsWith('data:image')) {
                // Base64 image - upload to Cloudinary
                console.log('📤 Uploading base64 image to Cloudinary...');
                try {
                    categoryImage = await uploadToCloudinary(image, 'rajghar/categories');
                    console.log('✅ Image uploaded successfully:', categoryImage);
                } catch (uploadError) {
                    console.error('❌ Cloudinary upload failed:', uploadError.message);
                    // Don't fail the whole request, use default image
                    console.log('⚠️ Using default image instead');
                    categoryImage = 'https://cdn-icons-png.flaticon.com/512/4825/4825038.png';
                }
            } else if (image.startsWith('http')) {
                // URL provided
                console.log('🔗 Using provided URL:', image);
                categoryImage = image;
            } else {
                console.log('⚠️ Invalid image format, using default');
            }
        } else {
            console.log('🎨 No image provided, using default icon');
        }

        // Create category
        let subCategoriesData = [];
        if (req.body.subCategories && Array.isArray(req.body.subCategories)) {
            console.log(`📦 Processing ${req.body.subCategories.length} sub-categories...`);
            for (const sub of req.body.subCategories) {
                let subImage = 'https://cdn-icons-png.flaticon.com/512/4825/4825038.png';
                if (sub.image) {
                    if (sub.image.startsWith('data:image')) {
                        try {
                            subImage = await uploadToCloudinary(sub.image, 'rajghar/categories/sub');
                        } catch (err) {
                            console.error(`❌ Sub-category image upload failed for ${sub.name}:`, err.message);
                        }
                    } else if (sub.image.startsWith('http')) {
                        subImage = sub.image;
                    }
                }
                subCategoriesData.push({ name: sub.name.trim(), image: subImage });
            }
        }

        const category = await LabourCategory.create({
            name: name.trim(),
            image: categoryImage,
            subCategories: subCategoriesData,
            createdBy: req.admin._id
        });

        console.log('✅ Category created successfully:', category._id);
        console.log('===========================\n');

        res.status(201).json({
            success: true,
            message: 'Category created successfully',
            data: { category }
        });

    } catch (error) {
        console.error('❌ CREATE CATEGORY ERROR:', error);
        console.error('Error stack:', error.stack);
        console.log('===========================\n');
        
        res.status(500).json({
            success: false,
            message: 'Server error creating category',
            error: error.message
        });
    }
};

// @desc    Update labour category
// @route   PUT /api/admin/labour-categories/:id
// @access  Private (SUPER_ADMIN, ADMIN_LABOUR)
export const updateCategory = async (req, res) => {
    try {
        const { name, image, isActive } = req.body;

        const category = await LabourCategory.findById(req.params.id);

        if (!category) {
            return res.status(404).json({
                success: false,
                message: 'Category not found'
            });
        }

        if (name !== undefined) category.name = name;
        
        // Handle category image update
        if (image !== undefined) {
            if (image.startsWith('data:image')) {
                try {
                    // Delete old image if it's from Cloudinary
                    if (category.image && category.image.includes('cloudinary.com')) {
                        await deleteFromCloudinary(category.image);
                    }
                    
                    // Upload new image
                    category.image = await uploadToCloudinary(image, 'rajghar/categories');
                } catch (error) {
                    console.error('Category image upload error:', error);
                    return res.status(500).json({
                        success: false,
                        message: 'Failed to upload category image',
                        error: error.message
                    });
                }
            } else {
                category.image = image;
            }
        }
        
        if (isActive !== undefined) category.isActive = isActive;

        // Handle sub-categories update
        if (req.body.subCategories !== undefined && Array.isArray(req.body.subCategories)) {
            let subCategoriesData = [];
            for (const sub of req.body.subCategories) {
                let subImage = sub.image || 'https://cdn-icons-png.flaticon.com/512/4825/4825038.png';
                if (sub.image && sub.image.startsWith('data:image')) {
                    try {
                        subImage = await uploadToCloudinary(sub.image, 'rajghar/categories/sub');
                    } catch (err) {
                        console.error(`❌ Sub-category image upload failed during update:`, err.message);
                    }
                }
                subCategoriesData.push({ name: sub.name.trim(), image: subImage });
            }
            category.subCategories = subCategoriesData;
        }

        await category.save();

        res.status(200).json({
            success: true,
            message: 'Category updated successfully',
            data: { category }
        });

    } catch (error) {
        if (error.code === 11000) {
            return res.status(400).json({
                success: false,
                message: 'Category name already exists'
            });
        }

        res.status(500).json({
            success: false,
            message: 'Server error updating category',
            error: error.message
        });
    }
};

// @desc    Delete labour category
// @route   DELETE /api/admin/labour-categories/:id
// @access  Private (SUPER_ADMIN, ADMIN_LABOUR)
export const deleteCategory = async (req, res) => {
    try {
        const category = await LabourCategory.findById(req.params.id);

        if (!category) {
            return res.status(404).json({
                success: false,
                message: 'Category not found'
            });
        }

        // Delete category image from Cloudinary if exists
        if (category.image && category.image.includes('cloudinary.com')) {
            try {
                await deleteFromCloudinary(category.image);
            } catch (error) {
                console.error('Failed to delete category image from Cloudinary:', error);
            }
        }

        await category.deleteOne();

        res.status(200).json({
            success: true,
            message: 'Category deleted successfully'
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Server error deleting category',
            error: error.message
        });
    }
};
