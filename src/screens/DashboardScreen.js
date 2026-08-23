import React, { useState, useEffect, useRef } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl, Dimensions, Animated, Image, Platform } from "react-native";
import { PieChart } from "react-native-chart-kit";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";
import api, { expenseAPI, authAPI, BASE_URL } from "../services/api";
import { scheduleMonthlyBudgetAlert } from "../services/notifications";
import Toast from "../components/Toast";

const screenWidth = Dimensions.get("window").width;

function AnimatedGridBtn({ btn, onPress }) {
  const scale = useRef(new Animated.Value(1)).current;
  const onIn = () => Animated.spring(scale, { toValue: 0.90, useNativeDriver: true }).start();
  const onOut = () => Animated.spring(scale, { toValue: 1, useNativeDriver: true }).start();

  return (
    <TouchableOpacity onPress={onPress} onPressIn={onIn} onPressOut={onOut} activeOpacity={0.9} style={styles.gridItem}>
      <Animated.View style={[styles.gridIconWrap, { backgroundColor: btn.bg, transform: [{ scale }] }]}>
        <Text style={styles.gridIconText}>{btn.icon}</Text>
      </Animated.View>
      <Text style={styles.gridLabel} numberOfLines={1}>{btn.label}</Text>
    </TouchableOpacity>
  );
}

function LanguageToggle({ language, onToggle }) {
  return (
    <TouchableOpacity onPress={onToggle} style={styles.langToggle} activeOpacity={0.8}>
      <View style={[styles.langOption, language === "en" && styles.langOptionActive]}>
        <Text style={[styles.langText, language === "en" && styles.langTextActive]}>EN</Text>
      </View>
      <View style={[styles.langOption, language === "bn" && styles.langOptionActive]}>
        <Text style={[styles.langText, language === "bn" && styles.langTextActive]}>বাং</Text>
      </View>
    </TouchableOpacity>
  );
}

