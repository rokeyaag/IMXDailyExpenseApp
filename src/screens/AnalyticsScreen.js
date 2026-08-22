import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, Dimensions, TouchableOpacity, Platform, SafeAreaView } from "react-native";
import { BarChart, PieChart } from "react-native-chart-kit";
import { analyticsAPI, expenseAPI } from "../services/api";
import { useLanguage } from "../context/LanguageContext";
import Toast from "../components/Toast";

const screenWidth = Dimensions.get("window").width;

const chartConfig = {
  backgroundColor: "#FFFFFF",
  backgroundGradientFrom: "#FFFFFF",
  backgroundGradientTo: "#FFFFFF",
  decimalPlaces: 0,
  color: (opacity = 1) => `rgba(79, 70, 229, ${opacity})`,
  labelColor: (opacity = 1) => `rgba(100, 116, 139, ${opacity})`,
  style: { borderRadius: 20 },
  propsForDots: {
    r: "5",
    strokeWidth: "2",
    stroke: "#4F46E5",
  },
};

export default function AnalyticsScreen({ navigation }) {
  const { t } = useLanguage();
  const [trend, setTrend] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState({ visible: false, message: "", type: "success" });

  const today = new Date();
  const month = today.getMonth() + 1;
  const year = today.getFullYear();

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      const [trendRes, catRes] = await Promise.allSettled([
        analyticsAPI.monthlyTrend(),
        expenseAPI.byCategory({ month, year }),
      ]);
      if (trendRes.status === "fulfilled" && trendRes.value?.data) {
        setTrend(trendRes.value.data || []);
      }
      if (catRes.status === "fulfilled" && catRes.value?.data) {
        setCategories(catRes.value.data || []);
      }
    } catch (e) {
      setTrend([]);
      setCategories([]);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#4F46E5" />
      </View>
    );
  }

  const barData = {
    labels: trend.map(tr => tr.label || tr.month || "M"),
    datasets: [{ data: trend.map(tr => parseFloat(tr.expense || 0)) }],
  };

  const colors = ["#4F46E5", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6", "#06B6D4", "#EC4899", "#14B8A6"];
  const pieData = categories.slice(0, 6).map((cat, i) => ({
    name: cat.category__name || cat.name || "Other",
    amount: parseFloat(cat.total) || 0,
    color: cat.category__color || cat.color || colors[i % colors.length],
    legendFontColor: "#334155",
    legendFontSize: 11,
  }));

  return (
    <SafeAreaView style={styles.screen}>
      <Toast visible={toast.visible} message={toast.message} type={toast.type} onHide={() => setToast({ ...toast, visible: false })} />

      {/* Top Header */}
      <View style={styles.topNav}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn} activeOpacity={0.7}>
          <Text style={styles.backArrow}>←</Text>
        </TouchableOpacity>
        <Text style={styles.navTitle}>{t("analytics") || "Financial Analytics"}</Text>
        <TouchableOpacity onPress={fetchData} style={styles.refreshIconBtn} activeOpacity={0.7}>
          <Text style={styles.refreshIcon}>🔄</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>

        {/* Bar Chart Card */}
        <View style={styles.chartCard}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>📊 {t("monthlyTrend")} (Last 6 Months)</Text>
          </View>
          {trend.length > 0 ? (
            <BarChart
              data={barData}
              width={screenWidth - 64}
              height={190}
              chartConfig={chartConfig}
              style={styles.chart}
              fromZero
              showValuesOnTopOfBars={false}
            />
          ) : (
            <Text style={styles.empty}>{t("noResults")}</Text>
          )}
        </View>

        {/* Pie Chart Card */}
        <View style={styles.chartCard}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>🥧 {t("thisMonth")} - {t("topCategories")}</Text>
          </View>
          {pieData.length > 0 ? (
            <PieChart
              data={pieData}
              width={screenWidth - 64}
              height={180}
              chartConfig={chartConfig}
              accessor="amount"
              backgroundColor="transparent"
              paddingLeft="10"
            />
          ) : (
            <Text style={styles.empty}>{t("noResults")}</Text>
          )}
        </View>

        {/* Category Breakdown Breakdown List */}
        <View style={styles.chartCard}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>🏷️ Spending Breakdown</Text>
          </View>
          {categories.map((cat, i) => {
            const catCol = cat.category__color || cat.color || colors[i % colors.length];
            return (
              <View key={i} style={[styles.catRow, i < categories.length - 1 && styles.catBorder]}>
                <View style={[styles.catDot, { backgroundColor: catCol }]} />
                <Text style={styles.catName}>{cat.category__name || cat.name || "Other"}</Text>
                <Text style={styles.catAmount}>৳{parseFloat(cat.total).toLocaleString()}</Text>
              </View>
            );
          })}
          {categories.length === 0 && <Text style={styles.empty}>{t("noResults")}</Text>}
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#F8FAFC" },
  container: { flex: 1, paddingHorizontal: 16 },
  center: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#F8FAFC" },

  topNav: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: Platform.OS === "ios" ? 10 : 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
    backgroundColor: "#FFFFFF",
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#F1F5F9",
    justifyContent: "center",
    alignItems: "center",
  },
  backArrow: { fontSize: 18, color: "#0F172A", fontWeight: "bold" },
  navTitle: { fontSize: 17, fontWeight: "700", color: "#0F172A" },
  refreshIconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#F1F5F9",
    justifyContent: "center",
    alignItems: "center",
  },
  refreshIcon: { fontSize: 16 },

  chartCard: {
    backgroundColor: "#FFFFFF",
    marginTop: 14,
    borderRadius: 22,
    padding: 18,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  cardHeader: { marginBottom: 12 },
  cardTitle: { fontSize: 15, fontWeight: "700", color: "#0F172A" },
  chart: { borderRadius: 16, alignSelf: "center" },
  empty: { textAlign: "center", color: "#94A3B8", paddingVertical: 20, fontSize: 13 },

  catRow: { flexDirection: "row", alignItems: "center", paddingVertical: 10 },
  catBorder: { borderBottomWidth: 1, borderBottomColor: "#F1F5F9" },
  catDot: { width: 10, height: 10, borderRadius: 5, marginRight: 12 },
  catName: { flex: 1, fontSize: 13, color: "#334155", fontWeight: "600" },
  catAmount: { fontSize: 14, fontWeight: "700", color: "#0F172A" },
});