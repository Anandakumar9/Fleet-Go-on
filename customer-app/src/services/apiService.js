import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_BASE_URL = __DEV__ ? 'http://localhost:5000/api' : 'https://your-production-api.com/api';

class ApiService {
  constructor() {
    this.api = axios.create({
      baseURL: API_BASE_URL,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Add request interceptor to include auth token
    this.api.interceptors.request.use(
      async (config) => {
        const token = await AsyncStorage.getItem('authToken');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Add response interceptor for error handling
    this.api.interceptors.response.use(
      (response) => response,
      async (error) => {
        if (error.response?.status === 401) {
          // Token expired, redirect to login
          await AsyncStorage.removeItem('authToken');
          await AsyncStorage.removeItem('user');
          // You can dispatch a logout action here
        }
        return Promise.reject(error);
      }
    );
  }

  // Auth methods
  async login(email, password) {
    const response = await this.api.post('/auth/login', { email, password });
    return response.data;
  }

  async register(userData) {
    const response = await this.api.post('/auth/register', userData);
    return response.data;
  }

  async verifyToken() {
    const response = await this.api.get('/auth/verify');
    return response.data;
  }

  // Order methods
  async getOrders(params = {}) {
    const response = await this.api.get('/orders', { params });
    return response.data;
  }

  async getOrder(orderId) {
    const response = await this.api.get(`/orders/${orderId}`);
    return response.data;
  }

  async createOrder(orderData) {
    const response = await this.api.post('/orders', orderData);
    return response.data;
  }

  async rateOrder(orderId, rating, comment) {
    const response = await this.api.post(`/orders/${orderId}/rate`, {
      rating,
      comment,
    });
    return response.data;
  }

  // User methods
  async getProfile() {
    const response = await this.api.get('/users/profile');
    return response.data;
  }

  async updateProfile(userData) {
    const response = await this.api.put('/users/profile', userData);
    return response.data;
  }

  // Payment methods
  async processPayment(paymentData) {
    const response = await this.api.post('/payments/process', paymentData);
    return response.data;
  }

  async getPaymentHistory() {
    const response = await this.api.get('/payments/history');
    return response.data;
  }

  // Location methods
  async getNearbyPartners(latitude, longitude, radius = 10) {
    const response = await this.api.get('/location/nearby-partners', {
      params: { latitude, longitude, radius },
    });
    return response.data;
  }
}

export default new ApiService();