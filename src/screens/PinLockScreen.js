import React, { useState, useEffect } from "react";
import { View, Text, TouchableOpacity, StyleSheet, Vibration, Alert } from "react-native";
import { getPin, isBiometricAvailable, authenticateWithBiometric } from "../services/security";
import { useLanguage } from "../context/LanguageContext";

export default function PinLockScreen({ onUnlock }) {
  const { t } = useLanguage();
  const [pin, setPin] = useState("");
  const [biometricAvailable, setBiometricAvailable] = useState(false);

  useEffect(() => {
    checkBiometric();
  }, []);

  const checkBiometric = async () => {
    const available = await isBiometricAvailable();
    setBiometricAvailable(available);
    if (available) tryBiometric();
  };

  const tryBiometric = async () => {
    const success = await authenticateWithBiometric();
    if (success) onUnlock();
  };

  const handlePress = async (num) => {
    const newPin = pin + num;
    setPin(newPin);
    if (newPin.length === 4) {
      const savedPin = await getPin();
      if (newPin === savedPin) {
        onUnlock();
      } else {
        Vibration.vibrate(400);
        Alert.alert(t("wrongPin"), t("tryAgainPin"));
        setPin("");
      }
    }
  };

  const handleDelete = () => setPin(pin.slice(0, -1));

  const dots = [0, 1, 2, 3];
  const keys = [
    ["1", "2", "3"],
    ["4", "5", "6"],
    ["7", "8", "9"],
    [biometricAvailable ? "BIO" : "", "0", "DEL"],
  ];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.logo}>IMX</Text>
        <Text style={styles.title}>{t("enterPin")}</Text>
        <Text style={styles.subtitle}>{t("enterPinSubtitle")}</Text>
      </View>

      <View style={styles.dotsRow}>
        {dots.map(i => (
          <View key={i} style={[styles.dot, pin.length > i && styles.dotFilled]} />
        ))}
      </View>

      <View style={styles.keypad}>
        {keys.map((row, ri) => (
          <View key={ri} style={styles.keyRow}>
            {row.map((key, ki) => (
              <TouchableOpacity
                key={ki}
                style={[styles.key, !key && styles.keyEmpty]}
                onPress={() => {
                  if (key === "DEL") handleDelete();
                  else if (key === "BIO") tryBiometric();
                  else if (key) handlePress(key);
                }}
                disabled={!key}>
                <Text style={styles.keyText}>{key === "DEL" ? "⌫" : key === "BIO" ? "🔓" : key}</Text>
              </TouchableOpacity>
            ))}
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container:  { flex: 1, backgroundColor: "#6366F1", alignItems: "center", justifyContent: "center" },
  header:     { alignItems: "center", marginBottom: 48 },
  logo:       { fontSize: 32, fontWeight: "bold", color: "#fff", marginBottom: 16 },
  title:      { fontSize: 22, fontWeight: "bold", color: "#fff", marginBottom: 8 },
  subtitle:   { fontSize: 14, color: "rgba(255,255,255,0.7)" },
  dotsRow:    { flexDirection: "row", gap: 16, marginBottom: 48 },
  dot:        { width: 18, height: 18, borderRadius: 9, borderWidth: 2, borderColor: "#fff", backgroundColor: "transparent" },
  dotFilled:  { backgroundColor: "#fff" },
  keypad:     { gap: 16 },
  keyRow:     { flexDirection: "row", gap: 20 },
  key:        { width: 80, height: 80, borderRadius: 40, backgroundColor: "rgba(255,255,255,0.15)", justifyContent: "center", alignItems: "center" },
  keyEmpty:   { backgroundColor: "transparent" },
  keyText:    { fontSize: 24, fontWeight: "bold", color: "#fff" },
});
