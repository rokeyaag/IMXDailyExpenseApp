import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl, Dimensions } from "react-native";
import { PieChart } from "react-native-chart-kit";
import { useAuth } from "../context/AuthContext";
import { expenseAPI } from "../services/api";

const screenWidth = Dimensions.get("window").width;

export default function DashboardScreen({ navigation }) {
  const { user } = useAuth();
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const today = new Date();
  const month = today.getMonth() + 1;
  const year = today.getFullYear();
  const monthName = today.toLocaleString("en", { month: "long" });

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      const sumRes = await expenseAPI.summary({ month, year });
      setSummary(sumRes.data);
    } catch (e) { console.log(e); }
    finally { setLoading(false); setRefreshing(false); }
  };

  const onRefresh = () => { setRefreshing(true); fetchData(); };

  if (loading) return <ActivityIndicator style={{ flex: 1 }} size="large" color="#6366F1" />;

  const income = parseFloat(summary?.total_income || 0);
  const expense = parseFloat(summary?.total_expense || 0);
  const balance = parseFloat(summary?.balance || 0);

  const pieData = income === 0 && expense === 0 ? [
    { name: "No data", amount: 1, color: "#e5e7eb", legendFontColor: "#9ca3af", legendFontSize: 12 }
  ] : [
    { name: "Income", amount: income, color: "#10B981", legendFontColor: "#1f2937", legendFontSize: 12 },
    { name: "Expense", amount: expense, color: "#EF4444", legendFontColor: "#1f2937", legendFontSize: 12 },
    ...(Math.abs(balance) > 0 ? [{ name: "Balance", amount: Math.abs(balance), color: "#F59E0B", legendFontColor: "#1f2937", legendFontSize: 12 }] : []),
  ];

  const buttons = [
    { label: "Add Income", icon: "+", color: "#10B981", screen: "AddExpense", params: { defaultType: "income" } },
    { label: "Add Expense", icon: "-", color: "#EF4444", screen: "AddExpense", params: { defaultType: "expense" } },
    { label: "AI Entry", icon: "AI", color: "#6366F1", screen: "AI" },
    { label: "Transactions", icon: "=", color: "#06B6D4", screen: "ExpenseList" },
    { label: "Budget", icon: "B", color: "#F59E0B", screen: "Budget" },
    { label: "Analytics", icon: "A", color: "#8B5CF6", screen: "Analytics" },
    { label: "Categories", icon: "C", color: "#EC4899", screen: "Categories" },
    { label: "Profile", icon: user?.name?.charAt(0).toUpperCase() || "P", color: "#84CC16", screen: "Profile" },
  ];

  return (
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

      <View style={styles.chartCard}>
        <Text style={styles.chartTitle}>{monthName} {year}</Text>
        <PieChart
          data={pieData}
          width={screenWidth - 48}
          height={180}
          chartConfig={{ color: (opacity = 1) => `rgba(0,0,0,${opacity})` }}
          accessor="amount"
          backgroundColor="transparent"
          paddingLeft="20"
          hasLegend={true}
          absolute={false}
        />
        <View style={styles.summaryRow}>
          <View style={styles.summaryItem}>
            <View style={[styles.dot, { backgroundColor: "#10B981" }]} />
            <Text style={styles.summaryLabel}>Income</Text>
            <Text style={[styles.summaryValue, { color: "#10B981" }]}>Tk {income.toFixed(0)}</Text>
          </View>
          <View style={styles.summaryItem}>
            <View style={[styles.dot, { backgroundColor: "#EF4444" }]} />
            <Text style={styles.summaryLabel}>Expense</Text>
            <Text style={[styles.summaryValue, { color: "#EF4444" }]}>Tk {expense.toFixed(0)}</Text>
          </View>
          <View style={styles.summaryItem}>
            <View style={[styles.dot, { backgroundColor: "#F59E0B" }]} />
            <Text style={styles.summaryLabel}>Balance</Text>
            <Text style={[styles.summaryValue, { color: balance >= 0 ? "#F59E0B" : "#EF4444" }]}>Tk {balance.toFixed(0)}</Text>
          </View>
        </View>
      </View>

      <View style={styles.btnGrid}>
        {buttons.map((btn) => (
          <TouchableOpacity
            key={btn.label}
            style={styles.gridItem}
            onPress={() => navigation.navigate(btn.screen, btn.params)}
            activeOpacity={0.8}>
            <View style={[styles.gridIcon, { backgroundColor: btn.color }]}>
              <Text style={styles.gridIconText}>{btn.icon}</Text>
            </View>
            <Text style={styles.gridLabel}>{btn.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={{ height: 30 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container:       { flex: 1, backgroundColor: "#f8f9fa" },
  header:          { flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 20, paddingTop: 50 },
  greeting:        { fontSize: 22, fontWeight: "bold", color: "#1f2937" },
  subGreeting:     { fontSize: 13, color: "#6b7280", marginTop: 2 },
  avatarSmall:     { width: 44, height: 44, borderRadius: 22, backgroundColor: "#6366F1", justifyContent: "center", alignItems: "center" },
  avatarSmallText: { fontSize: 20, fontWeight: "bold", color: "#fff" },
  chartCard:       { backgroundColor: "#fff", marginHorizontal: 16, borderRadius: 20, padding: 16, elevation: 2 },
  chartTitle:      { fontSize: 16, fontWeight: "bold", color: "#1f2937", textAlign: "center", marginBottom: 8 },
  summaryRow:      { flexDirection: "row", justifyContent: "space-around", marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: "#f3f4f6" },
  summaryItem:     { alignItems: "center" },
  dot:             { width: 8, height: 8, borderRadius: 4, marginBottom: 4 },
  summaryLabel:    { fontSize: 11, color: "#6b7280", marginBottom: 2 },
  summaryValue:    { fontSize: 13, fontWeight: "bold" },
  btnGrid:         { flexDirection: "row", flexWrap: "wrap", padding: 16, gap: 16, justifyContent: "center", marginTop: 8 },
  gridItem:        { alignItems: "center", width: (screenWidth - 96) / 4 },
  gridIcon:        { width: 60, height: 60, borderRadius: 30, justifyContent: "center", alignItems: "center", marginBottom: 6, elevation: 3 },
  gridIconText:    { fontSize: 20, fontWeight: "bold", color: "#fff" },
  gridLabel:       { fontSize: 11, color: "#374151", textAlign: "center", fontWeight: "500" },
});
