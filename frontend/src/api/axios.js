import axios from "axios";
import { API_BASE_URL } from "./endpoints";

//create axios instance
const api = axios.create({
  baseURL: API_BASE_URL, // your backend base URL
  withCredentials: true, // important: send refresh token cookie automatically
});

// 1️⃣ REQUEST INTERCEPTOR

// Adds Authorization header with the access token to every request
api.interceptors.request.use(
  (config) => {
    // The endpoints that include /auth/ should not include authentication headers like login, refresh, register, etc.
    if (config.url.includes("/auth/")) {
      return config;
    }
    const accessToken = localStorage.getItem("access");

    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ============================================================
// 2️⃣ RESPONSE INTERCEPTOR (Auto refresh on 401)
// ============================================================
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) prom.reject(error);
    else prom.resolve(token);
  });
  failedQueue = [];
};

api.interceptors.response.use(
  (response) => response, // If response OK, just return it
  async (error) => {
    const originalRequest = error.config;

    // If request already retried or not unauthorized → reject
    if (
      !error.response ||
      error.response.status !== 401 ||
      originalRequest._retry
    ) {
      return Promise.reject(error);
    }

    // Prevent multiple refreshes at the same time
    if (isRefreshing) {
      return new Promise(function (resolve, reject) {
        failedQueue.push({ resolve, reject });
      })
        .then((token) => {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return api(originalRequest);
        })
        .catch((err) => Promise.reject(err));
    }

    // ============================================================
    // Try to refresh access token
    // ============================================================
    originalRequest._retry = true;
    isRefreshing = true;

    try {
      const refreshResponse = await api.post("/auth/refresh/");
      const newAccessToken = refreshResponse.data.access;

      // Save new access token
      localStorage.setItem("access", newAccessToken);

      // Update all waiting requests
      processQueue(null, newAccessToken);

      // Retry the original request with new token
      originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
      return api(originalRequest);
    } catch (refreshError) {
      if (refreshError.response?.status === 401) {
        processQueue(refreshError, null);
        localStorage.removeItem("access");
        window.location.href = "/login"; // redirect to login if refresh fails
        return Promise.reject(refreshError);
      }
    } finally {
      isRefreshing = false;
    }
  }
);

export default api;
