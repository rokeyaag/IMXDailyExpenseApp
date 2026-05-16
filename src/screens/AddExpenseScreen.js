import React, { useState, useEffect } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, ScrollView, Platform, Modal, FlatList } from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { expenseAPI, categoryAPI } from "../services/api";
import Toast from "../components/Toast";
import { useLanguage } from "../context/LanguageContext";

export default function AddExpenseScreen({ navigation, route }) {
  const { t } = useLanguage();
  const defaultType = route?.params?.defaultType || "expense";
  const [type, setType] = useState(defaultType);
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState({ visible: false, message: "", type: "success" });

  useEffect(() => {
    categoryAPI.list().then(res => setCategories(res.data.results || res.data));
  }, []);

  const showToast = (message, type = "success") => {
    setToast({ visible: true, message, type });
  };

  const handleSave = async () => {
    if (!amount) { showToast(t("amountRequired"), "error"); return; }
    setLoading(true);
    try {
      const dateStr = date.toISOString().split("T")[0];
      await expenseAPI.create({ type, amount, note, date: dateStr, category: selectedCategory?.id || null });
      showToast(t("transactionSaved"));
      setTimeout(() => { navigation.navigate("Dashboard", { refresh: Date.now() }); }, 2000);
    } catch (e) { showToast(t("somethingWrong"), "error"); }
    finally { setLoading(false); }
  };

  const onDateChange = (event, selectedDate) => {
    setShowDatePicker(Platform.OS === "ios");
    if (selectedDate) setDate(selectedDate);
  };

  const formatDate = (d) => d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });

  return (
    <View style={{ flex: 1 }}>
      <Toast visible={toast.visible} message={toast.message} type={toast.type} onHide={() => setToast({ ...toast, visible: false })} />
      <ScrollView style={styles.container} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>{t("newTransaction")}</Text>

        <View style={styles.typeRow}>
          <TouchableOpacity style={[styles.typeBtn, type === "expense" && styles.typeBtnExpense]} onPress={() => setType("expense")}>
            <Text style={[styles.typeBtnText, type === "expense" && styles.typeBtnTextActive]}>{t("expense")}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.typeBtn, type === "income" && styles.typeBtnIncome]} onPress={() => setType("income")}>
            <Text style={[styles.typeBtnText, type === "income" && styles.typeBtnTextActive]}>{t("income")}</Text>
          </TouchableOpacity>
        </View>

        <TextInput style={styles.input} placeholder={t("enterAmount") + " (Tk)"} placeholderTextColor="#9ca3af" value={amount} onChangeText={setAmount} keyboardType="numeric" />

        <TextInput style={styles.input} placeholder={t("enterNote")} placeholderTextColor="#9ca3af" value={note} onChangeText={setNote} />

        <TouchableOpacity style={styles.dateBtn} onPress={() => setShowDatePicker(true)}>
          <Text style={styles.dateBtnLabel}>{t("date")}</Text>
          <Text style={styles.dateBtnValue}>{formatDate(date)}</Text>
        </TouchableOpacity>
        {showDatePicker && (<DateTimePicker value={date} mode="date" display="default" onChange={onDateChange} maximumDate={new Date()} />)}

        <View style={styles.categoryHeader}>
          <Text style={styles.label}>{t("category")}</Text>
          <TouchableOpacity style={styles.newCatBtn} onPress={() => navigation.navigate("Categories")}>
            <Text style={styles.newCatBtnText}>+ {t("add")}</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={[styles.dropdownBtn, selectedCategory && { borderColor: selectedCategory.color || "#6366F1" }]} onPress={() => setShowDropdown(true)}>
          {selectedCategory ? (
            <View style={styles.dropdownSelected}>
              <View style={[styles.dropdownIconBox, { backgroundColor: selectedCategory.color || "#6366F1" }]}>
                <Text style={styles.dropdownIconText}>{selectedCategory.icon || selectedCategory.name?.charAt(0)}</Text>
              </View>
              <Text style={styles.dropdownSelectedText}>{selectedCategory.name}</Text>
            </View>
          ) : (<Text style={styles.dropdownPlaceholder}>{t("selectCategory")}</Text>)}
          <Text style={styles.dropdownArrow}>v</Text>
        </TouchableOpacity>

        <Modal visible={showDropdown} transparent animationType="slide">
          <TouchableOpacity style={styles.modalOverlay} onPress={() => setShowDropdown(false)} activeOpacity={1}>
            <View style={styles.modalBox}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>{t("selectCategory")}</Text>
                <TouchableOpacity onPress={() => setShowDropdown(false)}>
                  <Text style={styles.modalClose}>X</Text>
                </TouchableOpacity>
              </View>
              <FlatList data={categories} keyExtractor={(item) => item.id.toString()} renderItem={({ item }) => (
                <TouchableOpacity style={[styles.dropdownItem, selectedCategory?.id === item.id && styles.dropdownItemActive]} onPress={() => { setSelectedCategory(item); setShowDropdown(false); }}>
                  <View style={[styles.dropdownItemIcon, { backgroundColor: item.color || "#6366F1" }]}>
                    <Text style={styles.dropdownItemIconText}>{item.icon || item.name?.charAt(0)}</Text>
                  </View>
                  <Text style={[styles.dropdownItemText, selectedCategory?.id === item.id && { color: "#6366F1", fontWeight: "700" }]}>
                    {item.name}
                  </Text>
                </TouchableOpacity>
              )} />
            </View>
          </TouchableOpacity>
        </Modal>

        <TouchableOpacity style={[styles.saveBtn, { backgroundColor: type === "income" ? "#10B981" : "#EF4444" }]} onPress={handleSave} disabled={loading}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveBtnText}>{t("save")}</Text>}
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container:            { flex: 1, backgroundColor: "#f0f0ff", padding: 20 },
  title:                { fontSize: 24, fontWeight: "bold", color: "#1f2937", marginBottom: 24, marginTop: 10 },
  typeRow:              { flexDirection: "row", gap: 12, marginBottom: 20 },
  typeBtn:              { flex: 1, padding: 14, borderRadius: 12, borderWidth: 1, borderColor: "#e5e7eb", alignItems: "center", backgroundColor: "#fff" },
  typeBtnExpense:       { backgroundColor: "#EF4444", borderColor: "#EF4444" },
  typeBtnIncome:        { backgroundColor: "#10B981", borderColor: "#10B981" },
  typeBtnText:          { fontSize: 16, color: "#6b7280", fontWeight: "600" },
  typeBtnTextActive:    { color: "#fff" },
  input:                { backgroundColor: "#fff", borderWidth: 1, borderColor: "#e5e7eb", borderRadius: 12, padding: 14, marginBottom: 16, fontSize: 16, color: "#1f2937" },
  dateBtn:              { backgroundColor: "#fff", borderWidth: 1, borderColor: "#e5e7eb", borderRadius: 12, padding: 14, marginBottom: 20, flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  dateBtnLabel:         { fontSize: 16, color: "#9ca3af" },
  dateBtnValue:         { fontSize: 16, color: "#1f2937", fontWeight: "600" },
  categoryHeader:       { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 10 },
  label:                { fontSize: 16, fontWeight: "600", color: "#1f2937" },
  newCatBtn:            { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20, borderWidth: 1, borderColor: "#6366F1" },
  newCatBtnText:        { fontSize: 13, color: "#6366F1", fontWeight: "bold" },
  dropdownBtn:          { backgroundColor: "#fff", borderWidth: 1.5, borderColor: "#e5e7eb", borderRadius: 12, padding: 14, marginBottom: 24, flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  dropdownSelected:     { flexDirection: "row", alignItems: "center", gap: 10 },
  dropdownIconBox:      { width: 32, height: 32, borderRadius: 16, justifyContent: "center", alignItems: "center" },
  dropdownIconText:     { fontSize: 14, fontWeight: "bold", color: "#fff" },
  dropdownSelectedText: { fontSize: 15, color: "#1f2937", fontWeight: "600" },
  dropdownPlaceholder:  { fontSize: 15, color: "#9ca3af" },
  dropdownArrow:        { fontSize: 12, color: "#9ca3af" },
  modalOverlay:         { flex: 1, backgroundColor: "rgba(0,0,0,0.4)", justifyContent: "flex-end" },
  modalBox:             { backgroundColor: "#fff", borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: "70%", paddingBottom: 30 },
  modalHeader:          { flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 20, borderBottomWidth: 1, borderBottomColor: "#f3f4f6" },
  modalTitle:           { fontSize: 18, fontWeight: "bold", color: "#1f2937" },
  modalClose:           { fontSize: 18, color: "#6b7280", fontWeight: "bold" },
  dropdownItem:         { flexDirection: "row", alignItems: "center", paddingHorizontal: 20, paddingVertical: 14, gap: 14, borderBottomWidth: 1, borderBottomColor: "#f9fafb" },
  dropdownItemActive:   { backgroundColor: "#f0f0ff" },
  dropdownItemIcon:     { width: 40, height: 40, borderRadius: 20, justifyContent: "center", alignItems: "center" },
  dropdownItemIconText: { fontSize: 14, fontWeight: "bold", color: "#fff" },
  dropdownItemText:     { flex: 1, fontSize: 15, color: "#1f2937", fontWeight: "500" },
  saveBtn:              { borderRadius: 12, padding: 16, alignItems: "center", marginBottom: 40, elevation: 3 },
  saveBtnText:          { color: "#fff", fontSize: 16, fontWeight: "bold" },
});