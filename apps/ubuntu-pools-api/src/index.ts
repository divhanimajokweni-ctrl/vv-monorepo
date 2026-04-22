import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Simple inline implementations for deployment
const errorHandler = (
  error: any,
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
) => {
  console.error('Error:', error);
  res.status(error.statusCode || 500).json({
    success: false,
    error: error.message || 'Internal server error',
  });
};

const requestLogger = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(
      `${new Date().toISOString()} - ${req.method} ${req.originalUrl} ${res.statusCode} - ${duration}ms`
    );
  });
  next();
};

const app = express();
const PORT = process.env.PORT || 3001;

// Security middleware
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", 'data:', 'https:'],
      },
    },
  })
);

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
});
app.use(limiter);

// CORS
app.use(
  cors({
    origin:
      process.env.NODE_ENV === 'production'
        ? ['https://your-frontend-domain.com'] // Replace with your actual domain
        : ['http://localhost:3000', 'http://localhost:3001'],
    credentials: true,
  })
);

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Compression
app.use(compression());

// Logging
app.use(requestLogger);

// Routes
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    data: {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      service: 'ubuntu-pools-api',
      version: '1.0.0',
      environment: process.env.NODE_ENV || 'development',
    },
  });
});

app.post('/api/auth/register', express.json(), (req, res) => {
  // Simple registration endpoint for deployment
  res.status(201).json({
    success: true,
    data: {
      user: { id: '1', email: req.body.email, username: req.body.username },
      tokens: {
        accessToken: 'mock-jwt-token',
        refreshToken: 'mock-refresh-token',
        expiresIn: 86400,
      },
    },
    message: 'User registered successfully',
  });
});

app.post('/api/auth/login', express.json(), (req, res) => {
  // Simple login endpoint for deployment
  res.json({
    success: true,
    data: {
      user: { id: '1', email: req.body.email },
      tokens: {
        accessToken: 'mock-jwt-token',
        refreshToken: 'mock-refresh-token',
        expiresIn: 86400,
      },
    },
    message: 'Login successful',
  });
});

app.get('/api/pools', (req, res) => {
  // Simple pools endpoint
  res.json({
    success: true,
    data: {
      pools: [
        {
          id: '1',
          name: 'Demo Pool',
          description: 'A demonstration pool',
          totalValue: '1000.00',
          memberCount: 5,
          isActive: true,
          createdAt: new Date().toISOString(),
        },
      ],
      pagination: {
        page: 1,
        limit: 10,
        total: 1,
        totalPages: 1,
      },
    },
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Route not found',
  });
});

// Error handling middleware (must be last)
app.use(errorHandler);

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Ubuntu Pools API listening on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
});

export default app;
