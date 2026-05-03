import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, ScrollView, Image } from "react-native";
import * as ImagePicker from "expo-image-picker";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";

const BASE_URL = "https://ecommerce-api-production-3e99.up.railway.app";

export default function ProfileScreen({ navigation }) {
  const { user, logout, setUser } = useAuth();
  const [name, setName] = useState(user?.name || "");
  const [currency, setCurrency] = useState(user?.currency || "BDT");
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState(false);
  const [photo, setPhoto] = useState(user?.avatar || null);
  const [uploading, setUploading] = useState(false);

  const getAvatarUri = (av) => {
    if (!av) return null;
    if (av.startsWith("http")) return av;
    return `${BASE_URL}${av}`;
  };

  const handlePickImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) { Alert.alert("Permission required", "Please allow access to photos"); return; }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });
    if (!result.canceled) { uploadPhoto(result.assets[0]); }
  };

  const handleTakePhoto = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) { Alert.alert("Permission required", "Please allow camera access"); return; }
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });
    if (!result.canceled) { uploadPhoto(result.assets[0]); }
  };

  const uploadPhoto = async (asset) => {
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("avatar", {
        uri: asset.uri,
        type: asset.mimeType || "image/jpeg",
        name: "avatar.jpg",
      });
      const res = await api.patch("/api/auth/profile/", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      const newAvatar = res.data.avatar;
      setPhoto(newAvatar);
      if (setUser) setUser({ ...user, ...res.data });
      Alert.alert("Success", "Photo updated!");
    } catch (e) {
      console.log("Upload error:", e.response?.data || e.message);
      Alert.alert("Error", "Failed to upload photo");
    } finally {
      setUploading(false);
    }
  };

  const handleUpdate = async () => {
    if (!name.trim()) { Alert.alert("Error", "Name cannot be empty"); return; }
    setLoading(true);
    try {
      const res = await api.patch("/api/auth/profile/", { name, currency });
      if (setUser) setUser({ ...user, ...res.data });
      Alert.alert("Success", "Profile updated!");
      setEditing(false);
    } catch (e) {
      Alert.alert("Error", "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const showPhotoOptions = () => {
    Alert.alert("Profile Photo", "Choose an option", [
      { text: "Take Photo", onPress: handleTakePhoto },
      { text: "Choose from Gallery", onPress: handlePickImage },
      { text: "Cancel", style: "cancel" },
    ]);
  };

  const avatarUri = getAvatarUri(photo);

  return (
    <ScrollView style={styles.container}>
      <View style={styles.avatarBox}>
        <TouchableOpacity onPress={showPhotoOptions} style={styles.avatarWrapper}>
          {uploading ? (
            <View style={styles.avatar}>
              <ActivityIndicator color="#fff" size="large" />
            </View>
          ) : avatarUri ? (
            <Image
              source={{ uri: avatarUri }}
              style={styles.avatarImage}
              onError={(e) => {
                console.log("Image load error:", e.nativeEvent.error);
                setPhoto(null);
              }}
            />
          ) : (
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{user?.name?.charAt(0).toUpperCase()}</Text>
            </View>
          )}
          <View style={styles.cameraBtn}>
            <Text style={styles.cameraBtnText}>+</Text>
          </View>
        </TouchableOpacity>
        <Text style={styles.userName}>{user?.name}</Text>
        <Text style={styles.userEmail}>{user?.email}</Text>
        <Text style={styles.tapHint}>Tap photo to change</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Account Info</Text>
        <Text style={styles.label}>Full Name</Text>
        <TextInput
          style={[styles.input, !editing && styles.inputDisabled]}
          value={name}
          onChangeText={setName}
          editable={editing}
          placeholder="Your name"
          color="#1f2937"
        />
        <Text style={styles.label}>Email</Text>
        <TextInput
          style={[styles.input, styles.inputDisabled]}
          value={user?.email}
          editable={false}
          color="#9ca3af"
        />
        <Text style={styles.label}>Currency</Text>
        <View style={styles.currencyRow}>
          {["BDT", "USD", "EUR", "GBP"].map((cur) => (
            <TouchableOpacity
              key={cur}
              style={[styles.currencyBtn, currency === cur && styles.currencyBtnActive]}
              onPress={() => editing && setCurrency(cur)}>
              <Text style={[styles.currencyText, currency === cur && styles.currencyTextActive]}>{cur}</Text>
            </TouchableOpacity>
          ))}
        </View>
        {editing ? (
          <View style={styles.editBtnRow}>
            <TouchableOpacity style={styles.cancelBtn} onPress={() => { setEditing(false); setName(user?.name || ""); }}>
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.saveBtn} onPress={handleUpdate} disabled={loading}>
              {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveBtnText}>Save</Text>}
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity style={styles.editBtn} onPress={() => setEditing(true)}>
            <Text style={styles.editBtnText}>Edit Profile</Text>
          </TouchableOpacity>
        )}
      </View>

      <TouchableOpacity style={styles.logoutBtn} onPress={logout}>
        <Text style={styles.logoutBtnText}>Logout</Text>
      </TouchableOpacity>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container:          { flex: 1, backgroundColor: "#f8f9fa" },
  avatarBox:          { alignItems: "center", paddingTop: 40, paddingBottom: 24, backgroundColor: "#fff", marginBottom: 16 },
  avatarWrapper:      { position: "relative", marginBottom: 12 },
  avatar:             { width: 100, height: 100, borderRadius: 50, backgroundColor: "#6366F1", justifyContent: "center", alignItems: "center", elevation: 4 },
  avatarImage:        { width: 100, height: 100, borderRadius: 50, elevation: 4 },
  avatarText:         { fontSize: 40, fontWeight: "bold", color: "#fff" },
  cameraBtn:          { position: "absolute", bottom: 0, right: 0, width: 30, height: 30, borderRadius: 15, backgroundColor: "#6366F1", justifyContent: "center", alignItems: "center", borderWidth: 2, borderColor: "#fff" },
  cameraBtnText:      { color: "#fff", fontSize: 20, fontWeight: "bold", lineHeight: 24 },
  userName:           { fontSize: 22, fontWeight: "bold", color: "#1f2937" },
  userEmail:          { fontSize: 14, color: "#6b7280", marginTop: 4 },
  tapHint:            { fontSize: 12, color: "#9ca3af", marginTop: 4 },
  card:               { backgroundColor: "#fff", margin: 16, borderRadius: 16, padding: 20 },
  cardTitle:          { fontSize: 18, fontWeight: "bold", color: "#1f2937", marginBottom: 20 },
  label:              { fontSize: 13, color: "#6b7280", marginBottom: 6, fontWeight: "500" },
  input:              { backgroundColor: "#f8f9fa", borderWidth: 1, borderColor: "#e5e7eb", borderRadius: 12, padding: 14, marginBottom: 16, fontSize: 16, color: "#1f2937" },
  inputDisabled:      { backgroundColor: "#f3f4f6", color: "#9ca3af" },
  currencyRow:        { flexDirection: "row", gap: 8, marginBottom: 20 },
  currencyBtn:        { flex: 1, padding: 10, borderRadius: 10, borderWidth: 1, borderColor: "#e5e7eb", alignItems: "center", backgroundColor: "#f8f9fa" },
  currencyBtnActive:  { backgroundColor: "#6366F1", borderColor: "#6366F1" },
  currencyText:       { fontSize: 13, color: "#6b7280", fontWeight: "500" },
  currencyTextActive: { color: "#fff" },
  editBtn:            { backgroundColor: "#6366F1", borderRadius: 12, padding: 14, alignItems: "center" },
  editBtnText:        { color: "#fff", fontWeight: "bold", fontSize: 15 },
  editBtnRow:         { flexDirection: "row", gap: 12 },
  cancelBtn:          { flex: 1, backgroundColor: "#f3f4f6", borderRadius: 12, padding: 14, alignItems: "center" },
  cancelBtnText:      { color: "#6b7280", fontWeight: "bold" },
  saveBtn:            { flex: 1, backgroundColor: "#6366F1", borderRadius: 12, padding: 14, alignItems: "center" },
  saveBtnText:        { color: "#fff", fontWeight: "bold" },
  logoutBtn:          { margin: 16, backgroundColor: "#EF4444", borderRadius: 12, padding: 16, alignItems: "center" },
  logoutBtnText:      { color: "#fff", fontWeight: "bold", fontSize: 16 },
});
