import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import apiService from '../services/apiService';

// Async thunks
export const fetchOrders = createAsyncThunk(
  'orders/fetchOrders',
  async (params, { rejectWithValue }) => {
    try {
      const response = await apiService.getOrders(params);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch orders');
    }
  }
);

export const fetchOrderDetails = createAsyncThunk(
  'orders/fetchOrderDetails',
  async (orderId, { rejectWithValue }) => {
    try {
      const response = await apiService.getOrder(orderId);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch order details');
    }
  }
);

export const createOrder = createAsyncThunk(
  'orders/createOrder',
  async (orderData, { rejectWithValue }) => {
    try {
      const response = await apiService.createOrder(orderData);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to create order');
    }
  }
);

export const rateOrder = createAsyncThunk(
  'orders/rateOrder',
  async ({ orderId, rating, comment }, { rejectWithValue }) => {
    try {
      const response = await apiService.rateOrder(orderId, rating, comment);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to rate order');
    }
  }
);

const initialState = {
  orders: [],
  currentOrder: null,
  activeOrders: [],
  pastOrders: [],
  isLoading: false,
  error: null,
  pagination: {
    current: 1,
    pages: 1,
    total: 0,
  },
};

const orderSlice = createSlice({
  name: 'orders',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    setCurrentOrder: (state, action) => {
      state.currentOrder = action.payload;
    },
    updateOrderStatus: (state, action) => {
      const { orderId, status, location, timestamp } = action.payload;
      
      // Update current order if it matches
      if (state.currentOrder?.orderId === orderId) {
        state.currentOrder.status = status;
        if (location) {
          state.currentOrder.tracking.currentLocation = {
            ...location,
            lastUpdated: timestamp,
          };
        }
        state.currentOrder.statusHistory.push({
          status,
          timestamp,
          location,
        });
      }

      // Update in orders list
      const orderIndex = state.orders.findIndex(order => order.orderId === orderId);
      if (orderIndex !== -1) {
        state.orders[orderIndex].status = status;
        if (location) {
          state.orders[orderIndex].tracking.currentLocation = {
            ...location,
            lastUpdated: timestamp,
          };
        }
      }

      // Update active/past orders
      const activeIndex = state.activeOrders.findIndex(order => order.orderId === orderId);
      if (activeIndex !== -1) {
        state.activeOrders[activeIndex].status = status;
        if (status === 'delivered' || status === 'cancelled') {
          // Move to past orders
          const order = state.activeOrders.splice(activeIndex, 1)[0];
          state.pastOrders.unshift(order);
        }
      }
    },
    updateDeliveryLocation: (state, action) => {
      const { orderId, location, timestamp } = action.payload;
      
      // Update current order
      if (state.currentOrder?.orderId === orderId) {
        state.currentOrder.tracking.currentLocation = {
          ...location,
          lastUpdated: timestamp,
        };
        if (!state.currentOrder.tracking.route) {
          state.currentOrder.tracking.route = [];
        }
        state.currentOrder.tracking.route.push({
          ...location,
          timestamp,
        });
      }

      // Update in orders list
      const orderIndex = state.orders.findIndex(order => order.orderId === orderId);
      if (orderIndex !== -1) {
        state.orders[orderIndex].tracking.currentLocation = {
          ...location,
          lastUpdated: timestamp,
        };
      }
    },
    clearCurrentOrder: (state) => {
      state.currentOrder = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch orders
      .addCase(fetchOrders.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchOrders.fulfilled, (state, action) => {
        state.isLoading = false;
        state.orders = action.payload.orders;
        state.pagination = action.payload.pagination;
        
        // Separate active and past orders
        state.activeOrders = action.payload.orders.filter(order => 
          !['delivered', 'cancelled'].includes(order.status)
        );
        state.pastOrders = action.payload.orders.filter(order => 
          ['delivered', 'cancelled'].includes(order.status)
        );
      })
      .addCase(fetchOrders.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      // Fetch order details
      .addCase(fetchOrderDetails.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchOrderDetails.fulfilled, (state, action) => {
        state.isLoading = false;
        state.currentOrder = action.payload.order;
      })
      .addCase(fetchOrderDetails.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      // Create order
      .addCase(createOrder.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(createOrder.fulfilled, (state, action) => {
        state.isLoading = false;
        state.currentOrder = action.payload.order;
        state.orders.unshift(action.payload.order);
        state.activeOrders.unshift(action.payload.order);
      })
      .addCase(createOrder.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      // Rate order
      .addCase(rateOrder.fulfilled, (state, action) => {
        const updatedOrder = action.payload.order;
        const orderIndex = state.orders.findIndex(order => order.orderId === updatedOrder.orderId);
        if (orderIndex !== -1) {
          state.orders[orderIndex] = updatedOrder;
        }
        if (state.currentOrder?.orderId === updatedOrder.orderId) {
          state.currentOrder = updatedOrder;
        }
      });
  },
});

export const {
  clearError,
  setCurrentOrder,
  updateOrderStatus,
  updateDeliveryLocation,
  clearCurrentOrder,
} = orderSlice.actions;

export default orderSlice.reducer;