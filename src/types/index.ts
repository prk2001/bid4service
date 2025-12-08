// User types
export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  phoneVerified: boolean;
  emailVerified: boolean;
  profileImage?: string;
  role: 'CUSTOMER' | 'PROVIDER' | 'ADMIN' | 'MODERATOR';
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED' | 'PENDING_VERIFICATION';
  verificationStatus: 'UNVERIFIED' | 'PENDING' | 'VERIFIED' | 'REJECTED';
  customerProfile?: CustomerProfile;
  providerProfile?: ProviderProfile;
  createdAt: string;
  updatedAt: string;
  lastLoginAt?: string;
}

export interface CustomerProfile {
  id: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  country: string;
  totalJobsPosted: number;
  totalSpent: number;
  averageRating?: number;
}

export interface ProviderProfile {
  id: string;
  businessName?: string;
  businessType?: string;
  serviceCategories: string[];
  serviceRadius?: number;
  yearsExperience?: number;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  country: string;
  bio?: string;
  website?: string;
  portfolioImages: string[];
  availableForEmergency: boolean;
  responseTimeHours?: number;
  totalBidsSubmitted: number;
  totalBidsWon: number;
  totalProjectsCompleted: number;
  totalEarned: number;
  averageRating?: number;
  backgroundCheckStatus: 'UNVERIFIED' | 'PENDING' | 'VERIFIED' | 'REJECTED';
  licenseVerified: boolean;
  insuranceVerified: boolean;
}

// Job types
export interface Job {
  id: string;
  customerId: string;
  customer: {
    id: string;
    firstName: string;
    lastName: string;
    profileImage?: string;
  };
  title: string;
  description: string;
  category: string;
  subcategory?: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  latitude?: number;
  longitude?: number;
  startingBid: number;
  maxBudget?: number;
  currency: string;
  desiredStartDate?: string;
  desiredEndDate?: string;
  urgency: 'FLEXIBLE' | 'STANDARD' | 'URGENT' | 'EMERGENCY';
  images: string[];
  documents: string[];
  requiresLicense: boolean;
  requiresInsurance: boolean;
  requiresBackground: boolean;
  minimumRating?: number;
  status: 'DRAFT' | 'OPEN' | 'IN_BIDDING' | 'BID_ACCEPTED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED' | 'DISPUTED';
  biddingCloseDate?: string;
  views: number;
  createdAt: string;
  updatedAt: string;
  publishedAt?: string;
  _count?: {
    bids: number;
  };
}

// Bid types
export interface Bid {
  id: string;
  jobId: string;
  job?: Job;
  providerId: string;
  provider: {
    id: string;
    firstName: string;
    lastName: string;
    profileImage?: string;
    providerProfile?: ProviderProfile;
  };
  amount: number;
  currency: string;
  proposal: string;
  estimatedDuration?: number;
  proposedStartDate?: string;
  laborCost?: number;
  materialCost?: number;
  equipmentCost?: number;
  attachments: string[];
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'WITHDRAWN' | 'EXPIRED';
  createdAt: string;
  updatedAt: string;
  expiresAt?: string;
  viewedByCustomer: boolean;
  viewedAt?: string;
}

// Project types
export interface Project {
  id: string;
  jobId: string;
  job: Job;
  customerId: string;
  providerId: string;
  agreedAmount: number;
  currency: string;
  status: 'PENDING_START' | 'IN_PROGRESS' | 'PENDING_APPROVAL' | 'COMPLETED' | 'CANCELLED' | 'DISPUTED';
  startDate?: string;
  estimatedEndDate?: string;
  actualEndDate?: string;
  milestones: Milestone[];
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
}

export interface Milestone {
  id: string;
  projectId: string;
  title: string;
  description?: string;
  amount: number;
  order: number;
  status: 'PENDING' | 'IN_PROGRESS' | 'PENDING_APPROVAL' | 'APPROVED' | 'REJECTED';
  dueDate?: string;
  completedDate?: string;
  completionPhotos: string[];
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

// Message types
export interface Message {
  id: string;
  senderId: string;
  sender: {
    id: string;
    firstName: string;
    lastName: string;
    profileImage?: string;
  };
  receiverId: string;
  receiver: {
    id: string;
    firstName: string;
    lastName: string;
    profileImage?: string;
  };
  content: string;
  attachments: string[];
  projectId?: string;
  status: 'SENT' | 'DELIVERED' | 'READ';
  readAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Conversation {
  user: {
    id: string;
    firstName: string;
    lastName: string;
    profileImage?: string;
    role: string;
  };
  lastMessage: {
    content: string;
    createdAt: string;
    isSent: boolean;
    status: string;
  };
  unreadCount: number;
}

// Review types
export interface Review {
  id: string;
  projectId: string;
  authorId: string;
  author: {
    id: string;
    firstName: string;
    lastName: string;
    profileImage?: string;
    role: string;
  };
  subjectId: string;
  subject: {
    id: string;
    firstName: string;
    lastName: string;
    profileImage?: string;
    role: string;
  };
  overallRating: number;
  qualityRating?: number;
  communicationRating?: number;
  timelinessRating?: number;
  budgetRating?: number;
  title?: string;
  comment: string;
  photos: string[];
  response?: string;
  responseDate?: string;
  verified: boolean;
  helpfulCount: number;
  createdAt: string;
  updatedAt: string;
}

// Notification types
export interface Notification {
  id: string;
  userId: string;
  type: string;
  title: string;
  message: string;
  link?: string;
  read: boolean;
  readAt?: string;
  createdAt: string;
}

// API Response types
export interface ApiResponse<T = unknown> {
  success: boolean;
  message?: string;
  data?: T;
  errors?: string[];
}

export interface PaginatedResponse<T> {
  items: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Form types
export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: 'CUSTOMER' | 'PROVIDER';
  phone?: string;
}

export interface JobFormData {
  title: string;
  description: string;
  category: string;
  subcategory?: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  startingBid: number;
  maxBudget?: number;
  desiredStartDate?: string;
  desiredEndDate?: string;
  urgency: 'FLEXIBLE' | 'STANDARD' | 'URGENT' | 'EMERGENCY';
  requiresLicense: boolean;
  requiresInsurance: boolean;
  requiresBackground: boolean;
}

export interface BidFormData {
  amount: number;
  proposal: string;
  estimatedDuration?: number;
  proposedStartDate?: string;
  laborCost?: number;
  materialCost?: number;
  equipmentCost?: number;
}
