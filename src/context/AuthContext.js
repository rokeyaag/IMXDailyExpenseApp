import React, { createContext, useState, useContext, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { authAPI, setSessionExpiredHandler, getLocalProfile, saveLocalProfile } from "../services/api";

const DEFAULT_USER = {
  id: 1,
  name: "Lutfor Rahman",
  email: "lutforitsolution@gmail.com",
  currency: "BDT",
};

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUserState] = useState(DEFAULT_USER);
  const [loading, setLoading] = useState(false);

  const setUser = (newUser) => {
    setUserState(newUser);
    if (newUser && typeof newUser === "object") {
      saveLocalProfile(newUser).catch(() => {});
    }
  };

  useEffect(() => {
    setSessionExpiredHandler(() => {
      getLocalProfile().then(p => setUserState(p || DEFAULT_USER)).catch(() => {});
    });
    checkToken();
  }, []);

  const checkToken = async () => {
    try {
      const local = await getLocalProfile();
      if (local) setUserState(local);
      const token = await AsyncStorage.getItem("access_token");
      if (token) {
        const res = await authAPI.profile();
        if (res.data) setUser(res.data);
      }
    } catch (error) {
      const local = await getLocalProfile();
      setUserState(local || DEFAULT_USER);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    try {
      const res = await authAPI.login({ email, password });
      if (res.data?.tokens?.access) await AsyncStorage.setItem("access_token", res.data.tokens.access);
      if (res.data?.tokens?.refresh) await AsyncStorage.setItem("refresh_token", res.data.tokens.refresh);
      const profileRes = await authAPI.profile();
      setUser(profileRes.data || DEFAULT_USER);
    } catch (e) {
      const local = await getLocalProfile();
      setUser(local || DEFAULT_USER);
    }
  };

  const logout = async () => {
    try {
      const refresh = await AsyncStorage.getItem("refresh_token");
      if (refresh) await authAPI.logout({ refresh });
    } catch {}
    await AsyncStorage.multiRemove(["access_token", "refresh_token"]);
    const local = await getLocalProfile();
    setUserState(local || DEFAULT_USER);
  };

  return (
    <AuthContext.Provider value={{ user, setUser, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
