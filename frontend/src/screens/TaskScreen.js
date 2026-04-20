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
  Platform,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { taskService, inventoryService, landService } from '../services/api';

export default function TaskScreen() {
  const [tasks, setTasks] = useState([]);
  const [labors, setLabors] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [lands, setLands] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingItem, setEditingItem] = useState(null);

  // Filters
  const [activeTab, setActiveTab] = useState('All');
  const [activeWorkerFilter, setActiveWorkerFilter] = useState('All');
  const [activeLandFilter, setActiveLandFilter] = useState('All');

  const filterTabs = ['All', 'pending', 'in-progress', 'completed', 'delayed', 'cancelled', 'Overdue'];

  const [pickerMode, setPickerMode] = useState(null);

  const [taskForm, setTaskForm] = useState({
    title: '',
    description: '',
    assignedTo: '',
    landId: '',
    priority: 'medium',
    status: 'pending',
    startDate: null,
    dueDate: null,
    materialsUsed: [],
    progress: 0,
    notes: '',
  });

  const progressOptions = [0, 25, 50, 75, 100];
  const statuses = ['pending', 'in-progress', 'completed', 'delayed', 'cancelled'];

  useEffect(() => {
    fetchData();
  }, []);

  const formatDate = (date) => {
    if (!date) return '';
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const getTodayWithoutTime = () => {
    const today = new Date();
    return new Date(today.getFullYear(), today.getMonth(), today.getDate());
  };

  const fetchData = async () => {
    try {
      const [tasksRes, laborsRes, invRes, landsRes] = await Promise.all([
        taskService.getAll(),
        taskService.getLabors(),
        inventoryService.getAll(),
        landService.getAll(),
      ]);

      setTasks(tasksRes.data || []);
      setInventory(invRes.data || []);
      setLands(landsRes.data || []);

      let laborList = [];
      if (Array.isArray(laborsRes.data)) {
        laborList = laborsRes.data;
      } else if (Array.isArray(laborsRes.data?.active)) {
        laborList = laborsRes.data.active;
      } else if (Array.isArray(laborsRes.data?.labors)) {
        laborList = laborsRes.data.labors;
      } else if (Array.isArray(laborsRes.data?.data)) {
        laborList = laborsRes.data.data;
      }
      setLabors(laborList);
    } catch (error) {
      Alert.alert('Error', 'Failed to fetch tasks dependencies');
    } finally {
      setLoading(false);
    }
  };

  const resetTaskForm = () => {
    setTaskForm({
      title: '',
      description: '',
      assignedTo: '',
      landId: '',
      priority: 'medium',
      status: 'pending',
      startDate: null,
      dueDate: null,
      materialsUsed: [],
      progress: 0,
      notes: '',
    });
  };

  const createTask = async () => {
    const trimmedTitle = taskForm.title.trim();
    if (!trimmedTitle) return Alert.alert('Validation Error', 'Please enter task title');
    if (!taskForm.assignedTo) return Alert.alert('Validation Error', 'Please select a worker');
    if (!taskForm.startDate) return Alert.alert('Validation Error', 'Please select a start date');

    const payload = {
      title: trimmedTitle,
      description: taskForm.description.trim(),
      assignedTo: taskForm.assignedTo,
      landId: taskForm.landId || undefined,
      priority: taskForm.priority,
      status: taskForm.status,
      startDate: formatDate(taskForm.startDate),
      materialsUsed: taskForm.materialsUsed,
      progress: taskForm.progress,
      notes: taskForm.notes,
      ...(taskForm.dueDate && { dueDate: formatDate(taskForm.dueDate) }),
    };

    try {
      await taskService.create(payload);
      Alert.alert('Success', 'Task created successfully');
      setModalVisible(false);
      resetTaskForm();
      fetchData();
    } catch (error) {
      Alert.alert('Error', error?.response?.data?.message || 'Failed to create task');
    }
  };

  const updateTask = async () => {
    const trimmedTitle = taskForm.title.trim();
    if (!trimmedTitle) return Alert.alert('Validation Error', 'Please enter task title');

    const payload = {
      title: trimmedTitle,
      description: taskForm.description.trim(),
      assignedTo: taskForm.assignedTo,
      landId: taskForm.landId || undefined,
      priority: taskForm.priority,
      status: taskForm.status,
      startDate: formatDate(taskForm.startDate),
      materialsUsed: taskForm.materialsUsed,
      progress: taskForm.progress,
      notes: taskForm.notes,
      ...(taskForm.dueDate && { dueDate: formatDate(taskForm.dueDate) }),
    };

    if (taskForm.progress === 100 && taskForm.status !== 'completed') {
       payload.status = 'completed';
    }

    try {
      await taskService.update(editingItem._id, payload);
      Alert.alert('Success', 'Task updated successfully');
      setModalVisible(false);
      setEditingItem(null);
      resetTaskForm();
      fetchData();
    } catch (error) {
      Alert.alert('Error', error?.response?.data?.message || 'Failed to update task');
    }
  };

  const deleteTask = async (id, title) => {
    Alert.alert('Delete Task', `Delete "${title}"?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
          try {
            await taskService.delete(id);
            fetchData();
          } catch (error) {
            Alert.alert('Error', 'Failed to delete task');
          }
        }
      },
    ]);
  };

  const openEditModal = (item) => {
    setEditingItem(item);
    setTaskForm({
      title: item.title,
      description: item.description || '',
      assignedTo: item.assignedTo?._id || item.assignedTo,
      landId: item.landId?._id || item.landId || '',
      priority: item.priority || 'medium',
      status: item.status || 'pending',
      startDate: item.startDate ? new Date(item.startDate) : null,
      dueDate: item.dueDate ? new Date(item.dueDate) : null,
      materialsUsed: item.materialsUsed || [],
      progress: item.progress || 0,
      notes: item.notes || '',
    });
    setModalVisible(true);
  };

  const updateStatusQuick = async (id, status) => {
    try {
      await taskService.updateStatus(id, status);
      fetchData();
    } catch (error) {
      Alert.alert('Error', 'Failed to update task status');
    }
  };

  const getPriorityStyle = (priority) => {
    const stylesMap = {
      high: { bg: '#f44336', text: 'High' },
      medium: { bg: '#ff9800', text: 'Medium' },
      low: { bg: '#4caf50', text: 'Low' },
      urgent: { bg: '#9c27b0', text: 'Urgent' },
    };
    return stylesMap[priority] || stylesMap.medium;
  };

  const getStatusStyle = (status) => {
    const smap = {
       pending: { bg: '#fff3e0', text: '#ef6c00' },
       'in-progress': { bg: '#e3f2fd', text: '#1565c0' },
       completed: { bg: '#e8f5e9', text: '#2e7d32' },
       delayed: { bg: '#ffebee', text: '#c62828' },
       cancelled: { bg: '#f5f5f5', text: '#616161' },
    };
    return smap[status] || smap.pending;
  };

  const handleAddMaterial = (invItem) => {
    if (taskForm.materialsUsed.some(m => m.inventoryId === invItem._id)) return;
    setTaskForm(prev => ({
      ...prev,
      materialsUsed: [...prev.materialsUsed, { inventoryId: invItem._id, quantity: 1, name: invItem.name, unit: invItem.unit }]
    }));
  };

  const handleUpdateMaterialQty = (invId, text) => {
    const val = parseFloat(text) || 0;
    setTaskForm(prev => ({
      ...prev,
      materialsUsed: prev.materialsUsed.map(m => m.inventoryId === invId ? { ...m, quantity: val } : m)
    }));
  };

  const handleRemoveMaterial = (invId) => {
    setTaskForm(prev => ({
      ...prev,
      materialsUsed: prev.materialsUsed.filter(m => m.inventoryId !== invId)
    }));
  };
  
  const filteredTasks = tasks.filter(t => {
     // Status filter
     let statusMatch = false;
     if (activeTab === 'All') statusMatch = true;
     else if (activeTab === 'Overdue') {
        if (!t.dueDate || t.status === 'completed' || t.status === 'cancelled') statusMatch = false;
        else statusMatch = new Date(t.dueDate) < getTodayWithoutTime();
     } else {
        statusMatch = t.status === activeTab;
     }
     
     // Worker filter
     let workerMatch = true;
     if (activeWorkerFilter !== 'All') {
        const tworkerId = t.assignedTo?._id || t.assignedTo;
        workerMatch = (tworkerId === activeWorkerFilter);
     }

     // Land filter
     let landMatch = true;
     if (activeLandFilter !== 'All') {
        const tlandId = t.landId?._id || t.landId;
        landMatch = (tlandId === activeLandFilter);
     }

     return statusMatch && workerMatch && landMatch;
  });

  const renderTask = ({ item }) => {
    const priorityStyle = getPriorityStyle(item.priority);
    const statusStyle = getStatusStyle(item.status);
    const isOverdue = item.dueDate && new Date(item.dueDate) < getTodayWithoutTime() && item.status !== 'completed' && item.status !== 'cancelled';

    return (
      <View style={[styles.card, isOverdue && styles.overdueCard]}>
        <View style={styles.taskHeader}>
          <Text style={styles.taskTitle}>{item.title}</Text>
          <View style={styles.taskHeaderRight}>
            <View style={[styles.priorityBadge, { backgroundColor: priorityStyle.bg, marginRight: 5 }]}>
              <Text style={styles.priorityText}>{priorityStyle.text}</Text>
            </View>
            <View style={[styles.statusBadge, { backgroundColor: statusStyle.bg }]}>
              <Text style={[styles.statusText, {color: statusStyle.text}]}>{item.status.toUpperCase()}</Text>
            </View>
          </View>
        </View>

        {isOverdue && <Text style={styles.overdueBadge}>🚨 OVERDUE TASK</Text>}

        {item.description ? <Text style={styles.taskDesc}>{item.description}</Text> : null}

        <View style={styles.metaRowContainer}>
           <View style={styles.metaBox}>
               <Text style={styles.metaIcon}>📅</Text>
               <Text style={styles.taskMeta}>
                 {item.startDate ? String(item.startDate).split('T')[0] : 'Start'} ➔ {item.dueDate ? String(item.dueDate).split('T')[0] : 'End'}
               </Text>
           </View>
           <View style={styles.metaBox}>
               <Text style={styles.metaIcon}>👤</Text>
               <Text style={styles.taskMeta}>{item.assignedTo?.name || 'Unassigned'}</Text>
           </View>
           {item.landId && (
             <View style={styles.metaBox}>
                 <Text style={styles.metaIcon}>🌱</Text>
                 <Text style={styles.taskMeta}>{item.landId?.name || item.landId?.location || 'Land'}</Text>
             </View>
           )}
        </View>

        {item.notes ? (
           <View style={styles.notesBox}>
              <Text style={styles.notesTitle}>📝 Short Notes / Scouting:</Text>
              <Text style={styles.notesText}>{item.notes}</Text>
           </View>
        ) : null}

        {item.materialsUsed && item.materialsUsed.length > 0 && (
           <View style={styles.materialsBox}>
             <Text style={styles.materialsHeader}>📦 Required Materials:</Text>
             {item.materialsUsed.map((m, idx) => {
                const invItem = inventory.find(i => i._id === m.inventoryId);
                return (
                  <Text key={idx} style={styles.materialItemText}>
                    • {invItem ? invItem.name : 'Item'}: {m.quantity} {invItem?.unit || ''}
                  </Text>
                );
             })}
           </View>
        )}

        <View style={styles.progressSection}>
           <Text style={styles.progressLabel}>Progress: {item.progress || 0}%</Text>
           <View style={styles.progressBarContainer}>
              <View style={[styles.progressBarFill, { width: `${item.progress || 0}%` }]} />
           </View>
        </View>

        <View style={styles.cardActions}>
            {item.status !== 'completed' && item.status !== 'cancelled' && (
              <TouchableOpacity style={[styles.actionBtnOutline, {borderColor: '#4caf50'}]} onPress={() => updateStatusQuick(item._id, 'completed')}>
                 <Text style={[styles.btnOutlineText, {color: '#4caf50'}]}>✓ Complete</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity style={styles.actionBtnOutline} onPress={() => openEditModal(item)}>
               <Text style={styles.btnOutlineText}>✏️ Edit & Update</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.actionBtnOutline, {borderColor: '#f44336'}]} onPress={() => deleteTask(item._id, item.title)}>
               <Text style={[styles.btnOutlineText, {color: '#f44336'}]}>🗑️ Trash</Text>
            </TouchableOpacity>
        </View>
      </View>
    );
  };

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color="#2e7d32" /></View>;

  return (
    <View style={styles.container}>
      {/* Filtering Navigation */}
      <View style={styles.filterContainer}>
        {/* Status Filters */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{marginBottom: 8}}>
          {filterTabs.map((tab) => (
             <TouchableOpacity 
               key={tab} 
               style={[styles.filterBtn, activeTab === tab && styles.filterBtnActive]}
               onPress={() => setActiveTab(tab)}
             >
               <Text style={[styles.filterText, activeTab === tab && styles.filterTextActive]}>
                 {tab.charAt(0).toUpperCase() + tab.slice(1)}
               </Text>
             </TouchableOpacity>
          ))}
        </ScrollView>
        {/* Worker Filters */}
        <View style={styles.subFilterRow}>
           <Text style={styles.subFilterLabel}>Worker: </Text>
           <ScrollView horizontal showsHorizontalScrollIndicator={false}>
             <TouchableOpacity style={[styles.subFilterBtn, activeWorkerFilter === 'All' && styles.subFilterBtnActive]} onPress={() => setActiveWorkerFilter('All')}>
                 <Text style={[styles.subFilterText, activeWorkerFilter === 'All' && styles.subFilterTextActive]}>All</Text>
             </TouchableOpacity>
             {labors.map(lbl => (
                 <TouchableOpacity key={lbl._id} style={[styles.subFilterBtn, activeWorkerFilter === lbl._id && styles.subFilterBtnActive]} onPress={() => setActiveWorkerFilter(lbl._id)}>
                     <Text style={[styles.subFilterText, activeWorkerFilter === lbl._id && styles.subFilterTextActive]}>{lbl.name.split(' ')[0]}</Text>
                 </TouchableOpacity>
             ))}
           </ScrollView>
        </View>
        {/* Land Filters */}
        <View style={styles.subFilterRow}>
           <Text style={styles.subFilterLabel}>Land: </Text>
           <ScrollView horizontal showsHorizontalScrollIndicator={false}>
             <TouchableOpacity style={[styles.subFilterBtn, activeLandFilter === 'All' && styles.subFilterBtnActive]} onPress={() => setActiveLandFilter('All')}>
                 <Text style={[styles.subFilterText, activeLandFilter === 'All' && styles.subFilterTextActive]}>All</Text>
             </TouchableOpacity>
             {lands.map(lnd => (
                 <TouchableOpacity key={lnd._id} style={[styles.subFilterBtn, activeLandFilter === lnd._id && styles.subFilterBtnActive]} onPress={() => setActiveLandFilter(lnd._id)}>
                     <Text style={[styles.subFilterText, activeLandFilter === lnd._id && styles.subFilterTextActive]}>{lnd.name}</Text>
                 </TouchableOpacity>
             ))}
           </ScrollView>
        </View>
      </View>

      <FlatList
        data={filteredTasks}
        keyExtractor={(item) => item._id}
        renderItem={renderTask}
        contentContainerStyle={{ paddingBottom: 80 }}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>✅</Text>
            <Text style={styles.emptyText}>No tasks found for these filters</Text>
          </View>
        }
      />

      <TouchableOpacity
        style={styles.fab}
        onPress={() => {
          resetTaskForm();
          setEditingItem(null);
          setModalVisible(true);
        }}
      >
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>

      <Modal animationType="slide" transparent visible={modalVisible}>
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
             <Text style={styles.modalTitle}>{editingItem ? 'Edit Task' : 'Create New Task'}</Text>
             <TouchableOpacity onPress={() => { setModalVisible(false); resetTaskForm(); }}><Text style={styles.closeBtn}>✕</Text></TouchableOpacity>
          </View>
          <ScrollView contentContainerStyle={styles.modalContent} showsVerticalScrollIndicator={false}>

            <Text style={styles.label}>Title</Text>
            <TextInput placeholderTextColor="#666" style={styles.input} placeholder="Task Title" value={taskForm.title} onChangeText={(text) => setTaskForm({ ...taskForm, title: text })} />
            
            <Text style={styles.label}>Description</Text>
            <TextInput placeholderTextColor="#666" style={[styles.input, styles.textArea]} placeholder="What needs to be done?" multiline numberOfLines={3} value={taskForm.description} onChangeText={(text) => setTaskForm({ ...taskForm, description: text })} />

            <View style={{flexDirection: 'row', justifyContent: 'space-between'}}>
               <View style={{flex: 1, marginRight: 5}}>
                   <Text style={styles.label}>Assign To</Text>
                   <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.employeeContainer}>
                     {labors.map((labor) => (
                       <TouchableOpacity key={labor._id} style={[styles.employeeOption, taskForm.assignedTo === labor._id && styles.employeeOptionSelected]} onPress={() => setTaskForm({ ...taskForm, assignedTo: labor._id })}>
                         <Text style={[styles.employeeName, taskForm.assignedTo === labor._id && styles.employeeNameSelected]}>{labor.name.split(' ')[0]}</Text>
                       </TouchableOpacity>
                     ))}
                   </ScrollView>
               </View>
               <View style={{flex: 1, marginLeft: 5}}>
                   <Text style={styles.label}>Select Land</Text>
                   <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.employeeContainer}>
                     {lands.map((land) => (
                       <TouchableOpacity key={land._id} style={[styles.employeeOption, taskForm.landId === land._id && styles.employeeOptionSelected]} onPress={() => setTaskForm({ ...taskForm, landId: land._id })}>
                         <Text style={[styles.employeeName, taskForm.landId === land._id && styles.employeeNameSelected]}>{land.name}</Text>
                       </TouchableOpacity>
                     ))}
                   </ScrollView>
               </View>
            </View>

            <Text style={styles.label}>Status Updates</Text>
            <View style={styles.priorityContainer}>
              {statuses.map((stat) => (
                <TouchableOpacity key={stat} style={[styles.priorityOption, taskForm.status === stat && { backgroundColor: getStatusStyle(stat).bg, borderWidth: 1, borderColor: getStatusStyle(stat).text }]} onPress={() => setTaskForm({ ...taskForm, status: stat })}>
                  <Text style={[styles.priorityOptionText, taskForm.status === stat && {color: getStatusStyle(stat).text, fontWeight:'bold'}]}>
                     {stat.charAt(0).toUpperCase() + stat.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.label}>Progress Completion (%): {taskForm.progress}%</Text>
            <View style={styles.progressSelectorRow}>
               {progressOptions.map(p => (
                 <TouchableOpacity 
                    key={p} 
                    style={[styles.progressTick, taskForm.progress === p && styles.progressTickActive]}
                    onPress={() => setTaskForm({...taskForm, progress: p})}
                 >
                    <Text style={[styles.progressTickText, taskForm.progress === p && styles.progressTickTextActive]}>{p}%</Text>
                 </TouchableOpacity>
               ))}
            </View>

            <Text style={styles.label}>Date / Deadline</Text>
            <View style={{flexDirection: 'row', justifyContent: 'space-between'}}>
               <TouchableOpacity style={[styles.dateInput, {flex: 1, marginRight: 5}]} onPress={() => setPickerMode('start')}>
                  <Text style={taskForm.startDate ? styles.dateText : styles.datePlaceholder}>
                    {taskForm.startDate ? formatDate(taskForm.startDate) : 'Select Start'}
                  </Text>
               </TouchableOpacity>
               <TouchableOpacity style={[styles.dateInput, {flex: 1, marginLeft: 5}]} onPress={() => setPickerMode('due')}>
                  <Text style={taskForm.dueDate ? styles.dateText : styles.datePlaceholder}>
                    {taskForm.dueDate ? formatDate(taskForm.dueDate) : 'Deadline (Opt)'}
                  </Text>
               </TouchableOpacity>
            </View>
            
            {pickerMode && (
              <View>
                {Platform.OS === 'ios' && (
                  <TouchableOpacity style={{ alignSelf: 'flex-end', marginBottom: 5 }} onPress={() => setPickerMode(null)}>
                     <Text style={{ color: '#2196f3', fontWeight: 'bold' }}>Done</Text>
                  </TouchableOpacity>
                )}
                <DateTimePicker
                  value={taskForm[pickerMode === 'start' ? 'startDate' : 'dueDate'] || new Date()}
                  mode="date"
                  display="default"
                  onChange={(e, val) => {
                    if (Platform.OS === 'android') {
                      setPickerMode(null);
                    }
                    if (e.type === 'set' && val) {
                      if (pickerMode === 'start') setTaskForm(prev => ({...prev, startDate: val}));
                      if (pickerMode === 'due') setTaskForm(prev => ({...prev, dueDate: val}));
                    }
                  }}
                />
              </View>
            )}

            <Text style={styles.label}>Priority</Text>
            <View style={styles.priorityContainer}>
              {['low', 'medium', 'high', 'urgent'].map((priority) => (
                <TouchableOpacity key={priority} style={[styles.priorityOption, taskForm.priority === priority && { backgroundColor: getPriorityStyle(priority).bg }]} onPress={() => setTaskForm({ ...taskForm, priority })}>
                  <Text style={[styles.priorityOptionText, taskForm.priority === priority && styles.priorityOptionTextSelected]}>{getPriorityStyle(priority).text}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.label}>Materials & Inventory Reference</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.inventoryPicker}>
               {inventory.map(invItem => (
                  <TouchableOpacity key={invItem._id} style={styles.invBadge} onPress={() => handleAddMaterial(invItem)}>
                     <Text style={styles.invBadgeText}>+ {invItem.name}</Text>
                  </TouchableOpacity>
               ))}
            </ScrollView>
            
            {taskForm.materialsUsed.map((mat, idx) => {
               const invItem = inventory.find(i => i._id === mat.inventoryId);
               return (
                  <View key={idx} style={styles.materialFormRow}>
                     <Text style={styles.materialFormName}>{invItem?.name || mat.name}</Text>
                     <TextInput 
                        style={styles.materialInput} 
                        keyboardType="numeric" 
                        value={mat.quantity.toString()} 
                        onChangeText={(txt) => handleUpdateMaterialQty(mat.inventoryId, txt)} 
                     />
                     <Text style={styles.materialUnit}>{invItem?.unit || mat.unit}</Text>
                     <TouchableOpacity onPress={() => handleRemoveMaterial(mat.inventoryId)}>
                        <Text style={{color: 'red', fontSize: 20, marginLeft: 10}}>✖</Text>
                     </TouchableOpacity>
                  </View>
               );
            })}

            <Text style={styles.label}>📝 Short Notes / Scouting Report</Text>
            <TextInput placeholderTextColor="#666" style={[styles.input, styles.textArea]} placeholder="Add any observational notes, issues spotted, or material usage anomalies..." multiline numberOfLines={3} value={taskForm.notes} onChangeText={(text) => setTaskForm({ ...taskForm, notes: text })} />

            <View style={styles.modalButtons}>
              <TouchableOpacity style={[styles.button, styles.saveButton]} onPress={editingItem ? updateTask : createTask}>
                <Text style={styles.buttonText}>{editingItem ? 'Save Updates' : 'Create Task'}</Text>
              </TouchableOpacity>
            </View>
            <View style={{height: 20}} />
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  
  filterContainer: { backgroundColor: '#fff', paddingTop: 10, paddingBottom: 5, paddingHorizontal: 10, elevation: 2 },
  filterBtn: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: '#e0e0e0', marginRight: 8 },
  filterBtnActive: { backgroundColor: '#2e7d32' },
  filterText: { fontSize: 13, color: '#333', fontWeight: 'bold' },
  filterTextActive: { color: '#fff' },
  
  subFilterRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 5 },
  subFilterLabel: { fontSize: 12, fontWeight: 'bold', color: '#666', width: 50 },
  subFilterBtn: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 15, backgroundColor: '#f0f0f0', marginRight: 5 },
  subFilterBtnActive: { backgroundColor: '#c8e6c9' },
  subFilterText: { fontSize: 11, color: '#333' },
  subFilterTextActive: { color: '#2e7d32', fontWeight: 'bold' },

  card: { backgroundColor: '#fff', marginHorizontal: 10, marginVertical: 6, padding: 15, borderRadius: 12, elevation: 2 },
  overdueCard: { borderWidth: 2, borderColor: '#d32f2f', backgroundColor: '#ffebee' },
  taskHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 },
  taskTitle: { fontSize: 16, fontWeight: 'bold', color: '#333', flex: 1 },
  taskHeaderRight: { flexDirection: 'row', alignItems: 'center' },
  
  priorityBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 },
  priorityText: { color: '#fff', fontSize: 10, fontWeight: 'bold' },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 },
  statusText: { fontSize: 10, fontWeight: 'bold' },
  
  taskDesc: { fontSize: 14, color: '#666', marginTop: 2, marginBottom: 8 },
  overdueBadge: { color: '#d32f2f', fontWeight: 'bold', fontSize: 12, marginVertical: 3 },
  
  metaRowContainer: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 5 },
  metaBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f0f0f0', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, marginRight: 10, marginBottom: 5 },
  metaIcon: { fontSize: 12, marginRight: 4 },
  taskMeta: { fontSize: 12, color: '#555', fontWeight: '500' },
  
  notesBox: { backgroundColor: '#fff9c4', padding: 10, borderRadius: 8, marginTop: 5, marginBottom: 5, borderLeftWidth: 3, borderLeftColor: '#fbc02d' },
  notesTitle: { fontSize: 12, fontWeight: 'bold', color: '#f57f17', marginBottom: 3 },
  notesText: { fontSize: 13, color: '#424242' },

  materialsBox: { marginTop: 10, padding: 10, backgroundColor: '#f9f9f9', borderRadius: 8, borderWidth: 1, borderColor: '#eee' },
  materialsHeader: { fontSize: 12, fontWeight: 'bold', color: '#2e7d32', marginBottom: 5 },
  materialItemText: { fontSize: 12, color: '#555', marginLeft: 5 },
  
  progressSection: { marginTop: 15 },
  progressLabel: { fontSize: 12, color: '#666', marginBottom: 5, fontWeight: 'bold' },
  progressBarContainer: { height: 6, backgroundColor: '#e0e0e0', borderRadius: 4, overflow: 'hidden' },
  progressBarFill: { height: '100%', backgroundColor: '#2196f3' },

  cardActions: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 15, borderTopWidth: 1, borderTopColor: '#f0f0f0', paddingTop: 10 },
  actionBtnOutline: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 6, borderWidth: 1, borderColor: '#bbb', marginLeft: 8 },
  btnOutlineText: { fontSize: 12, color: '#555', fontWeight: '600' },

  emptyContainer: { alignItems: 'center', marginTop: 100 },
  emptyIcon: { fontSize: 60, marginBottom: 20 },
  emptyText: { fontSize: 16, color: '#999' },
  
  fab: { position: 'absolute', bottom: 20, right: 20, backgroundColor: '#2e7d32', width: 56, height: 56, borderRadius: 28, justifyContent: 'center', alignItems: 'center', elevation: 5 },
  fabText: { fontSize: 32, color: '#fff' },
  
  modalContainer: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.5)' },
  modalHeader: { backgroundColor: '#fff', padding: 20, borderTopLeftRadius: 20, borderTopRightRadius: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#eee' },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: '#2e7d32' },
  closeBtn: { fontSize: 24, color: '#999', fontWeight: 'bold' },
  modalContent: { backgroundColor: '#fff', padding: 20 },
  
  input: { borderWidth: 1, borderColor: '#ddd', padding: 12, borderRadius: 8, marginBottom: 12, fontSize: 14, color: '#212121', backgroundColor: '#fafafa' },
  textArea: { height: 80, textAlignVertical: 'top' },
  label: { fontSize: 13, fontWeight: 'bold', color: '#444', marginBottom: 8, marginTop: 4 },
  
  employeeContainer: { flexDirection: 'row', marginBottom: 12 },
  employeeOption: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, backgroundColor: '#f0f0f0', marginRight: 8, height: 35, justifyContent: 'center' },
  employeeOptionSelected: { backgroundColor: '#2e7d32' },
  employeeName: { fontSize: 12, color: '#333' },
  employeeNameSelected: { color: '#fff', fontWeight: 'bold' },
  
  progressSelectorRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 15 },
  progressTick: { flex: 1, padding: 8, backgroundColor: '#f0f0f0', marginHorizontal: 3, borderRadius: 6, alignItems: 'center' },
  progressTickActive: { backgroundColor: '#2196f3' },
  progressTickText: { fontSize: 12, fontWeight: 'bold', color: '#333' },
  progressTickTextActive: { color: '#fff' },

  inventoryPicker: { flexDirection: 'row', marginBottom: 10 },
  invBadge: { paddingHorizontal: 15, paddingVertical: 8, backgroundColor: '#e8f5e9', borderRadius: 20, marginRight: 8, borderWidth: 1, borderColor: '#81c784' },
  invBadgeText: { color: '#2e7d32', fontWeight: 'bold', fontSize: 12 },
  materialFormRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10, padding: 10, backgroundColor: '#f5f5f5', borderRadius: 8 },
  materialFormName: { flex: 1, fontWeight: 'bold', fontSize: 13, color: '#333' },
  materialInput: { width: 50, height: 36, backgroundColor: '#fff', borderWidth: 1, borderColor: '#ccc', borderRadius: 5, textAlign: 'center', color: '#000' },
  materialUnit: { width: 40, marginLeft: 10, color: '#666', fontSize: 12 },

  priorityContainer: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 12 },
  priorityOption: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, backgroundColor: '#f0f0f0', marginRight: 6, marginBottom: 6 },
  priorityOptionText: { fontSize: 12, color: '#444' },
  priorityOptionTextSelected: { color: '#fff', fontWeight: 'bold' },
  
  dateInput: { borderWidth: 1, borderColor: '#ddd', padding: 12, borderRadius: 8, marginBottom: 12, backgroundColor: '#fafafa' },
  dateText: { fontSize: 13, color: '#333' },
  datePlaceholder: { fontSize: 13, color: '#999' },
  
  modalButtons: { marginTop: 20 },
  button: { padding: 16, borderRadius: 10, alignItems: 'center' },
  saveButton: { backgroundColor: '#2e7d32', elevation: 2 },
  buttonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
});
