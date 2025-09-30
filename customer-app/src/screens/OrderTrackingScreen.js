import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Dimensions,
  Alert,
} from 'react-native';
import {
  Text,
  Card,
  Button,
  Chip,
  Portal,
  Modal,
  TextInput,
} from 'react-native-paper';
import MapView, { Marker, Polyline } from 'react-native-maps';
import { useDispatch, useSelector } from 'react-redux';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { fetchOrderDetails, rateOrder } from '../store/orderSlice';
import { useSocket } from '../services/socketService';

const { width, height } = Dimensions.get('window');

const OrderTrackingScreen = ({ route, navigation }) => {
  const { orderId } = route.params;
  const dispatch = useDispatch();
  const { currentOrder, isLoading } = useSelector(state => state.orders);
  const { joinOrderRoom, leaveOrderRoom, subscribeToOrderUpdates, unsubscribeFromOrderUpdates } = useSocket();
  
  const [mapRegion, setMapRegion] = useState({
    latitude: 28.6139,
    longitude: 77.2090,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  });
  
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');

  useFocusEffect(
    React.useCallback(() => {
      loadOrderDetails();
      joinOrderRoom(orderId);
      subscribeToOrderUpdates(handleOrderUpdate);

      return () => {
        leaveOrderRoom(orderId);
        unsubscribeFromOrderUpdates();
      };
    }, [orderId])
  );

  const loadOrderDetails = async () => {
    try {
      await dispatch(fetchOrderDetails(orderId)).unwrap();
    } catch (error) {
      Alert.alert('Error', 'Failed to load order details');
    }
  };

  const handleOrderUpdate = (update) => {
    console.log('Received order update:', update);
    // Order updates are automatically handled by Redux store
  };

  useEffect(() => {
    if (currentOrder) {
      // Update map region based on order locations
      const { restaurant, deliveryAddress, tracking } = currentOrder;
      
      if (tracking?.currentLocation) {
        setMapRegion({
          latitude: tracking.currentLocation.latitude,
          longitude: tracking.currentLocation.longitude,
          latitudeDelta: 0.02,
          longitudeDelta: 0.02,
        });
      } else if (restaurant?.coordinates) {
        setMapRegion({
          latitude: restaurant.coordinates.latitude,
          longitude: restaurant.coordinates.longitude,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        });
      }

      // Show rating modal when order is delivered
      if (currentOrder.status === 'delivered' && !currentOrder.rating?.customer) {
        setShowRatingModal(true);
      }
    }
  }, [currentOrder]);

  const handleRating = async () => {
    try {
      await dispatch(rateOrder({ orderId, rating, comment })).unwrap();
      setShowRatingModal(false);
      Alert.alert('Thank you!', 'Your rating has been submitted');
    } catch (error) {
      Alert.alert('Error', 'Failed to submit rating');
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      placed: '#2196F3',
      confirmed: '#4CAF50',
      preparing: '#FF9800',
      ready_for_pickup: '#9C27B0',
      picked_up: '#00BCD4',
      on_the_way: '#3F51B5',
      delivered: '#4CAF50',
      cancelled: '#F44336',
    };
    return colors[status] || '#666';
  };

  const getStatusText = (status) => {
    const texts = {
      placed: 'Order Placed',
      confirmed: 'Confirmed',
      preparing: 'Preparing',
      ready_for_pickup: 'Ready for Pickup',
      picked_up: 'Picked Up',
      on_the_way: 'On the Way',
      delivered: 'Delivered',
      cancelled: 'Cancelled',
    };
    return texts[status] || status;
  };

  const renderStatusTimeline = () => {
    const statuses = ['placed', 'confirmed', 'preparing', 'ready_for_pickup', 'picked_up', 'on_the_way', 'delivered'];
    const currentStatusIndex = statuses.indexOf(currentOrder?.status);

    return (
      <View style={styles.timeline}>
        {statuses.map((status, index) => {
          const isCompleted = index <= currentStatusIndex;
          const isCurrent = index === currentStatusIndex;
          
          return (
            <View key={status} style={styles.timelineItem}>
              <View style={[
                styles.timelineMarker,
                { backgroundColor: isCompleted ? getStatusColor(status) : '#e0e0e0' }
              ]}>
                {isCompleted && (
                  <Ionicons name="checkmark" size={16} color="white" />
                )}
              </View>
              <Text style={[
                styles.timelineText,
                { color: isCompleted ? '#333' : '#999' }
              ]}>
                {getStatusText(status)}
              </Text>
              {isCurrent && (
                <Text style={styles.currentStatus}>Current</Text>
              )}
            </View>
          );
        })}
      </View>
    );
  };

  if (!currentOrder) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Loading order details...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Map */}
      <View style={styles.mapContainer}>
        <MapView
          style={styles.map}
          region={mapRegion}
          showsUserLocation
          showsMyLocationButton
        >
          {/* Restaurant Marker */}
          {currentOrder.restaurant?.coordinates && (
            <Marker
              coordinate={currentOrder.restaurant.coordinates}
              title={currentOrder.restaurant.name}
              description="Restaurant"
              pinColor="red"
            />
          )}

          {/* Delivery Address Marker */}
          {currentOrder.deliveryAddress?.coordinates && (
            <Marker
              coordinate={currentOrder.deliveryAddress.coordinates}
              title="Delivery Address"
              description={currentOrder.deliveryAddress.street}
              pinColor="green"
            />
          )}

          {/* Delivery Partner Location */}
          {currentOrder.tracking?.currentLocation && (
            <Marker
              coordinate={currentOrder.tracking.currentLocation}
              title="Delivery Partner"
              description="Current Location"
              pinColor="blue"
            >
              <Ionicons name="bicycle" size={24} color="#2196F3" />
            </Marker>
          )}

          {/* Route */}
          {currentOrder.tracking?.route && currentOrder.tracking.route.length > 1 && (
            <Polyline
              coordinates={currentOrder.tracking.route}
              strokeColor="#2196F3"
              strokeWidth={3}
            />
          )}
        </MapView>
      </View>

      {/* Order Details */}
      <View style={styles.detailsContainer}>
        <Card style={styles.orderCard}>
          <Card.Content>
            <View style={styles.orderHeader}>
              <Text style={styles.orderId}>#{currentOrder.orderId}</Text>
              <Chip
                style={[styles.statusChip, { backgroundColor: getStatusColor(currentOrder.status) }]}
                textStyle={styles.statusText}
              >
                {getStatusText(currentOrder.status)}
              </Chip>
            </View>

            <Text style={styles.restaurantName}>
              {currentOrder.restaurant.name}
            </Text>

            <Text style={styles.eta}>
              {currentOrder.estimatedDeliveryTime && (
                `ETA: ${new Date(currentOrder.estimatedDeliveryTime).toLocaleTimeString()}`
              )}
            </Text>

            {/* Timeline */}
            {renderStatusTimeline()}

            {/* Contact Buttons */}
            <View style={styles.contactButtons}>
              <Button
                mode="outlined"
                onPress={() => Alert.alert('Calling Restaurant', currentOrder.restaurant.phone)}
                style={styles.contactButton}
                icon="phone"
              >
                Call Restaurant
              </Button>
              {currentOrder.deliveryPartner && (
                <Button
                  mode="outlined"
                  onPress={() => Alert.alert('Calling Delivery Partner', 'Phone number')}
                  style={styles.contactButton}
                  icon="phone"
                >
                  Call Partner
                </Button>
              )}
            </View>
          </Card.Content>
        </Card>
      </View>

      {/* Rating Modal */}
      <Portal>
        <Modal
          visible={showRatingModal}
          onDismiss={() => setShowRatingModal(false)}
          contentContainerStyle={styles.modalContainer}
        >
          <Text style={styles.modalTitle}>Rate Your Order</Text>
          
          <View style={styles.ratingContainer}>
            {[1, 2, 3, 4, 5].map((star) => (
              <Button
                key={star}
                onPress={() => setRating(star)}
                style={styles.starButton}
              >
                <Ionicons
                  name={star <= rating ? 'star' : 'star-outline'}
                  size={32}
                  color={star <= rating ? '#FFD700' : '#ccc'}
                />
              </Button>
            ))}
          </View>

          <TextInput
            label="Comment (Optional)"
            value={comment}
            onChangeText={setComment}
            multiline
            numberOfLines={3}
            style={styles.commentInput}
          />

          <View style={styles.modalButtons}>
            <Button
              mode="text"
              onPress={() => setShowRatingModal(false)}
              style={styles.modalButton}
            >
              Skip
            </Button>
            <Button
              mode="contained"
              onPress={handleRating}
              style={styles.modalButton}
            >
              Submit
            </Button>
          </View>
        </Modal>
      </Portal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  mapContainer: {
    height: height * 0.5,
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  detailsContainer: {
    flex: 1,
    padding: 16,
  },
  orderCard: {
    elevation: 4,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  orderId: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2196F3',
  },
  statusChip: {
    backgroundColor: '#2196F3',
  },
  statusText: {
    color: 'white',
    fontSize: 12,
  },
  restaurantName: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8,
  },
  eta: {
    color: '#666',
    marginBottom: 16,
  },
  timeline: {
    marginVertical: 16,
  },
  timelineItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  timelineMarker: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  timelineText: {
    flex: 1,
    fontSize: 14,
  },
  currentStatus: {
    fontSize: 12,
    color: '#2196F3',
    fontWeight: 'bold',
  },
  contactButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  contactButton: {
    flex: 1,
    marginHorizontal: 4,
  },
  modalContainer: {
    backgroundColor: 'white',
    padding: 24,
    margin: 20,
    borderRadius: 12,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
  },
  ratingContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 20,
  },
  starButton: {
    marginHorizontal: 4,
  },
  commentInput: {
    marginBottom: 20,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  modalButton: {
    flex: 1,
    marginHorizontal: 8,
  },
});

export default OrderTrackingScreen;