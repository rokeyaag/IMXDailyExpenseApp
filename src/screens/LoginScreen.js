import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, KeyboardAvoidingView, Platform, Image } from "react-native";
import { useAuth } from "../context/AuthContext";

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();

  const handleLogin = async () => {
    if (!email || !password) { Alert.alert("Error", "Email and password required"); return; }
    setLoading(true);
    try { await login(email, password); }
    catch (e) { Alert.alert("Error", "Invalid email or password"); }
    finally { setLoading(false); }
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <View style={styles.logoBox}>
        <Image source={require("../../assets/icon.png")} style={styles.logo} resizeMode="contain" />
        <Text style={styles.title}>IMX Daily Expense</Text>
        <Text style={styles.subtitle}>Login to your account</Text>
      </View>
      <TextInput style={styles.input} placeholder="Email" placeholderTextColor="#9ca3af" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
      <TextInput style={styles.input} placeholder="Password" placeholderTextColor="#9ca3af" value={password} onChangeText={setPassword} secureTextEntry />
      <TouchableOpacity style={styles.button} onPress={handleLogin} disabled={loading}>
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Login</Text>}
      </TouchableOpacity>
      <TouchableOpacity onPress={() => navigation.navigate("Register")}>
        <Text style={styles.link}>No account? Register here</Text>
      </TouchableOpacity>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container:  { flex: 1, justifyContent: "center", padding: 24, backgroundColor: "#f8f9fa" },
  logoBox:    { alignItems: "center", marginBottom: 40 },
  logo:       { width: 120, height: 120, marginBottom: 16 },
  title:      { fontSize: 26, fontWeight: "bold", color: "#6366F1", textAlign: "center", marginBottom: 6 },
  subtitle:   { fontSize: 14, color: "#6b7280", textAlign: "center" },
  input:      { backgroundColor: "#fff", borderWidth: 1, borderColor: "#e5e7eb", borderRadius: 12, padding: 14, marginBottom: 16, fontSize: 16 },
  button:     { backgroundColor: "#6366F1", borderRadius: 12, padding: 16, alignItems: "center", marginBottom: 16 },
  buttonText: { color: "#fff", fontSize: 16, fontWeight: "bold" },
  link:       { color: "#6366F1", textAlign: "center", fontSize: 14 },
});
