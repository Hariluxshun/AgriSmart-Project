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
import { inventoryService, landService } from '../services/api';

export default function InventoryScreen() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [lands, setLands] = useState([]);
  
  // Filtering state
  const [activeFilter, setActiveFilter] = useState('All');
  const filterTabs = ['All', 'Seeds', 'Chemicals', 'Tools & Other'];

  const [formData, setFormData] = useState({
    name: '',
    category: 'fertilizer',
    quantity: '',
    unit: 'kg',
    reorderPoint: '',
    expiryDate: '',
    supplierName: '',
    supplierContact: '',
    landId: '',
  });

  const categories = [
    { label: 'Seed', value: 'seed' },
    { label: 'Fertilizer', value: 'fertilizer' },
    { label: 'Pesticide', value: 'pesticide' },
    { label: 'Herbicide', value: 'herbicide' },
    { label: 'Other', value: 'other' },
  ];

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [invRes, landRes] = await Promise.all([
        inventoryService.getAll(),
        landService.getAll()
      ]);
      setItems(invRes.data);
      setLands(landRes.data || []);
    } catch (error) {
      Alert.alert('Error', 'Failed to fetch inventory or lands');
    } finally {
      setLoading(false);
    }
  };

  const createItem = async () => {
    if (!formData.name) {
      Alert.alert('Error', 'Please enter item name');
      return;
    }
    try {
      await inventoryService.create({
        name: formData.name,
        category: formData.category,
        quantity: parseFloat(formData.quantity) || 0,
        unit: formData.unit,
        reorderPoint: parseFloat(formData.reorderPoint) || 0,
        expiryDate: formData.expiryDate ? new Date(formData.expiryDate) : undefined,
        supplier: {
          name: formData.supplierName,
          contact: formData.supplierContact,
        },
        landId: formData.landId || undefined
      });
      Alert.alert('Success', 'Item added successfully');
      setModalVisible(false);
      resetForm();
      fetchData();
    } catch (error) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to create item');
    }
  };

  const updateItem = async () => {
    try {
      await inventoryService.update(editingItem._id, {
        name: formData.name,
        category: formData.category,
        quantity: parseFloat(formData.quantity) || 0,
        unit: formData.unit,
        reorderPoint: parseFloat(formData.reorderPoint) || 0,
        expiryDate: formData.expiryDate ? new Date(formData.expiryDate) : undefined,
        supplier: {
          name: formData.supplierName,
          contact: formData.supplierContact,
        },
        landId: formData.landId || undefined
      });
      Alert.alert('Success', 'Item updated successfully');
      setModalVisible(false);
      setEditingItem(null);
      resetForm();
      fetchData();
    } catch (error) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to update item');
    }
  };

  const deleteItem = async (id, name) => {
    Alert.alert('Delete Item', `Delete ${name}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await inventoryService.delete(id);
            fetchData();
          } catch (error) {
            Alert.alert('Error', 'Failed to delete item');
          }
        },
      },
    ]);
  };

  const updateQuantity = async (id, currentQuantity, change) => {
    const newQuantity = currentQuantity + change;
    // Allow negative stock gracefully if requested
    try {
      await inventoryService.update(id, { quantity: newQuantity });
      fetchData();
    } catch (error) {
      Alert.alert('Error', 'Failed to update quantity');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      category: 'fertilizer',
      quantity: '',
      unit: 'kg',
      reorderPoint: '',
      expiryDate: '',
      supplierName: '',
      supplierContact: '',
      landId: '',
    });
  };

  const openEditModal = (item) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      category: item.category,
      quantity: item.quantity?.toString() || '0',
      unit: item.unit || 'kg',
      reorderPoint: item.reorderPoint?.toString() || '0',
      expiryDate: item.expiryDate ? item.expiryDate.split('T')[0] : '',
      supplierName: item.supplier?.name || '',
      supplierContact: item.supplier?.contact || '',
      landId: item.landId?._id || item.landId || '',
    });
    setModalVisible(true);
  };

  const getCategoryColor = (category) => {
    const colors = { seed: '#4caf50', fertilizer: '#2196f3', pesticide: '#f44336', herbicide: '#ff9800', other: '#9c27b0' };
    return colors[category] || '#999';
  };

  const filteredItems = items.filter(item => {
    if (activeFilter === 'All') return true;
    if (activeFilter === 'Seeds' && item.category === 'seed') return true;
    if (activeFilter === 'Chemicals' && ['fertilizer', 'pesticide', 'herbicide'].includes(item.category)) return true;
    if (activeFilter === 'Tools & Other' && item.category === 'other') return true;
    return false;
  });

  const renderItem = ({ item }) => {
    const isLowStock = item.quantity <= item.reorderPoint;
    const isExpired = item.expiryDate && new Date(item.expiryDate) < new Date();

    return (
      <View style={[styles.card, isLowStock && styles.lowStockCard]}>
        <View style={styles.cardHeader}>
          <View>
            <Text style={styles.itemName}>{item.name}</Text>
            <View style={styles.badgeRow}>
              <View style={[styles.categoryBadge, { backgroundColor: getCategoryColor(item.category) }]}>
                 <Text style={styles.categoryText}>{item.category.toUpperCase()}</Text>
              </View>
              {isExpired && (
                <View style={[styles.categoryBadge, { backgroundColor: '#e53935' }]}>
                   <Text style={styles.categoryText}>EXPIRED</Text>
                </View>
              )}
              {item.landId && (
                <View style={[styles.categoryBadge, { backgroundColor: '#e3f2fd' }]}>
                   <Text style={[styles.categoryText, { color: '#1976d2' }]}>📍 {item.landId?.location || 'Assigned'}</Text>
                </View>
              )}
            </View>
          </View>
          <View style={styles.cardActions}>
            <TouchableOpacity onPress={() => openEditModal(item)} style={styles.editButton}>
              <Text style={styles.actionText}>✏️</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => deleteItem(item._id, item.name)} style={styles.deleteButton}>
              <Text style={styles.actionText}>🗑️</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.quantitySection}>
          <TouchableOpacity style={styles.quantityButton} onPress={() => updateQuantity(item._id, item.quantity, -1)}>
            <Text style={styles.quantityButtonText}>-</Text>
          </TouchableOpacity>
          <Text style={styles.quantityText}>{item.quantity} {item.unit}</Text>
          <TouchableOpacity style={styles.quantityButton} onPress={() => updateQuantity(item._id, item.quantity, 1)}>
            <Text style={styles.quantityButtonText}>+</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.trackingDetails}>
          <Text style={styles.detailText}>Reorder Trigger: {item.reorderPoint} {item.unit}</Text>
          {item.supplier?.name && (
            <Text style={styles.detailText}>Supplier: {item.supplier.name} ({item.supplier.contact || 'N/A'})</Text>
          )}
          {item.expiryDate && (
             <Text style={styles.detailText}>Expires: {new Date(item.expiryDate).toLocaleDateString()}</Text>
          )}
        </View>

        {isLowStock && <Text style={styles.lowStockAlert}>🚨 LOW STOCK ALERT - REORDER SOON</Text>}
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
      {/* Category Filter Bar */}
      <View style={styles.filterContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {filterTabs.map((tab) => (
             <TouchableOpacity 
               key={tab} 
               style={[styles.filterBtn, activeFilter === tab && styles.filterBtnActive]}
               onPress={() => setActiveFilter(tab)}
             >
               <Text style={[styles.filterText, activeFilter === tab && styles.filterTextActive]}>{tab}</Text>
             </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <FlatList
        data={filteredItems}
        keyExtractor={(item) => item._id}
        renderItem={renderItem}
        contentContainerStyle={{ paddingBottom: 80 }}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>📦</Text>
            <Text style={styles.emptyText}>No inventory matched criteria</Text>
          </View>
        }
      />

      <TouchableOpacity style={styles.fab} onPress={() => { setEditingItem(null); resetForm(); setModalVisible(true); }}>
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>

      <Modal animationType="slide" transparent visible={modalVisible}>
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{editingItem ? 'Edit Item' : 'Add Inventory Item'}</Text>
            <ScrollView showsVerticalScrollIndicator={false}>
            
            <Text style={styles.label}>General Details</Text>
            <TextInput placeholderTextColor="#666" style={styles.input} placeholder="Item Name" value={formData.name} onChangeText={(text) => setFormData({ ...formData, name: text })} />

            <View style={styles.categoryContainer}>
              {categories.map((cat) => (
                <TouchableOpacity key={cat.value} style={[styles.categoryOption, formData.category === cat.value && styles.categoryOptionSelected]} onPress={() => setFormData({ ...formData, category: cat.value })}>
                  <Text style={[styles.categoryOptionText, formData.category === cat.value && styles.categoryOptionTextSelected]}>{cat.label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.row}>
               <TextInput placeholderTextColor="#666" style={[styles.input, { flex: 1, marginRight: 5 }]} placeholder="Qty" keyboardType="numeric" value={formData.quantity} onChangeText={(text) => setFormData({ ...formData, quantity: text })} />
               <TextInput placeholderTextColor="#666" style={[styles.input, { flex: 1, marginLeft: 5 }]} placeholder="Unit (kg, L)" value={formData.unit} onChangeText={(text) => setFormData({ ...formData, unit: text })} />
            </View>

            <Text style={styles.label}>Tracking & Reorder</Text>
            <TextInput placeholderTextColor="#666" style={styles.input} placeholder="Low Stock Reorder Point (Minimum Qty)" keyboardType="numeric" value={formData.reorderPoint} onChangeText={(text) => setFormData({ ...formData, reorderPoint: text })} />
            <TextInput placeholderTextColor="#666" style={styles.input} placeholder="Expiry Date (YYYY-MM-DD) - Optional" value={formData.expiryDate} onChangeText={(text) => setFormData({ ...formData, expiryDate: text })} />

            <Text style={styles.label}>Supplier Details</Text>
            <TextInput placeholderTextColor="#666" style={styles.input} placeholder="Supplier Name" value={formData.supplierName} onChangeText={(text) => setFormData({ ...formData, supplierName: text })} />
            <TextInput placeholderTextColor="#666" style={styles.input} placeholder="Supplier Contact Number" value={formData.supplierContact} onChangeText={(text) => setFormData({ ...formData, supplierContact: text })} keyboardType="phone-pad" />

            <Text style={styles.label}>Storage / Plot Location</Text>
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
              <TouchableOpacity style={[styles.button, styles.saveButton]} onPress={editingItem ? updateItem : createItem}>
                <Text style={styles.buttonText}>{editingItem ? 'Update' : 'Save'}</Text>
              </TouchableOpacity>
            </View>
            
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  filterContainer: { backgroundColor: '#fff', paddingVertical: 10, paddingHorizontal: 5, elevation: 2 },
  filterBtn: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: '#e0e0e0', marginHorizontal: 5 },
  filterBtnActive: { backgroundColor: '#2e7d32' },
  filterText: { fontSize: 14, color: '#333', fontWeight: 'bold' },
  filterTextActive: { color: '#fff' },
  
  card: { backgroundColor: '#fff', margin: 10, padding: 15, borderRadius: 12, elevation: 2 },
  lowStockCard: { borderWidth: 2, borderColor: '#f44336', backgroundColor: '#ffebee' },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  itemName: { fontSize: 18, fontWeight: 'bold', color: '#333' },
  badgeRow: { flexDirection: 'row', alignItems: 'center' },
  categoryBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10, marginTop: 5, marginRight: 5 },
  categoryText: { color: '#fff', fontSize: 10, fontWeight: 'bold' },
  cardActions: { flexDirection: 'row' },
  editButton: { padding: 5, marginRight: 10 },
  deleteButton: { padding: 5 },
  actionText: { fontSize: 18 },
  quantitySection: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 10 },
  quantityButton: { backgroundColor: '#e0e0e0', width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center' },
  quantityButtonText: { fontSize: 20, fontWeight: 'bold', color: '#333' },
  quantityText: { fontSize: 20, fontWeight: 'bold', marginHorizontal: 20, color: '#2e7d32' },
  
  trackingDetails: { marginTop: 15, paddingTop: 10, borderTopWidth: 1, borderTopColor: '#eee' },
  detailText: { fontSize: 13, color: '#666', marginBottom: 2 },
  
  lowStockAlert: { fontSize: 14, color: '#d32f2f', marginTop: 10, textAlign: 'center', fontWeight: 'bold', padding: 5, backgroundColor: '#ffcdd2', borderRadius: 5 },
  emptyContainer: { alignItems: 'center', marginTop: 100 },
  emptyIcon: { fontSize: 60, marginBottom: 20 },
  emptyText: { fontSize: 18, color: '#999' },
  
  fab: { position: 'absolute', bottom: 20, right: 20, backgroundColor: '#2e7d32', width: 56, height: 56, borderRadius: 28, justifyContent: 'center', alignItems: 'center', elevation: 5 },
  fabText: { fontSize: 32, color: '#fff' },
  
  modalContainer: { flex: 1, justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.5)' },
  modalContent: { backgroundColor: '#fff', margin: 20, padding: 20, borderRadius: 15, maxHeight: '90%' },
  modalTitle: { fontSize: 24, fontWeight: 'bold', marginBottom: 20, textAlign: 'center', color: '#2e7d32' },
  label: { fontSize: 14, fontWeight: 'bold', color: '#2e7d32', marginTop: 15, marginBottom: 5 },
  input: { borderWidth: 1, borderColor: '#ddd', padding: 12, borderRadius: 8, marginBottom: 12, fontSize: 16, color: '#212121', fontWeight: '500' },
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  categoryContainer: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 12 },
  categoryOption: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, backgroundColor: '#e0e0e0', margin: 4 },
  categoryOptionSelected: { backgroundColor: '#2e7d32' },
  categoryOptionText: { fontSize: 12, color: '#333' },
  categoryOptionTextSelected: { color: '#fff' },
  categoryOptionTextSelected: { color: '#fff' },
  
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
});
