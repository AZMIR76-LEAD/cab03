// FG DRIVO Enterprise Atomic Persistence & State Engine
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import pg from 'pg';
const { Pool } = pg;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.join(__dirname, 'data');
const DB_FILE = path.join(DATA_DIR, 'database.json');

// Pristine Seed Dataset customized for Dindigul, Tamil Nadu (TN 57)
export const initialSeedData = {
  user: {
    id: "USR-0001",
    name: "Passenger",
    greetingName: "Passenger",
    phone: "",
    email: "passenger@fgdrivo.com",
    rating: 5.0,
    memberSince: "October 2026",
    totalRides: 0,
    avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80",
    goldTier: false,
  },
  activeRide: null,
  drivers: [
    {
      id: "DRV-8821",
      name: "Arjun Verma",
      rating: 4.92,
      tripsCount: 2420,
      phone: "+91 98112 34567",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80",
      vehicle: {
        model: "Honda City • Midnight Black",
        category: "sedan",
        licensePlate: "TN 57 CE 4819",
        color: "Midnight Black",
      },
      coords: { x: 48, y: 62 },
      heading: 135,
      status: "available",
    },
    {
      id: "DRV-5104",
      name: "Vikram Rathore",
      rating: 4.96,
      tripsCount: 3180,
      phone: "+91 98220 99112",
      avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=150&q=80",
      vehicle: {
        model: "Hyundai Verna • Polar White",
        category: "sedan",
        licensePlate: "TN 57 MJ 3321",
        color: "Polar White",
      },
      coords: { x: 34, y: 64 },
      heading: 45,
      status: "available",
    },
    {
      id: "DRV-3310",
      name: "Suresh Pandian",
      rating: 4.88,
      tripsCount: 1420,
      phone: "+91 97410 44556",
      avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=150&q=80",
      vehicle: {
        model: "Maruti Swift • Silky Silver",
        category: "mini",
        licensePlate: "TN 57 AB 8912",
        color: "Silky Silver",
      },
      coords: { x: 44, y: 76 },
      heading: 120,
      status: "available",
    },
    {
      id: "DRV-9012",
      name: "Mohammed Farooq",
      rating: 4.94,
      tripsCount: 4210,
      phone: "+91 98860 12345",
      avatar: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=150&q=80",
      vehicle: {
        model: "Toyota Innova Crysta • Bronze",
        category: "suv",
        licensePlate: "TN 57 EQ 7780",
        color: "Bronze Mica",
      },
      coords: { x: 52, y: 55 },
      heading: -30,
      status: "available",
    },
  ],
  rides: [],
  wallet: {
    balance: 0.0,
    currency: "₹",
    cashbackEarned: 0.0,
    paymentMethods: [
      {
        id: "pm-upi",
        type: "UPI",
        title: "Google Pay / PhonePe UPI",
        detail: "Instant UPI Transfer",
        isPrimary: true,
        icon: "smartphone",
      },
      {
        id: "pm-card",
        type: "CARD",
        title: "Credit or Debit Card",
        detail: "Visa, Mastercard, RuPay",
        isPrimary: false,
        icon: "credit-card",
      },
      {
        id: "pm-wallet",
        type: "WALLET",
        title: "FG DRIVO Money",
        detail: "Balance: ₹0.00",
        isPrimary: false,
        icon: "wallet",
      },
      {
        id: "pm-cash",
        type: "CASH",
        title: "Cash on Arrival",
        detail: "Pay driver directly via cash or QR",
        isPrimary: false,
        icon: "banknote",
      },
    ],
    transactions: [],
  },
  savedPlaces: [
    {
      id: "home",
      type: "home",
      name: "Home",
      address: "No. 42, GTN Salai, Near St. Joseph College, Dindigul",
      coords: { x: 38, y: 72 },
    },
    {
      id: "work",
      type: "work",
      name: "Work",
      address: "Technology Park, Palani Road Bypass, Dindigul",
      coords: { x: 74, y: 32 },
    },
    {
      id: "fav-1",
      type: "favorite",
      name: "Dindigul Railway Station",
      address: "Station Road, Railway Colony, Dindigul 624001",
      coords: { x: 55, y: 48 },
    },
  ],
  emergencyContacts: [
    {
      id: "em-1",
      name: "Zoya Khan",
      relation: "Sister",
      phone: "+91 98450 11223",
      shareLive: true,
    },
    {
      id: "em-2",
      name: "Tariq Mahmood",
      relation: "Brother",
      phone: "+91 97412 88990",
      shareLive: true,
    },
  ],
  notifications: [
    {
      id: "notif-1",
      category: "ride",
      title: "Driver is 2 minutes away",
      desc: "Arjun Verma in Honda City (TN 57 CE 4819) has reached your pickup corner.",
      time: "2m ago",
      unread: true,
    },
    {
      id: "notif-2",
      category: "payment",
      title: "Payment of ₹284 Successful",
      desc: "Receipt for trip #RX-99410 has been sent to ashfar.khan@fgdrivo.com.",
      time: "3h ago",
      unread: true,
    },
    {
      id: "notif-3",
      category: "promo",
      title: "30% OFF Weekend Getaways",
      desc: "Use coupon code DRIVO30 on your next Sirumalai or Palani trip.",
      time: "1d ago",
      unread: false,
    },
  ],
};

