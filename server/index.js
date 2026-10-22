// FG DRIVO Enterprise Mobility Engine
// Main Application Gateway & Real-time Server

try { process.loadEnvFile?.(); } catch (e) {}

import http from 'http';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import express from 'express';
import cors from 'cors';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const distPath = path.resolve(__dirname, '../dist');

import { appConfig } from './config/appConfig.js';
import { CITY_INFO } from './config/constants.js';
import { requestLogger } from './middleware/logger.js';
import { notFoundHandler, errorHandler } from './middleware/errorHandler.js';
import { initSocketServer } from './services/socketService.js';
import { RideSimulationService } from './services/rideSimulationService.js';

// Route imports
import authRoutes from './routes/auth.js';
import ridesRoutes from './routes/rides.js';
import walletRoutes from './routes/wallet.js';
import placesRoutes from './routes/places.js';
import safetyRoutes from './routes/safety.js';
import userRoutes from './routes/user.js';
import driversRoutes from './routes/drivers.js';
import notificationsRoutes from './routes/notifications.js';
import { db } from './db.js';

const app = express();
const httpServer = http.createServer(app);

// 1. Initialize Real-time Socket.IO Engine
const io = initSocketServer(httpServer);

// 2. Global Core Middlewares
app.use(cors(appConfig.cors));
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true, limit: '2mb' }));
app.use(requestLogger);

// 3. API Directory & Documentation Endpoint
app.get('/api/docs', (req, res) => {
  res.json({
    platform: 'FG DRIVO Mobility Enterprise Engine',
    version: '2.0.0',
    region: `${CITY_INFO.name}, ${CITY_INFO.state} (${CITY_INFO.rtoCode})`,
    socketServer: 'Online (WebSocket / Polling)',
    endpoints: {
      health: {
        'GET /api/health': 'Service uptime, memory usage, and telematics health',
      },
      auth: {
        'POST /api/auth/send-otp': 'Dispatch SMS verification OTP ({ phone })',
        'POST /api/auth/verify-otp': 'Verify phone credentials & issue session token ({ phone, otp })',
      },
      rides: {
        'GET /api/rides/estimate': 'Dynamic pricing calculation across fleet tiers (?distanceKm, ?durationMin)',
        'POST /api/rides/book': 'Dispatch ride request and initiate captain assignment',
        'GET /api/rides/active': 'Retrieve live active trip and real-time telematics',
        'POST /api/rides/advance-simulation': 'Step through lifecycle states manually',
        'POST /api/rides/cancel': 'Cancel active booking and refund hold',
        'POST /api/rides/:id/rate': 'Submit star rating and trip feedback tags',
        'GET /api/rides/history': 'Retrieve past trip logs (?status=completed|cancelled)',
        'GET /api/rides/:id/receipt': 'Generate detailed itemized GST tax invoice',
      },
      captains: {
        'GET /api/drivers/nearby': 'Fetch live GPS driver coordinates in Dindigul zone',
      },
      wallet: {
        'GET /api/wallet': 'Passenger wallet balance, cashback, and linked payment methods',
        'POST /api/wallet/topup': 'Add funds to FG DRIVO Money ({ amount })',
        'POST /api/wallet/add-card': 'Save tokenized payment card ({ cardNumber, expiry })',
      },
      places: {
        'GET /api/saved-places': 'List saved bookmarks (Home, Work, Favorites)',
        'POST /api/saved-places': 'Add new location bookmark ({ name, address, type })',
        'DELETE /api/saved-places/:id': 'Remove saved location bookmark',
      },
      safety: {
        'GET /api/safety/contacts': 'List trusted emergency contacts',
        'POST /api/safety/contacts': 'Add emergency guardian ({ name, phone, relation })',
        'DELETE /api/safety/contacts/:id': 'Delete emergency guardian',
        'POST /api/safety/sos': 'Trigger 24/7 Police (112) & guardian crisis alert',
      },
      user: {
        'GET /api/user/profile': 'Retrieve authenticated passenger profile',
        'PUT /api/user/profile': 'Update passenger name, email, or contact details',
      },
      notifications: {
        'GET /api/notifications': 'Retrieve passenger in-app notifications and promos',
        'POST /api/notifications/mark-read': 'Mark all notification alerts as read',
      },
    },
  });
});

