// server.js
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*' }, // Adjust CORS as needed
});

// In-memory store for delivery boys' locations
// Format: { boyId: { boyId, currentLocation: { latitude, longitude }, lastUpdated } }
const deliveryBoys = {};

io.on('connection', (socket) => {
  console.log('New client connected:', socket.id);

  // Handle initial location request
  socket.on('request-initial-location', ({ boyId }) => {
    const boy = deliveryBoys[boyId];
    if (boy) {
      socket.emit('initial-location', boy);
    } else {
      socket.emit('initial-location', null); // or send default data if you want
    }
  });

  // Handle location updates from delivery boy
  socket.on('update-location', (data) => {
    const { boyId, latitude, longitude } = data;

    if (!boyId || latitude == null || longitude == null) {
      console.warn('Invalid update-location data', data);
      return;
    }

    const updatedBoy = {
      boyId,
      currentLocation: { latitude, longitude },
      lastUpdated: new Date(),
    };

    // Save/update in memory
    deliveryBoys[boyId] = updatedBoy;

    // Broadcast updated location to all clients
    io.emit('location-update', updatedBoy);
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

// Optional: basic route for sanity check
app.get('/', (req, res) => {
  res.send('Socket.IO DeliveryBoy Location Server running (no DB)');
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
