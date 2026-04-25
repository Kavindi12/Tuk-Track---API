import mongoose from 'mongoose';

const locationPingSchema = new mongoose.Schema(
  {
    vehicle: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Vehicle',
      required: [true, 'Vehicle is required'],
    },
    latitude: {
      type: Number,
      required: [true, 'Latitude is required'],
      min: [-90, 'Latitude must be >= -90'],
      max: [90, 'Latitude must be <= 90'],
    },
    longitude: {
      type: Number,
      required: [true, 'Longitude is required'],
      min: [-180, 'Longitude must be >= -180'],
      max: [180, 'Longitude must be <= 180'],
    },
    speed: {
      type: Number,
      min: [0, 'Speed cannot be negative'],
      default: 0,
    },
    heading: {
      type: Number,
      min: [0, 'Heading must be 0-360'],
      max: [360, 'Heading must be 0-360'],
    },
    // Timestamp reported by the device (may differ from server receipt time)
    timestamp: {
      type: Date,
      required: [true, 'Timestamp is required'],
    },
    // Time the server received this ping
    receivedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: false }
);

locationPingSchema.index({ vehicle: 1, timestamp: -1 });
locationPingSchema.index({ timestamp: -1 });
// TTL index: auto-delete pings older than 90 days to manage storage
locationPingSchema.index({ receivedAt: 1 }, { expireAfterSeconds: 7776000 });

export default mongoose.model('LocationPing', locationPingSchema);
