import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// IMPORTANT: Use correct backend port
const API_URL = 'http://172.20.10.4:5000/api';

const api = axios.create({
  baseURL: API_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests
api.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Auth services
export const authService = {
  register: (userData) => api.post('/auth/register', userData),
  login: (credentials) => api.post('/auth/login', credentials),
  getMe: () => api.get('/auth/me'),
  updateProfile: (userData) => api.put('/auth/profile', userData),
  updatePassword: (passwordData) => api.put('/auth/password', passwordData),
};

// Land services
export const landService = {
  getAll: () => api.get('/lands'),
  getOne: (id) => api.get(`/lands/${id}`),
  create: (data) => api.post('/lands', data),
  update: (id, data) => api.put(`/lands/${id}`, data),
  delete: (id) => api.delete(`/lands/${id}`),
};

// Inventory services
export const inventoryService = {
  getAll: () => api.get('/inventory'),
  create: (data) => api.post('/inventory', data),
  update: (id, data) => api.put(`/inventory/${id}`, data),
  delete: (id) => api.delete(`/inventory/${id}`),
};

// Machinery services
export const machineryService = {
  getAll: () => api.get('/machinery'),
  create: (data) => api.post('/machinery', data),
  update: (id, data) => api.put(`/machinery/${id}`, data),
  delete: (id) => api.delete(`/machinery/${id}`),
};

// Task services
export const taskService = {
  getAll: () => api.get('/tasks/tasks'),
  create: (data) => api.post('/tasks/tasks', data),
  update: (id, data) => api.put(`/tasks/tasks/${id}`, data),
  delete: (id) => api.delete(`/tasks/tasks/${id}`),
  updateStatus: (id, status) => api.put(`/tasks/tasks/${id}/status`, { status }),
  getLabors: () => api.get('/labor'),
  createEmployee: (data) => api.post('/tasks/employees', data),
};

// Finance services
export const financeService = {
  getTransactions: () => api.get('/finance/transactions'),
  createTransaction: (data) => api.post('/finance/transactions', data),
  updateTransaction: (id, data) => api.put(`/finance/transactions/${id}`, data),
  getProfitLoss: () => api.get('/finance/profit-loss'),
  deleteTransaction: (id) => api.delete(`/finance/transactions/${id}`),
};

// Labor services
export const laborService = {
  getAll: () => api.get('/labor'),
  create: (data) => api.post('/labor', data),
  update: (id, data) => api.put(`/labor/${id}`, data),
  markAttendance: (id, data) => api.post(`/labor/${id}/attendance`, data),
  pay: (id, data) => api.post(`/labor/${id}/pay`, data),
  delete: (id) => api.delete(`/labor/${id}`),
};

export default api;
