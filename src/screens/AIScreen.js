import React, { useState } from "react";
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, Alert, ActivityIndicator, ScrollView
} from "react-native";
import api from "../services/api";

export default function AIScreen({ navigation }) {
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const handleAIAdd = async () => {
    if (!text.trim()) {
      Alert.alert("Error", "Please enter some text");
      return;
    }
    setLoading(true);
    setResult(null);
    try {
      const res = await api.post("/api/ai/add-expense/", { text });
      setResult(res.data);
      setText("");
    } catch (e) {
      Alert.alert("Error", e.response?.data?.error || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>AI Expense Entry</Text>
      <Text style={styles.subtitle}>Type in Bengali or English</Text>

      <View style={styles.examples}>
        <Text style={styles.exampleTitle}>Examples:</Text>
        <Text style={styles.example}>- rickshaw 50 taka</Text>
        <Text style={styles.example}>- salary received 20000</Text>
        <Text style={styles.example}>- lunch 150 taka</Text>
        <Text style={styles.example}>- grocery shopping 500</Text>
      </View>

      <TextInput
        style={styles.input}
        placeholder="Type your expense here..."
        value={text}
        onChangeText={setText}
        multiline
        numberOfLines={3}
      />

      <TouchableOpacity style={styles.button} onPress={handleAIAdd} disabled={loading}>
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Add with AI</Text>}
      </TouchableOpacity>

      {result && (
        <View style={styles.resultCard}>
          <Text style={styles.resultTitle}>Added Successfully!</Text>
          <Text style={styles.resultText}>Type: {result.parsed?.type}</Text>
          <Text style={styles.resultText}>Amount: Tk {result.parsed?.amount}</Text>
          <Text style={styles.resultText}>Note: {result.parsed?.note}</Text>
          <Text style={styles.resultText}>Category: {result.parsed?.category_hint}</Text>
          <TouchableOpacity style={styles.dashboardBtn} onPress={() => navigation.navigate("Dashboard")}>
            <Text style={styles.dashboardBtnText}>Go to Dashboard</Text>
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container:        { flex: 1, backgroundColor: "#f8f9fa", padding: 20 },
  title:            { fontSize: 24, fontWeight: "bold", color: "#1f2937", marginTop: 40, marginBottom: 8 },
  subtitle:         { fontSize: 14, color: "#6b7280", marginBottom: 20 },
  examples:         { backgroundColor: "#fff", borderRadius: 12, padding: 16, marginBottom: 20 },
  exampleTitle:     { fontSize: 14, fontWeight: "bold", color: "#1f2937", marginBottom: 8 },
  example:          { fontSize: 13, color: "#6b7280", marginBottom: 4 },
  input:            { backgroundColor: "#fff", borderWidth: 1, borderColor: "#e5e7eb", borderRadius: 12, padding: 14, fontSize: 16, marginBottom: 16, minHeight: 80, textAlignVertical: "top" },
  button:           { backgroundColor: "#6366F1", borderRadius: 12, padding: 16, alignItems: "center", marginBottom: 20 },
  buttonText:       { color: "#fff", fontSize: 16, fontWeight: "bold" },
  resultCard:       { backgroundColor: "#fff", borderRadius: 12, padding: 20, borderLeftWidth: 4, borderLeftColor: "#10B981" },
  resultTitle:      { fontSize: 18, fontWeight: "bold", color: "#10B981", marginBottom: 12 },
  resultText:       { fontSize: 14, color: "#1f2937", marginBottom: 6 },
  dashboardBtn:     { backgroundColor: "#6366F1", borderRadius: 8, padding: 12, alignItems: "center", marginTop: 12 },
  dashboardBtnText: { color: "#fff", fontWeight: "bold" },
});
