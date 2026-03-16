import app from './app';
import { config } from './config';

const PORT = config.port;

app.listen(PORT, () => {
  console.log(`
🚀 Vertex Football API v2.0.0
📍 Server running on port ${PORT}
🌍 Environment: ${config.nodeEnv}
⏰ Started at: ${new Date().toISOString()}
  `);
});
