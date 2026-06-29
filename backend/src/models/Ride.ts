import mongoose, { Schema, Document } from 'mongoose';

export interface IRide extends Document {
  riderId: mongoose.Types.ObjectId;
  driverId?: mongoose.Types.ObjectId;
  pickupLocation: { lat: number; lng: number; address: string };
  dropoffLocation: { lat: number; lng: number; address: string };
  status: 'requested' | 'accepted' | 'arrived' | 'in_progress' | 'completed' | 'cancelled';
  fare: number;
}

const rideSchema = new Schema<IRide>({
  riderId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  driverId: { type: Schema.Types.ObjectId, ref: 'User' },
  pickupLocation: {
    lat: { type: Number, required: true },
    lng: { type: Number, required: true },
    address: { type: String, required: true }
  },
  dropoffLocation: {
    lat: { type: Number, required: true },
    lng: { type: Number, required: true },
    address: { type: String, required: true }
  },
  status: { 
    type: String, 
    enum: ['requested', 'accepted', 'arrived', 'in_progress', 'completed', 'cancelled'], 
    default: 'requested' 
  },
  fare: { type: Number, required: true }
}, { timestamps: true });

export default mongoose.model<IRide>('Ride', rideSchema);
