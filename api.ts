import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api/v1';

// Create axios instance
const apiClient: AxiosInstance = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  register: (data: any) => apiClient.post('/auth/register', data),
  login: (data: any) => apiClient.post('/auth/login', data),
  getCurrentUser: () => apiClient.get('/auth/me'),
  changePassword: (data: any) => apiClient.put('/auth/change-password', data),
  logout: () => apiClient.post('/auth/logout'),
};

// Jobs API
export const jobsAPI = {
  create: (data: any) => apiClient.post('/jobs', data),
  getAll: (params?: any) => apiClient.get('/jobs', { params }),
  getById: (id: string) => apiClient.get(`/jobs/${id}`),
  getMyJobs: (params?: any) => apiClient.get('/jobs/my-jobs', { params }),
  update: (id: string, data: any) => apiClient.put(`/jobs/${id}`, data),
  delete: (id: string) => apiClient.delete(`/jobs/${id}`),
  close: (id: string) => apiClient.post(`/jobs/${id}/close`),
};

// Bids API
export const bidsAPI = {
  submit: (jobId: string, data: any) => apiClient.post(`/jobs/${jobId}/bids`, data),
  getJobBids: (jobId: string) => apiClient.get(`/jobs/${jobId}/bids`),
  getMyBids: (params?: any) => apiClient.get('/bids/my-bids', { params }),
  getById: (id: string) => apiClient.get(`/bids/${id}`),
  update: (id: string, data: any) => apiClient.put(`/bids/${id}`, data),
  withdraw: (id: string) => apiClient.post(`/bids/${id}/withdraw`),
  accept: (id: string) => apiClient.post(`/bids/${id}/accept`),
  reject: (id: string) => apiClient.post(`/bids/${id}/reject`),
};

// Projects API
export const projectsAPI = {
  getAll: (params?: any) => apiClient.get('/projects', { params }),
  getById: (id: string) => apiClient.get(`/projects/${id}`),
  createMilestone: (projectId: string, data: any) => 
    apiClient.post(`/projects/${projectId}/milestones`, data),
  updateMilestone: (id: string, data: any) => 
    apiClient.put(`/projects/milestones/${id}`, data),
  completeMilestone: (id: string, data: any) => 
    apiClient.post(`/projects/milestones/${id}/complete`, data),
  approveMilestone: (id: string) => 
    apiClient.post(`/projects/milestones/${id}/approve`),
  rejectMilestone: (id: string, data: any) => 
    apiClient.post(`/projects/milestones/${id}/reject`, data),
  updateStatus: (id: string, data: any) => 
    apiClient.put(`/projects/${id}/status`, data),
  cancel: (id: string, data: any) => 
    apiClient.post(`/projects/${id}/cancel`, data),
};

// Messages API
export const messagesAPI = {
  send: (data: any) => apiClient.post('/messages', data),
  getConversations: () => apiClient.get('/messages/conversations'),
  getWithUser: (userId: string, params?: any) => 
    apiClient.get(`/messages/${userId}`, { params }),
  getProjectMessages: (projectId: string) => 
    apiClient.get(`/messages/project/${projectId}`),
  getUnreadCount: () => apiClient.get('/messages/unread/count'),
  markAsRead: (id: string) => apiClient.put(`/messages/${id}/read`),
  delete: (id: string) => apiClient.delete(`/messages/${id}`),
};

// Payments API
export const paymentsAPI = {
  createSetupIntent: () => apiClient.post('/payments/setup-intent'),
  fundEscrow: (data: any) => apiClient.post('/payments/escrow', data),
  releaseMilestone: (data: any) => apiClient.post('/payments/release-milestone', data),
  releaseFinal: (data: any) => apiClient.post('/payments/release-final', data),
  requestRefund: (data: any) => apiClient.post('/payments/refund', data),
  getHistory: (params?: any) => apiClient.get('/payments/history', { params }),
  getProjectPayments: (projectId: string) => 
    apiClient.get(`/payments/project/${projectId}`),
};

// Reviews API
export const reviewsAPI = {
  create: (data: any) => apiClient.post('/reviews', data),
  getUserReviews: (userId: string, params?: any) => 
    apiClient.get(`/reviews/user/${userId}`, { params }),
  getMyReviews: () => apiClient.get('/reviews/my-reviews'),
  getById: (id: string) => apiClient.get(`/reviews/${id}`),
  update: (id: string, data: any) => apiClient.put(`/reviews/${id}`, data),
  respond: (id: string, data: any) => apiClient.post(`/reviews/${id}/respond`, data),
  markHelpful: (id: string) => apiClient.post(`/reviews/${id}/helpful`),
};

// Users API
export const usersAPI = {
  getProfile: () => apiClient.get('/users/profile'),
  updateProfile: (data: any) => apiClient.put('/users/profile', data),
  getPublicProfile: (userId: string) => apiClient.get(`/users/${userId}`),
  getStats: () => apiClient.get('/users/stats'),
  uploadVerificationDocs: (data: any) => 
    apiClient.post('/users/verification/documents', data),
};

// Upload API
export const uploadAPI = {
  uploadFile: (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return apiClient.post('/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  uploadMultiple: (files: File[]) => {
    const formData = new FormData();
    files.forEach((file) => formData.append('files', file));
    return apiClient.post('/upload/multiple', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  getFileInfo: (filename: string) => apiClient.get(`/upload/${filename}`),
  deleteFile: (filename: string) => apiClient.delete(`/upload/${filename}`),
};

// Admin API
export const adminAPI = {
  getStats: () => apiClient.get('/admin/stats'),
  getAllUsers: (params?: any) => apiClient.get('/admin/users', { params }),
  suspendUser: (userId: string, data: any) => 
    apiClient.post(`/admin/users/${userId}/suspend`, data),
  reactivateUser: (userId: string) => 
    apiClient.post(`/admin/users/${userId}/reactivate`),
  getAllReports: (params?: any) => apiClient.get('/admin/reports', { params }),
  resolveReport: (reportId: string, data: any) => 
    apiClient.post(`/admin/reports/${reportId}/resolve`, data),
  dismissReport: (reportId: string, data: any) => 
    apiClient.post(`/admin/reports/${reportId}/dismiss`, data),
  deleteJob: (jobId: string, data: any) => 
    apiClient.delete(`/admin/jobs/${jobId}`, { data }),
  deleteReview: (reviewId: string, data: any) => 
    apiClient.delete(`/admin/reviews/${reviewId}`, { data }),
};

export default apiClient;
