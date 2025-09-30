const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  orderId: {
    type: String,
    required: true,
    unique: true
  },
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  deliveryPartner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  restaurant: {
    name: String,
    address: String,
    phone: String,
    coordinates: {
      latitude: Number,
      longitude: Number
    },
    platform: {
      type: String,
      enum: ['zomato', 'swiggy', 'uber_eats', 'blinkit', 'zepto', 'instamart', 'grofers'],
      required: true
    }
  },
  items: [{
    name: String,
    quantity: Number,
    price: Number,
    customizations: [String]
  }],
  pricing: {
    subtotal: Number,
    deliveryFee: Number,
    taxes: Number,
    discount: Number,
    total: Number
  },
  deliveryAddress: {
    street: String,
    city: String,
    state: String,
    zipCode: String,
    coordinates: {
      latitude: Number,
      longitude: Number
    },
    landmark: String,
    instructions: String
  },
  status: {
    type: String,
    enum: [
      'placed',
      'confirmed',
      'preparing',
      'ready_for_pickup',
      'picked_up',
      'on_the_way',
      'delivered',
      'cancelled'
    ],
    default: 'placed'
  },
  statusHistory: [{
    status: String,
    timestamp: {
      type: Date,
      default: Date.now
    },
    location: {
      latitude: Number,
      longitude: Number
    }
  }],
  payment: {
    method: {
      type: String,
      enum: ['cash', 'card', 'upi', 'wallet'],
      required: true
    },
    status: {
      type: String,
      enum: ['pending', 'completed', 'failed', 'refunded'],
      default: 'pending'
    },
    transactionId: String,
    amount: Number
  },
  estimatedDeliveryTime: Date,
  actualDeliveryTime: Date,
  rating: {
    customer: {
      rating: Number,
      comment: String
    },
    deliveryPartner: {
      rating: Number,
      comment: String
    }
  },
  tracking: {
    currentLocation: {
      latitude: Number,
      longitude: Number,
      lastUpdated: Date
    },
    route: [{
      latitude: Number,
      longitude: Number,
      timestamp: Date
    }]
  },
  specialInstructions: String,
  platformOrderId: String, // Original order ID from the platform
  isAggregated: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Generate unique order ID
orderSchema.pre('save', function(next) {
  if (!this.orderId) {
    this.orderId = 'FGO' + Date.now() + Math.random().toString(36).substr(2, 5).toUpperCase();
  }
  next();
});

// Update status history
orderSchema.methods.updateStatus = function(newStatus, location = null) {
  this.status = newStatus;
  this.statusHistory.push({
    status: newStatus,
    timestamp: new Date(),
    location: location
  });
  
  if (newStatus === 'delivered') {
    this.actualDeliveryTime = new Date();
  }
};

// Calculate estimated delivery time
orderSchema.methods.calculateETA = function() {
  const baseTime = 30; // Base delivery time in minutes
  const distance = this.calculateDistance();
  const additionalTime = Math.ceil(distance * 2); // 2 minutes per km
  
  this.estimatedDeliveryTime = new Date(Date.now() + (baseTime + additionalTime) * 60000);
};

// Calculate distance between restaurant and delivery address
orderSchema.methods.calculateDistance = function() {
  if (!this.restaurant.coordinates || !this.deliveryAddress.coordinates) return 5; // Default 5km
  
  const R = 6371; // Earth's radius in km
  const dLat = (this.deliveryAddress.coordinates.latitude - this.restaurant.coordinates.latitude) * Math.PI / 180;
  const dLon = (this.deliveryAddress.coordinates.longitude - this.restaurant.coordinates.longitude) * Math.PI / 180;
  
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(this.restaurant.coordinates.latitude * Math.PI / 180) * 
    Math.cos(this.deliveryAddress.coordinates.latitude * Math.PI / 180) *
    Math.sin(dLon/2) * Math.sin(dLon/2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
};

module.exports = mongoose.model('Order', orderSchema);