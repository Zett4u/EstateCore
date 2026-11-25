export type UserRole = 'ADMIN' | 'AGENT' | 'CLIENT';

export interface User {
  id: number;
  fullName: string;
  email: string;
  role: UserRole;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export type PropertyType = 'HOUSE' | 'APARTMENT' | 'CONDOMINIUM' | 'COMMERCIAL' | 'LAND' | 'TOWNHOUSE';
export type ListingType = 'SALE' | 'RENT';
export type PropertyStatus = 'AVAILABLE' | 'RESERVED' | 'SOLD' | 'RENTED';

export interface Property {
  id: number;
  title: string;
  description: string;
  propertyType: PropertyType;
  listingType: ListingType;
  price: number;
  location: string;
  address: string;
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
  createdAt: string;
  updatedAt: string;
}

export type InquiryStatus = 'PENDING' | 'CONTACTED' | 'QUALIFIED' | 'CLOSED';

export interface Inquiry {
  id: number;
  clientId: number;
  propertyId: number;
  assignedAgentId: number | null;
  subject: string;
  message: string;
  contactNumber: string;
  status: InquiryStatus;
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

export interface AuthResponse {
  message: string;
  accessToken: string;
  user: User;
}
