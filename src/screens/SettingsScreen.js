import React, { useState, useEffect } from "react";
import { View, Text, TouchableOpacity, StyleSheet, Switch, Alert, TextInput, ScrollView, Platform, SafeAreaView } from "react-native";
import { savePin, getPin, deletePin, isBiometricAvailable } from "../services/security";
import api from "../services/api";
import { useLanguage } from "../context/LanguageContext";

export default function SettingsScreen({ navigation }) {
  const { t } = useLanguage();
  const [pinEnabled, setPinEnabled] = useState(false);
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [showSetPin, setShowSetPin] = useState(false);
  const [newPin, setNewPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");

  useEffect(() => { checkSettings(); }, []);

  const checkSettings = async () => {
    const pin = await getPin();
    setPinEnabled(!!pin);
    const bio = await isBiometricAvailable();
    setBiometricAvailable(bio);
  };

  const handlePinToggle = async (value) => {
    if (value) {
      setShowSetPin(true);
    } else {
      Alert.alert(t("disablePin"), t("disablePinMsg"), [
        { text: t("cancel"), style: "cancel" },
        {
          text: t("disable"),
          style: "destructive",
          onPress: async () => {
            await deletePin();
            setPinEnabled(false);
          },
        },
      ]);
    }
  };

  const handleClearData = async () => {
    Alert.alert(t("clearAllData"), t("clearAllConfirm"), [
      { text: t("cancel"), style: "cancel" },
      {
        text: t("clearAll"),
        style: "destructive",
        onPress: async () => {
          try {
            await api.delete("/api/expenses/clear_all/");
            await deletePin();
            Alert.alert(t("done"), t("dataCleared"));
          } catch (e) {
            Alert.alert(t("done"), t("dataCleared"));
          }
        },
      },
    ]);
  };

  const handleSavePin = async () => {
    if (newPin.length !== 4) { Alert.alert(t("error"), t("pinMust4")); return; }
    if (newPin !== confirmPin) { Alert.alert(t("error"), t("pinNotMatch")); return; }
    await savePin(newPin);
    setPinEnabled(true);
    setShowSetPin(false);
    setNewPin("");
    setConfirmPin("");
    Alert.alert(t("success"), t("pinSetSuccess"));
  };

  return (
    <SafeAreaView style={styles.screen}>
      {/* Top Header */}
      <View style={styles.topNav}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn} activeOpacity={0.7}>
          <Text style={styles.backArrow}>←</Text>
        </TouchableOpacity>
        <Text style={styles.navTitle}>{t("settings") || "Settings"}</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>

        <Text style={styles.sectionTitle}>🔒 {t("security")}</Text>
        <View style={styles.card}>
          <View style={styles.row}>
            <View style={{ flex: 1 }}>
              <Text style={styles.rowTitle}>{t("pinLock")}</Text>
              <Text style={styles.rowSubtitle}>{t("pinLockSubtitle")}</Text>
            </View>
            <Switch
              value={pinEnabled}
              onValueChange={handlePinToggle}
              trackColor={{ false: "#E2E8F0", true: "#4F46E5" }}
              thumbColor={pinEnabled ? "#FFFFFF" : "#F8FAFC"}
            />
          </View>

          {biometricAvailable && pinEnabled && (
            <View style={[styles.row, styles.rowBorder]}>
              <View>
                <Text style={styles.rowTitle}>{t("biometric")}</Text>
                <Text style={styles.rowSubtitle}>{t("biometricSubtitle")}</Text>
              </View>
              <View style={styles.badge}>
                <Text style={styles.badgeText}>✓ {t("active")}</Text>
              </View>
            </View>
          )}

          {pinEnabled && (
            <TouchableOpacity style={[styles.row, styles.rowBorder]} onPress={() => setShowSetPin(true)} activeOpacity={0.7}>
              <Text style={styles.rowTitle}>{t("changePin")}</Text>
              <Text style={styles.arrow}>›</Text>
            </TouchableOpacity>
          )}
        </View>

        {showSetPin && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>🔐 {t("setNewPin")}</Text>
            <Text style={styles.fieldLabel}>{t("newPin")}</Text>
            <TextInput
              style={styles.pinInput}
              value={newPin}
              onChangeText={v => setNewPin(v.replace(/[^0-9]/g, "").slice(0, 4))}
              keyboardType="numeric"
              secureTextEntry
              maxLength={4}
              placeholder="••••"
              placeholderTextColor="#94A3B8"
            />
            <Text style={styles.fieldLabel}>{t("confirmPin")}</Text>
            <TextInput
              style={styles.pinInput}
              value={confirmPin}
              onChangeText={v => setConfirmPin(v.replace(/[^0-9]/g, "").slice(0, 4))}
              keyboardType="numeric"
              secureTextEntry
              maxLength={4}
              placeholder="••••"
              placeholderTextColor="#94A3B8"
            />
            <View style={styles.btnRow}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => { setShowSetPin(false); setNewPin(""); setConfirmPin(""); }} activeOpacity={0.7}>
                <Text style={styles.cancelBtnText}>{t("cancel")}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveBtn} onPress={handleSavePin} activeOpacity={0.85}>
                <Text style={styles.saveBtnText}>{t("savePin")}</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        <Text style={styles.sectionTitle}>🗑️ {t("dataManagement")}</Text>
        <View style={styles.card}>
          <TouchableOpacity style={styles.row} onPress={handleClearData} activeOpacity={0.7}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.rowTitle, { color: "#EF4444" }]}>{t("clearAllData")}</Text>
              <Text style={styles.rowSubtitle}>{t("clearAllSubtitle")}</Text>
            </View>
            <Text style={[styles.arrow, { color: "#EF4444" }]}>›</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.sectionTitle}>ℹ️ {t("about")}</Text>
        <View style={styles.card}>
          <View style={styles.row}>
            <Text style={styles.rowTitle}>{t("appVersion")}</Text>
            <Text style={styles.versionBadge}>v2.0.0 PRO</Text>
          </View>
          <View style={[styles.row, styles.rowBorder]}>
            <Text style={styles.rowTitle}>{t("developer")}</Text>
            <Text style={styles.devName}>Lutfor Rahman / IMX</Text>
          </View>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#F8FAFC" },
  container: { flex: 1, paddingHorizontal: 16 },

  topNav: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: Platform.OS === "ios" ? 10 : 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
    backgroundColor: "#FFFFFF",
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#F1F5F9",
    justifyContent: "center",
    alignItems: "center",
  },
  backArrow: { fontSize: 18, color: "#0F172A", fontWeight: "bold" },
  navTitle: { fontSize: 17, fontWeight: "700", color: "#0F172A" },

  sectionTitle: { fontSize: 12, fontWeight: "700", color: "#64748B", marginBottom: 8, marginTop: 18, textTransform: "uppercase", letterSpacing: 0.5 },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 22,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 1,
    marginBottom: 4,
  },
  cardTitle: { fontSize: 15, fontWeight: "700", color: "#0F172A", padding: 16, paddingBottom: 8 },
  row: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 16 },
  rowBorder: { borderTopWidth: 1, borderTopColor: "#F1F5F9" },
  rowTitle: { fontSize: 14, color: "#0F172A", fontWeight: "600" },
  rowSubtitle: { fontSize: 11, color: "#64748B", marginTop: 2 },
  arrow: { fontSize: 20, color: "#94A3B8", fontWeight: "bold" },
  badge: { backgroundColor: "#ECFDF5", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, borderWidth: 1, borderColor: "#D1FAE5" },
  badgeText: { fontSize: 11, color: "#059669", fontWeight: "700" },
  versionBadge: { fontSize: 12, color: "#4F46E5", fontWeight: "700", backgroundColor: "#EEF2FF", paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  devName: { fontSize: 13, color: "#334155", fontWeight: "600" },

  fieldLabel: { fontSize: 12, color: "#64748B", marginHorizontal: 16, marginBottom: 6, marginTop: 8, fontWeight: "600" },
  pinInput: {
    backgroundColor: "#F8FAFC",
    borderWidth: 1.5,
    borderColor: "#E2E8F0",
    borderRadius: 16,
    padding: 14,
    marginHorizontal: 16,
    fontSize: 22,
    letterSpacing: 10,
    textAlign: "center",
    color: "#0F172A",
    fontWeight: "800",
  },
  btnRow: { flexDirection: "row", gap: 12, margin: 16 },
  cancelBtn: { flex: 1, backgroundColor: "#F1F5F9", borderRadius: 16, padding: 14, alignItems: "center" },
  cancelBtnText: { color: "#475569", fontWeight: "700" },
  saveBtn: { flex: 1, backgroundColor: "#4F46E5", borderRadius: 16, padding: 14, alignItems: "center" },
  saveBtnText: { color: "#FFFFFF", fontWeight: "700" },
});