import React, { useState, useEffect } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, ScrollView, FlatList } from "react-native";
import { categoryAPI } from "../services/api";

const COLORS = ["#6366F1", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6", "#06B6D4", "#EC4899", "#84CC16", "#F97316", "#14B8A6"];
const ICONS = ["??", "??", "??", "??", "??", "??", "??", "??", "??", "??", "??", "??"];

export default function CategoryScreen({ navigation }) {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [name, setName] = useState("");
  const [selectedColor, setSelectedColor] = useState("#6366F1");
  const [selectedIcon, setSelectedIcon] = useState("??");
  const [saving, setSaving] = useState(false);

  useEffect(() => { fetchCategories(); }, []);

  const fetchCategories = async () => {
    try {
      const res = await categoryAPI.list();
      setCategories(res.data.results || res.data);
    } catch (e) { console.log(e); }
    finally { setLoading(false); }
  };

  const handleAdd = async () => {
    if (!name.trim()) { Alert.alert("Error", "Please enter category name"); return; }
    setSaving(true);
    try {
      await categoryAPI.create({ name, color: selectedColor, icon: selectedIcon });
      Alert.alert("Success", "Category added!");
      setShowAdd(false);
      setName("");
      fetchCategories();
    } catch (e) { Alert.alert("Error", "Something went wrong"); }
    finally { setSaving(false); }
  };

  if (loading) return <ActivityIndicator style={{ flex: 1 }} size="large" color="#6366F1" />;

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Categories</Text>
        <TouchableOpacity style={styles.addBtn} onPress={() => setShowAdd(!showAdd)}>
          <Text style={styles.addBtnText}>+ Add</Text>
        </TouchableOpacity>
      </View>

      {showAdd && (
        <View style={styles.addCard}>
          <Text style={styles.addTitle}>New Category</Text>
          <TextInput
            style={styles.input}
            placeholder="Category name"
            value={name}
            onChangeText={setName}
          />
          <Text style={styles.label}>Select Icon:</Text>
          <View style={styles.iconGrid}>
            {ICONS.map((icon) => (
              <TouchableOpacity
                key={icon}
                style={[styles.iconBtn, selectedIcon === icon && { backgroundColor: selectedColor }]}
                onPress={() => setSelectedIcon(icon)}>
                <Text style={styles.iconText}>{icon}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <Text style={styles.label}>Select Color:</Text>
          <View style={styles.colorGrid}>
            {COLORS.map((color) => (
              <TouchableOpacity
                key={color}
                style={[styles.colorBtn, { backgroundColor: color }, selectedColor === color && styles.colorBtnSelected]}
                onPress={() => setSelectedColor(color)}
              />
            ))}
          </View>
          <TouchableOpacity style={[styles.saveBtn, { backgroundColor: selectedColor }]} onPress={handleAdd} disabled={saving}>
            {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveBtnText}>Save Category</Text>}
          </TouchableOpacity>
        </View>
      )}

      <View style={styles.listCard}>
        {categories.map((cat) => (
          <View key={cat.id} style={styles.catRow}>
            <View style={[styles.catIconBox, { backgroundColor: cat.color || "#6366F1" }]}>
              <Text style={styles.catIcon}>{cat.icon}</Text>
            </View>
            <Text style={styles.catName}>{cat.name}</Text>
            {cat.is_default && <Text style={styles.defaultBadge}>Default</Text>}
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container:          { flex: 1, backgroundColor: "#f8f9fa" },
  header:             { flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 20, paddingTop: 20 },
  title:              { fontSize: 22, fontWeight: "bold", color: "#1f2937" },
  addBtn:             { backgroundColor: "#6366F1", borderRadius: 10, paddingHorizontal: 16, paddingVertical: 8 },
  addBtnText:         { color: "#fff", fontWeight: "bold" },
  addCard:            { backgroundColor: "#fff", margin: 16, borderRadius: 16, padding: 20 },
  addTitle:           { fontSize: 18, fontWeight: "bold", color: "#1f2937", marginBottom: 16 },
  input:              { backgroundColor: "#f8f9fa", borderWidth: 1, borderColor: "#e5e7eb", borderRadius: 12, padding: 14, marginBottom: 16, fontSize: 16 },
  label:              { fontSize: 14, fontWeight: "500", color: "#1f2937", marginBottom: 10 },
  iconGrid:           { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 16 },
  iconBtn:            { width: 44, height: 44, borderRadius: 22, backgroundColor: "#f3f4f6", justifyContent: "center", alignItems: "center" },
  iconText:           { fontSize: 20 },
  colorGrid:          { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 16 },
  colorBtn:           { width: 36, height: 36, borderRadius: 18 },
  colorBtnSelected:   { borderWidth: 3, borderColor: "#1f2937" },
  saveBtn:            { borderRadius: 12, padding: 14, alignItems: "center" },
  saveBtnText:        { color: "#fff", fontWeight: "bold", fontSize: 15 },
  listCard:           { backgroundColor: "#fff", margin: 16, borderRadius: 16, padding: 8 },
  catRow:             { flexDirection: "row", alignItems: "center", padding: 12, borderBottomWidth: 1, borderBottomColor: "#f3f4f6" },
  catIconBox:         { width: 40, height: 40, borderRadius: 20, justifyContent: "center", alignItems: "center", marginRight: 12 },
  catIcon:            { fontSize: 18 },
  catName:            { flex: 1, fontSize: 15, color: "#1f2937", fontWeight: "500" },
  defaultBadge:       { fontSize: 11, color: "#6b7280", backgroundColor: "#f3f4f6", paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 },
});
