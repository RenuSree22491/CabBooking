import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
  name: string;
  email: string;
  password?: string;
  role: 'rider' | 'driver';
  location?: {
    lat: number;
    lng: number;
  };
  isAvailable: boolean;
}

const userSchema = new Schema<IUser>({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String }, // Optional for quick demo purposes
  role: { type: String, enum: ['rider', 'driver'], required: true },
  location: {
    lat: { type: Number },
    lng: { type: Number },
  },
  isAvailable: { type: Boolean, default: false }, // For drivers
}, { timestamps: true });

export default mongoose.model<IUser>('User', userSchema);
