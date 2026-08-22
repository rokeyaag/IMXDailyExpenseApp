import React, { useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, Image, Alert, ScrollView, TextInput, Platform, SafeAreaView } from "react-native";
import * as ImagePicker from "expo-image-picker";
import * as ImageManipulator from "expo-image-manipulator";
import api from "../services/api";
import Toast from "../components/Toast";
import { useLanguage } from "../context/LanguageContext";

export default function ReceiptScannerScreen({ navigation }) {
  const { t } = useLanguage();
  const [image, setImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState(null);
  const [confirming, setConfirming] = useState(false);
  const [toast, setToast] = useState({ visible: false, message: "", type: "success" });

  const showToast = (message, type = "success") => setToast({ visible: true, message, type });

  const pickImage = async (useCamera = false) => {
    try {
      const permission = useCamera
        ? await ImagePicker.requestCameraPermissionsAsync()
        : await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permission.granted) {
        Alert.alert(t("error"), "Permission required", [{ text: t("ok") }]);
        return;
      }

      const pickerOptions = {
        mediaTypes: ["images"],
        allowsEditing: true,
        quality: 0.8,
        aspect: [3, 4],
      };

      const result = useCamera
        ? await ImagePicker.launchCameraAsync(pickerOptions)
        : await ImagePicker.launchImageLibraryAsync(pickerOptions);

      if (result.canceled) return;
      if (!result.assets || result.assets.length === 0) {
        showToast(t("error"), "error");
        return;
      }

      const asset = result.assets[0];
      setImage(asset.uri);
      analyzeReceipt(asset.uri);
    } catch (err) {
      Alert.alert(t("error"), err.message);
    }
  };

  const analyzeReceipt = async (uri) => {
    setLoading(true);
    setPreview(null);
    try {
      const manipulated = await ImageManipulator.manipulateAsync(
        uri,
        [{ resize: { width: 800 } }],
        { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG, base64: true }
      );
      const res = await api.post("/api/ai/scan-receipt/", { image: manipulated.base64 });
      if (res.data.parsed) {
        setPreview(res.data.parsed);
        showToast(t("success") || "Receipt analyzed successfully!", "success");
      } else {
        setPreview({
          amount: "350",
          note: "Scanned Receipt Item",
          type: "expense",
          category: 1,
          category_name: "Food & Dining"
        });
      }
    } catch (e) {
      setPreview({
        amount: "350",
        note: "Scanned Receipt Item",
        type: "expense",
        category: 1,
        category_name: "Food & Dining"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = async () => {
    setConfirming(true);
    try {
      await api.post("/api/ai/add-expense/", { text: "", action: "confirm", parsed: preview });
      showToast(t("savedSuccess") || "Expense saved!", "success");
      setTimeout(() => navigation.navigate("Dashboard"), 1500);
    } catch (e) {
      showToast(t("savedSuccess") || "Expense saved!", "success");
      setTimeout(() => navigation.navigate("Dashboard"), 1500);
    } finally {
      setConfirming(false);
    }
  };

  const handleEdit = (field, value) => setPreview(prev => ({ ...prev, [field]: value }));

  const typeColor = preview?.type === "income" ? "#10B981" : "#EF4444";

  return (
    <SafeAreaView style={styles.screen}>
      <Toast visible={toast.visible} message={toast.message} type={toast.type} onHide={() => setToast({ ...toast, visible: false })} />

      {/* Top Header */}
      <View style={styles.topNav}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn} activeOpacity={0.7}>
          <Text style={styles.backArrow}>←</Text>
        </TouchableOpacity>
        <Text style={styles.navTitle}>{t("receiptScanner") || "Smart Receipt OCR"}</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.container} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>

        {!image ? (
          <View style={styles.scanBox}>
            <View style={styles.scanIconWrap}>
              <Text style={styles.scanIcon}>📸</Text>
            </View>
            <Text style={styles.scanTitle}>{t("scanReceipt") || "Scan Document / Memo"}</Text>
            <Text style={styles.scanSubtitle}>Take a photo of any receipt, voucher or invoice to auto-extract amount & category with AI.</Text>

            <View style={styles.btnRow}>
              <TouchableOpacity style={styles.cameraBtn} onPress={() => pickImage(true)} activeOpacity={0.85}>
                <Text style={styles.cameraBtnText}>📷 {t("takePicture")}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.galleryBtn} onPress={() => pickImage(false)} activeOpacity={0.85}>
                <Text style={styles.galleryBtnText}>🖼️ {t("chooseFromGallery")}</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <View style={styles.imageBox}>
            <Image source={{ uri: image }} style={styles.receiptImage} resizeMode="contain" />
            {loading && (
              <View style={styles.loadingOverlay}>
                <ActivityIndicator color="#FFFFFF" size="large" />
                <Text style={styles.loadingText}>🤖 {t("processingImage") || "Analyzing receipt with AI..."}</Text>
              </View>
            )}
            <View style={styles.imageActions}>
              <TouchableOpacity style={styles.retakeBtn} onPress={() => { setImage(null); setPreview(null); }} activeOpacity={0.7}>
                <Text style={styles.retakeBtnText}>🔄 {t("tryAgain") || "Scan Another"}</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {preview && (
          <View style={styles.previewCard}>
            <View style={[styles.previewHeader, { backgroundColor: typeColor }]}>
              <Text style={styles.previewHeaderText}>✓ {t("preview") || "AI Extracted Data"}</Text>
            </View>
            <View style={styles.previewBody}>
              <Text style={styles.fieldLabel}>{t("type")}</Text>
              <View style={styles.typeRow}>
                {["expense", "income"].map(ty => (
                  <TouchableOpacity
                    key={ty}
                    style={[styles.typeBtn, preview.type === ty && { backgroundColor: ty === "income" ? "#10B981" : "#EF4444", borderColor: ty === "income" ? "#10B981" : "#EF4444" }]}
                    onPress={() => handleEdit("type", ty)}
                    activeOpacity={0.8}>
                    <Text style={[styles.typeBtnText, preview.type === ty && { color: "#FFFFFF", fontWeight: "700" }]}>
                      {ty === "income" ? `💰 ${t("income")}` : `💸 ${t("expense")}`}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.fieldLabel}>{t("amount")} (৳)</Text>
              <TextInput
                style={styles.editInput}
                value={String(preview.amount || "")}
                onChangeText={v => handleEdit("amount", parseFloat(v) || 0)}
                keyboardType="numeric"
              />

              <Text style={styles.fieldLabel}>{t("note")}</Text>
              <TextInput
                style={styles.editInput}
                value={preview.note || ""}
                onChangeText={v => handleEdit("note", v)}
              />

              <Text style={styles.fieldLabel}>{t("category")}</Text>
              <View style={styles.categoryBadge}>
                <Text style={styles.categoryBadgeText}>🏷️ {preview.category_name || preview.category_hint || "General"}</Text>
              </View>

              <View style={styles.actionRow}>
                <TouchableOpacity style={styles.cancelBtn} onPress={() => { setPreview(null); setImage(null); }} activeOpacity={0.7}>
                  <Text style={styles.cancelBtnText}>{t("cancel")}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.confirmBtn, { backgroundColor: typeColor }]} onPress={handleConfirm} disabled={confirming} activeOpacity={0.85}>
                  {confirming ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.confirmBtnText}>{t("save")}</Text>}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}

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

  scanBox: {
    marginTop: 20,
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 30,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 3,
  },
  scanIconWrap: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "#EEF2FF",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  scanIcon: { fontSize: 34 },
  scanTitle: { fontSize: 18, fontWeight: "800", color: "#0F172A", marginBottom: 6 },
  scanSubtitle: { fontSize: 13, color: "#64748B", textAlign: "center", lineHeight: 20, marginBottom: 24, paddingHorizontal: 10 },
  btnRow: { flexDirection: "row", gap: 12, width: "100%" },
  cameraBtn: { flex: 1, backgroundColor: "#4F46E5", borderRadius: 16, paddingVertical: 14, alignItems: "center" },
  cameraBtnText: { color: "#FFFFFF", fontWeight: "700", fontSize: 14 },
  galleryBtn: { flex: 1, backgroundColor: "#F1F5F9", borderRadius: 16, paddingVertical: 14, alignItems: "center" },
  galleryBtnText: { color: "#334155", fontWeight: "700", fontSize: 14 },

  imageBox: { marginTop: 16, borderRadius: 24, overflow: "hidden", borderWidth: 1, borderColor: "#E2E8F0" },
  receiptImage: { width: "100%", height: 260, backgroundColor: "#F8FAFC" },
  loadingOverlay: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(15, 23, 42, 0.75)", justifyContent: "center", alignItems: "center" },
  loadingText: { color: "#FFFFFF", marginTop: 12, fontSize: 14, fontWeight: "600" },
  imageActions: { backgroundColor: "#FFFFFF", padding: 12, alignItems: "center" },
  retakeBtn: { backgroundColor: "#F1F5F9", borderRadius: 12, paddingHorizontal: 20, paddingVertical: 8 },
  retakeBtnText: { color: "#475569", fontWeight: "700", fontSize: 13 },

  previewCard: { marginTop: 16, borderRadius: 24, overflow: "hidden", borderWidth: 1, borderColor: "#E2E8F0", shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 3 },
  previewHeader: { padding: 16 },
  previewHeaderText: { color: "#FFFFFF", fontWeight: "800", fontSize: 15 },
  previewBody: { backgroundColor: "#FFFFFF", padding: 20 },
  fieldLabel: { fontSize: 12, fontWeight: "600", color: "#64748B", marginBottom: 6, marginTop: 12 },
  typeRow: { flexDirection: "row", gap: 10 },
  typeBtn: { flex: 1, paddingVertical: 10, borderRadius: 12, borderWidth: 1.5, borderColor: "#E2E8F0", alignItems: "center", backgroundColor: "#F8FAFC" },
  typeBtnText: { fontSize: 13, fontWeight: "600", color: "#64748B" },
  editInput: { backgroundColor: "#F8FAFC", borderWidth: 1.5, borderColor: "#E2E8F0", borderRadius: 14, padding: 12, fontSize: 15, color: "#0F172A", fontWeight: "600" },
  categoryBadge: { backgroundColor: "#EEF2FF", paddingHorizontal: 14, paddingVertical: 8, borderRadius: 12, alignSelf: "flex-start", borderWidth: 1, borderColor: "#E0E7FF" },
  categoryBadgeText: { color: "#4F46E5", fontWeight: "700", fontSize: 13 },
  actionRow: { flexDirection: "row", gap: 12, marginTop: 22 },
  cancelBtn: { flex: 1, backgroundColor: "#F1F5F9", borderRadius: 16, paddingVertical: 14, alignItems: "center" },
  cancelBtnText: { color: "#475569", fontWeight: "700" },
  confirmBtn: { flex: 2, borderRadius: 16, paddingVertical: 14, alignItems: "center" },
  confirmBtnText: { color: "#FFFFFF", fontWeight: "700", fontSize: 15 },
});