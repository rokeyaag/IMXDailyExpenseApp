import React, { useState, useRef } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, KeyboardAvoidingView, Platform, Image, Animated } from "react-native";
import { useAuth } from "../context/AuthContext";

function AnimatedButton({ onPress, disabled, colors, children, style }) {
  const scale = useRef(new Animated.Value(1)).current;
  const onIn = () => Animated.spring(scale, { toValue: 0.95, useNativeDriver: true }).start();
  const onOut = () => Animated.spring(scale, { toValue: 1, useNativeDriver: true }).start();
  return (
    <TouchableOpacity onPress={onPress} disabled={disabled} onPressIn={onIn} onPressOut={onOut} activeOpacity={1}>
      <Animated.View style={[style, { transform: [{ scale }], backgroundColor: colors[0] }]}>
        {children}
      </Animated.View>
    </TouchableOpacity>
  );
}

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
        <Text style={styles.subtitle}>Smart expense tracking made easy</Text>
      </View>

      <View style={styles.formCard}>
        <TextInput
          style={styles.input}
          placeholder="Email address"
          placeholderTextColor="#9ca3af"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />
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

        <AnimatedButton
          onPress={handleLogin}
          disabled={loading}
          colors={["#6366F1"]}
          style={styles.button}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Login</Text>}
        </AnimatedButton>

        <View style={styles.divider}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>or</Text>
          <View style={styles.dividerLine} />
        </View>

        <AnimatedButton
          onPress={() => navigation.navigate("Register")}
          disabled={false}
          colors={["#f0f0ff"]}
          style={styles.outlineButton}>
          <Text style={styles.outlineButtonText}>Create new account</Text>
        </AnimatedButton>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container:       { flex: 1, justifyContent: "center", padding: 24, backgroundColor: "#f0f0ff" },
  logoBox:         { alignItems: "center", marginBottom: 32 },
  logoWrapper:     { width: 90, height: 90, borderRadius: 45, backgroundColor: "#fff", justifyContent: "center", alignItems: "center", marginBottom: 14, elevation: 4, shadowColor: "#6366F1", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8 },
  logo:            { width: 70, height: 70 },
  title:           { fontSize: 26, fontWeight: "bold", color: "#6366F1", textAlign: "center", marginBottom: 6 },
  subtitle:        { fontSize: 13, color: "#6b7280", textAlign: "center" },
  formCard:        { backgroundColor: "#fff", borderRadius: 20, padding: 24, elevation: 3, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 8 },
  input:           { backgroundColor: "#f8f9ff", borderWidth: 1.5, borderColor: "#e5e7eb", borderRadius: 12, padding: 14, marginBottom: 14, fontSize: 15, color: "#1f2937" },
  passwordBox:     { backgroundColor: "#f8f9ff", borderWidth: 1.5, borderColor: "#e5e7eb", borderRadius: 12, flexDirection: "row", alignItems: "center", marginBottom: 20 },
  passwordInput:   { flex: 1, padding: 14, fontSize: 15, color: "#1f2937" },
  eyeBtn:          { paddingHorizontal: 14 },
  eyeText:         { color: "#6366F1", fontWeight: "600", fontSize: 13 },
  button:          { borderRadius: 14, padding: 16, alignItems: "center", marginBottom: 16, elevation: 3, shadowColor: "#6366F1", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8 },
  buttonText:      { color: "#fff", fontSize: 16, fontWeight: "bold", letterSpacing: 0.5 },
  divider:         { flexDirection: "row", alignItems: "center", marginBottom: 16 },
  dividerLine:     { flex: 1, height: 1, backgroundColor: "#e5e7eb" },
  dividerText:     { color: "#9ca3af", marginHorizontal: 10, fontSize: 13 },
  outlineButton:   { borderRadius: 14, padding: 15, alignItems: "center", borderWidth: 1.5, borderColor: "#6366F1" },
  outlineButtonText: { color: "#6366F1", fontSize: 15, fontWeight: "600" },
});
