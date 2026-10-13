// FG DRIVO Dynamic Pricing & Fare Estimation Service
import { VEHICLE_PRICING, TAX_RATE, PLATFORM_FEE, DEFAULT_PROMO_DISCOUNT } from '../config/constants.js';

export function calculateFare(categoryKey, distanceKm = 7.8, durationMin = 22) {
  const vehicle = VEHICLE_PRICING[categoryKey] || VEHICLE_PRICING.sedan;

  const baseFare = vehicle.base;
  const distanceFare = Math.round(distanceKm * vehicle.perKm);
  const timeFare = Math.round(durationMin * vehicle.perMin);
  const subtotal = baseFare + distanceFare + timeFare + PLATFORM_FEE;
  const taxes = Math.round(subtotal * TAX_RATE);
  const discount = DEFAULT_PROMO_DISCOUNT;
  const total = Math.max(vehicle.base, Math.round(subtotal + taxes - discount));

  return {
    category: categoryKey,
    name: vehicle.name,
    subtitle: vehicle.subtitle,
    capacity: vehicle.capacity,
    luggage: vehicle.luggage,
    breakdown: {
      baseFare,
      distanceFare,
      timeFare,
      platformFee: PLATFORM_FEE,
      taxes,
      discount,
      total,
    },
    total,
    etaMinutes: categoryKey === 'mini' ? 2 : categoryKey === 'sedan' ? 3 : categoryKey === 'suv' ? 5 : 6,
  };
}

export function getAllFareEstimates(distanceKm = 7.8, durationMin = 22) {
  return Object.keys(VEHICLE_PRICING).map((categoryKey) => {
    const calc = calculateFare(categoryKey, distanceKm, durationMin);
    return {
      id: categoryKey,
      name: calc.name,
      subtitle: calc.subtitle,
      baseFare: calc.breakdown.baseFare,
      distFare: calc.breakdown.distanceFare,
      timeFare: calc.breakdown.timeFare,
      platformFee: calc.breakdown.platformFee,
      taxes: calc.breakdown.taxes,
      discount: calc.breakdown.discount,
      total: calc.total,
      capacity: calc.capacity,
      luggage: calc.luggage,
      etaMinutes: calc.etaMinutes,
    };
  });
}
