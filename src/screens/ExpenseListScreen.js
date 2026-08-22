import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Alert, TextInput, RefreshControl, ScrollView, Platform, SafeAreaView } from "react-native";
import { expenseAPI, categoryAPI } from "../services/api";
import { useLanguage } from "../context/LanguageContext";
import Toast from "../components/Toast";

export default function ExpenseListScreen({ navigation }) {
  const { t, language } = useLanguage();
  const [expenses, setExpenses] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedType, setSelectedType] = useState(null);
  const [toast, setToast] = useState({ visible: false, message: "", type: "success" });
  const showToast = (message, type = "success") => setToast({ visible: true, message, type });

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      const [expRes, catRes] = await Promise.allSettled([
        expenseAPI.list({ page_size: 500 }),
        categoryAPI.list(),
      ]);
      if (expRes.status === "fulfilled" && expRes.value?.data) {
        setExpenses(expRes.value.data.results || expRes.value.data || []);
      }
      if (catRes.status === "fulfilled" && catRes.value?.data) {
        setCategories(catRes.value.data.results || catRes.value.data || []);
      }
    } catch (e) {
      setExpenses([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => { setRefreshing(true); fetchData(); };

  const handleDelete = (id) => {
    Alert.alert(t("delete"), t("deleteThisTxn"), [
      { text: t("cancel"), style: "cancel" },
      {
        text: t("delete"),
        style: "destructive",
        onPress: async () => {
          try {
            await expenseAPI.delete(id);
            setExpenses(expenses.filter(e => e.id !== id));
            showToast(t("transactionDeleted") || "Deleted", "success");
          } catch (e) {}
        },
      },
    ]);
  };

  const filtered = expenses.filter(e => {
    const matchSearch = (e.note || "").toLowerCase().includes(search.toLowerCase());
    const matchCategory = selectedCategory ? (e.category === selectedCategory || e.category_detail?.id === selectedCategory) : true;
    const matchType = selectedType ? e.type === selectedType : true;
    return matchSearch && matchCategory && matchType;
  });

  const renderItem = ({ item }) => {
    const isIncome = item.type === "income";
    const amt = parseFloat(item.amount || 0);
    const catIcon = item.category_detail?.icon || (isIncome ? "💰" : "🛍️");
    const catColor = item.category_detail?.color || (isIncome ? "#10B981" : "#EF4444");

    return (
      <TouchableOpacity
        style={styles.txCard}
        onPress={() => navigation.navigate("EditExpense", { expense: item })}
        activeOpacity={0.75}>
        <View style={[styles.txIconWrap, { backgroundColor: `${catColor}18` }]}>
          <Text style={styles.txEmoji}>{catIcon}</Text>
        </View>

        <View style={styles.txInfo}>
          <Text style={styles.txTitle} numberOfLines={1}>
            {item.note || item.category_detail?.name || (isIncome ? t("income") : t("expense"))}
          </Text>
          <Text style={styles.txSubtitle}>
            {item.category_detail?.name || (isIncome ? "Income" : "Expense")} · {new Date(item.date).toLocaleDateString(language === "bn" ? "bn-BD" : "en", { day: "numeric", month: "short", year: "numeric" })}
          </Text>
        </View>

        <View style={styles.txAmountBlock}>
          <Text style={[styles.txAmount, { color: isIncome ? "#10B981" : "#0F172A" }]}>
            {isIncome ? "+" : "-"}৳{amt.toLocaleString()}
          </Text>
          <TouchableOpacity onPress={() => handleDelete(item.id)} style={styles.deleteQuickBtn} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <Text style={styles.deleteQuickText}>✕</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
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
        <Text style={styles.navTitle}>{t("btnHistory") || "Transaction History"}</Text>
        <TouchableOpacity onPress={() => navigation.navigate("AddExpense")} style={styles.addBtn} activeOpacity={0.8}>
          <Text style={styles.addBtnText}>+ {t("add")}</Text>
        </TouchableOpacity>
      </View>

      {/* Search Input */}
      <View style={styles.searchWrap}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          style={styles.searchInput}
          placeholder={t("searchTransactions") || "Search notes or categories..."}
          placeholderTextColor="#94A3B8"
          value={search}
          onChangeText={setSearch}
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => setSearch("")}>
            <Text style={styles.clearSearchText}>✕</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Type Filter Pills */}
      <View style={styles.typeFilterRow}>
        {[
          { key: null, label: t("all") || "All" },
          { key: "expense", label: `💸 ${t("expense") || "Expense"}` },
          { key: "income", label: `💰 ${t("income") || "Income"}` },
        ].map((item) => {
          const isSelected = selectedType === item.key;
          return (
            <TouchableOpacity
              key={item.key || "all"}
              style={[styles.typeFilterPill, isSelected && styles.typeFilterPillActive]}
              onPress={() => setSelectedType(item.key)}
              activeOpacity={0.8}>
              <Text style={[styles.typeFilterText, isSelected && styles.typeFilterTextActive]}>
                {item.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Category Horizontal Filter */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.catFilterScroll} contentContainerStyle={{ paddingHorizontal: 16 }}>
        <TouchableOpacity
          style={[styles.catFilterChip, selectedCategory === null && styles.catFilterChipActive]}
          onPress={() => setSelectedCategory(null)}
          activeOpacity={0.7}>
          <Text style={[styles.catFilterChipText, selectedCategory === null && styles.catFilterChipTextActive]}>🏷️ {t("all") || "All Categories"}</Text>
        </TouchableOpacity>
        {categories.map((cat) => {
          const isSelected = selectedCategory === cat.id;
          return (
            <TouchableOpacity
              key={cat.id}
              style={[styles.catFilterChip, isSelected && { backgroundColor: "#4F46E5", borderColor: "#4F46E5" }]}
              onPress={() => setSelectedCategory(isSelected ? null : cat.id)}
              activeOpacity={0.7}>
              <Text style={[styles.catFilterChipText, isSelected && { color: "#FFFFFF", fontWeight: "700" }]}>
                {cat.icon} {cat.name}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      <Text style={styles.countText}>{filtered.length} {t("transactionsFound") || "transactions found"}</Text>

      <FlatList
        data={filtered}
        keyExtractor={(item) => (item.id || Math.random()).toString()}
        renderItem={renderItem}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={["#4F46E5"]} />}
        ListEmptyComponent={
          <View style={styles.emptyWrap}>
            <Text style={styles.emptyEmoji}>🍃</Text>
            <Text style={styles.emptyTitle}>{t("noResults") || "No transactions found"}</Text>
          </View>
        }
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#F8FAFC" },
  center: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#F8FAFC" },

  topNav: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: Platform.OS === "ios" ? 10 : 20,
    paddingBottom: 14,
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
  addBtn: {
    backgroundColor: "#4F46E5",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 16,
  },
  addBtnText: { color: "#FFFFFF", fontWeight: "700", fontSize: 13 },

  searchWrap: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    marginHorizontal: 16,
    marginTop: 14,
    marginBottom: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 1,
  },
  searchIcon: { fontSize: 16, marginRight: 8 },
  searchInput: { flex: 1, fontSize: 14, color: "#0F172A", padding: 0 },
  clearSearchText: { fontSize: 14, color: "#94A3B8", paddingHorizontal: 6 },

  typeFilterRow: { flexDirection: "row", gap: 8, paddingHorizontal: 16, marginBottom: 10 },
  typeFilterPill: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    paddingVertical: 8,
    borderRadius: 14,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  typeFilterPillActive: { backgroundColor: "#0F172A", borderColor: "#0F172A" },
  typeFilterText: { fontSize: 12, fontWeight: "600", color: "#475569" },
  typeFilterTextActive: { color: "#FFFFFF", fontWeight: "700" },

  catFilterScroll: { maxHeight: 40, marginBottom: 8 },
  catFilterChip: {
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 14,
    marginRight: 8,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    alignItems: "center",
    justifyContent: "center",
  },
  catFilterChipActive: { backgroundColor: "#0F172A", borderColor: "#0F172A" },
  catFilterChipText: { fontSize: 12, color: "#475569", fontWeight: "500" },
  catFilterChipTextActive: { color: "#FFFFFF", fontWeight: "700" },

  countText: { fontSize: 11, fontWeight: "600", color: "#64748B", paddingHorizontal: 16, marginBottom: 8 },
  listContainer: { paddingHorizontal: 16, paddingBottom: 30 },

  txCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    padding: 14,
    borderRadius: 20,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 1,
  },
  txIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  txEmoji: { fontSize: 20 },
  txInfo: { flex: 1 },
  txTitle: { fontSize: 14, fontWeight: "700", color: "#0F172A" },
  txSubtitle: { fontSize: 11, fontWeight: "500", color: "#64748B", marginTop: 2 },

  txAmountBlock: { alignItems: "flex-end" },
  txAmount: { fontSize: 15, fontWeight: "700", marginBottom: 2 },
  deleteQuickBtn: { padding: 4 },
  deleteQuickText: { fontSize: 12, color: "#94A3B8", fontWeight: "bold" },

  emptyWrap: { alignItems: "center", paddingVertical: 60 },
  emptyEmoji: { fontSize: 40, marginBottom: 10 },
  emptyTitle: { fontSize: 15, fontWeight: "600", color: "#64748B" },
});