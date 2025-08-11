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
});app.get('/api/data', (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const totalItems = 36; // Total items available (mock data)

  // Movie titles and posters
  const movieData = [
    { title: 'Inception', img: 'https://m.media-amazon.com/images/I/51xJHqgK8-L._AC_SY679_.jpg' },
    { title: 'The Dark Knight', img: 'https://m.media-amazon.com/images/I/51k0qa6qg-L._AC_SY679_.jpg' },
    { title: 'Interstellar', img: 'https://m.media-amazon.com/images/I/71yAzDq0n-L._AC_SY679_.jpg' },
    { title: 'Avengers: Endgame', img: 'https://m.media-amazon.com/images/I/81ExhpBEbHL._AC_SY679_.jpg' },
    { title: 'The Matrix', img: 'https://m.media-amazon.com/images/I/51EG732BV3L.jpg' },
    { title: 'Gladiator', img: 'https://m.media-amazon.com/images/I/51A+gYtWx0L._AC_SY679_.jpg' }
  ];

  // Generate mock movie data
  const items = Array.from({ length: totalItems }, (_, i) => {
    const movie = movieData[i % movieData.length];
    return {
      id: `${i + 1}`,
      title: movie.title,
      price: (i % 10) + 1, // keeping your price field
      date: new Date(Date.now() - i * 86400000).toISOString().split('T')[0],
      image: movie.img,
      name: movie.title,
      quantity: 5 + (i % 20),
      category: ['Top Rated', 'Box Office Hit'][i % 2]
    };
  });

  // Paginate results
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
