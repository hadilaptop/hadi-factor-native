import React from "react";
import { Modal, StyleSheet, TouchableOpacity, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import CustomText from "./CustomText";

type ExportAlertModalProps = {
  visible: boolean;
  title: string;
  message: string;
  success?: boolean;
  onClose: () => void;
};

export default function ExportAlertModal({
  visible,
  title,
  message,
  success = false,
  onClose,
}: ExportAlertModalProps) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <LinearGradient
          colors={["#0d2b43", "#0f4c75"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.box}
        >
          <View style={[styles.iconBg, success && styles.successIconBg]}>
            <Ionicons
              name={success ? "checkmark-circle-outline" : "warning-outline"}
              size={32}
              color={success ? "#34d399" : "#f59e0b"}
            />
          </View>
          <CustomText style={styles.title}>{title}</CustomText>
          <CustomText style={styles.message}>{message}</CustomText>
          <TouchableOpacity activeOpacity={0.8} style={styles.button} onPress={onClose}>
            <CustomText style={styles.buttonText}>متوجه شدم</CustomText>
          </TouchableOpacity>
        </LinearGradient>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  box: {
    width: "100%",
    maxWidth: 420,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#adc7d8",
    paddingVertical: 22,
    paddingHorizontal: 18,
    alignItems: "center",
    elevation: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 15,
  },
  iconBg: {
    backgroundColor: "rgba(245, 158, 11, 0.12)",
    width: 54,
    height: 54,
    borderRadius: 27,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 14,
  },
  successIconBg: {
    backgroundColor: "rgba(52, 211, 153, 0.12)",
  },
  title: {
    fontSize: 19,
    fontWeight: "900",
    color: "#ffffff",
    marginBottom: 10,
    textAlign: "center",
  },
  message: {
    fontSize: 15,
    color: "#ffffff",
    textAlign: "center",
    marginBottom: 20,
    lineHeight: 23,
  },
  button: {
    width: "70%",
    backgroundColor: "#145d8e",
    paddingVertical: 12,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
  },
  buttonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "bold",
  },
});
