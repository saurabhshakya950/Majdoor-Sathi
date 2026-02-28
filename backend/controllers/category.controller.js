import LabourCategory from '../modules/admin/models/LabourCategory.model.js';

// @desc    Get all labour categories (Public)
// @route   GET /api/categories
// @access  Public
export const getPublicCategories = async (req, res) => {
    try {
        const categories = await LabourCategory.find({ isActive: true })
            .select('name icon image subCategories') // Include subCategories
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
