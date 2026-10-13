// FG DRIVO Enterprise Mobility Engine
// System Constants & Regional Master Configurations

export const CITY_INFO = {
  name: 'Dindigul',
  state: 'Tamil Nadu',
  country: 'India',
  rtoCode: 'TN 57',
  centerCoords: {
    lat: 10.3673,
    lng: 77.9803,
  },
  bounds: {
    minX: 10,
    maxX: 90,
    minY: 10,
    maxY: 90,
  },
};

export const VEHICLE_PRICING = {
  mini: {
    id: 'mini',
    name: 'FG DRIVO Mini',
    subtitle: 'Compact hatchback for quick city hops',
    base: 45,
    perKm: 12,
    perMin: 1.5,
    capacity: 4,
    luggage: 2,
    icon: 'car-compact',
  },
  sedan: {
    id: 'sedan',
    name: 'FG DRIVO Sedan',
    subtitle: 'Comfortable air-conditioned sedan',
    base: 69,
    perKm: 15,
    perMin: 2.0,
    capacity: 4,
    luggage: 3,
    icon: 'car',
  },
  suv: {
    id: 'suv',
    name: 'FG DRIVO SUV',
    subtitle: 'Spacious 6-seater for family & outstation',
    base: 99,
    perKm: 21,
    perMin: 2.5,
    capacity: 6,
    luggage: 5,
    icon: 'truck',
  },
  premium: {
    id: 'premium',
    name: 'FG DRIVO Premium',
    subtitle: 'Luxury executive sedans with top-rated captains',
    base: 149,
    perKm: 28,
    perMin: 3.5,
    capacity: 4,
    luggage: 4,
    icon: 'star',
  },
};

export const RIDE_STATUSES = {
  FINDING_DRIVER: 'finding_driver',
  DRIVER_ASSIGNED: 'driver_assigned',
  DRIVER_ARRIVING: 'driver_arriving',
  DRIVER_ARRIVED: 'driver_arrived',
  TRIP_STARTED: 'trip_started',
  TRIP_IN_PROGRESS: 'trip_in_progress',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
};

export const RIDE_LIFECYCLE_STEPS = [
  RIDE_STATUSES.FINDING_DRIVER,
  RIDE_STATUSES.DRIVER_ASSIGNED,
  RIDE_STATUSES.DRIVER_ARRIVING,
  RIDE_STATUSES.DRIVER_ARRIVED,
  RIDE_STATUSES.TRIP_STARTED,
  RIDE_STATUSES.TRIP_IN_PROGRESS,
  RIDE_STATUSES.COMPLETED,
];

export const TAX_RATE = 0.05; // 5% GST for mobility
export const PLATFORM_FEE = 15.0; // ₹15 platform booking fee
export const DEFAULT_PROMO_DISCOUNT = 20.0; // ₹20 first ride / loyalty discount
