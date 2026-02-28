import mongoose from 'mongoose';

const labourCategorySchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Category name is required'],
        unique: true,
        trim: true
    },
    image: {
        type: String,
        default: 'https://cdn-icons-png.flaticon.com/512/4825/4825038.png'
    },
    isActive: {
        type: Boolean,
        default: true
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Admin',
        default: null
    },
    subCategories: [{
        name: {
            type: String,
            required: [true, 'Sub-category name is required'],
            trim: true
        },
        image: {
            type: String,
            default: 'https://cdn-icons-png.flaticon.com/512/4825/4825038.png'
        }
    }]
}, {
    timestamps: true
});

const LabourCategory = mongoose.model('LabourCategory', labourCategorySchema);

export default LabourCategory;
