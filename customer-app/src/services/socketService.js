import React, { createContext, useContext, useEffect, useState } from 'react';
import io from 'socket.io-client';
import AsyncStorage from '@react-native-async-storage/async-storage';

const SOCKET_URL = __DEV__ ? 'http://localhost:5000' : 'https://your-production-api.com';

const SocketContext = createContext();

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    initializeSocket();
    return () => {
      if (socket) {
        socket.disconnect();
      }
    };
  }, []);

  const initializeSocket = async () => {
    try {
      const token = await AsyncStorage.getItem('authToken');
      
      const socketInstance = io(SOCKET_URL, {
        auth: {
          token: token,
        },
        autoConnect: true,
      });

      socketInstance.on('connect', () => {
        console.log('Socket connected:', socketInstance.id);
        setIsConnected(true);
      });

      socketInstance.on('disconnect', () => {
        console.log('Socket disconnected');
        setIsConnected(false);
      });

      socketInstance.on('connect_error', (error) => {
        console.error('Socket connection error:', error);
        setIsConnected(false);
      });

      setSocket(socketInstance);
    } catch (error) {
      console.error('Failed to initialize socket:', error);
    }
  };

  const joinOrderRoom = (orderId) => {
    if (socket && isConnected) {
      socket.emit('joinOrder', orderId);
    }
  };

  const leaveOrderRoom = (orderId) => {
    if (socket && isConnected) {
      socket.emit('leaveOrder', orderId);
    }
  };

  const subscribeToOrderUpdates = (callback) => {
    if (socket) {
      socket.on('statusUpdate', callback);
      socket.on('deliveryLocationUpdate', callback);
      socket.on('orderAccepted', callback);
    }
  };

  const unsubscribeFromOrderUpdates = () => {
    if (socket) {
      socket.off('statusUpdate');
      socket.off('deliveryLocationUpdate');
      socket.off('orderAccepted');
    }
  };

  const value = {
    socket,
    isConnected,
    joinOrderRoom,
    leaveOrderRoom,
    subscribeToOrderUpdates,
    unsubscribeFromOrderUpdates,
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};