import {
  User,
  Property,
  Inquiry,
  Appointment,
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
  async register(body: { fullName: string; email: string; password: string }): Promise<AuthResponse> {
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

  // Inquiries Endpoints
  async getInquiries(): Promise<Inquiry[]> {
    return this.request<Inquiry[]>('/inquiries');
  }

  async getInquiry(id: number): Promise<Inquiry> {
    return this.request<Inquiry>(`/inquiries/${id}`);
  }

  async createInquiry(body: { propertyId: number; subject: string; message: string; contactNumber: string }): Promise<Inquiry> {
    return this.request<Inquiry>('/inquiries', {
      method: 'POST',
      body: JSON.stringify(body),
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
}

export const api = new ApiService();
