import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { config } from './config';
import { errorHandler, notFoundHandler } from './common/middleware/error';

// Import routes
import authRoutes from './modules/auth/auth.routes';
import playersRoutes from './modules/players/players.routes';
import notesRoutes from './modules/notes/notes.routes';
import sessionsRoutes from './modules/sessions/sessions.routes';
import teamsRoutes from './modules/teams/teams.routes';
import matchesRoutes from './modules/matches/matches.routes';

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
    version: '2.0.0',
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/players', playersRoutes);
app.use('/api/notes', notesRoutes);
app.use('/api/sessions', sessionsRoutes);
app.use('/api/teams', teamsRoutes);
app.use('/api/matches', matchesRoutes);

// API documentation endpoint
app.get('/api', (req, res) => {
  res.json({
    name: 'Vertex Football API',
    version: '2.0.0',
    description: 'Personal Training + Team Management Platform',
    endpoints: {
      auth: '/api/auth',
      players: '/api/players',
      notes: '/api/notes',
      sessions: '/api/sessions',
      teams: '/api/teams',
      matches: '/api/matches',
    },
  });
});

// Error handling
app.use(notFoundHandler);
app.use(errorHandler);

export default app;
