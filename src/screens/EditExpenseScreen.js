import React, { useState, useEffect } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, ScrollView, Platform, Modal, FlatList } from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { expenseAPI, categoryAPI } from "../services/api";

export default function EditExpenseScreen({ navigation, route }) {
  const { expense } = route.params;
  const [type, setType] = useState(expense.type);
  const [amount, setAmount] = useState(expense.amount.toString());
  const [note, setNote] = useState(expense.note || "");
  const [date, setDate] = useState(new Date(expense.date));
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(expense.category);
  const [selectedCategoryName, setSelectedCategoryName] = useState("Select Category");
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    categoryAPI.list().then(res => {
      const cats = res.data.results || res.data;
      setCategories(cats);
      const current = cats.find(c => c.id === expense.category);
      if (current) setSelectedCategoryName(`${current.icon} ${current.name}`);
    });
  }, []);

  const handleUpdate = async () => {
    if (!amount) { Alert.alert("Error", "Please enter amount"); return; }
    setLoading(true);
    try {
      const dateStr = date.toISOString().split("T")[0];
      await expenseAPI.update(expense.id, { type, amount, note, date: dateStr, category: selectedCategory });
      Alert.alert("Success", "Transaction updated!");
      navigation.goBack();
    } catch (e) { Alert.alert("Error", "Something went wrong"); }
    finally { setLoading(false); }
  };

  const onDateChange = (event, selectedDate) => {
    setShowDatePicker(Platform.OS === "ios");
    if (selectedDate) setDate(selectedDate);
  };

  const formatDate = (d) => {
    return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
  };

  const selectCategory = (cat) => {
    setSelectedCategory(cat.id);
    setSelectedCategoryName(`${cat.icon} ${cat.name}`);
    setShowCategoryModal(false);
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Edit Transaction</Text>

      <View style={styles.typeRow}>
        <TouchableOpacity
          style={[styles.typeBtn, type === "expense" && styles.typeBtnExpense]}
          onPress={() => setType("expense")}>
          <Text style={[styles.typeBtnText, type === "expense" && styles.typeBtnTextActive]}>Expense</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.typeBtn, type === "income" && styles.typeBtnIncome]}
          onPress={() => setType("income")}>
          <Text style={[styles.typeBtnText, type === "income" && styles.typeBtnTextActive]}>Income</Text>
        </TouchableOpacity>
      </View>

      <TextInput style={styles.input} placeholder="Amount (Tk)" placeholderTextColor="#9ca3af" value={amount} onChangeText={setAmount} keyboardType="numeric" color="#1f2937" />
      <TextInput style={styles.input} placeholder="Note (optional)" placeholderTextColor="#9ca3af" value={note} onChangeText={setNote} color="#1f2937" />

      <TouchableOpacity style={styles.dateBtn} onPress={() => setShowDatePicker(true)}>
        <Text style={styles.dateBtnLabel}>Date</Text>
        <Text style={styles.dateBtnValue}>{formatDate(date)}</Text>
      </TouchableOpacity>

      {showDatePicker && (
        <DateTimePicker
          value={date}
          mode="date"
          display="default"
          onChange={onDateChange}
          maximumDate={new Date()}
        />
      )}

      <View style={styles.categoryHeader}>
        <Text style={styles.label}>Category</Text>
      </View>

      <TouchableOpacity style={styles.dropdownBtn} onPress={() => setShowCategoryModal(true)}>
        <Text style={[styles.dropdownText, !selectedCategory && { color: "#9ca3af" }]}>{selectedCategoryName}</Text>
        <Text style={styles.dropdownArrow}>?</Text>
      </TouchableOpacity>

      <Modal visible={showCategoryModal} transparent animationType="slide">
        <TouchableOpacity style={styles.modalOverlay} onPress={() => setShowCategoryModal(false)}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Select Category</Text>
            <FlatList
              data={categories}
              keyExtractor={(item) => item.id.toString()}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[styles.modalItem, selectedCategory === item.id && { backgroundColor: item.color + "20" }]}
                  onPress={() => selectCategory(item)}>
                  <View style={[styles.modalIconBox, { backgroundColor: item.color || "#6366F1" }]}>
                    <Text style={styles.modalIcon}>{item.icon}</Text>
                  </View>
                  <Text style={styles.modalItemText}>{item.name}</Text>
                  {selectedCategory === item.id && <Text style={styles.checkMark}>?</Text>}
                </TouchableOpacity>
              )}
            />
          </View>
        </TouchableOpacity>
      </Modal>

      <TouchableOpacity
        style={[styles.saveBtn, type === "income" && { backgroundColor: "#10B981" }]}
        onPress={handleUpdate}
        disabled={loading}>
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveBtnText}>Update</Text>}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container:          { flex: 1, backgroundColor: "#f8f9fa", padding: 20 },
  title:              { fontSize: 24, fontWeight: "bold", color: "#1f2937", marginBottom: 24, marginTop: 10 },
  typeRow:            { flexDirection: "row", gap: 12, marginBottom: 20 },
  typeBtn:            { flex: 1, padding: 14, borderRadius: 12, borderWidth: 1, borderColor: "#e5e7eb", alignItems: "center", backgroundColor: "#fff" },
  typeBtnExpense:     { backgroundColor: "#EF4444", borderColor: "#EF4444" },
  typeBtnIncome:      { backgroundColor: "#10B981", borderColor: "#10B981" },
  typeBtnText:        { fontSize: 16, color: "#6b7280", fontWeight: "600" },
  typeBtnTextActive:  { color: "#fff" },
  input:              { backgroundColor: "#fff", borderWidth: 1, borderColor: "#e5e7eb", borderRadius: 12, padding: 14, marginBottom: 16, fontSize: 16, color: "#1f2937" },
  dateBtn:            { backgroundColor: "#fff", borderWidth: 1, borderColor: "#e5e7eb", borderRadius: 12, padding: 14, marginBottom: 16, flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  dateBtnLabel:       { fontSize: 16, color: "#9ca3af" },
  dateBtnValue:       { fontSize: 16, color: "#1f2937", fontWeight: "600" },
  categoryHeader:     { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
  label:              { fontSize: 16, fontWeight: "600", color: "#1f2937" },
  dropdownBtn:        { backgroundColor: "#fff", borderWidth: 1, borderColor: "#e5e7eb", borderRadius: 12, padding: 14, marginBottom: 24, flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  dropdownText:       { fontSize: 16, color: "#1f2937" },
  dropdownArrow:      { fontSize: 12, color: "#6b7280" },
  modalOverlay:       { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
  modalBox:           { backgroundColor: "#fff", borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, maxHeight: "70%" },
  modalTitle:         { fontSize: 18, fontWeight: "bold", color: "#1f2937", marginBottom: 16, textAlign: "center" },
  modalItem:          { flexDirection: "row", alignItems: "center", padding: 12, borderRadius: 12, marginBottom: 4 },
  modalIconBox:       { width: 40, height: 40, borderRadius: 20, justifyContent: "center", alignItems: "center", marginRight: 12 },
  modalIcon:          { fontSize: 18 },
  modalItemText:      { flex: 1, fontSize: 15, color: "#1f2937", fontWeight: "500" },
  checkMark:          { fontSize: 16, color: "#10B981", fontWeight: "bold" },
  saveBtn:            { backgroundColor: "#6366F1", borderRadius: 12, padding: 16, alignItems: "center", marginBottom: 40 },
  saveBtnText:        { color: "#fff", fontSize: 16, fontWeight: "bold" },
});
