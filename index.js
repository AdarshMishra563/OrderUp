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
  const totalItems = 36;

  // Movie titles and stable poster URLs from TMDb (poster sizes: w185 or w342)
  const movieData = [
    { title: 'Inception', img: 'https://image.tmdb.org/t/p/w185/qmDpIHrmpJINaRKAfWQfftjCdyi.jpg' },
    { title: 'The Dark Knight', img: 'https://image.tmdb.org/t/p/w185/qJ2tW6WMUDux911r6m7haRef0WH.jpg' },
    { title: 'Interstellar', img: 'https://image.tmdb.org/t/p/w185/rAiYTfKGqDCRIIqo664sY9XZIvQ.jpg' },
    { title: 'Avengers: Endgame', img: 'https://image.tmdb.org/t/p/w185/or06FN3Dka5tukK1e9sl16pB3iy.jpg' },
    { title: 'The Matrix', img: 'https://image.tmdb.org/t/p/w185/f89U3ADr1oiB1s9GkdPOEpXUk5H.jpg' },
    { title: 'Gladiator', img: 'https://image.tmdb.org/t/p/w185/ty8TGRuvJLPUmAR1H1nRIsgwvim.jpg' }
  ];

  const items = Array.from({ length: totalItems }, (_, i) => {
    const movie = movieData[i % movieData.length];
    return {
      id: `${i + 1}`,
      title: movie.title,
      price: (i % 10) + 1,
      date: new Date(Date.now() - i * 86400000).toISOString().split('T')[0],
      image: movie.img,
      name: movie.title,
      quantity: 5 + (i % 20),
      category: ['Top Rated', 'Box Office Hit'][i % 2]
    };
  });

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
