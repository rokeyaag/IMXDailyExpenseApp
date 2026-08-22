import React, { useEffect, useRef } from "react";
import { Animated, Text, StyleSheet, View, SafeAreaView } from "react-native";

export default function Toast({ visible, message, type = "success", onHide }) {
  const translateY = useRef(new Animated.Value(-80)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.9)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(translateY, { toValue: 0, useNativeDriver: true, tension: 60, friction: 8 }),
        Animated.timing(opacity, { toValue: 1, duration: 250, useNativeDriver: true }),
        Animated.spring(scale, { toValue: 1, useNativeDriver: true }),
      ]).start();

      const timer = setTimeout(() => {
        Animated.parallel([
          Animated.timing(translateY, { toValue: -80, duration: 300, useNativeDriver: true }),
          Animated.timing(opacity, { toValue: 0, duration: 250, useNativeDriver: true }),
          Animated.timing(scale, { toValue: 0.9, duration: 250, useNativeDriver: true }),
        ]).start(() => {
          onHide && onHide();
        });
      }, 2400);

      return () => clearTimeout(timer);
    }
  }, [visible]);

  if (!visible) return null;

  const isSuccess = type === "success";
  const isError = type === "error";
  const icon = isSuccess ? "✓" : isError ? "✕" : "ℹ";
  const iconBg = isSuccess ? "#10B981" : isError ? "#EF4444" : "#6366F1";

  return (
    <SafeAreaView style={styles.safeContainer} pointerEvents="none">
      <Animated.View style={[styles.pill, { opacity, transform: [{ translateY }, { scale }] }]}>
        <View style={[styles.iconCircle, { backgroundColor: iconBg }]}>
          <Text style={styles.iconText}>{icon}</Text>
        </View>
        <Text style={styles.messageText} numberOfLines={2}>{message}</Text>
      </Animated.View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeContainer: {
    position: "absolute",
    top: 12,
    left: 0,
    right: 0,
    alignItems: "center",
    zIndex: 99999,
  },
  pill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#0F172A",
    borderRadius: 30,
    paddingVertical: 10,
    paddingHorizontal: 16,
    maxWidth: "90%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 10,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
  },
  iconCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },
  iconText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "bold",
  },
  messageText: {
    color: "#F8FAFC",
    fontSize: 13,
    fontWeight: "600",
    letterSpacing: 0.2,
  },
});

