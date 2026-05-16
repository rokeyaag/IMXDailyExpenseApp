import React, { useState, useRef, useEffect } from "react";
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, ScrollView, Animated, Easing, Platform, Alert } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { ExpoSpeechRecognitionModule, useSpeechRecognitionEvent } from "expo-speech-recognition";
import api from "../services/api";
import Toast from "../components/Toast";
import { useLanguage } from "../context/LanguageContext";

export default function AIScreen({ navigation }) {
  const { t } = useLanguage();
  const [transcript, setTranscript] = useState("");
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

  useSpeechRecognitionEvent("start", () => { setRecording(true); });
  useSpeechRecognitionEvent("end", () => { setRecording(false); stopRingAnimation(); });
  useSpeechRecognitionEvent("result", (event) => {
    if (event.results && event.results[0]) {
      setTranscript(event.results[0].transcript);
    }
  });
  useSpeechRecognitionEvent("error", (event) => {
    setRecording(false);
    stopRingAnimation();
    showToast("Voice error: " + (event.message || event.error || "try again"), "error");
  });

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
      const result = await ExpoSpeechRecognitionModule.requestPermissionsAsync();
      if (!result.granted) {
        Alert.alert("Permission Required", "Microphone permission lagbe voice use korar jonno.");
        return false;
      }
      return true;
    } catch (e) {
      showToast("Permission error", "error");
      return false;
    }
  };

  const startRecording = async () => {
    if (recording) { stopRecording(); return; }
    const hasPermission = await requestPermissions();
    if (!hasPermission) return;
    setTranscript("");
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
      showToast("Voice start hoyni: " + e.message, "error");
    }
  };

  const stopRecording = () => {
    try { ExpoSpeechRecognitionModule.stop(); } catch (e) {}
    stopRingAnimation();
  };

  const handleAIParse = async () => {
    if (!transcript.trim()) { showToast(t("sayFirst"), "error"); return; }
    setLoading(true);
    setPreview(null);
    try {
      const res = await api.post("/api/ai/add-expense/", { text: transcript, action: "parse" });
      setPreview(res.data.parsed);
    } catch (e) {
      showToast(e.response?.data?.error || t("somethingWrong"), "error");
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = async () => {
    setConfirming(true);
    try {
      await api.post("/api/ai/add-expense/", { text: transcript, action: "confirm", parsed: preview });
      showToast(t("savedSuccess"));
      setTranscript("");
      setPreview(null);
      setTimeout(() => { navigation.navigate("Dashboard", { refresh: Date.now() }); }, 1500);
    } catch (e) {
      showToast(t("saveFailed"), "error");
    } finally {
      setConfirming(false);
    }
  };

  const handleReset = () => {
    setTranscript("");
    setPreview(null);
    if (recording) stopRecording();
  };

  const typeColor = preview?.type === "income" ? "#10B981" : "#EF4444";

  const ringStyle = (anim) => ({
    transform: [{ scale: anim.interpolate({ inputRange: [0, 1], outputRange: [1, 2.2] }) }],
    opacity: anim.interpolate({ inputRange: [0, 1], outputRange: [0.6, 0] }),
  });

  return (
    <LinearGradient colors={["#667eea", "#764ba2"]} style={styles.gradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
      <Toast visible={toast.visible} message={toast.message} type={toast.type} onHide={() => setToast({ ...toast, visible: false })} />
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">

        {!preview && (
          <>
            <View style={styles.langToggle}>
              <TouchableOpacity
                style={[styles.langPill, language === "en-US" && styles.langPillActive]}
                onPress={() => !recording && setLanguage("en-US")}
                activeOpacity={0.7}>
                <Text style={[styles.langText, language === "en-US" && styles.langTextActive]}>EN</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.langPill, language === "bn-BD" && styles.langPillActive]}
                onPress={() => !recording && setLanguage("bn-BD")}
                activeOpacity={0.7}>
                <Text style={[styles.langText, language === "bn-BD" && styles.langTextActive]}>বাংলা</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.heading}>
              {recording ? t("listening") : t("tapToSpeak")}
            </Text>
            <Text style={styles.subheading}>
              {language === "bn-BD" ? t("speakInBangla") : t("speakInEnglish")}
            </Text>

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
                  <Text style={styles.micIcon}>{recording ? "■" : "\ud83c\udfa4"}</Text>
                </TouchableOpacity>
              </Animated.View>
            </View>

            <View style={styles.transcriptCard}>
              <Text style={styles.transcriptLabel}>
                {transcript ? t("youSaid") : "Example: 100 taka cha kheyechi"}
              </Text>
              {transcript ? (
                <Text style={styles.transcriptText}>{transcript}</Text>
              ) : (
                <Text style={styles.transcriptHint}>
                  {recording ? t("liveListening") : t("tapMic")}
                </Text>
              )}
            </View>

            {transcript.trim() && !recording && (
              <View style={styles.actionRow}>
                <TouchableOpacity style={styles.resetBtn} onPress={handleReset} activeOpacity={0.8}>
                  <Text style={styles.resetBtnText}>{t("reset")}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.nextBtn, loading && styles.btnDisabled]}
                  onPress={handleAIParse}
                  disabled={loading}
                  activeOpacity={0.85}>
                  {loading ? <ActivityIndicator color="#667eea" size="small" /> : <Text style={styles.nextBtnText}>{t("next")}</Text>}
                </TouchableOpacity>
              </View>
            )}
          </>
        )}

        {preview && (
          <View style={styles.previewBox}>
            <Text style={styles.previewTitle}>{t("check")}</Text>
            <View style={styles.previewRow}>
              <Text style={styles.previewLabel}>{t("type")}</Text>
              <Text style={[styles.previewValue, { color: typeColor }]}>
                {preview.type === "income" ? t("income") : t("expense")}
              </Text>
            </View>
            <View style={styles.previewRow}>
              <Text style={styles.previewLabel}>{t("taka")}</Text>
              <Text style={[styles.previewAmount, { color: typeColor }]}>{preview.amount} Tk</Text>
            </View>
            <View style={styles.previewRow}>
              <Text style={styles.previewLabel}>{t("what")}</Text>
              <Text style={styles.previewValue}>{preview.note || "-"}</Text>
            </View>
            <View style={[styles.previewRow, styles.previewRowLast]}>
              <Text style={styles.previewLabel}>{t("category")}</Text>
              <Text style={styles.previewValue}>{preview.category_name || preview.category_hint || "Other"}</Text>
            </View>
            <TouchableOpacity
              style={[styles.confirmBtn, { backgroundColor: typeColor }]}
              onPress={handleConfirm}
              disabled={confirming}
              activeOpacity={0.85}>
              {confirming ? <ActivityIndicator color="#fff" size="large" /> : <Text style={styles.confirmBtnText}>{t("saveItNow")}</Text>}
            </TouchableOpacity>
            <TouchableOpacity style={styles.cancelBtn} onPress={handleReset} activeOpacity={0.7}>
              <Text style={styles.cancelBtnText}>{t("speakAgain")}</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: { flex: 1 },
  content: { flexGrow: 1, padding: 24, paddingTop: 20, paddingBottom: 40, alignItems: "center" },

  langToggle: { flexDirection: "row", backgroundColor: "rgba(255,255,255,0.18)", borderRadius: 30, padding: 4, marginBottom: 30, borderWidth: 1, borderColor: "rgba(255,255,255,0.25)" },
  langPill: { paddingHorizontal: 24, paddingVertical: 10, borderRadius: 26 },
  langPillActive: { backgroundColor: "#fff" },
  langText: { color: "rgba(255,255,255,0.85)", fontSize: 15, fontWeight: "600" },
  langTextActive: { color: "#667eea" },

  heading: { fontSize: 32, fontWeight: "700", color: "#fff", textAlign: "center", marginBottom: 8 },
  subheading: { fontSize: 16, color: "rgba(255,255,255,0.75)", textAlign: "center", marginBottom: 40 },

  micWrapper: { width: 220, height: 220, justifyContent: "center", alignItems: "center", marginBottom: 30 },
  ring: { position: "absolute", width: 160, height: 160, borderRadius: 80, borderWidth: 2, borderColor: "rgba(255,255,255,0.5)" },
  micBtn: { width: 160, height: 160, borderRadius: 80, backgroundColor: "#fff", justifyContent: "center", alignItems: "center", elevation: 16, shadowColor: "#000", shadowOpacity: 0.3, shadowRadius: 20, shadowOffset: { width: 0, height: 8 } },
  micBtnActive: { backgroundColor: "#fee2e2" },
  micIcon: { fontSize: 64 },

  transcriptCard: { width: "100%", backgroundColor: "rgba(255,255,255,0.15)", borderRadius: 20, padding: 20, marginBottom: 20, borderWidth: 1, borderColor: "rgba(255,255,255,0.25)", minHeight: 100 },
  transcriptLabel: { fontSize: 13, color: "rgba(255,255,255,0.75)", marginBottom: 8, fontWeight: "600", letterSpacing: 0.5 },
  transcriptText: { fontSize: 20, color: "#fff", lineHeight: 28, fontWeight: "500" },
  transcriptHint: { fontSize: 16, color: "rgba(255,255,255,0.6)", fontStyle: "italic" },

  actionRow: { flexDirection: "row", width: "100%", gap: 12 },
  resetBtn: { flex: 1, backgroundColor: "rgba(255,255,255,0.18)", borderRadius: 16, padding: 18, alignItems: "center", borderWidth: 1, borderColor: "rgba(255,255,255,0.3)" },
  resetBtnText: { color: "#fff", fontSize: 17, fontWeight: "600" },
  nextBtn: { flex: 2, backgroundColor: "#fff", borderRadius: 16, padding: 18, alignItems: "center", elevation: 8 },
  nextBtnText: { color: "#667eea", fontSize: 18, fontWeight: "700" },
  btnDisabled: { opacity: 0.6 },

  previewBox: { width: "100%", backgroundColor: "#fff", borderRadius: 24, padding: 28, marginTop: 20, elevation: 12, shadowColor: "#000", shadowOpacity: 0.2, shadowRadius: 20, shadowOffset: { width: 0, height: 8 } },
  previewTitle: { fontSize: 26, fontWeight: "700", color: "#1f2937", textAlign: "center", marginBottom: 24 },
  previewRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: "#f3f4f6" },
  previewRowLast: { borderBottomWidth: 0 },
  previewLabel: { fontSize: 15, color: "#6b7280", fontWeight: "600" },
  previewValue: { fontSize: 17, color: "#1f2937", fontWeight: "600", maxWidth: "60%", textAlign: "right" },
  previewAmount: { fontSize: 26, fontWeight: "700" },
  confirmBtn: { borderRadius: 16, padding: 18, alignItems: "center", marginTop: 24, elevation: 6 },
  confirmBtnText: { color: "#fff", fontSize: 20, fontWeight: "700", letterSpacing: 0.5 },
  cancelBtn: { padding: 14, alignItems: "center", marginTop: 8 },
  cancelBtnText: { color: "#6b7280", fontSize: 15, fontWeight: "600" },
});