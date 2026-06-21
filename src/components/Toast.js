import React, { useEffect, useRef } from "react";
import { Animated, Text, StyleSheet, View } from "react-native";

export default function Toast({ visible, message, type = "success", onHide }) {
  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.3)).current;
  const checkScale = useRef(new Animated.Value(0)).current;
  const slideY = useRef(new Animated.Value(50)).current;

  useEffect(() => {
    if (visible) {
      opacity.setValue(0);
      scale.setValue(0.3);
      slideY.setValue(50);
      checkScale.setValue(0);

      Animated.sequence([
        Animated.parallel([
          Animated.spring(opacity, { toValue: 1, useNativeDriver: true, tension: 50 }),
          Animated.spring(scale, { toValue: 1, useNativeDriver: true, tension: 50, friction: 5 }),
          Animated.spring(slideY, { toValue: 0, useNativeDriver: true, tension: 50 }),
        ]),
        Animated.spring(checkScale, { toValue: 1, useNativeDriver: true, tension: 100, friction: 5 }),
      ]).start();

      const timer = setTimeout(() => {
        Animated.parallel([
          Animated.timing(opacity, { toValue: 0, duration: 400, useNativeDriver: true }),
          Animated.timing(scale, { toValue: 0.3, duration: 400, useNativeDriver: true }),
          Animated.timing(slideY, { toValue: 50, duration: 400, useNativeDriver: true }),
        ]).start(() => {
          checkScale.setValue(0);
          onHide && onHide();
        });
      }, 2500);

      return () => clearTimeout(timer);
    }
  }, [visible]);

  if (!visible) return null;

  const bgColor = type === "success" ? "#10B981" : type === "error" ? "#EF4444" : "#6366F1";
  const iconText = type === "success" ? "OK" : type === "error" ? "X" : "!";

  return (
    <Animated.View style={[styles.overlay, { opacity }]}>
      <Animated.View style={[styles.card, { backgroundColor: bgColor, transform: [{ scale }, { translateY: slideY }] }]}>
        <Animated.View style={[styles.iconCircle, { transform: [{ scale: checkScale }] }]}>
          <Text style={styles.iconText}>{iconText}</Text>
        </Animated.View>
        <Text style={styles.message}>{message}</Text>
        <View style={styles.progressBar}>
          <Animated.View style={[styles.progressFill, { backgroundColor: "rgba(255,255,255,0.5)" }]} />
        </View>
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  overlay:      { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, justifyContent: "center", alignItems: "center", zIndex: 9999, backgroundColor: "rgba(0,0,0,0.3)" },
  card:         { width: 220, borderRadius: 24, padding: 28, alignItems: "center", elevation: 12, shadowColor: "#000", shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.4, shadowRadius: 16 },
  iconCircle:   { width: 70, height: 70, borderRadius: 35, backgroundColor: "rgba(255,255,255,0.25)", justifyContent: "center", alignItems: "center", marginBottom: 16, borderWidth: 3, borderColor: "rgba(255,255,255,0.6)" },
  iconText:     { fontSize: 28, fontWeight: "bold", color: "#fff" },
  message:      { fontSize: 15, color: "#fff", fontWeight: "600", textAlign: "center", lineHeight: 22 },
  progressBar:  { width: "100%", height: 3, backgroundColor: "rgba(255,255,255,0.2)", borderRadius: 2, marginTop: 16, overflow: "hidden" },
  progressFill: { height: "100%", width: "100%", borderRadius: 2 },
});
