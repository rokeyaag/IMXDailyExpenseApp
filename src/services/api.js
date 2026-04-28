import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";

const BASE_URL = "https://imx-daily-expense-backend-production.up.railway.app";

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
  list:   () => api.get("/api/categories/"),
  create: (data) => api.post("/api/categories/", data),
};

export const analyticsAPI = {
  monthlyTrend:   () => api.get("/api/analytics/monthly-trend/"),
  dailyBreakdown: (params) => api.get("/api/analytics/daily-breakdown/", { params }),
};

export default api;
