import React, { useState, useEffect } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, ScrollView, Image, Platform, SafeAreaView } from "react-native";
import * as ImagePicker from "expo-image-picker";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";
import api, { BASE_URL } from "../services/api";

const CLOUDINARY_CLOUD = process.env.EXPO_PUBLIC_CLOUDINARY_CLOUD || "dr7c7wxaw";
const CLOUDINARY_PRESET = process.env.EXPO_PUBLIC_CLOUDINARY_PRESET || "dv1zh1rc";

export default function ProfileScreen({ navigation }) {
  const { user, logout, setUser } = useAuth();
  const { t } = useLanguage();
  const [name, setName] = useState(user?.name || "Lutfor Rahman");
  const [currency, setCurrency] = useState(user?.currency || "BDT");
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState(false);
  const [photo, setPhoto] = useState(user?.avatar || user?.avatar_url || user?.profile_photo || null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    const userPhoto = user?.avatar || user?.avatar_url || user?.profile_photo || null;
    if (userPhoto !== photo) { setPhoto(userPhoto); }
  }, [user]);

  useEffect(() => { fetchProfile(); }, []);

  const fetchProfile = async () => {
    try {
      const res = await api.get("/api/auth/profile/");
      const freshPhoto = res.data?.avatar || res.data?.avatar_url || res.data?.profile_photo || null;
      if (freshPhoto) {
        setPhoto(freshPhoto);
        if (setUser) setUser({ ...user, ...res.data, avatar: freshPhoto });
      }
    } catch {}
  };

  const getAvatarUri = (av) => {
    if (!av) return null;
    if (av.startsWith("https://res.cloudinary")) return av + "?t=" + Date.now();
    if (av.startsWith("http")) return av.replace("http://", "https://");
    return BASE_URL + av;
  };

  const handlePickImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) { Alert.alert(t("error"), "Please allow access to photos"); return; }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true, aspect: [1, 1], quality: 0.7,
    });
    if (!result.canceled) { uploadToCloudinary(result.assets[0]); }
  };

  const handleTakePhoto = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) { Alert.alert(t("error"), "Please allow camera access"); return; }
    const result = await ImagePicker.launchCameraAsync({ allowsEditing: true, aspect: [1, 1], quality: 0.7 });
    if (!result.canceled) { uploadToCloudinary(result.assets[0]); }
  };

  const uploadToCloudinary = async (asset) => {
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", { uri: asset.uri, type: asset.mimeType || "image/jpeg", name: "avatar.jpg" });
      formData.append("upload_preset", CLOUDINARY_PRESET);
      formData.append("folder", "avatars");
      const res = await fetch("https://api.cloudinary.com/v1_1/" + CLOUDINARY_CLOUD + "/image/upload", { method: "POST", body: formData });
      const data = await res.json();
      if (data.secure_url) {
        const cloudinaryUrl = data.secure_url;
        setPhoto(cloudinaryUrl);
        const backendRes = await api.patch("/api/auth/profile/", { avatar_url: cloudinaryUrl, avatar: cloudinaryUrl, profile_photo: cloudinaryUrl });
        const savedPhoto = backendRes.data?.avatar || backendRes.data?.avatar_url || backendRes.data?.profile_photo || cloudinaryUrl;
        if (setUser) { setUser({ ...user, ...backendRes.data, avatar: savedPhoto, avatar_url: savedPhoto }); }
        setPhoto(savedPhoto);
        Alert.alert(t("success"), "Photo updated!");
      } else {
        Alert.alert(t("error"), "Upload failed");
      }
    } catch (e) {
      Alert.alert(t("error"), e.message);
    } finally {
      setUploading(false);
    }
  };

  const handleUpdate = async () => {
    if (!name.trim()) { Alert.alert(t("error"), t("amountRequired")); return; }
    setLoading(true);
    try {
      const res = await api.patch("/api/auth/profile/", { name, currency });
      if (setUser) setUser({ ...user, ...res.data });
      Alert.alert(t("success"), t("profileUpdated"));
      setEditing(false);
    } catch (e) {
      if (setUser) setUser({ ...user, name, currency });
      setEditing(false);
    } finally {
      setLoading(false);
    }
  };

  const showPhotoOptions = () => {
    Alert.alert(t("changePhoto"), "", [
      { text: t("takePicture"), onPress: handleTakePhoto },
      { text: t("chooseFromGallery"), onPress: handlePickImage },
      { text: t("cancel"), style: "cancel" },
    ]);
  };

  const handleLogout = () => {
    Alert.alert(t("logout"), t("logoutConfirm"), [
      { text: t("cancel"), style: "cancel" },
      { text: t("logout"), style: "destructive", onPress: logout },
    ]);
  };

  const avatarUri = getAvatarUri(photo);

  return (
    <SafeAreaView style={styles.screen}>
      {/* Top Header */}
      <View style={styles.topNav}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn} activeOpacity={0.7}>
          <Text style={styles.backArrow}>←</Text>
        </TouchableOpacity>
        <Text style={styles.navTitle}>{t("profile") || "User Profile"}</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>

        {/* Hero Avatar Card */}
        <View style={styles.avatarCard}>
          <TouchableOpacity onPress={showPhotoOptions} style={styles.avatarWrapper} activeOpacity={0.8}>
            {uploading ? (
              <View style={styles.avatar}>
                <ActivityIndicator color="#FFFFFF" size="large" />
              </View>
            ) : avatarUri ? (
              <Image source={{ uri: avatarUri }} style={styles.avatarImage} onError={() => setPhoto(null)} />
            ) : (
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{(name || "LR").charAt(0).toUpperCase()}</Text>
              </View>
            )}
            <View style={styles.cameraBtn}>
              <Text style={styles.cameraBtnText}>📷</Text>
            </View>
          </TouchableOpacity>

          <Text style={styles.userName}>{name || "Lutfor Rahman"}</Text>
          <Text style={styles.userEmail}>{user?.email || "lutfor@imxtrading.com"}</Text>
          <View style={styles.verifiedBadge}>
            <Text style={styles.verifiedText}>✓ IMX Premium Member</Text>
          </View>
        </View>

        {/* Edit Info Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>👤 {t("profile")}</Text>

          <Text style={styles.label}>{t("name")}</Text>
          <TextInput
            style={[styles.input, !editing && styles.inputDisabled]}
            value={name}
            onChangeText={setName}
            editable={editing}
            placeholder={t("name")}
            placeholderTextColor="#94A3B8"
          />

          <Text style={styles.label}>{t("email")}</Text>
          <TextInput
            style={[styles.input, styles.inputDisabled]}
            value={user?.email || "lutfor@imxtrading.com"}
            editable={false}
          />

          <Text style={styles.label}>{t("currency")}</Text>
          <View style={styles.currencyRow}>
            {["BDT (৳)", "USD ($)", "EUR (€)", "GBP (£)"].map((cur) => {
              const code = cur.split(" ")[0];
              const isSelected = currency === code;
              return (
                <TouchableOpacity
                  key={cur}
                  style={[styles.currencyBtn, isSelected && styles.currencyBtnActive]}
                  onPress={() => editing && setCurrency(code)}
                  activeOpacity={0.8}>
                  <Text style={[styles.currencyText, isSelected && styles.currencyTextActive]}>{cur}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {editing ? (
            <View style={styles.editBtnRow}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => { setEditing(false); setName(user?.name || "Lutfor Rahman"); }} activeOpacity={0.7}>
                <Text style={styles.cancelBtnText}>{t("cancel")}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveBtn} onPress={handleUpdate} disabled={loading} activeOpacity={0.85}>
                {loading ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.saveBtnText}>{t("save")}</Text>}
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity style={styles.editBtn} onPress={() => setEditing(true)} activeOpacity={0.85}>
              <Text style={styles.editBtnText}>✏️ {t("updateProfile") || "Edit Profile"}</Text>
            </TouchableOpacity>
          )}
        </View>

        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} activeOpacity={0.8}>
          <Text style={styles.logoutBtnText}>🚪 {t("logout")}</Text>
        </TouchableOpacity>

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

  avatarCard: {
    backgroundColor: "#FFFFFF",
    marginTop: 16,
    borderRadius: 24,
    padding: 24,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  avatarWrapper: { position: "relative", marginBottom: 14 },
  avatar: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: "#0F172A",
    justifyContent: "center",
    alignItems: "center",
  },
  avatarImage: { width: 90, height: 90, borderRadius: 45 },
  avatarText: { fontSize: 36, fontWeight: "800", color: "#FFFFFF" },
  cameraBtn: {
    position: "absolute",
    bottom: -2,
    right: -2,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#4F46E5",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2.5,
    borderColor: "#FFFFFF",
  },
  cameraBtnText: { fontSize: 14 },

  userName: { fontSize: 20, fontWeight: "800", color: "#0F172A" },
  userEmail: { fontSize: 13, color: "#64748B", marginTop: 2, marginBottom: 8 },
  verifiedBadge: {
    backgroundColor: "#ECFDF5",
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#D1FAE5",
  },
  verifiedText: { fontSize: 11, color: "#059669", fontWeight: "700" },

  card: {
    backgroundColor: "#FFFFFF",
    marginTop: 14,
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  cardTitle: { fontSize: 16, fontWeight: "700", color: "#0F172A", marginBottom: 16 },
  label: { fontSize: 12, color: "#64748B", marginBottom: 6, fontWeight: "600" },
  input: {
    backgroundColor: "#F8FAFC",
    borderWidth: 1.5,
    borderColor: "#E2E8F0",
    borderRadius: 16,
    padding: 14,
    marginBottom: 16,
    fontSize: 15,
    color: "#0F172A",
    fontWeight: "600",
  },
  inputDisabled: { backgroundColor: "#F1F5F9", color: "#64748B" },

  currencyRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 20 },
  currencyBtn: {
    flex: 1,
    minWidth: "45%",
    paddingVertical: 10,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: "#E2E8F0",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
  },
  currencyBtnActive: { backgroundColor: "#0F172A", borderColor: "#0F172A" },
  currencyText: { fontSize: 12, color: "#475569", fontWeight: "600" },
  currencyTextActive: { color: "#FFFFFF", fontWeight: "700" },

  editBtn: {
    backgroundColor: "#4F46E5",
    borderRadius: 18,
    paddingVertical: 14,
    alignItems: "center",
  },
  editBtnText: { color: "#FFFFFF", fontWeight: "700", fontSize: 15 },
  editBtnRow: { flexDirection: "row", gap: 12 },
  cancelBtn: {
    flex: 1,
    backgroundColor: "#F1F5F9",
    borderRadius: 18,
    paddingVertical: 14,
    alignItems: "center",
  },
  cancelBtnText: { color: "#475569", fontWeight: "700" },
  saveBtn: {
    flex: 1,
    backgroundColor: "#4F46E5",
    borderRadius: 18,
    paddingVertical: 14,
    alignItems: "center",
  },
  saveBtnText: { color: "#FFFFFF", fontWeight: "700" },

  logoutBtn: {
    marginTop: 14,
    backgroundColor: "#FFFFFF",
    borderWidth: 1.5,
    borderColor: "#FEE2E2",
    borderRadius: 20,
    paddingVertical: 16,
    alignItems: "center",
  },
  logoutBtnText: { color: "#EF4444", fontWeight: "700", fontSize: 15 },
});