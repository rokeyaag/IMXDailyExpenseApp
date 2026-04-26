import React, { useState } from "react";
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, Alert, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView
} from "react-native";
import { authAPI } from "../services/api";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useAuth } from "../context/AuthContext";

export default function RegisterScreen({ navigation }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [password2, setPassword2] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();

  const handleRegister = async () => {
    if (!name || !email || !password || !password2) {
      Alert.alert("Error", "?? field ???? ????");
      return;
    }
    if (password !== password2) {
      Alert.alert("Error", "Password ????? ??");
      return;
    }
    setLoading(true);
    try {
      const res = await authAPI.register({ name, email, password, password2, currency: "BDT" });
      await AsyncStorage.setItem("access_token", res.data.tokens.access);
      await AsyncStorage.setItem("refresh_token", res.data.tokens.refresh);
      await login(email, password);
    } catch (e) {
      Alert.alert("Error", "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>IMX Daily Expense</Text>
        <Text style={styles.subtitle}>???? account ?????</Text>

        <TextInput style={styles.input} placeholder="????? ???" value={name} onChangeText={setName} />
        <TextInput style={styles.input} placeholder="Email" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
        <TextInput style={styles.input} placeholder="Password" value={password} onChangeText={setPassword} secureTextEntry />
        <TextInput style={styles.input} placeholder="Password ???? ???" value={password2} onChangeText={setPassword2} secureTextEntry />

        <TouchableOpacity style={styles.button} onPress={handleRegister} disabled={loading}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Register</Text>}
        </TouchableOpacity>

        <TouchableOpacity onPress={() => navigation.navigate("Login")}>
          <Text style={styles.link}>??? ???? account ???? Login ????</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container:  { flex: 1, padding: 24, backgroundColor: "#f8f9fa", paddingTop: 60 },
  title:      { fontSize: 28, fontWeight: "bold", color: "#6366F1", textAlign: "center", marginBottom: 8 },
  subtitle:   { fontSize: 14, color: "#6b7280", textAlign: "center", marginBottom: 32 },
  input:      { backgroundColor: "#fff", borderWidth: 1, borderColor: "#e5e7eb", borderRadius: 12, padding: 14, marginBottom: 16, fontSize: 16 },
  button:     { backgroundColor: "#6366F1", borderRadius: 12, padding: 16, alignItems: "center", marginBottom: 16 },
  buttonText: { color: "#fff", fontSize: 16, fontWeight: "bold" },
  link:       { color: "#6366F1", textAlign: "center", fontSize: 14 },
});
