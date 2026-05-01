import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, TextInput, Alert } from "react-native";
import { expenseAPI, categoryAPI } from "../services/api";
import api from "../services/api";

export default function BudgetScreen({ navigation }) {
  const [budgets, setBudgets] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [amount, setAmount] = useState("");

  const today = new Date();
  const month = today.getMonth() + 1;
  const year = today.getFullYear();

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      const [budgetRes, catRes] = await Promise.all([
        api.get("/api/budgets/"),
        categoryAPI.list(),
      ]);
      setBudgets(budgetRes.data.results || budgetRes.data);
      setCategories(catRes.data.results || catRes.data);
    } catch (e) { console.log(e); }
    finally { setLoading(false); }
  };

  const handleAddBudget = async () => {
    if (!selectedCategory || !amount) {
      Alert.alert("Error", "Please select category and enter amount");
      return;
    }
    try {
      await api.post("/api/budgets/", {
        category: selectedCategory,
        amount: parseFloat(amount),
        month, year,
      });
      Alert.alert("Success", "Budget added!");
      setShowAdd(false);
      setAmount("");
      setSelectedCategory(null);
      fetchData();
    } catch (e) {
      Alert.alert("Error", "Something went wrong");
    }
  };

  if (loading) return <ActivityIndicator style={{ flex: 1 }} size="large" color="#6366F1" />;

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Budget</Text>
        <TouchableOpacity style={styles.addBtn} onPress={() => setShowAdd(!showAdd)}>
          <Text style={styles.addBtnText}>+ Add</Text>
        </TouchableOpacity>
      </View>

      {showAdd && (
        <View style={styles.addCard}>
          <Text style={styles.addTitle}>Set Budget</Text>
          <TextInput
            style={styles.input}
            placeholder="Amount (Tk)"
            value={amount}
            onChangeText={setAmount}
            keyboardType="numeric"
          />
          <Text style={styles.label}>Select Category:</Text>
          <View style={styles.categoryGrid}>
            {categories.map((cat) => (
              <TouchableOpacity
                key={cat.id}
                style={[styles.catBtn, selectedCategory === cat.id && { backgroundColor: cat.color }]}
                onPress={() => setSelectedCategory(cat.id)}>
                <Text style={[styles.catText, selectedCategory === cat.id && { color: "#fff" }]}>{cat.name}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <TouchableOpacity style={styles.saveBtn} onPress={handleAddBudget}>
            <Text style={styles.saveBtnText}>Save Budget</Text>
          </TouchableOpacity>
        </View>
      )}

      {budgets.length === 0 ? (
        <Text style={styles.empty}>No budgets set yet</Text>
      ) : (
        budgets.map((budget) => (
          <View key={budget.id} style={styles.budgetCard}>
            <View style={styles.budgetHeader}>
              <Text style={styles.budgetName}>{budget.category_detail?.name || "Category"}</Text>
              <Text style={styles.budgetAmount}>Tk {budget.amount}</Text>
            </View>
            <View style={styles.progressBg}>
              <View style={[styles.progressFill, {
                width: `${Math.min(budget.percentage, 100)}%`,
                backgroundColor: budget.percentage > 90 ? "#EF4444" : budget.percentage > 70 ? "#F59E0B" : "#10B981"
              }]} />
            </View>
            <View style={styles.budgetFooter}>
              <Text style={styles.budgetSpent}>Spent: Tk {budget.spent?.toFixed(0)}</Text>
              <Text style={styles.budgetRemaining}>Left: Tk {budget.remaining?.toFixed(0)}</Text>
              <Text style={styles.budgetPct}>{budget.percentage}%</Text>
            </View>
          </View>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container:        { flex: 1, backgroundColor: "#f8f9fa" },
  header:           { flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 20, paddingTop: 50 },
  title:            { fontSize: 24, fontWeight: "bold", color: "#1f2937" },
  addBtn:           { backgroundColor: "#6366F1", borderRadius: 10, paddingHorizontal: 16, paddingVertical: 8 },
  addBtnText:       { color: "#fff", fontWeight: "bold" },
  addCard:          { backgroundColor: "#fff", margin: 16, borderRadius: 16, padding: 20 },
  addTitle:         { fontSize: 18, fontWeight: "bold", color: "#1f2937", marginBottom: 16 },
  input:            { backgroundColor: "#f8f9fa", borderWidth: 1, borderColor: "#e5e7eb", borderRadius: 12, padding: 14, marginBottom: 16, fontSize: 16 },
  label:            { fontSize: 14, fontWeight: "500", color: "#1f2937", marginBottom: 10 },
  categoryGrid:     { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 16 },
  catBtn:           { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 1, borderColor: "#e5e7eb", backgroundColor: "#f8f9fa" },
  catText:          { fontSize: 12, color: "#374151" },
  saveBtn:          { backgroundColor: "#6366F1", borderRadius: 12, padding: 14, alignItems: "center" },
  saveBtnText:      { color: "#fff", fontWeight: "bold" },
  empty:            { textAlign: "center", color: "#6b7280", marginTop: 60, fontSize: 16 },
  budgetCard:       { backgroundColor: "#fff", margin: 16, marginBottom: 8, borderRadius: 16, padding: 20 },
  budgetHeader:     { flexDirection: "row", justifyContent: "space-between", marginBottom: 12 },
  budgetName:       { fontSize: 16, fontWeight: "bold", color: "#1f2937" },
  budgetAmount:     { fontSize: 16, fontWeight: "bold", color: "#6366F1" },
  progressBg:       { backgroundColor: "#e5e7eb", borderRadius: 8, height: 10, marginBottom: 10 },
  progressFill:     { height: 10, borderRadius: 8 },
  budgetFooter:     { flexDirection: "row", justifyContent: "space-between" },
  budgetSpent:      { fontSize: 12, color: "#EF4444" },
  budgetRemaining:  { fontSize: 12, color: "#10B981" },
  budgetPct:        { fontSize: 12, color: "#6b7280" },
});
