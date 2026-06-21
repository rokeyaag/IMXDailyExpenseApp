import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";

export const BASE_URL = process.env.EXPO_PUBLIC_API_URL || "https://imx-daily-expense-backend-production-f3cf.up.railway.app";

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
  headers: { "Content-Type": "application/json" },
});

api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem("access_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        const refreshToken = await AsyncStorage.getItem("refresh_token");
        if (!refreshToken) return Promise.reject(error);
        const res = await axios.post(`${BASE_URL}/api/auth/token/refresh/`, { refresh: refreshToken });
        const newAccess = res.data.access;
        await AsyncStorage.setItem("access_token", newAccess);
        originalRequest.headers.Authorization = `Bearer ${newAccess}`;
        return api(originalRequest);
      } catch (refreshError) {
        await AsyncStorage.multiRemove(["access_token", "refresh_token"]);
        return Promise.reject(refreshError);
      }
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  register: (data) => api.post("/api/auth/register/", data),
  login:    (data) => api.post("/api/auth/login/", data),
  logout:   (data) => api.post("/api/auth/logout/", data),
  profile:  ()     => api.get("/api/auth/profile/"),
};

export const expenseAPI = {
  list:       (params)   => api.get("/api/expenses/", { params }),
  create:     (data)     => api.post("/api/expenses/", data),
  update:     (id, data) => api.put(`/api/expenses/${id}/`, data),
  delete:     (id)       => api.delete(`/api/expenses/${id}/`),
  summary:    (params)   => api.get("/api/expenses/summary/", { params }),
  byCategory: (params)   => api.get("/api/expenses/by_category/", { params }),
};

export const categoryAPI = {
  list:   ()         => api.get("/api/categories/"),
  create: (data)     => api.post("/api/categories/", data),
  update: (id, data) => api.put(`/api/categories/${id}/`, data),
  delete: (id)       => api.delete(`/api/categories/${id}/`),
};

export const analyticsAPI = {
  monthlyTrend:   () => api.get("/api/analytics/monthly-trend/"),
  dailyBreakdown: (params) => api.get("/api/analytics/daily-breakdown/", { params }),
};

export default api;



