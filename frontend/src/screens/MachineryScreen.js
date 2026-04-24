import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { machineryService, landService } from '../services/api';

export default function MachineryScreen() {
  const [machinery, setMachinery] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [lands, setLands] = useState([]);

  const [formData, setFormData] = useState({
    name: '',
    model: '',
    serialNumber: '',
    status: 'available',
    purchasePrice: '',
    maintenanceHistory: [],
    landId: '',
  });

  const [newLog, setNewLog] = useState({
    description: '',
    cost: '',
    date: '',
  });

  const statuses = [
    { label: 'Available', value: 'available', color: '#4caf50' },
    { label: 'In Use', value: 'in-use', color: '#2196f3' },
    { label: 'Repairs', value: 'under-repair', color: '#f44336' },
    { label: 'Retired', value: 'decommissioned', color: '#9e9e9e' }
  ];

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [macRes, landRes] = await Promise.all([
        machineryService.getAll(),
        landService.getAll()
      ]);
      setMachinery(macRes.data.all || []);
      setLands(landRes.data || []);
    } catch (error) {
      Alert.alert('Error', 'Failed to fetch machinery or lands');
    } finally {
      setLoading(false);
    }
  };

  const createAsset = async () => {
    if (!formData.name) {
      Alert.alert('Error', 'Please enter equipment name');
      return;
    }
    try {
      await machineryService.create({
        ...formData,
        purchasePrice: parseFloat(formData.purchasePrice) || 0,
      });
      Alert.alert('Success', 'Equipment added successfully');
      setModalVisible(false);
      resetForm();
      fetchData();
    } catch (error) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to create');
    }
  };

  const updateAsset = async () => {
    try {
      await machineryService.update(editingItem._id, {
        ...formData,
        purchasePrice: parseFloat(formData.purchasePrice) || 0,
      });
      Alert.alert('Success', 'Equipment updated successfully');
      setModalVisible(false);
      setEditingItem(null);
      resetForm();
      fetchData();
    } catch (error) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to update');
    }
  };

  const deleteAsset = async (id, name) => {
    Alert.alert('Delete Equipment', `Delete ${name}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive', onPress: async () => {
          try {
            await machineryService.delete(id);
            fetchData();
          } catch (error) {
            Alert.alert('Error', 'Failed to delete equipment');
          }
        }
      },
    ]);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      model: '',
      serialNumber: '',
      status: 'available',
      purchasePrice: '',
      maintenanceHistory: [],
      landId: '',
    });
    setNewLog({ description: '', cost: '', date: '' });
  };

  const openEditModal = (item) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      model: item.model || '',
      serialNumber: item.serialNumber || '',
      status: item.status || 'available',
      purchasePrice: item.purchasePrice ? item.purchasePrice.toString() : '',
      maintenanceHistory: item.maintenanceHistory || [],
      landId: item.landId?._id || item.landId || '',
    });
    setNewLog({ description: '', cost: '', date: '' });
    setModalVisible(true);
  };

  const addMaintenanceLog = () => {
    if (!newLog.description || !newLog.cost || !newLog.date) {
      Alert.alert("Validation", "Please fill description, cost, and date format (YYYY-MM-DD).");
      return;
    }
    const logObj = {
      description: newLog.description,
      cost: parseFloat(newLog.cost) || 0,
      date: new Date(newLog.date)
    };
    setFormData(prev => ({
      ...prev,
      maintenanceHistory: [...prev.maintenanceHistory, logObj]
    }));
    setNewLog({ description: '', cost: '', date: '' });
  };

  const removeMaintenanceLog = (index) => {
    setFormData(prev => {
      const updated = [...prev.maintenanceHistory];
      updated.splice(index, 1);
      return { ...prev, maintenanceHistory: updated };
    });
  };

  const getStatusColor = (status) => {
    const s = statuses.find(x => x.value === status);
    return s ? s.color : '#9e9e9e';
  };

  const renderItem = ({ item }) => {
    const totalMaintenance = item.maintenanceHistory?.reduce((sum, log) => sum + (log.cost || 0), 0) || 0;
    const lastService = item.maintenanceHistory && item.maintenanceHistory.length > 0
      ? new Date(item.maintenanceHistory[item.maintenanceHistory.length - 1].date).toLocaleDateString()
      : 'No records';

    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View>
            <Text style={styles.itemName}>{item.name}</Text>
            <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
              <Text style={styles.statusText}>{item.status.toUpperCase().replace('-', ' ')}</Text>
            </View>
            {item.landId && (
              <View style={[styles.statusBadge, { backgroundColor: '#e3f2fd', marginLeft: 8 }]}>
                <Text style={[styles.statusText, { color: '#1976d2' }]}>📍 {item.landId?.location || 'Assigned'}</Text>
              </View>
            )}
          </View>
          <View style={styles.cardActions}>
            <TouchableOpacity onPress={() => openEditModal(item)} style={styles.editButton}>
              <Text style={styles.actionText}>✏️</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => deleteAsset(item._id, item.name)} style={styles.deleteButton}>
              <Text style={styles.actionText}>🗑️</Text>
            </TouchableOpacity>
          </View>
        </View>

        <Text style={styles.cardDetail}>Model: {item.model || 'N/A'} | SN: {item.serialNumber || 'N/A'}</Text>

        <View style={styles.metricsContainer}>
          <View style={styles.metricBox}>
            <Text style={styles.metricValue}>LKR {totalMaintenance.toFixed(2)}</Text>
            <Text style={styles.metricLabel}>Lifetime Repairs</Text>
          </View>
          <View style={styles.metricBox}>
            <Text style={styles.metricValue}>{lastService}</Text>
            <Text style={styles.metricLabel}>Last Service</Text>
          </View>
        </View>

      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#2e7d32" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={machinery}
        keyExtractor={(item) => item._id}
        renderItem={renderItem}
        contentContainerStyle={{ paddingBottom: 80 }}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>🚜</Text>
            <Text style={styles.emptyText}>No equipment listed</Text>
          </View>
        }
      />

      <TouchableOpacity style={styles.fab} onPress={() => { setEditingItem(null); resetForm(); setModalVisible(true); }}>
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>

      <Modal animationType="slide" transparent visible={modalVisible}>
        <View style={styles.modalContainer}>
          <ScrollView contentContainerStyle={styles.modalContent} showsVerticalScrollIndicator={false}>
            <Text style={styles.modalTitle}>{editingItem ? 'Edit Asset' : 'Add Machinery'}</Text>

            <TextInput placeholderTextColor="#666" style={styles.input} placeholder="Machine Name" value={formData.name} onChangeText={(text) => setFormData({ ...formData, name: text })} />

            <View style={styles.row}>
              <TextInput placeholderTextColor="#666" style={[styles.input, { flex: 1, marginRight: 5 }]} placeholder="Model" value={formData.model} onChangeText={(text) => setFormData({ ...formData, model: text })} />
              <TextInput placeholderTextColor="#666" style={[styles.input, { flex: 1, marginLeft: 5 }]} placeholder="Serial #" value={formData.serialNumber} onChangeText={(text) => setFormData({ ...formData, serialNumber: text })} />
            </View>

            <TextInput placeholderTextColor="#666" style={styles.input} placeholder="Purchase Price (LKR)" keyboardType="numeric" value={formData.purchasePrice} onChangeText={(text) => setFormData({ ...formData, purchasePrice: text })} />

            <Text style={styles.label}>Operational Status</Text>
            <View style={styles.statusContainer}>
              {statuses.map((s) => (
                <TouchableOpacity
                  key={s.value}
                  style={[styles.statusOption, formData.status === s.value && { backgroundColor: s.color }]}
                  onPress={() => setFormData({ ...formData, status: s.value })}
                >
                  <Text style={[styles.statusOptionText, formData.status === s.value && styles.statusOptionTextSelected]}>{s.label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.label}>Primary Service Location (Land Plot)</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.landPillsContainer}>
              {lands.map((land) => (
                <TouchableOpacity
                  key={land._id}
                  style={[styles.landPill, formData.landId === land._id && styles.landPillSelected]}
                  onPress={() => setFormData({ ...formData, landId: land._id })}
                >
                  <Text style={[styles.landPillText, formData.landId === land._id && styles.landPillTextSelected]}>{land.location}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <Text style={styles.labelHeader}>🛠 Maintenance & Fuel Logs</Text>
            {formData.maintenanceHistory.map((log, index) => (
              <View key={index} style={styles.logCard}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.logDesc}>{log.description}</Text>
                  <Text style={styles.logSub}>LKR {log.cost} • {new Date(log.date).toLocaleDateString()}</Text>
                </View>
                <TouchableOpacity onPress={() => removeMaintenanceLog(index)}>
                  <Text style={{ color: '#f44336', fontSize: 20 }}>✖</Text>
                </TouchableOpacity>
              </View>
            ))}

            <View style={styles.addLogBox}>
              <TextInput placeholderTextColor="#999" style={styles.miniInput} placeholder="Repair / Fuel description" value={newLog.description} onChangeText={(t) => setNewLog({ ...newLog, description: t })} />
              <View style={styles.row}>
                <TextInput placeholderTextColor="#999" style={[styles.miniInput, { flex: 1, marginRight: 5 }]} placeholder="Cost (LKR)" keyboardType="numeric" value={newLog.cost} onChangeText={(t) => setNewLog({ ...newLog, cost: t })} />
                <TextInput placeholderTextColor="#999" style={[styles.miniInput, { flex: 1, marginLeft: 5 }]} placeholder="YYYY-MM-DD" value={newLog.date} onChangeText={(t) => setNewLog({ ...newLog, date: t })} />
              </View>
              <TouchableOpacity style={styles.addLogBtn} onPress={addMaintenanceLog}>
                <Text style={{ color: '#fff', fontWeight: 'bold' }}>+ Save Log Entry</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity style={[styles.button, styles.cancelButton]} onPress={() => { setModalVisible(false); }}>
                <Text style={styles.buttonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.button, styles.saveButton]} onPress={editingItem ? updateAsset : createAsset}>
                <Text style={styles.buttonText}>{editingItem ? 'Update' : 'Save'}</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  card: { backgroundColor: '#fff', margin: 10, padding: 15, borderRadius: 12, elevation: 2 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  itemName: { fontSize: 18, fontWeight: 'bold', color: '#333' },
  statusBadge: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12, marginTop: 5, alignSelf: 'flex-start' },
  statusText: { color: '#fff', fontSize: 12, fontWeight: 'bold' },
  cardActions: { flexDirection: 'row' },
  editButton: { padding: 5, marginRight: 10 },
  deleteButton: { padding: 5 },
  actionText: { fontSize: 18 },
  cardDetail: { fontSize: 13, color: '#666', marginTop: 10 },

  metricsContainer: { flexDirection: 'row', marginTop: 15, borderTopWidth: 1, borderTopColor: '#eee', paddingTop: 10 },
  metricBox: { flex: 1, alignItems: 'center' },
  metricValue: { fontSize: 16, fontWeight: 'bold', color: '#2e7d32' },
  metricLabel: { fontSize: 12, color: '#666' },

  emptyContainer: { alignItems: 'center', marginTop: 100 },
  emptyIcon: { fontSize: 60, marginBottom: 20 },
  emptyText: { fontSize: 18, color: '#999' },
  fab: { position: 'absolute', bottom: 20, right: 20, backgroundColor: '#2e7d32', width: 56, height: 56, borderRadius: 28, justifyContent: 'center', alignItems: 'center', elevation: 5 },
  fabText: { fontSize: 32, color: '#fff' },

  modalContainer: { flex: 1, justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.5)' },
  modalContent: { backgroundColor: '#fff', margin: 20, padding: 20, borderRadius: 15, maxHeight: '90%' },
  modalTitle: { fontSize: 24, fontWeight: 'bold', marginBottom: 20, textAlign: 'center', color: '#2e7d32' },

  row: { flexDirection: 'row' },
  input: { borderWidth: 1, borderColor: '#ddd', padding: 12, borderRadius: 8, marginBottom: 12, fontSize: 16, color: '#212121', fontWeight: '500' },
  label: { fontSize: 14, fontWeight: 'bold', color: '#333', marginBottom: 8, marginTop: 8 },
  labelHeader: { fontSize: 18, fontWeight: 'bold', color: '#2196f3', marginTop: 20, marginBottom: 10 },

  statusContainer: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 12 },
  statusOption: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, backgroundColor: '#e0e0e0', margin: 4 },
  statusOptionText: { fontSize: 12, color: '#333', fontWeight: 'bold' },
  statusOptionTextSelected: { color: '#fff' },

  logCard: { flexDirection: 'row', backgroundColor: '#f1f8e9', padding: 10, borderRadius: 8, marginBottom: 5, alignItems: 'center' },
  logDesc: { fontSize: 14, fontWeight: 'bold', color: '#333' },
  logSub: { fontSize: 12, color: '#555' },

  landPillsContainer: { flexDirection: 'row', marginBottom: 15 },
  landPill: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, backgroundColor: '#f0f0f0', marginRight: 8, height: 35, justifyContent: 'center' },
  landPillSelected: { backgroundColor: '#2e7d32' },
  landPillText: { fontSize: 12, color: '#666' },
  landPillTextSelected: { color: '#fff', fontWeight: 'bold' },

  addLogBox: { backgroundColor: '#fafafa', padding: 10, borderRadius: 8, borderWidth: 1, borderColor: '#eee', marginTop: 10 },
  miniInput: { borderWidth: 1, borderColor: '#ddd', padding: 8, borderRadius: 8, marginBottom: 10, fontSize: 14, color: '#212121' },
  addLogBtn: { backgroundColor: '#2196f3', padding: 10, borderRadius: 8, alignItems: 'center' },

  modalButtons: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 30 },
  button: { flex: 1, padding: 14, borderRadius: 8, marginHorizontal: 5, alignItems: 'center' },
  cancelButton: { backgroundColor: '#999' },
  saveButton: { backgroundColor: '#2e7d32' },
  buttonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
});
