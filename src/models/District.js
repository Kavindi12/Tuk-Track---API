import mongoose from 'mongoose';

const districtSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'District name is required'],
      trim: true,
      maxlength: [100, 'Name cannot exceed 100 characters'],
    },
    province: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Province',
      required: [true, 'Province is required'],
    },
  },
  { timestamps: true }
);

districtSchema.index({ province: 1 });
districtSchema.index({ name: 1, province: 1 }, { unique: true });

export default mongoose.model('District', districtSchema);
