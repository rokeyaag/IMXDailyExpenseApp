import React, { useState, useEffect, useRef } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, ScrollView, Animated, Dimensions } from "react-native";
import { categoryAPI } from "../services/api";

const screenWidth = Dimensions.get("window").width;
const COLORS = ["#6366F1","#10B981","#F59E0B","#EF4444","#8B5CF6","#06B6D4","#EC4899","#84CC16","#F97316","#14B8A6"];

const ICONS = [
  { emoji: "??", label: "Food" },
  { emoji: "??", label: "Transport" },
  { emoji: "???", label: "Shopping" },
  { emoji: "??", label: "Health" },
  { emoji: "??", label: "Education" },
  { emoji: "??", label: "Bills" },
  { emoji: "??", label: "Rent" },
  { emoji: "??", label: "Money" },
  { emoji: "??", label: "Clothes" },
  { emoji: "??", label: "Games" },
  { emoji: "??", label: "Travel" },
  { emoji: "??", label: "Work" },
];

function AnimatedBtn({ onPress, style, children }) {
  const scale = useRef(new Animated.Value(1)).current;
  const onIn = () => Animated.spring(scale, { toValue: 0.93, useNativeDriver: true }).start();
  const onOut = () => Animated.spring(scale, { toValue: 1, useNativeDriver: true }).start();
  return (
    <TouchableOpacity onPress={onPress} onPressIn={onIn} onPressOut={onOut} activeOpacity={1}>
      <Animated.View style={[style, { transform: [{ scale }] }]}>{children}</Animated.View>
    </TouchableOpacity>
  );
}

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
      setSelectedIcon("??");
      setSelectedColor("#6366F1");
      fetchCategories();
    } catch (e) {
      const msg = e.response?.data ? JSON.stringify(e.response.data) : "Something went wrong";
      Alert.alert("Error", msg);
    }
    finally { setSaving(false); }
  };

  if (loading) return <ActivityIndicator style={{ flex: 1 }} size="large" color="#6366F1" />;

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Categories</Text>
        <AnimatedBtn
          onPress={() => setShowAdd(!showAdd)}
          style={[styles.addBtn, { backgroundColor: showAdd ? "#EF4444" : "#6366F1" }]}>
          <Text style={styles.addBtnText}>{showAdd ? "? Close" : "+ Add New"}</Text>
        </AnimatedBtn>
      </View>

      {/* Add Form */}
      {showAdd && (
        <View style={styles.addCard}>
          <Text style={styles.addTitle}>New Category</Text>

          <TextInput
            style={styles.input}
            placeholder="Category name (e.g. Groceries)"
            placeholderTextColor="#9ca3af"
            value={name}
            onChangeText={setName}
            color="#1f2937"
          />

          {/* Preview */}
          <View style={styles.previewRow}>
            <View style={[styles.previewCircle, { backgroundColor: selectedColor }]}>
              <Text style={styles.previewEmoji}>{selectedIcon}</Text>
            </View>
            <Text style={styles.previewName}>{name || "Preview"}</Text>
          </View>

          {/* Icon Picker */}
          <Text style={styles.label}>Choose Icon</Text>
          <View style={styles.iconGrid}>
            {ICONS.map((item) => (
              <TouchableOpacity
                key={item.label}
                style={[styles.iconBtn, selectedIcon === item.emoji && { backgroundColor: selectedColor, borderColor: selectedColor }]}
                onPress={() => setSelectedIcon(item.emoji)}>
                <Text style={styles.iconEmoji}>{item.emoji}</Text>
                <Text style={[styles.iconLabel, selectedIcon === item.emoji && { color: "#fff" }]} numberOfLines={1}>
                  {item.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Color Picker */}
          <Text style={styles.label}>Choose Color</Text>
          <View style={styles.colorGrid}>
            {COLORS.map((color) => (
              <TouchableOpacity
                key={color}
                onPress={() => setSelectedColor(color)}
                style={[styles.colorBtn, { backgroundColor: color }, selectedColor === color && styles.colorBtnSelected]}
              >
                {selectedColor === color && <Text style={styles.colorCheck}>?</Text>}
              </TouchableOpacity>
            ))}
          </View>

          <AnimatedBtn onPress={handleAdd} style={[styles.saveBtn, { backgroundColor: selectedColor }]}>
            {saving
              ? <ActivityIndicator color="#fff" />
              : <Text style={styles.saveBtnText}>Save Category</Text>}
          </AnimatedBtn>
        </View>
      )}

      {/* Category List */}
      <Text style={styles.listTitle}>All Categories ({categories.length})</Text>
      <View style={styles.listCard}>
        {categories.map((cat, index) => (
          <View key={cat.id} style={[styles.catRow, index < categories.length - 1 && styles.catBorder]}>
            <View style={[styles.catIconBox, { backgroundColor: cat.color || "#6366F1" }]}>
              <Text style={styles.catIconText}>{cat.icon || cat.name?.charAt(0).toUpperCase()}</Text>
            </View>
            <View style={styles.catInfo}>
              <Text style={styles.catName}>{cat.name}</Text>
              {cat.is_default && (
                <View style={styles.defaultBadge}>
                  <Text style={styles.defaultBadgeText}>Default</Text>
                </View>
              )}
            </View>
            <View style={[styles.colorDot, { backgroundColor: cat.color || "#6366F1" }]} />
          </View>
        ))}
      </View>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container:         { flex: 1, backgroundColor: "#f0f0ff" },
  header:            { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 20, paddingTop: 52, paddingBottom: 16 },
  title:             { fontSize: 24, fontWeight: "bold", color: "#1f2937" },
  addBtn:            { borderRadius: 12, paddingHorizontal: 16, paddingVertical: 10, elevation: 3, shadowColor: "#6366F1", shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.3, shadowRadius: 6 },
  addBtnText:        { color: "#fff", fontWeight: "bold", fontSize: 14 },
  addCard:           { backgroundColor: "#fff", marginHorizontal: 16, borderRadius: 20, padding: 20, marginBottom: 16, elevation: 2 },
  addTitle:          { fontSize: 18, fontWeight: "bold", color: "#1f2937", marginBottom: 16 },
  input:             { backgroundColor: "#f8f9ff", borderWidth: 1.5, borderColor: "#e5e7eb", borderRadius: 12, padding: 14, marginBottom: 16, fontSize: 15, color: "#1f2937" },
  previewRow:        { flexDirection: "row", alignItems: "center", backgroundColor: "#f8f9ff", borderRadius: 14, padding: 12, marginBottom: 16, gap: 12 },
  previewCircle:     { width: 48, height: 48, borderRadius: 24, justifyContent: "center", alignItems: "center" },
  previewEmoji:      { fontSize: 24 },
  previewName:       { fontSize: 16, fontWeight: "600", color: "#1f2937" },
  label:             { fontSize: 14, fontWeight: "600", color: "#374151", marginBottom: 10 },
  iconGrid:          { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 16 },
  iconBtn:           { width: (screenWidth - 96) / 4, alignItems: "center", paddingVertical: 10, paddingHorizontal: 4, borderRadius: 12, backgroundColor: "#f3f4f6", borderWidth: 1.5, borderColor: "#e5e7eb" },
  iconEmoji:         { fontSize: 22, marginBottom: 4 },
  iconLabel:         { fontSize: 11, color: "#374151", fontWeight: "500", textAlign: "center" },
  colorGrid:         { flexDirection: "row", flexWrap: "wrap", gap: 10, marginBottom: 20 },
  colorBtn:          { width: 40, height: 40, borderRadius: 20, justifyContent: "center", alignItems: "center" },
  colorBtnSelected:  { borderWidth: 3, borderColor: "#1f2937" },
  colorCheck:        { color: "#fff", fontWeight: "bold", fontSize: 16 },
  saveBtn:           { borderRadius: 14, padding: 15, alignItems: "center", elevation: 3 },
  saveBtnText:       { color: "#fff", fontWeight: "bold", fontSize: 15 },
  listTitle:         { fontSize: 16, fontWeight: "bold", color: "#1f2937", paddingHorizontal: 20, marginBottom: 8 },
  listCard:          { backgroundColor: "#fff", marginHorizontal: 16, borderRadius: 20, overflow: "hidden", elevation: 2, marginBottom: 8 },
  catRow:            { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 14 },
  catBorder:         { borderBottomWidth: 1, borderBottomColor: "#f3f4f6" },
  catIconBox:        { width: 46, height: 46, borderRadius: 23, justifyContent: "center", alignItems: "center", marginRight: 14 },
  catIconText:       { fontSize: 22 },
  catInfo:           { flex: 1, flexDirection: "row", alignItems: "center", gap: 8 },
  catName:           { fontSize: 15, color: "#1f2937", fontWeight: "500" },
  defaultBadge:      { backgroundColor: "#ede9fe", paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  defaultBadgeText:  { fontSize: 11, color: "#6366F1", fontWeight: "600" },
  colorDot:          { width: 10, height: 10, borderRadius: 5 },
});
