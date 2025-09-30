const express = require('express');
const User = require('../models/User');
const Order = require('../models/Order');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// Update location (delivery partner only)
router.post('/update', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'delivery_partner') {
      return res.status(403).json({
        success: false,
        message: 'Only delivery partners can update location'
      });
    }

    const { latitude, longitude } = req.body;

    if (!latitude || !longitude) {
      return res.status(400).json({
        success: false,
        message: 'Latitude and longitude are required'
      });
    }

    // Update user location
    await User.findByIdAndUpdate(req.user.userId, {
      'partnerDetails.currentLocation': {
        latitude,
        longitude,
        lastUpdated: new Date()
      }
    });

    // Update active orders with new location
    const activeOrders = await Order.find({
      deliveryPartner: req.user.userId,
      status: { $in: ['picked_up', 'on_the_way'] }
    });

    // Emit location updates for active orders
    const io = req.app.get('socketio');
    activeOrders.forEach(order => {
      io.to(`order_${order.orderId}`).emit('deliveryLocationUpdate', {
        orderId: order.orderId,
        partnerId: req.user.userId,
        location: { latitude, longitude },
        timestamp: new Date()
      });
    });

    res.json({
      success: true,
      message: 'Location updated successfully',
      data: {
        location: { latitude, longitude },
        timestamp: new Date()
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to update location',
      error: error.message
    });
  }
});

// Get nearby delivery partners (for order assignment)
router.get('/nearby-partners', async (req, res) => {
  try {
    const { latitude, longitude, radius = 10 } = req.query;

    if (!latitude || !longitude) {
      return res.status(400).json({
        success: false,
        message: 'Latitude and longitude are required'
      });
    }

    // Find nearby online delivery partners
    const partners = await User.find({
      role: 'delivery_partner',
      'partnerDetails.isOnline': true,
      'partnerDetails.isVerified': true,
      'partnerDetails.currentLocation.latitude': {
        $gte: parseFloat(latitude) - (radius / 111), // Rough conversion km to degrees
        $lte: parseFloat(latitude) + (radius / 111)
      },
      'partnerDetails.currentLocation.longitude': {
        $gte: parseFloat(longitude) - (radius / 111),
        $lte: parseFloat(longitude) + (radius / 111)
      }
    }).select('name partnerDetails.rating partnerDetails.currentLocation partnerDetails.vehicleType');

    res.json({
      success: true,
      data: { partners }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to find nearby partners',
      error: error.message
    });
  }
});

module.exports = router;