// 4. Mount API Routes
app.use('/api/auth', authRoutes);
app.use('/api/rides', ridesRoutes);
app.use('/api/wallet', walletRoutes);
app.use('/api/saved-places', placesRoutes);
app.use('/api/safety', safetyRoutes);
app.use('/api/user', userRoutes);
app.use('/api/drivers', driversRoutes);
app.use('/api/notifications', notificationsRoutes);

// 5. System Health Check
app.get('/api/health', (req, res) => {
  const memoryUsage = process.memoryUsage();
  res.json({
    status: 'online',
    service: 'FG DRIVO Mobility Backend Engine',
    version: '2.0.0',
    region: `${CITY_INFO.name}, ${CITY_INFO.state} (${CITY_INFO.rtoCode})`,
    environment: appConfig.env,
    database: {
      provider: db.isPostgresConnected ? 'PostgreSQL (Cloud Database)' : 'Local Atomic JSON Store',
      connected: db.isPostgresConnected,
      error: db.lastPostgresError || null,
      tables: ['users', 'drivers', 'rides', 'transactions'],
    },
    socketConnectedClients: io ? io.engine.clientsCount : 0,
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.floor(process.uptime()),
    memory: {
      rssMb: Math.round(memoryUsage.rss / 1024 / 1024),
      heapUsedMb: Math.round(memoryUsage.heapUsed / 1024 / 1024),
      heapTotalMb: Math.round(memoryUsage.heapTotal / 1024 / 1024),
    },
  });
});

// 6. Static Frontend Delivery (Production SPA Serving)
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));

  // SPA Route Fallback (Express 5 Compatible)
  app.use((req, res, next) => {
    if (req.method === 'GET' && !req.path.startsWith('/api') && !req.path.startsWith('/socket.io')) {
      return res.sendFile(path.join(distPath, 'index.html'));
    }
    next();
  });
}

// 7. 404 API Route Catcher
app.use(notFoundHandler);

// 7. Centralized Error Handler
app.use(errorHandler);

// 8. Server Bootstrapping
const PORT = appConfig.port;
const HOST = appConfig.host;

httpServer.listen(PORT, HOST, () => {
  const reset = '\x1b[0m';
  const green = '\x1b[32m';
  const cyan = '\x1b[36m';
  const bold = '\x1b[1m';
  const yellow = '\x1b[33m';

  console.log(`\n${bold}${cyan}╔══════════════════════════════════════════════════════════════╗${reset}`);
  console.log(`${bold}${cyan}║          FG DRIVO MOBILITY ENTERPRISE BACKEND ENGINE         ║${reset}`);
  console.log(`${bold}${cyan}╚══════════════════════════════════════════════════════════════╝${reset}`);
  console.log(`  ${green}●${reset} HTTP Gateway:       ${bold}http://${HOST}:${PORT}${reset}`);
  console.log(`  ${green}●${reset} Health Monitor:     ${cyan}http://${HOST}:${PORT}/api/health${reset}`);
  console.log(`  ${green}●${reset} Interactive Docs:   ${cyan}http://${HOST}:${PORT}/api/docs${reset}`);
  console.log(`  ${green}●${reset} WebSocket Server:   ${yellow}ws://${HOST}:${PORT} (Socket.IO Ready)${reset}`);
  console.log(`  ${green}●${reset} Regional Boundary:  ${bold}${CITY_INFO.name}, ${CITY_INFO.state} (${CITY_INFO.rtoCode})${reset}\n`);
});

// 9. Graceful Shutdown Handlers
function handleGracefulShutdown(signal) {
  console.log(`\n\x1b[33m[Shutdown]\x1b[0m Received ${signal}. Terminating active services gracefully...`);
  RideSimulationService.stopSimulation();

  httpServer.close(() => {
    console.log('\x1b[32m[Shutdown]\x1b[0m HTTP and WebSocket server closed cleanly.');
    process.exit(0);
  });

  // Force exit after 5s timeout if lingering handles exist
  setTimeout(() => {
    console.error('\x1b[31m[Shutdown]\x1b[0m Forcefully closing after timeout.');
    process.exit(1);
  }, 5000).unref();
}

process.on('SIGINT', () => handleGracefulShutdown('SIGINT'));
process.on('SIGTERM', () => handleGracefulShutdown('SIGTERM'));

export { app, httpServer };
