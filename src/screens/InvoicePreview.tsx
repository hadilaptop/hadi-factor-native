import React from "react";
import { View, Text, StyleSheet, Image, useWindowDimensions } from "react-native";
import { Gesture, GestureDetector, GestureHandlerRootView } from "react-native-gesture-handler";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

// --- توابع کمکی ---
const toPersianDigits = (str: string | number) => {
  if (str === null || str === undefined) return "";
  const persianDigits = ["۰", "۱", "۲", "۳", "۴", "۵", "۶", "۷", "۸", "۹"];
  return str.toString().replace(/\d/g, (x) => persianDigits[parseInt(x, 10)]);
};

const formatNumber = (num: number | string) => {
  if (!num) return "";
  const cleanNum = num
    .toString()
    .replace(/,/g, "")
    .replace(/[۰-۹]/g, (c) => "0123456789"[c.charCodeAt(0) - 1776]);
  if (isNaN(Number(cleanNum)) || cleanNum === "") return "";
  return toPersianDigits(Number(cleanNum).toLocaleString("en-US"));
};

const parseNumber = (str: string | number) => {
  if (!str) return 0;
  if (typeof str === "number") return str;
  const englishStr = str
    .toString()
    .replace(/[۰-۹]/g, (c) => "0123456789"[c.charCodeAt(0) - 1776])
    .replace(/,/g, "");
  return parseInt(englishStr, 10) || 0;
};

interface InvoicePreviewProps {
  invoiceType: string;
  invoiceTheme?: string;
  sellerName: string;
  sellerAddress: string;
  sellerPhone: string;
  sellerEconomicCode: string;
  sellerLogo: string | null;
  invoiceNumber: string;
  invoiceDate: string;
  buyerName: string;
  buyerPhone: string;
  buyerEconomicCode: string;
  buyerAddress: string;
  rows: any[];
  grandTotal: number;
  amountInWords: string;
  noteText: string;
  captureTargetRef?: React.RefObject<View | null>;
}

const CARD_WIDTH = 950;
const CARD_MIN_HEIGHT = 1250;

