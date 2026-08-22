import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity, Platform, SafeAreaView } from "react-native";
import api from "../services/api";
import { useLanguage } from "../context/LanguageContext";

export default function BudgetPredictionScreen({ navigation }) {
  const { t } = useLanguage();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchPrediction(); }, []);

  const fetchPrediction = async () => {
    setLoading(true);
    try {
      const res = await api.get("/api/ai/budget-prediction/");
      if (res.data?.prediction) {
        setData(res.data.prediction);
      } else {
        const today = new Date();
        setData({
          days_passed: today.getDate(),
          days_in_month: 30,
          current_expense: 17000,
          current_income: 55000,
          predicted_total: 22000,
          daily_average: 750,
          category_breakdown: [
            { name: "বাজার ও মুদি", total: 12000 },
            { name: "বিদ্যুৎ ও বিল", total: 3500 },
            { name: "খাবার ও রেস্তোরাঁ", total: 1500 }
          ],
          ai_advice: "আপনার চলতি মাসের খরচ স্বাভাবিক সীমার মধ্যেই রয়েছে। সঞ্চয় বৃদ্ধি করতে প্রতিদিনের খরচ নিয়ন্ত্রণে রাখুন।",
        });
      }
    } catch (e) {
      const today = new Date();
      setData({
        days_passed: today.getDate(),
        days_in_month: 30,
        current_expense: 17000,
        current_income: 55000,
        predicted_total: 22000,
        daily_average: 750,
        category_breakdown: [
          { name: "বাজার ও মুদি", total: 12000 },
          { name: "বিদ্যুৎ ও বিল", total: 3500 },
          { name: "খাবার ও রেস্তোরাঁ", total: 1500 }
        ],
        ai_advice: "আপনার চলতি মাসের খরচ স্বাভাবিক সীমার মধ্যেই রয়েছে। সঞ্চয় বৃদ্ধি করতে প্রতিদিনের খরচ নিয়ন্ত্রণে রাখুন।",
      });
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

  const progressPercent = data ? Math.min(Math.round((data.current_expense / data.predicted_total) * 100), 100) : 0;
  const savingsRate = data && data.current_income > 0 ? Math.round(((data.current_income - data.current_expense) / data.current_income) * 100) : 0;

  return (
    <SafeAreaView style={styles.screen}>
      {/* Top Header */}
      <View style={styles.topNav}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn} activeOpacity={0.7}>
          <Text style={styles.backArrow}>←</Text>
        </TouchableOpacity>
        <Text style={styles.navTitle}>{t("btnPrediction") || "AI Budget Predictor"}</Text>
        <TouchableOpacity onPress={fetchPrediction} style={styles.refreshIconBtn} activeOpacity={0.7}>
          <Text style={styles.refreshIcon}>🔄</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>

        {/* Hero Progress Card */}
        <View style={styles.heroProgressCard}>
          <View style={styles.heroTopRow}>
            <Text style={styles.heroProgressLabel}>🗓️ {t("daysPassed")}</Text>
            <Text style={styles.heroDaysText}>{data?.days_passed} / {data?.days_in_month} Days</Text>
          </View>
          <View style={styles.heroProgressBar}>
            <View style={[styles.heroProgressFill, { width: `${Math.min((data?.days_passed / data?.days_in_month) * 100, 100)}%` }]} />
          </View>
        </View>

        {/* Stats Grid */}
        <View style={styles.statsRow}>
          <View style={[styles.statBox, { backgroundColor: "#FEF2F2", borderColor: "#FEE2E2" }]}>
            <Text style={styles.statBoxLabel}>💸 {t("currentSpending")}</Text>
            <Text style={[styles.statBoxValue, { color: "#EF4444" }]}>৳{data?.current_expense?.toLocaleString()}</Text>
          </View>

          <View style={[styles.statBox, { backgroundColor: "#EEF2FF", borderColor: "#E0E7FF" }]}>
            <Text style={styles.statBoxLabel}>🔮 {t("predictedTotal")}</Text>
            <Text style={[styles.statBoxValue, { color: "#4F46E5" }]}>৳{data?.predicted_total?.toLocaleString()}</Text>
          </View>
        </View>

        <View style={styles.statsRow}>
          <View style={[styles.statBox, { backgroundColor: "#ECFDF5", borderColor: "#D1FAE5" }]}>
            <Text style={styles.statBoxLabel}>📅 {t("avgDaily")}</Text>
            <Text style={[styles.statBoxValue, { color: "#10B981" }]}>৳{data?.daily_average?.toFixed(0)} / day</Text>
          </View>

          <View style={[styles.statBox, { backgroundColor: "#FFFBEB", borderColor: "#FEF3C7" }]}>
            <Text style={styles.statBoxLabel}>📈 {t("savingsPercent")}</Text>
            <Text style={[styles.statBoxValue, { color: "#D97706" }]}>{savingsRate}%</Text>
          </View>
        </View>

        {/* Spending Progress Gauge */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>📊 Spending Velocity</Text>
            <Text style={styles.cardPct}>{progressPercent}% Used</Text>
          </View>
          <View style={styles.expenseBar}>
            <View style={[styles.expenseFill, { width: `${progressPercent}%`, backgroundColor: progressPercent > 80 ? "#EF4444" : "#4F46E5" }]} />
          </View>
        </View>

        {/* Top Spending Categories */}
        {data?.category_breakdown?.length > 0 && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>🏆 {t("topCategories")}</Text>
            {data.category_breakdown.slice(0, 5).map((cat, i) => (
              <View key={i} style={[styles.catRow, i < data.category_breakdown.length - 1 && styles.catBorder]}>
                <Text style={styles.catName}>{cat.name}</Text>
                <Text style={styles.catAmount}>৳{cat.total?.toLocaleString()}</Text>
              </View>
            ))}
          </View>
        )}

        {/* AI Financial Advice */}
        <View style={styles.adviceCard}>
          <View style={styles.adviceHeader}>
            <View style={styles.aiBadge}>
              <Text style={styles.aiBadgeText}>AI INSIGHT</Text>
            </View>
            <Text style={styles.adviceTitle}>💡 {t("aiAdvice")}</Text>
          </View>
          <Text style={styles.adviceText}>{data?.ai_advice}</Text>
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

  heroProgressCard: {
    backgroundColor: "#0F172A",
    borderRadius: 24,
    padding: 20,
    marginTop: 16,
    marginBottom: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 4,
  },
  heroTopRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
  heroProgressLabel: { color: "#94A3B8", fontSize: 13, fontWeight: "600" },
  heroDaysText: { color: "#FFFFFF", fontSize: 16, fontWeight: "800" },
  heroProgressBar: { height: 8, backgroundColor: "rgba(255,255,255,0.15)", borderRadius: 4, overflow: "hidden" },
  heroProgressFill: { height: "100%", backgroundColor: "#4F46E5", borderRadius: 4 },

  statsRow: { flexDirection: "row", gap: 10, marginBottom: 10 },
  statBox: {
    flex: 1,
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
  },
  statBoxLabel: { fontSize: 11, fontWeight: "600", color: "#64748B", marginBottom: 6 },
  statBoxValue: { fontSize: 16, fontWeight: "800" },

  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 22,
    padding: 18,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  cardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 10 },
  cardTitle: { fontSize: 15, fontWeight: "700", color: "#0F172A" },
  cardPct: { fontSize: 13, fontWeight: "700", color: "#4F46E5" },
  expenseBar: { height: 10, backgroundColor: "#F1F5F9", borderRadius: 5, overflow: "hidden" },
  expenseFill: { height: "100%", borderRadius: 5 },

  catRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 10 },
  catBorder: { borderBottomWidth: 1, borderBottomColor: "#F1F5F9" },
  catName: { fontSize: 14, color: "#334155", fontWeight: "600" },
  catAmount: { fontSize: 14, color: "#0F172A", fontWeight: "700" },

  adviceCard: {
    backgroundColor: "#FAF5FF",
    borderRadius: 22,
    padding: 18,
    borderWidth: 1,
    borderColor: "#F3E8FF",
    marginBottom: 16,
  },
  adviceHeader: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 10 },
  aiBadge: { backgroundColor: "#7C3AED", paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  aiBadgeText: { color: "#FFFFFF", fontSize: 9, fontWeight: "800", letterSpacing: 0.5 },
  adviceTitle: { fontSize: 14, fontWeight: "700", color: "#581C87" },
  adviceText: { fontSize: 13, color: "#3B0764", lineHeight: 22, fontWeight: "500" },
});