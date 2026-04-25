import mongoose from 'mongoose';

const policeStationSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Station name is required'],
      trim: true,
      maxlength: [150, 'Name cannot exceed 150 characters'],
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
    contact: {
      type: String,
      trim: true,
      maxlength: [20, 'Contact cannot exceed 20 characters'],
    },
    address: {
      type: String,
      trim: true,
      maxlength: [250, 'Address cannot exceed 250 characters'],
    },
  },
  { timestamps: true }
);

policeStationSchema.index({ province: 1, district: 1 });

export default mongoose.model('PoliceStation', policeStationSchema);
