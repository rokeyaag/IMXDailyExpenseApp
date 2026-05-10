import React, { useState, useEffect, useRef } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, ScrollView, Animated, Dimensions, Modal } from "react-native";
import { categoryAPI } from "../services/api";
import Toast from "../components/Toast";

const screenWidth = Dimensions.get("window").width;
const COLORS = ["#6366F1","#10B981","#F59E0B","#EF4444","#8B5CF6","#06B6D4","#EC4899","#84CC16","#F97316","#14B8A6"];

const ICONS = [
  { label: "Food",      short: "FD" },
  { label: "Transport", short: "TR" },
  { label: "Shopping",  short: "SH" },
  { label: "Health",    short: "HL" },
  { label: "Education", short: "ED" },
  { label: "Bills",     short: "BL" },
  { label: "Rent",      short: "RN" },
  { label: "Money",     short: "MN" },
  { label: "Clothes",   short: "CL" },
  { label: "Games",     short: "GM" },
  { label: "Travel",    short: "TV" },
  { label: "Work",      short: "WK" },
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
  const [selectedIcon, setSelectedIcon] = useState(ICONS[0]);
  const [saving, setSaving] = useState(false);
  const [editCat, setEditCat] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editName, setEditName] = useState("");
  const [editColor, setEditColor] = useState("#6366F1");
  const [editIcon, setEditIcon] = useState(ICONS[0]);
  const [editSaving, setEditSaving] = useState(false);
  const [toast, setToast] = useState({ visible: false, message: "", type: "success" });
  const showToast = (message, type = "success") => setToast({ visible: true, message, type });

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
      await categoryAPI.create({ name, color: selectedColor, icon: selectedIcon.short });
      showToast("Category added!");
      setShowAdd(false);
      setName("");
      setSelectedIcon(ICONS[0]);
      setSelectedColor("#6366F1");
      fetchCategories();
    } catch (e) {
      Alert.alert("Error", "Something went wrong");
    }
    finally { setSaving(false); }
  };

  const handleEditOpen = (cat) => {
    setEditCat(cat);
    setEditName(cat.name);
    setEditColor(cat.color || "#6366F1");
    const found = ICONS.find(i => i.short === cat.icon) || ICONS[0];
    setEditIcon(found);
    setShowEditModal(true);
  };

  const handleEditSave = async () => {
    if (!editName.trim()) { Alert.alert("Error", "Name cannot be empty"); return; }
    setEditSaving(true);
    try {
      await categoryAPI.update(editCat.id, { name: editName, color: editColor, icon: editIcon.short });
      showToast("Category updated!");
      setShowEditModal(false);
      fetchCategories();
    } catch (e) {
      Alert.alert("Error", "Something went wrong");
    }
    finally { setEditSaving(false); }
  };

  const handleDelete = (cat) => {
    Alert.alert(
      "Delete Category",
      `Are you sure you want to delete "${cat.name}"?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete", style: "destructive",
          onPress: async () => {
            try {
              await categoryAPI.delete(cat.id);
              fetchCategories();
            } catch (e) {
              Alert.alert("Error", "Cannot delete this category");
            }
          }
        }
      ]
    );
  };

  if (loading) return <ActivityIndicator style={{ flex: 1 }} size="large" color="#6366F1" />;

  return (
    <View style={{ flex: 1 }}>
      <Toast visible={toast.visible} message={toast.message} type={toast.type} onHide={() => setToast({ ...toast, visible: false })} />
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <Text style={styles.title}>Categories</Text>
        <AnimatedBtn
          onPress={() => setShowAdd(!showAdd)}
          style={[styles.addBtn, { backgroundColor: showAdd ? "#EF4444" : "#6366F1" }]}>
          <Text style={styles.addBtnText}>{showAdd ? "X Close" : "+ Add New"}</Text>
        </AnimatedBtn>
      </View>

      {showAdd && (
        <View style={styles.addCard}>
          <Text style={styles.addTitle}>New Category</Text>
          <TextInput
            style={styles.input}
            placeholder="Category name"
            placeholderTextColor="#9ca3af"
            value={name}
            onChangeText={setName}
            color="#1f2937"
          />
          <View style={styles.previewRow}>
            <View style={[styles.previewCircle, { backgroundColor: selectedColor }]}>
              <Text style={styles.previewShort}>{selectedIcon.short}</Text>
            </View>
            <Text style={styles.previewName}>{name || "Preview"}</Text>
          </View>
          <Text style={styles.label}>Choose Icon</Text>
          <View style={styles.iconGrid}>
            {ICONS.map((item) => (
              <TouchableOpacity
                key={item.label}
                style={[styles.iconBtn, selectedIcon.label === item.label && { backgroundColor: selectedColor, borderColor: selectedColor }]}
                onPress={() => setSelectedIcon(item)}>
                <Text style={[styles.iconShort, selectedIcon.label === item.label && { color: "#fff" }]}>{item.short}</Text>
                <Text style={[styles.iconLabel, selectedIcon.label === item.label && { color: "#fff" }]}>{item.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <Text style={styles.label}>Choose Color</Text>
          <View style={styles.colorGrid}>
            {COLORS.map((color) => (
              <TouchableOpacity
                key={color}
                onPress={() => setSelectedColor(color)}
                style={[styles.colorBtn, { backgroundColor: color }, selectedColor === color && styles.colorBtnSelected]}>
                {selectedColor === color && <Text style={styles.colorCheck}>?</Text>}
              </TouchableOpacity>
            ))}
          </View>
          <AnimatedBtn onPress={handleAdd} style={[styles.saveBtn, { backgroundColor: selectedColor }]}>
            {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveBtnText}>Save Category</Text>}
          </AnimatedBtn>
        </View>
      )}

      <Text style={styles.listTitle}>All Categories ({categories.length})</Text>
      <View style={styles.listCard}>
        {categories.map((cat, index) => (
          <View key={cat.id} style={[styles.catRow, index < categories.length - 1 && styles.catBorder]}>
            <View style={[styles.catIconBox, { backgroundColor: cat.color || "#6366F1" }]}>
              <Text style={styles.catIconText}>{cat.icon || cat.name?.charAt(0).toUpperCase()}</Text>
            </View>
            <Text style={styles.catName}>{cat.name}</Text>
            <View style={styles.catActions}>
              <TouchableOpacity style={styles.editBtn} onPress={() => handleEditOpen(cat)}>
                <Text style={styles.editBtnText}>Edit</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.deleteBtn} onPress={() => handleDelete(cat)}>
                <Text style={styles.deleteBtnText}>Del</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}
      </View>

      {/* Edit Modal */}
      <Modal visible={showEditModal} transparent animationType="slide">
        <TouchableOpacity style={styles.modalOverlay} onPress={() => setShowEditModal(false)} activeOpacity={1}>
          <View style={styles.modalBox}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Edit Category</Text>
              <TouchableOpacity onPress={() => setShowEditModal(false)}>
                <Text style={styles.modalClose}>X</Text>
              </TouchableOpacity>
            </View>
            <ScrollView style={{ padding: 20 }}>
              <TextInput
                style={styles.input}
                value={editName}
                onChangeText={setEditName}
                placeholder="Category name"
                color="#1f2937"
              />
              <View style={styles.previewRow}>
                <View style={[styles.previewCircle, { backgroundColor: editColor }]}>
                  <Text style={styles.previewShort}>{editIcon.short}</Text>
                </View>
                <Text style={styles.previewName}>{editName || "Preview"}</Text>
              </View>
              <Text style={styles.label}>Choose Icon</Text>
              <View style={styles.iconGrid}>
                {ICONS.map((item) => (
                  <TouchableOpacity
                    key={item.label}
                    style={[styles.iconBtn, editIcon.label === item.label && { backgroundColor: editColor, borderColor: editColor }]}
                    onPress={() => setEditIcon(item)}>
                    <Text style={[styles.iconShort, editIcon.label === item.label && { color: "#fff" }]}>{item.short}</Text>
                    <Text style={[styles.iconLabel, editIcon.label === item.label && { color: "#fff" }]}>{item.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              <Text style={styles.label}>Choose Color</Text>
              <View style={styles.colorGrid}>
                {COLORS.map((color) => (
                  <TouchableOpacity
                    key={color}
                    onPress={() => setEditColor(color)}
                    style={[styles.colorBtn, { backgroundColor: color }, editColor === color && styles.colorBtnSelected]}>
                    {editColor === color && <Text style={styles.colorCheck}>?</Text>}
                  </TouchableOpacity>
                ))}
              </View>
              <TouchableOpacity style={[styles.saveBtn, { backgroundColor: editColor }]} onPress={handleEditSave} disabled={editSaving}>
                {editSaving ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveBtnText}>Save Changes</Text>}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>

      <View style={{ height: 40 }} />
    </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container:        { flex: 1, backgroundColor: "#f0f0ff" },
  header:           { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 20, paddingTop: 52, paddingBottom: 16 },
  title:            { fontSize: 24, fontWeight: "bold", color: "#1f2937" },
  addBtn:           { borderRadius: 12, paddingHorizontal: 16, paddingVertical: 10, elevation: 3 },
  addBtnText:       { color: "#fff", fontWeight: "bold", fontSize: 14 },
  addCard:          { backgroundColor: "#fff", marginHorizontal: 16, borderRadius: 20, padding: 20, marginBottom: 16, elevation: 2 },
  addTitle:         { fontSize: 18, fontWeight: "bold", color: "#1f2937", marginBottom: 16 },
  input:            { backgroundColor: "#f8f9ff", borderWidth: 1.5, borderColor: "#e5e7eb", borderRadius: 12, padding: 14, marginBottom: 16, fontSize: 15, color: "#1f2937" },
  previewRow:       { flexDirection: "row", alignItems: "center", backgroundColor: "#f8f9ff", borderRadius: 14, padding: 12, marginBottom: 16, gap: 12 },
  previewCircle:    { width: 48, height: 48, borderRadius: 24, justifyContent: "center", alignItems: "center" },
  previewShort:     { fontSize: 14, fontWeight: "bold", color: "#fff" },
  previewName:      { fontSize: 16, fontWeight: "600", color: "#1f2937" },
  label:            { fontSize: 14, fontWeight: "600", color: "#374151", marginBottom: 10 },
  iconGrid:         { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 16 },
  iconBtn:          { width: (screenWidth - 96) / 4, alignItems: "center", paddingVertical: 10, paddingHorizontal: 4, borderRadius: 12, backgroundColor: "#f3f4f6", borderWidth: 1.5, borderColor: "#e5e7eb" },
  iconShort:        { fontSize: 14, fontWeight: "bold", color: "#374151", marginBottom: 2 },
  iconLabel:        { fontSize: 11, color: "#374151", fontWeight: "500", textAlign: "center" },
  colorGrid:        { flexDirection: "row", flexWrap: "wrap", gap: 10, marginBottom: 20 },
  colorBtn:         { width: 40, height: 40, borderRadius: 20, justifyContent: "center", alignItems: "center" },
  colorBtnSelected: { borderWidth: 3, borderColor: "#1f2937" },
  colorCheck:       { color: "#fff", fontWeight: "bold", fontSize: 16 },
  saveBtn:          { borderRadius: 14, padding: 15, alignItems: "center", elevation: 3, marginBottom: 16 },
  saveBtnText:      { color: "#fff", fontWeight: "bold", fontSize: 15 },
  listTitle:        { fontSize: 16, fontWeight: "bold", color: "#1f2937", paddingHorizontal: 20, marginBottom: 8 },
  listCard:         { backgroundColor: "#fff", marginHorizontal: 16, borderRadius: 20, overflow: "hidden", elevation: 2 },
  catRow:           { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 12 },
  catBorder:        { borderBottomWidth: 1, borderBottomColor: "#f3f4f6" },
  catIconBox:       { width: 42, height: 42, borderRadius: 21, justifyContent: "center", alignItems: "center", marginRight: 12 },
  catIconText:      { fontSize: 13, fontWeight: "bold", color: "#fff" },
  catName:          { flex: 1, fontSize: 15, color: "#1f2937", fontWeight: "500" },
  catActions:       { flexDirection: "row", gap: 8 },
  editBtn:          { backgroundColor: "#6366F1", paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  editBtnText:      { color: "#fff", fontSize: 12, fontWeight: "bold" },
  deleteBtn:        { backgroundColor: "#EF4444", paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  deleteBtnText:    { color: "#fff", fontSize: 12, fontWeight: "bold" },
  modalOverlay:     { flex: 1, backgroundColor: "rgba(0,0,0,0.4)", justifyContent: "flex-end" },
  modalBox:         { backgroundColor: "#fff", borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: "85%" },
  modalHeader:      { flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 20, borderBottomWidth: 1, borderBottomColor: "#f3f4f6" },
  modalTitle:       { fontSize: 18, fontWeight: "bold", color: "#1f2937" },
  modalClose:       { fontSize: 18, color: "#6b7280", fontWeight: "bold" },
});



