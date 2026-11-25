import {
  User,
  Property,
  PropertyPhoto,
  Inquiry,
  Appointment,
  PropertyTransaction,
  AgentProfile,
  AuthResponse,
  UserRole,
} from '../types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

class ApiService {
  private getToken(): string | null {
    return localStorage.getItem('estatecore_token');
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const token = this.getToken();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      const message = Array.isArray(data.message)
        ? data.message.join(', ')
        : data.message || `Request failed with status ${response.status}`;
      throw new Error(message);
    }

    return data as T;
  }

  // Auth Endpoints
  async register(body: { fullName: string; email: string; password: string; role?: string; contactNumber?: string }): Promise<AuthResponse> {
    return this.request<AuthResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(body),
    });
  }

  async login(body: { email: string; password: string }): Promise<AuthResponse> {
    return this.request<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(body),
    });
  }

  async me(): Promise<User> {
    return this.request<User>('/auth/me');
  }

  // Properties Endpoints
  async getProperties(params?: Record<string, string | number>): Promise<Property[]> {
    let query = '';
    if (params) {
      const searchParams = new URLSearchParams();
      Object.entries(params).forEach(([key, val]) => {
        if (val !== undefined && val !== '') {
          searchParams.append(key, String(val));
        }
      });
      const qs = searchParams.toString();
      if (qs) query = `?${qs}`;
    }
    return this.request<Property[]>(`/properties${query}`);
  }

  async getProperty(id: number): Promise<Property> {
    return this.request<Property>(`/properties/${id}`);
  }

  async createProperty(body: Partial<Property>): Promise<Property> {
    return this.request<Property>('/properties', {
      method: 'POST',
      body: JSON.stringify(body),
    });
  }

  async updateProperty(id: number, body: Partial<Property>): Promise<Property> {
    return this.request<Property>(`/properties/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(body),
    });
  }

  async deleteProperty(id: number): Promise<{ message: string; id: number }> {
    return this.request<{ message: string; id: number }>(`/properties/${id}`, {
      method: 'DELETE',
    });
  }

  // Property Photos (Lab 05 EP 13, 14)
  async getPropertyPhotos(propertyId: number): Promise<{ totalItems: number; data: PropertyPhoto[] }> {
    return this.request<{ totalItems: number; data: PropertyPhoto[] }>(`/properties/${propertyId}/photos`);
  }

  async uploadPropertyPhoto(
    propertyId: number,
    body: FormData | { filePath: string; isPrimary?: boolean; caption?: string },
  ): Promise<PropertyPhoto> {
    const token = this.getToken();
    const headers: Record<string, string> = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    let requestInit: RequestInit;
    if (body instanceof FormData) {
      requestInit = {
        method: 'POST',
        headers,
        body,
      };
    } else {
      headers['Content-Type'] = 'application/json';
      requestInit = {
        method: 'POST',
        headers,
        body: JSON.stringify(body),
      };
    }

    const response = await fetch(`${API_BASE_URL}/properties/${propertyId}/photos`, requestInit);
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      const message = Array.isArray(data.message) ? data.message.join(', ') : data.message || 'Photo upload failed';
      throw new Error(message);
    }
    return data as PropertyPhoto;
  }

  // Inquiries Endpoints (Lab 05 EP 15, 16, 17)
  async getInquiries(): Promise<Inquiry[]> {
    return this.request<Inquiry[]>('/inquiries');
  }

  async getInquiry(id: number): Promise<Inquiry> {
    return this.request<Inquiry>(`/inquiries/${id}`);
  }

  async createInquiry(body: {
    propertyId: number;
    subject?: string;
    message: string;
    contactNumber?: string;
    inquiryType?: string;
    offerAmount?: number;
  }): Promise<Inquiry> {
    return this.request<Inquiry>('/inquiries', {
      method: 'POST',
      body: JSON.stringify(body),
    });
  }

  async createPropertyInquiry(
    propertyId: number,
    body: {
      message: string;
      inquiryType?: string;
      offerAmount?: number;
      contactNumber?: string;
      subject?: string;
    },
  ): Promise<Inquiry> {
    return this.request<Inquiry>(`/properties/${propertyId}/inquiries`, {
      method: 'POST',
      body: JSON.stringify(body),
    });
  }

  async getPropertyInquiries(propertyId: number): Promise<any> {
    return this.request<any>(`/properties/${propertyId}/inquiries`);
  }

  async updatePropertyInquiryStatus(propertyId: number, inquiryId: number, status: string): Promise<any> {
    return this.request<any>(`/properties/${propertyId}/inquiries/${inquiryId}`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  }

  async updateInquiry(id: number, body: Partial<Inquiry>): Promise<Inquiry> {
    return this.request<Inquiry>(`/inquiries/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(body),
    });
  }

  async deleteInquiry(id: number): Promise<{ message: string; id: number }> {
    return this.request<{ message: string; id: number }>(`/inquiries/${id}`, {
      method: 'DELETE',
    });
  }

  // Appointments Endpoints
  async getAppointments(): Promise<Appointment[]> {
    return this.request<Appointment[]>('/appointments');
  }

  async getAppointment(id: number): Promise<Appointment> {
    return this.request<Appointment>(`/appointments/${id}`);
  }

  async createAppointment(body: { propertyId: number; appointmentDate: string; appointmentTime: string; notes?: string }): Promise<Appointment> {
    return this.request<Appointment>('/appointments', {
      method: 'POST',
      body: JSON.stringify(body),
    });
  }

  async updateAppointment(id: number, body: Partial<Appointment>): Promise<Appointment> {
    return this.request<Appointment>(`/appointments/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(body),
    });
  }

  async deleteAppointment(id: number): Promise<{ message: string; id: number }> {
    return this.request<{ message: string; id: number }>(`/appointments/${id}`, {
      method: 'DELETE',
    });
  }

  // Transactions Endpoints (Lab 05 EP 18, 19)
  async getTransactions(propertyId?: number): Promise<PropertyTransaction[]> {
    const qs = propertyId ? `?propertyId=${propertyId}` : '';
    return this.request<PropertyTransaction[]>(`/transactions${qs}`);
  }

  async getTransaction(id: number): Promise<PropertyTransaction> {
    return this.request<PropertyTransaction>(`/transactions/${id}`);
  }

  async recordTransaction(body: {
    propertyId: number;
    buyerId: number;
    amount: number;
    transactionType: string;
    paymentMethod: string;
    transactionDate?: string;
    notes?: string;
  }): Promise<PropertyTransaction> {
    return this.request<PropertyTransaction>('/transactions', {
      method: 'POST',
      body: JSON.stringify(body),
    });
  }

  // Agents Endpoints (Lab 05 EP 5, 6)
  async getAgents(params?: { agencyName?: string; page?: number; limit?: number }): Promise<AgentProfile[]> {
    const searchParams = new URLSearchParams();
    if (params?.agencyName) searchParams.append('agencyName', params.agencyName);
    if (params?.page) searchParams.append('page', String(params.page));
    if (params?.limit) searchParams.append('limit', String(params.limit));
    const qs = searchParams.toString() ? `?${searchParams.toString()}` : '';
    const res = await this.request<any>(`/agents${qs}`);
    return Array.isArray(res) ? res : res.data || [];
  }

  async getAgent(id: number): Promise<AgentProfile> {
    return this.request<AgentProfile>(`/agents/${id}`);
  }

  async createAgentProfile(body: { userId: number; licenseNumber?: string; agencyName?: string }): Promise<AgentProfile> {
    return this.request<AgentProfile>('/agents', {
      method: 'POST',
      body: JSON.stringify(body),
    });
  }

  // Users Endpoints (Admin only)
  async getUsers(params?: { role?: UserRole; isActive?: boolean }): Promise<User[]> {
    const searchParams = new URLSearchParams();
    if (params?.role) searchParams.append('role', params.role);
    if (params?.isActive !== undefined) searchParams.append('isActive', String(params.isActive));
    const qs = searchParams.toString() ? `?${searchParams.toString()}` : '';
    return this.request<User[]>(`/users${qs}`);
  }

  async getUser(id: number): Promise<User> {
    return this.request<User>(`/users/${id}`);
  }

  async updateUser(id: number, body: Partial<User> & { password?: string }): Promise<User> {
    return this.request<User>(`/users/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(body),
    });
  }

  async deactivateUser(id: number): Promise<{ message: string; id: number }> {
    return this.request<{ message: string; id: number }>(`/users/${id}`, {
      method: 'DELETE',
    });
  }

  async deleteUser(id: number): Promise<void> {
    return this.request<void>(`/users/${id}`, {
      method: 'DELETE',
    });
  }
}

export const api = new ApiService();
