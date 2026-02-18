import app from './app';
import { config } from './config';
import prisma from './database/prisma';

async function main() {
  try {
    // Test database connection
    await prisma.$connect();
    console.log('✅ Database connected');

    // Start server
    app.listen(config.port, () => {
      console.log(`
🚀 Football Coaching Platform API
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📍 Server:      http://localhost:${config.port}
🌍 Environment: ${config.nodeEnv}
📚 API Docs:    http://localhost:${config.port}/api
❤️  Health:     http://localhost:${config.port}/health
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
      `);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n🛑 Shutting down...');
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n🛑 Shutting down...');
  await prisma.$disconnect();
  process.exit(0);
});

main();
