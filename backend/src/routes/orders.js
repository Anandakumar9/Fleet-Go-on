const express = require('express');
const Order = require('../models/Order');
const User = require('../models/User');
const authMiddleware = require('../middleware/auth');
const { body, validationResult } = require('express-validator');

const router = express.Router();

// Get all orders for a user
router.get('/', authMiddleware, async (req, res) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    const userId = req.user.userId;
    const userRole = req.user.role;

    let query = {};
    
    // Filter based on user role
    if (userRole === 'customer') {
      query.customer = userId;
    } else if (userRole === 'delivery_partner') {
      query.deliveryPartner = userId;
    }

    // Filter by status if provided
    if (status) {
      query.status = status;
    }

    const orders = await Order.find(query)
      .populate('customer', 'name phone')
      .populate('deliveryPartner', 'name phone partnerDetails.rating')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Order.countDocuments(query);

    res.json({
      success: true,
      data: {
        orders,
        pagination: {
          current: page,
          pages: Math.ceil(total / limit),
          total
        }
      }
    });
  } catch (error) {
    console.error('Get orders error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch orders',
      error: error.message
    });
  }
});

// Get single order by ID
router.get('/:orderId', authMiddleware, async (req, res) => {
  try {
    const { orderId } = req.params;
    const userId = req.user.userId;
    const userRole = req.user.role;

    let query = { orderId };
    
    // Ensure user can only access their own orders
    if (userRole === 'customer') {
      query.customer = userId;
    } else if (userRole === 'delivery_partner') {
      query.deliveryPartner = userId;
    }

    const order = await Order.findOne(query)
      .populate('customer', 'name phone profile.address')
      .populate('deliveryPartner', 'name phone partnerDetails');

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    res.json({
      success: true,
      data: { order }
    });
  } catch (error) {
    console.error('Get order error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch order',
      error: error.message
    });
  }
});

// Create new order (customer only)
router.post('/', [authMiddleware, 
  body('restaurant.name').notEmpty().withMessage('Restaurant name is required'),
  body('restaurant.platform').isIn(['zomato', 'swiggy', 'uber_eats', 'blinkit', 'zepto', 'instamart', 'grofers']).withMessage('Invalid platform'),
  body('items').isArray({ min: 1 }).withMessage('At least one item is required'),
  body('deliveryAddress.street').notEmpty().withMessage('Delivery address is required'),
  body('payment.method').isIn(['cash', 'card', 'upi', 'wallet']).withMessage('Invalid payment method'),
  body('pricing.total').isNumeric().withMessage('Total amount is required')
], async (req, res) => {
  try {
    // Check if user is customer
    if (req.user.role !== 'customer') {
      return res.status(403).json({
        success: false,
        message: 'Only customers can create orders'
      });
    }

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const orderData = {
      ...req.body,
      customer: req.user.userId
    };

    const order = new Order(orderData);
    order.calculateETA();
    order.updateStatus('placed');

    await order.save();

    // Emit real-time event
    const io = req.app.get('socketio');
    io.emit('newOrder', {
      orderId: order.orderId,
      restaurant: order.restaurant,
      deliveryAddress: order.deliveryAddress,
      pricing: order.pricing
    });

    res.status(201).json({
      success: true,
      message: 'Order created successfully',
      data: { order }
    });
  } catch (error) {
    console.error('Create order error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create order',
      error: error.message
    });
  }
});

// Update order status (delivery partner only)
router.patch('/:orderId/status', [authMiddleware,
  body('status').isIn([
    'confirmed', 'preparing', 'ready_for_pickup', 'picked_up', 
    'on_the_way', 'delivered', 'cancelled'
  ]).withMessage('Invalid status')
], async (req, res) => {
  try {
    if (req.user.role !== 'delivery_partner') {
      return res.status(403).json({
        success: false,
        message: 'Only delivery partners can update order status'
      });
    }

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { orderId } = req.params;
    const { status, location } = req.body;

    const order = await Order.findOne({
      orderId,
      deliveryPartner: req.user.userId
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found or not assigned to you'
      });
    }

    order.updateStatus(status, location);
    await order.save();

    // Emit real-time update
    const io = req.app.get('socketio');
    io.to(`order_${orderId}`).emit('statusUpdate', {
      orderId,
      status,
      location,
      timestamp: new Date()
    });

    res.json({
      success: true,
      message: 'Order status updated successfully',
      data: { order }
    });
  } catch (error) {
    console.error('Update order status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update order status',
      error: error.message
    });
  }
});

// Accept order (delivery partner only)
router.post('/:orderId/accept', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'delivery_partner') {
      return res.status(403).json({
        success: false,
        message: 'Only delivery partners can accept orders'
      });
    }

    const { orderId } = req.params;

    const order = await Order.findOne({
      orderId,
      deliveryPartner: { $exists: false },
      status: { $in: ['placed', 'confirmed'] }
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not available for acceptance'
      });
    }

    order.deliveryPartner = req.user.userId;
    order.updateStatus('confirmed');
    await order.save();

    // Emit real-time update
    const io = req.app.get('socketio');
    io.to(`order_${orderId}`).emit('orderAccepted', {
      orderId,
      deliveryPartner: req.user.userId,
      timestamp: new Date()
    });

    res.json({
      success: true,
      message: 'Order accepted successfully',
      data: { order }
    });
  } catch (error) {
    console.error('Accept order error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to accept order',
      error: error.message
    });
  }
});

// Rate order
router.post('/:orderId/rate', [authMiddleware,
  body('rating').isInt({ min: 1, max: 5 }).withMessage('Rating must be between 1 and 5'),
  body('comment').optional().isLength({ max: 500 }).withMessage('Comment too long')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { orderId } = req.params;
    const { rating, comment } = req.body;
    const userId = req.user.userId;
    const userRole = req.user.role;

    const order = await Order.findOne({ orderId });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Check if order is delivered
    if (order.status !== 'delivered') {
      return res.status(400).json({
        success: false,
        message: 'Can only rate delivered orders'
      });
    }

    // Update rating based on user role
    if (userRole === 'customer' && order.customer.toString() === userId) {
      order.rating.customer = { rating, comment };
      
      // Update delivery partner's rating
      if (order.deliveryPartner) {
        const partner = await User.findById(order.deliveryPartner);
        const currentRating = partner.partnerDetails.rating;
        const newCount = currentRating.count + 1;
        const newAverage = ((currentRating.average * currentRating.count) + rating) / newCount;
        
        partner.partnerDetails.rating = {
          average: Math.round(newAverage * 10) / 10,
          count: newCount
        };
        await partner.save();
      }
    } else if (userRole === 'delivery_partner' && order.deliveryPartner.toString() === userId) {
      order.rating.deliveryPartner = { rating, comment };
    } else {
      return res.status(403).json({
        success: false,
        message: 'You can only rate your own orders'
      });
    }

    await order.save();

    res.json({
      success: true,
      message: 'Rating submitted successfully',
      data: { order }
    });
  } catch (error) {
    console.error('Rate order error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to submit rating',
      error: error.message
    });
  }
});

module.exports = router;