import React, { useState, useEffect, useCallback } from "react";
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  ActivityIndicator, Alert, TextInput, RefreshControl
} from "react-native";
import { expenseAPI } from "../services/api";

export default function ExpenseListScreen({ navigation }) {
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState("");

  const today = new Date();
  const month = today.getMonth() + 1;
  const year = today.getFullYear();

  useEffect(() => { fetchExpenses(); }, []);

  const fetchExpenses = async () => {
    try {
      const res = await expenseAPI.list({ month, year });
      setExpenses(res.data.results || res.data);
    } catch (e) { console.log(e); }
    finally { setLoading(false); setRefreshing(false); }
  };

  const onRefresh = () => { setRefreshing(true); fetchExpenses(); };

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
              Alert.alert("Success", "Transaction deleted!");
            } catch (e) {
              Alert.alert("Error", "Something went wrong");
            }
          }
        }
      ]
    );
  };

  const filtered = expenses.filter(e =>
    (e.note || "").toLowerCase().includes(search.toLowerCase())
  );

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
      <TouchableOpacity style={styles.deleteBtn} onPress={() => handleDelete(item.id)}>
        <Text style={styles.deleteBtnText}>??</Text>
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
  container:      { flex: 1, backgroundColor: "#f8f9fa" },
  searchInput:    { backgroundColor: "#fff", margin: 16, marginBottom: 8, borderRadius: 12, padding: 14, fontSize: 16, borderWidth: 1, borderColor: "#e5e7eb" },
  expenseItem:    { flexDirection: "row", alignItems: "center", backgroundColor: "#fff", marginBottom: 8, padding: 16, borderRadius: 12 },
  typeDot:        { width: 10, height: 10, borderRadius: 5, marginRight: 12 },
  expenseInfo:    { flex: 1 },
  expenseNote:    { fontSize: 15, color: "#1f2937", fontWeight: "500" },
  expenseDate:    { fontSize: 12, color: "#6b7280", marginTop: 4 },
  expenseAmount:  { fontSize: 15, fontWeight: "bold", marginRight: 12 },
  deleteBtn:      { padding: 6 },
  deleteBtnText:  { fontSize: 18 },
  empty:          { textAlign: "center", color: "#6b7280", marginTop: 40, fontSize: 16 },
  fab:            { position: "absolute", bottom: 24, right: 24, width: 56, height: 56, borderRadius: 28, backgroundColor: "#6366F1", justifyContent: "center", alignItems: "center", elevation: 5 },
  fabText:        { color: "#fff", fontSize: 28, fontWeight: "bold" },
});
