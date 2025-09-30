# Fleet-Go-on Setup Guide

## Prerequisites

Before setting up the Fleet-Go-on application, ensure you have the following installed:

- **Node.js** (v16 or higher)
- **npm** or **yarn**
- **MongoDB** (v4.4 or higher)
- **Redis** (v6 or higher)
- **Expo CLI** (for mobile apps)
- **Android Studio** or **Xcode** (for mobile development)

## Quick Start

### 1. Clone and Install Dependencies

```bash
# Clone the repository
git clone https://github.com/Anandakumar9/Fleet-Go-on.git
cd Fleet-Go-on

# Install all dependencies
npm run install:all
```

### 2. Environment Setup

#### Backend Configuration
```bash
cd backend
cp .env.example .env
# Edit .env with your configuration
```

Required environment variables:
- `MONGODB_URI`: MongoDB connection string
- `JWT_SECRET`: JWT signing secret
- `GOOGLE_MAPS_API_KEY`: Google Maps API key
- `STRIPE_SECRET_KEY`: Stripe payment API key (optional)

#### Database Setup
```bash
# Start MongoDB (if using local installation)
mongod

# Start Redis
redis-server
```

### 3. Start the Applications

#### Start all services simultaneously:
```bash
npm run dev
```

#### Or start individually:

**Backend API:**
```bash
cd backend
npm run dev
# Server runs on http://localhost:5000
```

**Customer App:**
```bash
cd customer-app
npm start
# Expo development server starts
```

**Delivery Partner App:**
```bash
cd delivery-partner-app
npm start
# Expo development server starts
```

## Development Workflow

### Backend Development

1. **API Testing**: Use tools like Postman or curl to test endpoints
2. **Database**: MongoDB with Mongoose ODM
3. **Real-time**: Socket.IO for live updates
4. **Authentication**: JWT-based authentication

### Mobile App Development

1. **Development**: Use Expo for React Native development
2. **Testing**: Test on physical devices or simulators
3. **State Management**: Redux Toolkit for state management
4. **Navigation**: React Navigation for app navigation

### Code Quality

```bash
# Run linting
npm run lint

# Fix linting issues
npm run lint:fix

# Run tests
npm test
```

## Building for Production

### Backend
```bash
cd backend
npm run build
npm start
```

### Mobile Apps
```bash
# Customer App
cd customer-app
expo build:android
expo build:ios

# Delivery Partner App
cd delivery-partner-app
expo build:android
expo build:ios
```

## Deployment

### Backend Deployment
- Use platforms like Heroku, AWS, or DigitalOcean
- Ensure MongoDB and Redis are accessible
- Set production environment variables

### Mobile App Deployment
- Build APK/IPA files using Expo
- Submit to Google Play Store and Apple App Store
- Use Expo's OTA updates for quick updates

## API Documentation

The backend provides the following main API endpoints:

- **Authentication**: `/api/auth/*`
- **Orders**: `/api/orders/*`
- **Users**: `/api/users/*`
- **Partners**: `/api/partners/*`
- **Location**: `/api/location/*`
- **Payments**: `/api/payments/*`

Detailed API documentation is available in `/docs/api.md`.

## Socket.IO Events

Real-time features use Socket.IO with these events:

- `joinOrder`: Join order room for tracking
- `statusUpdate`: Order status changes
- `locationUpdate`: Delivery partner location updates
- `newOrder`: New order notifications

## Troubleshooting

### Common Issues

1. **MongoDB Connection Error**
   - Ensure MongoDB is running
   - Check connection string in .env

2. **Expo App Not Loading**
   - Clear Expo cache: `expo start -c`
   - Restart Metro bundler

3. **Location Services Not Working**
   - Enable location permissions on device
   - Check Google Maps API key

4. **Socket Connection Issues**
   - Verify backend server is running
   - Check CORS configuration

### Debugging

- Backend logs: Check console output and log files
- Mobile apps: Use React Native Debugger or Flipper
- Network issues: Monitor network tab in browser dev tools

## Support

For issues and questions:
- Create an issue on GitHub
- Check existing documentation
- Review code comments

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Write tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.