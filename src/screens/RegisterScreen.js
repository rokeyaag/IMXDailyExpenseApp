import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView, Image } from "react-native";
import { authAPI } from "../services/api";
import { useAuth } from "../context/AuthContext";

export default function RegisterScreen({ navigation }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [password2, setPassword2] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showPassword2, setShowPassword2] = useState(false);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();

  const handleRegister = async () => {
    if (!name || !email || !password || !password2) { Alert.alert("Error", "Please fill all fields"); return; }
    if (password !== password2) { Alert.alert("Error", "Passwords do not match"); return; }
    if (password.length < 6) { Alert.alert("Error", "Password must be at least 6 characters"); return; }
    setLoading(true);
    try {
      await authAPI.register({ name, email, password, password2, currency: "BDT" });
      await login(email, password);
    } catch (e) {
      const msg = e.response?.data ? JSON.stringify(e.response.data) : "Registration failed";
      Alert.alert("Error", msg);
    }
    finally { setLoading(false); }
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.logoBox}>
          <View style={styles.logoWrapper}>
            <Image source={require("../../assets/icon.png")} style={styles.logo} resizeMode="contain" />
          </View>
          <Text style={styles.title}>IMX Daily Expense</Text>
          <Text style={styles.subtitle}>Create new account</Text>
        </View>
        <TextInput style={styles.input} placeholder="Your Name" placeholderTextColor="#9ca3af" value={name} onChangeText={setName} />
        <TextInput style={styles.input} placeholder="Email" placeholderTextColor="#9ca3af" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
        <View style={styles.passwordBox}>
          <TextInput
            style={styles.passwordInput}
            placeholder="Password"
            placeholderTextColor="#9ca3af"
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!showPassword}
          />
          <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeBtn}>
            <Text style={styles.eyeText}>{showPassword ? "Hide" : "Show"}</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.passwordBox}>
          <TextInput
            style={styles.passwordInput}
            placeholder="Confirm Password"
            placeholderTextColor="#9ca3af"
            value={password2}
            onChangeText={setPassword2}
            secureTextEntry={!showPassword2}
          />
          <TouchableOpacity onPress={() => setShowPassword2(!showPassword2)} style={styles.eyeBtn}>
            <Text style={styles.eyeText}>{showPassword2 ? "Hide" : "Show"}</Text>
          </TouchableOpacity>
        </View>
        <TouchableOpacity style={styles.button} onPress={handleRegister} disabled={loading}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Register</Text>}
        </TouchableOpacity>
        <TouchableOpacity onPress={() => navigation.navigate("Login")}>
          <Text style={styles.link}>Already have account? Login</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container:     { flex: 1, padding: 24, backgroundColor: "#f8f9fa" },
  logoBox:       { alignItems: "center", marginTop: 40, marginBottom: 30 },
  logoWrapper:   { width: 90, height: 90, borderRadius: 45, backgroundColor: "#fff", justifyContent: "center", alignItems: "center", marginBottom: 12, elevation: 3, overflow: "hidden" },
  logo:          { width: 80, height: 80 },
  title:         { fontSize: 24, fontWeight: "bold", color: "#6366F1", textAlign: "center", marginBottom: 4 },
  subtitle:      { fontSize: 14, color: "#6b7280", textAlign: "center" },
  input:         { backgroundColor: "#fff", borderWidth: 1, borderColor: "#e5e7eb", borderRadius: 12, padding: 14, marginBottom: 16, fontSize: 16, color: "#1f2937" },
  passwordBox:   { backgroundColor: "#fff", borderWidth: 1, borderColor: "#e5e7eb", borderRadius: 12, flexDirection: "row", alignItems: "center", marginBottom: 16 },
  passwordInput: { flex: 1, padding: 14, fontSize: 16, color: "#1f2937" },
  eyeBtn:        { paddingHorizontal: 14 },
  eyeText:       { color: "#6366F1", fontWeight: "500", fontSize: 14 },
  button:        { backgroundColor: "#6366F1", borderRadius: 12, padding: 16, alignItems: "center", marginBottom: 16 },
  buttonText:    { color: "#fff", fontSize: 16, fontWeight: "bold" },
  link:          { color: "#6366F1", textAlign: "center", fontSize: 14, marginBottom: 40 },
});
