import "react-native-gesture-handler";
import React, { useEffect, useState, useRef } from "react";
import { AppState, Text, TextInput, ActivityIndicator, View, Platform } from "react-native";
import { useFonts, NotoSansBengali_400Regular, NotoSansBengali_700Bold } from "@expo-google-fonts/noto-sans-bengali";
import { AuthProvider } from "./src/context/AuthContext";
import { LanguageProvider } from "./src/context/LanguageContext";
import { registerForPushNotifications } from "./src/services/notifications";
import { getPin } from "./src/services/security";
import AppNavigator from "./src/navigation/AppNavigator";
import PinLockScreen from "./src/screens/PinLockScreen";

export default function App() {
  const [fontsLoaded] = useFonts({
    NotoSansBengali_400Regular,
    NotoSansBengali_700Bold,
  });
  const [locked, setLocked] = useState(false);
  const [pinChecked, setPinChecked] = useState(false);
  const appState = useRef(AppState.currentState);
  useEffect(() => {
    try {
      registerForPushNotifications();
    } catch (e) {}
    checkPin();
    const sub = AppState.addEventListener("change", nextState => {
      if (appState.current && appState.current.match(/inactive|background/) && nextState === "active") {
        checkPin();
      }
      appState.current = nextState;
    });
    return () => sub?.remove?.();
  }, []);
  const checkPin = async () => {
    try {
      const pin = await getPin();
      if (pin) setLocked(true);
    } catch (e) {
      console.warn("Failed to check PIN:", e);
    } finally {
      setPinChecked(true);
    }
  };
  if (!fontsLoaded || !pinChecked) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="#6366F1" />
      </View>
    );
  }
  return (
    <LanguageProvider>
      {locked ? (
        <PinLockScreen onUnlock={() => setLocked(false)} />
      ) : (
        <AuthProvider>
          <AppNavigator />
        </AuthProvider>
      )}
    </LanguageProvider>
  );
}