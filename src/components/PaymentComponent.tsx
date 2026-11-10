import React from "react";
import { View } from "react-native";
import CustomText from "./CustomText";
import { formatNumber, toPersianDigits } from "../utils/invoiceHelpers";

type PaymentComponentProps = {
  item: any;
  styles: any;
};

export default function PaymentComponent({ item, styles }: PaymentComponentProps) {
  return (
    
                          <View style={styles.detailsBox}>
                            <View style={styles.detailRowBetween}>
                              <CustomText style={styles.detailLabel}>
                                مبلغ دریافتی:
                              </CustomText>
                              <CustomText style={styles.amountValue}>
                                {toPersianDigits(formatNumber(item.amount))} ریال
                              </CustomText>
                            </View>
                            {(item.method === "چک" ||
                              item.bankName ||
                              item.checkNumber) && (
                              <View style={styles.checkSubDetails}>
                                {!!item.bankName && (
                                  <CustomText style={styles.subDetailText}>
                                    🏦 بانک: {item.bankName}
                                  </CustomText>
                                )}
                                {!!item.checkNumber && (
                                  <CustomText style={styles.subDetailText}>
                                    🔢 شماره چک: {toPersianDigits(item.checkNumber)}
                                  </CustomText>
                                )}
                                {!!item.checkDate && (
                                  <CustomText style={styles.subDetailText}>
                                    📆 تاریخ سررسید:{" "}
                                    {toPersianDigits(item.checkDate)}
                                  </CustomText>
                                )}
                              </View>
                            )}
                            {!!item.note?.trim() && (
                              <View style={styles.checkSubDetails}>
                                <CustomText style={styles.subDetailText}>
                                  توضیحات: {item.note.trim()}
                                </CustomText>
                              </View>
                            )}
                          </View>
  );
}
