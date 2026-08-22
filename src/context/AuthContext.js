import React, { createContext, useState, useContext, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { authAPI, setSessionExpiredHandler } from "../services/api";

const DEFAULT_USER = {
  id: 1,
  name: "Lutfor Rahman",
  email: "lutforitsolution@gmail.com",
  currency: "BDT",
};

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(DEFAULT_USER);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setSessionExpiredHandler(() => {
      // Keep active user session even if backend token expires
      setUser(DEFAULT_USER);
    });
    checkToken();
  }, []);

  const checkToken = async () => {
    try {
      const token = await AsyncStorage.getItem("access_token");
      if (token) {
        const res = await authAPI.profile();
        if (res.data) setUser(res.data);
      } else {
        setUser(DEFAULT_USER);
      }
    } catch (error) {
      setUser(DEFAULT_USER);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    try {
      const res = await authAPI.login({ email, password });
      await AsyncStorage.setItem("access_token", res.data.tokens.access);
      await AsyncStorage.setItem("refresh_token", res.data.tokens.refresh);
      const profileRes = await authAPI.profile();
      setUser(profileRes.data || DEFAULT_USER);
    } catch (e) {
      setUser(DEFAULT_USER);
    }
  };

  const logout = async () => {
    try {
      const refresh = await AsyncStorage.getItem("refresh_token");
      if (refresh) await authAPI.logout({ refresh });
    } catch {}
    await AsyncStorage.multiRemove(["access_token", "refresh_token"]);
    setUser(DEFAULT_USER);
  };

  return (
    <AuthContext.Provider value={{ user, setUser, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
