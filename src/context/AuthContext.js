import React, { createContext, useState, useContext, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { authAPI } from "../services/api";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkToken();
  }, []);

  const checkToken = async () => {
    try {
      const token = await AsyncStorage.getItem("access_token");
      if (token) {
        const res = await authAPI.profile();
        setUser(res.data);
      }
    } catch {
      await AsyncStorage.multiRemove(["access_token", "refresh_token"]);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    const res = await authAPI.login({ email, password });
    await AsyncStorage.setItem("access_token", res.data.tokens.access);
    await AsyncStorage.setItem("refresh_token", res.data.tokens.refresh);
    setUser(res.data.user);
  };

  const logout = async () => {
    const refresh = await AsyncStorage.getItem("refresh_token");
    try { await authAPI.logout({ refresh }); } catch {}
    await AsyncStorage.multiRemove(["access_token", "refresh_token"]);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
