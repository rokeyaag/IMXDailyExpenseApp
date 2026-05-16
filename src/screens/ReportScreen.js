import React, { useState, useEffect } from "react";
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator, Alert } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import api from "../services/api";
import Toast from "../components/Toast";
import { useLanguage } from "../context/LanguageContext";

export default function ReportScreen({ navigation }) {
  const { t, language } = useLanguage();

  const PRESETS = [
    { key: "this_month", label: t("thisMonth") },
    { key: "last_month", label: t("lastMonth") },
    { key: "last_7_days", label: t("last7Days") },
    { key: "last_30_days", label: t("last30Days") },
    { key: "all_time", label: t("allTime") },
  ];

  const TYPES = [
    { key: "all", label: t("all") },
    { key: "income", label: t("income") },
    { key: "expense", label: t("expense") },
  ];

  const [preset, setPreset] = useState("this_month");
  const [txnType, setTxnType] = useState("all");
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [report, setReport] = useState(null);
  const [toast, setToast] = useState({ visible: false, message: "", type: "success" });

  const showToast = (message, type = "success") => setToast({ visible: true, message, type });

  useEffect(() => {
    fetchReport();
  }, [preset, txnType]);

  const fetchReport = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/api/analytics/report/?preset=${preset}&type=${txnType}`);
      setReport(res.data);
    } catch (e) {
      showToast(t("somethingWrong"), "error");
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr) => {
    const d = new Date(dateStr);
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
  };

  const buildHTML = () => {
    if (!report) return "";
    const { summary, period, transactions, category_breakdown } = report;

    const txnRows = transactions.map((tx, idx) => `
      <tr style="background:${idx % 2 === 0 ? "#f9fafb" : "#fff"}">
        <td style="padding:8px;border:1px solid #e5e7eb;font-size:11px;">${formatDate(tx.date)}</td>
        <td style="padding:8px;border:1px solid #e5e7eb;font-size:11px;">${tx.note || "-"}</td>
        <td style="padding:8px;border:1px solid #e5e7eb;font-size:11px;">${tx.category}</td>
        <td style="padding:8px;border:1px solid #e5e7eb;font-size:11px;color:${tx.type === "income" ? "#10B981" : "#EF4444"};">${tx.type === "income" ? "+" : "-"} ${tx.amount.toFixed(2)}</td>
      </tr>
    `).join("");

    const catRows = category_breakdown.map((c) => `
      <tr>
        <td style="padding:6px 10px;border:1px solid #e5e7eb;font-size:12px;">${c.name}</td>
        <td style="padding:6px 10px;border:1px solid #e5e7eb;font-size:12px;text-align:right;">Tk ${c.total.toFixed(2)}</td>
      </tr>
    `).join("");

    return `
<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<style>
  body { font-family: 'Helvetica', sans-serif; padding: 30px; color: #1f2937; }
  h1 { color: #6366F1; margin: 0 0 4px 0; font-size: 24px; }
  .subtitle { color: #6b7280; font-size: 13px; margin-bottom: 24px; }
  .summary { display: flex; justify-content: space-between; background: linear-gradient(135deg, #667eea, #764ba2); color: #fff; padding: 20px; border-radius: 12px; margin-bottom: 24px; }
  .summary-item { text-align: center; flex: 1; }
  .summary-label { font-size: 11px; opacity: 0.85; margin-bottom: 4px; }
  .summary-value { font-size: 18px; font-weight: bold; }
  h2 { color: #1f2937; font-size: 16px; margin: 20px 0 10px; border-bottom: 2px solid #6366F1; padding-bottom: 6px; }
  table { width: 100%; border-collapse: collapse; margin-bottom: 16px; }
  th { background: #6366F1; color: #fff; padding: 8px; font-size: 12px; border: 1px solid #6366F1; text-align: left; }
  .footer { text-align: center; color: #9ca3af; font-size: 10px; margin-top: 30px; }
</style>
</head>
<body>
  <h1>IMX Daily Expense Report</h1>
  <p class="subtitle">Period: ${formatDate(period.start_date)} to ${formatDate(period.end_date)}</p>

  <div class="summary">
    <div class="summary-item">
      <div class="summary-label">INCOME</div>
      <div class="summary-value">Tk ${summary.total_income.toFixed(2)}</div>
    </div>
    <div class="summary-item">
      <div class="summary-label">EXPENSE</div>
      <div class="summary-value">Tk ${summary.total_expense.toFixed(2)}</div>
    </div>
    <div class="summary-item">
      <div class="summary-label">BALANCE</div>
      <div class="summary-value">Tk ${summary.balance.toFixed(2)}</div>
    </div>
  </div>

  ${category_breakdown.length > 0 ? `
    <h2>Category Breakdown</h2>
    <table>
      <tr><th>Category</th><th style="text-align:right;">Total</th></tr>
      ${catRows}
    </table>
  ` : ""}

  <h2>Transactions (${summary.transaction_count})</h2>
  <table>
    <tr>
      <th>Date</th>
      <th>Note</th>
      <th>Category</th>
      <th>Amount (Tk)</th>
    </tr>
    ${txnRows}
  </table>

  <div class="footer">
    Generated by IMX Daily Expense App on ${formatDate(new Date().toISOString())}
  </div>
</body>
</html>
    `;
  };

  const handleGeneratePDF = async () => {
    if (!report) { showToast(t("somethingWrong"), "error"); return; }
    if (report.transactions.length === 0) { showToast(t("noTxnInPeriod"), "error"); return; }

    setGenerating(true);
    try {
      const html = buildHTML();
      const { uri } = await Print.printToFileAsync({ html, base64: false });

      const canShare = await Sharing.isAvailableAsync();
      if (canShare) {
        await Sharing.shareAsync(uri, {
          mimeType: "application/pdf",
          dialogTitle: t("generatePDFShare"),
          UTI: "com.adobe.pdf",
        });
        showToast(t("pdfGenerated"));
      } else {
        Alert.alert("PDF Created", `Saved at: ${uri}`);
      }
    } catch (e) {
      showToast(t("pdfFailed") + ": " + e.message, "error");
    } finally {
      setGenerating(false);
    }
  };

  return (
    <LinearGradient colors={["#667eea", "#764ba2"]} style={styles.gradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
      <Toast visible={toast.visible} message={toast.message} type={toast.type} onHide={() => setToast({ ...toast, visible: false })} />
      <ScrollView contentContainerStyle={styles.content}>

        <Text style={styles.heading}>{t("generateReport")}</Text>
        <Text style={styles.subheading}>{t("filterAndCreate")}</Text>

        <Text style={styles.sectionLabel}>{t("timePeriod")}</Text>
        <View style={styles.pillsRow}>
          {PRESETS.map((p) => (
            <TouchableOpacity
              key={p.key}
              style={[styles.pill, preset === p.key && styles.pillActive]}
              onPress={() => setPreset(p.key)}
              activeOpacity={0.7}>
              <Text style={[styles.pillText, preset === p.key && styles.pillTextActive]}>{p.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.sectionLabel}>{t("typeFilter")}</Text>
        <View style={styles.pillsRow}>
          {TYPES.map((ty) => (
            <TouchableOpacity
              key={ty.key}
              style={[styles.pill, txnType === ty.key && styles.pillActive]}
              onPress={() => setTxnType(ty.key)}
              activeOpacity={0.7}>
              <Text style={[styles.pillText, txnType === ty.key && styles.pillTextActive]}>{ty.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {loading ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator color="#fff" size="large" />
            <Text style={styles.loadingText}>{t("loading")}</Text>
          </View>
        ) : report && (
          <View style={styles.previewCard}>
            <Text style={styles.previewTitle}>{t("preview")}</Text>

            <View style={styles.summaryRow}>
              <View style={styles.summaryBox}>
                <Text style={styles.summaryLabel}>{t("income")}</Text>
                <Text style={[styles.summaryValue, { color: "#10B981" }]}>Tk {report.summary.total_income.toFixed(0)}</Text>
              </View>
              <View style={styles.summaryBox}>
                <Text style={styles.summaryLabel}>{t("expense")}</Text>
                <Text style={[styles.summaryValue, { color: "#EF4444" }]}>Tk {report.summary.total_expense.toFixed(0)}</Text>
              </View>
            </View>

            <View style={styles.balanceBox}>
              <Text style={styles.balanceLabel}>{t("balance")}</Text>
              <Text style={styles.balanceValue}>Tk {report.summary.balance.toFixed(0)}</Text>
            </View>

            <Text style={styles.countText}>{report.summary.transaction_count} {t("transactionsFound")}</Text>

            {report.transactions.length > 0 && (
              <View style={styles.txnList}>
                {report.transactions.slice(0, 3).map((tx) => (
                  <View key={tx.id} style={styles.txnRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.txnNote}>{tx.note || "-"}</Text>
                      <Text style={styles.txnDate}>{formatDate(tx.date)} - {tx.category}</Text>
                    </View>
                    <Text style={[styles.txnAmount, { color: tx.type === "income" ? "#10B981" : "#EF4444" }]}>
                      {tx.type === "income" ? "+" : "-"} Tk{tx.amount.toFixed(0)}
                    </Text>
                  </View>
                ))}
                {report.transactions.length > 3 && (
                  <Text style={styles.moreText}>+ {report.transactions.length - 3} {t("moreInPDF")}</Text>
                )}
              </View>
            )}
          </View>
        )}

        <TouchableOpacity
          style={[styles.generateBtn, (generating || loading || !report) && styles.btnDisabled]}
          onPress={handleGeneratePDF}
          disabled={generating || loading || !report}
          activeOpacity={0.85}>
          {generating ? (
            <ActivityIndicator color="#667eea" size="large" />
          ) : (
            <Text style={styles.generateBtnText}>{t("generatePDFShare")}</Text>
          )}
        </TouchableOpacity>

      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: { flex: 1 },
  content: { padding: 20, paddingBottom: 40 },

  heading: { fontSize: 28, fontWeight: "700", color: "#fff", textAlign: "center", marginBottom: 4 },
  subheading: { fontSize: 14, color: "rgba(255,255,255,0.8)", textAlign: "center", marginBottom: 24 },

  sectionLabel: { fontSize: 14, color: "#fff", fontWeight: "600", marginBottom: 10, marginTop: 8 },
  pillsRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 12 },
  pill: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20, backgroundColor: "rgba(255,255,255,0.18)", borderWidth: 1, borderColor: "rgba(255,255,255,0.25)" },
  pillActive: { backgroundColor: "#fff", borderColor: "#fff" },
  pillText: { color: "rgba(255,255,255,0.9)", fontSize: 13, fontWeight: "600" },
  pillTextActive: { color: "#667eea" },

  loadingBox: { padding: 30, alignItems: "center" },
  loadingText: { color: "#fff", marginTop: 10, fontSize: 14 },

  previewCard: { backgroundColor: "rgba(255,255,255,0.95)", borderRadius: 20, padding: 20, marginTop: 16, marginBottom: 20 },
  previewTitle: { fontSize: 18, fontWeight: "700", color: "#1f2937", marginBottom: 16 },

  summaryRow: { flexDirection: "row", gap: 12, marginBottom: 12 },
  summaryBox: { flex: 1, backgroundColor: "#f9fafb", borderRadius: 12, padding: 14, alignItems: "center" },
  summaryLabel: { fontSize: 12, color: "#6b7280", marginBottom: 4, fontWeight: "600" },
  summaryValue: { fontSize: 18, fontWeight: "700" },

  balanceBox: { backgroundColor: "#6366F1", borderRadius: 12, padding: 16, alignItems: "center", marginBottom: 16 },
  balanceLabel: { fontSize: 12, color: "rgba(255,255,255,0.85)", marginBottom: 4, fontWeight: "600" },
  balanceValue: { fontSize: 22, color: "#fff", fontWeight: "700" },

  countText: { fontSize: 13, color: "#6b7280", textAlign: "center", marginBottom: 12 },

  txnList: { borderTopWidth: 1, borderTopColor: "#f3f4f6", paddingTop: 12 },
  txnRow: { flexDirection: "row", alignItems: "center", paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: "#f3f4f6" },
  txnNote: { fontSize: 14, color: "#1f2937", fontWeight: "600" },
  txnDate: { fontSize: 11, color: "#9ca3af", marginTop: 2 },
  txnAmount: { fontSize: 15, fontWeight: "700" },
  moreText: { fontSize: 12, color: "#6366F1", textAlign: "center", marginTop: 8, fontStyle: "italic" },

  generateBtn: { backgroundColor: "#fff", borderRadius: 16, padding: 18, alignItems: "center", elevation: 8, marginTop: 8 },
  generateBtnText: { color: "#667eea", fontSize: 18, fontWeight: "700" },
  btnDisabled: { opacity: 0.5 },
});