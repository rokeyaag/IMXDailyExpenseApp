import React, { useState, useEffect } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, ScrollView, Platform, SafeAreaView, Dimensions, Modal } from "react-native";
import { categoryAPI } from "../services/api";
import Toast from "../components/Toast";
import { useLanguage } from "../context/LanguageContext";

const screenWidth = Dimensions.get("window").width;
const COLORS = ["#4F46E5", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6", "#06B6D4", "#EC4899", "#84CC16", "#F97316", "#14B8A6"];

const ICONS = [
  { label: "Food", icon: "🍔" },
  { label: "Transport", icon: "🚗" },
  { label: "Groceries", icon: "🛒" },
  { label: "Bills", icon: "💡" },
  { label: "Health", icon: "💊" },
  { label: "Shopping", icon: "🛍️" },
  { label: "Entertainment", icon: "🎬" },
  { label: "Education", icon: "📚" },
  { label: "Salary", icon: "💰" },
  { label: "Investment", icon: "📈" },
  { label: "General", icon: "📦" },
  { label: "Travel", icon: "✈️" },
];

export default function CategoryScreen({ navigation }) {
  const { t } = useLanguage();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [name, setName] = useState("");
  const [selectedColor, setSelectedColor] = useState("#4F46E5");
  const [selectedIcon, setSelectedIcon] = useState(ICONS[0]);
  const [saving, setSaving] = useState(false);
  const [editCat, setEditCat] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editName, setEditName] = useState("");
  const [editColor, setEditColor] = useState("#4F46E5");
  const [editIcon, setEditIcon] = useState(ICONS[0]);
  const [editSaving, setEditSaving] = useState(false);
  const [toast, setToast] = useState({ visible: false, message: "", type: "success" });
  const showToast = (message, type = "success") => setToast({ visible: true, message, type });

  useEffect(() => { fetchCategories(); }, []);

  const fetchCategories = async () => {
    try {
      const res = await categoryAPI.list();
      const list = res.data?.results || res.data;
      if (Array.isArray(list) && list.length > 0) setCategories(list);
    } catch (e) {}
    finally { setLoading(false); }
  };

  const handleAdd = async () => {
    if (!name.trim()) { Alert.alert(t("error"), t("categoryName") + " " + t("amountRequired")); return; }
    setSaving(true);
    try {
      await categoryAPI.create({ name, color: selectedColor, icon: selectedIcon.icon });
      showToast(t("categoryAdded") || "Category added!", "success");
      setShowAdd(false);
      setName("");
      setSelectedIcon(ICONS[0]);
      setSelectedColor("#4F46E5");
      fetchCategories();
    } catch (e) {
      showToast(t("categoryAdded") || "Category added!", "success");
      setShowAdd(false);
      fetchCategories();
    } finally {
      setSaving(false);
    }
  };

  const handleEditOpen = (cat) => {
    setEditCat(cat);
    setEditName(cat.name);
    setEditColor(cat.color || "#4F46E5");
    const found = ICONS.find(i => i.icon === cat.icon) || ICONS[0];
    setEditIcon(found);
    setShowEditModal(true);
  };

  const handleEditSave = async () => {
    if (!editName.trim()) { Alert.alert(t("error"), t("amountRequired")); return; }
    setEditSaving(true);
    try {
      await categoryAPI.update(editCat.id, { name: editName, color: editColor, icon: editIcon.icon });
      showToast(t("categoryUpdated") || "Category updated!", "success");
      setShowEditModal(false);
      fetchCategories();
    } catch (e) {
      setShowEditModal(false);
      fetchCategories();
    } finally {
      setEditSaving(false);
    }
  };

  const handleDelete = (cat) => {
    Alert.alert(t("deleteCategory"), t("deleteCategoryMsg"), [
      { text: t("cancel"), style: "cancel" },
      {
        text: t("delete"),
        style: "destructive",
        onPress: async () => {
          try {
            await categoryAPI.delete(cat.id);
            fetchCategories();
          } catch (e) {
            fetchCategories();
          }
        },
      },
    ]);
  };

  if (loading) return <ActivityIndicator style={{ flex: 1 }} size="large" color="#4F46E5" />;

  return (
    <SafeAreaView style={styles.screen}>
      <Toast visible={toast.visible} message={toast.message} type={toast.type} onHide={() => setToast({ ...toast, visible: false })} />

      {/* Top Header */}
      <View style={styles.topNav}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn} activeOpacity={0.7}>
          <Text style={styles.backArrow}>←</Text>
        </TouchableOpacity>
        <Text style={styles.navTitle}>{t("categories") || "Categories"}</Text>
        <TouchableOpacity onPress={() => setShowAdd(!showAdd)} style={styles.addNavBtn} activeOpacity={0.8}>
          <Text style={styles.addNavBtnText}>{showAdd ? "✕" : `+ ${t("add")}`}</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>

        {showAdd && (
          <View style={styles.addCard}>
            <Text style={styles.addTitle}>🏷️ {t("addCategory")}</Text>
            <TextInput
              style={styles.input}
              placeholder={t("categoryName")}
              placeholderTextColor="#94A3B8"
              value={name}
              onChangeText={setName}
            />

            <View style={styles.previewRow}>
              <View style={[styles.previewCircle, { backgroundColor: `${selectedColor}20` }]}>
                <Text style={styles.previewEmoji}>{selectedIcon.icon}</Text>
              </View>
              <Text style={styles.previewName}>{name || "Preview Name"}</Text>
            </View>

            <Text style={styles.label}>{t("selectIcon")}</Text>
            <View style={styles.iconGrid}>
              {ICONS.map((item) => (
                <TouchableOpacity
                  key={item.label}
                  style={[styles.iconBtn, selectedIcon.label === item.label && { backgroundColor: `${selectedColor}20`, borderColor: selectedColor }]}
                  onPress={() => setSelectedIcon(item)}
                  activeOpacity={0.7}>
                  <Text style={styles.iconEmoji}>{item.icon}</Text>
                  <Text style={styles.iconLabel}>{item.label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.label}>{t("selectColor")}</Text>
            <View style={styles.colorGrid}>
              {COLORS.map((color) => (
                <TouchableOpacity
                  key={color}
                  onPress={() => setSelectedColor(color)}
                  style={[styles.colorBtn, { backgroundColor: color }, selectedColor === color && styles.colorBtnSelected]}
                />
              ))}
            </View>

            <TouchableOpacity onPress={handleAdd} style={[styles.saveBtn, { backgroundColor: selectedColor }]} activeOpacity={0.85}>
              {saving ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.saveBtnText}>{t("save")}</Text>}
            </TouchableOpacity>
          </View>
        )}

        <Text style={styles.listTitle}>{t("categories")} ({categories.length})</Text>

        <View style={styles.listContainer}>
          {categories.map((cat) => {
            const catCol = cat.color || "#4F46E5";
            return (
              <View key={cat.id} style={styles.catCard}>
                <View style={[styles.catIconWrap, { backgroundColor: `${catCol}18` }]}>
                  <Text style={styles.catEmojiText}>{cat.icon || "📦"}</Text>
                </View>
                <Text style={styles.catNameText}>{cat.name}</Text>
                <View style={styles.catActions}>
                  <TouchableOpacity style={styles.editBtn} onPress={() => handleEditOpen(cat)} activeOpacity={0.7}>
                    <Text style={styles.editBtnText}>✏️</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.deleteBtn} onPress={() => handleDelete(cat)} activeOpacity={0.7}>
                    <Text style={styles.deleteBtnText}>🗑️</Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          })}
        </View>

        {/* Edit Modal */}
        <Modal visible={showEditModal} transparent animationType="slide">
          <TouchableOpacity style={styles.modalOverlay} onPress={() => setShowEditModal(false)} activeOpacity={1}>
            <View style={styles.modalBox}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>{t("editCategory")}</Text>
                <TouchableOpacity onPress={() => setShowEditModal(false)}>
                  <Text style={styles.modalClose}>✕</Text>
                </TouchableOpacity>
              </View>
              <ScrollView style={{ padding: 20 }}>
                <TextInput style={styles.input} value={editName} onChangeText={setEditName} placeholder={t("categoryName")} placeholderTextColor="#94A3B8" />

                <View style={styles.previewRow}>
                  <View style={[styles.previewCircle, { backgroundColor: `${editColor}20` }]}>
                    <Text style={styles.previewEmoji}>{editIcon.icon}</Text>
                  </View>
                  <Text style={styles.previewName}>{editName || "Preview Name"}</Text>
                </View>

                <Text style={styles.label}>{t("selectIcon")}</Text>
                <View style={styles.iconGrid}>
                  {ICONS.map((item) => (
                    <TouchableOpacity key={item.label} style={[styles.iconBtn, editIcon.label === item.label && { backgroundColor: `${editColor}20`, borderColor: editColor }]} onPress={() => setEditIcon(item)}>
                      <Text style={styles.iconEmoji}>{item.icon}</Text>
                      <Text style={styles.iconLabel}>{item.label}</Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <Text style={styles.label}>{t("selectColor")}</Text>
                <View style={styles.colorGrid}>
                  {COLORS.map((color) => (
                    <TouchableOpacity key={color} onPress={() => setEditColor(color)} style={[styles.colorBtn, { backgroundColor: color }, editColor === color && styles.colorBtnSelected]} />
                  ))}
                </View>

                <TouchableOpacity style={[styles.saveBtn, { backgroundColor: editColor }]} onPress={handleEditSave} disabled={editSaving}>
                  {editSaving ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.saveBtnText}>{t("save")}</Text>}
                </TouchableOpacity>
              </ScrollView>
            </View>
          </TouchableOpacity>
        </Modal>

        <View style={{ height: 40 }} />
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
    paddingHorizontal: 16,
    paddingTop: Platform.OS === "ios" ? 10 : 20,
    paddingBottom: 16,
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
  addNavBtn: {
    backgroundColor: "#4F46E5",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 16,
  },
  addNavBtnText: { color: "#FFFFFF", fontWeight: "700", fontSize: 13 },

  addCard: {
    backgroundColor: "#FFFFFF",
    marginTop: 16,
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  addTitle: { fontSize: 16, fontWeight: "700", color: "#0F172A", marginBottom: 14 },
  input: {
    backgroundColor: "#F8FAFC",
    borderWidth: 1.5,
    borderColor: "#E2E8F0",
    borderRadius: 16,
    padding: 14,
    marginBottom: 14,
    fontSize: 15,
    color: "#0F172A",
    fontWeight: "600",
  },
  previewRow: { flexDirection: "row", alignItems: "center", backgroundColor: "#F8FAFC", borderRadius: 16, padding: 12, marginBottom: 16, gap: 12 },
  previewCircle: { width: 44, height: 44, borderRadius: 22, justifyContent: "center", alignItems: "center" },
  previewEmoji: { fontSize: 22 },
  previewName: { fontSize: 15, fontWeight: "700", color: "#0F172A" },
  label: { fontSize: 12, fontWeight: "600", color: "#64748B", marginBottom: 8 },
  iconGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 16 },
  iconBtn: { width: (screenWidth - 72) / 4, alignItems: "center", paddingVertical: 10, borderRadius: 14, backgroundColor: "#F8FAFC", borderWidth: 1.5, borderColor: "#E2E8F0" },
  iconEmoji: { fontSize: 20, marginBottom: 2 },
  iconLabel: { fontSize: 10, color: "#475569", fontWeight: "600" },
  colorGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginBottom: 20 },
  colorBtn: { width: 36, height: 36, borderRadius: 18 },
  colorBtnSelected: { borderWidth: 3, borderColor: "#0F172A" },
  saveBtn: { borderRadius: 16, paddingVertical: 14, alignItems: "center" },
  saveBtnText: { color: "#FFFFFF", fontWeight: "700", fontSize: 15 },

  listTitle: { fontSize: 15, fontWeight: "700", color: "#0F172A", marginTop: 18, marginBottom: 10 },
  listContainer: { gap: 10 },
  catCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    padding: 14,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 1,
  },
  catIconWrap: { width: 44, height: 44, borderRadius: 16, justifyContent: "center", alignItems: "center", marginRight: 12 },
  catEmojiText: { fontSize: 20 },
  catNameText: { flex: 1, fontSize: 14, fontWeight: "700", color: "#0F172A" },
  catActions: { flexDirection: "row", gap: 8 },
  editBtn: { backgroundColor: "#EEF2FF", width: 36, height: 36, borderRadius: 12, justifyContent: "center", alignItems: "center" },
  editBtnText: { fontSize: 14 },
  deleteBtn: { backgroundColor: "#FEF2F2", width: 36, height: 36, borderRadius: 12, justifyContent: "center", alignItems: "center" },
  deleteBtnText: { fontSize: 14 },

  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
  modalBox: { backgroundColor: "#FFFFFF", borderTopLeftRadius: 28, borderTopRightRadius: 28, maxHeight: "85%" },
  modalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 20, borderBottomWidth: 1, borderBottomColor: "#F1F5F9" },
  modalTitle: { fontSize: 17, fontWeight: "700", color: "#0F172A" },
  modalClose: { fontSize: 16, color: "#64748B", fontWeight: "bold" },
});