
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

class ApiService {
  private async request<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;

    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...options?.headers,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'API request failed');
      }

      return data;
    } catch (error) {
      console.error(`API Error (${endpoint}):`, error);
      throw error;
    }
  }

  async getBatches() {
    return this.request<{ success: boolean; data: any[] }>('/batches');
  }

  async getBatch(id: string) {
    return this.request<{ success: boolean; data: any }>(`/batches/${id}`);
  }

  async createBatch(batchData: any) {
    return this.request<{ success: boolean; data: any }>('/batches', {
      method: 'POST',
      body: JSON.stringify(batchData),
    });
  }

  async updateBatch(id: string, batchData: any) {
    return this.request<{ success: boolean; data: any }>(`/batches/${id}`, {
      method: 'PUT',
      body: JSON.stringify(batchData),
    });
  }

  async deleteBatch(id: string) {
    return this.request<{ success: boolean; message: string }>(`/batches/${id}`, {
      method: 'DELETE',
    });
  }

  async assignWorkerToBatch(batchId: string, workerId: string) {
    return this.request<{ success: boolean; message: string }>(
      `/batches/${batchId}/workers/${workerId}`,
      { method: 'POST', body: JSON.stringify({}) }
    );
  }

  async removeWorkerFromBatch(batchId: string, workerId: string) {
    return this.request<{ success: boolean; message: string }>(
      `/batches/${batchId}/workers/${workerId}`,
      { method: 'DELETE' }
    );
  }

  async getWorkers() {
    return this.request<{ success: boolean; data: any[] }>('/workers');
  }

  async getWorker(id: string) {
    return this.request<{ success: boolean; data: any }>(`/workers/${id}`);
  }

  async createWorker(workerData: any) {
    return this.request<{ success: boolean; data: any }>('/workers', {
      method: 'POST',
      body: JSON.stringify(workerData),
    });
  }

  async updateWorker(id: string, workerData: any) {
    return this.request<{ success: boolean; data: any }>(`/workers/${id}`, {
      method: 'PUT',
      body: JSON.stringify(workerData),
    });
  }

  async deleteWorker(id: string) {
    return this.request<{ success: boolean; message: string }>(`/workers/${id}`, {
      method: 'DELETE',
    });
  }

  async getMessageTemplates() {
    return this.request<{ success: boolean; data: any[] }>('/messages/templates');
  }

  async getMessageTemplate(id: string) {
    return this.request<{ success: boolean; data: any }>(`/messages/templates/${id}`);
  }

  async createMessageTemplate(templateData: any) {
    return this.request<{ success: boolean; data: any }>('/messages/templates', {
      method: 'POST',
      body: JSON.stringify(templateData),
    });
  }

  async updateMessageTemplate(id: string, templateData: any) {
    return this.request<{ success: boolean; data: any }>(`/messages/templates/${id}`, {
      method: 'PUT',
      body: JSON.stringify(templateData),
    });
  }

  async deleteMessageTemplate(id: string) {
    return this.request<{ success: boolean; message: string }>(`/messages/templates/${id}`, {
      method: 'DELETE',
    });
  }

  async getSMSMessages(filters?: { status?: string; startDate?: string; endDate?: string }) {
    const params = new URLSearchParams();
    if (filters?.status) params.append('status', filters.status);
    if (filters?.startDate) params.append('startDate', filters.startDate);
    if (filters?.endDate) params.append('endDate', filters.endDate);

    const query = params.toString() ? `?${params.toString()}` : '';
    return this.request<{ success: boolean; data: any[] }>(`/messages/sms${query}`);
  }

  async getCommandResponses() {
    return this.request<{ success: boolean; data: any[] }>('/responses');
  }

  async getCommandResponse(id: string) {
    return this.request<{ success: boolean; data: any }>(`/responses/${id}`);
  }

  async createCommandResponse(responseData: any) {
    return this.request<{ success: boolean; data: any }>('/responses', {
      method: 'POST',
      body: JSON.stringify(responseData),
    });
  }

  async updateCommandResponse(id: string, responseData: any) {
    return this.request<{ success: boolean; data: any }>(`/responses/${id}`, {
      method: 'PUT',
      body: JSON.stringify(responseData),
    });
  }

  async deleteCommandResponse(id: string) {
    return this.request<{ success: boolean; message: string }>(`/responses/${id}`, {
      method: 'DELETE',
    });
  }

  async getMessageReport(startDate: string, endDate: string) {
    return this.request<{ success: boolean; data: any[] }>(
      `/reports/messages?startDate=${startDate}&endDate=${endDate}`
    );
  }

  async getTaskReport(startDate: string, endDate: string) {
    return this.request<{ success: boolean; data: any[] }>(
      `/reports/tasks?startDate=${startDate}&endDate=${endDate}`
    );
  }

  async getWorkerReport(startDate: string, endDate: string) {
    return this.request<{ success: boolean; data: any[] }>(
      `/reports/workers?startDate=${startDate}&endDate=${endDate}`
    );
  }

  async getBatchReport(startDate: string, endDate: string) {
    return this.request<{ success: boolean; data: any[] }>(
      `/reports/batches?startDate=${startDate}&endDate=${endDate}`
    );
  }

  async getDashboardStats() {
    return this.request<{ success: boolean; data: any }>('/reports/stats');
  }

  async healthCheck() {
    return this.request<{ status: string; message: string; timestamp: string }>('/health');
  }
}

export const api = new ApiService();
