import dotenv from 'dotenv';

dotenv.config();

export const config = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '3001', 10),
  
  jwt: {
    secret: process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production',
    expiresIn: '7d',
  },
  
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  },
  
  email: {
    resendApiKey: process.env.RESEND_API_KEY,
    fromEmail: 'noreply@vertex-football.com',
  },
  
  get isDevelopment() {
    return this.nodeEnv === 'development';
  },
  
  get isProduction() {
    return this.nodeEnv === 'production';
  },
};
