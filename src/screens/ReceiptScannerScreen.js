import React, { useState, useRef } from "react";
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, Image, Alert, ScrollView, TextInput } from "react-native";
import * as ImagePicker from "expo-image-picker";
import * as ImageManipulator from "expo-image-manipulator";
import api from "../services/api";
import Toast from "../components/Toast";

export default function ReceiptScannerScreen({ navigation }) {
  const [image, setImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState(null);
  const [confirming, setConfirming] = useState(false);
  const [toast, setToast] = useState({ visible: false, message: "", type: "success" });

  const showToast = (message, type = "success") => setToast({ visible: true, message, type });

  const pickImage = async (useCamera = false) => {
    const permission = useCamera
      ? await ImagePicker.requestCameraPermissionsAsync()
      : await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      Alert.alert("Permission required", "Please allow camera/gallery access");
      return;
    }

    const result = useCamera
      ? await ImagePicker.launchCameraAsync({ allowsEditing: true, quality: 0.8 })
      : await ImagePicker.launchImageLibraryAsync({ allowsEditing: true, quality: 0.8 });

    if (!result.canceled) {
      const asset = result.assets[0];
      setImage(asset.uri);
      analyzeReceipt(asset.uri);
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

      const res = await api.post("/api/ai/scan-receipt/", {
        image: manipulated.base64,
      });

      if (res.data.parsed) {
        setPreview(res.data.parsed);
      } else {
        showToast("Could not read receipt. Try again.", "error");
      }
    } catch (e) {
      showToast(e.response?.data?.error || "Something went wrong", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = async () => {
    setConfirming(true);
    try {
      await api.post("/api/ai/add-expense/", { text: "", action: "confirm", parsed: preview });
      showToast("Receipt saved successfully!");
      setTimeout(() => navigation.navigate("Dashboard"), 2000);
    } catch (e) {
      showToast("Failed to save", "error");
    } finally {
      setConfirming(false);
    }
  };

  const handleEdit = (field, value) => setPreview(prev => ({ ...prev, [field]: value }));

  const typeColor = preview?.type === "income" ? "#10B981" : "#EF4444";

  return (
    <View style={{ flex: 1 }}>
      <Toast visible={toast.visible} message={toast.message} type={toast.type} onHide={() => setToast({ ...toast, visible: false })} />
      <ScrollView style={styles.container} keyboardShouldPersistTaps="handled">

        <View style={styles.header}>
          <Text style={styles.title}>Receipt Scanner</Text>
          <Text style={styles.subtitle}>Take a photo of your receipt</Text>
        </View>

        {!image ? (
          <View style={styles.scanBox}>
            <Text style={styles.scanIcon}>??</Text>
            <Text style={styles.scanText}>No receipt scanned yet</Text>
            <View style={styles.btnRow}>
              <TouchableOpacity style={styles.cameraBtn} onPress={() => pickImage(true)}>
                <Text style={styles.cameraBtnText}>?? Camera</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.galleryBtn} onPress={() => pickImage(false)}>
                <Text style={styles.galleryBtnText}>?? Gallery</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <View style={styles.imageBox}>
            <Image source={{ uri: image }} style={styles.receiptImage} resizeMode="contain" />
            {loading && (
              <View style={styles.loadingOverlay}>
                <ActivityIndicator color="#fff" size="large" />
                <Text style={styles.loadingText}>Analyzing receipt...</Text>
              </View>
            )}
            <View style={styles.imageActions}>
              <TouchableOpacity style={styles.retakeBtn} onPress={() => { setImage(null); setPreview(null); }}>
                <Text style={styles.retakeBtnText}>Retake</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {preview && (
          <View style={styles.previewCard}>
            <View style={[styles.previewHeader, { backgroundColor: typeColor }]}>
              <Text style={styles.previewHeaderText}>AI Preview</Text>
            </View>
            <View style={styles.previewBody}>
              <Text style={styles.fieldLabel}>Type</Text>
              <View style={styles.typeRow}>
                {["expense", "income"].map(t => (
                  <TouchableOpacity
                    key={t}
                    style={[styles.typeBtn, preview.type === t && { backgroundColor: t === "income" ? "#10B981" : "#EF4444", borderColor: t === "income" ? "#10B981" : "#EF4444" }]}
                    onPress={() => handleEdit("type", t)}>
                    <Text style={[styles.typeBtnText, preview.type === t && { color: "#fff" }]}>
                      {t === "income" ? "Income" : "Expense"}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.fieldLabel}>Amount (Tk)</Text>
              <TextInput
                style={styles.editInput}
                value={String(preview.amount)}
                onChangeText={v => handleEdit("amount", parseFloat(v) || 0)}
                keyboardType="numeric"
                color="#1f2937"
              />

              <Text style={styles.fieldLabel}>Note</Text>
              <TextInput
                style={styles.editInput}
                value={preview.note}
                onChangeText={v => handleEdit("note", v)}
                color="#1f2937"
              />

              <Text style={styles.fieldLabel}>Category</Text>
              <View style={styles.categoryBadge}>
                <Text style={styles.categoryBadgeText}>{preview.category_name || preview.category_hint || "None"}</Text>
              </View>

              <View style={styles.actionRow}>
                <TouchableOpacity style={styles.cancelBtn} onPress={() => { setPreview(null); setImage(null); }}>
                  <Text style={styles.cancelBtnText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.confirmBtn, { backgroundColor: typeColor }]}
                  onPress={handleConfirm}
                  disabled={confirming}>
                  {confirming ? <ActivityIndicator color="#fff" /> : <Text style={styles.confirmBtnText}>Confirm & Save</Text>}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container:         { flex: 1, backgroundColor: "#f0f0ff" },
  header:            { padding: 20, paddingTop: 20 },
  title:             { fontSize: 24, fontWeight: "bold", color: "#1f2937" },
  subtitle:          { fontSize: 14, color: "#6b7280", marginTop: 4 },
  scanBox:           { margin: 16, backgroundColor: "#fff", borderRadius: 20, padding: 40, alignItems: "center", elevation: 2 },
  scanIcon:          { fontSize: 60, marginBottom: 16 },
  scanText:          { fontSize: 15, color: "#9ca3af", marginBottom: 24 },
  btnRow:            { flexDirection: "row", gap: 12 },
  cameraBtn:         { backgroundColor: "#6366F1", borderRadius: 12, paddingHorizontal: 20, paddingVertical: 12 },
  cameraBtnText:     { color: "#fff", fontWeight: "bold", fontSize: 14 },
  galleryBtn:        { backgroundColor: "#f3f4f6", borderRadius: 12, paddingHorizontal: 20, paddingVertical: 12 },
  galleryBtnText:    { color: "#374151", fontWeight: "bold", fontSize: 14 },
  imageBox:          { margin: 16, borderRadius: 20, overflow: "hidden", elevation: 2 },
  receiptImage:      { width: "100%", height: 300, backgroundColor: "#f3f4f6" },
  loadingOverlay:    { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.6)", justifyContent: "center", alignItems: "center" },
  loadingText:       { color: "#fff", marginTop: 12, fontSize: 14, fontWeight: "500" },
  imageActions:      { backgroundColor: "#fff", padding: 12, alignItems: "center" },
  retakeBtn:         { backgroundColor: "#f3f4f6", borderRadius: 10, paddingHorizontal: 20, paddingVertical: 8 },
  retakeBtnText:     { color: "#374151", fontWeight: "500" },
  previewCard:       { marginHorizontal: 16, borderRadius: 20, overflow: "hidden", elevation: 4, marginBottom: 16 },
  previewHeader:     { padding: 16 },
  previewHeaderText: { color: "#fff", fontWeight: "bold", fontSize: 15 },
  previewBody:       { backgroundColor: "#fff", padding: 20 },
  fieldLabel:        { fontSize: 12, fontWeight: "600", color: "#6b7280", marginBottom: 6, marginTop: 12 },
  typeRow:           { flexDirection: "row", gap: 10 },
  typeBtn:           { flex: 1, padding: 10, borderRadius: 10, borderWidth: 1.5, borderColor: "#e5e7eb", alignItems: "center" },
  typeBtnText:       { fontSize: 14, fontWeight: "600", color: "#6b7280" },
  editInput:         { backgroundColor: "#f8f9ff", borderWidth: 1.5, borderColor: "#e5e7eb", borderRadius: 10, padding: 12, fontSize: 15 },
  categoryBadge:     { backgroundColor: "#ede9fe", paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10, alignSelf: "flex-start" },
  categoryBadgeText: { color: "#6366F1", fontWeight: "600", fontSize: 14 },
  actionRow:         { flexDirection: "row", gap: 12, marginTop: 20 },
  cancelBtn:         { flex: 1, backgroundColor: "#f3f4f6", borderRadius: 12, padding: 14, alignItems: "center" },
  cancelBtnText:     { color: "#6b7280", fontWeight: "bold" },
  confirmBtn:        { flex: 2, borderRadius: 12, padding: 14, alignItems: "center", elevation: 3 },
  confirmBtnText:    { color: "#fff", fontWeight: "bold", fontSize: 15 },
});
