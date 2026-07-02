import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*' }
});

app.use(cors());
app.use(express.json());

// --- IN-MEMORY DATABASE ---
let users: any[] = [];
let rides: any[] = [];
let nextId = 1;

// --- ROUTES ---

// Simple Login/Signup Mock for Demo
app.post('/api/auth/login', (req, res) => {
  const { email, name, role } = req.body;
  try {
    let user = users.find(u => u.email === email);
    if (!user) {
      user = { 
        _id: String(nextId++), 
        email, 
        name, 
        role, 
        isAvailable: role === 'driver',
        location: role === 'driver' ? { lat: 51.505, lng: -0.09 } : null
      };
      users.push(user);
    }
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: 'Auth failed' });
  }
});

// Request a ride
app.post('/api/rides/request', (req, res) => {
  const { riderId, pickupLocation, dropoffLocation, fare } = req.body;
  try {
    const ride = {
      _id: String(nextId++),
      riderId, pickupLocation, dropoffLocation, fare,
      status: 'requested',
      driverId: null
    };
    rides.push(ride);
    
    // Notify all available drivers via Socket.io
    io.emit('new_ride_request', ride);
    
    res.status(201).json(ride);
  } catch (err) {
    res.status(500).json({ error: 'Failed to request ride' });
  }
});

// Driver accepts ride
app.post('/api/rides/:id/accept', (req, res) => {
  const { driverId } = req.body;
  try {
    const rideIndex = rides.findIndex(r => r._id === req.params.id);
    if (rideIndex !== -1) {
      rides[rideIndex].driverId = driverId;
      rides[rideIndex].status = 'accepted';
      
      // Notify the specific rider
      io.to(`user_${rides[rideIndex].riderId}`).emit('ride_accepted', rides[rideIndex]);
      res.json(rides[rideIndex]);
    } else {
      res.status(404).json({ error: 'Ride not found' });
    }
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

  socket.on('driver_location_update', (data) => {
    // data: { driverId, lat, lng, rideId, isIdle }
    const userIndex = users.findIndex(u => u._id === data.driverId);
    if (userIndex !== -1) {
      users[userIndex].location = { lat: data.lat, lng: data.lng };
    }
    
    if (data.rideId && !data.isIdle) {
      // Forward to specific rider if in active ride
      const ride = rides.find(r => r._id === data.rideId);
      if (ride) {
        io.to(`user_${ride.riderId}`).emit('driver_location', { lat: data.lat, lng: data.lng });
      }
    } else {
      // Broadcast to all riders as nearby drivers
      const availableDrivers = users.filter(u => u.role === 'driver' && u.isAvailable && u.location);
      io.emit('nearby_drivers', availableDrivers);
    }
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

// --- SERVER START ---
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT} (Using In-Memory Array DB)`));
