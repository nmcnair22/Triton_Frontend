import { ApiService } from './ApiService';

const TERMINAL_CALL_STATUSES = ['completed', 'transferred', 'failed'];

function unwrapResponse(response, fallbackMessage) {
  return {
    success: response.data?.success ?? null,
    data: response.data?.data ?? null,
    meta: response.data?.meta ?? null,
    message: response.data?.message || fallbackMessage,
    sendResult: response.data?.send_result ?? null
  };
}

function throwApiError(error, fallbackMessage) {
  const isNetworkError = !error?.response && String(error?.message || '').toLowerCase() === 'network error';
  const detail =
    (isNetworkError ? 'Network Error. Check the backend API URL and CORS configuration.' : null) ||
    error?.response?.data?.message ||
    error?.response?.data?.error ||
    error?.message ||
    fallbackMessage;

  const normalizedError = new Error(detail);
  normalizedError.status = error?.response?.status || null;
  normalizedError.response = error?.response?.data || null;
  throw normalizedError;
}

export const CallOperationsService = {
  TERMINAL_CALL_STATUSES,

  async getVisits(params) {
    try {
      const response = await ApiService.get('dispatch2/dprompt/visits', params);
      return unwrapResponse(response, 'Dispatch call visits loaded.');
    } catch (error) {
      throwApiError(error, 'Failed to load dispatch call visits.');
    }
  },

  async getSummary(params) {
    try {
      const response = await ApiService.get('dispatch2/dprompt/summary', params);
      return unwrapResponse(response, 'Dispatch call summary loaded.');
    } catch (error) {
      throwApiError(error, 'Failed to load dispatch call summary.');
    }
  },

  async getVisitDetail(visitId, params = {}) {
    try {
      const response = await ApiService.get(`dispatch2/dprompt/visits/${visitId}`, params);
      return unwrapResponse(response, 'Dispatch call detail loaded.');
    } catch (error) {
      throwApiError(error, 'Failed to load dispatch call detail.');
    }
  },

  async getVisitActivity(visitId, params = {}) {
    try {
      const response = await ApiService.get(`dispatch2/dprompt/visits/${visitId}/activity`, params);
      return unwrapResponse(response, 'Dispatch call activity loaded.');
    } catch (error) {
      throwApiError(error, 'Failed to load dispatch call activity.');
    }
  },

  async updateTools(visitId, toolsRequiredOverride) {
    try {
      const response = await ApiService.patch(`dispatch2/dprompt/visits/${visitId}/tools`, {
        tools_required_override: toolsRequiredOverride
      });

      return unwrapResponse(response, 'Tools override updated.');
    } catch (error) {
      throwApiError(error, 'Failed to update tools override.');
    }
  },

  async sendVisit(visitId, force = false) {
    try {
      const response = await ApiService.post(`dispatch2/dprompt/visits/${visitId}/send`, {
        force
      });

      return unwrapResponse(response, 'Visit send/update submitted.');
    } catch (error) {
      throwApiError(error, 'Failed to send/update the visit.');
    }
  },

  async sendBulk(payload) {
    try {
      const response = await ApiService.post('dispatch2/dprompt/visits/send-bulk', payload);
      return unwrapResponse(response, 'Bulk send/update submitted.');
    } catch (error) {
      throwApiError(error, 'Failed to send/update the selected visits.');
    }
  },

  async refreshStatuses(payload) {
    try {
      const response = await ApiService.post('dispatch2/dprompt/status/refresh', payload);
      return unwrapResponse(response, 'Status refresh submitted.');
    } catch (error) {
      throwApiError(error, 'Failed to refresh DPROMPT statuses.');
    }
  },

  async getTestCalls(params = {}) {
    try {
      const response = await ApiService.get('dispatch2/dprompt/test-calls', params);
      return unwrapResponse(response, 'DPROMPT test calls loaded.');
    } catch (error) {
      throwApiError(error, 'Failed to load DPROMPT test calls.');
    }
  },

  async createTestCall(payload) {
    try {
      const response = await ApiService.post('dispatch2/dprompt/test-calls', payload);
      return unwrapResponse(response, 'DPROMPT test call created.');
    } catch (error) {
      throwApiError(error, 'Failed to create DPROMPT test call.');
    }
  },

  async getTestCallDetail(testCallId, params = {}) {
    try {
      const response = await ApiService.get(`dispatch2/dprompt/test-calls/${testCallId}`, params);
      return unwrapResponse(response, 'DPROMPT test call detail loaded.');
    } catch (error) {
      throwApiError(error, 'Failed to load DPROMPT test call detail.');
    }
  },

  async updateTestCall(testCallId, payload) {
    try {
      const response = await ApiService.patch(`dispatch2/dprompt/test-calls/${testCallId}`, payload);
      return unwrapResponse(response, 'DPROMPT test call updated.');
    } catch (error) {
      throwApiError(error, 'Failed to update DPROMPT test call.');
    }
  },

  async deleteTestCall(testCallId) {
    try {
      const response = await ApiService.delete(`dispatch2/dprompt/test-calls/${testCallId}`);
      return unwrapResponse(response, 'DPROMPT test call deleted.');
    } catch (error) {
      throwApiError(error, 'Failed to delete DPROMPT test call.');
    }
  },

  async getTestCallActivity(testCallId, params = {}) {
    try {
      const response = await ApiService.get(`dispatch2/dprompt/test-calls/${testCallId}/activity`, params);
      return unwrapResponse(response, 'DPROMPT test call activity loaded.');
    } catch (error) {
      throwApiError(error, 'Failed to load DPROMPT test call activity.');
    }
  },

  async sendTestCall(testCallId, force = false) {
    try {
      const response = await ApiService.post(`dispatch2/dprompt/test-calls/${testCallId}/send`, {
        force
      });
      return unwrapResponse(response, 'DPROMPT test call sent.');
    } catch (error) {
      throwApiError(error, 'Failed to send DPROMPT test call.');
    }
  },

  async refreshTestStatuses(payload = {}) {
    try {
      const response = await ApiService.post('dispatch2/dprompt/test-calls/status/refresh', payload);
      return unwrapResponse(response, 'DPROMPT test status refresh submitted.');
    } catch (error) {
      throwApiError(error, 'Failed to refresh DPROMPT test call statuses.');
    }
  }
};
