import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, ScrollView, Image } from "react-native";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";

export default function ProfileScreen({ navigation }) {
  const { user, logout, setUser } = useAuth();
  const [name, setName] = useState(user?.name || "");
  const [currency, setCurrency] = useState(user?.currency || "BDT");
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState(false);

  const handleUpdate = async () => {
    if (!name.trim()) { Alert.alert("Error", "Name cannot be empty"); return; }
    setLoading(true);
    try {
      const res = await api.patch("/api/auth/profile/", { name, currency });
      if (setUser) setUser(res.data);
      Alert.alert("Success", "Profile updated!");
      setEditing(false);
    } catch (e) {
      Alert.alert("Error", "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.avatarBox}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{user?.name?.charAt(0).toUpperCase()}</Text>
        </View>
        <Text style={styles.userName}>{user?.name}</Text>
        <Text style={styles.userEmail}>{user?.email}</Text>
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
        />

        <Text style={styles.label}>Email</Text>
        <TextInput
          style={[styles.input, styles.inputDisabled]}
          value={user?.email}
          editable={false}
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
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container:           { flex: 1, backgroundColor: "#f8f9fa" },
  avatarBox:           { alignItems: "center", paddingTop: 40, paddingBottom: 30, backgroundColor: "#fff", marginBottom: 16 },
  avatar:              { width: 90, height: 90, borderRadius: 45, backgroundColor: "#6366F1", justifyContent: "center", alignItems: "center", marginBottom: 12, elevation: 4 },
  avatarText:          { fontSize: 36, fontWeight: "bold", color: "#fff" },
  userName:            { fontSize: 22, fontWeight: "bold", color: "#1f2937" },
  userEmail:           { fontSize: 14, color: "#6b7280", marginTop: 4 },
  card:                { backgroundColor: "#fff", margin: 16, borderRadius: 16, padding: 20 },
  cardTitle:           { fontSize: 18, fontWeight: "bold", color: "#1f2937", marginBottom: 20 },
  label:               { fontSize: 13, color: "#6b7280", marginBottom: 6, fontWeight: "500" },
  input:               { backgroundColor: "#f8f9fa", borderWidth: 1, borderColor: "#e5e7eb", borderRadius: 12, padding: 14, marginBottom: 16, fontSize: 16, color: "#1f2937" },
  inputDisabled:       { backgroundColor: "#f3f4f6", color: "#9ca3af" },
  currencyRow:         { flexDirection: "row", gap: 8, marginBottom: 20 },
  currencyBtn:         { flex: 1, padding: 10, borderRadius: 10, borderWidth: 1, borderColor: "#e5e7eb", alignItems: "center", backgroundColor: "#f8f9fa" },
  currencyBtnActive:   { backgroundColor: "#6366F1", borderColor: "#6366F1" },
  currencyText:        { fontSize: 13, color: "#6b7280", fontWeight: "500" },
  currencyTextActive:  { color: "#fff" },
  editBtn:             { backgroundColor: "#6366F1", borderRadius: 12, padding: 14, alignItems: "center" },
  editBtnText:         { color: "#fff", fontWeight: "bold", fontSize: 15 },
  editBtnRow:          { flexDirection: "row", gap: 12 },
  cancelBtn:           { flex: 1, backgroundColor: "#f3f4f6", borderRadius: 12, padding: 14, alignItems: "center" },
  cancelBtnText:       { color: "#6b7280", fontWeight: "bold" },
  saveBtn:             { flex: 1, backgroundColor: "#6366F1", borderRadius: 12, padding: 14, alignItems: "center" },
  saveBtnText:         { color: "#fff", fontWeight: "bold" },
  logoutBtn:           { margin: 16, backgroundColor: "#EF4444", borderRadius: 12, padding: 16, alignItems: "center" },
  logoutBtnText:       { color: "#fff", fontWeight: "bold", fontSize: 16 },
});
