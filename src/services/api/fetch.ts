const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1';

export async function apiFetch(url: string, token: string | null, options: RequestInit = {}) {
  if (!token) {
    throw new Error('Authentication token required');
  }

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
  };

  if (options.headers) {
    Object.entries(options.headers).forEach(([key, value]) => {
      if (typeof value === 'string') {
        headers[key] = value;
      }
    });
  }

  const response = await fetch(`${API_BASE_URL}${url}`, {
    ...options,
    headers,
  });

  if (response.status === 204) {
    return null;
  }

  if (response.status === 304) {
    return null;
  }

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: response.statusText }));
    if (error.error && Array.isArray(error.error)) {
      const errorMessage = JSON.stringify({ error: 'Validation error', issues: error.error });
      throw new Error(errorMessage);
    }
    if (error.issues && Array.isArray(error.issues)) {
      const errorMessage = JSON.stringify({ error: error.error || 'Validation error', issues: error.issues });
      throw new Error(errorMessage);
    }
    if (typeof error.error === 'string') {
      throw new Error(error.error);
    }
    throw new Error(`API request failed: ${response.status} ${response.statusText}`);
  }

  return response.json();
}
