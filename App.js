import "react-native-gesture-handler";
import React, { useEffect, useState, useRef, Component } from "react";
import { AppState, Text, TextInput, ActivityIndicator, View, Platform, TouchableOpacity, StyleSheet } from "react-native";
import { useFonts, NotoSansBengali_400Regular, NotoSansBengali_700Bold } from "@expo-google-fonts/noto-sans-bengali";
import { AuthProvider } from "./src/context/AuthContext";
import { LanguageProvider } from "./src/context/LanguageContext";
import { registerForPushNotifications } from "./src/services/notifications";
import { getPin } from "./src/services/security";
import AppNavigator from "./src/navigation/AppNavigator";
import PinLockScreen from "./src/screens/PinLockScreen";

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.warn("Global Error caught:", error, errorInfo);
  }

  handleRestart = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <View style={ebStyles.container}>
          <View style={ebStyles.card}>
            <Text style={ebStyles.icon}>🛡️</Text>
            <Text style={ebStyles.title}>IMX Smart Recovery</Text>
            <Text style={ebStyles.subtitle}>
              একটি সাময়িক সমস্যা রিকভার করা হয়েছে। আপনার সকল ডেটা সম্পূর্ণ সুরক্ষিত আছে।
            </Text>
            <TouchableOpacity style={ebStyles.button} onPress={this.handleRestart} activeOpacity={0.85}>
              <Text style={ebStyles.buttonText}>অ্যাপ রিস্টার্ট করুন</Text>
            </TouchableOpacity>
          </View>
        </View>
      );
    }
    return this.props.children;
  }
}

const ebStyles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0F172A", justifyContent: "center", alignItems: "center", padding: 24 },
  card: { width: "100%", maxWidth: 360, backgroundColor: "#1E293B", borderRadius: 24, padding: 28, alignItems: "center", borderWidth: 1, borderColor: "#334155" },
  icon: { fontSize: 48, marginBottom: 16 },
  title: { fontSize: 20, fontWeight: "800", color: "#F8FAFC", marginBottom: 8 },
  subtitle: { fontSize: 13, color: "#94A3B8", textAlign: "center", lineHeight: 20, marginBottom: 24 },
  button: { width: "100%", backgroundColor: "#4F46E5", borderRadius: 16, paddingVertical: 14, alignItems: "center" },
  buttonText: { color: "#FFFFFF", fontWeight: "700", fontSize: 15 },
});

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
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#F8FAFC" }}>
        <ActivityIndicator size="large" color="#4F46E5" />
      </View>
    );
  }

  return (
    <ErrorBoundary>
      <LanguageProvider>
        {locked ? (
          <PinLockScreen onUnlock={() => setLocked(false)} />
        ) : (
          <AuthProvider>
            <AppNavigator />
          </AuthProvider>
        )}
      </LanguageProvider>
    </ErrorBoundary>
  );
}