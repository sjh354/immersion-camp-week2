
const API_BASE = process.env.NEXT_PUBLIC_API_BASE || '/api';

interface FetchOptions extends RequestInit {
  headers?: Record<string, string>;
}

// Token management
const getUser = () => {
  if (typeof window === 'undefined') return null;
  const userStr = localStorage.getItem('user');
  if (!userStr) return null;
  try {
    return JSON.parse(userStr);
  } catch {
    return null;
  }
};

export const getAccessToken = () => getUser()?.accessToken;
export const getRefreshToken = () => getUser()?.refreshToken;

export const setTokens = (accessToken: string, refreshToken: string) => {
  const user = getUser() || {};
  user.accessToken = accessToken;
  user.refreshToken = refreshToken;
  localStorage.setItem('user', JSON.stringify(user));
};

export const clearTokens = () => {
  localStorage.removeItem('user');
};

export const updateUser = (updates: Partial<any>) => {
  const user = getUser() || {};
  const newUser = { ...user, ...updates };
  localStorage.setItem('user', JSON.stringify(newUser));
  return newUser;
};

let isRefreshing = false;
let refreshSubscribers: ((token: string) => void)[] = [];

const onRefreshed = (accessToken: string) => {
  refreshSubscribers.forEach((callback) => callback(accessToken));
  refreshSubscribers = [];
};

const addRefreshSubscriber = (callback: (token: string) => void) => {
  refreshSubscribers.push(callback);
};

export const fetchWithAuth = async (endpoint: string, options: FetchOptions = {}): Promise<Response> => {
  const url = `${API_BASE}${endpoint}`;
  const accessToken = getAccessToken();

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (accessToken) {
    headers['Authorization'] = `Bearer ${accessToken}`;
  }

  try {
    const response = await fetch(url, { ...options, headers });

    // 401 Unauthorized handling
    if (response.status === 401) {
      if (!getRefreshToken()) {
        // No refresh token, just fail
        return response;
      }

      if (isRefreshing) {
        // Already refreshing, queue this request
        return new Promise((resolve) => {
          addRefreshSubscriber((newToken) => {
            // Retry with new token
            headers['Authorization'] = `Bearer ${newToken}`;
            resolve(fetch(url, { ...options, headers }));
          });
        });
      }

      isRefreshing = true;

      try {
        const refreshRes = await fetch(`${API_BASE}/auth/refresh`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ refreshToken: getRefreshToken() }),
        });

        if (refreshRes.ok) {
            const data = await refreshRes.json();
            const newAccessToken = data.accessToken;
            
            // Note: If backend rotates refresh tokens, handle that here too. 
            // Current backend implementation only returns accessToken.
            setTokens(newAccessToken, getRefreshToken() || '');
            
            isRefreshing = false;
            onRefreshed(newAccessToken);

            // Retry original request
            headers['Authorization'] = `Bearer ${newAccessToken}`;
            return fetch(url, { ...options, headers });
        } else {
            // Refresh failed
            isRefreshing = false;
            clearTokens();
            window.location.href = '/'; // Redirect to login
            return response;
        }
      } catch (error) {
        isRefreshing = false;
        clearTokens();
        window.location.href = '/';
        throw error;
      }
    }

    return response;
  } catch (error) {
    throw error;
  }
};
