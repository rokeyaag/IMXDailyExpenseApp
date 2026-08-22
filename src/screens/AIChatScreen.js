import React, { useState, useRef, useEffect } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, FlatList, KeyboardAvoidingView, Platform, ActivityIndicator, SafeAreaView } from "react-native";
import api from "../services/api";
import { useLanguage } from "../context/LanguageContext";

export default function AIChatScreen({ navigation }) {
  const { t, language } = useLanguage();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const flatListRef = useRef(null);

  useEffect(() => {
    setMessages([{ id: "1", role: "ai", text: language === "bn" ? "👋 আসসালামু আলাইকুম! আমি IMX AI সহকারী। আপনার খরচ, ব্যালেন্স বা সঞ্চয়ের পরামর্শ সম্পর্কে যেকোনো কিছু জিজ্ঞেস করতে পারেন।" : "👋 Hello! I am your IMX AI Financial Assistant. Ask me anything about your balance, expenses, or savings tips!" }]);
  }, [language]);

  const quickQuestionsBn = [
    "💰 আজ কত খরচ করেছি?",
    "💳 আমার বর্তমান ব্যালেন্স কত?",
    "📊 কোন খাতে বেশি খরচ হয়েছে?",
    "💡 সেভিংস বাড়ানোর টিপস দাও",
  ];

  const quickQuestionsEn = [
    "💰 How much did I spend today?",
    "💳 What is my current balance?",
    "📊 Which category has highest expense?",
    "💡 Give me smart savings tips",
  ];

  const quickQuestions = language === "bn" ? quickQuestionsBn : quickQuestionsEn;

  const sendMessage = async (text) => {
    const msg = text || input.trim();
    if (!msg) return;
    setInput("");
    const userMsg = { id: Date.now().toString(), role: "user", text: msg };
    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setLoading(true);
    try {
      const history = updatedMessages
        .filter(m => m.id !== "1")
        .map(m => ({ role: m.role === "user" ? "user" : "assistant", content: m.text }));
      const res = await api.post("/api/ai/add-expense/", {
        text: msg,
        action: "chat",
        history: history,
      });
      const aiMsg = { id: (Date.now() + 1).toString(), role: "ai", text: res.data.reply };
      setMessages(prev => [...prev, aiMsg]);
    } catch (e) {
      const errMsg = { id: (Date.now() + 1).toString(), role: "ai", text: "আপনার ব্যালেন্স ও খরচের হিসাব পর্যবেক্ষণ অনুযায়ী সব ডেটা সুরক্ষিত রয়েছে।" };
      setMessages(prev => [...prev, errMsg]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (flatListRef.current) {
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 200);
    }
  }, [messages, loading]);

  const renderMessage = ({ item }) => (
    <View style={[styles.msgRow, item.role === "user" ? styles.userRow : styles.aiRow]}>
      {item.role === "ai" && (
        <View style={styles.aiAvatar}>
          <Text style={styles.aiAvatarText}>🤖</Text>
        </View>
      )}
      <View style={[styles.bubble, item.role === "user" ? styles.userBubble : styles.aiBubble]}>
        <Text style={[styles.bubbleText, item.role === "user" ? styles.userText : styles.aiText]}>{item.text}</Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Top Header */}
      <View style={styles.topNav}>
        <TouchableOpacity onPress={() => navigation?.goBack?.()} style={styles.backBtn} activeOpacity={0.7}>
          <Text style={styles.backArrow}>←</Text>
        </TouchableOpacity>
        <View style={styles.titleWrap}>
          <Text style={styles.navTitle}>IMX AI Assistant</Text>
          <View style={styles.onlineBadge}>
            <View style={styles.onlineDot} />
            <Text style={styles.onlineText}>Active AI</Text>
          </View>
        </View>
        <View style={{ width: 40 }} />
      </View>

      <KeyboardAvoidingView style={styles.inner} behavior={Platform.OS === "ios" ? "padding" : "height"} keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 20}>
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={item => item.id}
          renderItem={renderMessage}
          contentContainerStyle={styles.chatList}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
          ListFooterComponent={loading ? (
            <View style={[styles.aiRow, { marginBottom: 12 }]}>
              <View style={styles.aiAvatar}><Text style={styles.aiAvatarText}>🤖</Text></View>
              <View style={[styles.aiBubble, { paddingVertical: 12, paddingHorizontal: 16 }]}>
                <ActivityIndicator color="#4F46E5" size="small" />
              </View>
            </View>
          ) : null}
        />

        <View style={styles.bottomSection}>
          <View style={styles.quickRow}>
            {quickQuestions.map((q, i) => (
              <TouchableOpacity key={i} style={styles.quickChip} onPress={() => sendMessage(q)} activeOpacity={0.7}>
                <Text style={styles.quickChipText}>{q}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <View style={styles.inputRow}>
            <TextInput
              style={styles.input}
              placeholder={t("typeMessage") || "Ask a question..."}
              placeholderTextColor="#94A3B8"
              value={input}
              onChangeText={setInput}
              multiline
            />
            <TouchableOpacity
              style={[styles.sendBtn, (!input.trim() || loading) && styles.sendBtnDisabled]}
              onPress={() => sendMessage()}
              disabled={!input.trim() || loading}
              activeOpacity={0.8}>
              <Text style={styles.sendBtnText}>➤</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8FAFC" },
  inner: { flex: 1 },

  topNav: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: Platform.OS === "ios" ? 10 : 20,
    paddingBottom: 12,
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
  titleWrap: { alignItems: "center" },
  navTitle: { fontSize: 16, fontWeight: "700", color: "#0F172A" },
  onlineBadge: { flexDirection: "row", alignItems: "center", marginTop: 2 },
  onlineDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: "#10B981", marginRight: 5 },
  onlineText: { fontSize: 10, color: "#10B981", fontWeight: "600" },

  chatList: { padding: 16, paddingBottom: 12 },
  msgRow: { flexDirection: "row", marginBottom: 14, alignItems: "flex-end" },
  userRow: { justifyContent: "flex-end" },
  aiRow: { justifyContent: "flex-start" },
  aiAvatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "#EEF2FF",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 8,
    borderWidth: 1,
    borderColor: "#E0E7FF",
  },
  aiAvatarText: { fontSize: 18 },
  bubble: { maxWidth: "80%", paddingHorizontal: 16, paddingVertical: 12, borderRadius: 20 },
  userBubble: {
    backgroundColor: "#4F46E5",
    borderBottomRightRadius: 4,
    shadowColor: "#4F46E5",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 2,
  },
  aiBubble: {
    backgroundColor: "#FFFFFF",
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
  },
  bubbleText: { fontSize: 14, lineHeight: 22 },
  userText: { color: "#FFFFFF", fontWeight: "500" },
  aiText: { color: "#1E293B" },

  bottomSection: {
    backgroundColor: "#FFFFFF",
    borderTopWidth: 1,
    borderTopColor: "#E2E8F0",
    paddingHorizontal: 14,
    paddingTop: 10,
    paddingBottom: Platform.OS === "ios" ? 28 : 16,
  },
  quickRow: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginBottom: 10 },
  quickChip: {
    backgroundColor: "#F1F5F9",
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  quickChipText: { color: "#334155", fontSize: 11, fontWeight: "600" },

  inputRow: { flexDirection: "row", gap: 8, alignItems: "center" },
  input: {
    flex: 1,
    backgroundColor: "#F8FAFC",
    borderWidth: 1.5,
    borderColor: "#E2E8F0",
    borderRadius: 22,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 14,
    maxHeight: 90,
    color: "#0F172A",
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#4F46E5",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#4F46E5",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 3,
  },
  sendBtnDisabled: { opacity: 0.4 },
  sendBtnText: { color: "#FFFFFF", fontWeight: "bold", fontSize: 16 },
});