import React, { useState, useEffect } from "react";
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator, Alert, Platform, SafeAreaView } from "react-native";
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import api from "../services/api";
import Toast from "../components/Toast";
import { useLanguage } from "../context/LanguageContext";

export default function ReportScreen({ navigation }) {
  const { t, language } = useLanguage();

  const PRESETS = [
    { key: "this_month", label: t("thisMonth") || "This Month" },
    { key: "last_month", label: t("lastMonth") || "Last Month" },
    { key: "last_7_days", label: t("last7Days") || "Last 7 Days" },
    { key: "last_30_days", label: t("last30Days") || "Last 30 Days" },
    { key: "all_time", label: t("allTime") || "All Time" },
  ];

  const TYPES = [
    { key: "all", label: t("all") || "All" },
    { key: "income", label: t("income") || "Income" },
    { key: "expense", label: t("expense") || "Expense" },
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
      if (res.data) setReport(res.data);
    } catch (e) {
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

    const txnRows = (transactions || []).map((tx, idx) => `
      <tr style="background:${idx % 2 === 0 ? "#f8fafc" : "#ffffff"}">
        <td style="padding:10px;border-bottom:1px solid #e2e8f0;font-size:12px;">${formatDate(tx.date)}</td>
        <td style="padding:10px;border-bottom:1px solid #e2e8f0;font-size:12px;font-weight:600;">${tx.note || "-"}</td>
        <td style="padding:10px;border-bottom:1px solid #e2e8f0;font-size:12px;">${tx.category}</td>
        <td style="padding:10px;border-bottom:1px solid #e2e8f0;font-size:12px;font-weight:bold;color:${tx.type === "income" ? "#10B981" : "#EF4444"};text-align:right;">${tx.type === "income" ? "+" : "-"} ৳${tx.amount.toFixed(2)}</td>
      </tr>
    `).join("");

    const catRows = (category_breakdown || []).map((c) => `
      <tr>
        <td style="padding:8px 12px;border-bottom:1px solid #e2e8f0;font-size:12px;">${c.name}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #e2e8f0;font-size:12px;text-align:right;font-weight:bold;">৳${c.total.toFixed(2)}</td>
      </tr>
    `).join("");

    return `
<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<style>
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; padding: 40px; color: #0f172a; margin: 0; background: #ffffff; }
  .header { border-bottom: 2px solid #0f172a; padding-bottom: 20px; margin-bottom: 24px; display: flex; justify-content: space-between; align-items: flex-end; }
  h1 { color: #0f172a; margin: 0 0 6px 0; font-size: 26px; font-weight: 800; }
  .subtitle { color: #64748b; font-size: 13px; margin: 0; }
  .branding { font-size: 14px; font-weight: 800; color: #4f46e5; }
  .summary-grid { display: flex; gap: 16px; margin-bottom: 28px; }
  .summary-card { flex: 1; padding: 18px; border-radius: 16px; border: 1px solid #e2e8f0; text-align: center; }
  .summary-label { font-size: 11px; font-weight: 700; color: #64748b; text-transform: uppercase; margin-bottom: 6px; }
  .summary-value { font-size: 20px; font-weight: 800; }
  h2 { color: #0f172a; font-size: 16px; font-weight: 700; margin: 24px 0 12px; }
  table { width: 100%; border-collapse: collapse; margin-bottom: 24px; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; }
  th { background: #f8fafc; color: #475569; padding: 10px; font-size: 11px; font-weight: 700; text-transform: uppercase; border-bottom: 1px solid #e2e8f0; text-align: left; }
  .footer { text-align: center; color: #94a3b8; font-size: 11px; margin-top: 40px; border-top: 1px solid #e2e8f0; padding-top: 16px; }
</style>
</head>
<body>
  <div class="header">
    <div>
      <h1>${t("reportTitle") || "Financial Statement"}</h1>
      <p class="subtitle">${t("period") || "Period"}: ${formatDate(period.start_date)} — ${formatDate(period.end_date)}</p>
    </div>
    <div class="branding">IMX Daily Expense</div>
  </div>

  <div class="summary-grid">
    <div class="summary-card" style="background:#f0fdf4;border-color:#dcfce7;">
      <div class="summary-label" style="color:#15803d;">${(t("income") || "Income").toUpperCase()}</div>
      <div class="summary-value" style="color:#15803d;">৳${summary.total_income.toFixed(2)}</div>
    </div>
    <div class="summary-card" style="background:#fef2f2;border-color:#fee2e2;">
      <div class="summary-label" style="color:#b91c1c;">${(t("expense") || "Expense").toUpperCase()}</div>
      <div class="summary-value" style="color:#b91c1c;">৳${summary.total_expense.toFixed(2)}</div>
    </div>
    <div class="summary-card" style="background:#eef2ff;border-color:#e0e7ff;">
      <div class="summary-label" style="color:#4338ca;">${(t("balance") || "Net Balance").toUpperCase()}</div>
      <div class="summary-value" style="color:#4338ca;">৳${summary.balance.toFixed(2)}</div>
    </div>
  </div>

  ${category_breakdown && category_breakdown.length > 0 ? `
    <h2>Category Breakdown</h2>
    <table>
      <thead><tr><th>Category</th><th style="text-align:right;">Total Spent</th></tr></thead>
      <tbody>${catRows}</tbody>
    </table>
  ` : ""}

  <h2>Transactions History (${summary.transaction_count})</h2>
  <table>
    <thead>
      <tr>
        <th>Date</th>
        <th>Description / Note</th>
        <th>Category</th>
        <th style="text-align:right;">Amount (৳)</th>
      </tr>
    </thead>
    <tbody>${txnRows}</tbody>
  </table>

  <div class="footer">
    Generated automatically by IMX Financial Engine · ${formatDate(new Date().toISOString())}
  </div>
</body>
</html>
    `;
  };

  const handleGeneratePDF = async () => {
    if (!report) { showToast(t("somethingWrong") || "No data", "error"); return; }
    if (!report.transactions || report.transactions.length === 0) {
      showToast(t("noTxnInPeriod") || "No transactions in this period", "error");
      return;
    }

    setGenerating(true);
    try {
      const html = buildHTML();
      const { uri } = await Print.printToFileAsync({ html, base64: false });

      const canShare = await Sharing.isAvailableAsync();
      if (canShare) {
        await Sharing.shareAsync(uri, {
          mimeType: "application/pdf",
          dialogTitle: t("generatePDFShare") || "Share PDF Report",
          UTI: "com.adobe.pdf",
        });
        showToast(t("pdfGenerated") || "PDF generated!", "success");
      } else {
        Alert.alert("PDF Generated", `Saved at: ${uri}`);
      }
    } catch (e) {
      showToast(t("pdfFailed") || "PDF generation failed", "error");
    } finally {
      setGenerating(false);
    }
  };

  return (
    <SafeAreaView style={styles.screen}>
      <Toast visible={toast.visible} message={toast.message} type={toast.type} onHide={() => setToast({ ...toast, visible: false })} />

      {/* Top Header */}
      <View style={styles.topNav}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn} activeOpacity={0.7}>
          <Text style={styles.backArrow}>←</Text>
        </TouchableOpacity>
        <Text style={styles.navTitle}>{t("report") || "PDF Reports"}</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>

        <Text style={styles.sectionLabel}>🗓️ {t("timePeriod")}</Text>
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

        <Text style={styles.sectionLabel}>🏷️ {t("typeFilter") || "Filter By Type"}</Text>
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
            <ActivityIndicator color="#4F46E5" size="large" />
            <Text style={styles.loadingText}>{t("loading")}</Text>
          </View>
        ) : report && (
          <View style={styles.previewCard}>
            <Text style={styles.previewTitle}>📄 {t("preview")}</Text>

            <View style={styles.summaryRow}>
              <View style={[styles.summaryBox, { backgroundColor: "#ECFDF5", borderColor: "#D1FAE5" }]}>
                <Text style={styles.summaryLabel}>💰 {t("income")}</Text>
                <Text style={[styles.summaryValue, { color: "#10B981" }]}>৳{report.summary?.total_income?.toLocaleString()}</Text>
              </View>
              <View style={[styles.summaryBox, { backgroundColor: "#FEF2F2", borderColor: "#FEE2E2" }]}>
                <Text style={styles.summaryLabel}>💸 {t("expense")}</Text>
                <Text style={[styles.summaryValue, { color: "#EF4444" }]}>৳{report.summary?.total_expense?.toLocaleString()}</Text>
              </View>
            </View>

            <View style={styles.balanceBox}>
              <Text style={styles.balanceLabel}>💳 {t("balance")}</Text>
              <Text style={styles.balanceValue}>৳{report.summary?.balance?.toLocaleString()}</Text>
            </View>

            <Text style={styles.countText}>{report.summary?.transaction_count || 0} {t("transactionsFound")}</Text>

            {report.transactions && report.transactions.length > 0 && (
              <View style={styles.txnList}>
                {report.transactions.slice(0, 3).map((tx) => (
                  <View key={tx.id || Math.random()} style={styles.txnRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.txnNote}>{tx.note || "-"}</Text>
                      <Text style={styles.txnDate}>{formatDate(tx.date)} · {tx.category}</Text>
                    </View>
                    <Text style={[styles.txnAmount, { color: tx.type === "income" ? "#10B981" : "#0F172A" }]}>
                      {tx.type === "income" ? "+" : "-"}৳{parseFloat(tx.amount || 0).toLocaleString()}
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
            <ActivityIndicator color="#FFFFFF" size="small" />
          ) : (
            <Text style={styles.generateBtnText}>📥 {t("generatePDFShare") || "Generate & Share PDF"}</Text>
          )}
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#F8FAFC" },
  container: { flex: 1, paddingHorizontal: 16 },

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

  sectionLabel: { fontSize: 12, color: "#64748B", fontWeight: "700", marginBottom: 8, marginTop: 14, textTransform: "uppercase", letterSpacing: 0.5 },
  pillsRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 12 },
  pill: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 14, backgroundColor: "#FFFFFF", borderWidth: 1, borderColor: "#E2E8F0" },
  pillActive: { backgroundColor: "#0F172A", borderColor: "#0F172A" },
  pillText: { color: "#475569", fontSize: 12, fontWeight: "600" },
  pillTextActive: { color: "#FFFFFF", fontWeight: "700" },

  loadingBox: { padding: 30, alignItems: "center" },
  loadingText: { color: "#64748B", marginTop: 10, fontSize: 13 },

  previewCard: { backgroundColor: "#FFFFFF", borderRadius: 24, padding: 20, marginTop: 12, marginBottom: 16, borderWidth: 1, borderColor: "#E2E8F0", shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 8, elevation: 2 },
  previewTitle: { fontSize: 16, fontWeight: "700", color: "#0F172A", marginBottom: 14 },

  summaryRow: { flexDirection: "row", gap: 10, marginBottom: 10 },
  summaryBox: { flex: 1, borderRadius: 16, padding: 14, alignItems: "center", borderWidth: 1 },
  summaryLabel: { fontSize: 11, color: "#64748B", marginBottom: 4, fontWeight: "600" },
  summaryValue: { fontSize: 16, fontWeight: "800" },

  balanceBox: { backgroundColor: "#0F172A", borderRadius: 16, padding: 16, alignItems: "center", marginBottom: 14 },
  balanceLabel: { fontSize: 11, color: "#94A3B8", marginBottom: 4, fontWeight: "600" },
  balanceValue: { fontSize: 20, color: "#FFFFFF", fontWeight: "800" },

  countText: { fontSize: 12, color: "#64748B", textAlign: "center", marginBottom: 10, fontWeight: "600" },

  txnList: { borderTopWidth: 1, borderTopColor: "#F1F5F9", paddingTop: 10 },
  txnRow: { flexDirection: "row", alignItems: "center", paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: "#F1F5F9" },
  txnNote: { fontSize: 13, color: "#0F172A", fontWeight: "700" },
  txnDate: { fontSize: 11, color: "#64748B", marginTop: 2 },
  txnAmount: { fontSize: 14, fontWeight: "700" },
  moreText: { fontSize: 12, color: "#4F46E5", textAlign: "center", marginTop: 8, fontWeight: "600" },

  generateBtn: { backgroundColor: "#4F46E5", borderRadius: 20, paddingVertical: 16, alignItems: "center", shadowColor: "#4F46E5", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.25, shadowRadius: 10, elevation: 4 },
  generateBtnText: { color: "#FFFFFF", fontSize: 15, fontWeight: "700" },
  btnDisabled: { opacity: 0.5 },
});