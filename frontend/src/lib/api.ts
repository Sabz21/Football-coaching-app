import axios, { AxiosError, AxiosInstance } from 'axios';
import Cookies from 'js-cookie';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

// Create axios instance
export const api: AxiosInstance = axios.create({
  baseURL: `${API_URL}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - add auth token
api.interceptors.request.use(
  (config) => {
    const token = Cookies.get('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor - handle errors
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      // Clear token and redirect to login
      Cookies.remove('token');
      if (typeof window !== 'undefined') {
        window.location.href = '/auth/login';
      }
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authApi = {
  login: async (email: string, password: string) => {
    const { data } = await api.post('/auth/login', { email, password });
    return data;
  },
  register: async (userData: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    role: string;
    phone?: string;
  }) => {
    const { data } = await api.post('/auth/register', userData);
    return data;
  },
  getProfile: async () => {
    const { data } = await api.get('/auth/profile');
    return data;
  },
  updateProfile: async (updates: any) => {
    const { data } = await api.put('/auth/profile', updates);
    return data;
  },
};

// Players API
export const playersApi = {
  getAll: async (params?: { search?: string; isActive?: boolean }) => {
    const { data } = await api.get('/players', { params });
    return data;
  },
  getById: async (id: string) => {
    const { data } = await api.get(`/players/${id}`);
    return data;
  },
  getStats: async (id: string) => {
    const { data } = await api.get(`/players/${id}/stats`);
    return data;
  },
  create: async (playerData: any) => {
    const { data } = await api.post('/players', playerData);
    return data;
  },
  update: async (id: string, updates: any) => {
    const { data } = await api.put(`/players/${id}`, updates);
    return data;
  },
  delete: async (id: string) => {
    const { data } = await api.delete(`/players/${id}`);
    return data;
  },
  assignParent: async (playerId: string, parentId: string) => {
    const { data } = await api.post(`/players/${playerId}/assign-parent`, { parentId });
    return data;
  },
};

// Sessions API
export const sessionsApi = {
  getAll: async (params?: { status?: string; from?: string; to?: string }) => {
    const { data } = await api.get('/sessions', { params });
    return data;
  },
  getUpcoming: async (limit?: number) => {
    const { data } = await api.get('/sessions/upcoming', { params: { limit } });
    return data;
  },
  getById: async (id: string) => {
    const { data } = await api.get(`/sessions/${id}`);
    return data;
  },
  create: async (sessionData: any) => {
    const { data } = await api.post('/sessions', sessionData);
    return data;
  },
  update: async (id: string, updates: any) => {
    const { data } = await api.put(`/sessions/${id}`, updates);
    return data;
  },
  updateStatus: async (id: string, status: string) => {
    const { data } = await api.put(`/sessions/${id}/status`, { status });
    return data;
  },
  cancel: async (id: string) => {
    const { data } = await api.post(`/sessions/${id}/cancel`);
    return data;
  },
  generateFromSlots: async (weeksAhead?: number) => {
    const { data } = await api.post('/sessions/generate', { weeksAhead });
    return data;
  },
  // Slots
  getSlots: async () => {
    const { data } = await api.get('/sessions/slots');
    return data;
  },
  createSlot: async (slotData: any) => {
    const { data } = await api.post('/sessions/slots', slotData);
    return data;
  },
  updateSlot: async (id: string, updates: any) => {
    const { data } = await api.put(`/sessions/slots/${id}`, updates);
    return data;
  },
  deleteSlot: async (id: string) => {
    const { data } = await api.delete(`/sessions/slots/${id}`);
    return data;
  },
};

// Bookings API
export const bookingsApi = {
  getAll: async (params?: { status?: string; upcoming?: boolean }) => {
    const { data } = await api.get('/bookings', { params });
    return data;
  },
  getPending: async () => {
    const { data } = await api.get('/bookings/pending');
    return data;
  },
  getById: async (id: string) => {
    const { data } = await api.get(`/bookings/${id}`);
    return data;
  },
  create: async (bookingData: { sessionId: string; playerId: string; notes?: string }) => {
    const { data } = await api.post('/bookings', bookingData);
    return data;
  },
  confirm: async (id: string) => {
    const { data } = await api.post(`/bookings/${id}/confirm`);
    return data;
  },
  cancel: async (id: string) => {
    const { data } = await api.post(`/bookings/${id}/cancel`);
    return data;
  },
  markNoShow: async (id: string) => {
    const { data } = await api.post(`/bookings/${id}/no-show`);
    return data;
  },
};

// Performance API
export const performanceApi = {
  // Metrics
  addMetric: async (metricData: any) => {
    const { data } = await api.post('/performance/metrics', metricData);
    return data;
  },
  addMultipleMetrics: async (metrics: any[]) => {
    const { data } = await api.post('/performance/metrics', { metrics });
    return data;
  },
  getPlayerMetrics: async (playerId: string, params?: { category?: string; from?: string; to?: string }) => {
    const { data } = await api.get(`/performance/metrics/${playerId}`, { params });
    return data;
  },
  getLatestMetrics: async (playerId: string) => {
    const { data } = await api.get(`/performance/metrics/${playerId}/latest`);
    return data;
  },
  getMetricHistory: async (playerId: string, metricName: string) => {
    const { data } = await api.get(`/performance/metrics/${playerId}/history/${metricName}`);
    return data;
  },
  getProgressSummary: async (playerId: string) => {
    const { data } = await api.get(`/performance/progress/${playerId}`);
    return data;
  },
  // Reports
  createReport: async (reportData: any) => {
    const { data } = await api.post('/performance/reports', reportData);
    return data;
  },
  updateReport: async (id: string, updates: any) => {
    const { data } = await api.put(`/performance/reports/${id}`, updates);
    return data;
  },
  getPlayerReports: async (playerId: string, limit?: number) => {
    const { data } = await api.get(`/performance/reports/player/${playerId}`, { params: { limit } });
    return data;
  },
  getSessionReports: async (sessionId: string) => {
    const { data } = await api.get(`/performance/reports/session/${sessionId}`);
    return data;
  },
  // Achievements
  addAchievement: async (achievementData: any) => {
    const { data } = await api.post('/performance/achievements', achievementData);
    return data;
  },
  getPlayerAchievements: async (playerId: string) => {
    const { data } = await api.get(`/performance/achievements/${playerId}`);
    return data;
  },
  // Definitions
  getMetricDefinitions: async (category?: string) => {
    const { data } = await api.get('/performance/definitions', { params: { category } });
    return data;
  },
};

// Users/Dashboard API
export const usersApi = {
  getParents: async (search?: string) => {
    const { data } = await api.get('/users/parents', { params: { search } });
    return data;
  },
  getCoaches: async () => {
    const { data } = await api.get('/users/coaches');
    return data;
  },
  getCoachDashboard: async () => {
    const { data } = await api.get('/users/dashboard/coach');
    return data;
  },
  getParentDashboard: async () => {
    const { data } = await api.get('/users/dashboard/parent');
    return data;
  },
};

export default api;
