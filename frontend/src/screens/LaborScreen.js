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
import { laborService } from '../services/api';

export default function LaborScreen() {
  const [laborers, setLaborers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    contactNumber: '',
    role: 'field_worker',
    dailyRate: '',
  });

  const roles = [
    { label: 'Field Worker', value: 'field_worker' },
    { label: 'Equipment Operator', value: 'equipment_operator' },
    { label: 'Supervisor', value: 'supervisor' },
    { label: 'Harvester', value: 'harvester' },
    { label: 'General', value: 'general' },
  ];

  useEffect(() => {
    fetchLaborers();
  }, []);

  const fetchLaborers = async () => {
    try {
      const response = await laborService.getAll();
      setLaborers(response.data.active || []);
    } catch (error) {
      Alert.alert('Error', 'Failed to fetch laborers');
    } finally {
      setLoading(false);
    }
  };

  const createLabor = async () => {
    if (!formData.name || !formData.dailyRate) {
      Alert.alert('Error', 'Please fill all required fields');
      return;
    }
    try {
      await laborService.create({
        ...formData,
        dailyRate: parseFloat(formData.dailyRate),
      });
      Alert.alert('Success', 'Laborer added successfully');
      setModalVisible(false);
      resetForm();
      fetchLaborers();
    } catch (error) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to create laborer');
    }
  };

  const updateLabor = async () => {
    try {
      await laborService.update(editingItem._id, {
        ...formData,
        dailyRate: parseFloat(formData.dailyRate),
      });
      Alert.alert('Success', 'Laborer updated successfully');
      setModalVisible(false);
      setEditingItem(null);
      resetForm();
      fetchLaborers();
    } catch (error) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to update laborer');
    }
  };

  const markAttendance = async (id, status) => {
    const today = new Date().toISOString().split('T')[0];
    try {
      await laborService.markAttendance(id, { date: today, status });
      Alert.alert('Success', `Marked as ${status}`);
      fetchLaborers();
    } catch (error) {
      Alert.alert('Error', 'Failed to mark attendance');
    }
  };

  const deleteLabor = async (id, name) => {
    Alert.alert('Archive Laborer', `Archive ${name}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Archive',
        onPress: async () => {
          try {
            await laborService.delete(id);
            fetchLaborers();
          } catch (error) {
            Alert.alert('Error', 'Failed to archive laborer');
          }
        },
      },
    ]);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      contactNumber: '',
      role: 'field_worker',
      dailyRate: '',
    });
  };

  const openEditModal = (item) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      contactNumber: item.contactNumber || '',
      role: item.role,
      dailyRate: item.dailyRate?.toString(),
    });
    setModalVisible(true);
  };

  const getRoleLabel = (role) => {
    const r = roles.find(r => r.value === role);
    return r ? r.label : role;
  };

  const renderLaborer = ({ item }) => {
    const todayAttendance = item.attendance?.find(a => a.date === new Date().toISOString().split('T')[0]);
    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View>
            <Text style={styles.laborName}>{item.name}</Text>
            <Text style={styles.laborRole}>{getRoleLabel(item.role)}</Text>
            <Text style={styles.laborRate}>LKR {item.dailyRate}/day</Text>
            {item.contactNumber && <Text style={styles.laborContact}>📞 {item.contactNumber}</Text>}
          </View>
          <View style={styles.cardActions}>
            <TouchableOpacity onPress={() => openEditModal(item)} style={styles.editButton}>
              <Text style={styles.actionText}>✏️</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => deleteLabor(item._id, item.name)} style={styles.deleteButton}>
              <Text style={styles.actionText}>🗑️</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.attendanceSection}>
          <Text style={styles.attendanceLabel}>Today's Attendance:</Text>
          <View style={styles.attendanceButtons}>
            <TouchableOpacity
              style={[styles.attendanceButton, styles.presentButton, todayAttendance?.status === 'present' && styles.activeButton]}
              onPress={() => markAttendance(item._id, 'present')}
            >
              <Text style={styles.attendanceButtonText}>✓ Present</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.attendanceButton, styles.absentButton, todayAttendance?.status === 'absent' && styles.activeButton]}
              onPress={() => markAttendance(item._id, 'absent')}
            >
              <Text style={styles.attendanceButtonText}>✗ Absent</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.attendanceButton, styles.halfDayButton, todayAttendance?.status === 'half-day' && styles.activeButton]}
              onPress={() => markAttendance(item._id, 'half-day')}
            >
              <Text style={styles.attendanceButtonText}>½ Half Day</Text>
            </TouchableOpacity>
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
        data={laborers}
        keyExtractor={(item) => item._id}
        renderItem={renderLaborer}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>👥</Text>
            <Text style={styles.emptyText}>No laborers added</Text>
            <Text style={styles.emptySubtext}>Tap + to add workers</Text>
          </View>
        }
      />

      <TouchableOpacity style={styles.fab} onPress={() => { setEditingItem(null); resetForm(); setModalVisible(true); }}>
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>

      <Modal animationType="slide" transparent visible={modalVisible}>
        <View style={styles.modalContainer}>
          <ScrollView contentContainerStyle={styles.modalContent}>
            <Text style={styles.modalTitle}>{editingItem ? 'Edit Laborer' : 'Add Laborer'}</Text>

            <TextInput
              style={styles.input}
              placeholder="Full Name *"
              value={formData.name}
              onChangeText={(text) => setFormData({ ...formData, name: text })}
            />

            <TextInput
              style={styles.input}
              placeholder="Contact Number"
              keyboardType="phone-pad"
              value={formData.contactNumber}
              onChangeText={(text) => setFormData({ ...formData, contactNumber: text })}
            />

            <Text style={styles.label}>Role</Text>
            <View style={styles.roleContainer}>
              {roles.map((role) => (
                <TouchableOpacity
                  key={role.value}
                  style={[styles.roleOption, formData.role === role.value && styles.roleOptionSelected]}
                  onPress={() => setFormData({ ...formData, role: role.value })}
                >
                  <Text style={[styles.roleOptionText, formData.role === role.value && styles.roleOptionTextSelected]}>
                    {role.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <TextInput
              style={styles.input}
              placeholder="Daily Rate (LKR) *"
              keyboardType="numeric"
              value={formData.dailyRate}
              onChangeText={(text) => setFormData({ ...formData, dailyRate: text })}
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity style={[styles.button, styles.cancelButton]} onPress={() => { setModalVisible(false); setEditingItem(null); resetForm(); }}>
                <Text style={styles.buttonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.button, styles.saveButton]} onPress={editingItem ? updateLabor : createLabor}>
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
  laborName: { fontSize: 18, fontWeight: 'bold', color: '#333' },
  laborRole: { fontSize: 14, color: '#795548', marginTop: 4 },
  laborRate: { fontSize: 14, fontWeight: 'bold', color: '#2e7d32', marginTop: 4 },
  laborContact: { fontSize: 12, color: '#666', marginTop: 4 },
  cardActions: { flexDirection: 'row' },
  editButton: { padding: 5, marginRight: 10 },
  deleteButton: { padding: 5 },
  actionText: { fontSize: 18 },
  attendanceSection: { marginTop: 15, paddingTop: 10, borderTopWidth: 1, borderTopColor: '#e0e0e0' },
  attendanceLabel: { fontSize: 12, color: '#666', marginBottom: 8 },
  attendanceButtons: { flexDirection: 'row', gap: 10 },
  attendanceButton: { paddingHorizontal: 15, paddingVertical: 8, borderRadius: 8, marginRight: 10 },
  presentButton: { backgroundColor: '#e0e0e0' },
  absentButton: { backgroundColor: '#e0e0e0' },
  halfDayButton: { backgroundColor: '#e0e0e0' },
  activeButton: { opacity: 1 },
  attendanceButtonText: { fontSize: 12, fontWeight: 'bold', color: '#333' },
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
  roleContainer: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 12 },
  roleOption: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, backgroundColor: '#e0e0e0', margin: 4 },
  roleOptionSelected: { backgroundColor: '#2e7d32' },
  roleOptionText: { fontSize: 12, color: '#333' },
  roleOptionTextSelected: { color: '#fff' },
  modalButtons: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 20 },
  button: { flex: 1, padding: 14, borderRadius: 8, marginHorizontal: 5, alignItems: 'center' },
  cancelButton: { backgroundColor: '#999' },
  saveButton: { backgroundColor: '#2e7d32' },
  buttonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
});