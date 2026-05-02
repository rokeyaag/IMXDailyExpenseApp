import React, { useState, useEffect, useRef } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl, Dimensions, Animated } from "react-native";
import { PieChart } from "react-native-chart-kit";
import { useAuth } from "../context/AuthContext";
import { expenseAPI } from "../services/api";

const screenWidth = Dimensions.get("window").width;

function AnimatedGridBtn({ btn, onPress }) {
  const scale = useRef(new Animated.Value(1)).current;
  const onIn = () => Animated.spring(scale, { toValue: 0.88, useNativeDriver: true }).start();
  const onOut = () => Animated.spring(scale, { toValue: 1, useNativeDriver: true }).start();
  return (
    <TouchableOpacity onPress={onPress} onPressIn={onIn} onPressOut={onOut} activeOpacity={1} style={styles.gridItem}>
      <Animated.View style={[styles.gridIcon, { backgroundColor: btn.color, transform: [{ scale }] }]}>
        <Text style={styles.gridIconText}>{btn.icon}</Text>
      </Animated.View>
      <Text style={styles.gridLabel}>{btn.label}</Text>
    </TouchableOpacity>
  );
}

export default function DashboardScreen({ navigation }) {
  const { user } = useAuth();
  const [summary, setSummary] = useState(null);
  const [recent, setRecent] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const today = new Date();
  const month = today.getMonth() + 1;
  const year = today.getFullYear();
  const monthName = today.toLocaleString("en", { month: "long" });

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      const [sumRes, expRes] = await Promise.all([
        expenseAPI.summary({ month, year }),
        expenseAPI.list({ page_size: 5 }),
      ]);
      setSummary(sumRes.data);
      setRecent(expRes.data.results || expRes.data);
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
    { label: "Income", icon: "+", color: "#10B981", screen: "AddExpense", params: { defaultType: "income" } },
    { label: "Expense", icon: "-", color: "#EF4444", screen: "AddExpense", params: { defaultType: "expense" } },
    { label: "AI Entry", icon: "AI", color: "#6366F1", screen: "AI" },
    { label: "History", icon: "=", color: "#06B6D4", screen: "ExpenseList" },
    { label: "Budget", icon: "?", color: "#F59E0B", screen: "Budget" },
    { label: "Analytics", icon: "?", color: "#8B5CF6", screen: "Analytics" },
    { label: "Category", icon: "?", color: "#EC4899", screen: "Categories" },
    { label: "Profile", icon: user?.name?.charAt(0).toUpperCase() || "P", color: "#84CC16", screen: "Profile" },
  ];

  const getTypeColor = (type) => type === "income" ? "#10B981" : "#EF4444";
  const getTypeSign = (type) => type === "income" ? "+" : "-";

  return (
    <ScrollView
      style={styles.container}
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={["#6366F1"]} />}>

      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Hello, {user?.name}! ??</Text>
          <Text style={styles.subGreeting}>{monthName} {year}</Text>
        </View>
        <TouchableOpacity onPress={() => navigation.navigate("Profile")}>
          <View style={styles.avatarSmall}>
            <Text style={styles.avatarSmallText}>{user?.name?.charAt(0).toUpperCase()}</Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* Balance Card */}
      <View style={styles.balanceCard}>
        <Text style={styles.balanceLabel}>Current Balance</Text>
        <Text style={[styles.balanceAmount, { color: balance >= 0 ? "#fff" : "#fca5a5" }]}>
          Tk {balance.toFixed(0)}
        </Text>
        <View style={styles.balanceRow}>
          <View style={styles.balanceItem}>
            <Text style={styles.balanceItemLabel}>? Income</Text>
            <Text style={styles.balanceItemValue}>Tk {income.toFixed(0)}</Text>
          </View>
          <View style={styles.balanceDivider} />
          <View style={styles.balanceItem}>
            <Text style={styles.balanceItemLabel}>? Expense</Text>
            <Text style={styles.balanceItemValue}>Tk {expense.toFixed(0)}</Text>
          </View>
        </View>
      </View>

      {/* Chart */}
      <View style={styles.chartCard}>
        <Text style={styles.chartTitle}>This Month Overview</Text>
        <PieChart
          data={pieData}
          width={screenWidth - 48}
          height={160}
          chartConfig={{ color: (opacity = 1) => `rgba(0,0,0,${opacity})` }}
          accessor="amount"
          backgroundColor="transparent"
          paddingLeft="20"
          hasLegend={true}
          absolute={false}
        />
      </View>

      {/* Quick Action Buttons */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
      </View>
      <View style={styles.btnGrid}>
        {buttons.map((btn) => (
          <AnimatedGridBtn
            key={btn.label}
            btn={btn}
            onPress={() => navigation.navigate(btn.screen, btn.params)}
          />
        ))}
      </View>

      {/* Recent Transactions */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Recent Transactions</Text>
        <TouchableOpacity onPress={() => navigation.navigate("ExpenseList")}>
          <Text style={styles.seeAll}>See all</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.recentCard}>
        {recent.length === 0 ? (
          <View style={styles.emptyBox}>
            <Text style={styles.emptyText}>No transactions yet</Text>
            <Text style={styles.emptySubText}>Add your first expense!</Text>
          </View>
        ) : (
          recent.map((item, index) => (
            <TouchableOpacity
              key={item.id}
              style={[styles.txRow, index < recent.length - 1 && styles.txBorder]}
              onPress={() => navigation.navigate("EditExpense", { expense: item })}
              activeOpacity={0.7}>
              <View style={[styles.txIcon, { backgroundColor: item.category?.color || "#6366F1" }]}>
                <Text style={styles.txIconText}>
                  {item.category?.icon || item.category?.name?.charAt(0) || "?"}
                </Text>
              </View>
              <View style={styles.txInfo}>
                <Text style={styles.txNote} numberOfLines={1}>{item.note || item.category?.name || "Expense"}</Text>
                <Text style={styles.txDate}>{new Date(item.date).toLocaleDateString("en", { day: "numeric", month: "short" })}</Text>
              </View>
              <Text style={[styles.txAmount, { color: getTypeColor(item.type) }]}>
                {getTypeSign(item.type)} Tk {parseFloat(item.amount).toFixed(0)}
              </Text>
            </TouchableOpacity>
          ))
        )}
      </View>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container:          { flex: 1, backgroundColor: "#f0f0ff" },
  header:             { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 20, paddingTop: 52, paddingBottom: 12 },
  greeting:           { fontSize: 20, fontWeight: "bold", color: "#1f2937" },
  subGreeting:        { fontSize: 13, color: "#6b7280", marginTop: 2 },
  avatarSmall:        { width: 44, height: 44, borderRadius: 22, backgroundColor: "#6366F1", justifyContent: "center", alignItems: "center", elevation: 3 },
  avatarSmallText:    { fontSize: 20, fontWeight: "bold", color: "#fff" },
  balanceCard:        { backgroundColor: "#6366F1", marginHorizontal: 16, borderRadius: 20, padding: 20, marginBottom: 12, elevation: 4, shadowColor: "#6366F1", shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.35, shadowRadius: 10 },
  balanceLabel:       { color: "rgba(255,255,255,0.8)", fontSize: 13, marginBottom: 4 },
  balanceAmount:      { fontSize: 36, fontWeight: "bold", color: "#fff", marginBottom: 16 },
  balanceRow:         { flexDirection: "row", backgroundColor: "rgba(255,255,255,0.15)", borderRadius: 12, padding: 12 },
  balanceItem:        { flex: 1, alignItems: "center" },
  balanceItemLabel:   { color: "rgba(255,255,255,0.8)", fontSize: 12, marginBottom: 4 },
  balanceItemValue:   { color: "#fff", fontSize: 15, fontWeight: "bold" },
  balanceDivider:     { width: 1, backgroundColor: "rgba(255,255,255,0.3)" },
  chartCard:          { backgroundColor: "#fff", marginHorizontal: 16, borderRadius: 20, padding: 16, marginBottom: 12, elevation: 2 },
  chartTitle:         { fontSize: 15, fontWeight: "bold", color: "#1f2937", marginBottom: 8 },
  sectionHeader:      { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 20, marginBottom: 8, marginTop: 4 },
  sectionTitle:       { fontSize: 16, fontWeight: "bold", color: "#1f2937" },
  seeAll:             { fontSize: 13, color: "#6366F1", fontWeight: "600" },
  btnGrid:            { flexDirection: "row", flexWrap: "wrap", paddingHorizontal: 12, gap: 8, justifyContent: "center", marginBottom: 8 },
  gridItem:           { alignItems: "center", width: (screenWidth - 80) / 4, paddingVertical: 4 },
  gridIcon:           { width: 58, height: 58, borderRadius: 29, justifyContent: "center", alignItems: "center", marginBottom: 6, elevation: 4, shadowColor: "#000", shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.2, shadowRadius: 4 },
  gridIconText:       { fontSize: 22, fontWeight: "bold", color: "#fff" },
  gridLabel:          { fontSize: 11, color: "#374151", textAlign: "center", fontWeight: "500" },
  recentCard:         { backgroundColor: "#fff", marginHorizontal: 16, borderRadius: 20, overflow: "hidden", elevation: 2 },
  emptyBox:           { padding: 32, alignItems: "center" },
  emptyText:          { fontSize: 15, color: "#6b7280", fontWeight: "500" },
  emptySubText:       { fontSize: 13, color: "#9ca3af", marginTop: 4 },
  txRow:              { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 14 },
  txBorder:           { borderBottomWidth: 1, borderBottomColor: "#f3f4f6" },
  txIcon:             { width: 42, height: 42, borderRadius: 21, justifyContent: "center", alignItems: "center", marginRight: 12 },
  txIconText:         { fontSize: 18 },
  txInfo:             { flex: 1 },
  txNote:             { fontSize: 14, color: "#1f2937", fontWeight: "500" },
  txDate:             { fontSize: 12, color: "#9ca3af", marginTop: 2 },
  txAmount:           { fontSize: 15, fontWeight: "bold" },
});
