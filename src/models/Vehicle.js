import mongoose from 'mongoose';

const vehicleSchema = new mongoose.Schema(
  {
    registrationNumber: {
      type: String,
      required: [true, 'Registration number is required'],
      unique: true,
      trim: true,
      uppercase: true,
      maxlength: [20, 'Registration number cannot exceed 20 characters'],
    },
    ownerName: {
      type: String,
      required: [true, 'Owner name is required'],
      trim: true,
      maxlength: [150, 'Owner name cannot exceed 150 characters'],
    },
    ownerContact: {
      type: String,
      trim: true,
      maxlength: [20, 'Contact cannot exceed 20 characters'],
    },
    ownerNIC: {
      type: String,
      trim: true,
      maxlength: [20, 'NIC cannot exceed 20 characters'],
    },
    driver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Driver',
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
    status: {
      type: String,
      enum: ['active', 'suspended', 'flagged'],
      default: 'active',
    },
    // Device user account linked to this vehicle
    deviceUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    notes: {
      type: String,
      trim: true,
      maxlength: [500, 'Notes cannot exceed 500 characters'],
    },
  },
  { timestamps: true }
);

vehicleSchema.index({ province: 1, district: 1 });
vehicleSchema.index({ status: 1 });
vehicleSchema.index({ registrationNumber: 'text', ownerName: 'text' });

export default mongoose.model('Vehicle', vehicleSchema);
