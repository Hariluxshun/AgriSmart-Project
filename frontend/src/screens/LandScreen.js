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
  Linking,
} from 'react-native';
import { landService } from '../services/api';

export default function LandScreen() {
  const [lands, setLands] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({
    location: '',
    size: { value: '', unit: 'acres' },
    soilDetails: { nitrogen: '', phosphorus: '', potassium: '', ph: '' },
    mapLink: '',
  });

  useEffect(() => {
    fetchLands();
  }, []);

  const fetchLands = async () => {
    try {
      const response = await landService.getAll();
      setLands(response.data);
    } catch (error) {
      Alert.alert('Error', 'Failed to fetch lands');
    } finally {
      setLoading(false);
    }
  };

  const createLand = async () => {
    if (!formData.location) {
      Alert.alert('Error', 'Please enter location');
      return;
    }
    try {
      const data = {
        location: formData.location,
        size: { value: parseFloat(formData.size.value) || 0, unit: 'acres' },
        soilDetails: {
          nitrogen: parseFloat(formData.soilDetails.nitrogen) || 0,
          phosphorus: parseFloat(formData.soilDetails.phosphorus) || 0,
          potassium: parseFloat(formData.soilDetails.potassium) || 0,
          ph: parseFloat(formData.soilDetails.ph) || 7,
        },
        mapLink: formData.mapLink,
      };
      await landService.create(data);
      Alert.alert('Success', 'Land added successfully');
      setModalVisible(false);
      resetForm();
      fetchLands();
    } catch (error) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to create land');
    }
  };

  const updateLand = async () => {
    try {
      const data = {
        location: formData.location,
        size: { value: parseFloat(formData.size.value) || 0, unit: 'acres' },
        soilDetails: {
          nitrogen: parseFloat(formData.soilDetails.nitrogen) || 0,
          phosphorus: parseFloat(formData.soilDetails.phosphorus) || 0,
          potassium: parseFloat(formData.soilDetails.potassium) || 0,
          ph: parseFloat(formData.soilDetails.ph) || 7,
        },
        mapLink: formData.mapLink,
      };
      await landService.update(editingItem._id, data);
      Alert.alert('Success', 'Land updated successfully');
      setModalVisible(false);
      setEditingItem(null);
      resetForm();
      fetchLands();
    } catch (error) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to update land');
    }
  };

  const deleteLand = async (id, location) => {
    Alert.alert('Delete Land', `Delete ${location}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await landService.delete(id);
            fetchLands();
          } catch (error) {
            Alert.alert('Error', 'Failed to delete land');
          }
        },
      },
    ]);
  };

  const resetForm = () => {
    setFormData({
      location: '',
      size: { value: '', unit: 'acres' },
      soilDetails: { nitrogen: '', phosphorus: '', potassium: '', ph: '' },
      mapLink: '',
    });
  };

  const openEditModal = (item) => {
    setEditingItem(item);
    setFormData({
      location: item.location,
      size: { value: item.size?.value?.toString() || '', unit: item.size?.unit || 'acres' },
      soilDetails: {
        nitrogen: item.soilDetails?.nitrogen?.toString() || '',
        phosphorus: item.soilDetails?.phosphorus?.toString() || '',
        potassium: item.soilDetails?.potassium?.toString() || '',
        ph: item.soilDetails?.ph?.toString() || '',
      },
      mapLink: item.mapLink || '',
    });
    setModalVisible(true);
  };

  const openMap = (link) => {
    if (!link) return;
    let url = link;
    // If it looks like coordinates, format as Google Maps search
    if (/^[-+]?([1-8]?\d(\.\d+)?|90(\.0+)?),\s*[-+]?(180(\.0+)?|((1[0-7]\d)|([1-9]?\d))(\.\d+)?)$/.test(link.trim())) {
      url = `https://maps.google.com/?q=${link.trim()}`;
    } else if (!link.startsWith('http://') && !link.startsWith('https://')) {
      url = `https://${link}`;
    }
    Linking.openURL(url).catch(err => Alert.alert('Error', 'Could not open map link'));
  };

  const renderLand = ({ item }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.location}>{item.location}</Text>
        <View style={styles.actionButtons}>
          {item.mapLink ? (
            <TouchableOpacity onPress={() => openMap(item.mapLink)} style={styles.actionButton}>
              <Text style={styles.actionText}>📍</Text>
            </TouchableOpacity>
          ) : null}
          <TouchableOpacity onPress={() => openEditModal(item)} style={styles.actionButton}>
            <Text style={styles.actionText}>✏️</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => deleteLand(item._id, item.location)} style={styles.actionButton}>
            <Text style={styles.actionText}>🗑️</Text>
          </TouchableOpacity>
        </View>
      </View>
      <Text style={styles.sizeText}>Size: {item.size?.value} {item.size?.unit}</Text>
      <Text style={styles.soilText}>
        🌱 N:{item.soilDetails?.nitrogen} | P:{item.soilDetails?.phosphorus} | 
        K:{item.soilDetails?.potassium} | pH:{item.soilDetails?.ph}
      </Text>
    </View>
  );

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
        data={lands}
        keyExtractor={(item) => item._id}
        renderItem={renderLand}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>🌾</Text>
            <Text style={styles.emptyText}>No lands added yet</Text>
            <Text style={styles.emptySubtext}>Tap + to add your first land</Text>
          </View>
        }
      />

      <TouchableOpacity style={styles.fab} onPress={() => { setEditingItem(null); resetForm(); setModalVisible(true); }}>
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>

      <Modal animationType="slide" transparent visible={modalVisible}>
        <View style={styles.modalContainer}>
          <ScrollView contentContainerStyle={styles.modalContent}>
            <Text style={styles.modalTitle}>{editingItem ? 'Edit Land' : 'Add New Land'}</Text>

            <TextInput placeholderTextColor="#666"
              style={styles.input}
              placeholder="Location Name"
              value={formData.location}
              onChangeText={(text) => setFormData({ ...formData, location: text })}
            />

            <TextInput placeholderTextColor="#666"
              style={styles.input}
              placeholder="Map Link or Coordinates (Lat,Lng)"
              value={formData.mapLink}
              onChangeText={(text) => setFormData({ ...formData, mapLink: text })}
            />

            <TextInput placeholderTextColor="#666"
              style={styles.input}
              placeholder="Size (acres)"
              keyboardType="numeric"
              value={formData.size.value}
              onChangeText={(text) => setFormData({ ...formData, size: { ...formData.size, value: text } })}
            />

            <Text style={styles.sectionLabel}>Soil Nutrients</Text>

            <TextInput placeholderTextColor="#666"
              style={styles.input}
              placeholder="Nitrogen (N)"
              keyboardType="numeric"
              value={formData.soilDetails.nitrogen}
              onChangeText={(text) => setFormData({ ...formData, soilDetails: { ...formData.soilDetails, nitrogen: text } })}
            />

            <TextInput placeholderTextColor="#666"
              style={styles.input}
              placeholder="Phosphorus (P)"
              keyboardType="numeric"
              value={formData.soilDetails.phosphorus}
              onChangeText={(text) => setFormData({ ...formData, soilDetails: { ...formData.soilDetails, phosphorus: text } })}
            />

            <TextInput placeholderTextColor="#666"
              style={styles.input}
              placeholder="Potassium (K)"
              keyboardType="numeric"
              value={formData.soilDetails.potassium}
              onChangeText={(text) => setFormData({ ...formData, soilDetails: { ...formData.soilDetails, potassium: text } })}
            />

            <TextInput placeholderTextColor="#666"
              style={styles.input}
              placeholder="pH Level"
              keyboardType="numeric"
              value={formData.soilDetails.ph}
              onChangeText={(text) => setFormData({ ...formData, soilDetails: { ...formData.soilDetails, ph: text } })}
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity style={[styles.button, styles.cancelButton]} onPress={() => { setModalVisible(false); setEditingItem(null); resetForm(); }}>
                <Text style={styles.buttonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.button, styles.saveButton]} onPress={editingItem ? updateLand : createLand}>
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
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  location: { fontSize: 18, fontWeight: 'bold', color: '#333' },
  actionButtons: { flexDirection: 'row' },
  actionButton: { padding: 5, marginLeft: 10 },
  actionText: { fontSize: 18 },
  sizeText: { fontSize: 14, color: '#666', marginTop: 5 },
  soilText: { fontSize: 12, color: '#999', marginTop: 5 },
  emptyContainer: { alignItems: 'center', marginTop: 100 },
  emptyIcon: { fontSize: 60, marginBottom: 20 },
  emptyText: { fontSize: 18, color: '#999' },
  emptySubtext: { fontSize: 14, color: '#ccc', marginTop: 10 },
  fab: { position: 'absolute', bottom: 20, right: 20, backgroundColor: '#2e7d32', width: 56, height: 56, borderRadius: 28, justifyContent: 'center', alignItems: 'center', elevation: 5 },
  fabText: { fontSize: 32, color: '#fff' },
  modalContainer: { flex: 1, justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.5)' },
  modalContent: { backgroundColor: '#fff', margin: 20, padding: 20, borderRadius: 15 },
  modalTitle: { fontSize: 24, fontWeight: 'bold', marginBottom: 20, textAlign: 'center', color: '#2e7d32' },
  sectionLabel: { fontSize: 16, fontWeight: 'bold', color: '#333', marginTop: 10, marginBottom: 10 },
  input: { borderWidth: 1, borderColor: '#ddd', padding: 12, borderRadius: 8, marginBottom: 12, fontSize: 16 },
  modalButtons: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 20 },
  button: { flex: 1, padding: 14, borderRadius: 8, marginHorizontal: 5, alignItems: 'center' },
  cancelButton: { backgroundColor: '#999' },
  saveButton: { backgroundColor: '#2e7d32' },
  buttonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
});
