import GetStartedSlide from '../models/GetStartedSlide.model.js';
import { uploadToCloudinary } from '../../../utils/cloudinary.utils.js';

// @desc    Get all slides (Admin)
// @route   GET /api/admin/getstarted
// @access  Private (Admin)
export const getAllSlides = async (req, res) => {
    try {
        const slides = await GetStartedSlide.find()
            .populate('createdBy', 'username email')
            .sort({ order: 1, createdAt: -1 });

        res.status(200).json({
            success: true,
            data: { slides }
        });
    } catch (error) {
        console.error('❌ Error fetching slides:', error);
        res.status(500).json({
            success: false,
            message: 'Server error fetching slides',
            error: error.message
        });
    }
};

// @desc    Create new slide
// @route   POST /api/admin/getstarted
// @access  Private (Admin)
export const createSlide = async (req, res) => {
    try {
        const { title, imageUrl, order } = req.body;

        if (!title || !imageUrl) {
            return res.status(400).json({
                success: false,
                message: 'Title and Image are required'
            });
        }

        let uploadedUrl = imageUrl;
        if (imageUrl.startsWith('data:image')) {
            console.log('📤 Uploading GetStarted image to Cloudinary...');
            uploadedUrl = await uploadToCloudinary(imageUrl, 'getstarted');
        }

        const slide = await GetStartedSlide.create({
            title,
            imageUrl: uploadedUrl,
            order: order || 0,
            createdBy: req.admin._id
        });

        res.status(201).json({
            success: true,
            message: 'Slide created successfully',
            data: { slide }
        });
    } catch (error) {
        console.error('❌ Error creating slide:', error);
        res.status(500).json({
            success: false,
            message: 'Server error creating slide',
            error: error.message
        });
    }
};

// @desc    Update slide
// @route   PUT /api/admin/getstarted/:id
// @access  Private (Admin)
export const updateSlide = async (req, res) => {
    try {
        const { title, imageUrl, order, isActive } = req.body;
        const slide = await GetStartedSlide.findById(req.params.id);

        if (!slide) {
            return res.status(404).json({
                success: false,
                message: 'Slide not found'
            });
        }

        let finalImageUrl = imageUrl;
        if (imageUrl && imageUrl.startsWith('data:image')) {
            finalImageUrl = await uploadToCloudinary(imageUrl, 'getstarted');
        }

        if (title !== undefined) slide.title = title;
        if (finalImageUrl !== undefined) slide.imageUrl = finalImageUrl;
        if (order !== undefined) slide.order = order;
        if (isActive !== undefined) slide.isActive = isActive;

        await slide.save();

        res.status(200).json({
            success: true,
            message: 'Slide updated successfully',
            data: { slide }
        });
    } catch (error) {
        console.error('❌ Error updating slide:', error);
        res.status(500).json({
            success: false,
            message: 'Server error updating slide',
            error: error.message
        });
    }
};

// @desc    Delete slide
// @route   DELETE /api/admin/getstarted/:id
// @access  Private (Admin)
export const deleteSlide = async (req, res) => {
    try {
        const slide = await GetStartedSlide.findByIdAndDelete(req.params.id);
        if (!slide) {
            return res.status(404).json({
                success: false,
                message: 'Slide not found'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Slide deleted successfully'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Server error deleting slide'
        });
    }
};

// @desc    Toggle slide status
// @route   PATCH /api/admin/getstarted/:id/toggle
// @access  Private (Admin)
export const toggleSlideStatus = async (req, res) => {
    try {
        const slide = await GetStartedSlide.findById(req.params.id);
        if (!slide) {
            return res.status(404).json({
                success: false,
                message: 'Slide not found'
            });
        }

        slide.isActive = !slide.isActive;
        await slide.save();

        res.status(200).json({
            success: true,
            message: `Slide ${slide.isActive ? 'activated' : 'deactivated'} successfully`,
            data: { slide }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Server error toggling status'
        });
    }
};

// @desc    Get active slides (Public)
// @route   GET /api/getstarted/active
// @access  Public
export const getActiveSlides = async (req, res) => {
    try {
        const slides = await GetStartedSlide.find({ isActive: true })
            .select('imageUrl title order')
            .sort({ order: 1 });

        res.status(200).json({
            success: true,
            data: { slides }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Server error fetching active slides'
        });
    }
};
