import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, Dimensions } from "react-native";
import { BarChart, PieChart } from "react-native-chart-kit";
import { analyticsAPI, expenseAPI } from "../services/api";
import { useLanguage } from "../context/LanguageContext";

const screenWidth = Dimensions.get("window").width;

const chartConfig = {
  backgroundColor: "#fff",
  backgroundGradientFrom: "#fff",
  backgroundGradientTo: "#fff",
  decimalPlaces: 0,
  color: (opacity = 1) => "rgba(99, 102, 241, " + opacity + ")",
  labelColor: (opacity = 1) => "rgba(31, 41, 55, " + opacity + ")",
  style: { borderRadius: 16 },
};

export default function AnalyticsScreen() {
  const { t } = useLanguage();
  const [trend, setTrend] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  const today = new Date();
  const month = today.getMonth() + 1;
  const year = today.getFullYear();

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      const [trendRes, catRes] = await Promise.all([
        analyticsAPI.monthlyTrend(),
        expenseAPI.byCategory({ month, year }),
      ]);
      setTrend(trendRes.data);
      setCategories(catRes.data);
    } catch (e) { console.log(e); }
    finally { setLoading(false); }
  };

  if (loading) return <ActivityIndicator style={{ flex: 1 }} size="large" color="#6366F1" />;

  const barData = {
    labels: trend.map(tr => tr.label),
    datasets: [{ data: trend.map(tr => tr.expense || 0) }],
  };

  const colors = ["#6366F1", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6", "#06B6D4"];
  const pieData = categories.slice(0, 6).map((cat, i) => ({
    name: cat.category__name || "Other",
    amount: parseFloat(cat.total) || 0,
    color: cat.category__color || colors[i % colors.length],
    legendFontColor: "#1f2937",
    legendFontSize: 12,
  }));

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>{t("analytics")}</Text>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>{t("monthlyTrend")} ({t("last6Months")})</Text>
        {trend.length > 0 ? (
          <BarChart data={barData} width={screenWidth - 48} height={200} chartConfig={chartConfig} style={styles.chart} fromZero />
        ) : (<Text style={styles.empty}>{t("noResults")}</Text>)}
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>{t("thisMonth")} - {t("topCategories")}</Text>
        {pieData.length > 0 ? (
          <PieChart data={pieData} width={screenWidth - 48} height={200} chartConfig={chartConfig} accessor="amount" backgroundColor="transparent" paddingLeft="15" />
        ) : (<Text style={styles.empty}>{t("noResults")}</Text>)}
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>{t("topCategories")}</Text>
        {categories.map((cat, i) => (
          <View key={i} style={styles.catRow}>
            <View style={[styles.catDot, { backgroundColor: cat.category__color || colors[i % colors.length] }]} />
            <Text style={styles.catName}>{cat.category__name || "Other"}</Text>
            <Text style={styles.catAmount}>Tk {parseFloat(cat.total).toFixed(0)}</Text>
          </View>
        ))}
        {categories.length === 0 && <Text style={styles.empty}>{t("noResults")}</Text>}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container:  { flex: 1, backgroundColor: "#f8f9fa" },
  title:      { fontSize: 24, fontWeight: "bold", color: "#1f2937", padding: 20, paddingTop: 50 },
  card:       { backgroundColor: "#fff", margin: 16, marginBottom: 8, borderRadius: 16, padding: 20 },
  cardTitle:  { fontSize: 16, fontWeight: "bold", color: "#1f2937", marginBottom: 16 },
  chart:      { borderRadius: 16 },
  empty:      { textAlign: "center", color: "#6b7280", paddingVertical: 20 },
  catRow:     { flexDirection: "row", alignItems: "center", paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: "#f3f4f6" },
  catDot:     { width: 12, height: 12, borderRadius: 6, marginRight: 12 },
  catName:    { flex: 1, fontSize: 14, color: "#1f2937" },
  catAmount:  { fontSize: 14, fontWeight: "bold", color: "#6366F1" },
});