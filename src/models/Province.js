import mongoose from 'mongoose';

const provinceSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Province name is required'],
      unique: true,
      trim: true,
      maxlength: [100, 'Name cannot exceed 100 characters'],
    },
    code: {
      type: String,
      required: [true, 'Province code is required'],
      unique: true,
      trim: true,
      uppercase: true,
      maxlength: [10, 'Code cannot exceed 10 characters'],
    },
  },
  { timestamps: true }
);

provinceSchema.index({ name: 'text' });

export default mongoose.model('Province', provinceSchema);
