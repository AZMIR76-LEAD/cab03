// FG DRIVO Enterprise Atomic Persistence & State Engine
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.join(__dirname, 'data');
const DB_FILE = path.join(DATA_DIR, 'database.json');

// Pristine Seed Dataset customized for Dindigul, Tamil Nadu (TN 57)
export const initialSeedData = {
  user: {
    id: "USR-1001",
    name: "Ashfar Khan",
    greetingName: "Ashfar",
    phone: "+91 98765 43210",
    email: "ashfar.khan@fgdrivo.com",
    rating: 4.95,
    memberSince: "March 2023",
    totalRides: 142,
    avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80",
    goldTier: true,
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
  rides: [
    {
      id: "RX-99410",
      date: "Today, 02:45 PM",
      status: "Completed",
      category: "FG DRIVO Sedan",
      pickup: "Dindigul Railway Junction (Main Entrance)",
      destination: "Palani Road Bypass, Near Velu Vidyalaya",
      fare: 284,
      distance: "7.8 km",
      duration: "22 mins",
      driver: "Vikram Rathore",
      vehicle: "Hyundai Verna (TN 57 MJ 3321)",
      ratingGiven: 5,
      paymentMethod: "UPI (Google Pay)",
    },
    {
      id: "RX-98204",
      date: "Yesterday, 09:15 AM",
      status: "Completed",
      category: "FG DRIVO Mini",
      pickup: "Rock Fort Temple Road, Dindigul Historic Zone",
      destination: "Central Bus Stand (Mofussil Terminus)",
      fare: 198,
      distance: "6.2 km",
      duration: "19 mins",
      driver: "Suresh Pandian",
      vehicle: "Maruti Swift (TN 57 AB 8912)",
      ratingGiven: 5,
      paymentMethod: "FG DRIVO Wallet",
    },
    {
      id: "RX-97552",
      date: "28 Sep 2026, 08:30 PM",
      status: "Completed",
      category: "FG DRIVO SUV",
      pickup: "Batlagundu Highway NH-83 Junction",
      destination: "Sirumalai Foothills Gate & Checkpost",
      fare: 940,
      distance: "41.5 km",
      duration: "58 mins",
      driver: "Mohammed Farooq",
      vehicle: "Toyota Innova Crysta (TN 57 EQ 7780)",
      ratingGiven: 5,
      paymentMethod: "HDFC Visa ••4289",
    },
    {
      id: "RX-96120",
      date: "24 Sep 2026, 11:10 AM",
      status: "Cancelled",
      category: "FG DRIVO Sedan",
      pickup: "Collectorate Complex & Court Buildings",
      destination: "Dindigul Railway Junction",
      fare: 0,
      distance: "3.4 km",
      duration: "Cancelled by passenger",
      driver: "Ramesh Kumar",
      vehicle: "Honda Amaze (TN 57 NC 1092)",
      ratingGiven: null,
      paymentMethod: "N/A",
    },
  ],
  wallet: {
    balance: 1450.0,
    currency: "₹",
    cashbackEarned: 320.0,
    paymentMethods: [
      {
        id: "pm-upi",
        type: "UPI",
        title: "Google Pay UPI",
        detail: "ashfar@oksbi",
        isPrimary: true,
        icon: "smartphone",
      },
      {
        id: "pm-card",
        type: "CARD",
        title: "HDFC Bank Credit Card",
        detail: "•••• 4289 (Expires 08/29)",
        isPrimary: false,
        icon: "credit-card",
      },
      {
        id: "pm-wallet",
        type: "WALLET",
        title: "FG DRIVO Money",
        detail: "Balance: ₹1,450.00",
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
    transactions: [
      {
        id: "TXN-8812",
        title: "Trip Payment #RX-99410",
        date: "Today, 03:07 PM",
        amount: -284,
        type: "debit",
        status: "Successful",
      },
      {
        id: "TXN-8740",
        title: "Wallet Top-up (NetBanking)",
        date: "Yesterday, 07:15 PM",
        amount: 1000,
        type: "credit",
        status: "Successful",
      },
      {
        id: "TXN-8519",
        title: "Promotional Cashback",
        date: "27 Sep 2026",
        amount: 50,
        type: "credit",
        status: "Successful",
      },
    ],
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
    this.init();
  }

  init() {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      if (fs.existsSync(DB_FILE)) {
        const fileContent = fs.readFileSync(DB_FILE, 'utf-8');
        const parsed = JSON.parse(fileContent);
        // Ensure all required top-level keys exist
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
    return value;
  }

  update(key, updaterFn) {
    this.data[key] = updaterFn(this.data[key]);
    this.save();
    return this.data[key];
  }

  reset() {
    this.data = JSON.parse(JSON.stringify(initialSeedData));
    this.save();
    return this.data;
  }
}

export const db = new DatabaseManager();
