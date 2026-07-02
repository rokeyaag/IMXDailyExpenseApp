import React, { createContext, useState, useContext, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { authAPI, setSessionExpiredHandler } from "../services/api";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // api.js calls this when a refresh-token attempt fails, so the UI
    // reflects the logged-out state instead of showing stale screens.
    setSessionExpiredHandler(() => setUser(null));
    checkToken();
  }, []);

  const checkToken = async () => {
    try {
      const token = await AsyncStorage.getItem("access_token");
      if (token) {
        const res = await authAPI.profile();
        setUser(res.data);
      }
    } catch (error) {
      // Only treat this as a real logout when the server actually rejected
      // the token. A network error/timeout should not wipe a valid session.
      if (error.response?.status === 401) {
        await AsyncStorage.multiRemove(["access_token", "refresh_token"]);
        setUser(null);
      }
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    const res = await authAPI.login({ email, password });
    await AsyncStorage.setItem("access_token", res.data.tokens.access);
    await AsyncStorage.setItem("refresh_token", res.data.tokens.refresh);
    const profileRes = await authAPI.profile();
    setUser(profileRes.data);
  };

  const logout = async () => {
    const refresh = await AsyncStorage.getItem("refresh_token");
    try { await authAPI.logout({ refresh }); } catch {}
    await AsyncStorage.multiRemove(["access_token", "refresh_token"]);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, setUser, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
