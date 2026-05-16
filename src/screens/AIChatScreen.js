import React, { useState, useRef, useEffect } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, FlatList, KeyboardAvoidingView, Platform, ActivityIndicator, SafeAreaView } from "react-native";
import api from "../services/api";
import { useLanguage } from "../context/LanguageContext";

export default function AIChatScreen() {
  const { t, language } = useLanguage();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const flatListRef = useRef(null);

  useEffect(() => {
    setMessages([{ id: "1", role: "ai", text: t("askMe") }]);
  }, [language]);

  const quickQuestionsBn = [
    "আজ কত খরচ করেছি?",
    "আমার ব্যালেন্স কত?",
    "কোন ক্যাটাগরিতে বেশি খরচ?",
    "সেভিংস টিপস দাও",
  ];

  const quickQuestionsEn = [
    "How much did I spend today?",
    "What is my balance?",
    "Which category has highest expense?",
    "Give me savings tips",
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
      const errMsg = { id: (Date.now() + 1).toString(), role: "ai", text: t("somethingWrong") };
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
      {item.role === "ai" && (<View style={styles.aiAvatar}><Text style={styles.aiAvatarText}>AI</Text></View>)}
      <View style={[styles.bubble, item.role === "user" ? styles.userBubble : styles.aiBubble]}>
        <Text style={[styles.bubbleText, item.role === "user" ? styles.userText : styles.aiText]}>{item.text}</Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView style={styles.inner} behavior={Platform.OS === "ios" ? "padding" : "height"} keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 100}>
        <FlatList ref={flatListRef} data={messages} keyExtractor={item => item.id} renderItem={renderMessage} contentContainerStyle={styles.chatList} showsVerticalScrollIndicator={false} onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })} ListFooterComponent={loading ? (
          <View style={[styles.aiRow, { marginBottom: 8 }]}>
            <View style={styles.aiAvatar}><Text style={styles.aiAvatarText}>AI</Text></View>
            <View style={[styles.aiBubble, { paddingHorizontal: 20 }]}>
              <ActivityIndicator color="#6366F1" size="small" />
            </View>
          </View>
        ) : null} />
        <View style={styles.bottomSection}>
          <View style={styles.quickRow}>
            {quickQuestions.map((q, i) => (
              <TouchableOpacity key={i} style={styles.quickChip} onPress={() => sendMessage(q)}>
                <Text style={styles.quickChipText}>{q}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <View style={styles.inputRow}>
            <TextInput style={styles.input} placeholder={t("typeMessage")} placeholderTextColor="#9ca3af" value={input} onChangeText={setInput} multiline />
            <TouchableOpacity style={[styles.sendBtn, (!input.trim() || loading) && { opacity: 0.5 }]} onPress={() => sendMessage()} disabled={!input.trim() || loading}>
              <Text style={styles.sendBtnText}>{t("submit")}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container:     { flex: 1, backgroundColor: "#f0f0ff" },
  inner:         { flex: 1 },
  chatList:      { padding: 16, paddingBottom: 8 },
  msgRow:        { flexDirection: "row", marginBottom: 12, alignItems: "flex-end" },
  userRow:       { justifyContent: "flex-end" },
  aiRow:         { justifyContent: "flex-start" },
  aiAvatar:      { width: 32, height: 32, borderRadius: 16, backgroundColor: "#6366F1", justifyContent: "center", alignItems: "center", marginRight: 8 },
  aiAvatarText:  { color: "#fff", fontSize: 10, fontWeight: "bold" },
  bubble:        { maxWidth: "75%", padding: 12, borderRadius: 16 },
  userBubble:    { backgroundColor: "#6366F1", borderBottomRightRadius: 4 },
  aiBubble:      { backgroundColor: "#fff", borderBottomLeftRadius: 4, elevation: 2, minWidth: 60 },
  bubbleText:    { fontSize: 14, lineHeight: 22 },
  userText:      { color: "#fff" },
  aiText:        { color: "#1f2937" },
  bottomSection: { backgroundColor: "#fff", borderTopWidth: 1, borderTopColor: "#e5e7eb", paddingBottom: 48 },
  quickRow:      { flexDirection: "row", flexWrap: "wrap", paddingHorizontal: 12, paddingTop: 8, paddingBottom: 4, gap: 6 },
  quickChip:     { backgroundColor: "#ede9fe", paddingHorizontal: 10, paddingVertical: 6, borderRadius: 20 },
  quickChipText: { color: "#6366F1", fontSize: 11, fontWeight: "500" },
  inputRow:      { flexDirection: "row", padding: 10, gap: 8, alignItems: "flex-end" },
  input:         { flex: 1, backgroundColor: "#f8f9ff", borderWidth: 1.5, borderColor: "#e5e7eb", borderRadius: 20, paddingHorizontal: 16, paddingVertical: 8, fontSize: 13, maxHeight: 80, color: "#1f2937" },
  sendBtn:       { backgroundColor: "#6366F1", borderRadius: 20, paddingHorizontal: 18, paddingVertical: 10 },
  sendBtnText:   { color: "#fff", fontWeight: "bold", fontSize: 14 },
});