export default function InvoicePreview({
  invoiceType,
  invoiceTheme = "blue",
  sellerName,
  sellerAddress,
  sellerPhone,
  sellerEconomicCode,
  sellerLogo,
  invoiceNumber,
  invoiceDate,
  buyerName,
  buyerPhone,
  buyerEconomicCode,
  buyerAddress,
  rows,
  grandTotal,
  amountInWords,
  noteText,
  captureTargetRef,
}: InvoicePreviewProps) {
  const { width, height } = useWindowDimensions();
  const themes: Record<string, { primary: string; secondary: string; light: string; border: string }> = {
    gold: { primary: "#7e5108", secondary: "#c69c3f", light: "#fbf3df", border: "#dfc98e" },
    blue: { primary: "#0f4c75", secondary: "#3282b8", light: "#eaf6fc", border: "#a2c8e2" },
    red: { primary: "#a10000", secondary: "#d64545", light: "#fff0f0", border: "#e5aaaa" },
    green: { primary: "#127547", secondary: "#2c9a68", light: "#eaf8f0", border: "#a5d7bd" },
    teal: { primary: "#13899d", secondary: "#32aabd", light: "#e8f8fa", border: "#a2dce3" },
  };
  const themeColors = themes[invoiceTheme] || themes.blue;
  const viewportHeight = Math.max(height - 260, 300);
  const initialScale = Math.min(Math.max((width - 30) / CARD_WIDTH, 0.1), 1);
  const initialTranslateY = (viewportHeight - (CARD_MIN_HEIGHT + 48)) / 2;
  const scale = useSharedValue(initialScale);
  const savedScale = useSharedValue(initialScale);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(initialTranslateY);
  const cardHeight = useSharedValue(CARD_MIN_HEIGHT + 48);
  const centeredTranslateY = useSharedValue(initialTranslateY);
  const startX = useSharedValue(0);
  const startY = useSharedValue(0);

  const pinch = Gesture.Pinch()
    .onUpdate((event) => {
      scale.value = Math.max(0.1, Math.min(4, savedScale.value * event.scale));
    })
    .onEnd(() => {
      savedScale.value = scale.value;
    });

  const pan = Gesture.Pan()
    .minPointers(1)
    .maxPointers(1)
    .onBegin(() => {
      startX.value = translateX.value;
      startY.value = translateY.value;
    })
    .onUpdate((event) => {
      translateX.value = startX.value + event.translationX;
      translateY.value = startY.value + event.translationY;
    });

  const doubleTap = Gesture.Tap()
    .numberOfTaps(2)
    .onEnd(() => {
      scale.value = withTiming(initialScale, { duration: 250 });
      savedScale.value = initialScale;
      translateX.value = withTiming(0, { duration: 250 });
      translateY.value = withTiming(centeredTranslateY.value, { duration: 250 });
    });

  const gestures = Gesture.Simultaneous(pinch, pan, doubleTap);
  const animatedCardStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale: scale.value },
    ],
  }));

  return (
    <GestureHandlerRootView style={styles.gestureRoot}>
      <View
        style={[styles.previewViewport, { height: viewportHeight }]}
        onLayout={(event) => {
          centeredTranslateY.value = (event.nativeEvent.layout.height - cardHeight.value) / 2;
          translateY.value = centeredTranslateY.value;
        }}
      >
        <GestureDetector gesture={gestures}>
          <Animated.View
            onLayout={(event) => {
              cardHeight.value = event.nativeEvent.layout.height;
              centeredTranslateY.value = (viewportHeight - cardHeight.value) / 2;
              translateY.value = centeredTranslateY.value;
            }}
            style={[styles.previewCard, animatedCardStyle]}
          >
            <View ref={captureTargetRef} collapsable={false} style={[styles.invoiceInner, { borderColor: themeColors.primary }]}>
              <View style={[styles.previewHeader, { borderBottomColor: themeColors.secondary }]}>
                <View style={styles.previewHeaderCenter}>
                  <Text style={[styles.previewTitle, { color: themeColors.primary }]}>{invoiceType}</Text>
                  <Text style={styles.previewSubBrand}>{sellerName || "نام شرکت"}</Text>
                </View>
                {(sellerLogo || sellerEconomicCode) ? (
                  <View style={styles.headerLogoEconomicLeft}>
                    {sellerLogo ? (
                      <Image source={{ uri: sellerLogo }} style={styles.sellerLogo} />
                    ) : null}
                    {sellerEconomicCode ? (
                      <Text style={styles.sellerEconomicCodeBadge}>
                        کد اقتصادی: {toPersianDigits(sellerEconomicCode)}
                      </Text>
                    ) : null}
                  </View>
                ) : null}
              </View>

              <View style={[styles.previewMeta, { backgroundColor: themeColors.light, borderColor: themeColors.border }]}>
                <View style={styles.metaItem}>
                  <Text style={styles.previewMetaLabel}>تاریخ فاکتور:</Text>
                  <Text style={styles.previewMetaValue}>{toPersianDigits(invoiceDate)}</Text>
                </View>
                <View style={styles.metaItem}>
                  <Text style={styles.previewMetaLabel}>شماره فاکتور:</Text>
                  <Text style={styles.previewMetaValue} numberOfLines={1}>
                    {toPersianDigits(invoiceNumber)}
                  </Text>
                </View>
              </View>

              <View style={styles.previewParties}>
                <View style={[styles.buyerLabelBox, { backgroundColor: themeColors.light, borderColor: themeColors.border }]}>
                  <Text style={[styles.buyerLabel, { color: themeColors.primary }]}>خریدار</Text>
                </View>
                <View style={[styles.previewBuyerBox, { backgroundColor: themeColors.light, borderColor: themeColors.border }]}>
                  <View style={styles.buyerMainInfo}>
                    <Text style={styles.previewBuyerName} numberOfLines={2}>{buyerName || "وارد نشده"}</Text>
                    {buyerAddress ? (
                      <Text style={styles.previewBuyerDetails}>آدرس: {buyerAddress}</Text>
                    ) : null}
                  </View>
                  <View style={styles.buyerExtraInfo}>
                    {buyerEconomicCode ? (
                      <Text style={styles.previewBuyerDetails}>
                        کد اقتصادی: {toPersianDigits(buyerEconomicCode)}
                      </Text>
                    ) : null}
                    {buyerPhone ? (
                      <Text style={styles.previewBuyerDetails}>
                        شماره تماس: {toPersianDigits(buyerPhone)}
                      </Text>
                    ) : null}
                  </View>
                </View>
              </View>

              <View style={styles.previewTable}>
                <View style={[styles.previewTableHeader, { backgroundColor: themeColors.light, borderBottomColor: themeColors.border }]}>
                  <Text style={[styles.previewTh, styles.colIndex]}>ردیف</Text>
                  <Text style={[styles.previewTh, styles.colDescription]}>شرح کالا</Text>
                  <Text style={[styles.previewTh, styles.colQuantity]}>تعداد</Text>
                  <Text style={[styles.previewTh, styles.colUnitPrice]}>قیمت واحد (ریال)</Text>
                  <Text style={[styles.previewTh, styles.colTotal]}>جمع کل (ریال)</Text>
                </View>
                {rows.map((row: any, idx: number) => {
                  const quantity = row.quantity === "" || row.quantity === undefined
                    ? 1
                    : parseNumber(row.quantity) || 1;
                  const price = row.unitPrice === "" || row.unitPrice === undefined
                    ? 0
                    : parseNumber(row.unitPrice) || 0;
                  return (
                    <View key={row.id ?? idx} style={styles.previewTableRow}>
                      <Text style={[styles.previewTd, styles.colIndex]}>
                        {toPersianDigits(idx + 1)}
                      </Text>
                      <Text style={[styles.previewTd, styles.colDescription, styles.descriptionText]}>
                        {row.desc || "محصول جدید"}
                      </Text>
                      <Text style={[styles.previewTd, styles.colQuantity]}>
                        {toPersianDigits(quantity)}
                      </Text>
                      <Text style={[styles.previewTd, styles.colUnitPrice]}>
                        {formatNumber(price)}
                      </Text>
                      <Text style={[styles.previewTd, styles.colTotal]}>
                        {formatNumber(quantity * price)}
                      </Text>
                    </View>
                  );
                })}
              </View>

              <View style={[styles.previewTotalFinal, { backgroundColor: themeColors.light }]}>
                <Text style={styles.previewTotalLabel}>مبلغ نهایی فاکتور:</Text>
                <Text style={styles.previewTotalValue}>{formatNumber(grandTotal)} ریال</Text>
              </View>

              <View style={[styles.amountInWords, { backgroundColor: themeColors.light, borderColor: themeColors.border }]}>
                <Text style={styles.amountInWordsText}>{amountInWords}</Text>
              </View>

              <View style={[styles.previewNoteBox,{backgroundColor: themeColors.light,borderColor: themeColors.secondary,},]}>
                <Text style={styles.previewNoteLabel}>توضیحات:</Text>
                <Text style={styles.previewNoteText}>{noteText}</Text>
              </View>

              <View style={[styles.previewFooter, { borderTopColor: themeColors.secondary, backgroundColor: themeColors.light }]}>
                <View style={[styles.previewDivider, { backgroundColor: themeColors.secondary }]} />
                <Text style={[styles.footerCompanyName, { color: themeColors.primary, backgroundColor: themeColors.light, borderColor: themeColors.border }]}>{sellerName || "نام شرکت"}</Text>
                {sellerAddress ? (
                  <Text style={styles.previewFooterText}>{sellerAddress}</Text>
                ) : null}
                {sellerPhone ? (
                  <Text style={styles.previewFooterText}>{toPersianDigits(sellerPhone)}</Text>
                ) : null}
              </View>
            </View>
          </Animated.View>
        </GestureDetector>
      </View>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  gestureRoot: {
    width: "100%",
  },
  previewViewport: {
    width: "100%",
    alignItems: "center",
    justifyContent: "flex-start",
  },
  previewCard: {
    width: CARD_WIDTH,
    padding: 24,
  },
  invoiceInner: {
    width: "100%",
    minHeight: CARD_MIN_HEIGHT,
    padding: 32,
    backgroundColor: "#fff",
    borderRadius: 28,
    borderWidth: 4,
    borderColor: "#0f4c75",
    flexDirection: "column",
  },
  previewHeader: {
    minHeight: 85,
    borderBottomWidth: 3,
    borderBottomColor: "#3282b8",
    paddingBottom: 8,
    marginBottom: 16,
    position: "relative",
    alignItems: "center",
    justifyContent: "flex-start",
  },
  previewHeaderCenter: {
    width: "100%",
    alignItems: "center",
  },
  previewTitle: {
    fontFamily: "Vazirmatn",
    fontSize: 32,
    
    color: "#0f4c75",
    textAlign: "center",
  },
  previewSubBrand: {
    fontFamily: "Vazirmatn",
    fontSize: 34,
    
    color: "#1b262c",
    textAlign: "center",
    marginTop: -10,
  },
  headerLogoEconomicLeft: {
    position: "absolute",
    left: 0,
    top: 0,
    maxWidth: 200,
    alignItems: "center",
    gap: 4,
  },
  sellerLogo: {
    width: 170,
    height: 60,
    resizeMode: "contain",
    borderRadius: 6,
  },
  sellerEconomicCodeBadge: {
    fontFamily: "Vazirmatn",
    fontSize: 14,
    
    color: "#0f4c75",
    backgroundColor: "#eaf6fc",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#a2c8e2",
  },
  previewMeta: {
    flexDirection: "row-reverse",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
    marginBottom: 8,
    paddingVertical: 5,
    paddingHorizontal: 10,
    backgroundColor: "#eaf6fc",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#a2c8e2",
  },
  metaItem: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(255,255,255,0.6)",
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 40,
  },
  previewMetaLabel: {
    fontFamily: "Vazirmatn",
    fontSize: 24,
    
    color: "#0f4c75",
  },
  previewMetaValue: {
    fontFamily: "Vazirmatn",
    fontSize: 24,
    
    color: "#0f4c75",
    backgroundColor: "#fff",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 30,
    borderWidth: 1,
    borderColor: "#3282b8",
    textAlign: "center",
  },
  previewParties: {
    flexDirection: "row-reverse",
    gap: 8,
    marginBottom: 8,
    alignItems: "stretch",
  },
  buyerLabelBox: {
    width: 120,
    minHeight: 85,
    justifyContent: "center",
    alignItems: "center",
    padding: 8,
    backgroundColor: "#eaf6fc",
    borderRadius: 15,
    borderWidth: 1,
    borderColor: "#a2c8e2",
  },
  buyerLabel: {
    fontFamily: "Vazirmatn",
    fontSize: 24,
    
    color: "#0f4c75",
  },
  previewBuyerBox: {
    flex: 1,
    minHeight: 85,
    flexDirection: "row-reverse",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 15,
    paddingVertical: 8,
    paddingHorizontal: 20,
    backgroundColor: "#eaf6fc",
    borderRadius: 15,
    borderWidth: 1,
    borderColor: "#a2c8e2",
  },
  buyerMainInfo: {
    flex: 1.2,
    alignItems: "flex-start",
    gap: 4,
  },
  buyerExtraInfo: {
    flex: 1,
    alignItems: "flex-start",
    justifyContent: "flex-end",
    gap: 8,
  },
  previewBuyerName: {
    fontFamily: "Vazirmatn",
    fontSize: 22,
    
    color: "#0f4c75",
    textAlign: "right",
    flexShrink: 1,
  },
  previewBuyerDetails: {
    fontFamily: "Vazirmatn",
    fontSize: 18,
    
    color: "#0f4c75",
    textAlign: "right",
    lineHeight: 26,
  },
  previewTable: {
    width: "100%",
    borderWidth: 1.2,
    borderColor: "#a2c8e2",
    marginBottom: 0,
  },
  previewTableHeader: {
    flexDirection: "row-reverse",
    backgroundColor: "#eaf6fc",
    borderBottomWidth: 1.2,
    borderBottomColor: "#a2c8e2",
  },
  previewTableRow: {
    flexDirection: "row-reverse",
    backgroundColor: "rgba(255,255,255,0.75)",
    borderBottomWidth: 1.2,
    borderBottomColor: "#a2c8e2",
    minHeight: 42,
  },
  previewTh: {
    fontFamily: "Vazirmatn",
    fontSize: 18,
    
    color: "#0f4c75",
    textAlign: "center",
    textAlignVertical: "center",
    paddingVertical: 8,
    paddingHorizontal: 5,
    borderLeftWidth: 1.2,
    borderLeftColor: "#a2c8e2",
  },
  previewTd: {
    fontFamily: "Vazirmatn",
    fontSize: 21,
    
    color: "#2d2a24",
    textAlign: "center",
    textAlignVertical: "center",
    padding: 6,
    borderLeftWidth: 1.2,
    borderLeftColor: "#a2c8e2",
  },
  descriptionText: {
    fontSize: 19,
    textAlign: "right",
  },
  colIndex: { width: "8%" },
  colDescription: { width: "29%" },
  colQuantity: { width: "13%" },
  colUnitPrice: { width: "22%" },
  colTotal: { width: "28%", borderLeftWidth: 0 },
  previewTotalFinal: {
    width: "70%",
    alignSelf: "flex-start",
    flexDirection: "row-reverse",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 10,
    marginTop: 10,
    paddingVertical: 12,
    paddingRight: 20,
    paddingLeft: 10,
    backgroundColor: "#eaf6fc",
    borderRadius: 30,
  },
  previewTotalLabel: {
    fontFamily: "Vazirmatn",
    fontSize: 24,
    
    color: "#0f4c75",
  },
  previewTotalValue: {
    fontFamily: "Vazirmatn",
    fontSize: 26,
    
    color: "#1b262c",
    textAlign: "left",
  },
  amountInWords: {
    marginTop: 16,
    marginBottom: 13,
    paddingVertical: 14,
    paddingHorizontal: 38,
    backgroundColor: "#f1f8fc",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#a2c8e2",
  },
  amountInWordsText: {
    fontFamily: "Vazirmatn",
    fontSize: 24,
    
    color: "#1b262c",
    textAlign: "right",
  },
  previewNoteBox: {
    marginTop: 10,
    marginBottom: 14,
    paddingVertical: 14,
    paddingHorizontal: 18,
    backgroundColor: "#f1f8fc",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#3282b8",
  },
  previewNoteLabel: {
    fontFamily: "Vazirmatn",
    fontSize: 24,
    
    color: "#0f4c75",
    textAlign: "right",
    marginBottom: 8,
  },
  previewNoteText: {
    fontFamily: "Vazirmatn",
    fontSize: 21,
    
    color: "#1b262c",
    textAlign: "right",
    lineHeight: 34,
  },
  previewFooter: {
    marginTop: "auto",
    paddingTop: 20,
    paddingBottom: 12,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderTopWidth: 2,
    borderTopColor: "#3282b8",
    backgroundColor: "#f1f8fc",
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  previewDivider: {
    width: "60%",
    height: 1,
    backgroundColor: "#3282b8",
    marginVertical: 4,
  },
  footerCompanyName: {
    fontFamily: "Vazirmatn",
    fontSize: 24,
    
    color: "#0f4c75",
    backgroundColor: "#eaf6fc",
    paddingVertical: 6,
    paddingHorizontal: 20,
    borderRadius: 40,
    borderWidth: 1,
    borderColor: "#a2c8e2",
  },
  previewFooterText: {
    fontFamily: "Vazirmatn",
    fontSize: 20,
    
    color: "#1b262c",
    textAlign: "center",
  },
});