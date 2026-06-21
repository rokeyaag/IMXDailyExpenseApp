import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity } from "react-native";
import api from "../services/api";
import { useLanguage } from "../context/LanguageContext";

export default function BudgetPredictionScreen() {
  const { t } = useLanguage();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => { fetchPrediction(); }, []);

  const fetchPrediction = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get("/api/ai/budget-prediction/");
      setData(res.data.prediction);
    } catch (e) {
      setError(t("somethingWrong"));
    } finally {
      setLoading(false);
    }
  };

  if (loading) return (
    <View style={styles.center}>
      <ActivityIndicator size="large" color="#6366F1" />
      <Text style={styles.loadingText}>{t("loading")}</Text>
    </View>
  );

  if (error) return (
    <View style={styles.center}>
      <Text style={styles.errorText}>{error}</Text>
      <TouchableOpacity style={styles.retryBtn} onPress={fetchPrediction}>
        <Text style={styles.retryBtnText}>{t("retry")}</Text>
      </TouchableOpacity>
    </View>
  );

  const progressPercent = data ? Math.min((data.current_expense / data.predicted_total) * 100, 100) : 0;
  const savingsRate = data && data.current_income > 0 ? ((data.current_income - data.current_expense) / data.current_income * 100) : 0;

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>

      <View style={styles.progressCard}>
        <Text style={styles.progressTitle}>{t("budgetPrediction")}</Text>
        <Text style={styles.progressDays}>{data?.days_passed}/{data?.days_in_month} {t("daysPassed")}</Text>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: ((data?.days_passed / data?.days_in_month) * 100) + "%" }]} />
        </View>
      </View>

      <View style={styles.statsRow}>
        <View style={[styles.statCard, { backgroundColor: "#EF4444" }]}>
          <Text style={styles.statLabel}>{t("currentSpending")}</Text>
          <Text style={styles.statValue}>Tk {data?.current_expense?.toFixed(0)}</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: "#6366F1" }]}>
          <Text style={styles.statLabel}>{t("predictedTotal")}</Text>
          <Text style={styles.statValue}>Tk {data?.predicted_total?.toFixed(0)}</Text>
        </View>
      </View>

      <View style={styles.statsRow}>
        <View style={[styles.statCard, { backgroundColor: "#10B981" }]}>
          <Text style={styles.statLabel}>{t("avgDaily")}</Text>
          <Text style={styles.statValue}>Tk {data?.daily_average?.toFixed(0)}</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: "#F59E0B" }]}>
          <Text style={styles.statLabel}>{t("savingsPercent")}</Text>
          <Text style={styles.statValue}>{savingsRate.toFixed(0)}%</Text>
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>{t("currentSpending")} vs {t("predictedTotal")}</Text>
        <View style={styles.expenseBar}>
          <View style={[styles.expenseFill, { width: progressPercent + "%", backgroundColor: progressPercent > 80 ? "#EF4444" : "#6366F1" }]} />
        </View>
        <Text style={styles.expensePercent}>{progressPercent.toFixed(0)}%</Text>
      </View>

      {data?.category_breakdown?.length > 0 && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>{t("topCategories")}</Text>
          {data.category_breakdown.slice(0, 5).map((cat, i) => (
            <View key={i} style={styles.catRow}>
              <Text style={styles.catName}>{cat.name}</Text>
              <Text style={styles.catAmount}>Tk {cat.total.toFixed(0)}</Text>
            </View>
          ))}
        </View>
      )}

      <View style={styles.adviceCard}>
        <View style={styles.adviceHeader}>
          <Text style={styles.adviceIcon}>AI</Text>
          <Text style={styles.adviceTitle}>{t("aiAdvice")}</Text>
        </View>
        <Text style={styles.adviceText}>{data?.ai_advice}</Text>
      </View>

      <TouchableOpacity style={styles.refreshBtn} onPress={fetchPrediction}>
        <Text style={styles.refreshBtnText}>{t("refresh")}</Text>
      </TouchableOpacity>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container:      { flex: 1, backgroundColor: "#f0f0ff", padding: 16 },
  center:         { flex: 1, justifyContent: "center", alignItems: "center", padding: 20 },
  loadingText:    { marginTop: 16, color: "#6b7280", fontSize: 14 },
  errorText:      { color: "#EF4444", fontSize: 15, marginBottom: 16 },
  retryBtn:       { backgroundColor: "#6366F1", borderRadius: 12, paddingHorizontal: 24, paddingVertical: 12 },
  retryBtnText:   { color: "#fff", fontWeight: "bold" },
  progressCard:   { backgroundColor: "#6366F1", borderRadius: 20, padding: 20, marginBottom: 12 },
  progressTitle:  { color: "rgba(255,255,255,0.8)", fontSize: 13, marginBottom: 4 },
  progressDays:   { color: "#fff", fontSize: 22, fontWeight: "bold", marginBottom: 12 },
  progressBar:    { height: 8, backgroundColor: "rgba(255,255,255,0.3)", borderRadius: 4, overflow: "hidden" },
  progressFill:   { height: "100%", backgroundColor: "#fff", borderRadius: 4 },
  statsRow:       { flexDirection: "row", gap: 12, marginBottom: 12 },
  statCard:       { flex: 1, borderRadius: 16, padding: 16, elevation: 2 },
  statLabel:      { color: "rgba(255,255,255,0.8)", fontSize: 11, marginBottom: 4 },
  statValue:      { color: "#fff", fontSize: 18, fontWeight: "bold" },
  card:           { backgroundColor: "#fff", borderRadius: 16, padding: 16, marginBottom: 12, elevation: 2 },
  cardTitle:      { fontSize: 15, fontWeight: "bold", color: "#1f2937", marginBottom: 12 },
  expenseBar:     { height: 12, backgroundColor: "#f3f4f6", borderRadius: 6, overflow: "hidden", marginBottom: 8 },
  expenseFill:    { height: "100%", borderRadius: 6 },
  expensePercent: { fontSize: 13, color: "#6b7280", textAlign: "right" },
  catRow:         { flexDirection: "row", justifyContent: "space-between", paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: "#f3f4f6" },
  catName:        { fontSize: 14, color: "#1f2937", fontWeight: "500" },
  catAmount:      { fontSize: 14, color: "#EF4444", fontWeight: "bold" },
  adviceCard:     { backgroundColor: "#ede9fe", borderRadius: 16, padding: 16, marginBottom: 12 },
  adviceHeader:   { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 10 },
  adviceIcon:     { backgroundColor: "#6366F1", color: "#fff", fontSize: 11, fontWeight: "bold", paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, overflow: "hidden" },
  adviceTitle:    { fontSize: 15, fontWeight: "bold", color: "#4338ca" },
  adviceText:     { fontSize: 14, color: "#374151", lineHeight: 22 },
  refreshBtn:     { backgroundColor: "#6366F1", borderRadius: 12, padding: 14, alignItems: "center", marginBottom: 12 },
  refreshBtnText: { color: "#fff", fontWeight: "bold", fontSize: 15 },
});