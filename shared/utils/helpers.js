import moment from 'moment';

/**
 * Calculate distance between two geographical points using Haversine formula
 * @param {number} lat1 - Latitude of first point
 * @param {number} lon1 - Longitude of first point
 * @param {number} lat2 - Latitude of second point
 * @param {number} lon2 - Longitude of second point
 * @returns {number} Distance in kilometers
 */
export const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Earth's radius in kilometers
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);
  
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

/**
 * Convert degrees to radians
 * @param {number} degrees 
 * @returns {number} Radians
 */
const toRadians = (degrees) => {
  return degrees * (Math.PI / 180);
};

/**
 * Calculate estimated delivery time based on distance and traffic
 * @param {number} distance - Distance in kilometers
 * @param {string} vehicleType - Type of vehicle
 * @returns {number} Estimated time in minutes
 */
export const calculateETA = (distance, vehicleType = 'bike') => {
  const baseTime = 10; // Base preparation time in minutes
  
  const speedMap = {
    bicycle: 15, // km/h
    bike: 25,
    scooter: 25,
    car: 20, // slower in traffic
  };
  
  const speed = speedMap[vehicleType] || 25;
  const travelTime = (distance / speed) * 60; // Convert to minutes
  
  return Math.ceil(baseTime + travelTime);
};

/**
 * Format currency amount
 * @param {number} amount - Amount to format
 * @param {string} currency - Currency symbol (default: ₹)
 * @returns {string} Formatted currency string
 */
export const formatCurrency = (amount, currency = '₹') => {
  return `${currency}${amount.toFixed(2)}`;
};

/**
 * Format date and time
 * @param {Date|string} date - Date to format
 * @param {string} format - Moment.js format string
 * @returns {string} Formatted date string
 */
export const formatDateTime = (date, format = 'MMMM Do YYYY, h:mm A') => {
  return moment(date).format(format);
};

/**
 * Get relative time (e.g., "2 hours ago")
 * @param {Date|string} date - Date to get relative time for
 * @returns {string} Relative time string
 */
export const getRelativeTime = (date) => {
  return moment(date).fromNow();
};

/**
 * Validate email address
 * @param {string} email - Email to validate
 * @returns {boolean} True if valid email
 */
export const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Validate phone number (Indian format)
 * @param {string} phone - Phone number to validate
 * @returns {boolean} True if valid phone number
 */
export const validatePhone = (phone) => {
  const phoneRegex = /^[6-9]\d{9}$/;
  return phoneRegex.test(phone.replace(/\D/g, ''));
};

/**
 * Generate a random ID
 * @param {number} length - Length of the ID
 * @returns {string} Random ID string
 */
export const generateId = (length = 8) => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

/**
 * Debounce function to limit rapid function calls
 * @param {Function} func - Function to debounce
 * @param {number} wait - Wait time in milliseconds
 * @returns {Function} Debounced function
 */
export const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

/**
 * Throttle function to limit function calls to once per interval
 * @param {Function} func - Function to throttle
 * @param {number} limit - Interval limit in milliseconds
 * @returns {Function} Throttled function
 */
export const throttle = (func, limit) => {
  let inThrottle;
  return function() {
    const args = arguments;
    const context = this;
    if (!inThrottle) {
      func.apply(context, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
};

/**
 * Deep clone an object
 * @param {Object} obj - Object to clone
 * @returns {Object} Cloned object
 */
export const deepClone = (obj) => {
  return JSON.parse(JSON.stringify(obj));
};

/**
 * Capitalize first letter of a string
 * @param {string} str - String to capitalize
 * @returns {string} Capitalized string
 */
export const capitalize = (str) => {
  return str.charAt(0).toUpperCase() + str.slice(1);
};

/**
 * Convert status to human readable format
 * @param {string} status - Status string
 * @returns {string} Human readable status
 */
export const formatStatus = (status) => {
  return status
    .split('_')
    .map(word => capitalize(word))
    .join(' ');
};

/**
 * Check if current time is within business hours
 * @param {number} startHour - Start hour (24-hour format)
 * @param {number} endHour - End hour (24-hour format)
 * @returns {boolean} True if within business hours
 */
export const isWithinBusinessHours = (startHour = 9, endHour = 22) => {
  const currentHour = new Date().getHours();
  return currentHour >= startHour && currentHour < endHour;
};

/**
 * Get platform color based on platform name
 * @param {string} platform - Platform name
 * @returns {string} Color hex code
 */
export const getPlatformColor = (platform) => {
  const colors = {
    zomato: '#e23744',
    swiggy: '#fc8019',
    uber_eats: '#000000',
    blinkit: '#54b226',
    zepto: '#7c3aed',
    instamart: '#00aa5a',
    grofers: '#00b894',
  };
  return colors[platform] || '#666666';
};