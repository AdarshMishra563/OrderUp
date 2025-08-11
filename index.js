// server.js
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*' },
});


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
app.get('/api/data', (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const totalItems = 36; // Total items available (mock data)

  // Generate mock products data only
  const items = Array.from({ length: totalItems }, (_, i) => ({
    id: `${i + 1}`,
    title: ['Apple', 'Banana', 'Orange', 'Mango', 'Grapes', 'Pineapple'][i % 6],
    price: (i % 10) + 1,
    date: new Date(Date.now() - i * 86400000).toISOString().split('T')[0],
    image: `https://tse3.mm.bing.net/th/id/OIP.jTMT4dEnDSpEg2c2ZPufqwHaE5?pid=Api&P=0&h=180`,  // unique images guaranteed by &sig
    name: ['Apple', 'Banana', 'Orange', 'Mango', 'Grapes', 'Pineapple'][i % 6],
    quantity: 5 + (i % 20),
    category: ['frequently ordered', 'best seller'][i % 2]
  }));

  // Paginate the results
  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + limit;
  const paginatedItems = items.slice(startIndex, endIndex);

  setTimeout(() => {
    res.json({
      items: paginatedItems,
      currentPage: page,
      totalPages: Math.ceil(totalItems / limit),
    });
  }, 2500);
});


const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
