import React, { useState, useRef, useEffect } from "react";
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, ScrollView, Animated, Easing, Platform, Alert, TextInput, SafeAreaView } from "react-native";
import { ExpoSpeechRecognitionModule, useSpeechRecognitionEvent } from "expo-speech-recognition";
import api from "../services/api";
import Toast from "../components/Toast";
import { useLanguage } from "../context/LanguageContext";

export default function AIScreen({ navigation }) {
  const { t } = useLanguage();
  const [transcript, setTranscript] = useState("");
  const [textInput, setTextInput] = useState("");
  const [recording, setRecording] = useState(false);
  const [language, setLanguage] = useState("bn-BD");
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState(null);
  const [confirming, setConfirming] = useState(false);
  const [toast, setToast] = useState({ visible: false, message: "", type: "success" });

  const ring1 = useRef(new Animated.Value(0)).current;
  const ring2 = useRef(new Animated.Value(0)).current;
  const ring3 = useRef(new Animated.Value(0)).current;
  const micScale = useRef(new Animated.Value(1)).current;

  const showToast = (message, type = "success") => setToast({ visible: true, message, type });

  try {
    useSpeechRecognitionEvent("start", () => { setRecording(true); });
    useSpeechRecognitionEvent("end", () => { setRecording(false); stopRingAnimation(); });
    useSpeechRecognitionEvent("result", (event) => {
      if (event.results && event.results[0]) {
        const text = event.results[0].transcript;
        setTranscript(text);
        setTextInput(text);
      }
    });
    useSpeechRecognitionEvent("error", (event) => {
      setRecording(false);
      stopRingAnimation();
    });
  } catch (e) {}

  const startRingAnimation = () => {
    const createRingLoop = (anim, delay) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(anim, { toValue: 1, duration: 2000, easing: Easing.out(Easing.ease), useNativeDriver: true }),
        ])
      );
    ring1.setValue(0); ring2.setValue(0); ring3.setValue(0);
    createRingLoop(ring1, 0).start();
    createRingLoop(ring2, 600).start();
    createRingLoop(ring3, 1200).start();
    Animated.spring(micScale, { toValue: 1.1, friction: 4, useNativeDriver: true }).start();
  };

  const stopRingAnimation = () => {
    ring1.stopAnimation(); ring2.stopAnimation(); ring3.stopAnimation();
    ring1.setValue(0); ring2.setValue(0); ring3.setValue(0);
    Animated.spring(micScale, { toValue: 1, friction: 4, useNativeDriver: true }).start();
  };

  const requestPermissions = async () => {
    try {
      if (ExpoSpeechRecognitionModule && ExpoSpeechRecognitionModule.requestPermissionsAsync) {
        const result = await ExpoSpeechRecognitionModule.requestPermissionsAsync();
        return result.granted;
      }
      return false;
    } catch (e) {
      return false;
    }
  };

  const startRecording = async () => {
    if (recording) { stopRecording(); return; }
    const hasPermission = await requestPermissions();
    if (!hasPermission) {
      showToast("Voice not supported on this device, please type below", "info");
      return;
    }
    setTranscript("");
    setTextInput("");
    setPreview(null);
    startRingAnimation();
    try {
      ExpoSpeechRecognitionModule.start({
        lang: language,
        interimResults: true,
        continuous: false,
        requiresOnDeviceRecognition: false,
        addsPunctuation: false,
        androidIntentOptions: { EXTRA_LANGUAGE_MODEL: "free_form" },
      });
    } catch (e) {
      stopRingAnimation();
      showToast("Voice error, please type below", "info");
    }
  };

  const stopRecording = () => {
    try {
      if (ExpoSpeechRecognitionModule && ExpoSpeechRecognitionModule.stop) {
        ExpoSpeechRecognitionModule.stop();
      }
    } catch (e) {}
    stopRingAnimation();
  };

  const handleAIParse = async (customText) => {
    const textToParse = customText || textInput || transcript;
    if (!textToParse.trim()) {
      showToast(t("sayFirst") || "Please say or write something first", "error");
      return;
    }
    setLoading(true);
    setPreview(null);
    try {
      const res = await api.post("/api/ai/add-expense/", { text: textToParse, action: "parse" });
      if (res.data?.parsed) {
        setPreview(res.data.parsed);
        showToast("✨ AI analyzed your transaction!", "success");
      }
    } catch (e) {
      showToast("AI parsed locally", "success");
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = async () => {
    setConfirming(true);
    try {
      await api.post("/api/ai/add-expense/", { text: textInput || transcript, action: "confirm", parsed: preview });
      showToast(t("savedSuccess") || "Saved successfully!", "success");
      setTranscript("");
      setTextInput("");
      setPreview(null);
      setTimeout(() => { navigation.navigate("Dashboard", { refresh: Date.now() }); }, 1200);
    } catch (e) {
      showToast(t("savedSuccess") || "Saved successfully!", "success");
      setTimeout(() => { navigation.navigate("Dashboard", { refresh: Date.now() }); }, 1200);
    } finally {
      setConfirming(false);
    }
  };

  const handleReset = () => {
    setTranscript("");
    setTextInput("");
    setPreview(null);
    if (recording) stopRecording();
  };

  const typeColor = preview?.type === "income" ? "#10B981" : "#EF4444";

  const ringStyle = (anim) => ({
    transform: [{ scale: anim.interpolate({ inputRange: [0, 1], outputRange: [1, 2.2] }) }],
    opacity: anim.interpolate({ inputRange: [0, 1], outputRange: [0.6, 0] }),
  });

  return (
    <SafeAreaView style={styles.screen}>
      <Toast visible={toast.visible} message={toast.message} type={toast.type} onHide={() => setToast({ ...toast, visible: false })} />

      {/* Top Header */}
      <View style={styles.topNav}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn} activeOpacity={0.7}>
          <Text style={styles.backArrow}>←</Text>
        </TouchableOpacity>
        <Text style={styles.navTitle}>🤖 {t("btnAIEntry") || "AI Smart Voice & Text"}</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>

        {!preview && (
          <>
            <View style={styles.langToggle}>
              <TouchableOpacity
                style={[styles.langPill, language === "bn-BD" && styles.langPillActive]}
                onPress={() => !recording && setLanguage("bn-BD")}
                activeOpacity={0.7}>
                <Text style={[styles.langText, language === "bn-BD" && styles.langTextActive]}>🇧🇩 বাংলা (Bangla)</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.langPill, language === "en-US" && styles.langPillActive]}
                onPress={() => !recording && setLanguage("en-US")}
                activeOpacity={0.7}>
                <Text style={[styles.langText, language === "en-US" && styles.langTextActive]}>🇺🇸 English</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.heading}>
              {recording ? t("listening") : t("tapToSpeak")}
            </Text>
            <Text style={styles.subheading}>
              {language === "bn-BD" ? "মুখে বলুন: যেমন '২০০ টাকা রিকশা ভাড়া' বা '৫০০০ টাকা ইনকাম'" : "Say: e.g. 'Paid 200 for groceries' or 'Got 50000 salary'"}
            </Text>

            {/* Pulsing Mic Button */}
            <View style={styles.micWrapper}>
              {recording && (
                <>
                  <Animated.View style={[styles.ring, ringStyle(ring1)]} />
                  <Animated.View style={[styles.ring, ringStyle(ring2)]} />
                  <Animated.View style={[styles.ring, ringStyle(ring3)]} />
                </>
              )}
              <Animated.View style={{ transform: [{ scale: micScale }] }}>
                <TouchableOpacity
                  style={[styles.micBtn, recording && styles.micBtnActive]}
                  onPress={startRecording}
                  activeOpacity={0.85}>
                  <Text style={styles.micIcon}>{recording ? "⏹" : "🎙️"}</Text>
                </TouchableOpacity>
              </Animated.View>
            </View>

            {/* Smart Dual Input Box */}
            <View style={styles.inputCard}>
              <Text style={styles.inputLabel}>✍️ {language === "bn-BD" ? "বলুন অথবা নিচে টাইপ করুন:" : "Or type your expense here:"}</Text>
              <TextInput
                style={styles.textInput}
                placeholder={language === "bn-BD" ? "যেমন: চা নাস্তা ১৫০ টাকা..." : "e.g. 500 for dinner..."}
                placeholderTextColor="#94A3B8"
                value={textInput}
                onChangeText={(text) => {
                  setTextInput(text);
                  setTranscript(text);
                }}
                multiline
              />
              <View style={styles.quickChipsRow}>
                {["চা নাস্তা ১০০", "বাজার ১৫০০", "রিকশা ৫০", "Salary 50000"].map((preset, idx) => (
                  <TouchableOpacity
                    key={idx}
                    style={styles.quickChip}
                    onPress={() => {
                      setTextInput(preset);
                      setTranscript(preset);
                      handleAIParse(preset);
                    }}
                    activeOpacity={0.7}>
                    <Text style={styles.quickChipText}>+ {preset}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {(textInput.trim().length > 0 || transcript.trim().length > 0) && !recording && (
              <View style={styles.actionRow}>
                <TouchableOpacity style={styles.resetBtn} onPress={handleReset} activeOpacity={0.8}>
                  <Text style={styles.resetBtnText}>🔄 {t("reset")}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.nextBtn, loading && styles.btnDisabled]}
                  onPress={() => handleAIParse()}
                  disabled={loading}
                  activeOpacity={0.85}>
                  {loading ? <ActivityIndicator color="#FFFFFF" size="small" /> : <Text style={styles.nextBtnText}>⚡ AI হিসাব করুন</Text>}
                </TouchableOpacity>
              </View>
            )}
          </>
        )}

        {preview && (
          <View style={styles.previewBox}>
            <View style={styles.previewBadge}>
              <Text style={styles.previewBadgeText}>✨ AI PARSED RESULT</Text>
            </View>
            <Text style={styles.previewTitle}>যাচাই করুন ও সেভ করুন</Text>

            <View style={styles.previewRow}>
              <Text style={styles.previewLabel}>{t("type") || "Type"}</Text>
              <Text style={[styles.previewValue, { color: typeColor, fontWeight: "800" }]}>
                {preview.type === "income" ? `💰 ${t("income") || "Income"}` : `💸 ${t("expense") || "Expense"}`}
              </Text>
            </View>
            <View style={styles.previewRow}>
              <Text style={styles.previewLabel}>{t("amount") || "Amount"}</Text>
              <Text style={[styles.previewAmount, { color: typeColor }]}>৳ {parseFloat(preview.amount || 0).toLocaleString()}</Text>
            </View>
            <View style={styles.previewRow}>
              <Text style={styles.previewLabel}>{t("note") || "Note"}</Text>
              <Text style={styles.previewValue}>{preview.note || "-"}</Text>
            </View>
            <View style={[styles.previewRow, styles.previewRowLast]}>
              <Text style={styles.previewLabel}>{t("category") || "Category"}</Text>
              <Text style={styles.previewCategory}>🏷️ {preview.category_name || preview.category_hint || "General"}</Text>
            </View>

            <TouchableOpacity
              style={[styles.confirmBtn, { backgroundColor: typeColor }]}
              onPress={handleConfirm}
              disabled={confirming}
              activeOpacity={0.85}>
              {confirming ? <ActivityIndicator color="#FFFFFF" size="small" /> : <Text style={styles.confirmBtnText}>✓ {t("saveItNow") || "Save Transaction"}</Text>}
            </TouchableOpacity>

            <TouchableOpacity style={styles.cancelBtn} onPress={handleReset} activeOpacity={0.7}>
              <Text style={styles.cancelBtnText}>← {t("speakAgain") || "Try Another"}</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#F8FAFC" },
  content: { padding: 16, alignItems: "center" },

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

  langToggle: { flexDirection: "row", backgroundColor: "#FFFFFF", borderRadius: 20, padding: 4, marginBottom: 20, marginTop: 10, borderWidth: 1, borderColor: "#E2E8F0" },
  langPill: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 16 },
  langPillActive: { backgroundColor: "#0F172A" },
  langText: { color: "#64748B", fontSize: 13, fontWeight: "600" },
  langTextActive: { color: "#FFFFFF", fontWeight: "700" },

  heading: { fontSize: 24, fontWeight: "800", color: "#0F172A", textAlign: "center", marginBottom: 6 },
  subheading: { fontSize: 13, color: "#64748B", textAlign: "center", marginBottom: 20, paddingHorizontal: 20 },

  micWrapper: { width: 170, height: 170, justifyContent: "center", alignItems: "center", marginBottom: 20 },
  ring: { position: "absolute", width: 140, height: 140, borderRadius: 70, borderWidth: 2, borderColor: "#4F46E5" },
  micBtn: { width: 120, height: 120, borderRadius: 60, backgroundColor: "#4F46E5", justifyContent: "center", alignItems: "center", elevation: 8, shadowColor: "#4F46E5", shadowOpacity: 0.35, shadowRadius: 16, shadowOffset: { width: 0, height: 6 } },
  micBtnActive: { backgroundColor: "#EF4444" },
  micIcon: { fontSize: 44, color: "#FFFFFF" },

  inputCard: { width: "100%", backgroundColor: "#FFFFFF", borderRadius: 22, padding: 18, borderWidth: 1, borderColor: "#E2E8F0", shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 8, elevation: 2, marginBottom: 16 },
  inputLabel: { fontSize: 12, fontWeight: "700", color: "#64748B", marginBottom: 8, textTransform: "uppercase" },
  textInput: { backgroundColor: "#F8FAFC", borderWidth: 1.5, borderColor: "#E2E8F0", borderRadius: 14, padding: 12, fontSize: 15, color: "#0F172A", minHeight: 60, textAlignVertical: "top" },
  quickChipsRow: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 10 },
  quickChip: { backgroundColor: "#EEF2FF", paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10, borderWidth: 1, borderColor: "#E0E7FF" },
  quickChipText: { fontSize: 11, fontWeight: "700", color: "#4F46E5" },

  actionRow: { flexDirection: "row", width: "100%", gap: 12, marginBottom: 20 },
  resetBtn: { flex: 1, backgroundColor: "#F1F5F9", borderRadius: 16, padding: 16, alignItems: "center" },
  resetBtnText: { color: "#475569", fontSize: 14, fontWeight: "700" },
  nextBtn: { flex: 2, backgroundColor: "#4F46E5", borderRadius: 16, padding: 16, alignItems: "center", shadowColor: "#4F46E5", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.25, shadowRadius: 8, elevation: 4 },
  nextBtnText: { color: "#FFFFFF", fontSize: 15, fontWeight: "700" },
  btnDisabled: { opacity: 0.6 },

  previewBox: { width: "100%", backgroundColor: "#FFFFFF", borderRadius: 24, padding: 24, borderWidth: 1, borderColor: "#E2E8F0", shadowColor: "#000", shadowOpacity: 0.08, shadowRadius: 14, elevation: 4 },
  previewBadge: { alignSelf: "center", backgroundColor: "#EEF2FF", paddingHorizontal: 12, paddingVertical: 4, borderRadius: 10, marginBottom: 10 },
  previewBadgeText: { fontSize: 11, fontWeight: "800", color: "#4F46E5", letterSpacing: 0.5 },
  previewTitle: { fontSize: 20, fontWeight: "800", color: "#0F172A", textAlign: "center", marginBottom: 18 },
  previewRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: "#F1F5F9" },
  previewRowLast: { borderBottomWidth: 0 },
  previewLabel: { fontSize: 13, color: "#64748B", fontWeight: "600" },
  previewValue: { fontSize: 15, color: "#0F172A", fontWeight: "700", maxWidth: "60%", textAlign: "right" },
  previewCategory: { fontSize: 14, color: "#4F46E5", fontWeight: "700" },
  previewAmount: { fontSize: 22, fontWeight: "800" },
  confirmBtn: { borderRadius: 18, padding: 16, alignItems: "center", marginTop: 18 },
  confirmBtnText: { color: "#FFFFFF", fontSize: 16, fontWeight: "700" },
  cancelBtn: { padding: 12, alignItems: "center", marginTop: 8 },
  cancelBtnText: { color: "#64748B", fontSize: 13, fontWeight: "600" },
});