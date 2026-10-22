/**
 * Operational Server Bootstrap
 */

import { buildApp } from './app.js';
import { config } from './config/env.js';

async function startServer() {
  const app = buildApp();

  try {
    const address = await app.listen({ port: config.PORT, host: config.HOST });
    console.log(`Tactiron Outbound Sales Automation Engine active at: ${address}`);
    console.log(`Environment: ${config.NODE_ENV} | Kill Switch: ${config.KILL_SWITCH_ACTIVE}`);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }

  const shutdown = async (signal: string) => {
    console.log(`Received ${signal}. Shutting down gracefully...`);
    await app.close();
    process.exit(0);
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

if (process.env.NODE_ENV !== 'test') {
  startServer();
}
