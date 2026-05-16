import React, { useState, useEffect } from "react";
import { View, Text, TouchableOpacity, StyleSheet, Switch, Alert, TextInput, ScrollView } from "react-native";
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
    if (value) { setShowSetPin(true); }
    else {
      Alert.alert(t("disablePin"), t("disablePinMsg"), [
        { text: t("cancel"), style: "cancel" },
        { text: t("disable"), style: "destructive", onPress: async () => { await deletePin(); setPinEnabled(false); }},
      ]);
    }
  };

  const handleClearData = async () => {
    Alert.alert(t("clearAllData"), t("clearAllConfirm"), [
      { text: t("cancel"), style: "cancel" },
      { text: t("clearAll"), style: "destructive", onPress: async () => {
        try { await api.delete("/api/expenses/clear_all/"); await deletePin(); Alert.alert(t("done"), t("dataCleared")); }
        catch (e) { Alert.alert(t("error"), t("somethingWrong")); }
      }},
    ]);
  };

  const handleSavePin = async () => {
    if (newPin.length !== 4) { Alert.alert(t("error"), t("pinMust4")); return; }
    if (newPin !== confirmPin) { Alert.alert(t("error"), t("pinNotMatch")); return; }
    await savePin(newPin); setPinEnabled(true); setShowSetPin(false);
    setNewPin(""); setConfirmPin("");
    Alert.alert(t("success"), t("pinSetSuccess"));
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.sectionTitle}>{t("security")}</Text>
      <View style={styles.card}>
        <View style={styles.row}>
          <View>
            <Text style={styles.rowTitle}>{t("pinLock")}</Text>
            <Text style={styles.rowSubtitle}>{t("pinLockSubtitle")}</Text>
          </View>
          <Switch value={pinEnabled} onValueChange={handlePinToggle} trackColor={{ false: "#e5e7eb", true: "#6366F1" }} thumbColor={pinEnabled ? "#fff" : "#f4f3f4"} />
        </View>
        {biometricAvailable && pinEnabled && (
          <View style={[styles.row, styles.rowBorder]}>
            <View>
              <Text style={styles.rowTitle}>{t("biometric")}</Text>
              <Text style={styles.rowSubtitle}>{t("biometricSubtitle")}</Text>
            </View>
            <Text style={styles.badge}>{t("active")}</Text>
          </View>
        )}
        {pinEnabled && (
          <TouchableOpacity style={[styles.row, styles.rowBorder]} onPress={() => setShowSetPin(true)}>
            <Text style={styles.rowTitle}>{t("changePin")}</Text>
            <Text style={styles.arrow}>{">"}</Text>
          </TouchableOpacity>
        )}
      </View>
      {showSetPin && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>{t("setNewPin")}</Text>
          <Text style={styles.fieldLabel}>{t("newPin")}</Text>
          <TextInput style={styles.pinInput} value={newPin} onChangeText={v => setNewPin(v.replace(/[^0-9]/g, "").slice(0, 4))} keyboardType="numeric" secureTextEntry maxLength={4} placeholder="****" placeholderTextColor="#9ca3af" />
          <Text style={styles.fieldLabel}>{t("confirmPin")}</Text>
          <TextInput style={styles.pinInput} value={confirmPin} onChangeText={v => setConfirmPin(v.replace(/[^0-9]/g, "").slice(0, 4))} keyboardType="numeric" secureTextEntry maxLength={4} placeholder="****" placeholderTextColor="#9ca3af" />
          <View style={styles.btnRow}>
            <TouchableOpacity style={styles.cancelBtn} onPress={() => { setShowSetPin(false); setNewPin(""); setConfirmPin(""); }}>
              <Text style={styles.cancelBtnText}>{t("cancel")}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.saveBtn} onPress={handleSavePin}>
              <Text style={styles.saveBtnText}>{t("savePin")}</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
      <Text style={styles.sectionTitle}>{t("dataManagement")}</Text>
      <View style={styles.card}>
        <TouchableOpacity style={styles.row} onPress={handleClearData}>
          <View>
            <Text style={[styles.rowTitle, { color: "#EF4444" }]}>{t("clearAllData")}</Text>
            <Text style={styles.rowSubtitle}>{t("clearAllSubtitle")}</Text>
          </View>
          <Text style={[styles.arrow, { color: "#EF4444" }]}>{">"}</Text>
        </TouchableOpacity>
      </View>
      <Text style={styles.sectionTitle}>{t("about")}</Text>
      <View style={styles.card}>
        <View style={styles.row}>
          <Text style={styles.rowTitle}>{t("appVersion")}</Text>
          <Text style={styles.rowSubtitle}>1.0.0</Text>
        </View>
        <View style={[styles.row, styles.rowBorder]}>
          <Text style={styles.rowTitle}>{t("developer")}</Text>
          <Text style={styles.rowSubtitle}>IMX Trading</Text>
        </View>
      </View>
      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container:    { flex: 1, backgroundColor: "#f0f0ff", padding: 16 },
  sectionTitle: { fontSize: 13, fontWeight: "600", color: "#6b7280", marginBottom: 8, marginTop: 16, paddingHorizontal: 4 },
  card:         { backgroundColor: "#fff", borderRadius: 16, overflow: "hidden", elevation: 2, marginBottom: 8 },
  cardTitle:    { fontSize: 16, fontWeight: "bold", color: "#1f2937", padding: 16, paddingBottom: 8 },
  row:          { flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 16 },
  rowBorder:    { borderTopWidth: 1, borderTopColor: "#f3f4f6" },
  rowTitle:     { fontSize: 15, color: "#1f2937", fontWeight: "500" },
  rowSubtitle:  { fontSize: 12, color: "#9ca3af", marginTop: 2 },
  arrow:        { fontSize: 20, color: "#9ca3af" },
  badge:        { backgroundColor: "#d1fae5", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  fieldLabel:   { fontSize: 13, color: "#6b7280", marginHorizontal: 16, marginBottom: 6, marginTop: 8 },
  pinInput:     { backgroundColor: "#f8f9ff", borderWidth: 1.5, borderColor: "#e5e7eb", borderRadius: 12, padding: 14, marginHorizontal: 16, fontSize: 20, letterSpacing: 8, textAlign: "center", color: "#1f2937" },
  btnRow:       { flexDirection: "row", gap: 12, margin: 16 },
  cancelBtn:    { flex: 1, backgroundColor: "#f3f4f6", borderRadius: 12, padding: 14, alignItems: "center" },
  cancelBtnText:{ color: "#6b7280", fontWeight: "bold" },
  saveBtn:      { flex: 1, backgroundColor: "#6366F1", borderRadius: 12, padding: 14, alignItems: "center" },
  saveBtnText:  { color: "#fff", fontWeight: "bold" },
});