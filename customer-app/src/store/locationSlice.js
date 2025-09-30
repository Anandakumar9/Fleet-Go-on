import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  currentLocation: null,
  address: null,
  isLoading: false,
  error: null,
  permissions: {
    granted: false,
    denied: false,
  },
};

const locationSlice = createSlice({
  name: 'location',
  initialState,
  reducers: {
    setCurrentLocation: (state, action) => {
      state.currentLocation = action.payload;
      state.isLoading = false;
      state.error = null;
    },
    setAddress: (state, action) => {
      state.address = action.payload;
    },
    setLocationLoading: (state, action) => {
      state.isLoading = action.payload;
    },
    setLocationError: (state, action) => {
      state.error = action.payload;
      state.isLoading = false;
    },
    setLocationPermissions: (state, action) => {
      state.permissions = action.payload;
    },
    clearLocationError: (state) => {
      state.error = null;
    },
  },
});

export const {
  setCurrentLocation,
  setAddress,
  setLocationLoading,
  setLocationError,
  setLocationPermissions,
  clearLocationError,
} = locationSlice.actions;

export default locationSlice.reducer;