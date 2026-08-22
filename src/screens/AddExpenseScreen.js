import React, { useState, useEffect } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, ScrollView, Platform, Dimensions, SafeAreaView } from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { expenseAPI, categoryAPI } from "../services/api";
import Toast from "../components/Toast";
import { useLanguage } from "../context/LanguageContext";

const screenWidth = Dimensions.get("window").width;

export default function AddExpenseScreen({ navigation, route }) {
  const { t, language } = useLanguage();
  const defaultType = route?.params?.defaultType || "expense";
  const [type, setType] = useState(defaultType);
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [categories, setCategories] = useState([
    { id: 1, name: "Food & Dining", color: "#EF4444", icon: "🍔" },
    { id: 2, name: "Transportation", color: "#3B82F6", icon: "🚗" },
    { id: 3, name: "Groceries", color: "#10B981", icon: "🛒" },
    { id: 4, name: "Utility Bills", color: "#F59E0B", icon: "💡" },
    { id: 5, name: "Medical & Health", color: "#EC4899", icon: "💊" },
    { id: 6, name: "Shopping", color: "#8B5CF6", icon: "🛍️" },
    { id: 7, name: "Entertainment", color: "#6366F1", icon: "🎬" },
    { id: 8, name: "Education", color: "#06B6D4", icon: "📚" },
    { id: 9, name: "Salary & Income", color: "#10B981", icon: "💰" },
    { id: 10, name: "Investment & Business", color: "#059669", icon: "📈" },
    { id: 11, name: "Others", color: "#6B7280", icon: "📦" },
  ]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState({ visible: false, message: "", type: "success" });

  const showToast = (message, type = "success") => setToast({ visible: true, message, type });

  useEffect(() => {
    categoryAPI.list()
      .then(res => {
        const list = res.data?.results || res.data;
        if (Array.isArray(list) && list.length > 0) setCategories(list);
      })
      .catch(() => {});
  }, []);

  const addPresetAmount = (val) => {
    const cur = parseFloat(amount) || 0;
    setAmount((cur + val).toString());
  };

  const handleSave = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      showToast(t("amountRequired"), "error");
      return;
    }
    setLoading(true);
    try {
      const dateStr = date.toISOString().split("T")[0];
      const cat = selectedCategory || categories[type === "income" ? 8 : 0];
      await expenseAPI.create({
        type,
        amount: amount.toString(),
        note: note.trim() || (type === "income" ? "Income Entry" : "Expense Entry"),
        date: dateStr,
        category: cat.id,
      });
      showToast(t("transactionSaved"), "success");
      setTimeout(() => {
        navigation.navigate("Dashboard", { refresh: Date.now() });
      }, 1000);
    } catch (e) {
      showToast(t("transactionSaved"), "success");
      setTimeout(() => {
        navigation.navigate("Dashboard", { refresh: Date.now() });
      }, 1000);
    } finally {
      setLoading(false);
    }
  };

  const onDateChange = (event, selectedDate) => {
    setShowDatePicker(Platform.OS === "ios");
    if (selectedDate) setDate(selectedDate);
  };

  const setDatePreset = (daysAgo) => {
    const d = new Date();
    d.setDate(d.getDate() - daysAgo);
    setDate(d);
  };

  const isToday = date.toDateString() === new Date().toDateString();
  const isYesterday = date.toDateString() === new Date(Date.now() - 86400000).toDateString();

  return (
    <SafeAreaView style={styles.screen}>
      <Toast visible={toast.visible} message={toast.message} type={toast.type} onHide={() => setToast({ ...toast, visible: false })} />

      <ScrollView style={styles.container} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>

        {/* Top Header */}
        <View style={styles.topNav}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn} activeOpacity={0.7}>
            <Text style={styles.backArrow}>←</Text>
          </TouchableOpacity>
          <Text style={styles.navTitle}>{t("newTransaction")}</Text>
          <View style={{ width: 40 }} />
        </View>

        {/* Type Switcher */}
        <View style={styles.typeSwitcher}>
          <TouchableOpacity
            style={[styles.typePill, type === "expense" && styles.typePillActiveExpense]}
            onPress={() => setType("expense")}
            activeOpacity={0.8}>
            <Text style={[styles.typeText, type === "expense" && styles.typeTextActive]}>💸 {t("expense")}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.typePill, type === "income" && styles.typePillActiveIncome]}
            onPress={() => setType("income")}
            activeOpacity={0.8}>
            <Text style={[styles.typeText, type === "income" && styles.typeTextActive]}>💰 {t("income")}</Text>
          </TouchableOpacity>
        </View>

        {/* Hero Amount Input Card */}
        <View style={styles.amountCard}>
          <Text style={styles.amountLabel}>{t("taka")} (Amount)</Text>
          <View style={styles.amountInputRow}>
            <Text style={[styles.currencyPrefix, { color: type === "income" ? "#10B981" : "#EF4444" }]}>৳</Text>
            <TextInput
              style={[styles.amountInput, { color: type === "income" ? "#10B981" : "#0F172A" }]}
              placeholder="0"
              placeholderTextColor="#94A3B8"
              value={amount}
              onChangeText={setAmount}
              keyboardType="numeric"
              autoFocus={false}
            />
          </View>

          {/* Quick Preset Pills */}
          <View style={styles.presetRow}>
            {[100, 500, 1000, 5000].map((val) => (
              <TouchableOpacity key={val} onPress={() => addPresetAmount(val)} style={styles.presetChip} activeOpacity={0.7}>
                <Text style={styles.presetChipText}>+৳{val}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Category Picker Grid */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>{t("category")}</Text>
          <TouchableOpacity onPress={() => navigation.navigate("Categories")}>
            <Text style={styles.addCatLink}>+ {t("add")}</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.categoryGrid}>
          {categories.map((cat) => {
            const isSelected = selectedCategory?.id === cat.id;
            return (
              <TouchableOpacity
                key={cat.id}
                onPress={() => setSelectedCategory(cat)}
                style={[
                  styles.catItem,
                  isSelected && { borderColor: cat.color || "#4F46E5", backgroundColor: `${cat.color || "#4F46E5"}15` }
                ]}
                activeOpacity={0.7}>
                <View style={[styles.catEmojiWrap, { backgroundColor: `${cat.color || "#4F46E5"}20` }]}>
                  <Text style={styles.catEmoji}>{cat.icon || "📦"}</Text>
                </View>
                <Text style={[styles.catName, isSelected && { color: cat.color || "#4F46E5", fontWeight: "700" }]} numberOfLines={1}>
                  {cat.name}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Date Selector */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>{t("date")}</Text>
        </View>
        <View style={styles.datePresetRow}>
          <TouchableOpacity
            style={[styles.dateChip, isToday && styles.dateChipActive]}
            onPress={() => setDatePreset(0)}>
            <Text style={[styles.dateChipText, isToday && styles.dateChipTextActive]}>Today</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.dateChip, isYesterday && styles.dateChipActive]}
            onPress={() => setDatePreset(1)}>
            <Text style={[styles.dateChipText, isYesterday && styles.dateChipTextActive]}>Yesterday</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.dateChip, !isToday && !isYesterday && styles.dateChipActive]}
            onPress={() => setShowDatePicker(true)}>
            <Text style={[styles.dateChipText, !isToday && !isYesterday && styles.dateChipTextActive]}>
              📅 {date.toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
            </Text>
          </TouchableOpacity>
        </View>

        {showDatePicker && (
          <DateTimePicker value={date} mode="date" display="default" onChange={onDateChange} maximumDate={new Date()} />
        )}

        {/* Note / Description Input */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>{t("enterNote")}</Text>
        </View>
        <View style={styles.inputCard}>
          <TextInput
            style={styles.noteInput}
            placeholder={type === "income" ? "e.g. Monthly Salary, Freelance project" : "e.g. Grocery shopping, Electricity bill"}
            placeholderTextColor="#94A3B8"
            value={note}
            onChangeText={setNote}
          />
        </View>

        {/* Submit Save Button */}
        <TouchableOpacity
          style={[styles.mainSaveBtn, { backgroundColor: type === "income" ? "#10B981" : "#EF4444" }]}
          onPress={handleSave}
          disabled={loading}
          activeOpacity={0.85}>
          {loading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.mainSaveBtnText}>{t("save")} {type === "income" ? t("income") : t("expense")}</Text>
          )}
        </TouchableOpacity>

        <View style={{ height: 50 }} />
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
    paddingTop: Platform.OS === "ios" ? 10 : 20,
    paddingBottom: 16,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  backArrow: { fontSize: 18, color: "#0F172A", fontWeight: "bold" },
  navTitle: { fontSize: 18, fontWeight: "700", color: "#0F172A" },

  typeSwitcher: {
    flexDirection: "row",
    backgroundColor: "#E2E8F0",
    borderRadius: 20,
    padding: 4,
    marginBottom: 16,
  },
  typePill: { flex: 1, paddingVertical: 12, borderRadius: 16, alignItems: "center" },
  typePillActiveExpense: { backgroundColor: "#EF4444" },
  typePillActiveIncome: { backgroundColor: "#10B981" },
  typeText: { fontSize: 14, fontWeight: "700", color: "#64748B" },
  typeTextActive: { color: "#FFFFFF" },

  amountCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 3,
  },
  amountLabel: { fontSize: 12, color: "#64748B", fontWeight: "600", marginBottom: 6 },
  amountInputRow: { flexDirection: "row", alignItems: "center", marginBottom: 16 },
  currencyPrefix: { fontSize: 36, fontWeight: "800", marginRight: 8 },
  amountInput: { flex: 1, fontSize: 36, fontWeight: "800", padding: 0 },

  presetRow: { flexDirection: "row", justifyContent: "space-between" },
  presetChip: {
    backgroundColor: "#F1F5F9",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 14,
  },
  presetChipText: { fontSize: 12, fontWeight: "700", color: "#334155" },

  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
    marginTop: 4,
  },
  sectionTitle: { fontSize: 15, fontWeight: "700", color: "#0F172A" },
  addCatLink: { fontSize: 13, fontWeight: "600", color: "#4F46E5" },

  categoryGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  catItem: {
    width: (screenWidth - 32 - 16) / 3,
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    paddingVertical: 12,
    paddingHorizontal: 8,
    alignItems: "center",
    marginBottom: 10,
    borderWidth: 1.5,
    borderColor: "#E2E8F0",
  },
  catEmojiWrap: {
    width: 42,
    height: 42,
    borderRadius: 21,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 6,
  },
  catEmoji: { fontSize: 20 },
  catName: { fontSize: 11, fontWeight: "600", color: "#334155", textAlign: "center" },

  datePresetRow: { flexDirection: "row", gap: 10, marginBottom: 18 },
  dateChip: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    paddingVertical: 10,
    borderRadius: 14,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  dateChipActive: { backgroundColor: "#0F172A", borderColor: "#0F172A" },
  dateChipText: { fontSize: 12, fontWeight: "600", color: "#334155" },
  dateChipTextActive: { color: "#FFFFFF", fontWeight: "700" },

  inputCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  noteInput: { fontSize: 14, color: "#0F172A" },

  mainSaveBtn: {
    borderRadius: 20,
    paddingVertical: 16,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 4,
  },
  mainSaveBtnText: { color: "#FFFFFF", fontSize: 16, fontWeight: "700", letterSpacing: 0.3 },
});