# SwiftRide - Modern Cab Booking System 🚖

A fully functional, real-time Cab Booking application built with the MERN stack (React, Node.js, Express) and Socket.io. This project features two distinct interactive interfaces—one for Riders and one for Drivers—and uses real-time WebSockets to instantly connect them on a live map.

## 🌟 Key Features

*   **Dual Dashboards**: Dedicated UI for both Riders and Drivers.
*   **Real-time Ride Matching**: Instantly broadcasts ride requests to all available drivers using Socket.io.
*   **Live Location Tracking**: Watch the driver's car move smoothly across the map in real-time as they navigate to the destination.
*   **Interactive Maps**: Powered by Leaflet.js and OpenStreetMap.
*   **Modern Aesthetics**: Styled from the ground up using Tailwind CSS v4 with fluid animations, glowing components, and responsive design.

## 🛠️ Technology Stack

*   **Frontend**: React (Vite), TypeScript, Tailwind CSS, React-Leaflet, Lucide Icons.
*   **Backend**: Node.js, Express.js, TypeScript.
*   **Database**: MongoDB (configured to use an in-memory database for instant zero-config testing).
*   **Real-time Engine**: Socket.io.

## 🚀 Getting Started

This project is built to run instantly on any machine. The backend is configured to use an automated in-memory MongoDB server, meaning **you do not need to install MongoDB** locally to test it!

### 1. Start the Backend Server

```bash
cd backend
npm install
npm start
```
*The backend will automatically start on `http://localhost:5000`.*

### 2. Start the Frontend Application

Open a **new** terminal window:

```bash
cd frontend
npm install
npm run dev
```
*The React application will start on `http://localhost:5173`.*

## 🧪 How to Test Real-Time Matching

To experience the real-time WebSockets in action:
1. Open your browser to `http://localhost:5173` and log in as a **Driver**.
2. Open a **New Incognito Window** (or a different browser) and log in as a **Rider**.
3. In the Rider window, click **"Request SwiftRide"**.
4. You will instantly see a glowing popup appear in the Driver window. Click **"Accept Ride"**.
5. Watch the car icon begin to drive across the map on both screens synchronously!

## 📸 Screenshots

*(Add your screenshots here)*

---
*Built with ❤️ for rapid prototyping and modern web development.*
