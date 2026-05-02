import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl } from "react-native";
import { useAuth } from "../context/AuthContext";
import { expenseAPI } from "../services/api";

export default function DashboardScreen({ navigation }) {
  const { user } = useAuth();
  const [summary, setSummary] = useState(null);
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
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
    finally { setLoading(false); setRefreshing(false); }
  };

  const onRefresh = () => { setRefreshing(true); fetchData(); };

  if (loading) return <ActivityIndicator style={{ flex: 1 }} size="large" color="#6366F1" />;

  const buttons = [
    { label: "+ Add New", color: "#6366F1", screen: "AddExpense" },
    { label: "AI Entry", color: "#10B981", screen: "AI" },
    { label: "Budget", color: "#F59E0B", screen: "Budget" },
    { label: "Analytics", color: "#8B5CF6", screen: "Analytics" },
  ];

  return (
    <View style={styles.wrapper}>
      <ScrollView
        style={styles.container}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Hello, {user?.name}!</Text>
            <Text style={styles.subGreeting}>Welcome back</Text>
          </View>
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

        <View style={styles.btnGrid}>
          {buttons.map((btn) => (
            <TouchableOpacity
              key={btn.screen}
              style={[styles.gridBtn, { backgroundColor: btn.color }]}
              onPress={() => navigation.navigate(btn.screen)}
              activeOpacity={0.8}>
              <Text style={styles.gridBtnText}>{btn.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.recentHeader}>
          <Text style={styles.recentTitle}>Recent Transactions</Text>
          <TouchableOpacity onPress={() => navigation.navigate("ExpenseList")}>
            <Text style={styles.seeAll}>See All</Text>
          </TouchableOpacity>
        </View>

        {expenses.slice(0, 10).map((item) => (
          <View key={item.id} style={styles.expenseItem}>
            <View style={[styles.typeDot, { backgroundColor: item.type === "income" ? "#10B981" : "#EF4444" }]} />
            <View style={{ flex: 1 }}>
              <Text style={styles.expenseNote}>{item.note || "No note"}</Text>
              <Text style={styles.expenseDate}>{item.date}</Text>
            </View>
            <Text style={[styles.expenseAmount, { color: item.type === "income" ? "#10B981" : "#EF4444" }]}>
              {item.type === "income" ? "+" : "-"}Tk {parseFloat(item.amount).toFixed(0)}
            </Text>
          </View>
        ))}
        {expenses.length === 0 && <Text style={styles.empty}>No transactions yet</Text>}
        <View style={{ height: 30 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper:          { flex: 1, backgroundColor: "#f8f9fa" },
  container:        { flex: 1 },
  header:           { flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 20, paddingTop: 50 },
  greeting:         { fontSize: 22, fontWeight: "bold", color: "#1f2937" },
  subGreeting:      { fontSize: 13, color: "#6b7280", marginTop: 2 },
  avatarSmall:      { width: 44, height: 44, borderRadius: 22, backgroundColor: "#6366F1", justifyContent: "center", alignItems: "center" },
  avatarSmallText:  { fontSize: 20, fontWeight: "bold", color: "#fff" },
  summaryRow:       { flexDirection: "row", paddingHorizontal: 16, gap: 12, marginBottom: 12 },
  card:             { flex: 1, borderRadius: 16, padding: 16 },
  cardLabel:        { color: "#fff", fontSize: 12, marginBottom: 8, opacity: 0.9 },
  cardAmount:       { color: "#fff", fontSize: 22, fontWeight: "bold" },
  balanceCard:      { marginHorizontal: 16, borderRadius: 16, padding: 20, marginBottom: 16 },
  balanceLabel:     { color: "#fff", fontSize: 14, marginBottom: 8, opacity: 0.9 },
  balanceAmount:    { color: "#fff", fontSize: 32, fontWeight: "bold" },
  btnGrid:          { flexDirection: "row", flexWrap: "wrap", paddingHorizontal: 16, gap: 10, marginBottom: 20 },
  gridBtn:          { flex: 1, minWidth: "45%", borderRadius: 14, padding: 16, alignItems: "center", elevation: 3, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.15, shadowRadius: 4 },
  gridBtnText:      { color: "#fff", fontWeight: "bold", fontSize: 15 },
  recentHeader:     { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 16, marginBottom: 12 },
  recentTitle:      { fontSize: 18, fontWeight: "bold", color: "#1f2937" },
  seeAll:           { color: "#6366F1", fontWeight: "bold" },
  expenseItem:      { flexDirection: "row", alignItems: "center", backgroundColor: "#fff", marginHorizontal: 16, marginBottom: 8, padding: 16, borderRadius: 12 },
  typeDot:          { width: 10, height: 10, borderRadius: 5, marginRight: 12 },
  expenseNote:      { fontSize: 15, color: "#1f2937", fontWeight: "500" },
  expenseDate:      { fontSize: 12, color: "#6b7280", marginTop: 4 },
  expenseAmount:    { fontSize: 15, fontWeight: "bold" },
  empty:            { textAlign: "center", color: "#6b7280", marginTop: 40, fontSize: 16 },
});
