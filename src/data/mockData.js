// FG DRIVO Mock Data & Domain Model

export const BRAND = {
  name: "FG DRIVO",
  tagline: "YOUR JOURNEY, OUR RESPONSIBILITY",
  subtext: "A FG GUIDE TRANSPORT SERVICE",
  promise: "Book your ride in seconds with FG DRIVO. Know what it costs, track your driver in real-time, travel safely, and manage every trip from one place.",
  version: "v2.5.0 (FG DRIVO Release)",
};

export const VEHICLE_CATEGORIES = [
  {
    id: "mini",
    name: "FG DRIVO Mini",
    shortName: "Mini",
    tagline: "Affordable city rides",
    description: "Compact & pocket-friendly for daily quick city commutes.",
    baseFare: 49,
    perKm: 12,
    perMin: 1.5,
    etaMinutes: 2,
    capacity: 4,
    luggage: 2,
    multiplier: 1.0,
    icon: "car-compact",
    image: "mini",
    imageUrl: "/cars/car-mini.jpg",
    popular: false,
  },
  {
    id: "sedan",
    name: "FG DRIVO Sedan",
    shortName: "Sedan",
    tagline: "Comfortable everyday travel",
    description: "Spacious sedans with top-rated drivers and climate control.",
    baseFare: 69,
    perKm: 15,
    perMin: 2.0,
    etaMinutes: 3,
    capacity: 4,
    luggage: 3,
    multiplier: 1.25,
    icon: "car-sedan",
    image: "sedan",
    imageUrl: "/cars/car-sedan.jpg",
    popular: true,
  },
  {
    id: "suv",
    name: "FG DRIVO SUV",
    shortName: "SUV",
    tagline: "Extra space & group travel",
    description: "6-seater spacious SUVs for families, extra luggage & roadtrips.",
    baseFare: 99,
    perKm: 21,
    perMin: 2.5,
    etaMinutes: 5,
    capacity: 6,
    luggage: 5,
    multiplier: 1.65,
    icon: "car-suv",
    image: "suv",
    imageUrl: "/cars/car-suv.jpg",
    popular: false,
  },
  {
    id: "premium",
    name: "FG DRIVO Premium",
    shortName: "Premium",
    tagline: "Executive luxury experience",
    description: "High-end luxury vehicles, vetted elite chauffeurs & quiet ride.",
    baseFare: 149,
    perKm: 28,
    perMin: 3.5,
    etaMinutes: 6,
    capacity: 4,
    luggage: 4,
    multiplier: 2.2,
    icon: "car-premium",
    image: "premium",
    imageUrl: "/cars/car-premium.jpg",
    popular: false,
  },
];

export const CURRENT_USER = {
  name: "Passenger",
  greetingName: "Passenger",
  phone: "",
  email: "passenger@fgdrivo.com",
  rating: 5.0,
  memberSince: "October 2026",
  totalRides: 0,
  avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80",
};

export const MOCK_DRIVER = {
  id: "DRV-8821",
  name: "Arjun Verma",
  rating: 4.92,
  tripsCount: 2420,
  yearsActive: 3.5,
  phone: "+91 98112 34567",
  avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80",
  vehicle: {
    model: "Honda City • Midnight Black",
    category: "Sedan",
    licensePlate: "TN 57 CE 4819",
    color: "Midnight Black",
  },
  currentDistanceKm: 1.2,
  initialEtaMinutes: 3,
};

export const SAVED_LOCATIONS = [
  {
    id: "home",
    type: "home",
    name: "Home",
    address: "No. 14, Anna Nagar, Round Road Pudhur, Dindigul",
    landmark: "Near Clock Tower",
    coords: { x: 38, y: 72 },
  },
  {
    id: "work",
    type: "work",
    name: "Work",
    address: "Collectorate Complex, Palani Road, Dindigul",
    landmark: "Main Gate 1",
    coords: { x: 74, y: 32 },
  },
  {
    id: "fav-1",
    type: "favorite",
    name: "Central Bus Stand",
    address: "Trichy Road, Central Bus Stand, Dindigul",
    landmark: "Platform 1 Bay",
    coords: { x: 55, y: 48 },
  },
  {
    id: "fav-2",
    type: "favorite",
    name: "Dindigul Rock Fort",
    address: "Rock Fort Heritage Zone, Dindigul",
    landmark: "Fort Entrance Arch",
    coords: { x: 82, y: 15 },
  },
];

export const POPULAR_DESTINATIONS = [
  {
    id: "pop-1",
    title: "Palani Road Bypass",
    address: "NH 83 Junction, Dindigul",
    distance: "4.2 km",
    duration: "12 min",
    coords: { x: 28, y: 80 },
  },
  {
    id: "pop-2",
    title: "Dindigul Junction Station",
    address: "Railway Feeder Road, Dindigul",
    distance: "2.1 km",
    duration: "7 min",
    coords: { x: 48, y: 52 },
  },
  {
    id: "pop-3",
    title: "Sirumalai Foothills Gate",
    address: "Sirumalai Ghat Road, Dindigul",
    distance: "14.8 km",
    duration: "32 min",
    coords: { x: 62, y: 88 },
  },
];

export const RIDE_HISTORY = [];

export const WALLET_DATA = {
  balance: 0.0,
  currency: "₹",
  cashbackEarned: 0.0,
  autoRecharge: false,
  paymentMethods: [
    {
      id: "pm-upi",
      type: "UPI",
      title: "Google Pay UPI",
      detail: "Fast & Secure UPI",
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
};

export const NOTIFICATIONS_DATA = [
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
    desc: "Use coupon code DRIVO30 on your next outstation or airport trip.",
    time: "1d ago",
    unread: false,
  },
  {
    id: "notif-4",
    category: "safety",
    title: "Emergency Contacts Verified",
    desc: "Your 2 trusted contacts have been synced for live ride tracking.",
    time: "3d ago",
    unread: false,
  },
];

export const EMERGENCY_CONTACTS = [
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
];

export const FAQ_ITEMS = [
  {
    q: "How does FG DRIVO calculate estimated fares?",
    a: "Fares are calculated based on standard base fare, actual estimated distance, trip duration, traffic congestion indexes, and local municipal toll fees. The upfront price you see is transparent and locked for normal route conditions.",
  },
  {
    q: "What safety features does FG DRIVO provide during my ride?",
    a: "Every FG DRIVO trip is backed by real-time GPS route monitoring, 24/7 Safety Command Center, an instant one-tap Emergency SOS button, live location sharing with trusted contacts, and audio trip check-ins.",
  },
  {
    q: "Can I schedule a ride in advance?",
    a: "Yes! In the FG DRIVO app, you can pick 'Ride Now' or tap 'Schedule' to reserve your ride up to 7 days ahead.",
  },
  {
    q: "What if I accidentally left an item in the vehicle?",
    a: "Visit Help & Support > Lost Item in the app, or tap 'Contact Driver' within 48 hours of trip completion. Our customer care team will coordinate safe recovery.",
  },
];
