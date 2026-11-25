export type UserRole = 'ADMIN' | 'AGENT' | 'CLIENT';

export interface User {
  id: number;
  fullName: string;
  firstName?: string;
  lastName?: string;
  email: string;
  contactNumber?: string;
  role: UserRole;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export type PropertyType = 'HOUSE' | 'APARTMENT' | 'CONDOMINIUM' | 'COMMERCIAL' | 'LAND' | 'TOWNHOUSE';
export type ListingType = 'SALE' | 'RENT';
export type PropertyStatus = 'AVAILABLE' | 'RESERVED' | 'SOLD' | 'RENTED';

export interface PropertyPhoto {
  id?: number;
  photoId?: number;
  propertyId: number;
  filePath: string;
  isPrimary?: boolean;
  caption?: string | null;
  dateUploaded?: string;
  createdAt?: string;
}

export interface Property {
  id: number;
  title: string;
  description: string;
  propertyType: PropertyType;
  listingType: ListingType;
  price: number;
  location: string;
  address: string;
  city?: string;
  bedrooms: number;
  bathrooms: number;
  floorArea: number;
  lotArea: number;
  status: PropertyStatus;
  agentId: number | null;
  ownerId?: number | null;
  agent?: {
    id: number;
    fullName?: string;
    email?: string;
    userId?: number;
    user?: User;
  };
  owner?: User;
  photos?: PropertyPhoto[];
  createdAt: string;
  updatedAt: string;
}

export type InquiryStatus = 'PENDING' | 'CONTACTED' | 'QUALIFIED' | 'CLOSED' | 'Accepted' | 'Rejected' | 'Replied';

export interface Inquiry {
  id: number;
  clientId: number;
  propertyId: number;
  assignedAgentId: number | null;
  subject: string;
  message: string;
  contactNumber: string;
  status: InquiryStatus;
  inquiryType?: string;
  offerAmount?: number | null;
  client?: {
    id: number;
    fullName: string;
    email: string;
  };
  property?: {
    id: number;
    title: string;
    price: number;
    location: string;
  };
  assignedAgent?: {
    id: number;
    fullName: string;
    email: string;
  };
  createdAt: string;
  updatedAt: string;
}

export type AppointmentStatus = 'PENDING' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED';

export interface Appointment {
  id: number;
  propertyId: number;
  clientId: number;
  agentId: number;
  appointmentDate: string;
  appointmentTime: string;
  status: AppointmentStatus;
  notes: string | null;
  property?: {
    id: number;
    title: string;
    location: string;
    address: string;
    price: number;
  };
  client?: {
    id: number;
    fullName: string;
    email: string;
  };
  agent?: {
    id: number;
    fullName: string;
    email: string;
  };
  createdAt: string;
  updatedAt: string;
}

export type TransactionType = 'SALE' | 'RENT' | 'Sale' | 'Rent';
export type PaymentMethod = 'CASH' | 'BANK_TRANSFER' | 'CHECK' | 'FINANCING' | 'GCASH' | 'CARD';
export type TransactionStatus = 'PENDING' | 'COMPLETED' | 'CANCELLED' | 'Pending' | 'Completed' | 'Cancelled';

export interface PropertyTransaction {
  transactionId: number;
  id?: number;
  propertyId: number;
  buyerId: number;
  agentId: number;
  amount: number;
  transactionType: TransactionType;
  paymentMethod: string;
  transactionDate: string;
  status: TransactionStatus;
  notes?: string | null;
  property?: Property;
  buyer?: User;
  agent?: AgentProfile;
}

export interface AgentProfile {
  agentId: number;
  id?: number;
  userId: number;
  fullName: string;
  email: string;
  licenseNumber: string | null;
  agencyName: string | null;
  verificationStatus: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AuthResponse {
  message: string;
  accessToken: string;
  user: User;
}
