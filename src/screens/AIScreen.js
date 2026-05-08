import React, { useState, useRef } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, ScrollView, Animated } from "react-native";
import api from "../services/api";
import Toast from "../components/Toast";

export default function AIScreen({ navigation }) {
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState(null);
  const [confirming, setConfirming] = useState(false);
  const [toast, setToast] = useState({ visible: false, message: "", type: "success" });
  const cardAnim = useRef(new Animated.Value(0)).current;

  const showToast = (message, type = "success") => setToast({ visible: true, message, type });

  const examples = [
    { text: "lunch 150 taka", icon: "FD" },
    { text: "rickshaw 50 taka", icon: "TR" },
    { text: "salary received 25000", icon: "SL" },
    { text: "electricity bill 1200", icon: "BL" },
    { text: "medicine 500 taka", icon: "HL" },
  ];

  const handleAIParse = async () => {
    if (!text.trim()) { showToast("Please enter some text", "error"); return; }
    setLoading(true);
    setPreview(null);
    try {
      const res = await api.post("/api/ai/add-expense/", { text, action: "parse" });
      setPreview(res.data.parsed);
      Animated.spring(cardAnim, { toValue: 1, useNativeDriver: true, tension: 50, friction: 8 }).start();
    } catch (e) {
      showToast(e.response?.data?.error || "Something went wrong", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = async () => {
    setConfirming(true);
    try {
      await api.post("/api/ai/add-expense/", { text, action: "confirm", parsed: preview });
      showToast("Transaction added successfully!");
      setText("");
      setPreview(null);
      cardAnim.setValue(0);
      setTimeout(() => { navigation.navigate("Dashboard", { refresh: Date.now() }); }, 2000);
    } catch (e) {
      showToast("Failed to save", "error");
    } finally {
      setConfirming(false);
    }
  };

  const handleEdit = (field, value) => {
    setPreview(prev => ({ ...prev, [field]: value }));
  };

  const typeColor = preview?.type === "income" ? "#10B981" : "#EF4444";

  return (
    <View style={{ flex: 1 }}>
      <Toast visible={toast.visible} message={toast.message} type={toast.type} onHide={() => setToast({ ...toast, visible: false })} />
      <ScrollView style={styles.container} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <Text style={styles.title}>AI Entry</Text>
          <Text style={styles.subtitle}>Type in Bengali or English</Text>
        </View>

        <Text style={styles.sectionLabel}>Quick Examples</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.examplesRow}>
          {examples.map((ex, i) => (
            <TouchableOpacity key={i} style={styles.exampleChip} onPress={() => setText(ex.text)}>
              <View style={styles.exampleIcon}><Text style={styles.exampleIconText}>{ex.icon}</Text></View>
              <Text style={styles.exampleText}>{ex.text}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <View style={styles.inputCard}>
          <TextInput
            style={styles.input}
            placeholder="e.g. lunch 200 taka, salary 25000..."
            placeholderTextColor="#9ca3af"
            value={text}
            onChangeText={setText}
            multiline
            numberOfLines={3}
            color="#1f2937"
          />
          <TouchableOpacity
            style={[styles.parseBtn, loading && { opacity: 0.7 }]}
            onPress={handleAIParse}
            disabled={loading}>
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.parseBtnText}>Analyze with AI</Text>}
          </TouchableOpacity>
        </View>

        {preview && (
          <Animated.View style={[styles.previewCard, { opacity: cardAnim, transform: [{ scale: cardAnim }] }]}>
            <View style={[styles.previewHeader, { backgroundColor: typeColor }]}>
              <Text style={styles.previewHeaderText}>AI Preview</Text>
              <View style={styles.confidenceBadge}>
                <Text style={styles.confidenceText}>{preview.confidence || "medium"}</Text>
              </View>
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
                onChangeText={(v) => handleEdit("amount", parseFloat(v) || 0)}
                keyboardType="numeric"
                color="#1f2937"
              />

              <Text style={styles.fieldLabel}>Note</Text>
              <TextInput
                style={styles.editInput}
                value={preview.note}
                onChangeText={(v) => handleEdit("note", v)}
                color="#1f2937"
              />

              <Text style={styles.fieldLabel}>Category</Text>
              <View style={styles.categoryBadge}>
                <Text style={styles.categoryBadgeText}>{preview.category_name || preview.category_hint || "None"}</Text>
              </View>

              <View style={styles.actionRow}>
                <TouchableOpacity style={styles.cancelBtn} onPress={() => { setPreview(null); cardAnim.setValue(0); }}>
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
          </Animated.View>
        )}
        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container:         { flex: 1, backgroundColor: "#f0f0ff" },
  header:            { padding: 20, paddingTop: 52, paddingBottom: 8 },
  title:             { fontSize: 26, fontWeight: "bold", color: "#1f2937" },
  subtitle:          { fontSize: 14, color: "#6b7280", marginTop: 4 },
  sectionLabel:      { fontSize: 14, fontWeight: "600", color: "#374151", paddingHorizontal: 20, marginBottom: 8, marginTop: 8 },
  examplesRow:       { paddingHorizontal: 16, marginBottom: 16 },
  exampleChip:       { flexDirection: "row", alignItems: "center", backgroundColor: "#fff", borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10, marginRight: 8, elevation: 2, gap: 8 },
  exampleIcon:       { width: 28, height: 28, borderRadius: 14, backgroundColor: "#6366F1", justifyContent: "center", alignItems: "center" },
  exampleIconText:   { fontSize: 10, fontWeight: "bold", color: "#fff" },
  exampleText:       { fontSize: 12, color: "#374151", fontWeight: "500" },
  inputCard:         { backgroundColor: "#fff", marginHorizontal: 16, borderRadius: 20, padding: 16, elevation: 2, marginBottom: 16 },
  input:             { fontSize: 16, color: "#1f2937", minHeight: 80, textAlignVertical: "top", marginBottom: 12 },
  parseBtn:          { backgroundColor: "#6366F1", borderRadius: 14, padding: 16, alignItems: "center", elevation: 3 },
  parseBtnText:      { color: "#fff", fontSize: 16, fontWeight: "bold" },
  previewCard:       { marginHorizontal: 16, borderRadius: 20, overflow: "hidden", elevation: 4, marginBottom: 16 },
  previewHeader:     { padding: 16, flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  previewHeaderText: { color: "#fff", fontWeight: "bold", fontSize: 15 },
  confidenceBadge:   { backgroundColor: "rgba(255,255,255,0.25)", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  confidenceText:    { color: "#fff", fontSize: 11, fontWeight: "600" },
  previewBody:       { backgroundColor: "#fff", padding: 20 },
  fieldLabel:        { fontSize: 12, fontWeight: "600", color: "#6b7280", marginBottom: 6, marginTop: 12 },
  typeRow:           { flexDirection: "row", gap: 10 },
  typeBtn:           { flex: 1, padding: 10, borderRadius: 10, borderWidth: 1.5, borderColor: "#e5e7eb", alignItems: "center" },
  typeBtnText:       { fontSize: 14, fontWeight: "600", color: "#6b7280" },
  editInput:         { backgroundColor: "#f8f9ff", borderWidth: 1.5, borderColor: "#e5e7eb", borderRadius: 10, padding: 12, fontSize: 15, color: "#1f2937" },
  categoryBadge:     { backgroundColor: "#ede9fe", paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10, alignSelf: "flex-start" },
  categoryBadgeText: { color: "#6366F1", fontWeight: "600", fontSize: 14 },
  actionRow:         { flexDirection: "row", gap: 12, marginTop: 20 },
  cancelBtn:         { flex: 1, backgroundColor: "#f3f4f6", borderRadius: 12, padding: 14, alignItems: "center" },
  cancelBtnText:     { color: "#6b7280", fontWeight: "bold" },
  confirmBtn:        { flex: 2, borderRadius: 12, padding: 14, alignItems: "center", elevation: 3 },
  confirmBtnText:    { color: "#fff", fontWeight: "bold", fontSize: 15 },
});

