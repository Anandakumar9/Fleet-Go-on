// Order status constants
export const ORDER_STATUS = {
  PLACED: 'placed',
  CONFIRMED: 'confirmed',
  PREPARING: 'preparing',
  READY_FOR_PICKUP: 'ready_for_pickup',
  PICKED_UP: 'picked_up',
  ON_THE_WAY: 'on_the_way',
  DELIVERED: 'delivered',
  CANCELLED: 'cancelled',
};

// Payment methods
export const PAYMENT_METHODS = {
  CASH: 'cash',
  CARD: 'card',
  UPI: 'upi',
  WALLET: 'wallet',
};

// User roles
export const USER_ROLES = {
  CUSTOMER: 'customer',
  DELIVERY_PARTNER: 'delivery_partner',
  ADMIN: 'admin',
};

// Platforms
export const PLATFORMS = {
  ZOMATO: 'zomato',
  SWIGGY: 'swiggy',
  UBER_EATS: 'uber_eats',
  BLINKIT: 'blinkit',
  ZEPTO: 'zepto',
  INSTAMART: 'instamart',
  GROFERS: 'grofers',
};

// Vehicle types
export const VEHICLE_TYPES = {
  BIKE: 'bike',
  SCOOTER: 'scooter',
  CAR: 'car',
  BICYCLE: 'bicycle',
};

// API endpoints
export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    VERIFY: '/auth/verify',
  },
  ORDERS: {
    BASE: '/orders',
    ACCEPT: (orderId) => `/orders/${orderId}/accept`,
    STATUS: (orderId) => `/orders/${orderId}/status`,
    RATE: (orderId) => `/orders/${orderId}/rate`,
  },
  USERS: {
    PROFILE: '/users/profile',
  },
  PARTNERS: {
    DASHBOARD: '/partners/dashboard',
    TOGGLE_STATUS: '/partners/toggle-status',
    AVAILABLE_ORDERS: '/partners/available-orders',
    UPDATE_EARNINGS: '/partners/update-earnings',
  },
  LOCATION: {
    UPDATE: '/location/update',
    NEARBY_PARTNERS: '/location/nearby-partners',
  },
  PAYMENTS: {
    PROCESS: '/payments/process',
    HISTORY: '/payments/history',
  },
};

// Socket events
export const SOCKET_EVENTS = {
  CONNECTION: 'connection',
  DISCONNECT: 'disconnect',
  JOIN_ORDER: 'joinOrder',
  JOIN_PARTNER: 'joinPartner',
  LOCATION_UPDATE: 'locationUpdate',
  STATUS_UPDATE: 'statusUpdate',
  DELIVERY_LOCATION_UPDATE: 'deliveryLocationUpdate',
  ORDER_ACCEPTED: 'orderAccepted',
  NEW_ORDER: 'newOrder',
};

// Error messages
export const ERROR_MESSAGES = {
  NETWORK_ERROR: 'Network error. Please check your connection.',
  INVALID_CREDENTIALS: 'Invalid email or password.',
  SERVER_ERROR: 'Server error. Please try again later.',
  LOCATION_PERMISSION_DENIED: 'Location permission is required for this feature.',
  ORDER_NOT_FOUND: 'Order not found.',
  UNAUTHORIZED: 'You are not authorized to perform this action.',
};

// Success messages
export const SUCCESS_MESSAGES = {
  LOGIN_SUCCESS: 'Login successful!',
  REGISTRATION_SUCCESS: 'Registration successful!',
  ORDER_PLACED: 'Order placed successfully!',
  ORDER_ACCEPTED: 'Order accepted successfully!',
  STATUS_UPDATED: 'Status updated successfully!',
  PROFILE_UPDATED: 'Profile updated successfully!',
  RATING_SUBMITTED: 'Rating submitted successfully!',
};