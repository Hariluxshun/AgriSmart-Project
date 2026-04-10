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
} from 'react-native';
import { inventoryService } from '../services/api';

export default function InventoryScreen() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    category: 'fertilizer',
    quantity: '',
    unit: 'kg',
    reorderPoint: '',
  });

  const categories = [
    { label: 'Seed', value: 'seed' },
    { label: 'Fertilizer', value: 'fertilizer' },
    { label: 'Pesticide', value: 'pesticide' },
    { label: 'Herbicide', value: 'herbicide' },
    { label: 'Other', value: 'other' },
  ];

  useEffect(() => {
    fetchItems();
  }, []);

  const fetchItems = async () => {
    try {
      const response = await inventoryService.getAll();
      setItems(response.data);
    } catch (error) {
      Alert.alert('Error', 'Failed to fetch inventory');
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
        ...formData,
        quantity: parseFloat(formData.quantity) || 0,
        reorderPoint: parseFloat(formData.reorderPoint) || 0,
      });
      Alert.alert('Success', 'Item added successfully');
      setModalVisible(false);
      resetForm();
      fetchItems();
    } catch (error) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to create item');
    }
  };

  const updateItem = async () => {
    try {
      await inventoryService.update(editingItem._id, {
        ...formData,
        quantity: parseFloat(formData.quantity) || 0,
        reorderPoint: parseFloat(formData.reorderPoint) || 0,
      });
      Alert.alert('Success', 'Item updated successfully');
      setModalVisible(false);
      setEditingItem(null);
      resetForm();
      fetchItems();
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
            fetchItems();
          } catch (error) {
            Alert.alert('Error', 'Failed to delete item');
          }
        },
      },
    ]);
  };

  const updateQuantity = async (id, currentQuantity, change) => {
    const newQuantity = currentQuantity + change;
    if (newQuantity < 0) {
      Alert.alert('Error', 'Quantity cannot be negative');
      return;
    }
    try {
      await inventoryService.update(id, { quantity: newQuantity });
      fetchItems();
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
    });
  };

  const openEditModal = (item) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      category: item.category,
      quantity: item.quantity?.toString(),
      unit: item.unit,
      reorderPoint: item.reorderPoint?.toString(),
    });
    setModalVisible(true);
  };

  const getCategoryColor = (category) => {
    const colors = { seed: '#4caf50', fertilizer: '#2196f3', pesticide: '#f44336', herbicide: '#ff9800', other: '#9c27b0' };
    return colors[category] || '#999';
  };

  const renderItem = ({ item }) => {
    const isLowStock = item.quantity <= item.reorderPoint;
    return (
      <View style={[styles.card, isLowStock && styles.lowStockCard]}>
        <View style={styles.cardHeader}>
          <View>
            <Text style={styles.itemName}>{item.name}</Text>
            <View style={[styles.categoryBadge, { backgroundColor: getCategoryColor(item.category) }]}>
              <Text style={styles.categoryText}>{item.category}</Text>
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

        <Text style={styles.reorderText}>Reorder at: {item.reorderPoint} {item.unit}</Text>
        {isLowStock && <Text style={styles.lowStockAlert}>⚠️ Low Stock Alert! Please reorder.</Text>}
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
        data={items}
        keyExtractor={(item) => item._id}
        renderItem={renderItem}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>📦</Text>
            <Text style={styles.emptyText}>No inventory items</Text>
            <Text style={styles.emptySubtext}>Tap + to add items</Text>
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

            <TextInput
              style={styles.input}
              placeholder="Item Name"
              value={formData.name}
              onChangeText={(text) => setFormData({ ...formData, name: text })}
            />

            <View style={styles.categoryContainer}>
              {categories.map((cat) => (
                <TouchableOpacity
                  key={cat.value}
                  style={[styles.categoryOption, formData.category === cat.value && styles.categoryOptionSelected]}
                  onPress={() => setFormData({ ...formData, category: cat.value })}
                >
                  <Text style={[styles.categoryOptionText, formData.category === cat.value && styles.categoryOptionTextSelected]}>
                    {cat.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <TextInput
              style={styles.input}
              placeholder="Quantity"
              keyboardType="numeric"
              value={formData.quantity}
              onChangeText={(text) => setFormData({ ...formData, quantity: text })}
            />

            <TextInput
              style={styles.input}
              placeholder="Unit (kg, L, bags)"
              value={formData.unit}
              onChangeText={(text) => setFormData({ ...formData, unit: text })}
            />

            <TextInput
              style={styles.input}
              placeholder="Reorder Point"
              keyboardType="numeric"
              value={formData.reorderPoint}
              onChangeText={(text) => setFormData({ ...formData, reorderPoint: text })}
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity style={[styles.button, styles.cancelButton]} onPress={() => { setModalVisible(false); setEditingItem(null); resetForm(); }}>
                <Text style={styles.buttonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.button, styles.saveButton]} onPress={editingItem ? updateItem : createItem}>
                <Text style={styles.buttonText}>{editingItem ? 'Update' : 'Save'}</Text>
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
  lowStockCard: { borderWidth: 1, borderColor: '#f44336' },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  itemName: { fontSize: 18, fontWeight: 'bold', color: '#333' },
  categoryBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10, marginTop: 5, alignSelf: 'flex-start' },
  categoryText: { color: '#fff', fontSize: 10, fontWeight: 'bold' },
  cardActions: { flexDirection: 'row' },
  editButton: { padding: 5, marginRight: 10 },
  deleteButton: { padding: 5 },
  actionText: { fontSize: 18 },
  quantitySection: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 10 },
  quantityButton: { backgroundColor: '#e0e0e0', width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center' },
  quantityButtonText: { fontSize: 20, fontWeight: 'bold', color: '#333' },
  quantityText: { fontSize: 20, fontWeight: 'bold', marginHorizontal: 20, color: '#2e7d32' },
  reorderText: { fontSize: 12, color: '#666', marginTop: 10, textAlign: 'center' },
  lowStockAlert: { fontSize: 12, color: '#f44336', marginTop: 8, textAlign: 'center', fontWeight: 'bold' },
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
  categoryContainer: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 12 },
  categoryOption: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, backgroundColor: '#e0e0e0', margin: 4 },
  categoryOptionSelected: { backgroundColor: '#2e7d32' },
  categoryOptionText: { fontSize: 12, color: '#333' },
  categoryOptionTextSelected: { color: '#fff' },
  modalButtons: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 20 },
  button: { flex: 1, padding: 14, borderRadius: 8, marginHorizontal: 5, alignItems: 'center' },
  cancelButton: { backgroundColor: '#999' },
  saveButton: { backgroundColor: '#2e7d32' },
  buttonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
});