import React, { useState, useEffect } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, ScrollView, Platform } from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { expenseAPI, categoryAPI } from "../services/api";

export default function AddExpenseScreen({ navigation }) {
  const [type, setType] = useState("expense");
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
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
      const dateStr = date.toISOString().split("T")[0];
      await expenseAPI.create({ type, amount, note, date: dateStr, category: selectedCategory });
      Alert.alert("Success", "Transaction added!");
      navigation.goBack();
    } catch (e) { Alert.alert("Error", "Something went wrong"); }
    finally { setLoading(false); }
  };

  const onDateChange = (event, selectedDate) => {
    setShowDatePicker(Platform.OS === "ios");
    if (selectedDate) setDate(selectedDate);
  };

  const formatDate = (d) => {
    return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>New Transaction</Text>

      <View style={styles.typeRow}>
        <TouchableOpacity
          style={[styles.typeBtn, type === "expense" && styles.typeBtnExpense]}
          onPress={() => setType("expense")}>
          <Text style={[styles.typeBtnText, type === "expense" && styles.typeBtnTextActive]}>Expense</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.typeBtn, type === "income" && styles.typeBtnIncome]}
          onPress={() => setType("income")}>
          <Text style={[styles.typeBtnText, type === "income" && styles.typeBtnTextActive]}>Income</Text>
        </TouchableOpacity>
      </View>

      <TextInput style={styles.input} placeholder="Amount (Tk)" value={amount} onChangeText={setAmount} keyboardType="numeric" />
      <TextInput style={styles.input} placeholder="Note (optional)" value={note} onChangeText={setNote} />

      <TouchableOpacity style={styles.dateBtn} onPress={() => setShowDatePicker(true)}>
        <Text style={styles.dateBtnLabel}>Date</Text>
        <Text style={styles.dateBtnValue}>?? {formatDate(date)}</Text>
      </TouchableOpacity>

      {showDatePicker && (
        <DateTimePicker
          value={date}
          mode="date"
          display="default"
          onChange={onDateChange}
          maximumDate={new Date()}
        />
      )}

      <Text style={styles.label}>Category:</Text>
      <View style={styles.categoryGrid}>
        {categories.map((cat) => (
          <TouchableOpacity
            key={cat.id}
            style={[styles.catChip, selectedCategory === cat.id && { backgroundColor: cat.color || "#6366F1", borderColor: cat.color || "#6366F1" }]}
            onPress={() => setSelectedCategory(selectedCategory === cat.id ? null : cat.id)}>
            <Text style={[styles.catChipText, selectedCategory === cat.id && { color: "#fff" }]}>
              {cat.icon} {cat.name}
            </Text>
          </TouchableOpacity>
        ))}
        <TouchableOpacity
          style={styles.newCatBtn}
          onPress={() => navigation.navigate("Categories")}>
          <Text style={styles.newCatBtnText}>+ New</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={[styles.saveBtn, type === "income" && { backgroundColor: "#10B981" }]} onPress={handleSave} disabled={loading}>
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveBtnText}>Save</Text>}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container:          { flex: 1, backgroundColor: "#f8f9fa", padding: 20 },
  title:              { fontSize: 24, fontWeight: "bold", color: "#1f2937", marginBottom: 24, marginTop: 10 },
  typeRow:            { flexDirection: "row", gap: 12, marginBottom: 20 },
  typeBtn:            { flex: 1, padding: 14, borderRadius: 12, borderWidth: 1, borderColor: "#e5e7eb", alignItems: "center" },
  typeBtnExpense:     { backgroundColor: "#EF4444", borderColor: "#EF4444" },
  typeBtnIncome:      { backgroundColor: "#10B981", borderColor: "#10B981" },
  typeBtnText:        { fontSize: 16, color: "#6b7280", fontWeight: "500" },
  typeBtnTextActive:  { color: "#fff" },
  input:              { backgroundColor: "#fff", borderWidth: 1, borderColor: "#e5e7eb", borderRadius: 12, padding: 14, marginBottom: 16, fontSize: 16 },
  dateBtn:            { backgroundColor: "#fff", borderWidth: 1, borderColor: "#e5e7eb", borderRadius: 12, padding: 14, marginBottom: 16, flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  dateBtnLabel:       { fontSize: 16, color: "#6b7280" },
  dateBtnValue:       { fontSize: 16, color: "#1f2937", fontWeight: "500" },
  label:              { fontSize: 16, fontWeight: "500", color: "#1f2937", marginBottom: 12 },
  categoryGrid:       { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 24 },
  catChip:            { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: "#e5e7eb", backgroundColor: "#fff" },
  catChipText:        { fontSize: 13, color: "#374151" },
  newCatBtn:          { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: "#6366F1", backgroundColor: "#fff" },
  newCatBtnText:      { fontSize: 13, color: "#6366F1", fontWeight: "bold" },
  saveBtn:            { backgroundColor: "#6366F1", borderRadius: 12, padding: 16, alignItems: "center", marginBottom: 40 },
  saveBtnText:        { color: "#fff", fontSize: 16, fontWeight: "bold" },
});
