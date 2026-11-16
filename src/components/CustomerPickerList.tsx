import React from "react";
import { FlatList, StyleSheet, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import CustomText from "./CustomText";
import { toPersianDigits } from "../utils/numberUtils";

type Customer = {
  id: string | number;
  name: string;
  customerCode?: string | number | null;
};

type CustomerPickerRow = {
  id: string | number | null;
  name: string;
  customerCode?: string | number | null;
};

type CustomerPickerListProps = {
  customers: Customer[];
  selectedCustomerId: string | number | null;
  onSelect: (customerId: string | number | null) => void;
  allowEmptyOption?: boolean;
  emptyOptionLabel?: string;
  emptyMessage?: string;
  itemGap?: number;
  codeFontSize?: number;
};

export default function CustomerPickerList({
  customers,
  selectedCustomerId,
  onSelect,
  allowEmptyOption = false,
  emptyOptionLabel = "مشتری جدید",
  emptyMessage = "هنوز مشتری‌ای ثبت نشده است.",
  itemGap,
  codeFontSize = 14,
}: CustomerPickerListProps) {
  const rows: CustomerPickerRow[] = allowEmptyOption
    ? [{ id: null, name: emptyOptionLabel }, ...customers]
    : customers;

  return (
    <FlatList
      data={rows}
      keyExtractor={(item) =>
        item.id == null ? "__new_customer_option__" : String(item.id)
      }
      extraData={selectedCustomerId}
      style={styles.list}
      showsVerticalScrollIndicator
      keyboardShouldPersistTaps="always"
      ListEmptyComponent={
        <CustomText style={styles.emptyText}>{emptyMessage}</CustomText>
      }
      renderItem={({ item }) => {
        const isSelected =
          String(item.id ?? "") === String(selectedCustomerId ?? "");

        return (
          <TouchableOpacity
            style={[
              styles.item,
              itemGap != null && { gap: itemGap },
              isSelected && styles.itemSelected,
            ]}
            onPress={() => onSelect(item.id)}
            activeOpacity={0.8}
          >
            <CustomText style={styles.itemText} numberOfLines={2}>
              {item.name}
            </CustomText>
            {isSelected && (
              <Ionicons name="checkmark" size={18} color="#fff" />
            )}
            {item.customerCode != null && (
              <CustomText
                style={[styles.codeText, { fontSize: codeFontSize }]}
              >
                {toPersianDigits(String(item.customerCode))}
              </CustomText>
            )}
          </TouchableOpacity>
        );
      }}
    />
  );
}

const styles = StyleSheet.create({
  list: {
    height: 234,
  },
  item: {
    minHeight: 44,
    paddingVertical: 11,
    paddingHorizontal: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#a2c8e2",
    marginBottom: 4,
    flexDirection: "row-reverse",
    alignItems: "center",
    justifyContent: "space-between",
  },
  itemSelected: {
    backgroundColor: "#10b981",
    borderColor: "#10b981",
  },
  itemText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "600",
    textAlign: "right",
    flex: 1,
  },
  codeText: {
    color: "#ffffff",
    fontWeight: "600",
    marginLeft: 8,
  },
  emptyText: {
    color: "#ffffff",
    textAlign: "center",
    padding: 20,
    fontSize: 15,
  },
});
