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
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { financeService, landService } from '../services/api';

export default function FinanceScreen() {
  const [transactions, setTransactions] = useState([]);
  const [profitLoss, setProfitLoss] = useState(null);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [transactionType, setTransactionType] = useState('expense');
  const [lands, setLands] = useState([]);
  const [activeLandFilter, setActiveLandFilter] = useState('All');
  const [formData, setFormData] = useState({
    type: 'expense',
    category: 'other',
    amount: '',
    description: '',
    date: new Date().toISOString().split('T')[0],
    landId: '',
  });

  const categories = {
    income: ['harvest_sale', 'equipment_sale', 'other_income'],
    expense: ['seed', 'fertilizer', 'labor', 'fuel', 'repair', 'equipment', 'other'],
  };

  const categoryLabels = {
    seed: 'Seed',
    fertilizer: 'Fertilizer',
    labor: 'Labor',
    fuel: 'Fuel',
    repair: 'Repair',
    equipment: 'Equipment',
    harvest_sale: 'Harvest Sale',
    equipment_sale: 'Equipment Sale',
    other_income: 'Other Income',
    other: 'Other',
  };

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [transactionsRes, profitLossRes, landRes] = await Promise.all([
        financeService.getTransactions(),
        financeService.getProfitLoss(),
        landService.getAll(),
      ]);
      setTransactions(transactionsRes.data);
      setProfitLoss(profitLossRes.data);
      setLands(landRes.data || []);
    } catch (error) {
      Alert.alert('Error', 'Failed to fetch financial data');
    } finally {
      setLoading(false);
    }
  };

  const createTransaction = async () => {
    if (!formData.amount) {
      Alert.alert('Error', 'Please enter amount');
      return;
    }
    try {
      await financeService.createTransaction({
        ...formData,
        amount: parseFloat(formData.amount),
        type: transactionType,
      });
      Alert.alert('Success', 'Transaction added successfully');
      setModalVisible(false);
      resetForm();
      fetchData();
    } catch (error) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to create transaction');
    }
  };

  const updateTransaction = async () => {
    if (!formData.amount) {
      Alert.alert('Error', 'Please enter amount');
      return;
    }
    try {
      await financeService.updateTransaction(editingItem._id, {
        ...formData,
        amount: parseFloat(formData.amount),
        type: transactionType,
      });
      Alert.alert('Success', 'Transaction updated successfully');
      setModalVisible(false);
      setEditingItem(null);
      resetForm();
      fetchData();
    } catch (error) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to update transaction');
    }
  };

  const openEditModal = (item) => {
    setEditingItem(item);
    setTransactionType(item.type);
    setFormData({
      type: item.type,
      category: item.category || 'other',
      amount: item.amount?.toString() || '',
      description: item.description || '',
      date: item.date ? new Date(item.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
      landId: item.landId?._id || item.landId || '',
    });
    setModalVisible(true);
  };

  const deleteTransaction = async (id) => {
    Alert.alert('Delete', 'Delete this transaction?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await financeService.deleteTransaction(id);
            fetchData();
          } catch (error) {
            Alert.alert('Error', 'Failed to delete transaction');
          }
        },
      },
    ]);
  };

  const resetForm = () => {
    setFormData({
      type: transactionType,
      category: 'other',
      amount: '',
      description: '',
      date: new Date().toISOString().split('T')[0],
      landId: '',
    });
  };

  const exportCSV = async () => {
     try {
       let csvContent = "Date,Type,Category,Description,Amount\n";
       transactions.forEach(t => {
          csvContent += `${new Date(t.date).toISOString().split('T')[0]},${t.type},${t.category},${(t.description || '').replace(',',' ')},${t.amount}\n`;
       });
       
       const fileUri = FileSystem.documentDirectory + "Finance_Export.csv";
       await FileSystem.writeAsStringAsync(fileUri, csvContent, { encoding: FileSystem.EncodingType.UTF8 });
       
       if (await Sharing.isAvailableAsync()) {
          await Sharing.shareAsync(fileUri);
       } else {
          Alert.alert('Export Failed', 'Sharing operations not supported on this device simulation.');
       }
     } catch(err) {
       Alert.alert('Error', 'Failed to generate CSV documentation');
     }
  };

  const renderTransaction = ({ item }) => (
    <View style={[styles.transactionCard, item.type === 'income' ? styles.incomeCard : styles.expenseCard]}>
      <View style={styles.transactionLeft}>
        <Text style={styles.transactionCategory}>{categoryLabels[item.category] || item.category}</Text>
        {item.description && <Text style={styles.transactionDesc}>{item.description}</Text>}
        <View style={{flexDirection: 'row', alignItems: 'center'}}>
          <Text style={styles.transactionDate}>{new Date(item.date).toLocaleDateString()}</Text>
          {item.landId && (
            <Text style={[styles.transactionDate, {marginLeft: 10, color: '#1976d2'}]}>📍 {item.landId?.location || 'Assigned'}</Text>
          )}
        </View>
      </View>
      <View style={styles.transactionRight}>
        <Text style={[styles.transactionAmount, item.type === 'income' ? styles.incomeAmount : styles.expenseAmount]}>
          {item.type === 'income' ? '+' : '-'} LKR {item.amount.toLocaleString()}
        </Text>
        <TouchableOpacity onPress={() => openEditModal(item)}>
          <Text style={styles.editIcon}>✏️</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => deleteTransaction(item._id)}>
          <Text style={styles.deleteIcon}>🗑️</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const filteredTransactions = transactions.filter(t => {
    if (activeLandFilter === 'All') return true;
    const tlandId = t.landId?._id || t.landId;
    return tlandId === activeLandFilter;
  });

  const filteredProfitLoss = {
    totalIncome: filteredTransactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0),
    totalExpense: filteredTransactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0),
  };
  filteredProfitLoss.netProfit = filteredProfitLoss.totalIncome - filteredProfitLoss.totalExpense;

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#2e7d32" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView>
        {profitLoss && (
          <View style={styles.summaryContainer}>
            <Text style={styles.summaryLabel}>{activeLandFilter === 'All' ? 'Farm-wide' : 'Plot-specific'} Net Profit / Loss</Text>
            <Text style={[styles.summaryAmount, filteredProfitLoss.netProfit >= 0 ? styles.profit : styles.loss]}>
              LKR {filteredProfitLoss.netProfit.toLocaleString()}
            </Text>
            <View style={styles.summaryRow}>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryItemLabel}>Income</Text>
                <Text style={styles.incomeText}>LKR {filteredProfitLoss.totalIncome.toLocaleString()}</Text>
              </View>
            <View style={styles.summaryItem}>
                <Text style={styles.summaryItemLabel}>Expenses</Text>
                <Text style={styles.expenseText}>LKR {filteredProfitLoss.totalExpense.toLocaleString()}</Text>
              </View>
            </View>

            {/* Income vs Expense Graph Block */}
            {(filteredProfitLoss.totalIncome + filteredProfitLoss.totalExpense) > 0 && (
                <View style={styles.chartWrapper}>
                   <View style={[styles.chartBar, { backgroundColor: '#4caf50', width: `${(filteredProfitLoss.totalIncome / (filteredProfitLoss.totalIncome + filteredProfitLoss.totalExpense)) * 100}%` }]} />
                   <View style={[styles.chartBar, { backgroundColor: '#f44336', width: `${(filteredProfitLoss.totalExpense / (filteredProfitLoss.totalIncome + filteredProfitLoss.totalExpense)) * 100}%` }]} />
                </View>
            )}
            <TouchableOpacity style={styles.exportCSVBtn} onPress={exportCSV}>
               <Text style={{color: '#fff', fontSize: 13, fontWeight: 'bold'}}>📥 Export CSV Analytics</Text>
            </TouchableOpacity>

          </View>
        )}

        <View style={styles.filterSection}>
           <Text style={styles.sectionTitle}>Transactions Filtered by Plot</Text>
           <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterPills}>
              <TouchableOpacity 
                 style={[styles.filterPill, activeLandFilter === 'All' && styles.filterPillActive]} 
                 onPress={() => setActiveLandFilter('All')}
              >
                 <Text style={[styles.filterPillText, activeLandFilter === 'All' && styles.filterPillTextActive]}>All Plots</Text>
              </TouchableOpacity>
              {lands.map(l => (
                 <TouchableOpacity 
                    key={l._id} 
                    style={[styles.filterPill, activeLandFilter === l._id && styles.filterPillActive]} 
                    onPress={() => setActiveLandFilter(l._id)}
                 >
                    <Text style={[styles.filterPillText, activeLandFilter === l._id && styles.filterPillTextActive]}>{l.location}</Text>
                 </TouchableOpacity>
              ))}
           </ScrollView>
        </View>

        <FlatList
          data={filteredTransactions}
          keyExtractor={(item) => item._id}
          renderItem={renderTransaction}
          scrollEnabled={false}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyIcon}>💰</Text>
              <Text style={styles.emptyText}>No matches for this plot</Text>
            </View>
          }
        />
      </ScrollView>

      <TouchableOpacity style={styles.fab} onPress={() => { setEditingItem(null); resetForm(); setModalVisible(true); }}>
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>

      <Modal animationType="slide" transparent visible={modalVisible}>
        <View style={styles.modalContainer}>
          <ScrollView contentContainerStyle={styles.modalContent}>
            <Text style={styles.modalTitle}>{editingItem ? 'Edit Transaction' : 'Add Transaction'}</Text>

            <View style={styles.typeSelector}>
              <TouchableOpacity
                style={[styles.typeButton, transactionType === 'expense' && styles.typeButtonActive]}
                onPress={() => { setTransactionType('expense'); setFormData({ ...formData, type: 'expense', category: 'other' }); }}
              >
                <Text style={[styles.typeButtonText, transactionType === 'expense' && styles.typeButtonTextActive]}>Expense</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.typeButton, transactionType === 'income' && styles.typeButtonActive]}
                onPress={() => { setTransactionType('income'); setFormData({ ...formData, type: 'income', category: 'harvest_sale' }); }}
              >
                <Text style={[styles.typeButtonText, transactionType === 'income' && styles.typeButtonTextActive]}>Income</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.label}>Category</Text>
            <View style={styles.categoryContainer}>
              {categories[transactionType].map((cat) => (
                <TouchableOpacity
                  key={cat}
                  style={[styles.categoryOption, formData.category === cat && styles.categoryOptionSelected]}
                  onPress={() => setFormData({ ...formData, category: cat })}
                >
                  <Text style={[styles.categoryOptionText, formData.category === cat && styles.categoryOptionTextSelected]}>
                    {categoryLabels[cat]}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <TextInput placeholderTextColor="#666"
              style={styles.input}
              placeholder="Amount (LKR)"
              keyboardType="numeric"
              value={formData.amount}
              onChangeText={(text) => setFormData({ ...formData, amount: text })}
            />

            <TextInput placeholderTextColor="#666"
              style={styles.input}
              placeholder="Description (optional)"
              value={formData.description}
              onChangeText={(text) => setFormData({ ...formData, description: text })}
            />

            <TextInput placeholderTextColor="#666"
              style={styles.input}
              placeholder="Date (YYYY-MM-DD)"
              value={formData.date}
              onChangeText={(text) => setFormData({ ...formData, date: text })}
            />

            <Text style={styles.label}>Select Land Plot</Text>
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
              <TouchableOpacity style={[styles.button, styles.saveButton]} onPress={editingItem ? updateTransaction : createTransaction}>
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
  summaryContainer: { backgroundColor: '#2e7d32', margin: 15, padding: 20, borderRadius: 12, alignItems: 'center' },
  summaryLabel: { fontSize: 14, color: '#a5d6a7', marginBottom: 5 },
  summaryAmount: { fontSize: 32, fontWeight: 'bold', color: '#fff', marginBottom: 15 },
  profit: { color: '#c8e6c9' },
  loss: { color: '#ffcdd2' },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-around', width: '100%', marginTop: 10 },
  summaryItem: { alignItems: 'center' },
  summaryItemLabel: { fontSize: 12, color: '#a5d6a7' },
  incomeText: { fontSize: 16, fontWeight: 'bold', color: '#c8e6c9' },
  expenseText: { fontSize: 16, fontWeight: 'bold', color: '#ffcdd2' },
  
  chartWrapper: { flexDirection: 'row', width: '100%', height: 10, borderRadius: 5, overflow: 'hidden', marginTop: 25 },
  chartBar: { height: '100%' },
  exportCSVBtn: { marginTop: 20, paddingHorizontal: 20, paddingVertical: 10, backgroundColor: 'rgba(0,0,0,0.2)', borderRadius: 20 },

  sectionTitle: { fontSize: 18, fontWeight: 'bold', margin: 15, marginBottom: 5, color: '#333' },
  filterSection: { marginBottom: 10 },
  filterPills: { flexDirection: 'row', paddingHorizontal: 10, marginTop: 5 },
  filterPill: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 15, backgroundColor: '#e0e0e0', marginRight: 8 },
  filterPillActive: { backgroundColor: '#2e7d32' },
  filterPillText: { fontSize: 12, color: '#666' },
  filterPillTextActive: { color: '#fff', fontWeight: 'bold' },

  transactionCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#fff', marginHorizontal: 15, marginVertical: 5, padding: 15, borderRadius: 10 },
  incomeCard: { borderLeftWidth: 4, borderLeftColor: '#4caf50' },
  expenseCard: { borderLeftWidth: 4, borderLeftColor: '#f44336' },
  transactionLeft: { flex: 1 },
  transactionCategory: { fontSize: 16, fontWeight: 'bold', color: '#333' },
  transactionDesc: { fontSize: 12, color: '#666', marginTop: 2 },
  transactionDate: { fontSize: 10, color: '#999', marginTop: 2 },
  transactionRight: { flexDirection: 'row', alignItems: 'center' },
  transactionAmount: { fontSize: 16, fontWeight: 'bold', marginRight: 10 },
  incomeAmount: { color: '#4caf50' },
  expenseAmount: { color: '#f44336' },
  editIcon: { fontSize: 18, color: '#999', padding: 5, marginRight: 5 },
  deleteIcon: { fontSize: 18, color: '#999', padding: 5 },
  emptyContainer: { alignItems: 'center', marginTop: 50, paddingBottom: 50 },
  emptyIcon: { fontSize: 60, marginBottom: 20 },
  emptyText: { fontSize: 16, color: '#999' },
  fab: { position: 'absolute', bottom: 20, right: 20, backgroundColor: '#2e7d32', width: 56, height: 56, borderRadius: 28, justifyContent: 'center', alignItems: 'center', elevation: 5 },
  fabText: { fontSize: 32, color: '#fff' },
  modalContainer: { flex: 1, justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.5)' },
  modalContent: { backgroundColor: '#fff', margin: 20, padding: 20, borderRadius: 15 },
  modalTitle: { fontSize: 24, fontWeight: 'bold', marginBottom: 20, textAlign: 'center', color: '#2e7d32' },
  typeSelector: { flexDirection: 'row', marginBottom: 20 },
  typeButton: { flex: 1, padding: 12, alignItems: 'center', borderRadius: 8, backgroundColor: '#e0e0e0', marginHorizontal: 5 },
  typeButtonActive: { backgroundColor: '#2e7d32' },
  typeButtonText: { fontSize: 16, color: '#666' },
  typeButtonTextActive: { color: '#fff', fontWeight: 'bold' },
  label: { fontSize: 14, fontWeight: 'bold', color: '#333', marginBottom: 8, marginTop: 8 },
  categoryContainer: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 12 },
  categoryOption: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, backgroundColor: '#e0e0e0', margin: 4 },
  categoryOptionSelected: { backgroundColor: '#2e7d32' },
  categoryOptionText: { fontSize: 12, color: '#333' },
  categoryOptionTextSelected: { color: '#fff' },
  categoryOptionTextSelected: { color: '#fff' },

  landPillsContainer: { flexDirection: 'row', marginBottom: 15, marginTop: 5 },
  landPill: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, backgroundColor: '#f0f0f0', marginRight: 8, height: 35, justifyContent: 'center' },
  landPillSelected: { backgroundColor: '#2e7d32' },
  landPillText: { fontSize: 12, color: '#666' },
  landPillTextSelected: { color: '#fff', fontWeight: 'bold' },

  input: { borderWidth: 1, borderColor: '#ddd', padding: 12, borderRadius: 8, marginBottom: 12, fontSize: 16, color: '#212121', fontWeight: '500' },
  modalButtons: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 20 },
  button: { flex: 1, padding: 14, borderRadius: 8, marginHorizontal: 5, alignItems: 'center' },
  cancelButton: { backgroundColor: '#999' },
  saveButton: { backgroundColor: '#2e7d32' },
  buttonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
});
