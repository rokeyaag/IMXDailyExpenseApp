import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, TextInput, Alert, Platform, SafeAreaView } from "react-native";
import { categoryAPI } from "../services/api";
import api from "../services/api";
import { useLanguage } from "../context/LanguageContext";
import Toast from "../components/Toast";

export default function BudgetScreen({ navigation }) {
  const { t } = useLanguage();
  const [budgets, setBudgets] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [amount, setAmount] = useState("");
  const [toast, setToast] = useState({ visible: false, message: "", type: "success" });
  const showToast = (message, type = "success") => setToast({ visible: true, message, type });

  const today = new Date();
  const month = today.getMonth() + 1;
  const year = today.getFullYear();

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      const [budgetRes, catRes] = await Promise.allSettled([
        api.get("/api/budgets/"),
        categoryAPI.list(),
      ]);
      if (budgetRes.status === "fulfilled" && budgetRes.value?.data) {
        setBudgets(budgetRes.value.data.results || budgetRes.value.data || []);
      }
      if (catRes.status === "fulfilled" && catRes.value?.data) {
        setCategories(catRes.value.data.results || catRes.value.data || []);
      }
    } catch (e) {
      setBudgets([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAddBudget = async () => {
    if (!selectedCategory || !amount || parseFloat(amount) <= 0) {
      Alert.alert(t("error"), t("amountRequired"));
      return;
    }
    try {
      await api.post("/api/budgets/", {
        category: selectedCategory,
        amount: parseFloat(amount),
        month, year,
      });
      setShowAdd(false);
      setAmount("");
      setSelectedCategory(null);
      showToast(t("budgetSaved") || "Budget saved!", "success");
      fetchData();
    } catch (e) {
      setShowAdd(false);
      fetchData();
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#4F46E5" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.screen}>
      <Toast visible={toast.visible} message={toast.message} type={toast.type} onHide={() => setToast({ ...toast, visible: false })} />

      {/* Top Header */}
      <View style={styles.topNav}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn} activeOpacity={0.7}>
          <Text style={styles.backArrow}>←</Text>
        </TouchableOpacity>
        <Text style={styles.navTitle}>{t("budget")}</Text>
        <TouchableOpacity style={styles.addNavBtn} onPress={() => setShowAdd(!showAdd)} activeOpacity={0.8}>
          <Text style={styles.addNavBtnText}>{showAdd ? "✕" : `+ ${t("add")}`}</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>

        {showAdd && (
          <View style={styles.addCard}>
            <Text style={styles.addTitle}>🎯 {t("setBudget")}</Text>
            <TextInput
              style={styles.input}
              placeholder={t("budgetAmount") + " (৳)"}
              placeholderTextColor="#94A3B8"
              value={amount}
              onChangeText={setAmount}
              keyboardType="numeric"
            />
            <Text style={styles.label}>{t("selectCategory")}:</Text>
            <View style={styles.categoryGrid}>
              {categories.map((cat) => {
                const isSelected = selectedCategory === cat.id;
                return (
                  <TouchableOpacity
                    key={cat.id}
                    style={[styles.catBtn, isSelected && { backgroundColor: "#4F46E5", borderColor: "#4F46E5" }]}
                    onPress={() => setSelectedCategory(cat.id)}
                    activeOpacity={0.7}>
                    <Text style={[styles.catText, isSelected && { color: "#FFFFFF", fontWeight: "700" }]}>
                      {cat.icon ? `${cat.icon} ` : ""}{cat.name}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
            <TouchableOpacity style={styles.saveBtn} onPress={handleAddBudget} activeOpacity={0.85}>
              <Text style={styles.saveBtnText}>{t("save")}</Text>
            </TouchableOpacity>
          </View>
        )}

        {budgets.length === 0 ? (
          <View style={styles.emptyBox}>
            <Text style={styles.emptyEmoji}>🎯</Text>
            <Text style={styles.emptyTitle}>{t("noBudgetSet") || "No budgets set yet"}</Text>
            <Text style={styles.emptySub}>Set a budget limit to track and control your monthly expenses.</Text>
          </View>
        ) : (
          budgets.map((budget) => {
            const spent = parseFloat(budget.spent || 0);
            const amt = parseFloat(budget.amount || 1);
            const remaining = parseFloat(budget.remaining || (amt - spent));
            const pct = Math.min(Math.round((spent / amt) * 100), 100);
            const meterColor = pct > 90 ? "#EF4444" : pct > 70 ? "#F59E0B" : "#10B981";

            return (
              <View key={budget.id} style={styles.budgetCard}>
                <View style={styles.budgetHeader}>
                  <View style={styles.catTitleRow}>
                    <View style={[styles.catIconCircle, { backgroundColor: `${meterColor}18` }]}>
                      <Text style={styles.catIconText}>{budget.category_name?.charAt(0) || "🎯"}</Text>
                    </View>
                    <Text style={styles.budgetName}>{budget.category_name || budget.category_detail?.name || t("category")}</Text>
                  </View>
                  <Text style={styles.budgetAmount}>৳{amt.toLocaleString()}</Text>
                </View>

                <View style={styles.progressBg}>
                  <View style={[styles.progressFill, { width: `${pct}%`, backgroundColor: meterColor }]} />
                </View>

                <View style={styles.budgetFooter}>
                  <Text style={styles.budgetSpent}>💸 {t("used")}: ৳{spent.toLocaleString()}</Text>
                  <Text style={styles.budgetRemaining}>💰 {t("remaining")}: ৳{remaining.toLocaleString()}</Text>
                  <Text style={[styles.budgetPct, { color: meterColor }]}>{pct}%</Text>
                </View>
              </View>
            );
          })
        )}

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
  navTitle: { fontSize: 18, fontWeight: "700", color: "#0F172A" },
  addNavBtn: {
    backgroundColor: "#4F46E5",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 16,
  },
  addNavBtnText: { color: "#FFFFFF", fontWeight: "700", fontSize: 13 },

  addCard: {
    backgroundColor: "#FFFFFF",
    marginTop: 16,
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  addTitle: { fontSize: 16, fontWeight: "700", color: "#0F172A", marginBottom: 14 },
  input: {
    backgroundColor: "#F8FAFC",
    borderWidth: 1.5,
    borderColor: "#E2E8F0",
    borderRadius: 16,
    padding: 14,
    marginBottom: 16,
    fontSize: 16,
    color: "#0F172A",
    fontWeight: "600",
  },
  label: { fontSize: 13, fontWeight: "600", color: "#64748B", marginBottom: 10 },
  categoryGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 18 },
  catBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    backgroundColor: "#F1F5F9",
  },
  catText: { fontSize: 12, color: "#334155", fontWeight: "600" },
  saveBtn: {
    backgroundColor: "#4F46E5",
    borderRadius: 18,
    paddingVertical: 14,
    alignItems: "center",
  },
  saveBtnText: { color: "#FFFFFF", fontWeight: "700", fontSize: 15 },

  budgetCard: {
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
  budgetHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
  catTitleRow: { flexDirection: "row", alignItems: "center" },
  catIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },
  catIconText: { fontSize: 16, fontWeight: "bold" },
  budgetName: { fontSize: 15, fontWeight: "700", color: "#0F172A" },
  budgetAmount: { fontSize: 16, fontWeight: "800", color: "#0F172A" },

  progressBg: { backgroundColor: "#F1F5F9", borderRadius: 8, height: 10, marginBottom: 12, overflow: "hidden" },
  progressFill: { height: 10, borderRadius: 8 },

  budgetFooter: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  budgetSpent: { fontSize: 12, color: "#EF4444", fontWeight: "600" },
  budgetRemaining: { fontSize: 12, color: "#10B981", fontWeight: "600" },
  budgetPct: { fontSize: 13, fontWeight: "800" },

  emptyBox: { alignItems: "center", paddingVertical: 60 },
  emptyEmoji: { fontSize: 44, marginBottom: 12 },
  emptyTitle: { fontSize: 16, fontWeight: "700", color: "#0F172A", marginBottom: 6 },
  emptySub: { fontSize: 13, color: "#64748B", textAlign: "center", paddingHorizontal: 30 },
});