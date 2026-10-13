// FG DRIVO Enterprise Server Configuration

export const appConfig = {
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '5000', 10),
  host: process.env.HOST || '0.0.0.0',
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  },
  simulation: {
    enabled: true,
    stepIntervalMs: 4000,
    jitterRate: 0.25,
  },
  auth: {
    demoOtp: '529481',
    otpExpiryMinutes: 5,
    tokenPrefix: 'fg_token_live_',
  },
};
