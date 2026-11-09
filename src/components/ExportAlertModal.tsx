import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  Easing,
  Modal,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import Svg, { Path, Polyline } from "react-native-svg";
import CustomText from "./CustomText";

type ExportAlertModalProps = {
  visible: boolean;
  title: string;
  titleFontSize?: number;
  message: string;
  success?: boolean;
  error?: boolean;
  confirm?: boolean;
  confirmText?: string;
  cancelText?: string;
  onConfirm?: () => void;
  onClose: () => void;
};

export default function ExportAlertModal({
  visible,
  title,
  titleFontSize,
  message,
  success = false,
  error = false,
  confirm = false,
  confirmText = "تأیید",
  cancelText = "انصراف",
  onConfirm,
  onClose,
}: ExportAlertModalProps) {
  const [modalVisible, setModalVisible] = useState(visible);
  const overlayOpacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    if (visible) {
      setModalVisible(true);
      overlayOpacity.setValue(0);
      scale.setValue(0.8);

      Animated.parallel([
        Animated.timing(overlayOpacity, {
          toValue: 1,
          duration: 300,
          easing: Easing.ease,
          useNativeDriver: true,
        }),
        Animated.timing(scale, {
          toValue: 1,
          duration: 400,
          easing: Easing.bezier(0.175, 0.885, 0.32, 1.275),
          useNativeDriver: true,
        }),
      ]).start();
    } else if (modalVisible) {
      setModalVisible(false);
    }
  }, [visible]);

  return (
    <Modal
      visible={modalVisible}
      transparent
      animationType="none"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <Animated.View
          pointerEvents="none"
          style={[StyleSheet.absoluteFill, { opacity: overlayOpacity }]}
        >
          <BlurView
            intensity={30}
            tint="dark"
            experimentalBlurMethod="dimezisBlurView"
            style={StyleSheet.absoluteFill}
          />
          <View style={styles.backdropDim} />
        </Animated.View>
        <Animated.View
          style={{
            width: "86%",
            maxWidth: 320,
            transform: [{ scale }],
          }}
        >
          <LinearGradient
            colors={["#142a3c", "#15537d"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.box}
          >
            <View
              style={[
                styles.iconBg,
                success && styles.successIconBg,
                error && styles.errorIconBg,
              ]}
            >
              {success ? (
                <Svg width={28} height={28} viewBox="0 0 24 24" fill="none">
                  <Path
                    d="M22 11.08V12a10 10 0 1 1-5.93-9.14"
                    stroke="#34d399"
                    strokeWidth={2.5}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <Polyline
                    points="22,4 12,14.01 9,11.01"
                    stroke="#34d399"
                    strokeWidth={2.5}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </Svg>
              ) : error ? (
                <Ionicons name="close-circle-outline" size={28} color="#f87171" />
              ) : (
                <Ionicons name="warning-outline" size={28} color="#f59e0b" />
              )}
            </View>
            <CustomText
              style={[
                styles.title,
                titleFontSize != null && { fontSize: titleFontSize },
                titleFontSize != null && styles.compactTitle,
              ]}
            >
              {title}
            </CustomText>
            <CustomText style={styles.message}>{message}</CustomText>
            {confirm ? (
              <View style={styles.buttonRow}>
                <TouchableOpacity
                  activeOpacity={0.8}
                  style={[styles.button, styles.cancelButton]}
                  onPress={onClose}
                >
                  <CustomText style={styles.buttonText}>{cancelText}</CustomText>
                </TouchableOpacity>
                <TouchableOpacity
                  activeOpacity={0.8}
                  style={[styles.button, styles.confirmButton]}
                  onPress={onConfirm}
                >
                  <CustomText style={styles.buttonText}>{confirmText}</CustomText>
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity
                activeOpacity={0.8}
                style={styles.button}
                onPress={onClose}
              >
                <CustomText style={styles.buttonText}>متوجه شدم</CustomText>
              </TouchableOpacity>
            )}
          </LinearGradient>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  backdropDim: {
    ...StyleSheet.absoluteFill,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
  },
  box: {
    width: "100%",
    maxWidth: 320,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#FFFFFF",
    paddingVertical: 25,
    paddingHorizontal: 20,
    alignItems: "center",
    elevation: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
  },
  iconBg: {
    backgroundColor: "rgba(245, 158, 11, 0.12)",
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 10,
  },
  successIconBg: {
    backgroundColor: "rgba(52, 211, 153, 0.12)",
  },
  errorIconBg: {
    backgroundColor: "rgba(248, 113, 113, 0.12)",
  },
  title: {
    width: "100%",
    fontSize: 17,
    fontWeight: "900",
    color: "#ffffff",
    marginBottom: 6,
    textAlign: "center",
  },
  compactTitle: {
    writingDirection: "rtl",
    textAlign: "center",
    includeFontPadding: true,
    flexShrink: 0,
    alignSelf: "stretch",
  },
  message: {
    fontSize: 13,
    color: "#ffffff",
    textAlign: "center",
    marginBottom: 14,
    lineHeight: 19,
  },
  button: {
    width: "65%",
    backgroundColor: "#145d8e",
    paddingVertical: 9,
    borderRadius: 9,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
  },
  buttonRow: {
    width: "100%",
    flexDirection: "row-reverse",
    gap: 10,
  },
  cancelButton: {
    flex: 1,
    width: "auto",
    backgroundColor: "#64748b",
  },
  confirmButton: {
    flex: 1,
    width: "auto",
    backgroundColor: "#dc2626",
  },
  buttonText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "bold",
  },
});