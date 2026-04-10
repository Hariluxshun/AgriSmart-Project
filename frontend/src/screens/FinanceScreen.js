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
import { financeService } from '../services/api';

export default function FinanceScreen() {
  const [transactions, setTransactions] = useState([]);
  const [profitLoss, setProfitLoss] = useState(null);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [transactionType, setTransactionType] = useState('expense');
  const [formData, setFormData] = useState({
    type: 'expense',
    category: 'other',
    amount: '',
    description: '',
    date: new Date().toISOString().split('T')[0],
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
      const [transactionsRes, profitLossRes] = await Promise.all([
        financeService.getTransactions(),
        financeService.getProfitLoss(),
      ]);
      setTransactions(transactionsRes.data);
      setProfitLoss(profitLossRes.data);
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
    });
  };

  const renderTransaction = ({ item }) => (
    <View style={[styles.transactionCard, item.type === 'income' ? styles.incomeCard : styles.expenseCard]}>
      <View style={styles.transactionLeft}>
        <Text style={styles.transactionCategory}>{categoryLabels[item.category] || item.category}</Text>
        {item.description && <Text style={styles.transactionDesc}>{item.description}</Text>}
        <Text style={styles.transactionDate}>{new Date(item.date).toLocaleDateString()}</Text>
      </View>
      <View style={styles.transactionRight}>
        <Text style={[styles.transactionAmount, item.type === 'income' ? styles.incomeAmount : styles.expenseAmount]}>
          {item.type === 'income' ? '+' : '-'} LKR {item.amount.toLocaleString()}
        </Text>
        <TouchableOpacity onPress={() => deleteTransaction(item._id)}>
          <Text style={styles.deleteIcon}>🗑️</Text>
        </TouchableOpacity>
      </View>
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
      <ScrollView>
        {profitLoss && (
          <View style={styles.summaryContainer}>
            <Text style={styles.summaryLabel}>Net Profit / Loss</Text>
            <Text style={[styles.summaryAmount, (profitLoss.netProfit || 0) >= 0 ? styles.profit : styles.loss]}>
              LKR {(profitLoss.netProfit || 0).toLocaleString()}
            </Text>
            <View style={styles.summaryRow}>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryItemLabel}>Income</Text>
                <Text style={styles.incomeText}>LKR {(profitLoss.totalIncome || 0).toLocaleString()}</Text>
              </View>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryItemLabel}>Expenses</Text>
                <Text style={styles.expenseText}>LKR {(profitLoss.totalExpense || 0).toLocaleString()}</Text>
              </View>
            </View>
          </View>
        )}

        <Text style={styles.sectionTitle}>Recent Transactions</Text>
        <FlatList
          data={transactions}
          keyExtractor={(item) => item._id}
          renderItem={renderTransaction}
          scrollEnabled={false}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyIcon}>💰</Text>
              <Text style={styles.emptyText}>No transactions yet</Text>
            </View>
          }
        />
      </ScrollView>

      <TouchableOpacity style={styles.fab} onPress={() => { resetForm(); setModalVisible(true); }}>
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>

      <Modal animationType="slide" transparent visible={modalVisible}>
        <View style={styles.modalContainer}>
          <ScrollView contentContainerStyle={styles.modalContent}>
            <Text style={styles.modalTitle}>Add Transaction</Text>

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

            <TextInput
              style={styles.input}
              placeholder="Amount (LKR)"
              keyboardType="numeric"
              value={formData.amount}
              onChangeText={(text) => setFormData({ ...formData, amount: text })}
            />

            <TextInput
              style={styles.input}
              placeholder="Description (optional)"
              value={formData.description}
              onChangeText={(text) => setFormData({ ...formData, description: text })}
            />

            <TextInput
              style={styles.input}
              placeholder="Date (YYYY-MM-DD)"
              value={formData.date}
              onChangeText={(text) => setFormData({ ...formData, date: text })}
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity style={[styles.button, styles.cancelButton]} onPress={() => { setModalVisible(false); resetForm(); }}>
                <Text style={styles.buttonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.button, styles.saveButton]} onPress={createTransaction}>
                <Text style={styles.buttonText}>Save</Text>
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
  sectionTitle: { fontSize: 18, fontWeight: 'bold', margin: 15, color: '#333' },
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
  input: { borderWidth: 1, borderColor: '#ddd', padding: 12, borderRadius: 8, marginBottom: 12, fontSize: 16 },
  modalButtons: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 20 },
  button: { flex: 1, padding: 14, borderRadius: 8, marginHorizontal: 5, alignItems: 'center' },
  cancelButton: { backgroundColor: '#999' },
  saveButton: { backgroundColor: '#2e7d32' },
  buttonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
});