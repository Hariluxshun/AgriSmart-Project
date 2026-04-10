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
import { taskService } from '../services/api';

export default function TaskScreen() {
  const [tasks, setTasks] = useState([]);
  const [labors, setLabors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);

  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showDeadlinePicker, setShowDeadlinePicker] = useState(false);

  const [taskForm, setTaskForm] = useState({
    title: '',
    description: '',
    assignedTo: '',
    priority: 'medium',
    startDate: null,
    dueDate: null,
  });

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
      const [tasksRes, laborsRes] = await Promise.all([
        taskService.getAll(),
        taskService.getLabors(),
      ]);

      console.log('TASKS RESPONSE:', tasksRes.data);
      console.log('LABORS RESPONSE:', laborsRes.data);

      setTasks(tasksRes.data?.pending || []);

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
      console.log('FETCH ERROR:', error?.response?.data || error.message);
      Alert.alert('Error', 'Failed to fetch tasks or laborers');
    } finally {
      setLoading(false);
    }
  };

  const resetTaskForm = () => {
    setTaskForm({
      title: '',
      description: '',
      assignedTo: '',
      priority: 'medium',
      startDate: null,
      dueDate: null,
    });
  };

  const createTask = async () => {
    const trimmedTitle = taskForm.title.trim();
    const trimmedDescription = taskForm.description.trim();
    const today = getTodayWithoutTime();

    if (!trimmedTitle) {
      Alert.alert('Validation Error', 'Please enter task title');
      return;
    }

    if (!taskForm.assignedTo) {
      Alert.alert('Validation Error', 'Please select a laborer');
      return;
    }

    if (!taskForm.startDate) {
      Alert.alert('Validation Error', 'Please select a start date');
      return;
    }

    const selectedStartDate = new Date(
      taskForm.startDate.getFullYear(),
      taskForm.startDate.getMonth(),
      taskForm.startDate.getDate()
    );

    if (selectedStartDate < today) {
      Alert.alert('Validation Error', 'Start date must be today or a future date');
      return;
    }

    if (taskForm.dueDate) {
      const selectedDueDate = new Date(
        taskForm.dueDate.getFullYear(),
        taskForm.dueDate.getMonth(),
        taskForm.dueDate.getDate()
      );

      if (selectedDueDate < selectedStartDate) {
        Alert.alert('Validation Error', 'Deadline must be on or after the start date');
        return;
      }
    }

    const payload = {
      title: trimmedTitle,
      description: trimmedDescription,
      assignedTo: taskForm.assignedTo,
      priority: taskForm.priority,
      startDate: formatDate(taskForm.startDate),
      ...(taskForm.dueDate && { dueDate: formatDate(taskForm.dueDate) }),
    };

    try {
      await taskService.create(payload);
      Alert.alert('Success', 'Task created successfully');
      setModalVisible(false);
      resetTaskForm();
      fetchData();
    } catch (error) {
      console.log('CREATE TASK ERROR:', error?.response?.data || error.message);
      Alert.alert(
        'Error',
        error?.response?.data?.message || 'Failed to create task'
      );
    }
  };

  const updateStatus = async (id, status) => {
    try {
      await taskService.updateStatus(id, status);
      fetchData();
    } catch (error) {
      console.log('UPDATE STATUS ERROR:', error?.response?.data || error.message);
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

  const onChangeStartDate = (event, selectedDate) => {
    setShowStartDatePicker(Platform.OS === 'ios');

    if (selectedDate) {
      setTaskForm((prev) => ({
        ...prev,
        startDate: selectedDate,
        dueDate:
          prev.dueDate && prev.dueDate < selectedDate ? null : prev.dueDate,
      }));
    }
  };

  const onChangeDeadline = (event, selectedDate) => {
    setShowDeadlinePicker(Platform.OS === 'ios');

    if (selectedDate) {
      setTaskForm((prev) => ({
        ...prev,
        dueDate: selectedDate,
      }));
    }
  };

  const renderTask = ({ item }) => {
    const priorityStyle = getPriorityStyle(item.priority);

    return (
      <View style={styles.card}>
        <View style={styles.taskHeader}>
          <Text style={styles.taskTitle}>{item.title}</Text>
          <View
            style={[styles.priorityBadge, { backgroundColor: priorityStyle.bg }]}
          >
            <Text style={styles.priorityText}>{priorityStyle.text}</Text>
          </View>
        </View>

        {item.description ? (
          <Text style={styles.taskDesc}>{item.description}</Text>
        ) : null}

        {item.assignedTo ? (
          <Text style={styles.taskMeta}>👤 Assigned to: {item.assignedTo.name}</Text>
        ) : null}

        {item.startDate ? (
          <Text style={styles.taskMeta}>
            🚀 Start: {new Date(item.startDate).toLocaleDateString()}
          </Text>
        ) : null}

        {item.dueDate ? (
          <Text style={styles.taskMeta}>
            📅 Deadline: {new Date(item.dueDate).toLocaleDateString()}
          </Text>
        ) : null}

        <View style={styles.statusButtons}>
          {item.status !== 'completed' && (
            <TouchableOpacity
              style={[styles.statusActionButton, styles.completeButton]}
              onPress={() => updateStatus(item._id, 'completed')}
            >
              <Text style={styles.statusButtonText}>✓ Complete</Text>
            </TouchableOpacity>
          )}

          {item.status !== 'cancelled' && (
            <TouchableOpacity
              style={[styles.statusActionButton, styles.cancelStatusButton]}
              onPress={() => updateStatus(item._id, 'cancelled')}
            >
              <Text style={styles.statusButtonText}>✗ Cancel</Text>
            </TouchableOpacity>
          )}
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
        data={tasks}
        keyExtractor={(item) => item._id}
        renderItem={renderTask}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>✅</Text>
            <Text style={styles.emptyText}>No pending tasks</Text>
            <Text style={styles.emptySubtext}>Tap + to create a task</Text>
          </View>
        }
      />

      <TouchableOpacity
        style={styles.fab}
        onPress={() => {
          resetTaskForm();
          setModalVisible(true);
        }}
      >
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>

      <Modal animationType="slide" transparent visible={modalVisible}>
        <View style={styles.modalContainer}>
          <ScrollView contentContainerStyle={styles.modalContent}>
            <Text style={styles.modalTitle}>Create New Task</Text>

            <TextInput
              style={styles.input}
              placeholder="Task Title"
              value={taskForm.title}
              onChangeText={(text) => setTaskForm({ ...taskForm, title: text })}
            />

            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Description"
              multiline
              numberOfLines={3}
              value={taskForm.description}
              onChangeText={(text) =>
                setTaskForm({ ...taskForm, description: text })
              }
            />

            <Text style={styles.label}>Assign Labor</Text>
            <View style={styles.employeeContainer}>
              {labors.length > 0 ? (
                labors.map((labor) => (
                  <TouchableOpacity
                    key={labor._id}
                    style={[
                      styles.employeeOption,
                      taskForm.assignedTo === labor._id &&
                        styles.employeeOptionSelected,
                    ]}
                    onPress={() =>
                      setTaskForm({ ...taskForm, assignedTo: labor._id })
                    }
                  >
                    <Text
                      style={[
                        styles.employeeName,
                        taskForm.assignedTo === labor._id &&
                          styles.employeeNameSelected,
                      ]}
                    >
                      {labor.name}
                    </Text>
                  </TouchableOpacity>
                ))
              ) : (
                <Text style={styles.noEmployeesText}>
                  No laborers found. Please add a laborer first.
                </Text>
              )}
            </View>

            <Text style={styles.label}>Priority</Text>
            <View style={styles.priorityContainer}>
              {['low', 'medium', 'high', 'urgent'].map((priority) => {
                const priorityStyle = getPriorityStyle(priority);
                return (
                  <TouchableOpacity
                    key={priority}
                    style={[
                      styles.priorityOption,
                      taskForm.priority === priority && {
                        backgroundColor: priorityStyle.bg,
                      },
                    ]}
                    onPress={() => setTaskForm({ ...taskForm, priority })}
                  >
                    <Text
                      style={[
                        styles.priorityOptionText,
                        taskForm.priority === priority &&
                          styles.priorityOptionTextSelected,
                      ]}
                    >
                      {priorityStyle.text}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <Text style={styles.label}>Start Date</Text>
            <TouchableOpacity
              style={styles.dateInput}
              onPress={() => setShowStartDatePicker(true)}
            >
              <Text style={taskForm.startDate ? styles.dateText : styles.datePlaceholder}>
                {taskForm.startDate
                  ? formatDate(taskForm.startDate)
                  : 'Select start date'}
              </Text>
            </TouchableOpacity>

            {showStartDatePicker && (
              <DateTimePicker
                value={taskForm.startDate || getTodayWithoutTime()}
                mode="date"
                display="default"
                minimumDate={getTodayWithoutTime()}
                onChange={onChangeStartDate}
              />
            )}

            <Text style={styles.label}>Deadline</Text>
            <TouchableOpacity
              style={styles.dateInput}
              onPress={() => setShowDeadlinePicker(true)}
            >
              <Text style={taskForm.dueDate ? styles.dateText : styles.datePlaceholder}>
                {taskForm.dueDate
                  ? formatDate(taskForm.dueDate)
                  : 'Select deadline'}
              </Text>
            </TouchableOpacity>

            {showDeadlinePicker && (
              <DateTimePicker
                value={taskForm.dueDate || taskForm.startDate || getTodayWithoutTime()}
                mode="date"
                display="default"
                minimumDate={taskForm.startDate || getTodayWithoutTime()}
                onChange={onChangeDeadline}
              />
            )}

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.button, styles.modalCancelButton]}
                onPress={() => {
                  setModalVisible(false);
                  resetTaskForm();
                }}
              >
                <Text style={styles.buttonText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.button, styles.saveButton]}
                onPress={createTask}
              >
                <Text style={styles.buttonText}>Create</Text>
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
  card: {
    backgroundColor: '#fff',
    margin: 10,
    padding: 15,
    borderRadius: 12,
    elevation: 2,
  },
  taskHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  taskTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
  },
  priorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  priorityText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  taskDesc: {
    fontSize: 14,
    color: '#666',
    marginTop: 5,
  },
  taskMeta: {
    fontSize: 12,
    color: '#999',
    marginTop: 5,
  },
  statusButtons: {
    flexDirection: 'row',
    marginTop: 10,
    gap: 10,
  },
  statusActionButton: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 8,
    marginRight: 10,
  },
  completeButton: {
    backgroundColor: '#4caf50',
  },
  cancelStatusButton: {
    backgroundColor: '#f44336',
  },
  statusButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  emptyContainer: {
    alignItems: 'center',
    marginTop: 100,
  },
  emptyIcon: {
    fontSize: 60,
    marginBottom: 20,
  },
  emptyText: {
    fontSize: 18,
    color: '#999',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#ccc',
    marginTop: 10,
  },
  fab: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    backgroundColor: '#2e7d32',
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
  },
  fabText: {
    fontSize: 32,
    color: '#fff',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    backgroundColor: '#fff',
    margin: 20,
    padding: 20,
    borderRadius: 15,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
    color: '#2e7d32',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
    fontSize: 16,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  label: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
    marginTop: 8,
  },
  employeeContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 12,
  },
  employeeOption: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#e0e0e0',
    margin: 4,
  },
  employeeOptionSelected: {
    backgroundColor: '#2e7d32',
  },
  employeeName: {
    fontSize: 12,
    color: '#333',
  },
  employeeNameSelected: {
    color: '#fff',
  },
  noEmployeesText: {
    color: '#777',
    fontSize: 13,
    marginVertical: 6,
  },
  priorityContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 12,
  },
  priorityOption: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#e0e0e0',
    margin: 4,
  },
  priorityOptionText: {
    fontSize: 12,
    color: '#333',
  },
  priorityOptionTextSelected: {
    color: '#fff',
  },
  dateInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    padding: 14,
    borderRadius: 8,
    marginBottom: 12,
    backgroundColor: '#fff',
  },
  dateText: {
    fontSize: 16,
    color: '#333',
  },
  datePlaceholder: {
    fontSize: 16,
    color: '#999',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  button: {
    flex: 1,
    padding: 14,
    borderRadius: 8,
    marginHorizontal: 5,
    alignItems: 'center',
  },
  modalCancelButton: {
    backgroundColor: '#999',
  },
  saveButton: {
    backgroundColor: '#2e7d32',
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
});