import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Alert,
  RefreshControl,
} from 'react-native';
import {
  Text,
  Card,
  Title,
  Button,
  FAB,
  Chip,
  Divider,
} from 'react-native-paper';
import { useDispatch, useSelector } from 'react-redux';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { fetchOrders } from '../store/orderSlice';
import { useSocket } from '../services/socketService';

const HomeScreen = ({ navigation }) => {
  const dispatch = useDispatch();
  const { user } = useSelector(state => state.auth);
  const { activeOrders, isLoading } = useSelector(state => state.orders);
  const { currentLocation } = useSelector(state => state.location);
  
  const [refreshing, setRefreshing] = useState(false);
  const socket = useSocket();

  const platforms = [
    { name: 'Zomato', icon: '🍽️', color: '#e23744' },
    { name: 'Swiggy', icon: '🛵', color: '#fc8019' },
    { name: 'Blinkit', icon: '⚡', color: '#54b226' },
    { name: 'Zepto', icon: '🛒', color: '#7c3aed' },
    { name: 'Instamart', icon: '📦', color: '#00aa5a' },
    { name: 'Grofers', icon: '🥬', color: '#00b894' },
  ];

  useFocusEffect(
    React.useCallback(() => {
      loadOrders();
    }, [])
  );

  const loadOrders = async () => {
    try {
      await dispatch(fetchOrders({ status: 'active' })).unwrap();
    } catch (error) {
      console.error('Failed to load orders:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadOrders();
    setRefreshing(false);
  };

  const handleTrackOrder = (order) => {
    navigation.navigate('OrderTracking', { orderId: order.orderId });
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

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Welcome Section */}
        <Card style={styles.welcomeCard}>
          <Card.Content>
            <Title>Hello, {user?.name}! 👋</Title>
            <Text style={styles.subtitle}>
              What would you like to order today?
            </Text>
          </Card.Content>
        </Card>

        {/* Quick Access Platforms */}
        <Card style={styles.platformsCard}>
          <Card.Content>
            <Title style={styles.sectionTitle}>Quick Order</Title>
            <View style={styles.platformsGrid}>
              {platforms.map((platform, index) => (
                <Button
                  key={index}
                  mode="outlined"
                  style={[styles.platformButton, { borderColor: platform.color }]}
                  labelStyle={[styles.platformLabel, { color: platform.color }]}
                  onPress={() => navigation.navigate('PlaceOrder', { platform: platform.name.toLowerCase() })}
                >
                  {platform.icon} {platform.name}
                </Button>
              ))}
            </View>
          </Card.Content>
        </Card>

        {/* Active Orders */}
        {activeOrders.length > 0 && (
          <Card style={styles.ordersCard}>
            <Card.Content>
              <Title style={styles.sectionTitle}>Active Orders</Title>
              {activeOrders.map((order) => (
                <Card key={order.orderId} style={styles.orderCard}>
                  <Card.Content>
                    <View style={styles.orderHeader}>
                      <Text style={styles.orderId}>#{order.orderId}</Text>
                      <Chip
                        style={[styles.statusChip, { backgroundColor: getStatusColor(order.status) }]}
                        textStyle={styles.statusText}
                      >
                        {getStatusText(order.status)}
                      </Chip>
                    </View>
                    
                    <Text style={styles.restaurantName}>
                      {order.restaurant.name}
                    </Text>
                    
                    <View style={styles.orderFooter}>
                      <Text style={styles.orderTotal}>
                        ₹{order.pricing.total}
                      </Text>
                      <Button
                        mode="contained"
                        size="small"
                        onPress={() => handleTrackOrder(order)}
                        style={styles.trackButton}
                      >
                        Track Order
                      </Button>
                    </View>
                  </Card.Content>
                </Card>
              ))}
            </Card.Content>
          </Card>
        )}

        {/* Recent Activity */}
        <Card style={styles.activityCard}>
          <Card.Content>
            <Title style={styles.sectionTitle}>Recent Activity</Title>
            {activeOrders.length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons name="restaurant-outline" size={48} color="#ccc" />
                <Text style={styles.emptyStateText}>No recent orders</Text>
                <Text style={styles.emptyStateSubtext}>
                  Start by placing your first order!
                </Text>
              </View>
            ) : (
              <Text style={styles.activityText}>
                You have {activeOrders.length} active order{activeOrders.length !== 1 ? 's' : ''}
              </Text>
            )}
          </Card.Content>
        </Card>
      </ScrollView>

      {/* Floating Action Button */}
      <FAB
        style={styles.fab}
        icon="plus"
        label="New Order"
        onPress={() => navigation.navigate('PlaceOrder')}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollView: {
    flex: 1,
  },
  welcomeCard: {
    margin: 16,
    marginBottom: 8,
    elevation: 2,
  },
  subtitle: {
    color: '#666',
    marginTop: 4,
  },
  platformsCard: {
    margin: 16,
    marginVertical: 8,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    marginBottom: 16,
  },
  platformsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  platformButton: {
    width: '48%',
    marginBottom: 12,
  },
  platformLabel: {
    fontSize: 12,
  },
  ordersCard: {
    margin: 16,
    marginVertical: 8,
    elevation: 2,
  },
  orderCard: {
    marginBottom: 12,
    elevation: 1,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  orderId: {
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
  orderFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  orderTotal: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  trackButton: {
    paddingHorizontal: 8,
  },
  activityCard: {
    margin: 16,
    marginVertical: 8,
    marginBottom: 100,
    elevation: 2,
  },
  activityText: {
    color: '#666',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  emptyStateText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#999',
    marginTop: 12,
  },
  emptyStateSubtext: {
    color: '#ccc',
    marginTop: 4,
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
    backgroundColor: '#2196F3',
  },
});

export default HomeScreen;