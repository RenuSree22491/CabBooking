import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { io, Socket } from 'socket.io-client';
import { Car, MapPin, User, LogOut, CheckCircle2, Navigation } from 'lucide-react';
import L from 'leaflet';

// Fix Leaflet icons
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const SOCKET_URL = 'http://localhost:5000';

export default function App() {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [user, setUser] = useState<any>(null);
  const [role, setRole] = useState<'rider' | 'driver'>('rider');
  const [email, setEmail] = useState('');
  
  // App State
  const [rideRequest, setRideRequest] = useState<any>(null);
  const [activeRide, setActiveRide] = useState<any>(null);
  const [driverLocation, setDriverLocation] = useState({ lat: 51.505, lng: -0.09 });

  useEffect(() => {
    const newSocket = io(SOCKET_URL);
    setSocket(newSocket);

    newSocket.on('new_ride_request', (ride) => {
      if (user?.role === 'driver' && user?.isAvailable) {
        setRideRequest(ride);
      }
    });

    newSocket.on('ride_accepted', (ride) => {
      setActiveRide(ride);
      setRideRequest(null);
    });

    newSocket.on('driver_location', (loc) => {
      setDriverLocation(loc);
    });

    return () => { newSocket.disconnect(); };
  }, [user]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('http://localhost:5000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, name: email.split('@')[0], role })
      });
      const data = await res.json();
      setUser(data);
      socket?.emit('join_room', data._id);
    } catch (err) {
      console.error(err);
    }
  };

  const requestRide = async () => {
    const pickup = { lat: 51.505, lng: -0.09, address: 'Current Location' };
    const dropoff = { lat: 51.51, lng: -0.1, address: 'Destination' };
    try {
      const res = await fetch('http://localhost:5000/api/rides/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ riderId: user._id, pickupLocation: pickup, dropoffLocation: dropoff, fare: 25.50 })
      });
      const ride = await res.json();
      setActiveRide(ride);
    } catch (err) {
      console.error(err);
    }
  };

  const acceptRide = async () => {
    if (!rideRequest) return;
    try {
      const res = await fetch(`http://localhost:5000/api/rides/${rideRequest._id}/accept`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ driverId: user._id })
      });
      const ride = await res.json();
      setActiveRide(ride);
      setRideRequest(null);
      
      // Simulate driving
      setInterval(() => {
        const newLat = 51.505 + (Math.random() * 0.001);
        const newLng = -0.09 + (Math.random() * 0.001);
        socket?.emit('driver_location_update', { driverId: user._id, lat: newLat, lng: newLng, rideId: ride._id });
        setDriverLocation({ lat: newLat, lng: newLng });
      }, 3000);
    } catch (err) {
      console.error(err);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-8">
          <div className="flex justify-center mb-6">
            <div className="bg-black text-white p-3 rounded-xl shadow-lg">
              <Car size={32} />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-center mb-8 text-gray-800">Welcome to SwiftRide</h1>
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
              <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-black outline-none" placeholder="Enter your email" />
            </div>
            <div className="flex gap-4">
              <button type="button" onClick={() => setRole('rider')} className={`flex-1 py-3 rounded-xl font-medium transition-all ${role === 'rider' ? 'bg-black text-white shadow-md' : 'bg-gray-100 text-gray-600'}`}>Rider</button>
              <button type="button" onClick={() => setRole('driver')} className={`flex-1 py-3 rounded-xl font-medium transition-all ${role === 'driver' ? 'bg-black text-white shadow-md' : 'bg-gray-100 text-gray-600'}`}>Driver</button>
            </div>
            <button type="submit" className="w-full bg-black text-white py-3.5 rounded-xl font-bold hover:bg-gray-800 transition-colors mt-6">Continue</button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col relative overflow-hidden">
      {/* Header */}
      <header className="bg-white h-16 flex items-center justify-between px-6 shadow-sm z-20 relative">
        <div className="flex items-center gap-2">
          <div className="bg-black text-white p-1.5 rounded-lg"><Car size={20} /></div>
          <h1 className="font-bold text-xl tracking-tight">SwiftRide</h1>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm font-medium bg-gray-100 px-3 py-1 rounded-full text-gray-600 capitalize">{user.role}</span>
          <button onClick={() => setUser(null)} className="text-gray-400 hover:text-red-500 transition-colors"><LogOut size={20} /></button>
        </div>
      </header>

      {/* Main Map Area */}
      <main className="flex-1 relative">
        <MapContainer center={[driverLocation.lat, driverLocation.lng]} zoom={14} className="h-full w-full z-0">
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          <Marker position={[driverLocation.lat, driverLocation.lng]}>
            <Popup>Driver Location</Popup>
          </Marker>
          <MapCenterer center={[driverLocation.lat, driverLocation.lng]} />
        </MapContainer>

        {/* Overlay Cards */}
        <div className="absolute bottom-0 left-0 right-0 p-6 z-20 pointer-events-none flex justify-center">
          <div className="w-full max-w-lg pointer-events-auto">
            {user.role === 'rider' && !activeRide && (
              <div className="bg-white rounded-3xl p-6 shadow-2xl border border-gray-100 transform transition-all translate-y-0">
                <h2 className="text-xl font-bold mb-4">Where to?</h2>
                <div className="space-y-3 mb-6">
                  <div className="flex items-center gap-3 bg-gray-50 p-3 rounded-xl">
                    <MapPin className="text-blue-500" size={20} />
                    <span className="text-gray-600 font-medium">Current Location</span>
                  </div>
                  <div className="flex items-center gap-3 bg-gray-50 p-3 rounded-xl border border-black/10">
                    <Navigation className="text-green-500" size={20} />
                    <input type="text" placeholder="Enter destination..." className="bg-transparent outline-none w-full font-medium" />
                  </div>
                </div>
                <button onClick={requestRide} className="w-full bg-black text-white py-4 rounded-xl font-bold text-lg hover:bg-gray-800 transition-colors shadow-lg flex items-center justify-center gap-2">
                  <Car size={20} /> Request SwiftRide
                </button>
              </div>
            )}

            {user.role === 'rider' && activeRide && (
              <div className="bg-white rounded-3xl p-6 shadow-2xl border border-gray-100 text-center">
                <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle2 size={32} />
                </div>
                <h2 className="text-xl font-bold mb-2">Ride {activeRide.status}</h2>
                <p className="text-gray-500 font-medium mb-4">Your driver is on the way.</p>
                <div className="bg-gray-50 p-4 rounded-xl flex justify-between items-center">
                  <span className="text-gray-600 font-medium">Estimated Fare</span>
                  <span className="font-bold text-xl">${activeRide.fare.toFixed(2)}</span>
                </div>
              </div>
            )}

            {user.role === 'driver' && rideRequest && (
              <div className="bg-white rounded-3xl p-6 shadow-2xl border-4 border-green-500 animate-pulse-slow">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold text-green-600">New Ride Request!</h2>
                  <span className="font-bold text-2xl">${rideRequest.fare.toFixed(2)}</span>
                </div>
                <div className="space-y-2 mb-6 text-gray-600 font-medium">
                  <p className="flex items-center gap-2"><MapPin size={16} /> Pickup: {rideRequest.pickupLocation.address}</p>
                  <p className="flex items-center gap-2"><Navigation size={16} /> Dropoff: {rideRequest.dropoffLocation.address}</p>
                </div>
                <div className="flex gap-4">
                  <button onClick={() => setRideRequest(null)} className="flex-1 py-4 bg-gray-100 text-gray-600 font-bold rounded-xl hover:bg-gray-200">Decline</button>
                  <button onClick={acceptRide} className="flex-[2] py-4 bg-green-500 text-white font-bold rounded-xl hover:bg-green-600 shadow-lg">Accept Ride</button>
                </div>
              </div>
            )}

            {user.role === 'driver' && activeRide && (
              <div className="bg-white rounded-3xl p-6 shadow-2xl">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold">Active Trip</h2>
                  <span className="bg-blue-100 text-blue-700 font-bold px-3 py-1 rounded-full text-sm">Navigating</span>
                </div>
                <p className="text-gray-500 font-medium mb-6">Follow the map to the destination.</p>
                <button onClick={() => setActiveRide(null)} className="w-full py-4 bg-black text-white font-bold rounded-xl">Complete Trip</button>
              </div>
            )}
            
            {user.role === 'driver' && !rideRequest && !activeRide && (
              <div className="bg-black text-white rounded-3xl p-6 shadow-2xl text-center">
                <div className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-4 animate-spin-slow">
                  <Navigation size={24} className="text-green-400" />
                </div>
                <h2 className="text-lg font-bold mb-1">You are Online</h2>
                <p className="text-white/60 text-sm">Searching for nearby riders...</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

function MapCenterer({ center }: { center: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, map.getZoom());
  }, [center, map]);
  return null;
}
