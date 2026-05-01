import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from "react-native";
import { useAuth } from "../context/AuthContext";
import { expenseAPI } from "../services/api";

export default function DashboardScreen({ navigation }) {
  const { user, logout } = useAuth();
  const [summary, setSummary] = useState(null);
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const today = new Date();
  const month = today.getMonth() + 1;
  const year = today.getFullYear();

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      const [sumRes, expRes] = await Promise.all([
        expenseAPI.summary({ month, year }),
        expenseAPI.list({ month, year }),
      ]);
      setSummary(sumRes.data);
      setExpenses(expRes.data.results || expRes.data);
    } catch (e) { console.log(e); }
    finally { setLoading(false); }
  };

  if (loading) return <ActivityIndicator style={{ flex: 1 }} size="large" color="#6366F1" />;

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.greeting}>Hello, {user?.name}!</Text>
        <TouchableOpacity onPress={() => navigation.navigate("Profile")}>
          <View style={styles.avatarSmall}>
            <Text style={styles.avatarSmallText}>{user?.name?.charAt(0).toUpperCase()}</Text>
          </View>
        </TouchableOpacity>
      </View>
      <View style={styles.summaryRow}>
        <View style={[styles.card, { backgroundColor: "#6366F1" }]}>
          <Text style={styles.cardLabel}>Total Expense</Text>
          <Text style={styles.cardAmount}>Tk {summary?.total_expense?.toFixed(0) || 0}</Text>
        </View>
        <View style={[styles.card, { backgroundColor: "#10B981" }]}>
          <Text style={styles.cardLabel}>Total Income</Text>
          <Text style={styles.cardAmount}>Tk {summary?.total_income?.toFixed(0) || 0}</Text>
        </View>
      </View>
      <View style={[styles.balanceCard, { backgroundColor: summary?.balance >= 0 ? "#6366F1" : "#EF4444" }]}>
        <Text style={styles.balanceLabel}>This Month Balance</Text>
        <Text style={styles.balanceAmount}>Tk {summary?.balance?.toFixed(0) || 0}</Text>
      </View>
      <View style={styles.btnRow}>
        <TouchableOpacity style={styles.addBtn} onPress={() => navigation.navigate("AddExpense")}>
          <Text style={styles.addBtnText}>+ Add New</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.aiBtn} onPress={() => navigation.navigate("AI")}>
          <Text style={styles.aiBtnText}>AI Entry</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.btnRow}>
        <TouchableOpacity style={styles.budgetBtn} onPress={() => navigation.navigate("Budget")}>
          <Text style={styles.budgetBtnText}>Budget</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.analyticsBtn} onPress={() => navigation.navigate("Analytics")}>
          <Text style={styles.analyticsBtnText}>Analytics</Text>
        </TouchableOpacity>
      </View>
      <Text style={styles.recentTitle}>Recent Transactions</Text>
      {expenses.slice(0, 10).map((item) => (
        <View key={item.id} style={styles.expenseItem}>
          <View>
            <Text style={styles.expenseNote}>{item.note || "No note"}</Text>
            <Text style={styles.expenseDate}>{item.date}</Text>
          </View>
          <Text style={[styles.expenseAmount, { color: item.type === "income" ? "#10B981" : "#EF4444" }]}>
            {item.type === "income" ? "+" : "-"}Tk {item.amount}
          </Text>
        </View>
      ))}
      {expenses.length === 0 && <Text style={styles.empty}>No transactions yet</Text>}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container:        { flex: 1, backgroundColor: "#f8f9fa" },
  header:           { flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 20, paddingTop: 50 },
  greeting:         { fontSize: 20, fontWeight: "bold", color: "#1f2937" },
  avatarSmall:      { width: 40, height: 40, borderRadius: 20, backgroundColor: "#6366F1", justifyContent: "center", alignItems: "center" },
  avatarSmallText:  { fontSize: 18, fontWeight: "bold", color: "#fff" },
  summaryRow:       { flexDirection: "row", padding: 16, gap: 12 },
  card:             { flex: 1, borderRadius: 16, padding: 16 },
  cardLabel:        { color: "#fff", fontSize: 12, marginBottom: 8 },
  cardAmount:       { color: "#fff", fontSize: 22, fontWeight: "bold" },
  balanceCard:      { marginHorizontal: 16, borderRadius: 16, padding: 20, marginBottom: 16 },
  balanceLabel:     { color: "#fff", fontSize: 14, marginBottom: 8 },
  balanceAmount:    { color: "#fff", fontSize: 32, fontWeight: "bold" },
  btnRow:           { flexDirection: "row", paddingHorizontal: 16, gap: 12, marginBottom: 12 },
  addBtn:           { flex: 1, backgroundColor: "#6366F1", borderRadius: 12, padding: 14, alignItems: "center" },
  addBtnText:       { color: "#fff", fontWeight: "bold", fontSize: 15 },
  aiBtn:            { flex: 1, backgroundColor: "#10B981", borderRadius: 12, padding: 14, alignItems: "center" },
  aiBtnText:        { color: "#fff", fontWeight: "bold", fontSize: 15 },
  budgetBtn:        { flex: 1, backgroundColor: "#F59E0B", borderRadius: 12, padding: 14, alignItems: "center" },
  budgetBtnText:    { color: "#fff", fontWeight: "bold", fontSize: 15 },
  analyticsBtn:     { flex: 1, backgroundColor: "#8B5CF6", borderRadius: 12, padding: 14, alignItems: "center" },
  analyticsBtnText: { color: "#fff", fontWeight: "bold", fontSize: 15 },
  recentTitle:      { fontSize: 18, fontWeight: "bold", color: "#1f2937", paddingHorizontal: 16, marginBottom: 12 },
  expenseItem:      { flexDirection: "row", justifyContent: "space-between", alignItems: "center", backgroundColor: "#fff", marginHorizontal: 16, marginBottom: 8, padding: 16, borderRadius: 12 },
  expenseNote:      { fontSize: 15, color: "#1f2937", fontWeight: "500" },
  expenseDate:      { fontSize: 12, color: "#6b7280", marginTop: 4 },
  expenseAmount:    { fontSize: 16, fontWeight: "bold" },
  empty:            { textAlign: "center", color: "#6b7280", marginTop: 40, fontSize: 16 },
});
