import "react-native-gesture-handler";
import React, { useEffect, useState } from "react";
import { Text, TextInput } from "react-native";
import { useFonts, NotoSansBengali_400Regular, NotoSansBengali_700Bold } from "@expo-google-fonts/noto-sans-bengali";
import { ActivityIndicator, View } from "react-native";
import { AuthProvider } from "./src/context/AuthContext";
import { registerForPushNotifications } from "./src/services/notifications";
import { getPin } from "./src/services/security";
import AppNavigator from "./src/navigation/AppNavigator";
import PinLockScreen from "./src/screens/PinLockScreen";

const oldTextRender = Text.render;
Text.render = function(...args) {
  const origin = oldTextRender.call(this, ...args);
  return React.cloneElement(origin, {
    style: [{ fontFamily: "NotoSansBengali_400Regular" }, origin.props.style],
  });
};

export default function App() {
  const [fontsLoaded] = useFonts({
    NotoSansBengali_400Regular,
    NotoSansBengali_700Bold,
  });
  const [locked, setLocked] = useState(false);
  const [pinChecked, setPinChecked] = useState(false);

  useEffect(() => {
    registerForPushNotifications();
    checkPin();
  }, []);

  const checkPin = async () => {
    const pin = await getPin();
    if (pin) setLocked(true);
    setPinChecked(true);
  };

  if (!fontsLoaded || !pinChecked) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="#6366F1" />
      </View>
    );
  }

  if (locked) {
    return <PinLockScreen onUnlock={() => setLocked(false)} />;
  }

  return (
    <AuthProvider>
      <AppNavigator />
    </AuthProvider>
  );
}
