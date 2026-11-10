import React from "react";
import { View } from "react-native";
import CustomText from "./CustomText";
import { formatNumber, toPersianDigits } from "../utils/invoiceHelpers";

type InvoiceComponentProps = {
  item: any;
  styles: any;
};

export default function InvoiceComponent({ item, styles }: InvoiceComponentProps) {
  return (
    
                          <View style={styles.miniInvoiceBox}>
                            <View style={styles.miniHeader}>
                              <CustomText style={[styles.miniCol, { flex: 2, textAlign: "right" }]}>
                                شرح کالا
                              </CustomText>
                              <CustomText
                                style={[
                                  styles.miniCol,
                                  { flex: 1, textAlign: "center" },
                                ]}
                              >
                                تعداد
                              </CustomText>
                              <CustomText
                                style={[
                                  styles.miniCol,
                                  { flex: 1.5, textAlign: "left" },
                                ]}
                              >
                                مبلغ (ریال)
                              </CustomText>
                            </View>
                            {Array.isArray(item.items) && item.items.length > 0 ? (
                              item.items.map((it: any, idx: number) => (
                                <View key={idx} style={styles.miniRow}>
                                  <CustomText
                                    style={[styles.miniCell, { flex: 2, textAlign: "right" }]}
                                  >
                                    {typeof it === "object" ? it.desc : it}
                                  </CustomText>
                                  <CustomText
                                    style={[
                                      styles.miniCell,
                                      { flex: 1, textAlign: "center" },
                                    ]}
                                  >
                                    {toPersianDigits(
                                      typeof it === "object" ? it.quantity : "1",
                                    )}
                                  </CustomText>
                                  <CustomText
                                    style={[
                                      styles.miniCell,
                                      { flex: 1.5, textAlign: "left" },
                                    ]}
                                  >
                                    {typeof it === "object" && it.unitPrice
                                      ? toPersianDigits(formatNumber(it.unitPrice))
                                      : "-"}
                                  </CustomText>
                                </View>
                              ))
                            ) : (
                              <View style={styles.miniRow}>
                                <CustomText style={styles.miniCell}>
                                  بدون قلم کالا
                                </CustomText>
                              </View>
                            )}
                            <View style={styles.miniFooter}>
                              <CustomText style={styles.miniFooterLabel}>
                                جمع کل:
                              </CustomText>
                              <CustomText style={styles.miniFooterVal}>
                                {toPersianDigits(formatNumber(item.amount))} ریال
                              </CustomText>
                            </View>
                          </View>
  );
}
