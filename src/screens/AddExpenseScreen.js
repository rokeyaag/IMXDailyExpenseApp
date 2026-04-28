import React, { useState, useEffect } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, ScrollView } from "react-native";
import { expenseAPI, categoryAPI } from "../services/api";

export default function AddExpenseScreen({ navigation }) {
  const [type, setType] = useState("expense");
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    categoryAPI.list().then(res => setCategories(res.data.results || res.data));
  }, []);

  const handleSave = async () => {
    if (!amount) { Alert.alert("Error", "Please enter amount"); return; }
    setLoading(true);
    try {
      await expenseAPI.create({ type, amount, note, date, category: selectedCategory });
      Alert.alert("Success", "Transaction added!");
      navigation.goBack();
    } catch (e) { Alert.alert("Error", "Something went wrong"); }
    finally { setLoading(false); }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>New Transaction</Text>
      <View style={styles.typeRow}>
        <TouchableOpacity style={[styles.typeBtn, type === "expense" && styles.typeBtnActive]} onPress={() => setType("expense")}>
          <Text style={[styles.typeBtnText, type === "expense" && styles.typeBtnTextActive]}>Expense</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.typeBtn, type === "income" && styles.typeIncome]} onPress={() => setType("income")}>
          <Text style={[styles.typeBtnText, type === "income" && styles.typeBtnTextActive]}>Income</Text>
        </TouchableOpacity>
      </View>
      <TextInput style={styles.input} placeholder="Amount (Tk)" value={amount} onChangeText={setAmount} keyboardType="numeric" />
      <TextInput style={styles.input} placeholder="Note (optional)" value={note} onChangeText={setNote} />
      <TextInput style={styles.input} placeholder="Date (YYYY-MM-DD)" value={date} onChangeText={setDate} />
      <Text style={styles.label}>Select Category:</Text>
      <View style={styles.categoryGrid}>
        {categories.map((cat) => (
          <TouchableOpacity key={cat.id} style={[styles.catBtn, selectedCategory === cat.id && { backgroundColor: cat.color }]} onPress={() => setSelectedCategory(cat.id)}>
            <Text style={[styles.catText, selectedCategory === cat.id && { color: "#fff" }]}>{cat.name}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <TouchableOpacity style={styles.saveBtn} onPress={handleSave} disabled={loading}>
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveBtnText}>Save</Text>}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container:         { flex: 1, backgroundColor: "#f8f9fa", padding: 20 },
  title:             { fontSize: 24, fontWeight: "bold", color: "#1f2937", marginBottom: 24, marginTop: 40 },
  typeRow:           { flexDirection: "row", gap: 12, marginBottom: 20 },
  typeBtn:           { flex: 1, padding: 12, borderRadius: 12, borderWidth: 1, borderColor: "#e5e7eb", alignItems: "center" },
  typeBtnActive:     { backgroundColor: "#EF4444", borderColor: "#EF4444" },
  typeIncome:        { backgroundColor: "#10B981", borderColor: "#10B981" },
  typeBtnText:       { fontSize: 16, color: "#6b7280", fontWeight: "500" },
  typeBtnTextActive: { color: "#fff" },
  input:             { backgroundColor: "#fff", borderWidth: 1, borderColor: "#e5e7eb", borderRadius: 12, padding: 14, marginBottom: 16, fontSize: 16 },
  label:             { fontSize: 16, fontWeight: "500", color: "#1f2937", marginBottom: 12 },
  categoryGrid:      { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 24 },
  catBtn:            { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: "#e5e7eb", backgroundColor: "#fff" },
  catText:           { fontSize: 13, color: "#374151" },
  saveBtn:           { backgroundColor: "#6366F1", borderRadius: 12, padding: 16, alignItems: "center", marginBottom: 40 },
  saveBtnText:       { color: "#fff", fontSize: 16, fontWeight: "bold" },
});