class DatabaseManager {
  constructor() {
    this.data = initialSeedData;
    this.pgPool = null;
    this.isPostgresConnected = false;
    this.lastPostgresError = null;
    this.init();
    this.initPostgres().catch(() => {});
  }

  async initPostgres() {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
      this.lastPostgresError = 'DATABASE_URL environment variable is not set on Render.';
      console.log('\x1b[36m[DB Engine]\x1b[0m Running on local persistent atomic JSON store (DATABASE_URL not set).');
      return;
    }

    try {
      this.pgPool = new Pool({
        connectionString,
        ssl: connectionString.includes('localhost') ? false : { rejectUnauthorized: false },
        max: 10,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 10000,
      });

      const client = await this.pgPool.connect();
      this.isPostgresConnected = true;
      console.log('\x1b[32m[PostgreSQL Engine]\x1b[0m Successfully connected to cloud PostgreSQL database.');

      // 1. Create Core Production Tables according to Phase 2 specification
      await client.query(`
        CREATE TABLE IF NOT EXISTS users (
          id VARCHAR(64) PRIMARY KEY,
          phone VARCHAR(32) UNIQUE NOT NULL,
          name VARCHAR(128),
          greeting_name VARCHAR(64),
          email VARCHAR(128),
          rating NUMERIC(3,2) DEFAULT 5.0,
          wallet_balance NUMERIC(10,2) DEFAULT 0.00,
          total_rides INT DEFAULT 0,
          avatar TEXT,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );

        ALTER TABLE users ALTER COLUMN wallet_balance SET DEFAULT 0.00;

        CREATE TABLE IF NOT EXISTS drivers (
          id VARCHAR(64) PRIMARY KEY,
          name VARCHAR(128) NOT NULL,
          phone VARCHAR(32),
          vehicle_model VARCHAR(128),
          license_plate VARCHAR(32),
          lat NUMERIC(10,6),
          lng NUMERIC(10,6),
          is_online BOOLEAN DEFAULT true,
          rating NUMERIC(3,2) DEFAULT 5.0,
          trips_count INT DEFAULT 0,
          avatar TEXT,
          vehicle_category VARCHAR(32),
          vehicle_color VARCHAR(64),
          heading INT DEFAULT 0,
          status VARCHAR(32) DEFAULT 'available',
          coords JSONB,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS rides (
          id VARCHAR(64) PRIMARY KEY,
          user_id VARCHAR(64),
          driver_id VARCHAR(64),
          pickup_name TEXT NOT NULL,
          pickup_coords JSONB,
          drop_name TEXT NOT NULL,
          drop_coords JSONB,
          fare NUMERIC(10,2) NOT NULL,
          status VARCHAR(32) DEFAULT 'requested',
          payment_method VARCHAR(64) DEFAULT 'Cash',
          otp VARCHAR(16),
          distance VARCHAR(32),
          duration VARCHAR(32),
          category VARCHAR(64),
          driver_name VARCHAR(128),
          vehicle_info VARCHAR(128),
          rating_given INT,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS transactions (
          id VARCHAR(64) PRIMARY KEY,
          user_id VARCHAR(64),
          ride_id VARCHAR(64),
          amount NUMERIC(10,2) NOT NULL,
          type VARCHAR(32) NOT NULL,
          gateway_ref VARCHAR(128),
          status VARCHAR(32) DEFAULT 'completed',
          title TEXT,
          description TEXT,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );

        CREATE INDEX IF NOT EXISTS idx_rides_user_id ON rides(user_id);
        CREATE INDEX IF NOT EXISTS idx_rides_status ON rides(status);
        CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);
        CREATE INDEX IF NOT EXISTS idx_drivers_online ON drivers(is_online);
      `);

      // 2. Automatically purge demo mock user and mock history from Supabase
      await client.query(`
        DELETE FROM users 
        WHERE id = 'USR-1001' 
           OR phone = '+91 98765 43210' 
           OR name = 'Ashfar Khan';

        DELETE FROM rides 
        WHERE user_id = 'USR-1001' 
           OR user_id IS NULL;

        DELETE FROM transactions 
        WHERE user_id = 'USR-1001' 
           OR user_id IS NULL;
      `);

      client.release();

      // 3. Synchronize PostgreSQL state with in-memory cache
      await this.syncFromPostgres();
    } catch (err) {
      this.isPostgresConnected = false;
      this.lastPostgresError = err.message;
      console.warn('\x1b[33m[PostgreSQL Engine]\x1b[0m Connection notice (falling back to atomic JSON store):', err.message);
    }
  }

  async getUserFromReq(req) {
    try {
      const authHeader = req?.headers?.authorization || '';
      if (authHeader.startsWith('Bearer ')) {
        const token = authHeader.slice(7).trim();
        if (token.startsWith('fg_token_live_')) {
          const payload = token.replace('fg_token_live_', '');
          const decoded = Buffer.from(payload, 'base64').toString('utf-8');
          const phone = decoded.split('_')[0];
          if (phone) {
            const rawDigits = phone.replace(/[^0-9]/g, '');
            const tenDigits = rawDigits.slice(-10);
            if (this.pgPool && this.isPostgresConnected) {
              const res = await this.pgPool.query(
                `SELECT * FROM users WHERE phone = $1 OR RIGHT(REGEXP_REPLACE(phone, '[^0-9]', '', 'g'), 10) = $2 LIMIT 1`,
                [phone, tenDigits]
              );
              if (res.rows.length > 0) {
                const row = res.rows[0];
                return {
                  id: row.id,
                  phone: row.phone,
                  name: row.name || 'Passenger',
                  greetingName: row.greeting_name || row.name?.split(' ')[0] || 'Passenger',
                  email: row.email,
                  rating: parseFloat(row.rating) || 5.0,
                  walletBalance: parseFloat(row.wallet_balance) || 0.0,
                  totalRides: row.total_rides || 0,
                  avatar: row.avatar,
                };
              }
            }
          }
        }
      }
    } catch (e) {}
    return this.data.user || null;
  }

  async findUserByPhone(phone) {
    if (!phone) return null;
    const cleanPhone = phone.trim();
    const rawDigits = cleanPhone.replace(/[^0-9]/g, '');
    const tenDigits = rawDigits.slice(-10);

    if (this.pgPool && this.isPostgresConnected) {
      try {
        const res = await this.pgPool.query(
          `SELECT * FROM users WHERE phone = $1 OR RIGHT(REGEXP_REPLACE(phone, '[^0-9]', '', 'g'), 10) = $2 LIMIT 1`,
          [cleanPhone, tenDigits]
        );
        if (res.rows.length > 0) {
          const row = res.rows[0];
          return {
            id: row.id,
            phone: row.phone,
            name: row.name || 'Passenger',
            greetingName: row.greeting_name || row.name?.split(' ')[0] || 'Passenger',
            email: row.email,
            rating: parseFloat(row.rating) || 5.0,
            walletBalance: parseFloat(row.wallet_balance) || 0.0,
            totalRides: row.total_rides || 0,
            avatar: row.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80',
          };
        }
        return null;
      } catch (err) {
        console.warn('[PostgreSQL Engine] findUserByPhone error:', err.message);
      }
    }

    const localUser = this.data.user;
    if (localUser && localUser.phone) {
      const localDigits = localUser.phone.replace(/[^0-9]/g, '').slice(-10);
      if (localDigits === tenDigits && localUser.name && localUser.name !== 'Passenger') {
        return localUser;
      }
    }
    return null;
  }

  async createUser({ phone, name, email }) {
    const cleanPhone = phone.trim();
    const cleanName = (name || '').trim();
    const cleanEmail = (email || '').trim();
    const newId = `USR-${Math.floor(1000 + Math.random() * 9000)}`;
    const userName = cleanName || 'Customer';
    const greetingName = userName.split(' ')[0];
    const userEmail = cleanEmail || `${userName.toLowerCase().replace(/[^a-z0-9]/g, '')}@fgdrivo.com`;

    if (this.pgPool && this.isPostgresConnected) {
      try {
        await this.pgPool.query(
          `INSERT INTO users (id, phone, name, greeting_name, email, rating, wallet_balance, total_rides, avatar)
           VALUES ($1, $2, $3, $4, $5, 5.0, 0.00, 0, $6)`,
          [newId, cleanPhone, userName, greetingName, userEmail, 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80']
        );
      } catch (err) {
        console.warn('[PostgreSQL Engine] createUser error:', err.message);
      }
    }

    const newUser = {
      id: newId,
      phone: cleanPhone,
      name: userName,
      greetingName,
      email: userEmail,
      rating: 5.0,
      walletBalance: 0.0,
      totalRides: 0,
      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80',
    };
    this.set('user', newUser);
    this.set('rides', []);
    if (this.data.wallet) {
      this.data.wallet.balance = 0.0;
      this.data.wallet.transactions = [];
    }
    return newUser;
  }

  async findOrCreateUser({ phone, name, email }) {
    if (!phone) return this.data.user;
    const cleanPhone = phone.trim();
    const cleanName = (name || '').trim();
    const cleanEmail = (email || '').trim();
    const rawDigits = cleanPhone.replace(/[^0-9]/g, '');
    const tenDigits = rawDigits.slice(-10);

    if (this.pgPool && this.isPostgresConnected) {
      try {
        const res = await this.pgPool.query(
          `SELECT * FROM users WHERE phone = $1 OR RIGHT(REGEXP_REPLACE(phone, '[^0-9]', '', 'g'), 10) = $2 LIMIT 1`,
          [cleanPhone, tenDigits]
        );
        if (res.rows.length > 0) {
          const row = res.rows[0];
          let updatedName = row.name;
          let updatedGreeting = row.greeting_name;
          if (cleanName && (!row.name || row.name === 'Passenger' || row.name === 'Ashfar Khan' || row.name === 'User')) {
            updatedName = cleanName;
            updatedGreeting = cleanName.split(' ')[0];
            await this.pgPool.query(
              'UPDATE users SET name = $1, greeting_name = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $3',
              [updatedName, updatedGreeting, row.id]
            );
          }
          const userObj = {
            id: row.id,
            phone: row.phone,
            name: updatedName || 'Passenger',
            greetingName: updatedGreeting || 'Passenger',
            email: row.email || (cleanEmail || `${(updatedName || 'user').toLowerCase().replace(/[^a-z0-9]/g, '')}@fgdrivo.com`),
            rating: parseFloat(row.rating) || 5.0,
            walletBalance: parseFloat(row.wallet_balance) || 0.0,
            totalRides: row.total_rides || 0,
            avatar: row.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80',
          };
          this.set('user', userObj);
          return userObj;
        } else {
          // Create real user in Supabase with 0.00 balance
          const newId = `USR-${Math.floor(1000 + Math.random() * 9000)}`;
          const userName = cleanName || 'Passenger';
          const greetingName = userName.split(' ')[0];
          const userEmail = cleanEmail || `${userName.toLowerCase().replace(/[^a-z0-9]/g, '')}@fgdrivo.com`;

          await this.pgPool.query(
            `INSERT INTO users (id, phone, name, greeting_name, email, rating, wallet_balance, total_rides, avatar)
             VALUES ($1, $2, $3, $4, $5, 5.0, 0.00, 0, $6)`,
            [newId, cleanPhone, userName, greetingName, userEmail, 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80']
          );

          const newUser = {
            id: newId,
            phone: cleanPhone,
            name: userName,
            greetingName,
            email: userEmail,
            rating: 5.0,
            walletBalance: 0.0,
            totalRides: 0,
            avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80',
          };
          this.set('user', newUser);
          return newUser;
        }
      } catch (err) {
        console.warn('[PostgreSQL Engine] findOrCreateUser error:', err.message);
      }
    }

    // Local in-memory / JSON fallback
    const newId = `USR-${Math.floor(1000 + Math.random() * 9000)}`;
    const userName = cleanName || 'Passenger';
    const fallbackUser = {
      id: newId,
      phone: cleanPhone,
      name: userName,
      greetingName: userName.split(' ')[0],
      email: cleanEmail || `${userName.toLowerCase().replace(/[^a-z0-9]/g, '')}@fgdrivo.com`,
      rating: 5.0,
      walletBalance: 0.0,
      totalRides: 0,
      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80',
    };
    this.set('user', fallbackUser);
    return fallbackUser;
  }

  async syncFromPostgres() {
    if (!this.pgPool || !this.isPostgresConnected) return;
    try {
      // Load real user (excluding demo mock user)
      const userRes = await this.pgPool.query(
        `SELECT * FROM users 
         WHERE phone != '+91 98765 43210' 
           AND name != 'Ashfar Khan' 
         ORDER BY updated_at DESC LIMIT 1`
      );

      if (userRes.rows.length > 0) {
        const userRow = userRes.rows[0];
        this.data.user = {
          id: userRow.id,
          phone: userRow.phone,
          name: userRow.name || 'Passenger',
          greetingName: userRow.greeting_name || userRow.name?.split(' ')[0] || 'Passenger',
          email: userRow.email || 'passenger@fgdrivo.com',
          rating: parseFloat(userRow.rating) || 5.0,
          walletBalance: parseFloat(userRow.wallet_balance) || 0.0,
          totalRides: userRow.total_rides || 0,
          avatar: userRow.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80',
        };
        if (this.data.wallet) {
          this.data.wallet.balance = parseFloat(userRow.wallet_balance) || this.data.wallet.balance;
        }
      }

      // Load drivers
      const driversRes = await this.pgPool.query('SELECT * FROM drivers');
      if (driversRes.rows.length > 0) {
        this.data.drivers = driversRes.rows.map(row => ({
          id: row.id,
          name: row.name,
          phone: row.phone,
          rating: parseFloat(row.rating) || 5.0,
          tripsCount: row.trips_count || 0,
          avatar: row.avatar,
          vehicle: {
            model: row.vehicle_model,
            category: row.vehicle_category || 'sedan',
            licensePlate: row.license_plate,
            color: row.vehicle_color || 'White',
          },
          coords: row.coords || { x: parseFloat(row.lng) || 50, y: parseFloat(row.lat) || 50 },
          heading: row.heading || 0,
          status: row.status || 'available',
          isOnline: row.is_online,
        }));
      }

      // Load rides
      const ridesRes = await this.pgPool.query('SELECT * FROM rides ORDER BY created_at DESC LIMIT 50');
      if (ridesRes.rows.length > 0) {
        this.data.rides = ridesRes.rows.map(row => ({
          id: row.id,
          date: new Date(row.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
          status: row.status,
          category: row.category || 'FG DRIVO Sedan',
          pickup: row.pickup_name,
          pickupCoords: row.pickup_coords,
          destination: row.drop_name,
          destinationCoords: row.drop_coords,
          fare: parseFloat(row.fare),
          distance: row.distance || '5.0 km',
          duration: row.duration || '15 mins',
          driver: row.driver_name,
          vehicle: row.vehicle_info,
          ratingGiven: row.rating_given,
          paymentMethod: row.payment_method,
        }));
      }

      // Load transactions
      const txRes = await this.pgPool.query('SELECT * FROM transactions ORDER BY created_at DESC LIMIT 50');
      if (txRes.rows.length > 0 && this.data.wallet) {
        this.data.wallet.transactions = txRes.rows.map(row => ({
          id: row.id,
          title: row.title || row.description || 'Transaction',
          date: new Date(row.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }),
          amount: parseFloat(row.amount),
          type: row.type,
          status: row.status,
          gatewayRef: row.gateway_ref,
        }));
      }

      console.log('\x1b[32m[PostgreSQL Engine]\x1b[0m State synchronized from cloud database.');
    } catch (err) {
      console.warn('\x1b[33m[PostgreSQL Engine]\x1b[0m Sync warning:', err.message);
    }
  }

  async seedPostgresFromLocal() {
    if (!this.pgPool || !this.isPostgresConnected) return;
    try {
      const u = this.data.user || initialSeedData.user;
      await this.pgPool.query(
        `INSERT INTO users (id, phone, name, greeting_name, email, rating, wallet_balance, total_rides, avatar)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
         ON CONFLICT (id) DO UPDATE SET
           name = EXCLUDED.name,
           phone = EXCLUDED.phone,
           greeting_name = EXCLUDED.greeting_name,
           email = EXCLUDED.email,
           wallet_balance = EXCLUDED.wallet_balance`,
        [u.id, u.phone || '+91 98765 43210', u.name, u.greetingName || u.name, u.email, u.rating || 5.0, (this.data.wallet && this.data.wallet.balance) || 250, u.totalRides || 0, u.avatar]
      );

      // Seed drivers
      const drivers = this.data.drivers || initialSeedData.drivers || [];
      for (const d of drivers) {
        await this.pgPool.query(
          `INSERT INTO drivers (id, name, phone, vehicle_model, license_plate, lat, lng, is_online, rating, trips_count, avatar, vehicle_category, vehicle_color, coords, status)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
           ON CONFLICT (id) DO NOTHING`,
          [
            d.id,
            d.name,
            d.phone,
            d.vehicle?.model || 'Sedan',
            d.vehicle?.licensePlate || 'TN 57 AA 0001',
            d.coords?.y || 10.3644,
            d.coords?.x || 77.9702,
            true,
            d.rating || 5.0,
            d.tripsCount || 0,
            d.avatar,
            d.vehicle?.category || 'sedan',
            d.vehicle?.color || 'White',
            JSON.stringify(d.coords || {}),
            d.status || 'available'
          ]
        );
      }

      // Seed rides
      const rides = this.data.rides || initialSeedData.rides || [];
      for (const r of rides) {
        await this.pgPool.query(
          `INSERT INTO rides (id, user_id, driver_id, pickup_name, pickup_coords, drop_name, drop_coords, fare, status, payment_method, distance, duration, driver_name, vehicle_info, rating_given)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
           ON CONFLICT (id) DO NOTHING`,
          [
            r.id,
            u.id,
            r.driverId || null,
            r.pickup || 'Pickup Location',
            JSON.stringify(r.pickupCoords || { x: 38, y: 72 }),
            r.destination || 'Destination Location',
            JSON.stringify(r.destinationCoords || { x: 74, y: 32 }),
            r.fare || 0,
            r.status || 'Completed',
            r.paymentMethod || 'UPI',
            r.distance || '5.0 km',
            r.duration || '15 mins',
            r.driver || 'Driver',
            r.vehicle || 'Vehicle',
            r.ratingGiven || null
          ]
        );
      }

      // Seed transactions
      const txns = (this.data.wallet && this.data.wallet.transactions) || [];
      for (const tx of txns) {
        await this.pgPool.query(
          `INSERT INTO transactions (id, user_id, amount, type, gateway_ref, status, title)
           VALUES ($1, $2, $3, $4, $5, $6, $7)
           ON CONFLICT (id) DO NOTHING`,
          [tx.id, u.id, tx.amount, tx.type || 'credit', tx.gatewayRef || 'REF-INIT', tx.status || 'Successful', tx.title || 'Transaction']
        );
      }

      console.log(`\x1b[32m[PostgreSQL Engine]\x1b[0m Seed migration completed (${drivers.length} drivers, ${rides.length} rides, ${txns.length} txns).`);
    } catch (err) {
      console.error('[PostgreSQL Engine] Seed error:', err.message);
    }
  }

  // Non-blocking write-through helpers
  async syncUserToPostgres(user) {
    if (!this.pgPool || !this.isPostgresConnected || !user) return;
    try {
      const balance = this.data.wallet?.balance || user.walletBalance || 250;
      await this.pgPool.query(
        `INSERT INTO users (id, phone, name, greeting_name, email, rating, wallet_balance, total_rides, avatar, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, CURRENT_TIMESTAMP)
         ON CONFLICT (id) DO UPDATE SET
           phone = EXCLUDED.phone,
           name = EXCLUDED.name,
           greeting_name = EXCLUDED.greeting_name,
           email = EXCLUDED.email,
           rating = EXCLUDED.rating,
           wallet_balance = EXCLUDED.wallet_balance,
           total_rides = EXCLUDED.total_rides,
           avatar = EXCLUDED.avatar,
           updated_at = CURRENT_TIMESTAMP`,
        [user.id, user.phone, user.name, user.greetingName || user.name, user.email, user.rating || 5.0, balance, user.totalRides || 0, user.avatar]
      );
    } catch (err) {
      console.warn('[PostgreSQL Engine] User sync warning:', err.message);
    }
  }

  async syncRideToPostgres(ride) {
    if (!this.pgPool || !this.isPostgresConnected || !ride) return;
    try {
      await this.pgPool.query(
        `INSERT INTO rides (id, user_id, driver_id, pickup_name, pickup_coords, drop_name, drop_coords, fare, status, payment_method, otp, distance, duration, category, driver_name, vehicle_info, rating_given, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, CURRENT_TIMESTAMP)
         ON CONFLICT (id) DO UPDATE SET
           status = EXCLUDED.status,
           fare = EXCLUDED.fare,
           payment_method = EXCLUDED.payment_method,
           driver_name = EXCLUDED.driver_name,
           vehicle_info = EXCLUDED.vehicle_info,
           rating_given = EXCLUDED.rating_given,
           updated_at = CURRENT_TIMESTAMP`,
        [
          ride.id,
          this.data.user?.id || 'USR-1001',
          ride.driver?.id || ride.driverId || null,
          ride.pickup || 'Pickup',
          JSON.stringify(ride.pickupCoords || {}),
          ride.destination || 'Destination',
          JSON.stringify(ride.destinationCoords || {}),
          ride.fare || 0,
          ride.status || 'requested',
          ride.paymentMethod || 'Cash',
          ride.otp || null,
          ride.distance || `${ride.distanceKm || 0} km`,
          ride.duration || `${ride.durationMin || 0} mins`,
          ride.category || 'FG DRIVO Sedan',
          ride.driver?.name || ride.driver || 'Captain',
          ride.driver?.vehicle?.model || ride.vehicle || 'Vehicle',
          ride.ratingGiven || null
        ]
      );
    } catch (err) {
      console.warn('[PostgreSQL Engine] Ride sync warning:', err.message);
    }
  }

  async syncTransactionToPostgres(tx) {
    if (!this.pgPool || !this.isPostgresConnected || !tx) return;
    try {
      await this.pgPool.query(
        `INSERT INTO transactions (id, user_id, amount, type, gateway_ref, status, title, description)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         ON CONFLICT (id) DO UPDATE SET
           status = EXCLUDED.status,
           amount = EXCLUDED.amount`,
        [
          tx.id,
          this.data.user?.id || 'USR-1001',
          tx.amount,
          tx.type || 'credit',
          tx.gatewayRef || null,
          tx.status || 'completed',
          tx.title || 'Wallet Transaction',
          tx.description || null
        ]
      );
    } catch (err) {
      console.warn('[PostgreSQL Engine] Transaction sync warning:', err.message);
    }
  }

  init() {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      if (fs.existsSync(DB_FILE)) {
        const fileContent = fs.readFileSync(DB_FILE, 'utf-8');
        const parsed = JSON.parse(fileContent);
        this.data = { ...initialSeedData, ...parsed };
      } else {
        this.save();
      }
    } catch (err) {
      console.warn('[DB Engine] Using fallback in-memory store:', err.message);
      this.data = { ...initialSeedData };
    }
  }

  save() {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      const tempPath = `${DB_FILE}.tmp.${Date.now()}`;
      fs.writeFileSync(tempPath, JSON.stringify(this.data, null, 2), 'utf-8');
      fs.renameSync(tempPath, DB_FILE);
    } catch (err) {
      console.error('[DB Engine] Failed atomic save:', err.message);
    }
  }

  get(key) {
    return this.data[key];
  }

  set(key, value) {
    this.data[key] = value;
    this.save();

    // Asynchronous write-through to PostgreSQL when connected
    if (this.isPostgresConnected) {
      if (key === 'user') {
        this.syncUserToPostgres(value);
      } else if (key === 'activeRide' && value) {
        this.syncRideToPostgres(value);
      } else if (key === 'wallet' && value) {
        if (this.data.user) {
          this.syncUserToPostgres({ ...this.data.user, walletBalance: value.balance });
        }
        if (Array.isArray(value.transactions) && value.transactions.length > 0) {
          this.syncTransactionToPostgres(value.transactions[0]);
        }
      }
    }

    return value;
  }

  update(key, updaterFn) {
    this.data[key] = updaterFn(this.data[key]);
    this.save();

    if (this.isPostgresConnected) {
      if (key === 'user') {
        this.syncUserToPostgres(this.data[key]);
      } else if (key === 'rides' && Array.isArray(this.data[key])) {
        const latestRide = this.data[key][0];
        if (latestRide) this.syncRideToPostgres(latestRide);
      }
    }

    return this.data[key];
  }

  async query(text, params) {
    if (this.pgPool && this.isPostgresConnected) {
      return this.pgPool.query(text, params);
    }
    return null;
  }

  reset() {
    this.data = JSON.parse(JSON.stringify(initialSeedData));
    this.save();
    return this.data;
  }
}

export const db = new DatabaseManager();