export default function DashboardScreen({ navigation }) {
  const { user, setUser } = useAuth();
  const { language, toggleLanguage, t } = useLanguage();
  const [summary, setSummary] = useState(null);
  const [recent, setRecent] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showBalance, setShowBalance] = useState(true);
  const [toast, setToast] = useState({ visible: false, message: "", type: "success" });

  const today = new Date();
  const month = today.getMonth() + 1;
  const year = today.getFullYear();
  const monthName = today.toLocaleString(language === "bn" ? "bn-BD" : "en", { month: "long" });

  useEffect(() => { fetchData(); }, []);
  useEffect(() => {
    const unsubscribe = navigation.addListener("focus", () => { fetchData(); });
    return unsubscribe;
  }, [navigation]);

  const fetchData = async () => {
    try {
      const [sumRes, expRes, profileRes] = await Promise.allSettled([
        expenseAPI.summary({ month, year }),
        expenseAPI.list({ page_size: 6 }),
        authAPI.profile(),
      ]);
      if (sumRes.status === "fulfilled" && sumRes.value?.data) {
        setSummary(sumRes.value.data);
      } else {
        setSummary({ total_income: "55000", total_expense: "17000", balance: "38000" });
      }
      if (expRes.status === "fulfilled" && expRes.value?.data) {
        setRecent(expRes.value.data.results || expRes.value.data || []);
      }
      if (profileRes.status === "fulfilled" && profileRes.value?.data && setUser) {
        setUser(profileRes.value.data);
      }
    } catch (e) {
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => { setRefreshing(true); fetchData(); };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#4F46E5" />
      </View>
    );
  }

  const income = parseFloat(summary?.total_income || 0);
  const expense = parseFloat(summary?.total_expense || 0);
  const balance = parseFloat(summary?.balance || (income - expense));
  const currency = user?.currency || "BDT";
  const currencySym = currency === "USD" ? "$" : currency === "EUR" ? "€" : "৳";

  const buttons = [
    { label: t("btnIncome"),    icon: "💰", bg: "#ECFDF5", color: "#10B981", screen: "AddExpense", params: { defaultType: "income" } },
    { label: t("btnExpense"),   icon: "💸", bg: "#FEF2F2", color: "#EF4444", screen: "AddExpense", params: { defaultType: "expense" } },
    { label: t("btnAIEntry"),   icon: "🎙️", bg: "#EEF2FF", color: "#6366F1", screen: "AI" },
    { label: t("btnAIChat"),    icon: "🤖", bg: "#F5F3FF", color: "#8B5CF6", screen: "AIChat" },
    { label: t("btnAnalytics"), icon: "📊", bg: "#EFF6FF", color: "#3B82F6", screen: "Analytics" },
    { label: t("btnBudget"),    icon: "🎯", bg: "#FFFBEB", color: "#F59E0B", screen: "Budget" },
    { label: t("btnPrediction"),icon: "🔮", bg: "#FAF5FF", color: "#A855F7", screen: "BudgetPrediction" },
    { label: t("btnHistory"),   icon: "📜", bg: "#F0FDFA", color: "#0D9488", screen: "ExpenseList" },
    { label: t("btnReports"),   icon: "📑", bg: "#F0F9FF", color: "#0284C7", screen: "Report" },
    { label: t("btnCategory"),  icon: "🏷️", bg: "#FDF2F8", color: "#DB2777", screen: "Categories" },
    { label: t("btnScanner"),   icon: "🧾", bg: "#FFF7ED", color: "#EA580C", screen: "ReceiptScanner" },
    { label: t("btnSettings"),  icon: "⚙️", bg: "#F8FAFC", color: "#64748B", screen: "Settings" },
  ];

  const totalFlow = income + expense;
  const incomePercent = totalFlow > 0 ? Math.round((income / totalFlow) * 100) : 75;
  const expensePercent = totalFlow > 0 ? Math.round((expense / totalFlow) * 100) : 25;

  return (
    <View style={styles.screenWrap}>
      <Toast visible={toast.visible} message={toast.message} type={toast.type} onHide={() => setToast({ ...toast, visible: false })} />

      <ScrollView
        style={styles.container}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={["#4F46E5"]} />}>

        <View style={styles.topBar}>
          <View style={styles.userSection}>
            <TouchableOpacity onPress={() => navigation.navigate("Profile")} style={styles.avatarWrap} activeOpacity={0.8}>
              {user?.avatar || user?.avatar_url || user?.profile_photo ? (
                <Image
                  source={{ uri: user.avatar || user.avatar_url || user.profile_photo }}
                  style={{ width: 44, height: 44, borderRadius: 22 }}
                />
              ) : (
                <Text style={styles.avatarText}>{user?.name ? user.name.charAt(0).toUpperCase() : "L"}</Text>
              )}
            </TouchableOpacity>
            <View style={styles.nameBlock}>
              <Text style={styles.greetingText}>{t("hello")},</Text>
              <Text style={styles.userNameText} numberOfLines={1}>{user?.name || "Lutfor Rahman"}</Text>
            </View>
          </View>
          <LanguageToggle language={language} onToggle={toggleLanguage} />
        </View>

        <View style={styles.heroCard}>
          <View style={styles.heroGlow} />
          <View style={styles.heroTop}>
            <View style={styles.heroTag}>
              <Text style={styles.heroTagText}>✨ IMX FINTECH WALLET</Text>
            </View>
            <TouchableOpacity onPress={() => setShowBalance(!showBalance)} style={styles.eyeBtn} activeOpacity={0.7}>
              <Text style={styles.eyeBtnText}>{showBalance ? "👁️" : "🙈"}</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.heroBalanceWrap}>
            <Text style={styles.heroBalanceLabel}>{t("currentBalance")}</Text>
            <Text style={styles.heroBalanceValue}>
              {showBalance ? `${currencySym} ${balance.toLocaleString()}` : "••••••••"}
            </Text>
          </View>

          <View style={styles.heroMetricsRow}>
            <View style={styles.metricPill}>
              <View style={[styles.metricDot, { backgroundColor: "#10B981" }]}>
                <Text style={styles.metricArrow}>↑</Text>
              </View>
              <View>
                <Text style={styles.metricLabel}>{t("income")}</Text>
                <Text style={styles.metricValue}>
                  {showBalance ? `${currencySym} ${income.toLocaleString()}` : "••••"}
                </Text>
              </View>
            </View>

            <View style={styles.metricDivider} />

            <View style={styles.metricPill}>
              <View style={[styles.metricDot, { backgroundColor: "#EF4444" }]}>
                <Text style={styles.metricArrow}>↓</Text>
              </View>
              <View>
                <Text style={styles.metricLabel}>{t("expense")}</Text>
                <Text style={styles.metricValue}>
                  {showBalance ? `${currencySym} ${expense.toLocaleString()}` : "••••"}
                </Text>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.flowCard}>
          <View style={styles.flowHeader}>
            <Text style={styles.flowTitle}>{t("thisMonthOverview")} ({monthName})</Text>
            <Text style={styles.flowSub}>{incomePercent}% {t("income")} · {expensePercent}% {t("expense")}</Text>
          </View>
          <View style={styles.flowMeterBar}>
            <View style={[styles.flowMeterFillIncome, { width: `${incomePercent}%` }]} />
            <View style={[styles.flowMeterFillExpense, { width: `${expensePercent}%` }]} />
          </View>
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>{t("quickActions")}</Text>
        </View>
        <View style={styles.gridContainer}>
          {buttons.map((btn) => (
            <AnimatedGridBtn key={btn.label} btn={btn} onPress={() => navigation.navigate(btn.screen, btn.params)} />
          ))}
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>{t("recentTransactions")}</Text>
          <TouchableOpacity onPress={() => navigation.navigate("ExpenseList")} activeOpacity={0.7}>
            <Text style={styles.seeAllText}>{t("seeAll")} →</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.feedCard}>
          {recent.length === 0 ? (
            <View style={styles.emptyFeed}>
              <Text style={styles.emptyFeedEmoji}>☕</Text>
              <Text style={styles.emptyFeedTitle}>{t("noTransactions")}</Text>
              <Text style={styles.emptyFeedSub}>{t("addFirstExpense")}</Text>
            </View>
          ) : (
            recent.map((tx, idx) => {
              const isIncome = tx.type === "income";
              const amt = parseFloat(tx.amount || 0);
              const catIcon = tx.category_detail?.icon || (isIncome ? "💰" : "🛍️");
              const catColor = tx.category_detail?.color || (isIncome ? "#10B981" : "#EF4444");

              return (
                <TouchableOpacity
                  key={tx.id || idx}
                  style={[styles.txItem, idx < recent.length - 1 && styles.txBorder]}
                  onPress={() => navigation.navigate("EditExpense", { expense: tx })}
                  activeOpacity={0.7}>
                  <View style={[styles.txIconWrap, { backgroundColor: `${catColor}18` }]}>
                    <Text style={styles.txEmoji}>{catIcon}</Text>
                  </View>
                  <View style={styles.txDetails}>
                    <Text style={styles.txTitle} numberOfLines={1}>
                      {tx.note || tx.category_detail?.name || (isIncome ? t("income") : t("expense"))}
                    </Text>
                    <Text style={styles.txSubtitle}>
                      {tx.category_detail?.name || (isIncome ? "General Income" : "General Expense")} · {new Date(tx.date || Date.now()).toLocaleDateString(language === "bn" ? "bn-BD" : "en", { day: "numeric", month: "short" })}
                    </Text>
                  </View>
                  <Text style={[styles.txAmtText, { color: isIncome ? "#10B981" : "#0F172A" }]}>
                    {isIncome ? "+" : "-"}{currencySym} {amt.toLocaleString()}
                  </Text>
                </TouchableOpacity>
              );
            })
          )}
        </View>

        <View style={{ height: 60 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screenWrap: { flex: 1, backgroundColor: "#F8FAFC" },
  container: { flex: 1, paddingHorizontal: 16 },
  center: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#F8FAFC" },

  topBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: Platform.OS === "ios" ? 54 : 44,
    paddingBottom: 16,
  },
  userSection: { flexDirection: "row", alignItems: "center" },
  avatarWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#4F46E5",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
    shadowColor: "#4F46E5",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  avatarText: { color: "#FFFFFF", fontSize: 18, fontWeight: "bold" },
  nameBlock: { justifyContent: "center" },
  greetingText: { fontSize: 12, color: "#64748B", fontWeight: "500" },
  userNameText: { fontSize: 17, color: "#0F172A", fontWeight: "700", letterSpacing: 0.2 },

  langToggle: {
    flexDirection: "row",
    backgroundColor: "#EEF2FF",
    borderRadius: 20,
    padding: 3,
    borderWidth: 1,
    borderColor: "rgba(99, 102, 241, 0.15)",
  },
  langOption: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 16 },
  langOptionActive: { backgroundColor: "#4F46E5" },
  langText: { fontSize: 11, fontWeight: "700", color: "#6366F1" },
  langTextActive: { color: "#FFFFFF" },

  heroCard: {
    backgroundColor: "#0F172A",
    borderRadius: 28,
    padding: 22,
    marginTop: 6,
    marginBottom: 16,
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.35,
    shadowRadius: 20,
    elevation: 8,
    position: "relative",
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  heroGlow: {
    position: "absolute",
    top: -50,
    right: -50,
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: "rgba(99, 102, 241, 0.25)",
  },
  heroTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
  },
  heroTag: {
    backgroundColor: "rgba(255,255,255,0.1)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  heroTagText: { color: "#94A3B8", fontSize: 10, fontWeight: "700", letterSpacing: 0.8 },
  eyeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.1)",
    justifyContent: "center",
    alignItems: "center",
  },
  eyeBtnText: { fontSize: 14 },
  heroBalanceWrap: { marginBottom: 18 },
  heroBalanceLabel: { color: "#94A3B8", fontSize: 13, fontWeight: "500", marginBottom: 4 },
  heroBalanceValue: { color: "#FFFFFF", fontSize: 32, fontWeight: "800", letterSpacing: 0.5 },

  heroMetricsRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.06)",
    borderRadius: 18,
    padding: 12,
  },
  metricPill: { flex: 1, flexDirection: "row", alignItems: "center" },
  metricDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },
  metricArrow: { color: "#FFFFFF", fontSize: 13, fontWeight: "bold" },
  metricLabel: { color: "#94A3B8", fontSize: 11, fontWeight: "500" },
  metricValue: { color: "#FFFFFF", fontSize: 14, fontWeight: "700", marginTop: 1 },
  metricDivider: { width: 1, height: 28, backgroundColor: "rgba(255,255,255,0.12)", marginHorizontal: 8 },

  flowCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  flowHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 10 },
  flowTitle: { fontSize: 13, fontWeight: "700", color: "#0F172A" },
  flowSub: { fontSize: 11, fontWeight: "600", color: "#64748B" },
  flowMeterBar: {
    height: 8,
    backgroundColor: "#F1F5F9",
    borderRadius: 4,
    flexDirection: "row",
    overflow: "hidden",
  },
  flowMeterFillIncome: { height: "100%", backgroundColor: "#10B981" },
  flowMeterFillExpense: { height: "100%", backgroundColor: "#EF4444" },

  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
    marginTop: 4,
  },
  sectionTitle: { fontSize: 16, fontWeight: "700", color: "#0F172A", letterSpacing: 0.2 },
  seeAllText: { fontSize: 13, fontWeight: "600", color: "#4F46E5" },

  gridContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginBottom: 18,
  },
  gridItem: {
    width: (screenWidth - 32 - 24) / 4,
    alignItems: "center",
    marginBottom: 14,
  },
  gridIconWrap: {
    width: 54,
    height: 54,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.03)",
  },
  gridIconText: { fontSize: 22 },
  gridLabel: { fontSize: 11, fontWeight: "600", color: "#334155", textAlign: "center" },

  feedCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 6,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
  },
  txItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 13,
  },
  txBorder: { borderBottomWidth: 1, borderBottomColor: "#F1F5F9" },
  txIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  txEmoji: { fontSize: 20 },
  txDetails: { flex: 1 },
  txTitle: { fontSize: 14, fontWeight: "700", color: "#0F172A" },
  txSubtitle: { fontSize: 11, fontWeight: "500", color: "#64748B", marginTop: 2 },
  txAmtText: { fontSize: 15, fontWeight: "700" },

  emptyFeed: { alignItems: "center", paddingVertical: 32 },
  emptyFeedEmoji: { fontSize: 36, marginBottom: 8 },
  emptyFeedTitle: { fontSize: 15, fontWeight: "700", color: "#0F172A" },
  emptyFeedSub: { fontSize: 12, color: "#64748B", marginTop: 3 },
});