import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, KeyboardAvoidingView, Platform, Image } from "react-native";
import { useAuth } from "../context/AuthContext";

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
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
        <View style={styles.logoWrapper}>
          <Image source={require("../../assets/icon.png")} style={styles.logo} resizeMode="contain" />
        </View>
        <Text style={styles.title}>IMX Daily Expense</Text>
        <Text style={styles.subtitle}>Login to your account</Text>
      </View>
      <TextInput
        style={styles.input}
        placeholder="Email"
        placeholderTextColor="#9ca3af"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
        color="#1f2937"
      />
      <View style={styles.passwordBox}>
        <TextInput
          style={styles.passwordInput}
          placeholder="Password"
          placeholderTextColor="#9ca3af"
          value={password}
          onChangeText={setPassword}
          secureTextEntry={!showPassword}
          color="#1f2937"
        />
        <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeBtn}>
          <Text style={styles.eyeText}>{showPassword ? "Hide" : "Show"}</Text>
        </TouchableOpacity>
      </View>
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
  container:     { flex: 1, justifyContent: "center", padding: 24, backgroundColor: "#f8f9fa" },
  logoBox:       { alignItems: "center", marginBottom: 40 },
  logoWrapper:   { width: 110, height: 110, borderRadius: 55, backgroundColor: "#fff", justifyContent: "center", alignItems: "center", marginBottom: 16, elevation: 3, overflow: "hidden" },
  logo:          { width: 100, height: 100 },
  title:         { fontSize: 26, fontWeight: "bold", color: "#6366F1", textAlign: "center", marginBottom: 6 },
  subtitle:      { fontSize: 14, color: "#6b7280", textAlign: "center" },
  input:         { backgroundColor: "#fff", borderWidth: 1, borderColor: "#e5e7eb", borderRadius: 12, padding: 14, marginBottom: 16, fontSize: 16, color: "#1f2937" },
  passwordBox:   { backgroundColor: "#fff", borderWidth: 1, borderColor: "#e5e7eb", borderRadius: 12, flexDirection: "row", alignItems: "center", marginBottom: 16 },
  passwordInput: { flex: 1, padding: 14, fontSize: 16, color: "#1f2937" },
  eyeBtn:        { paddingHorizontal: 14 },
  eyeText:       { color: "#6366F1", fontWeight: "500", fontSize: 14 },
  button:        { backgroundColor: "#6366F1", borderRadius: 12, padding: 16, alignItems: "center", marginBottom: 16 },
  buttonText:    { color: "#fff", fontSize: 16, fontWeight: "bold" },
  link:          { color: "#6366F1", textAlign: "center", fontSize: 14 },
});
