const express = require('express');
const User = require('../models/User');
const Order = require('../models/Order');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// Get partner dashboard data
router.get('/dashboard', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'delivery_partner') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Delivery partners only.'
      });
    }

    const partnerId = req.user.userId;
    
    // Get partner details
    const partner = await User.findById(partnerId);
    
    // Get order statistics
    const totalOrders = await Order.countDocuments({ deliveryPartner: partnerId });
    const completedOrders = await Order.countDocuments({ 
      deliveryPartner: partnerId, 
      status: 'delivered' 
    });
    
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    
    const todayOrders = await Order.countDocuments({
      deliveryPartner: partnerId,
      createdAt: { $gte: todayStart }
    });

    const todayEarnings = await Order.aggregate([
      {
        $match: {
          deliveryPartner: mongoose.Types.ObjectId(partnerId),
          status: 'delivered',
          createdAt: { $gte: todayStart }
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$pricing.deliveryFee' }
        }
      }
    ]);

    const activeOrders = await Order.find({
      deliveryPartner: partnerId,
      status: { $in: ['confirmed', 'preparing', 'ready_for_pickup', 'picked_up', 'on_the_way'] }
    }).populate('customer', 'name phone');

    res.json({
      success: true,
      data: {
        partner: partner.toJSON(),
        stats: {
          totalOrders,
          completedOrders,
          todayOrders,
          todayEarnings: todayEarnings[0]?.total || 0,
          rating: partner.partnerDetails.rating,
          earnings: partner.partnerDetails.earnings
        },
        activeOrders
      }
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch dashboard data',
      error: error.message
    });
  }
});

// Toggle online status
router.post('/toggle-status', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'delivery_partner') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Delivery partners only.'
      });
    }

    const partner = await User.findById(req.user.userId);
    partner.partnerDetails.isOnline = !partner.partnerDetails.isOnline;
    
    await partner.save();

    res.json({
      success: true,
      message: `Status updated to ${partner.partnerDetails.isOnline ? 'online' : 'offline'}`,
      data: {
        isOnline: partner.partnerDetails.isOnline
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to update status',
      error: error.message
    });
  }
});

// Get available orders for partners
router.get('/available-orders', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'delivery_partner') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Delivery partners only.'
      });
    }

    const partner = await User.findById(req.user.userId);
    
    if (!partner.partnerDetails.isOnline || !partner.partnerDetails.isVerified) {
      return res.status(400).json({
        success: false,
        message: 'Partner must be online and verified to see available orders'
      });
    }

    // Find unassigned orders
    const availableOrders = await Order.find({
      deliveryPartner: { $exists: false },
      status: { $in: ['placed', 'confirmed'] }
    })
    .populate('customer', 'name phone')
    .sort({ createdAt: -1 })
    .limit(20);

    res.json({
      success: true,
      data: { orders: availableOrders }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch available orders',
      error: error.message
    });
  }
});

// Update earnings
router.post('/update-earnings', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'delivery_partner') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Delivery partners only.'
      });
    }

    const { amount, type = 'add' } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Valid amount is required'
      });
    }

    const partner = await User.findById(req.user.userId);
    
    if (type === 'add') {
      partner.partnerDetails.earnings.total += amount;
      partner.partnerDetails.earnings.pending += amount;
    } else if (type === 'withdraw') {
      if (partner.partnerDetails.earnings.pending >= amount) {
        partner.partnerDetails.earnings.pending -= amount;
      } else {
        return res.status(400).json({
          success: false,
          message: 'Insufficient pending earnings'
        });
      }
    }

    await partner.save();

    res.json({
      success: true,
      message: 'Earnings updated successfully',
      data: {
        earnings: partner.partnerDetails.earnings
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to update earnings',
      error: error.message
    });
  }
});

module.exports = router;