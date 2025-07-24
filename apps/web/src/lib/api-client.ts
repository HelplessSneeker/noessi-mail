import axios from "axios";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

export const apiClient = axios.create({
  baseURL: API_URL,
  withCredentials: true,
});

// Request interceptor to add auth token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("accessToken");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle token refresh
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Don't retry refresh requests or if already retried
    if (error.response?.status === 401 && !originalRequest._retry && originalRequest.url !== "/auth/refresh") {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem("refreshToken");
        
        // Skip refresh if no refresh token available
        if (!refreshToken) {
          throw new Error("No refresh token available");
        }

        const response = await apiClient.post("/auth/refresh", {
          refreshToken,
        });

        localStorage.setItem("accessToken", response.data.data.accessToken);
        localStorage.setItem("refreshToken", response.data.data.refreshToken);
        
        // Also update cookies
        document.cookie = `accessToken=${response.data.data.accessToken}; path=/; max-age=900; SameSite=Lax`;
        document.cookie = `refreshToken=${response.data.data.refreshToken}; path=/; max-age=604800; SameSite=Lax`;

        originalRequest.headers.Authorization = `Bearer ${response.data.data.accessToken}`;
        return apiClient(originalRequest);
      } catch (refreshError) {
        // Refresh failed, clear tokens and redirect to home
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
        document.cookie = 'accessToken=; path=/; max-age=0';
        document.cookie = 'refreshToken=; path=/; max-age=0';
        window.location.href = "/";
        return Promise.reject(refreshError);
      }
    }

    // If this is a 401 on refresh endpoint, clear tokens and redirect
    if (error.response?.status === 401 && originalRequest.url === "/auth/refresh") {
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
      document.cookie = 'accessToken=; path=/; max-age=0';
      document.cookie = 'refreshToken=; path=/; max-age=0';
      window.location.href = "/";
    }

    return Promise.reject(error);
  }
);
