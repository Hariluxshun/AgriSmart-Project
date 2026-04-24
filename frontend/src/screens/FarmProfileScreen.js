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
import MapView, { Marker } from 'react-native-maps';
import * as Location from 'expo-location';
import { landService, authService, inventoryService, machineryService, laborService } from '../services/api';

export default function FarmProfileScreen() {
  const [activeTab, setActiveTab] = useState('profile');
  const [loading, setLoading] = useState(true);

  // Profile State
  const [profile, setProfile] = useState({ name: '', email: '', phone: '' });
  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '' });
  const [showPasswordModal, setShowPasswordModal] = useState(false);

  // Lands State
  const [lands, setLands] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [machinery, setMachinery] = useState([]);
  const [laborers, setLaborers] = useState([]);
  const [totalArea, setTotalArea] = useState(0);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  
  // Land Form State
  const [formData, setFormData] = useState({
    location: '',
    size: { value: '', unit: 'acres' },
    soilDetails: { nitrogen: '', phosphorus: '', potassium: '', ph: '' },
    soilType: 'other',
    status: 'active',
    mapLink: '', // also holds GPS
  });

  // Map Picker State
  const [mapPickerVisible, setMapPickerVisible] = useState(false);
  const [pickedLocation, setPickedLocation] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [profileRes, landsRes, invRes, macRes, labRes] = await Promise.all([
        authService.getMe(),
        landService.getAll(),
        inventoryService.getAll(),
        machineryService.getAll(),
        laborService.getAll(),
      ]);

      setProfile({
        name: profileRes.data.name || '',
        email: profileRes.data.email || '',
        phone: profileRes.data.phone || '',
      });

      const fetchedLands = landsRes.data || [];
      setLands(fetchedLands);
      setInventory(invRes.data || []);
      setMachinery(macRes.data.all || []); // Handling machinery grouped response
      setLaborers(labRes.data.all || []); // Handling labor grouped response

      // Calculate Total Land Area (Assuming all in acres for simplicity)
      const total = fetchedLands.reduce((sum, land) => sum + (land.size?.value || 0), 0);
      setTotalArea(total);

    } catch (error) {
      Alert.alert('Error', 'Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  // Profile Methods
  const updateProfile = async () => {
    try {
      await authService.updateProfile(profile);
      Alert.alert('Success', 'Profile updated successfully');
      fetchData();
    } catch (error) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to update profile');
    }
  };

  const updatePassword = async () => {
    if (!passwordForm.currentPassword || !passwordForm.newPassword) {
      Alert.alert('Error', 'Please fill all password fields');
      return;
    }
    try {
      await authService.updatePassword(passwordForm);
      Alert.alert('Success', 'Password updated successfully');
      setShowPasswordModal(false);
      setPasswordForm({ currentPassword: '', newPassword: '' });
    } catch (error) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to update password');
    }
  };

  // Land Methods
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
        soilType: formData.soilType,
        status: formData.status,
        mapLink: formData.mapLink,
      };
      await landService.create(data);
      Alert.alert('Success', 'Land added successfully');
      setModalVisible(false);
      resetForm();
      fetchData();
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
        soilType: formData.soilType,
        status: formData.status,
        mapLink: formData.mapLink,
      };
      await landService.update(editingItem._id, data);
      Alert.alert('Success', 'Land updated successfully');
      setModalVisible(false);
      setEditingItem(null);
      resetForm();
      fetchData();
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
            fetchData();
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
      soilType: 'other',
      status: 'active',
      mapLink: '',
    });
    setPickedLocation(null);
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
      soilType: item.soilType || 'other',
      status: item.status || 'active',
      mapLink: item.mapLink || '',
    });
    setModalVisible(true);
  };

  const openMap = (link) => {
    if (!link) return;
    let url = link;
    if (/^[-+]?([1-8]?\d(\.\d+)?|90(\.0+)?),\s*[-+]?(180(\.0+)?|((1[0-7]\d)|([1-9]?\d))(\.\d+)?)$/.test(link.trim())) {
      url = `https://maps.google.com/?q=${link.trim()}`;
    } else if (!link.startsWith('http://') && !link.startsWith('https://')) {
      url = `https://${link}`;
    }
    Linking.openURL(url).catch(err => Alert.alert('Error', 'Could not open map link'));
  };

  const handleMapPick = (event) => {
    setPickedLocation(event.nativeEvent.coordinate);
  };

  const fetchCurrentLocation = async () => {
    try {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Permission to access location was denied');
        return;
      }

      setLoading(true);
      let location = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      const currentLoc = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude
      };
      
      setPickedLocation(currentLoc);
      setFormData({ 
        ...formData, 
        mapLink: `${currentLoc.latitude.toFixed(6)}, ${currentLoc.longitude.toFixed(6)}` 
      });
      
    } catch (error) {
      Alert.alert('Error', 'Could not fetch location. Ensure GPS is enabled.');
    } finally {
      setLoading(false);
    }
  };

  const confirmMapPick = () => {
    if (pickedLocation) {
      setFormData({ ...formData, mapLink: `${pickedLocation.latitude}, ${pickedLocation.longitude}` });
    }
    setMapPickerVisible(false);
  };

  const renderProfileTab = () => (
    <ScrollView style={styles.tabContent}>
      <View style={styles.statsContainer}>
        <View style={styles.statBox}>
          <Text style={styles.statValue}>{lands.length}</Text>
          <Text style={styles.statLabel}>Total Plots</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statValue}>{totalArea}</Text>
          <Text style={styles.statLabel}>Total Acres</Text>
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionLabel}>Edit Profile</Text>
        
        <TextInput placeholderTextColor="#666"
          style={styles.input}
          placeholder="Name"
          value={profile.name}
          onChangeText={(text) => setProfile({ ...profile, name: text })}
        />
        <TextInput placeholderTextColor="#666"
          style={styles.input}
          placeholder="Email"
          value={profile.email}
          onChangeText={(text) => setProfile({ ...profile, email: text })}
          keyboardType="email-address"
        />
        <TextInput placeholderTextColor="#666"
          style={styles.input}
          placeholder="Phone Number"
          value={profile.phone}
          onChangeText={(text) => setProfile({ ...profile, phone: text })}
          keyboardType="phone-pad"
        />
        
        <TouchableOpacity style={styles.saveButton} onPress={updateProfile}>
          <Text style={styles.buttonText}>Save Profile</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.dangerButton} onPress={() => setShowPasswordModal(true)}>
        <Text style={styles.buttonText}>Change Password</Text>
      </TouchableOpacity>

      <Modal animationType="slide" transparent visible={showPasswordModal}>
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Change Password</Text>
            <TextInput placeholderTextColor="#666"
              style={styles.input}
              placeholder="Current Password"
              secureTextEntry
              value={passwordForm.currentPassword}
              onChangeText={(text) => setPasswordForm({ ...passwordForm, currentPassword: text })}
            />
            <TextInput placeholderTextColor="#666"
              style={styles.input}
              placeholder="New Password"
              secureTextEntry
              value={passwordForm.newPassword}
              onChangeText={(text) => setPasswordForm({ ...passwordForm, newPassword: text })}
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity style={[styles.button, styles.cancelButton]} onPress={() => setShowPasswordModal(false)}>
                <Text style={styles.buttonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.button, styles.saveButton]} onPress={updatePassword}>
                <Text style={styles.buttonText}>Update</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );

  const renderLandItem = ({ item }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View>
          <Text style={styles.location}>{item.location}</Text>
          <View style={styles.badgeRow}>
            <Text style={[styles.badge, { backgroundColor: item.status === 'active' ? '#4caf50' : '#ff9800' }]}>
              {item.status.toUpperCase()}
            </Text>
            {item.soilType && item.soilType !== 'other' && (
              <Text style={[styles.badge, { backgroundColor: '#795548', marginLeft: 5 }]}>
                {item.soilType.toUpperCase()}
              </Text>
            )}
          </View>
        </View>
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

      <View style={styles.resourceSummary}>
         <View style={styles.resourceBadge}><Text style={styles.resourceText}>📦 {inventory.filter(i => (i.landId?._id || i.landId) === item._id).length} Items</Text></View>
         <View style={styles.resourceBadge}><Text style={styles.resourceText}>🚜 {machinery.filter(m => (m.landId?._id || m.landId) === item._id).length} Assets</Text></View>
         <View style={styles.resourceBadge}><Text style={styles.resourceText}>👷‍♂️ {laborers.filter(l => (l.landId?._id || l.landId) === item._id).length} Workers</Text></View>
      </View>
    </View>
  );

  const renderLandsTab = () => (
    <View style={{ flex: 1 }}>
      <FlatList
        data={lands}
        keyExtractor={(item) => item._id}
        renderItem={renderLandItem}
        contentContainerStyle={{ paddingBottom: 80 }}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>🌾</Text>
            <Text style={styles.emptyText}>No plots added yet</Text>
            <Text style={styles.emptySubtext}>Tap + to trace your first land</Text>
          </View>
        }
      />

      <TouchableOpacity style={styles.fab} onPress={() => { setEditingItem(null); resetForm(); setModalVisible(true); }}>
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>

      {/* Map Picker Modal */}
      <Modal animationType="slide" visible={mapPickerVisible}>
        <View style={{ flex: 1 }}>
          <MapView
            style={{ flex: 1 }}
            onPress={handleMapPick}
            region={
              pickedLocation 
                ? { latitude: pickedLocation.latitude, longitude: pickedLocation.longitude, latitudeDelta: 0.05, longitudeDelta: 0.05 }
                : { latitude: 6.9271, longitude: 79.8612, latitudeDelta: 0.5, longitudeDelta: 0.5 }
            }
          >
            {pickedLocation && <Marker coordinate={pickedLocation} />}
          </MapView>
          <View style={styles.mapActions}>
             <TouchableOpacity style={[styles.button, styles.cancelButton, {flex: 0, paddingHorizontal: 15}]} onPress={() => setMapPickerVisible(false)}>
               <Text style={styles.buttonText}>Cancel</Text>
             </TouchableOpacity>
             <TouchableOpacity style={[styles.button, {backgroundColor: '#2196f3', flex: 0, paddingHorizontal: 15}]} onPress={fetchCurrentLocation}>
               <Text style={styles.buttonText}>My Location</Text>
             </TouchableOpacity>
             <TouchableOpacity style={[styles.button, styles.saveButton, {flex: 0, paddingHorizontal: 15}]} onPress={confirmMapPick}>
               <Text style={styles.buttonText}>Confirm GPS</Text>
             </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Edit Land Modal */}
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

            <View style={styles.mapInputRow}>
              <TextInput placeholderTextColor="#666"
                style={[styles.input, { flex: 1, marginBottom: 0, marginRight: 10 }]}
                placeholder="Map Link or GPS (Lat,Lng)"
                value={formData.mapLink}
                onChangeText={(text) => setFormData({ ...formData, mapLink: text })}
              />
              <TouchableOpacity style={[styles.pickMapBtn, {marginRight: 8}]} onPress={fetchCurrentLocation}>
                <Text style={{fontSize: 20}}>📍</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.pickMapBtn} onPress={() => setMapPickerVisible(true)}>
                <Text style={{fontSize: 20}}>🗺️</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.gridRow}>
               <TextInput placeholderTextColor="#666"
                 style={[styles.input, { flex: 1, marginRight: 5 }]}
                 placeholder="Size (acres)"
                 keyboardType="numeric"
                 value={formData.size.value}
                 onChangeText={(text) => setFormData({ ...formData, size: { ...formData.size, value: text } })}
               />
               <TextInput placeholderTextColor="#666"
                 style={[styles.input, { flex: 1, marginLeft: 5 }]}
                 placeholder="Status (active/fallow)"
                 value={formData.status}
                 onChangeText={(text) => setFormData({ ...formData, status: text })}
               />
            </View>
            
            <Text style={styles.sectionLabel}>Soil Type</Text>
            <View style={styles.categoryContainer}>
              {['clay', 'sandy', 'red soil', 'other'].map((type) => (
                <TouchableOpacity
                  key={type}
                  style={[
                    styles.categoryOption,
                    (formData.soilType === type || (type === 'other' && !['clay', 'sandy', 'red soil'].includes(formData.soilType) && formData.soilType !== '')) && styles.categoryOptionSelected
                  ]}
                  onPress={() => {
                    if (type === 'other') {
                      if (['clay', 'sandy', 'red soil'].includes(formData.soilType)) {
                        setFormData({ ...formData, soilType: '' });
                      }
                    } else {
                      setFormData({ ...formData, soilType: type });
                    }
                  }}
                >
                  <Text style={[
                    styles.categoryOptionText,
                    (formData.soilType === type || (type === 'other' && !['clay', 'sandy', 'red soil'].includes(formData.soilType) && formData.soilType !== '')) && styles.categoryOptionTextSelected
                  ]}>
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {(!['clay', 'sandy', 'red soil'].includes(formData.soilType) || formData.soilType === 'other') && (
              <TextInput 
                placeholderTextColor="#666"
                style={styles.input}
                placeholder="Type soil type here..."
                value={['clay', 'sandy', 'red soil'].includes(formData.soilType) ? '' : formData.soilType}
                onChangeText={(text) => setFormData({ ...formData, soilType: text })}
              />
            )}

            <Text style={styles.sectionLabel}>Soil Nutrients</Text>
            <View style={styles.gridRow}>
              <TextInput placeholderTextColor="#666"
                style={[styles.input, styles.gridInput]}
                placeholder="N"
                keyboardType="numeric"
                value={formData.soilDetails.nitrogen}
                onChangeText={(text) => setFormData({ ...formData, soilDetails: { ...formData.soilDetails, nitrogen: text } })}
              />
              <TextInput placeholderTextColor="#666"
                style={[styles.input, styles.gridInput]}
                placeholder="P"
                keyboardType="numeric"
                value={formData.soilDetails.phosphorus}
                onChangeText={(text) => setFormData({ ...formData, soilDetails: { ...formData.soilDetails, phosphorus: text } })}
              />
              <TextInput placeholderTextColor="#666"
                style={[styles.input, styles.gridInput]}
                placeholder="K"
                keyboardType="numeric"
                value={formData.soilDetails.potassium}
                onChangeText={(text) => setFormData({ ...formData, soilDetails: { ...formData.soilDetails, potassium: text } })}
              />
              <TextInput placeholderTextColor="#666"
                style={[styles.input, styles.gridInput]}
                placeholder="pH"
                keyboardType="numeric"
                value={formData.soilDetails.ph}
                onChangeText={(text) => setFormData({ ...formData, soilDetails: { ...formData.soilDetails, ph: text } })}
              />
            </View>

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

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#2e7d32" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.tabHeader}>
        <TouchableOpacity 
          style={[styles.tabBtn, activeTab === 'profile' && styles.tabBtnActive]} 
          onPress={() => setActiveTab('profile')}>
          <Text style={[styles.tabBtnText, activeTab === 'profile' && styles.tabBtnTextActive]}>Farmer Profile</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tabBtn, activeTab === 'lands' && styles.tabBtnActive]} 
          onPress={() => setActiveTab('lands')}>
          <Text style={[styles.tabBtnText, activeTab === 'lands' && styles.tabBtnTextActive]}>Land Plots</Text>
        </TouchableOpacity>
      </View>
      
      {activeTab === 'profile' ? renderProfileTab() : renderLandsTab()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  tabHeader: { flexDirection: 'row', backgroundColor: '#fff', elevation: 2 },
  tabBtn: { flex: 1, padding: 15, alignItems: 'center', borderBottomWidth: 3, borderBottomColor: 'transparent' },
  tabBtnActive: { borderBottomColor: '#2e7d32' },
  tabBtnText: { fontSize: 16, color: '#666', fontWeight: 'bold' },
  tabBtnTextActive: { color: '#2e7d32' },
  tabContent: { padding: 15 },
  statsContainer: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 15 },
  statBox: { flex: 1, backgroundColor: '#2e7d32', padding: 20, borderRadius: 10, alignItems: 'center', marginHorizontal: 5 },
  statValue: { fontSize: 24, fontWeight: 'bold', color: '#fff' },
  statLabel: { fontSize: 14, color: '#e8f5e9', marginTop: 5 },
  
  card: { backgroundColor: '#fff', margin: 10, padding: 15, borderRadius: 12, elevation: 2 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  location: { fontSize: 18, fontWeight: 'bold', color: '#333' },
  badgeRow: { flexDirection: 'row', marginTop: 4 },
  badge: { color: '#fff', fontSize: 10, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 10, fontWeight: 'bold' },
  actionButtons: { flexDirection: 'row' },
  actionButton: { padding: 5, marginLeft: 10 },
  actionText: { fontSize: 18 },
  sizeText: { fontSize: 14, color: '#666', marginTop: 5 },
  soilText: { fontSize: 12, color: '#999', marginTop: 5 },
  
  resourceSummary: { flexDirection: 'row', marginTop: 12, borderTopWidth: 1, borderTopColor: '#f0f0f0', paddingTop: 10 },
  resourceBadge: { backgroundColor: '#f5f5f5', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, marginRight: 8 },
  resourceText: { fontSize: 11, fontWeight: 'bold', color: '#555' },

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
  input: { borderWidth: 1, borderColor: '#ddd', padding: 12, borderRadius: 8, marginBottom: 12, fontSize: 16, color: '#212121', fontWeight: '500' },
  gridRow: { flexDirection: 'row', justifyContent: 'space-between' },
  gridInput: { flex: 1, marginHorizontal: 2 },
  mapInputRow: { flexDirection: 'row', marginBottom: 12, alignItems: 'center' },
  pickMapBtn: { backgroundColor: '#e0e0e0', padding: 12, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  
  modalButtons: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 20 },
  button: { flex: 1, padding: 14, borderRadius: 8, marginHorizontal: 5, alignItems: 'center' },
  cancelButton: { backgroundColor: '#999' },
  saveButton: { backgroundColor: '#2e7d32', paddingVertical: 14 },
  dangerButton: { backgroundColor: '#f44336', padding: 14, borderRadius: 8, alignItems: 'center', margin: 10 },
  buttonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },

  mapActions: { position: 'absolute', bottom: 20, left: 20, right: 20, flexDirection: 'row', justifyContent: 'space-between' },

  categoryContainer: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 12 },
  categoryOption: { paddingHorizontal: 15, paddingVertical: 10, borderRadius: 20, backgroundColor: '#e0e0e0', margin: 4 },
  categoryOptionSelected: { backgroundColor: '#2e7d32' },
  categoryOptionText: { fontSize: 14, color: '#333', fontWeight: 'bold' },
  categoryOptionTextSelected: { color: '#fff' },
});
