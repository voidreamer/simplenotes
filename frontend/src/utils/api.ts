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

  async removeMember(householdId: string, memberId: string) {
    return this.request(`/api/households/${householdId}/members/${memberId}`, {
      method: 'DELETE',
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

  // Encryption Keys
  async setupUserKeys(data: {
    public_key: string;
    encrypted_private_key: string;
    salt: string;
    version?: number;
  }) {
    return this.request('/api/keys/user', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getUserKeys() {
    return this.request<{
      public_key: string;
      encrypted_private_key: string;
      salt: string;
      version: number;
      has_keys: boolean;
    }>('/api/keys/user');
  }

  async getUserKeyStatus() {
    return this.request<{
      has_encryption_setup: boolean;
      public_key: string | null;
    }>('/api/keys/user/status');
  }

  async getUserPublicKey(userId: string) {
    return this.request<{
      user_id: string;
      public_key: string;
    }>(`/api/keys/user/${userId}/public`);
  }

  async getHouseholdKey(householdId: string) {
    return this.request<{
      household_id: string;
      wrapped_key: string | null;
      has_key: boolean;
    }>(`/api/keys/household/${householdId}`);
  }

  async setHouseholdKeys(householdId: string, wrappedKeys: Record<string, string>) {
    return this.request(`/api/keys/household/${householdId}`, {
      method: 'POST',
      body: JSON.stringify({ wrapped_keys: wrappedKeys }),
    });
  }

  async addMemberKey(householdId: string, userId: string, wrappedKey: string) {
    return this.request(`/api/keys/household/${householdId}/member`, {
      method: 'POST',
      body: JSON.stringify({ user_id: userId, wrapped_key: wrappedKey }),
    });
  }

  async removeMemberKey(householdId: string, memberId: string) {
    return this.request(`/api/keys/household/${householdId}/member/${memberId}`, {
      method: 'DELETE',
    });
  }

  // Attachments
  async getAttachmentUploadUrl(
    listId: string,
    householdId: string,
    data: { filename: string; size: number; mime_type: string }
  ) {
    return this.request<{
      upload_url: string;
      attachment_id: string;
      s3_key: string;
    }>(`/api/lists/${listId}/attachments/upload-url?household_id=${householdId}`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async confirmAttachmentUpload(listId: string, householdId: string, attachmentId: string) {
    return this.request<{ message: string }>(
      `/api/lists/${listId}/attachments/${attachmentId}/confirm?household_id=${householdId}`,
      { method: 'POST' }
    );
  }

  async getAttachmentDownloadUrl(listId: string, householdId: string, attachmentId: string) {
    return this.request<{
      download_url: string;
      attachment: {
        id: string;
        filename: string;
        size: number;
        mime_type: string;
        s3_key: string;
        uploaded_by: string;
        created_at: string;
        status: string;
      };
    }>(`/api/lists/${listId}/attachments/${attachmentId}/url?household_id=${householdId}`);
  }

  async deleteAttachment(listId: string, householdId: string, attachmentId: string) {
    return this.request<{ message: string }>(
      `/api/lists/${listId}/attachments/${attachmentId}?household_id=${householdId}`,
      { method: 'DELETE' }
    );
  }

  async listAttachments(listId: string, householdId: string) {
    return this.request<Array<{
      id: string;
      filename: string;
      size: number;
      mime_type: string;
      s3_key: string;
      uploaded_by: string;
      created_at: string;
      status: string;
    }>>(`/api/lists/${listId}/attachments?household_id=${householdId}`);
  }
}

export const api = new ApiClient();
