import React from "react";
import { View, TouchableOpacity, StyleSheet } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import CustomText from "./CustomText";
import CustomTextInput from "./CustomTextInput";
import {
  toPersianDigits,
  formatNumber,
  parseNumber,
  convertNumberToPersianWords,
} from "../utils/numberUtils";

type InvoiceItem = {
  id: string | number;
  desc: string;
  quantity: string;
  unitPrice: string;
};

type InvoiceItemsListProps = {
  rows: InvoiceItem[];
  grandTotal: number;
  canAddRow: boolean;
  onAddRow: () => void;
  onRemoveRow: (index: number) => void;
  onChangeRow: (
    index: number,
    field: "desc" | "quantity" | "unitPrice",
    value: string,
  ) => void;
};

export default function InvoiceItemsList({
  rows,
  grandTotal,
  canAddRow,
  onAddRow,
  onRemoveRow,
  onChangeRow,
}: InvoiceItemsListProps) {
  return (
    <LinearGradient
      colors={["#1f5579", "#347dad"]}
      start={{ x: 1, y: 0 }}
      end={{ x: 0, y: 1 }}
      style={styles.card}
    >
      <View style={styles.rowHeader}>
        <CustomText style={styles.sectionTitle}>
          اقلام و کالاهای فاکتور
        </CustomText>
        <TouchableOpacity
          style={styles.addButton}
          onPress={onAddRow}
          disabled={!canAddRow}
        >
          <CustomText style={styles.addButtonText}>
            + سطر جدید ({toPersianDigits(rows.length.toString())})
          </CustomText>
        </TouchableOpacity>
      </View>

      {rows.map((row, index) => (
        <View key={row.id} style={styles.itemRow}>
          <View style={styles.itemRowTop}>
            <CustomText style={styles.itemBadge}>
              سطر {toPersianDigits((index + 1).toString())}
            </CustomText>
            {rows.length > 1 && (
              <TouchableOpacity
                onPress={() => onRemoveRow(index)}
                style={styles.deleteBtn}
                accessibilityRole="button"
                accessibilityLabel={`حذف سطر ${index + 1}`}
              >
                <Ionicons name="trash-outline" size={16} color="#ffffff" />
              </TouchableOpacity>
            )}
          </View>

          <CustomText style={styles.labelSm}>شرح کالا / خدمات</CustomText>
          <CustomTextInput
            style={[styles.input, { marginBottom: 8 }]}
            placeholderTextColor="rgba(255,255,255,0.45)"
            placeholder="محصول جدید"
            value={row.desc}
            onChangeText={(value: string) => onChangeRow(index, "desc", value)}
          />

          <View style={styles.rowInputGroup}>
            <View style={{ flex: 1 }}>
              <CustomText style={styles.labelSm}>تعداد</CustomText>
              <CustomTextInput
                style={[styles.input, { textAlign: "center" }]}
                placeholderTextColor="rgba(255,255,255,0.45)"
                placeholder="0"
                keyboardType="numeric"
                value={row.quantity}
                onChangeText={(value: string) =>
                  onChangeRow(
                    index,
                    "quantity",
                    value.replace(/[^0-9۰-۹]/g, ""),
                  )
                }
              />
            </View>
            <View style={{ flex: 2 }}>
              <CustomText style={styles.labelSm}>قیمت واحد (ریال)</CustomText>
              <CustomTextInput
                style={[styles.input, { textAlign: "left" }]}
                placeholderTextColor="rgba(255,255,255,0.45)"
                placeholder="۰"
                keyboardType="numeric"
                value={row.unitPrice ? formatNumber(row.unitPrice) : ""}
                onChangeText={(value: string) =>
                  onChangeRow(
                    index,
                    "unitPrice",
                    value.replace(/[^0-9۰-۹]/g, ""),
                  )
                }
              />
            </View>
          </View>

          <View style={styles.itemTotalBox}>
            <CustomText style={styles.labelSm}>
              جمع:{" "}
              {formatNumber(
                (parseNumber(row.quantity) || 1) *
                  (parseNumber(row.unitPrice) || 0),
              )}{" "}
              ریال
            </CustomText>
          </View>
        </View>
      ))}

      <View style={styles.totalBox}>
        <CustomText style={styles.totalTitle}>مبلغ کل فاکتور:</CustomText>
        <CustomText style={styles.totalAmount}>
          {formatNumber(grandTotal)}{" "}
          <CustomText style={styles.currencyText}>ریال</CustomText>
        </CustomText>
      </View>
      <View style={styles.wordsBox}>
        <CustomText style={styles.wordsText}>
          {convertNumberToPersianWords(grandTotal)}
        </CustomText>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 22,
    padding: 18,
    marginBottom: 15,
    elevation: 5,
    shadowColor: "#22628e",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 15,
    borderWidth: 1,
    borderColor: "#a2c8e2",
  },
  sectionTitle: {
    color: "#fff",
    fontSize: 16,
    marginBottom: 12,
    textAlign: "right",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.2)",
    paddingBottom: 8,
  },
  rowHeader: {
    flexDirection: "row-reverse",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.2)",
    paddingBottom: 8,
  },
  addButton: {
    backgroundColor: "#10b981",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
  },
  addButtonText: {
    color: "#fff",
    fontSize: 13,
  },
  itemRow: {
    backgroundColor: "rgba(255,255,255,0.08)",
    padding: 14,
    borderRadius: 18,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "rgba(40,227,30,0.6)",
  },
  itemRowTop: {
    flexDirection: "row-reverse",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.2)",
    paddingBottom: 8,
  },
  itemBadge: {
    color: "#fff",
    fontSize: 13,
    backgroundColor: "rgba(255,255,255,0.2)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  deleteBtn: {
    backgroundColor: "#ef4444",
    padding: 6,
    borderRadius: 8,
  },
  labelSm: {
    fontSize: 13,
    color: "#ffffff",
    textAlign: "right",
    marginBottom: 4,
  },
  input: {
    backgroundColor: "rgba(255, 255, 255, 0.12)",
    borderWidth: 1.5,
    borderColor: "rgba(255, 255, 255, 0.35)",
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 12,
    color: "#fff",
    textAlign: "right",
    fontSize: 15,
  },
  rowInputGroup: {
    flexDirection: "row-reverse",
    gap: 10,
    marginTop: 5,
  },
  itemTotalBox: {
    marginTop: 10,
    backgroundColor: "rgba(13,43,67,0.45)",
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.25)",
  },
  totalBox: {
    marginTop: 10,
    padding: 16,
    backgroundColor: "rgba(13,43,67,0.5)",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#a2c8e2",
  },
  totalTitle: {
    color: "#fff",
    fontSize: 15,
    textAlign: "right",
    marginBottom: 4,
  },
  totalAmount: {
    color: "#fff",
    fontSize: 22,
    textAlign: "left",
  },
  currencyText: {
    fontSize: 15,
    color: "#e0f2fe",
  },
  wordsBox: {
    marginTop: 10,
    backgroundColor: "rgba(255,255,255,0.1)",
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
  },
  wordsText: {
    color: "#e0f2fe",
    fontSize: 14,
    textAlign: "center",
    lineHeight: 22,
  },
});