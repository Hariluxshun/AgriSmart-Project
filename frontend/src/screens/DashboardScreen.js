import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { financeService } from '../services/api';

export default function DashboardScreen({ navigation }) {
  const [user, setUser] = useState(null);
  const [financeSummary, setFinanceSummary] = useState({ income: 0, expense: 0, profit: 0 });
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    const userData = await AsyncStorage.getItem('user');
    if (userData) setUser(JSON.parse(userData));
    fetchDashboardMetrics();
  };

  const fetchDashboardMetrics = async () => {
     try {
        const plRes = await financeService.getProfitLoss();
        setFinanceSummary(plRes.data);
     } catch (error) {
        console.log("Failed to fetch dashboard metrics");
     }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadUser();
    setRefreshing(false);
  };

  const handleLogout = async () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        onPress: async () => {
          await AsyncStorage.removeItem('token');
          await AsyncStorage.removeItem('user');
          navigation.replace('Login');
        },
      },
    ]);
  };

  const modules = [
    { name: 'Farm Profile', screen: 'Farm', icon: '🌾', color: '#4caf50', description: 'Farmer & Lands' },
    { name: 'Inventory', screen: 'Inventory', icon: '📦', color: '#2196f3', description: 'Track stock levels' },
    { name: 'Machinery', screen: 'Machinery', icon: '🚜', color: '#ff9800', description: 'Manage equipment' },
    { name: 'Tasks', screen: 'Tasks', icon: '✅', color: '#9c27b0', description: 'Assign and track tasks' },
    { name: 'Finance', screen: 'Finance', icon: '💰', color: '#f44336', description: 'Track expenses' },
    { name: 'Labor', screen: 'Labor', icon: '👥', color: '#009688', description: 'Manage workers' },
  ];

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <View style={styles.header}>
        <View>
          <Text style={styles.welcome}>Welcome back,</Text>
          <Text style={styles.userName}>{user?.name || 'Farmer'}!</Text>
        </View>
        <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={[styles.statNumber, {color: '#4caf50'}]}>LKR {(financeSummary.totalIncome || 0).toLocaleString()}</Text>
          <Text style={styles.statLabel}>Revenue</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={[styles.statNumber, {color: '#f44336'}]}>LKR {(financeSummary.totalExpense || 0).toLocaleString()}</Text>
          <Text style={styles.statLabel}>Expenses</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={[styles.statNumber, {color: (financeSummary.netProfit || 0) >= 0 ? '#4caf50' : '#f44336', fontSize: 20}]}>
             LKR {(financeSummary.netProfit || 0).toLocaleString()}
          </Text>
          <Text style={styles.statLabel}>Profit / Loss</Text>
        </View>
      </View>

      <Text style={styles.sectionTitle}>Farm Management</Text>

      <View style={styles.modulesGrid}>
        {modules.map((module, index) => (
          <TouchableOpacity
            key={index}
            style={[styles.moduleCard, { backgroundColor: module.color }]}
            onPress={() => navigation.navigate(module.screen)}
          >
            <Text style={styles.moduleIcon}>{module.icon}</Text>
            <Text style={styles.moduleName}>{module.name}</Text>
            <Text style={styles.moduleDesc}>{module.description}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#2e7d32',
    paddingTop: 50,
  },
  welcome: {
    fontSize: 14,
    color: '#fff',
    opacity: 0.9,
  },
  userName: {
    fontSize: 24,
    color: '#fff',
    fontWeight: 'bold',
  },
  logoutButton: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 8,
  },
  logoutText: {
    color: '#fff',
    fontSize: 14,
  },
  statsContainer: {
    flexDirection: 'row',
    padding: 15,
    justifyContent: 'space-between',
  },
  statCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15,
    alignItems: 'center',
    width: '32%',

    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2e7d32',
  },
  statLabel: {
    fontSize: 14,
    color: '#666',
    marginTop: 5,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    margin: 15,
    color: '#333',
  },
  modulesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 10,
    marginBottom: 20,
  },
  moduleCard: {
    width: '31%',
    margin: '1%',
    padding: 15,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  moduleIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  moduleName: {
    color: '#fff',
    fontSize: 13,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  moduleDesc: {
    color: '#fff',
    fontSize: 10,
    textAlign: 'center',
    marginTop: 4,
    opacity: 0.9,
  },
});
