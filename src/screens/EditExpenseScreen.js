import React, { useState, useEffect } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, ScrollView, Platform, Dimensions, SafeAreaView } from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { expenseAPI, categoryAPI } from "../services/api";
import { useLanguage } from "../context/LanguageContext";

const screenWidth = Dimensions.get("window").width;

export default function EditExpenseScreen({ navigation, route }) {
  const { t } = useLanguage();
  const { expense } = route.params;
  const [type, setType] = useState(expense.type);
  const [amount, setAmount] = useState(expense.amount.toString());
  const [note, setNote] = useState(expense.note || "");
  const [date, setDate] = useState(new Date(expense.date));
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
  const [selectedCategory, setSelectedCategory] = useState(expense.category || expense.category_detail?.id || 1);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    categoryAPI.list().then(res => {
      const cats = res.data?.results || res.data;
      if (Array.isArray(cats) && cats.length > 0) {
        setCategories(cats);
      }
    }).catch(() => {});
  }, []);

  const addPresetAmount = (val) => {
    const cur = parseFloat(amount) || 0;
    setAmount((cur + val).toString());
  };

  const handleUpdate = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      Alert.alert(t("error"), t("amountRequired"));
      return;
    }
    setLoading(true);
    try {
      const dateStr = date.toISOString().split("T")[0];
      await expenseAPI.update(expense.id, {
        type,
        amount: amount.toString(),
        note: note.trim() || (type === "income" ? "Income Entry" : "Expense Entry"),
        date: dateStr,
        category: selectedCategory,
      });
      navigation.goBack();
    } catch (e) {
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const onDateChange = (event, selectedDate) => {
    setShowDatePicker(Platform.OS === "ios");
    if (selectedDate) setDate(selectedDate);
  };

  const handleDelete = () => {
    Alert.alert(t("deleteTransaction"), t("deleteThisTxn"), [
      { text: t("cancel"), style: "cancel" },
      {
        text: t("delete"),
        style: "destructive",
        onPress: async () => {
          try {
            await expenseAPI.delete(expense.id);
            navigation.goBack();
          } catch {
            navigation.goBack();
          }
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.screen}>
      <ScrollView style={styles.container} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>

        {/* Top Header */}
        <View style={styles.topNav}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn} activeOpacity={0.7}>
            <Text style={styles.backArrow}>←</Text>
          </TouchableOpacity>
          <Text style={styles.navTitle}>{t("editTransaction")}</Text>
          <TouchableOpacity onPress={handleDelete} style={styles.trashBtn} activeOpacity={0.7}>
            <Text style={styles.trashIcon}>🗑️</Text>
          </TouchableOpacity>
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

        {/* Amount Input Card */}
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
        </View>

        <View style={styles.categoryGrid}>
          {categories.map((cat) => {
            const isSelected = selectedCategory === cat.id;
            return (
              <TouchableOpacity
                key={cat.id}
                onPress={() => setSelectedCategory(cat.id)}
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
        <TouchableOpacity style={styles.datePickerBtn} onPress={() => setShowDatePicker(true)} activeOpacity={0.7}>
          <Text style={styles.datePickerText}>📅 {date.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}</Text>
          <Text style={styles.changeDateLabel}>Change Date →</Text>
        </TouchableOpacity>

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
            placeholder={t("enterNote")}
            placeholderTextColor="#94A3B8"
            value={note}
            onChangeText={setNote}
          />
        </View>

        {/* Submit Update Button */}
        <TouchableOpacity
          style={[styles.mainSaveBtn, { backgroundColor: type === "income" ? "#10B981" : "#4F46E5" }]}
          onPress={handleUpdate}
          disabled={loading}
          activeOpacity={0.85}>
          {loading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.mainSaveBtnText}>{t("update")} {type === "income" ? t("income") : t("expense")}</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity style={styles.deleteOutlineBtn} onPress={handleDelete} activeOpacity={0.7}>
          <Text style={styles.deleteOutlineBtnText}>🗑️ {t("delete")}</Text>
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
  trashBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#FEF2F2",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#FEE2E2",
  },
  trashIcon: { fontSize: 16 },

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

  datePickerBtn: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 18,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  datePickerText: { fontSize: 14, fontWeight: "700", color: "#0F172A" },
  changeDateLabel: { fontSize: 12, fontWeight: "600", color: "#4F46E5" },

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
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 4,
  },
  mainSaveBtnText: { color: "#FFFFFF", fontSize: 16, fontWeight: "700", letterSpacing: 0.3 },

  deleteOutlineBtn: {
    borderRadius: 20,
    paddingVertical: 14,
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderWidth: 1.5,
    borderColor: "#FEE2E2",
  },
  deleteOutlineBtnText: { color: "#EF4444", fontSize: 14, fontWeight: "700" },
});