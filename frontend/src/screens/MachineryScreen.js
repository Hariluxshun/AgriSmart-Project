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
import { machineryService } from '../services/api';

export default function MachineryScreen() {
  const [machinery, setMachinery] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    model: '',
    serialNumber: '',
    status: 'available',
  });

  useEffect(() => {
    fetchMachinery();
  }, []);

  const fetchMachinery = async () => {
    try {
      const response = await machineryService.getAll();
      setMachinery(response.data.all || []);
    } catch (error) {
      Alert.alert('Error', 'Failed to fetch machinery');
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
      await machineryService.create(formData);
      Alert.alert('Success', 'Equipment added successfully');
      setModalVisible(false);
      resetForm();
      fetchMachinery();
    } catch (error) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to create equipment');
    }
  };

  const updateAsset = async () => {
    try {
      await machineryService.update(editingItem._id, formData);
      Alert.alert('Success', 'Equipment updated successfully');
      setModalVisible(false);
      setEditingItem(null);
      resetForm();
      fetchMachinery();
    } catch (error) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to update equipment');
    }
  };

  const deleteAsset = async (id, name) => {
    Alert.alert('Delete Equipment', `Delete ${name}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await machineryService.delete(id);
            fetchMachinery();
          } catch (error) {
            Alert.alert('Error', 'Failed to delete equipment');
          }
        },
      },
    ]);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      model: '',
      serialNumber: '',
      status: 'available',
    });
  };

  const openEditModal = (item) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      model: item.model || '',
      serialNumber: item.serialNumber || '',
      status: item.status,
    });
    setModalVisible(true);
  };

  const getStatusStyle = (status) => {
    const styles = {
      available: { bg: '#4caf50', text: 'Available' },
      'in-use': { bg: '#ff9800', text: 'In Use' },
      'under-repair': { bg: '#f44336', text: 'Under Repair' },
      decommissioned: { bg: '#9e9e9e', text: 'Decommissioned' },
    };
    return styles[status] || styles.available;
  };

  const renderItem = ({ item }) => {
    const statusStyle = getStatusStyle(item.status);
    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View>
            <Text style={styles.machineryName}>{item.name}</Text>
            {item.model && <Text style={styles.machineryModel}>Model: {item.model}</Text>}
            {item.serialNumber && <Text style={styles.machinerySerial}>SN: {item.serialNumber}</Text>}
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
        <View style={[styles.statusBadge, { backgroundColor: statusStyle.bg }]}>
          <Text style={styles.statusText}>{statusStyle.text}</Text>
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
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>🚜</Text>
            <Text style={styles.emptyText}>No equipment added</Text>
            <Text style={styles.emptySubtext}>Tap + to add equipment</Text>
          </View>
        }
      />

      <TouchableOpacity style={styles.fab} onPress={() => { setEditingItem(null); resetForm(); setModalVisible(true); }}>
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>

      <Modal animationType="slide" transparent visible={modalVisible}>
        <View style={styles.modalContainer}>
          <ScrollView contentContainerStyle={styles.modalContent}>
            <Text style={styles.modalTitle}>{editingItem ? 'Edit Equipment' : 'Add Equipment'}</Text>

            <TextInput
              style={styles.input}
              placeholder="Equipment Name"
              value={formData.name}
              onChangeText={(text) => setFormData({ ...formData, name: text })}
            />

            <TextInput
              style={styles.input}
              placeholder="Model (optional)"
              value={formData.model}
              onChangeText={(text) => setFormData({ ...formData, model: text })}
            />

            <TextInput
              style={styles.input}
              placeholder="Serial Number (optional)"
              value={formData.serialNumber}
              onChangeText={(text) => setFormData({ ...formData, serialNumber: text })}
            />

            <Text style={styles.label}>Status</Text>
            <View style={styles.statusContainer}>
              {['available', 'in-use', 'under-repair', 'decommissioned'].map((status) => {
                const statusStyle = getStatusStyle(status);
                return (
                  <TouchableOpacity
                    key={status}
                    style={[styles.statusOption, formData.status === status && { backgroundColor: statusStyle.bg }]}
                    onPress={() => setFormData({ ...formData, status })}
                  >
                    <Text style={[styles.statusOptionText, formData.status === status && styles.statusOptionTextSelected]}>
                      {statusStyle.text}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity style={[styles.button, styles.cancelButton]} onPress={() => { setModalVisible(false); setEditingItem(null); resetForm(); }}>
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
  machineryName: { fontSize: 18, fontWeight: 'bold', color: '#333' },
  machineryModel: { fontSize: 14, color: '#666', marginTop: 4 },
  machinerySerial: { fontSize: 12, color: '#999', marginTop: 2 },
  cardActions: { flexDirection: 'row' },
  editButton: { padding: 5, marginRight: 10 },
  deleteButton: { padding: 5 },
  actionText: { fontSize: 18 },
  statusBadge: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 20, alignSelf: 'flex-start', marginTop: 10 },
  statusText: { color: '#fff', fontSize: 12, fontWeight: 'bold' },
  emptyContainer: { alignItems: 'center', marginTop: 100 },
  emptyIcon: { fontSize: 60, marginBottom: 20 },
  emptyText: { fontSize: 18, color: '#999' },
  emptySubtext: { fontSize: 14, color: '#ccc', marginTop: 10 },
  fab: { position: 'absolute', bottom: 20, right: 20, backgroundColor: '#2e7d32', width: 56, height: 56, borderRadius: 28, justifyContent: 'center', alignItems: 'center', elevation: 5 },
  fabText: { fontSize: 32, color: '#fff' },
  modalContainer: { flex: 1, justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.5)' },
  modalContent: { backgroundColor: '#fff', margin: 20, padding: 20, borderRadius: 15 },
  modalTitle: { fontSize: 24, fontWeight: 'bold', marginBottom: 20, textAlign: 'center', color: '#2e7d32' },
  input: { borderWidth: 1, borderColor: '#ddd', padding: 12, borderRadius: 8, marginBottom: 12, fontSize: 16 },
  label: { fontSize: 14, fontWeight: 'bold', color: '#333', marginBottom: 8, marginTop: 8 },
  statusContainer: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 12 },
  statusOption: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, backgroundColor: '#e0e0e0', margin: 4 },
  statusOptionText: { fontSize: 12, color: '#333' },
  statusOptionTextSelected: { color: '#fff' },
  modalButtons: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 20 },
  button: { flex: 1, padding: 14, borderRadius: 8, marginHorizontal: 5, alignItems: 'center' },
  cancelButton: { backgroundColor: '#999' },
  saveButton: { backgroundColor: '#2e7d32' },
  buttonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
});