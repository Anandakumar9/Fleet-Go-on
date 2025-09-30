# Fleet-Go-on API Documentation

## Base URL
```
Development: http://localhost:5000/api
Production: https://your-domain.com/api
```

## Authentication

All protected endpoints require a JWT token in the Authorization header:
```
Authorization: Bearer <token>
```

### Login
**POST** `/auth/login`

Request:
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

Response:
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "id": "user_id",
      "name": "John Doe",
      "email": "user@example.com",
      "role": "customer"
    },
    "token": "jwt_token_here"
  }
}
```

### Register
**POST** `/auth/register`

Request:
```json
{
  "name": "John Doe",
  "email": "user@example.com",
  "phone": "9876543210",
  "password": "password123",
  "role": "customer"
}
```

### Verify Token
**GET** `/auth/verify`

Headers: `Authorization: Bearer <token>`

## Orders API

### Get Orders
**GET** `/orders`

Query Parameters:
- `status`: Filter by order status
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 10)

### Get Order Details
**GET** `/orders/:orderId`

### Create Order
**POST** `/orders`

Request:
```json
{
  "restaurant": {
    "name": "Restaurant Name",
    "platform": "zomato",
    "coordinates": {
      "latitude": 28.6139,
      "longitude": 77.2090
    }
  },
  "items": [
    {
      "name": "Pizza",
      "quantity": 1,
      "price": 299
    }
  ],
  "deliveryAddress": {
    "street": "123 Main St",
    "city": "New Delhi",
    "coordinates": {
      "latitude": 28.6129,
      "longitude": 77.2295
    }
  },
  "pricing": {
    "subtotal": 299,
    "deliveryFee": 40,
    "taxes": 15,
    "total": 354
  },
  "payment": {
    "method": "upi"
  }
}
```

### Update Order Status
**PATCH** `/orders/:orderId/status`

Request:
```json
{
  "status": "picked_up",
  "location": {
    "latitude": 28.6139,
    "longitude": 77.2090
  }
}
```

### Accept Order (Partner)
**POST** `/orders/:orderId/accept`

### Rate Order
**POST** `/orders/:orderId/rate`

Request:
```json
{
  "rating": 5,
  "comment": "Great service!"
}
```

## Users API

### Get Profile
**GET** `/users/profile`

### Update Profile
**PUT** `/users/profile`

Request:
```json
{
  "name": "Updated Name",
  "phone": "9876543210",
  "profile": {
    "address": {
      "street": "New Address",
      "city": "New Delhi"
    }
  }
}
```

## Partners API

### Get Dashboard
**GET** `/partners/dashboard`

Response:
```json
{
  "success": true,
  "data": {
    "partner": { /* partner details */ },
    "stats": {
      "totalOrders": 150,
      "completedOrders": 140,
      "todayOrders": 8,
      "todayEarnings": 1200,
      "rating": {
        "average": 4.8,
        "count": 125
      },
      "earnings": {
        "total": 45000,
        "pending": 1200
      }
    },
    "activeOrders": [ /* active orders array */ ]
  }
}
```

### Toggle Online Status
**POST** `/partners/toggle-status`

### Get Available Orders
**GET** `/partners/available-orders`

### Update Earnings
**POST** `/partners/update-earnings`

Request:
```json
{
  "amount": 250,
  "type": "add"
}
```

## Location API

### Update Location
**POST** `/location/update`

Request:
```json
{
  "latitude": 28.6139,
  "longitude": 77.2090
}
```

### Get Nearby Partners
**GET** `/location/nearby-partners`

Query Parameters:
- `latitude`: Current latitude
- `longitude`: Current longitude
- `radius`: Search radius in km (default: 10)

## Payments API

### Process Payment
**POST** `/payments/process`

Request:
```json
{
  "orderId": "order_id",
  "amount": 354,
  "method": "upi",
  "paymentDetails": {
    "upiId": "user@paytm"
  }
}
```

### Get Payment History
**GET** `/payments/history`

## WebSocket Events

### Client to Server Events

#### Join Order Room
```javascript
socket.emit('joinOrder', orderId);
```

#### Join Partner Room
```javascript
socket.emit('joinPartner', partnerId);
```

#### Location Update
```javascript
socket.emit('locationUpdate', {
  orderId: 'order_id',
  partnerId: 'partner_id',
  location: {
    latitude: 28.6139,
    longitude: 77.2090
  }
});
```

### Server to Client Events

#### Order Status Update
```javascript
socket.on('statusUpdate', (data) => {
  // data: { orderId, status, location, timestamp }
});
```

#### Delivery Location Update
```javascript
socket.on('deliveryLocationUpdate', (data) => {
  // data: { orderId, partnerId, location, timestamp }
});
```

#### Order Accepted
```javascript
socket.on('orderAccepted', (data) => {
  // data: { orderId, deliveryPartner, timestamp }
});
```

#### New Order (for partners)
```javascript
socket.on('newOrder', (data) => {
  // data: { orderId, restaurant, deliveryAddress, pricing }
});
```

## Error Responses

All error responses follow this format:
```json
{
  "success": false,
  "message": "Error message",
  "error": "Detailed error information"
}
```

Common HTTP status codes:
- `400`: Bad Request
- `401`: Unauthorized
- `403`: Forbidden
- `404`: Not Found
- `500`: Internal Server Error

## Rate Limiting

- API calls are limited to 100 requests per 15 minutes per IP
- Authentication endpoints have stricter limits
- Consider implementing caching for frequently accessed data

## Data Models

### User
```javascript
{
  _id: ObjectId,
  name: String,
  email: String,
  phone: String,
  role: String, // 'customer' | 'delivery_partner' | 'admin'
  isActive: Boolean,
  profile: {
    avatar: String,
    address: Object,
    preferences: Object
  },
  partnerDetails: { // Only for delivery partners
    vehicleType: String,
    isVerified: Boolean,
    rating: Object,
    earnings: Object,
    isOnline: Boolean,
    currentLocation: Object
  },
  createdAt: Date,
  updatedAt: Date
}
```

### Order
```javascript
{
  _id: ObjectId,
  orderId: String, // Unique order ID
  customer: ObjectId,
  deliveryPartner: ObjectId,
  restaurant: Object,
  items: Array,
  pricing: Object,
  deliveryAddress: Object,
  status: String,
  statusHistory: Array,
  payment: Object,
  estimatedDeliveryTime: Date,
  actualDeliveryTime: Date,
  rating: Object,
  tracking: Object,
  createdAt: Date,
  updatedAt: Date
}
```