# Fleet-Go-on
Aggregator of ALL Quick Commerce & Food Delivery Services

## Overview
Fleet-Go-on is a comprehensive aggregator platform that connects customers with multiple quick commerce and food delivery services through two dedicated applications:

### 🛍️ Customer App
- Browse and order from multiple delivery platforms
- Real-time order tracking with live location updates
- Secure payment processing
- Intuitive and easy-to-use interface
- Order history and favorites

### 🚀 Delivery Partner App  
- Manage orders from multiple platforms
- Real-time location tracking
- Payment details and earnings tracking
- Partner dashboard with analytics
- Route optimization

## Features
- **Live Order Tracking**: Real-time updates on order status and delivery location
- **Multi-Platform Integration**: Aggregates orders from various quick commerce and food delivery services
- **Secure Payments**: Integrated payment gateway with multiple payment options
- **Location Services**: GPS tracking for accurate delivery and customer location
- **User-Friendly UI**: Modern, responsive design for both customer and partner apps
- **Real-time Notifications**: Push notifications for order updates

## Tech Stack
- **Frontend**: React Native (Mobile Apps)
- **Backend**: Node.js with Express
- **Database**: MongoDB with Redis for caching
- **Real-time**: Socket.IO for live updates
- **Authentication**: JWT with OAuth integration
- **Payments**: Stripe/Razorpay integration
- **Maps**: Google Maps API for location services

## Project Structure
```
Fleet-Go-on/
├── backend/              # Node.js API server
├── customer-app/         # React Native customer app
├── delivery-partner-app/ # React Native delivery partner app
├── shared/              # Shared utilities and types
└── docs/               # Documentation
```
