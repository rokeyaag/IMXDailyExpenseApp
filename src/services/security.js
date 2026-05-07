import * as SecureStore from "expo-secure-store";
import * as LocalAuthentication from "expo-local-authentication";

export async function savePin(pin) {
  await SecureStore.setItemAsync("app_pin", pin);
}

export async function getPin() {
  return await SecureStore.getItemAsync("app_pin");
}

export async function deletePin() {
  await SecureStore.deleteItemAsync("app_pin");
}

export async function isBiometricAvailable() {
  const compatible = await LocalAuthentication.hasHardwareAsync();
  const enrolled = await LocalAuthentication.isEnrolledAsync();
  return compatible && enrolled;
}

export async function authenticateWithBiometric() {
  const result = await LocalAuthentication.authenticateAsync({
    promptMessage: "Authenticate to access IMX Expense",
    fallbackLabel: "Use PIN",
    cancelLabel: "Cancel",
  });
  return result.success;
}
