import { Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SecureStore from "expo-secure-store";
import * as LocalAuthentication from "expo-local-authentication";

export async function savePin(pin) {
  if (Platform.OS === "web") {
    await AsyncStorage.setItem("app_pin", pin);
    return;
  }
  try {
    await SecureStore.setItemAsync("app_pin", pin);
  } catch (e) {
    await AsyncStorage.setItem("app_pin", pin);
  }
}

export async function getPin() {
  if (Platform.OS === "web") {
    return await AsyncStorage.getItem("app_pin");
  }
  try {
    return await SecureStore.getItemAsync("app_pin");
  } catch (e) {
    return await AsyncStorage.getItem("app_pin");
  }
}

export async function deletePin() {
  if (Platform.OS === "web") {
    await AsyncStorage.removeItem("app_pin");
    return;
  }
  try {
    await SecureStore.deleteItemAsync("app_pin");
  } catch (e) {
    await AsyncStorage.removeItem("app_pin");
  }
}

export async function isBiometricAvailable() {
  if (Platform.OS === "web") {
    return false;
  }
  try {
    const compatible = await LocalAuthentication.hasHardwareAsync();
    const enrolled = await LocalAuthentication.isEnrolledAsync();
    return compatible && enrolled;
  } catch (e) {
    return false;
  }
}

export async function authenticateWithBiometric() {
  if (Platform.OS === "web") {
    return false;
  }
  try {
    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: "Authenticate to access IMX Expense",
      fallbackLabel: "Use PIN",
      cancelLabel: "Cancel",
    });
    return result.success;
  } catch (e) {
    return false;
  }
}
