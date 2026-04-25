import mongoose from 'mongoose';

const driverSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: [true, 'Full name is required'],
      trim: true,
      maxlength: [150, 'Name cannot exceed 150 characters'],
    },
    nicNumber: {
      type: String,
      required: [true, 'NIC number is required'],
      unique: true,
      trim: true,
      maxlength: [20, 'NIC cannot exceed 20 characters'],
    },
    licenseNumber: {
      type: String,
      required: [true, 'License number is required'],
      unique: true,
      trim: true,
      maxlength: [30, 'License number cannot exceed 30 characters'],
    },
    contactPhone: {
      type: String,
      trim: true,
      maxlength: [20, 'Phone cannot exceed 20 characters'],
    },
    address: {
      type: String,
      trim: true,
      maxlength: [300, 'Address cannot exceed 300 characters'],
    },
    province: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Province',
      required: [true, 'Province is required'],
    },
    district: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'District',
      required: [true, 'District is required'],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

driverSchema.index({ province: 1, district: 1 });

export default mongoose.model('Driver', driverSchema);
