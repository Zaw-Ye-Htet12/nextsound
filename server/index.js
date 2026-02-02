
import express from 'express';
import cors from 'cors';
import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// CORS configuration - allow multiple frontend ports during development
app.use(cors({
  origin: [
    process.env.FRONTEND_URL || 'http://localhost:5173',
    'http://localhost:5173',
    'http://localhost:5175',
    'http://localhost:5176',
    'http://localhost:5177',
    'http://localhost:5178'
  ],
  credentials: true
}));

// Parse JSON bodies
app.use(express.json());

// iTunes API proxy endpoint (No credentials needed!)
app.get('/api/itunes', async (req, res) => {
  try {
    const itunesUrl = 'https://itunes.apple.com/search';
    console.log(`Proxying iTunes request:`, req.query);

    const response = await axios.get(itunesUrl, {
      params: {
        country: 'US', // Default to US store
        media: 'music', // Default, but can be overridden
        entity: 'song', // Default, but can be overridden
        ...req.query
      },
      headers: {
        'Accept': 'application/json'
      }
    });

    res.json(response.data);
  } catch (error) {
    console.error('iTunes Proxy error:', error.message);
    res.status(500).json({ error: 'Failed to fetch from iTunes' });
  }
});

// iTunes Lookup Proxy (New)
app.get('/api/itunes/lookup', async (req, res) => {
  try {
    const itunesUrl = 'https://itunes.apple.com/lookup';
    console.log(`Proxying iTunes Lookup request:`, req.query);

    const response = await axios.get(itunesUrl, {
      params: {
        country: 'US',
        ...req.query // Passes id, entity, etc.
      },
      headers: {
        'Accept': 'application/json'
      }
    });

    res.json(response.data);
  } catch (error) {
    console.error('iTunes Lookup Proxy error:', error.message);
    res.status(500).json({ error: 'Failed to lookup from iTunes' });
  }
});

// Deezer Generic Search (Tracks) Proxy
// Must match this specific path
app.get('/api/deezer/search', async (req, res) => {
  try {
    const deezerUrl = 'https://api.deezer.com/search';
    console.log(`Proxying Deezer Search request:`, req.query);

    const response = await axios.get(deezerUrl, {
      params: {
        q: req.query.q,
        limit: req.query.limit || 10
      },
      headers: {
        'Accept': 'application/json'
      }
    });

    res.json(response.data);
  } catch (error) {
    console.error('Deezer Search Proxy error:', error.message);
    res.status(500).json({ error: 'Failed to fetch from Deezer Search' });
  }
});

// Deezer Artists by Genre Proxy
app.get('/api/deezer/genre/:id/artists', async (req, res) => {
  try {
    const genreId = req.params.id;
    const deezerUrl = `https://api.deezer.com/genre/${genreId}/artists`;
    console.log(`Proxying Deezer Genre Artists request:`, genreId);

    const response = await axios.get(deezerUrl, {
      params: {
        limit: req.query.limit || 50
      },
      headers: {
        'Accept': 'application/json'
      }
    });

    res.json(response.data);
  } catch (error) {
    console.error('Deezer Genre Proxy error:', error.message);
    res.status(500).json({ error: 'Failed to fetch artists by genre' });
  }
});

// Deezer Artist Details Proxy
app.get('/api/deezer/artist/:id', async (req, res) => {
  try {
    const artistId = req.params.id;
    const deezerUrl = `https://api.deezer.com/artist/${artistId}`;
    console.log(`Proxying Deezer Artist Details request:`, artistId);

    const response = await axios.get(deezerUrl, { headers: { 'Accept': 'application/json' } });
    res.json(response.data);
  } catch (error) {
    console.error('Deezer Artist Details Proxy error:', error.message);
    res.status(500).json({ error: 'Failed to fetch artist details' });
  }
});

// Deezer Artist Top Tracks Proxy
app.get('/api/deezer/artist/:id/top', async (req, res) => {
  try {
    const artistId = req.params.id;
    const deezerUrl = `https://api.deezer.com/artist/${artistId}/top`;
    console.log(`Proxying Deezer Artist Top Tracks request:`, artistId);

    const response = await axios.get(deezerUrl, {
      params: { limit: req.query.limit || 50 },
      headers: { 'Accept': 'application/json' }
    });
    res.json(response.data);
  } catch (error) {
    console.error('Deezer Artist Top Tracks Proxy error:', error.message);
    res.status(500).json({ error: 'Failed to fetch artist top tracks' });
  }
});

// Deezer Artist Albums Proxy
app.get('/api/deezer/artist/:id/albums', async (req, res) => {
  try {
    const artistId = req.params.id;
    const deezerUrl = `https://api.deezer.com/artist/${artistId}/albums`;
    console.log(`Proxying Deezer Artist Albums request:`, artistId);

    const response = await axios.get(deezerUrl, {
      params: { limit: req.query.limit || 50 },
      headers: { 'Accept': 'application/json' }
    });
    res.json(response.data);
  } catch (error) {
    console.error('Deezer Artist Albums Proxy error:', error.message);
    res.status(500).json({ error: 'Failed to fetch artist albums' });
  }
});

// Deezer Album Details Proxy
app.get('/api/deezer/album/:id', async (req, res) => {
  try {
    const albumId = req.params.id;
    const deezerUrl = `https://api.deezer.com/album/${albumId}`;
    console.log(`Proxying Deezer Album Details request:`, albumId);

    const response = await axios.get(deezerUrl, { headers: { 'Accept': 'application/json' } });
    res.json(response.data);
  } catch (error) {
    console.error('Deezer Album Details Proxy error:', error.message);
    res.status(500).json({ error: 'Failed to fetch album details' });
  }
});

// Deezer API proxy endpoint (Artist Search)
app.get('/api/deezer', async (req, res) => {
  try {
    const deezerUrl = 'https://api.deezer.com/search/artist';
    console.log(`Proxying Deezer request:`, req.query);

    const response = await axios.get(deezerUrl, {
      params: {
        q: req.query.q,
        limit: req.query.limit || 10
      },
      headers: {
        'Accept': 'application/json'
      }
    });

    res.json(response.data);
  } catch (error) {
    console.error('Deezer Proxy error:', error.message);
    res.status(500).json({ error: 'Failed to fetch from Deezer' });
  }
});

// 404 handler
app.use((req, res, next) => {
  // Check if we already sent a response (e.g. from previous routes), though app.use shouldn't be reached if res.json() was called.
  // But just in case.
  res.status(404).json({
    error: {
      status: 404,
      message: 'Endpoint not found'
    }
  });
});

// Catch-all error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    error: {
      status: 500,
      message: 'Internal server error'
    }
  });
});

// Start server if running directly
if (process.argv[1] === new URL(import.meta.url).pathname || process.argv[1].endsWith('index.js')) {
  app.listen(PORT, () => {
    console.log(`🚀 Music Proxy Server running on port ${PORT}`);
    console.log(`📡 Health check: http://localhost:${PORT}/health`);
    console.log(`🎵 iTunes endpoint: http://localhost:${PORT}/api/itunes`);
    console.log(`🎵 Deezer endpoint: http://localhost:${PORT}/api/deezer`);
  });
}

export default app;

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  process.exit(0);
});