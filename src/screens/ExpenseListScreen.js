import React, { useState, useEffect } from "react";
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  ActivityIndicator, Alert, TextInput, RefreshControl, ScrollView
} from "react-native";
import { expenseAPI, categoryAPI } from "../services/api";

export default function ExpenseListScreen({ navigation }) {
  const [expenses, setExpenses] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedType, setSelectedType] = useState(null);

  const today = new Date();
  const month = today.getMonth() + 1;
  const year = today.getFullYear();

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      const [expRes, catRes] = await Promise.all([
        expenseAPI.list({ month, year }),
        categoryAPI.list(),
      ]);
      setExpenses(expRes.data.results || expRes.data);
      setCategories(catRes.data.results || catRes.data);
    } catch (e) { console.log(e); }
    finally { setLoading(false); setRefreshing(false); }
  };

  const onRefresh = () => { setRefreshing(true); fetchData(); };

  const handleDelete = (id) => {
    Alert.alert(
      "Delete",
      "Are you sure you want to delete this transaction?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await expenseAPI.delete(id);
              setExpenses(expenses.filter(e => e.id !== id));
            } catch (e) { Alert.alert("Error", "Something went wrong"); }
          }
        }
      ]
    );
  };

  const filtered = expenses.filter(e => {
    const matchSearch = (e.note || "").toLowerCase().includes(search.toLowerCase());
    const matchCategory = selectedCategory ? e.category === selectedCategory : true;
    const matchType = selectedType ? e.type === selectedType : true;
    return matchSearch && matchCategory && matchType;
  });

  const renderItem = ({ item }) => (
    <View style={styles.expenseItem}>
      <View style={[styles.typeDot, { backgroundColor: item.type === "income" ? "#10B981" : "#EF4444" }]} />
      <View style={styles.expenseInfo}>
        <Text style={styles.expenseNote}>{item.note || "No note"}</Text>
        <Text style={styles.expenseDate}>{item.date} • {item.category_detail?.name || "No category"}</Text>
      </View>
      <Text style={[styles.expenseAmount, { color: item.type === "income" ? "#10B981" : "#EF4444" }]}>
        {item.type === "income" ? "+" : "-"}Tk {parseFloat(item.amount).toFixed(0)}
      </Text>
      <TouchableOpacity style={styles.editBtn} onPress={() => navigation.navigate("EditExpense", { expense: item })}>
        <Text style={styles.editBtnText}>Edit</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.deleteBtn} onPress={() => handleDelete(item.id)}>
        <Text style={styles.deleteBtnText}>Del</Text>
      </TouchableOpacity>
    </View>
  );

  if (loading) return <ActivityIndicator style={{ flex: 1 }} size="large" color="#6366F1" />;

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.searchInput}
        placeholder="Search transactions..."
        value={search}
        onChangeText={setSearch}
      />
      <View style={styles.typeFilter}>
        {[null, "expense", "income"].map((t) => (
          <TouchableOpacity
            key={t || "all"}
            style={[styles.typeFilterBtn, selectedType === t && styles.typeFilterBtnActive]}
            onPress={() => setSelectedType(t)}>
            <Text style={[styles.typeFilterText, selectedType === t && styles.typeFilterTextActive]}>
              {t === null ? "All" : t === "expense" ? "Expense" : "Income"}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryFilter}>
        <TouchableOpacity
          style={[styles.catFilterBtn, selectedCategory === null && styles.catFilterBtnActive]}
          onPress={() => setSelectedCategory(null)}>
          <Text style={[styles.catFilterText, selectedCategory === null && styles.catFilterTextActive]}>All</Text>
        </TouchableOpacity>
        {categories.map((cat) => (
          <TouchableOpacity
            key={cat.id}
            style={[styles.catFilterBtn, selectedCategory === cat.id && { backgroundColor: cat.color, borderColor: cat.color }]}
            onPress={() => setSelectedCategory(selectedCategory === cat.id ? null : cat.id)}>
            <Text style={[styles.catFilterText, selectedCategory === cat.id && { color: "#fff" }]}>
              {cat.icon} {cat.name}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
      <Text style={styles.resultCount}>{filtered.length} transactions</Text>
      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderItem}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={<Text style={styles.empty}>No transactions found</Text>}
        contentContainerStyle={{ padding: 16 }}
      />
      <TouchableOpacity style={styles.fab} onPress={() => navigation.navigate("AddExpense")}>
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container:            { flex: 1, backgroundColor: "#f8f9fa" },
  searchInput:          { backgroundColor: "#fff", margin: 16, marginBottom: 8, borderRadius: 12, padding: 14, fontSize: 16, borderWidth: 1, borderColor: "#e5e7eb" },
  typeFilter:           { flexDirection: "row", paddingHorizontal: 16, gap: 8, marginBottom: 8 },
  typeFilterBtn:        { flex: 1, padding: 8, borderRadius: 20, borderWidth: 1, borderColor: "#e5e7eb", alignItems: "center", backgroundColor: "#fff" },
  typeFilterBtnActive:  { backgroundColor: "#6366F1", borderColor: "#6366F1" },
  typeFilterText:       { fontSize: 13, color: "#6b7280", fontWeight: "500" },
  typeFilterTextActive: { color: "#fff" },
  categoryFilter:       { paddingHorizontal: 16, marginBottom: 8, maxHeight: 44 },
  catFilterBtn:         { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: "#e5e7eb", backgroundColor: "#fff", marginRight: 8 },
  catFilterBtnActive:   { backgroundColor: "#6366F1", borderColor: "#6366F1" },
  catFilterText:        { fontSize: 13, color: "#6b7280" },
  catFilterTextActive:  { color: "#fff" },
  resultCount:          { fontSize: 12, color: "#6b7280", paddingHorizontal: 16, marginBottom: 4 },
  expenseItem:          { flexDirection: "row", alignItems: "center", backgroundColor: "#fff", marginBottom: 8, padding: 16, borderRadius: 12 },
  typeDot:              { width: 10, height: 10, borderRadius: 5, marginRight: 12 },
  expenseInfo:          { flex: 1 },
  expenseNote:          { fontSize: 15, color: "#1f2937", fontWeight: "500" },
  expenseDate:          { fontSize: 12, color: "#6b7280", marginTop: 4 },
  expenseAmount:        { fontSize: 15, fontWeight: "bold", marginRight: 8 },
  editBtn:              { padding: 6 },
  editBtnText:          { fontSize: 16 },
  deleteBtn:            { padding: 6 },
  deleteBtnText:        { fontSize: 16 },
  empty:                { textAlign: "center", color: "#6b7280", marginTop: 40, fontSize: 16 },
  fab:                  { position: "absolute", bottom: 24, right: 24, width: 56, height: 56, borderRadius: 28, backgroundColor: "#6366F1", justifyContent: "center", alignItems: "center", elevation: 5 },
  fabText:              { color: "#fff", fontSize: 28, fontWeight: "bold" },
});

