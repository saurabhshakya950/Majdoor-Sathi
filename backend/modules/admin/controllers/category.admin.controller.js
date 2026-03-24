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

        // Check if category exists (using trimmed name for better matching)
        const trimmedName = name.trim();
        const existingCategory = await LabourCategory.findOne({ 
            name: { $regex: new RegExp(`^${trimmedName}$`, 'i') }
        });

        if (existingCategory) {
            console.log('🔄 Category already exists:', trimmedName, '- Updating or adding sub-categories.');
            
            if (!req.body.subCategories || !Array.isArray(req.body.subCategories) || req.body.subCategories.length === 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Category already exists. Please provide sub-categories to add.'
                });
            }

            let modifiedCount = 0;
            for (const sub of req.body.subCategories) {
                const subName = sub.name.trim();

                // Check if subCategory already exists (Index logic)
                const subIndex = existingCategory.subCategories.findIndex(
                    s => s.name.toLowerCase() === subName.toLowerCase()
                );

                let subImage = 'https://cdn-icons-png.flaticon.com/512/4825/4825038.png';
                
                // If it already exists, use its current image as base
                if (subIndex !== -1) {
                    subImage = existingCategory.subCategories[subIndex].image;
                }

                if (sub.image) {
                    if (sub.image.startsWith('data:image')) {
                        try {
                            // Upload new image
                            subImage = await uploadToCloudinary(sub.image, 'rajghar/categories/sub');
                        } catch (err) {
                            console.error(`❌ Sub-category image upload failed for ${sub.name}:`, err.message);
                            // Keep previous image if upload fails
                        }
                    } else if (sub.image.startsWith('http')) {
                        subImage = sub.image;
                    }
                }

                if (subIndex !== -1) {
                    // Update existing skill if image changed
                    if (existingCategory.subCategories[subIndex].image !== subImage) {
                        existingCategory.subCategories[subIndex].image = subImage;
                        modifiedCount++;
                    }
                } else {
                    // Add as brand new skill
                    existingCategory.subCategories.push({ name: subName, image: subImage });
                    modifiedCount++;
                }
            }

            if (modifiedCount > 0) {
                await existingCategory.save();
                console.log(`✅ Processed ${modifiedCount} changes for ${trimmedName}`);
                
                return res.status(200).json({
                    success: true,
                    message: `Successfully processed ${modifiedCount} skill(s) in ${trimmedName}`,
                    data: { category: existingCategory }
                });
            } else {
                return res.status(200).json({
                    success: true,
                    message: 'No changes detected. Skills are already up to date.',
                    data: { category: existingCategory }
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

// @desc    Delete sub-category (skill) from a category
// @route   DELETE /api/admin/labour-categories/:id/sub/:subId
// @access  Private (SUPER_ADMIN, ADMIN_LABOUR)
export const deleteSubCategory = async (req, res) => {
    try {
        const { id, subId } = req.params;

        const category = await LabourCategory.findById(id);

        if (!category) {
            return res.status(404).json({
                success: false,
                message: 'Category not found'
            });
        }

        // Find the sub-category to check for image cleanup
        const subCategory = category.subCategories.find(s => s._id.toString() === subId);

        if (!subCategory) {
            return res.status(404).json({
                success: false,
                message: 'Skill not found in this category'
            });
        }

        // Delete image from Cloudinary if it exists and is not the default icon
        if (subCategory.image && subCategory.image.includes('cloudinary.com')) {
            try {
                await deleteFromCloudinary(subCategory.image);
            } catch (error) {
                console.error('Failed to delete sub-category image from Cloudinary:', error.message);
                // Continue with DB deletion anyway
            }
        }

        // Remove sub-category from the array
        category.subCategories = category.subCategories.filter(s => s._id.toString() !== subId);
        
        // Save the updated category
        // If it was the only sub-category, the category still exists but with an empty list
        await category.save();

        res.status(200).json({
            success: true,
            message: 'Skill deleted successfully',
            data: { category }
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Server error deleting skill',
            error: error.message
        });
    }
};

// @desc    Delete labour category (Whole document)
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
                console.error('Failed to delete category image from Cloudinary:', error.message);
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

// @desc    Update sub-category (skill) in a category
// @route   PATCH /api/admin/labour-categories/:id/sub/:subId
// @access  Private (SUPER_ADMIN, ADMIN_LABOUR)
export const updateSubCategory = async (req, res) => {
    try {
        console.log('\n🔵 ===== UPDATE SUB-CATEGORY (SKILL) =====');
        const { id, subId } = req.params;
        const { name, image } = req.body;
        
        console.log(`📦 Targeted Update: Category[${id}] -> Skill[${subId}]`);
        console.log(`📝 New Name: ${name || 'N/A'}`);
        console.log(`🖼️ Has New Image: ${!!image && image.startsWith('data:image')}`);

        const category = await LabourCategory.findById(id);

        if (!category) {
            console.log('❌ Category not found');
            return res.status(404).json({
                success: false,
                message: 'Category not found'
            });
        }

        // Find the index of the sub-category
        const subIndex = category.subCategories.findIndex(s => s._id.toString() === subId);

        if (subIndex === -1) {
            console.log('❌ Skill (subId) not found in this category array');
            return res.status(404).json({
                success: false,
                message: 'Skill not found in this category'
            });
        }

        console.log(`🎯 Found skill at index: ${subIndex}`);

        // Handle sub-category name change
        if (name && name.trim()) {
            category.subCategories[subIndex].name = name.trim();
        }

        // Handle sub-category image update
        if (image) {
            if (image.startsWith('data:image')) {
                // 1. Try to delete old image (Non-blocking)
                const oldImageUrl = category.subCategories[subIndex].image;
                if (oldImageUrl && oldImageUrl.includes('cloudinary.com')) {
                    try {
                        console.log('🗑️ Attempting to delete old image:', oldImageUrl);
                        await deleteFromCloudinary(oldImageUrl);
                        console.log('✅ Old image deletion attempted');
                    } catch (deleteError) {
                        console.warn('⚠️ Non-blocking delete error:', deleteError.message);
                        // We continue even if delete fails
                    }
                }

                // 2. Upload new image (Blocking for this update)
                try {
                    console.log('📤 Uploading new image to Cloudinary...');
                    const newImageUrl = await uploadToCloudinary(image, 'rajghar/categories/sub');
                    category.subCategories[subIndex].image = newImageUrl;
                    console.log('✅ New image uploaded successfully:', newImageUrl);
                } catch (uploadError) {
                    console.error('❌ Sub-category image upload failed:', uploadError.message);
                    // If upload fails, we don't change the DB but we also don't crash
                    return res.status(500).json({
                        success: false,
                        message: 'Failed to upload new image to Cloudinary',
                        error: uploadError.message
                    });
                }
            } else if (image.startsWith('http')) {
                console.log('🔗 Using provided image URL');
                category.subCategories[subIndex].image = image;
            }
        }

        // IMPORTANT: Tell Mongoose that the subCategories array has been modified
        category.markModified('subCategories');
        
        await category.save();
        console.log('✅ Changes saved to database successfully');
        console.log('==========================================\n');

        res.status(200).json({
            success: true,
            message: 'Skill updated successfully',
            data: { category }
        });

    } catch (error) {
        console.error('❌ UPDATE SUB-CATEGORY ERROR:', error);
        res.status(500).json({
            success: false,
            message: 'Server error updating skill',
            error: error.message
        });
    }
};
