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
import { laborService, landService } from '../services/api';

export default function LaborScreen() {
  const [laborers, setLaborers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [payModalVisible, setPayModalVisible] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [lands, setLands] = useState([]);
  const [attendanceModalVisible, setAttendanceModalVisible] = useState(false);
  const [selectedLaborer, setSelectedLaborer] = useState(null);

  const [formData, setFormData] = useState({
    name: '',
    contactNumber: '',
    role: 'field_worker',
    dailyRate: '',
    landId: '',
  });

  const [paymentData, setPaymentData] = useState({
    amount: '',
    description: 'Cash Payment'
  });

  const roles = [
    { label: 'Field Worker', value: 'field_worker' },
    { label: 'Equipment Operator', value: 'equipment_operator' },
    { label: 'Supervisor', value: 'supervisor' },
    { label: 'Harvester', value: 'harvester' },
    { label: 'General', value: 'general' },
  ];

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [laborRes, landRes] = await Promise.all([
        laborService.getAll(),
        landService.getAll()
      ]);
      setLaborers(laborRes.data.active || []);
      setLands(landRes.data || []);
    } catch (error) {
      Alert.alert('Error', 'Failed to fetch laborers or lands');
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
      fetchData();
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
      fetchData();
    } catch (error) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to update laborer');
    }
  };

  const submitPayment = async () => {
    if (!paymentData.amount) return Alert.alert('Error', 'Enter amount to pay');
    try {
      await laborService.pay(editingItem._id, {
        amount: parseFloat(paymentData.amount),
        description: paymentData.description
      });
      Alert.alert('Payment Logged', 'Finance module updated successfully.');
      setPayModalVisible(false);
      setPaymentData({ amount: '', description: 'Cash Payment' });
      fetchData();
    } catch (error) {
      Alert.alert('Error', 'Failed to process payment');
    }
  };

  const markAttendance = async (id, status) => {
    const today = new Date().toISOString().split('T')[0];
    try {
      await laborService.markAttendance(id, { date: today, status });
      Alert.alert('Success', `Attendance marked: ${status.toUpperCase()}`);
      fetchData();
    } catch (error) {
      Alert.alert('Error', 'Failed to mark attendance');
    }
  };

  const exportAttendanceCSV = (item) => {
    if (!item.attendance || item.attendance.length === 0) {
      Alert.alert('No Data', 'No attendance records to export');
      return;
    }

    let csvContent = `Attendance Report for ${item.name}\n`;
    csvContent += `Date,Status,Hours Worked,Task ID\n`;
    
    item.attendance.sort((a, b) => new Date(b.date) - new Date(a.date)).forEach(a => {
      const date = new Date(a.date).toISOString().split('T')[0];
      csvContent += `${date},${a.status},${a.hoursWorked || 'N/A'},${a.taskId || 'General'}\n`;
    });

    Alert.alert('Exporting CSV', 'In a real environment, this would save to your device storage. Logic implemented.');
    console.log('CSV Export Data:', csvContent);
  };

  const deleteLabor = async (id, name) => {
    Alert.alert('Archive Laborer', `Archive ${name}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Archive',
        style: 'destructive',
        onPress: async () => {
          try {
            await laborService.delete(id);
            fetchData();
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
      landId: '',
    });
  };

  const openEditModal = (item) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      contactNumber: item.contactNumber || '',
      role: item.role,
      dailyRate: item.dailyRate.toString(),
      landId: item.landId?._id || item.landId || '',
    });
    setModalVisible(true);
  };

  const openPayModal = (item) => {
    setEditingItem(item);
    setPaymentData({ amount: '', description: 'Cash Payment' });
    setPayModalVisible(true);
  };

  const openAttendanceModal = (item) => {
    setSelectedLaborer(item);
    setAttendanceModalVisible(true);
  };

  const getRoleLabel = (value) => {
    const role = roles.find((r) => r.value === value);
    return role ? role.label : value;
  };

  const renderItem = ({ item }) => {
    // Determine today's current marked attendance
    const todayStr = new Date().toDateString();
    const todaysLog = item.attendance?.find(a => new Date(a.date).toDateString() === todayStr);

    // Calculate Unpaid Wages
    const totalEarned = item.attendance?.reduce((sum, a) => {
      if (a.status === 'present') return sum + item.dailyRate;
      if (a.status === 'half-day') return sum + (item.dailyRate / 2);
      return sum;
    }, 0) || 0;

    const totalPaid = item.paymentHistory?.reduce((sum, p) => sum + p.amount, 0) || 0;
    const unpaidBalance = totalEarned - totalPaid;

    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View>
            <Text style={styles.name}>{item.name}</Text>
            <View style={styles.roleBadge}>
              <Text style={styles.roleText}>{getRoleLabel(item.role)}</Text>
            </View>
            {item.landId && (
              <View style={[styles.roleBadge, { backgroundColor: '#e3f2fd', marginLeft: 5 }]}>
                <Text style={[styles.roleText, { color: '#1976d2' }]}>📍 {item.landId?.location || 'Assigned Land'}</Text>
              </View>
            )}
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

        {item.contactNumber ? (
          <Text style={styles.contact}>📱 {item.contactNumber}</Text>
        ) : null}

        <View style={styles.financeMetrics}>
          <View style={styles.financeBox}>
            <Text style={styles.rateText}>LKR {item.dailyRate}</Text>
            <Text style={styles.rateLabel}>Daily Rate</Text>
          </View>
          <View style={[styles.financeBox, unpaidBalance > 0 && { backgroundColor: '#ffebee' }]}>
            <Text style={[styles.rateText, unpaidBalance > 0 && { color: '#d32f2f' }]}>LKR {unpaidBalance.toFixed(2)}</Text>
            <Text style={styles.rateLabel}>Unpaid Wages</Text>
          </View>
        </View>

        <View style={styles.actionRow}>
          <TouchableOpacity style={styles.payBtn} onPress={() => openPayModal(item)}>
            <Text style={styles.payBtnText}>💵 Submit Payment</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.payBtn, {backgroundColor: '#1976d2', marginLeft: 8}]} onPress={() => openAttendanceModal(item)}>
            <Text style={styles.payBtnText}>📅 History</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.attendanceSection}>
          <Text style={styles.attendanceTitle}>Mark Today's Attendance</Text>
          <View style={styles.attendanceButtons}>
            <TouchableOpacity
              style={[
                styles.attendanceBtn,
                styles.presentBtn,
                todaysLog?.status === 'present' && styles.activeAttendanceBtn
              ]}
              onPress={() => markAttendance(item._id, 'present')}
            >
              <Text style={styles.attendanceBtnText}>Present</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.attendanceBtn,
                styles.halfDayBtn,
                todaysLog?.status === 'half-day' && styles.activeAttendanceBtn
              ]}
              onPress={() => markAttendance(item._id, 'half-day')}
            >
              <Text style={styles.attendanceBtnText}>Half-Day</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.attendanceBtn,
                styles.absentBtn,
                todaysLog?.status === 'absent' && styles.activeAttendanceBtn
              ]}
              onPress={() => markAttendance(item._id, 'absent')}
            >
              <Text style={styles.attendanceBtnText}>Absent</Text>
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
        renderItem={renderItem}
        contentContainerStyle={{ paddingBottom: 80 }}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>👷‍♂️</Text>
            <Text style={styles.emptyText}>No laborers found</Text>
            <Text style={styles.emptySubtext}>Tap + to add workforce</Text>
          </View>
        }
      />

      <TouchableOpacity
        style={styles.fab}
        onPress={() => {
          setEditingItem(null);
          resetForm();
          setModalVisible(true);
        }}
      >
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>

      {/* CREATE / EDIT Modal */}
      <Modal animationType="slide" transparent visible={modalVisible}>
        <View style={styles.modalContainer}>
          <ScrollView contentContainerStyle={styles.modalContent}>
            <Text style={styles.modalTitle}>
              {editingItem ? 'Edit Laborer' : 'Add Laborer'}
            </Text>

            <TextInput placeholderTextColor="#666" style={styles.input} placeholder="Worker Name" value={formData.name} onChangeText={(text) => setFormData({ ...formData, name: text })} />
            <TextInput placeholderTextColor="#666" style={styles.input} placeholder="Contact Number (Optional)" keyboardType="phone-pad" value={formData.contactNumber} onChangeText={(text) => setFormData({ ...formData, contactNumber: text })} />

            <Text style={styles.label}>Role</Text>
            <View style={styles.roleContainer}>
              {roles.map((role) => (
                <TouchableOpacity key={role.value} style={[styles.roleOption, formData.role === role.value && styles.roleOptionSelected]} onPress={() => setFormData({ ...formData, role: role.value })}>
                  <Text style={[styles.roleOptionText, formData.role === role.value && styles.roleOptionTextSelected]}>{role.label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.label}>Daily Wage / Rate</Text>
            <TextInput placeholderTextColor="#666" style={styles.input} placeholder="Daily Rate (LKR)" keyboardType="numeric" value={formData.dailyRate} onChangeText={(text) => setFormData({ ...formData, dailyRate: text })} />

            <Text style={styles.label}>Assigned Land</Text>
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

      {/* ATTENDANCE HISTORY Modal */}
      <Modal animationType="slide" transparent visible={attendanceModalVisible}>
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeaderInline}>
              <Text style={styles.modalTitleInline}>Attendance: {selectedLaborer?.name}</Text>
              <TouchableOpacity onPress={() => setAttendanceModalVisible(false)}>
                <Text style={{fontSize: 24, color: '#999'}}>✖</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={styles.exportBtnInline} onPress={() => exportAttendanceCSV(selectedLaborer)}>
              <Text style={styles.exportBtnText}>📥 Export Attendance CSV</Text>
            </TouchableOpacity>

            <ScrollView style={{maxHeight: 400}}>
              {selectedLaborer?.attendance?.sort((a, b) => new Date(b.date) - new Date(a.date)).map((a, idx) => (
                <View key={idx} style={styles.historyRow}>
                   <Text style={styles.historyDate}>{new Date(a.date).toLocaleDateString()}</Text>
                   <View style={[styles.statusTag, 
                      a.status === 'present' ? {backgroundColor: '#e8f5e9'} : 
                      a.status === 'half-day' ? {backgroundColor: '#fff3e0'} : {backgroundColor: '#ffebee'}
                   ]}>
                      <Text style={[styles.statusTagText, 
                        a.status === 'present' ? {color: '#2e7d32'} : 
                        a.status === 'half-day' ? {color: '#f57c00'} : {color: '#d32f2f'}
                      ]}>{a.status.toUpperCase()}</Text>
                   </View>
                </View>
              ))}
              {(!selectedLaborer?.attendance || selectedLaborer.attendance.length === 0) && (
                <Text style={styles.emptyLogText}>No attendance records found.</Text>
              )}
            </ScrollView>

            <TouchableOpacity style={[styles.button, styles.saveButton, {marginTop: 20}]} onPress={() => setAttendanceModalVisible(false)}>
              <Text style={styles.buttonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* PAY Modal */}
      <Modal animationType="slide" transparent visible={payModalVisible}>
        <View style={styles.modalContainer}>
          <View style={styles.payModalContent}>
            <Text style={styles.modalTitle}>Submit Pay for {editingItem?.name}</Text>

            <Text style={styles.label}>Tending Amount</Text>
            <TextInput placeholderTextColor="#666" style={styles.input} keyboardType="numeric" placeholder="Amount (LKR)" value={paymentData.amount} onChangeText={(text) => setPaymentData({ ...paymentData, amount: text })} />

            <Text style={styles.label}>Payment Note / Memo</Text>
            <TextInput placeholderTextColor="#666" style={styles.input} placeholder="e.g. Cash, Weekly Clearance" value={paymentData.description} onChangeText={(text) => setPaymentData({ ...paymentData, description: text })} />

            <View style={styles.modalButtons}>
              <TouchableOpacity style={[styles.button, styles.cancelButton]} onPress={() => setPayModalVisible(false)}>
                <Text style={styles.buttonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.button, styles.saveButton]} onPress={submitPayment}>
                <Text style={styles.buttonText}>Confirm Payment</Text>
              </TouchableOpacity>
            </View>
          </View>
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
  name: { fontSize: 18, fontWeight: 'bold', color: '#333' },
  roleBadge: { backgroundColor: '#e8f5e9', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12, marginTop: 5, alignSelf: 'flex-start' },
  roleText: { color: '#2e7d32', fontSize: 12, fontWeight: 'bold' },
  cardActions: { flexDirection: 'row' },
  editButton: { padding: 5, marginRight: 10 },
  deleteButton: { padding: 5 },
  actionText: { fontSize: 18 },
  contact: { fontSize: 14, color: '#666', marginTop: 8 },

  financeMetrics: { flexDirection: 'row', marginTop: 15, justifyContent: 'space-between' },
  financeBox: { flex: 1, alignItems: 'center', padding: 10, backgroundColor: '#f5f5f5', borderRadius: 8, marginHorizontal: 2 },
  rateText: { fontSize: 18, fontWeight: 'bold', color: '#2e7d32' },
  rateLabel: { fontSize: 12, color: '#666' },

  payBtn: { flex: 1, backgroundColor: '#2e7d32', padding: 12, borderRadius: 8, marginTop: 10, alignItems: 'center' },
  payBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 15 },
  actionRow: { flexDirection: 'row' },

  attendanceSection: { marginTop: 15, paddingTop: 15, borderTopWidth: 1, borderTopColor: '#eee' },
  attendanceTitle: { fontSize: 13, fontWeight: 'bold', color: '#333', marginBottom: 10, textAlign: 'center' },
  attendanceButtons: { flexDirection: 'row', justifyContent: 'space-between' },
  attendanceBtn: { flex: 1, paddingVertical: 10, borderRadius: 8, alignItems: 'center', marginHorizontal: 3, borderWidth: 1 },
  presentBtn: { borderColor: '#4caf50', backgroundColor: '#e8f5e9' },
  halfDayBtn: { borderColor: '#ff9800', backgroundColor: '#fff3e0' },
  absentBtn: { borderColor: '#f44336', backgroundColor: '#ffebee' },
  activeAttendanceBtn: { borderWidth: 3, elevation: 2 },
  attendanceBtnText: { fontSize: 12, fontWeight: 'bold', color: '#333' },

  emptyContainer: { alignItems: 'center', marginTop: 100 },
  emptyIcon: { fontSize: 60, marginBottom: 20 },
  emptyText: { fontSize: 18, color: '#999' },
  emptySubtext: { fontSize: 14, color: '#ccc', marginTop: 10 },
  fab: { position: 'absolute', bottom: 20, right: 20, backgroundColor: '#2e7d32', width: 56, height: 56, borderRadius: 28, justifyContent: 'center', alignItems: 'center', elevation: 5 },
  fabText: { fontSize: 32, color: '#fff' },
  modalContainer: { flex: 1, justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.5)' },
  modalContent: { backgroundColor: '#fff', margin: 20, padding: 20, borderRadius: 15, maxHeight: '90%' },
  payModalContent: { backgroundColor: '#fff', margin: 20, padding: 20, borderRadius: 15 },
  modalTitle: { fontSize: 24, fontWeight: 'bold', marginBottom: 20, textAlign: 'center', color: '#2e7d32' },
  input: { borderWidth: 1, borderColor: '#ddd', padding: 12, borderRadius: 8, marginBottom: 12, fontSize: 16, color: '#212121', fontWeight: '500' },
  label: { fontSize: 14, fontWeight: 'bold', color: '#333', marginBottom: 8, marginTop: 8 },
  roleContainer: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 12 },
  roleOption: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, backgroundColor: '#e0e0e0', margin: 4 },
  roleOptionSelected: { backgroundColor: '#2e7d32' },
  roleOptionText: { fontSize: 12, color: '#333' },
  roleOptionTextSelected: { color: '#fff' },
  roleOptionTextSelected: { color: '#fff' },

  landPillsContainer: { flexDirection: 'row', marginBottom: 15 },
  landPill: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, backgroundColor: '#f0f0f0', marginRight: 8, height: 35, justifyContent: 'center' },
  landPillSelected: { backgroundColor: '#2e7d32' },
  landPillText: { fontSize: 12, color: '#666' },
  landPillTextSelected: { color: '#fff', fontWeight: 'bold' },

  modalButtons: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 20 },
  button: { flex: 1, padding: 14, borderRadius: 8, marginHorizontal: 5, alignItems: 'center' },
  cancelButton: { backgroundColor: '#999' },
  saveButton: { backgroundColor: '#2e7d32' },
  buttonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },

  modalHeaderInline: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  modalTitleInline: { fontSize: 18, fontWeight: 'bold', color: '#2e7d32' },
  exportBtnInline: { backgroundColor: '#2e7d32', padding: 12, borderRadius: 8, marginBottom: 15, alignItems: 'center' },
  exportBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 14 },
  historyRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#eee' },
  historyDate: { fontSize: 14, color: '#333', fontWeight: '500' },
  statusTag: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  statusTagText: { fontSize: 10, fontWeight: 'bold' },
  emptyLogText: { textAlign: 'center', color: '#999', marginTop: 20, fontStyle: 'italic' },
});
