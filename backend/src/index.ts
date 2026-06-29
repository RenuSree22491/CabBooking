import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import User from './models/User';
import Ride from './models/Ride';

dotenv.config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*' }
});

app.use(cors());
app.use(express.json());

// --- ROUTES ---

// Simple Login/Signup Mock for Demo
app.post('/api/auth/login', async (req, res) => {
  const { email, name, role } = req.body;
  try {
    let user = await User.findOne({ email });
    if (!user) {
      user = await User.create({ email, name, role });
    }
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: 'Auth failed' });
  }
});

// Request a ride
app.post('/api/rides/request', async (req, res) => {
  const { riderId, pickupLocation, dropoffLocation, fare } = req.body;
  try {
    const ride = await Ride.create({
      riderId, pickupLocation, dropoffLocation, fare
    });
    
    // Notify all available drivers via Socket.io
    io.emit('new_ride_request', ride);
    
    res.status(201).json(ride);
  } catch (err) {
    res.status(500).json({ error: 'Failed to request ride' });
  }
});

// Driver accepts ride
app.post('/api/rides/:id/accept', async (req, res) => {
  const { driverId } = req.body;
  try {
    const ride = await Ride.findByIdAndUpdate(
      req.params.id, 
      { driverId, status: 'accepted' },
      { new: true }
    ).populate('riderId driverId');
    
    // Notify the specific rider
    io.to(`rider_${ride?.riderId._id}`).emit('ride_accepted', ride);
    
    res.json(ride);
  } catch (err) {
    res.status(500).json({ error: 'Failed to accept ride' });
  }
});

// --- SOCKET.IO REAL-TIME ---
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('join_room', (userId) => {
    socket.join(`user_${userId}`); // Generic user room
    console.log(`Socket ${socket.id} joined room user_${userId}`);
  });

  socket.on('driver_location_update', async (data) => {
    // data: { driverId, lat, lng, rideId }
    await User.findByIdAndUpdate(data.driverId, { location: { lat: data.lat, lng: data.lng } });
    
    if (data.rideId) {
      // Forward to rider
      const ride = await Ride.findById(data.rideId);
      if (ride) {
        io.to(`user_${ride.riderId}`).emit('driver_location', { lat: data.lat, lng: data.lng });
      }
    }
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

// --- SERVER START ---
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/cabbooking';

mongoose.connect(MONGO_URI)
  .then(() => {
    console.log('Connected to MongoDB');
    server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  })
  .catch(err => console.error('MongoDB connection error:', err));
