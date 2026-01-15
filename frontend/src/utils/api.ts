import config from './config';
import { useAuthStore } from '../stores/store';

const BASE_URL = config.apiUrl;

class ApiClient {
  private getHeaders(): HeadersInit {
    const token = useAuthStore.getState().accessToken;
    return {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
    };
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${BASE_URL}${endpoint}`;
    const response = await fetch(url, {
      ...options,
      headers: {
        ...this.getHeaders(),
        ...options.headers,
      },
    });

    if (response.status === 401) {
      useAuthStore.getState().logout();
      window.location.href = '/login';
      throw new Error('Unauthorized');
    }

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: 'An error occurred' }));
      throw new Error(error.detail || 'Request failed');
    }

    return response.json();
  }

  // Auth
  async register(name: string, picture?: string) {
    return this.request('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name, picture }),
    });
  }

  async getMe() {
    return this.request('/api/auth/me');
  }

  async validateToken() {
    return this.request('/api/auth/validate', { method: 'POST' });
  }

  // Users
  async updateProfile(data: { name?: string; picture?: string }) {
    return this.request('/api/users/profile', {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  // Households
  async getHouseholds() {
    return this.request('/api/households/');
  }

  async createHousehold(name: string) {
    return this.request('/api/households/', {
      method: 'POST',
      body: JSON.stringify({ name }),
    });
  }

  async getHousehold(id: string) {
    return this.request(`/api/households/${id}`);
  }

  async updateHousehold(id: string, data: { name?: string }) {
    return this.request(`/api/households/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async deleteHousehold(id: string) {
    return this.request(`/api/households/${id}`, {
      method: 'DELETE',
    });
  }

  async leaveHousehold(id: string) {
    return this.request(`/api/households/${id}/leave`, {
      method: 'POST',
    });
  }

  // Lists
  async getLists(householdId: string) {
    return this.request(`/api/lists/household/${householdId}`);
  }

  async createList(data: {
    household_id: string;
    title: string;
    type: string;
    color?: string;
    icon?: string;
  }) {
    return this.request('/api/lists/', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getList(id: string, householdId: string) {
    return this.request(`/api/lists/${id}?household_id=${householdId}`);
  }

  async updateList(
    id: string,
    householdId: string,
    data: { title?: string; items?: unknown[]; content?: string; color?: string; icon?: string; pinned?: boolean }
  ) {
    return this.request(`/api/lists/${id}?household_id=${householdId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async deleteList(id: string, householdId: string) {
    return this.request(`/api/lists/${id}?household_id=${householdId}`, {
      method: 'DELETE',
    });
  }

  async addListItem(
    listId: string,
    householdId: string,
    data: { text: string; quantity?: number; unit?: string; category?: string }
  ) {
    return this.request(`/api/lists/${listId}/items?household_id=${householdId}`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async toggleListItem(listId: string, householdId: string, itemId: string) {
    return this.request(
      `/api/lists/${listId}/items/${itemId}/toggle?household_id=${householdId}`,
      { method: 'PATCH' }
    );
  }

  async deleteListItem(listId: string, householdId: string, itemId: string) {
    return this.request(
      `/api/lists/${listId}/items/${itemId}?household_id=${householdId}`,
      { method: 'DELETE' }
    );
  }

  async updateListItem(
    listId: string,
    householdId: string,
    itemId: string,
    data: { text?: string; quantity?: number; unit?: string; category?: string; note?: string }
  ) {
    return this.request(
      `/api/lists/${listId}/items/${itemId}?household_id=${householdId}`,
      { method: 'PATCH', body: JSON.stringify(data) }
    );
  }

  // Invites
  async createInvite(householdId: string, email: string) {
    return this.request('/api/invites/', {
      method: 'POST',
      body: JSON.stringify({ household_id: householdId, email }),
    });
  }

  async getPendingInvites() {
    return this.request('/api/invites/pending');
  }

  async getInviteDetails(inviteId: string) {
    return this.request(`/api/invites/${inviteId}`);
  }

  async acceptInvite(inviteId: string) {
    return this.request(`/api/invites/${inviteId}/accept`, {
      method: 'POST',
    });
  }

  async declineInvite(inviteId: string) {
    return this.request(`/api/invites/${inviteId}/decline`, {
      method: 'POST',
    });
  }
}

export const api = new ApiClient();
