import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { config } from './config';
import { errorHandler, notFoundHandler } from './common/middleware/error';

// Import routes
import authRoutes from './modules/auth/auth.routes';
import playersRoutes from './modules/players/players.routes';
import sessionsRoutes from './modules/sessions/sessions.routes';
import bookingsRoutes from './modules/bookings/bookings.routes';
import performanceRoutes from './modules/performance/performance.routes';
import usersRoutes from './modules/users/users.routes';

const app = express();

// Security middleware
app.use(helmet());
app.use(cors({
  origin: config.cors.origin,
  credentials: true,
}));

// Logging
if (config.isDevelopment) {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// Body parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    environment: config.nodeEnv,
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/players', playersRoutes);
app.use('/api/sessions', sessionsRoutes);
app.use('/api/bookings', bookingsRoutes);
app.use('/api/performance', performanceRoutes);
app.use('/api/users', usersRoutes);

// API documentation endpoint
app.get('/api', (req, res) => {
  res.json({
    name: 'Football Coaching Platform API',
    version: '1.0.0',
    documentation: 'See /api/docs for full API reference',
  });
});

// Error handling
app.use(notFoundHandler);
app.use(errorHandler);

export default app;
