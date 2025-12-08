import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || '';

// Create axios instance
export const api = axios.create({
  baseURL: `${API_URL}/api/v1`,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('token');
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      // Clear token and redirect to login
      if (typeof window !== 'undefined') {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authApi = {
  login: (email: string, password: string) =>
    api.post('/auth/login', { email, password }),
  
  register: (data: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    role: 'CUSTOMER' | 'PROVIDER';
    phone?: string;
  }) => api.post('/auth/register', data),
  
  logout: () => api.post('/auth/logout'),
  
  getProfile: () => api.get('/auth/me'),
  
  forgotPassword: (email: string) =>
    api.post('/auth/forgot-password', { email }),
  
  resetPassword: (token: string, password: string) =>
    api.post('/auth/reset-password', { token, password }),
};

// Jobs API
export const jobsApi = {
  getAll: (params?: {
    page?: number;
    limit?: number;
    category?: string;
    status?: string;
    search?: string;
  }) => api.get('/jobs', { params }),
  
  getById: (id: string) => api.get(`/jobs/${id}`),
  
  create: (data: unknown) => api.post('/jobs', data),
  
  update: (id: string, data: unknown) => api.put(`/jobs/${id}`, data),
  
  delete: (id: string) => api.delete(`/jobs/${id}`),
  
  getMyJobs: (params?: { page?: number; limit?: number; status?: string }) =>
    api.get('/jobs/my-jobs', { params }),
  
  publish: (id: string) => api.post(`/jobs/${id}/publish`),
};

// Bids API
export const bidsApi = {
  getByJob: (jobId: string) => api.get(`/jobs/${jobId}/bids`),
  
  create: (jobId: string, data: unknown) =>
    api.post(`/jobs/${jobId}/bids`, data),
  
  getMyBids: (params?: { page?: number; limit?: number; status?: string }) =>
    api.get('/bids/my-bids', { params }),
  
  accept: (bidId: string) => api.post(`/bids/${bidId}/accept`),
  
  reject: (bidId: string) => api.post(`/bids/${bidId}/reject`),
  
  withdraw: (bidId: string) => api.post(`/bids/${bidId}/withdraw`),
};

// Projects API
export const projectsApi = {
  getAll: (params?: { page?: number; limit?: number; status?: string }) =>
    api.get('/projects', { params }),
  
  getById: (id: string) => api.get(`/projects/${id}`),
  
  updateStatus: (id: string, status: string) =>
    api.patch(`/projects/${id}/status`, { status }),
  
  completeMilestone: (projectId: string, milestoneId: string, data?: unknown) =>
    api.post(`/projects/${projectId}/milestones/${milestoneId}/complete`, data),
  
  approveMilestone: (projectId: string, milestoneId: string) =>
    api.post(`/projects/${projectId}/milestones/${milestoneId}/approve`),
};

// Messages API
export const messagesApi = {
  getConversations: () => api.get('/messages/conversations'),
  
  getMessages: (userId: string, params?: { page?: number; limit?: number }) =>
    api.get(`/messages/${userId}`, { params }),
  
  send: (receiverId: string, content: string, projectId?: string) =>
    api.post('/messages', { receiverId, content, projectId }),
  
  markAsRead: (messageId: string) =>
    api.patch(`/messages/${messageId}/read`),
};

// Reviews API
export const reviewsApi = {
  getByUser: (userId: string) => api.get(`/reviews/user/${userId}`),
  
  create: (data: {
    projectId: string;
    overallRating: number;
    qualityRating?: number;
    communicationRating?: number;
    timelinessRating?: number;
    budgetRating?: number;
    title?: string;
    comment: string;
  }) => api.post('/reviews', data),
  
  respond: (reviewId: string, response: string) =>
    api.post(`/reviews/${reviewId}/respond`, { response }),
};

// Users API
export const usersApi = {
  getProfile: (userId: string) => api.get(`/users/${userId}`),
  
  updateProfile: (data: unknown) => api.put('/users/profile', data),
  
  updateProviderProfile: (data: unknown) =>
    api.put('/users/provider-profile', data),
};

// Notifications API
export const notificationsApi = {
  getAll: (params?: { page?: number; limit?: number; unreadOnly?: boolean }) =>
    api.get('/notifications', { params }),
  
  markAsRead: (id: string) => api.patch(`/notifications/${id}/read`),
  
  markAllAsRead: () => api.patch('/notifications/read-all'),
};

// Payments API
export const paymentsApi = {
  createPaymentIntent: (projectId: string, amount: number) =>
    api.post('/payments/create-intent', { projectId, amount }),
  
  getByProject: (projectId: string) =>
    api.get(`/payments/project/${projectId}`),
};

export default api;
