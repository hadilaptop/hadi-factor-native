import React, { ReactNode } from "react";
import { Modal, Pressable, View, StyleSheet, ViewStyle } from "react-native";

type ActionDropdownProps = {
  visible: boolean;
  position: { top: number; left: number };
  onClose: () => void;
  children: ReactNode;
  menuStyle?: ViewStyle;
};

export default function ActionDropdown({
  visible,
  position,
  onClose,
  children,
  menuStyle,
}: ActionDropdownProps) {
  return (
    <Modal
      visible={visible}
      transparent
      statusBarTranslucent
      animationType="none"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <View
          style={[styles.menu, menuStyle, position]}
          onStartShouldSetResponder={() => true}
        >
          {children}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1 },
  menu: {
    position: "absolute",
    backgroundColor: "#1f5579",
    borderWidth: 1,
    borderColor: "#e2e5e8",
    borderRadius: 10,
    minWidth: 160,
    zIndex: 1000,
    elevation: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },
});
