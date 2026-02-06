
import express from 'express';
import cors from 'cors';
import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// ============================================
// Rate Limiter for AI Chat (In-Memory)
// ============================================
// Limits: 15 requests per minute per IP (matches Gemini free tier)
// This protects against abuse and stays within Gemini free tier limits
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 15;     // Max requests per window (Gemini free tier limit)
const rateLimitStore = new Map();       // IP -> { count, resetTime }

// Cleanup old entries every 5 minutes to prevent memory leak
setInterval(() => {
  const now = Date.now();
  for (const [ip, data] of rateLimitStore.entries()) {
    if (now > data.resetTime) {
      rateLimitStore.delete(ip);
    }
  }
}, 5 * 60 * 1000);

/**
 * Rate limiting middleware for AI chat endpoint
 */
function chatRateLimiter(req, res, next) {
  const ip = req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress || 'unknown';
  const now = Date.now();

  let record = rateLimitStore.get(ip);

  if (!record || now > record.resetTime) {
    // First request or window expired - reset
    record = { count: 1, resetTime: now + RATE_LIMIT_WINDOW_MS };
    rateLimitStore.set(ip, record);
    return next();
  }

  if (record.count >= RATE_LIMIT_MAX_REQUESTS) {
    // Too many requests
    const retryAfter = Math.ceil((record.resetTime - now) / 1000);
    res.set('Retry-After', retryAfter);
    return res.status(429).json({
      error: 'Too many requests. Please wait before sending another message.',
      retryAfterSeconds: retryAfter
    });
  }

  // Increment and allow
  record.count++;
  next();
}

// ============================================

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

// Gemini Chat Proxy (Server-Side to hide API Key)
// Rate limited: 10 requests per minute per IP
app.post('/api/chat', chatRateLimiter, async (req, res) => {
  try {
    const { contents, generationConfig } = req.body;

    // ========== INPUT VALIDATION ==========
    // 1. Validate request structure
    if (!contents || !Array.isArray(contents) || contents.length === 0) {
      return res.status(400).json({ error: 'Invalid request: contents must be a non-empty array' });
    }

    // 2. Get the last user message for validation
    const lastMessage = contents[contents.length - 1];
    const messageText = lastMessage?.parts?.[0]?.text || '';

    // 3. Check minimum length
    if (messageText.trim().length < 1) {
      return res.status(400).json({ error: 'Message cannot be empty' });
    }

    // 4. Check maximum length (1000 chars server-side, frontend limits to 500)
    if (messageText.length > 1000) {
      return res.status(400).json({ error: 'Message exceeds 1000 character limit' });
    }

    // 5. Basic sanitization (remove null bytes, control characters)
    const sanitizedContents = contents.map(msg => ({
      ...msg,
      parts: msg.parts?.map(part => ({
        ...part,
        text: part.text?.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, '') || ''
      }))
    }));
    // ========================================

    // Allow VITE_ prefix since .env is shared
    const apiKey = process.env.VITE_GEMINI_API_KEY;

    if (!apiKey) {
      console.error('GEMINI_API_KEY not found in server environment');
      return res.status(500).json({ error: 'Server configuration error: Missing API Key' });
    }

    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

    const response = await axios.post(geminiUrl, {
      contents: sanitizedContents,
      generationConfig
    }, {
      headers: {
        'Content-Type': 'application/json'
      }
    });

    res.json(response.data);

  } catch (error) {
    console.error('Gemini Chat Proxy error:', error.response?.data || error.message);
    res.status(error.response?.status || 500).json({
      error: error.response?.data?.error?.message || 'Failed to communicate with Gemini AI'
    });
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