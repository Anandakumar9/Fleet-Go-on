import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Alert,
  Switch,
} from 'react-native';
import {
  Text,
  Card,
  Title,
  Button,
  Chip,
  FAB,
  Divider,
} from 'react-native-paper';
import { useDispatch, useSelector } from 'react-redux';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { fetchDashboard, toggleOnlineStatus } from '../store/partnerSlice';
import { useSocket } from '../services/socketService';

const DashboardScreen = ({ navigation }) => {
  const dispatch = useDispatch();
  const { user } = useSelector(state => state.auth);
  const { dashboard, isOnline, isLoading } = useSelector(state => state.partner);
  
  const [refreshing, setRefreshing] = useState(false);
  const socket = useSocket();

  useFocusEffect(
    React.useCallback(() => {
      loadDashboard();
    }, [])
  );

  const loadDashboard = async () => {
    try {
      await dispatch(fetchDashboard()).unwrap();
    } catch (error) {
      console.error('Failed to load dashboard:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadDashboard();
    setRefreshing(false);
  };

  const handleToggleStatus = async () => {
    try {
      await dispatch(toggleOnlineStatus()).unwrap();
      Alert.alert(
        'Status Updated',
        `You are now ${!isOnline ? 'online' : 'offline'}`
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to update status');
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      confirmed: '#4CAF50',
      preparing: '#FF9800',
      ready_for_pickup: '#9C27B0',
      picked_up: '#00BCD4',
      on_the_way: '#3F51B5',
    };
    return colors[status] || '#666';
  };

  const getStatusText = (status) => {
    const texts = {
      confirmed: 'Confirmed',
      preparing: 'Preparing',
      ready_for_pickup: 'Ready for Pickup',
      picked_up: 'Picked Up',
      on_the_way: 'On the Way',
    };
    return texts[status] || status;
  };

  const stats = dashboard?.stats || {};
  const activeOrders = dashboard?.activeOrders || [];

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Header Card */}
        <Card style={styles.headerCard}>
          <Card.Content>
            <View style={styles.headerContent}>
              <View>
                <Title>Welcome, {user?.name}! 🚀</Title>
                <Text style={styles.subtitle}>
                  {isOnline ? 'You are online and ready for orders' : 'You are offline'}
                </Text>
              </View>
              <View style={styles.statusToggle}>
                <Text style={styles.statusLabel}>
                  {isOnline ? 'Online' : 'Offline'}
                </Text>
                <Switch
                  value={isOnline}
                  onValueChange={handleToggleStatus}
                  trackColor={{ false: '#767577', true: '#4CAF50' }}
                  thumbColor={isOnline ? '#fff' : '#f4f3f4'}
                />
              </View>
            </View>
          </Card.Content>
        </Card>

        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          <Card style={styles.statCard}>
            <Card.Content style={styles.statContent}>
              <Ionicons name="bicycle" size={32} color="#2196F3" />
              <Text style={styles.statNumber}>{stats.todayOrders || 0}</Text>
              <Text style={styles.statLabel}>Today's Orders</Text>
            </Card.Content>
          </Card>

          <Card style={styles.statCard}>
            <Card.Content style={styles.statContent}>
              <Ionicons name="wallet" size={32} color="#4CAF50" />
              <Text style={styles.statNumber}>₹{stats.todayEarnings || 0}</Text>
              <Text style={styles.statLabel}>Today's Earnings</Text>
            </Card.Content>
          </Card>

          <Card style={styles.statCard}>
            <Card.Content style={styles.statContent}>
              <Ionicons name="star" size={32} color="#FFD700" />
              <Text style={styles.statNumber}>{stats.rating?.average || 0}</Text>
              <Text style={styles.statLabel}>Your Rating</Text>
            </Card.Content>
          </Card>

          <Card style={styles.statCard}>
            <Card.Content style={styles.statContent}>
              <Ionicons name="checkmark-circle" size={32} color="#9C27B0" />
              <Text style={styles.statNumber}>{stats.completedOrders || 0}</Text>
              <Text style={styles.statLabel}>Completed</Text>
            </Card.Content>
          </Card>
        </View>

        {/* Earnings Card */}
        <Card style={styles.earningsCard}>
          <Card.Content>
            <Title>Earnings</Title>
            <View style={styles.earningsContent}>
              <View style={styles.earningsItem}>
                <Text style={styles.earningsLabel}>Total Earnings</Text>
                <Text style={styles.earningsAmount}>₹{stats.earnings?.total || 0}</Text>
              </View>
              <View style={styles.earningsItem}>
                <Text style={styles.earningsLabel}>Pending</Text>
                <Text style={styles.earningsAmount}>₹{stats.earnings?.pending || 0}</Text>
              </View>
            </View>
            <Button
              mode="outlined"
              onPress={() => navigation.navigate('Earnings')}
              style={styles.earningsButton}
            >
              View Details
            </Button>
          </Card.Content>
        </Card>

        {/* Active Orders */}
        {activeOrders.length > 0 && (
          <Card style={styles.ordersCard}>
            <Card.Content>
              <Title>Active Orders ({activeOrders.length})</Title>
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
                      📍 {order.restaurant.name}
                    </Text>
                    
                    <Text style={styles.customerInfo}>
                      👤 {order.customer.name} • {order.customer.phone}
                    </Text>
                    
                    <View style={styles.orderFooter}>
                      <Text style={styles.orderTotal}>
                        ₹{order.pricing.total}
                      </Text>
                      <Button
                        mode="contained"
                        size="small"
                        onPress={() => navigation.navigate('OrderDetails', { orderId: order.orderId })}
                        style={styles.actionButton}
                      >
                        View Details
                      </Button>
                    </View>
                  </Card.Content>
                </Card>
              ))}
            </Card.Content>
          </Card>
        )}

        {/* Empty State */}
        {activeOrders.length === 0 && isOnline && (
          <Card style={styles.emptyCard}>
            <Card.Content style={styles.emptyContent}>
              <Ionicons name="time-outline" size={64} color="#ccc" />
              <Text style={styles.emptyTitle}>Waiting for Orders</Text>
              <Text style={styles.emptySubtitle}>
                You'll receive notifications when new orders are available
              </Text>
            </Card.Content>
          </Card>
        )}

        {!isOnline && (
          <Card style={styles.offlineCard}>
            <Card.Content style={styles.emptyContent}>
              <Ionicons name="power" size={64} color="#f44336" />
              <Text style={styles.emptyTitle}>You're Offline</Text>
              <Text style={styles.emptySubtitle}>
                Turn on your status to start receiving orders
              </Text>
            </Card.Content>
          </Card>
        )}
      </ScrollView>

      {/* Floating Action Button */}
      {isOnline && (
        <FAB
          style={styles.fab}
          icon="plus"
          label="New Orders"
          onPress={() => navigation.navigate('AvailableOrders')}
        />
      )}
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
  headerCard: {
    margin: 16,
    marginBottom: 8,
    elevation: 2,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  subtitle: {
    color: '#666',
    marginTop: 4,
  },
  statusToggle: {
    alignItems: 'center',
  },
  statusLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  statCard: {
    width: '48%',
    margin: '1%',
    elevation: 2,
  },
  statContent: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  earningsCard: {
    margin: 16,
    marginVertical: 8,
    elevation: 2,
  },
  earningsContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 12,
  },
  earningsItem: {
    alignItems: 'center',
  },
  earningsLabel: {
    fontSize: 14,
    color: '#666',
  },
  earningsAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4CAF50',
    marginTop: 4,
  },
  earningsButton: {
    marginTop: 8,
  },
  ordersCard: {
    margin: 16,
    marginVertical: 8,
    elevation: 2,
  },
  orderCard: {
    marginTop: 12,
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
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  customerInfo: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
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
  actionButton: {
    paddingHorizontal: 8,
  },
  emptyCard: {
    margin: 16,
    marginVertical: 8,
    elevation: 2,
  },
  offlineCard: {
    margin: 16,
    marginVertical: 8,
    elevation: 2,
  },
  emptyContent: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '500',
    color: '#666',
    marginTop: 16,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    marginTop: 8,
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
    backgroundColor: '#2196F3',
  },
});

export default DashboardScreen;