import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { Provider as PaperProvider } from 'react-native-paper';
import { Provider as ReduxProvider } from 'react-redux';
import { store } from './src/store/store';
import AppNavigator from './src/navigation/AppNavigator';
import { SocketProvider } from './src/services/socketService';
import LocationService from './src/services/locationService';

export default function App() {
  useEffect(() => {
    // Initialize location service for delivery tracking
    LocationService.init();
  }, []);

  return (
    <ReduxProvider store={store}>
      <PaperProvider>
        <SocketProvider>
          <NavigationContainer>
            <View style={styles.container}>
              <AppNavigator />
              <StatusBar style="auto" />
            </View>
          </NavigationContainer>
        </SocketProvider>
      </PaperProvider>
    </ReduxProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
});