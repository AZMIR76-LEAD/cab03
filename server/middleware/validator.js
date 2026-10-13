// FG DRIVO Request Validation Middleware
import { ApiError } from './errorHandler.js';

export function validateSendOtp(req, res, next) {
  const { phone } = req.body;
  if (!phone || typeof phone !== 'string' || phone.trim().length < 8) {
    throw new ApiError('A valid mobile phone number is required to dispatch OTP.', 400);
  }
  next();
}

export function validateVerifyOtp(req, res, next) {
  const { phone, otp } = req.body;
  if (!phone || typeof phone !== 'string') {
    throw new ApiError('Phone number is required for verification.', 400);
  }
  if (!otp || typeof otp !== 'string' || otp.trim().length < 4) {
    throw new ApiError('A valid 6-digit verification code is required.', 400);
  }
  next();
}

export function validateBooking(req, res, next) {
  const { category, pickup, destination } = req.body;
  if (category && !['mini', 'sedan', 'suv', 'premium'].includes(category.toLowerCase())) {
    throw new ApiError(`Invalid vehicle category '${category}'. Must be mini, sedan, suv, or premium.`, 400);
  }
  if (!pickup || typeof pickup !== 'string') {
    throw new ApiError('Valid pickup location address is required.', 400);
  }
  if (!destination || typeof destination !== 'string') {
    throw new ApiError('Valid destination location address is required.', 400);
  }
  next();
}

export function validateTopup(req, res, next) {
  const amount = parseFloat(req.body.amount);
  if (isNaN(amount) || amount <= 0 || amount > 50000) {
    throw new ApiError('Top-up amount must be a positive number up to ₹50,000.', 400);
  }
  next();
}

export function validateSavedPlace(req, res, next) {
  const { name, address } = req.body;
  if (!name || typeof name !== 'string' || !name.trim()) {
    throw new ApiError('Place name is required.', 400);
  }
  if (!address || typeof address !== 'string' || !address.trim()) {
    throw new ApiError('Place address is required.', 400);
  }
  next();
}

export function validateEmergencyContact(req, res, next) {
  const { name, phone } = req.body;
  if (!name || typeof name !== 'string' || !name.trim()) {
    throw new ApiError('Contact name is required.', 400);
  }
  if (!phone || typeof phone !== 'string' || phone.trim().length < 8) {
    throw new ApiError('A valid phone number is required for emergency dispatch.', 400);
  }
  next();
}
