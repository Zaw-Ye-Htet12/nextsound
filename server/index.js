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
app.use('/api/itunes', async (req, res) => {
  try {
    const itunesUrl = 'https://itunes.apple.com/search';
    console.log(`Proxying iTunes request:`, req.query);

    const response = await axios.get(itunesUrl, {
      params: {
        ...req.query,
        country: 'US', // Default to US store
        media: 'music',
        entity: 'song'
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

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: {
      status: 404,
      message: 'Endpoint not found'
    }
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Music Proxy Server running on port ${PORT}`);
  console.log(`📡 Health check: http://localhost:${PORT}/health`);
  console.log(`🎵 iTunes endpoint: http://localhost:${PORT}/api/itunes`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  process.exit(0);
});