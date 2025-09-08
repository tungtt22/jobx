type FetchOptions = {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  body?: any;
  headers?: Record<string, string>;
};

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = 'ApiError';
  }
}

export async function fetchApi<T>(endpoint: string, options: FetchOptions = {}): Promise<T> {
  const { method = 'GET', body, headers = {} } = options;

  const response = await fetch(`/api${endpoint}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  const data = await response.json();

  if (!response.ok) {
    throw new ApiError(response.status, data.error || 'An error occurred');
  }

  return data;
}

// API client methods
export const apiClient = {
  // Jobs
  jobs: {
    getAll: () => fetchApi('/jobs'),
    create: (job: any) => fetchApi('/jobs', { method: 'POST', body: job }),
    delete: (id: string) => fetchApi(`/jobs?id=${id}`, { method: 'DELETE' }),
  },

  // Add more API endpoints as needed
  auth: {
    login: (credentials: { email: string; password: string }) =>
      fetchApi('/auth/login', { method: 'POST', body: credentials }),
    register: (userData: { email: string; password: string; name: string }) =>
      fetchApi('/auth/register', { method: 'POST', body: userData }),
  },
};
