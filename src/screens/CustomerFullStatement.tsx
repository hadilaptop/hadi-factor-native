import React, { useState, useMemo, useRef } from "react";
import { exportViewFile } from "../services/documentExport";
import {
  Gesture,
  GestureDetector,
  GestureHandlerRootView,
} from "react-native-gesture-handler";
import Animated, {
  SlideInLeft,
  SlideInRight,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useWindowDimensions } from "react-native";
import { View, TouchableOpacity, Modal, StyleSheet } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import Svg, { Path, Polyline, Circle } from "react-native-svg";
import Header from "../components/Header";
import ExportAlertModal from "../components/ExportAlertModal";
import CustomText from "../components/CustomText";
import CustomTextInput from "../components/CustomTextInput";
import {
  toPersianDigits,
  formatNumber,
  getCurrentPersianDate,
} from "../utils/invoiceHelpers";
import { Customer } from "../storage/customerStorage";

const STATEMENT_CARD_WIDTH = 950;

type CustomerFullStatementProps = {
  customer: Customer;
  payments?: any[];
  invoices?: any[];
  onBack: () => void;
  onNavigate?: (screen: string) => void;
};

export default function CustomerFullStatement({
  customer,
  payments = [],
  invoices = [],
  onBack,
  onNavigate,
}: CustomerFullStatementProps) {
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [tempStartDate, setTempStartDate] = useState("");
  const [tempEndDate, setTempEndDate] = useState("");
  const [sortOrder, setSortOrder] = useState<"desc" | "asc">("asc");
  const [expandedItems, setExpandedItems] = useState<{
    [key: string]: boolean;
  }>({});
  const [showDateModal, setShowDateModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState<
    "share" | "save" | null
  >(null);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [exportAlert, setExportAlert] = useState({ visible: false, title: "", message: "", success: false });
  const statementCaptureRef = useRef<View>(null);

  const { width } = useWindowDimensions();
  const initialScale = Math.min(
    Math.max((width - 30) / STATEMENT_CARD_WIDTH, 0.1),
    1,
  );
  const insets = useSafeAreaInsets();
  const safePaddingBottom = insets.bottom > 0 ? insets.bottom + 5 : 10;
  const bottomNavHeight = 55 + safePaddingBottom;

  const scale = useSharedValue(initialScale);
  const savedScale = useSharedValue(initialScale);
  const translateX = useSharedValue((width - 20 - STATEMENT_CARD_WIDTH) / 2);
  const translateY = useSharedValue(0);
  const viewportHeight = useSharedValue(0);
  const cardHeight = useSharedValue(0);
  const centeredTranslateY = useSharedValue(0);
  const lastPanTranslationX = useSharedValue(0);
  const lastPanTranslationY = useSharedValue(0);
  const hasInitialVerticalPosition = useRef(false);

  const updateCenteredPosition = (height: number) => {
    if (hasInitialVerticalPosition.current || cardHeight.value <= 0) return;
    const topOffset = 0;
    centeredTranslateY.value = topOffset;
    translateY.value = topOffset;
    hasInitialVerticalPosition.current = true;
  };

  const pinch = Gesture.Pinch()
    .onUpdate((event) => {
      const nextScale = Math.max(
        0.1,
        Math.min(4, savedScale.value * event.scale),
      );
      const scaleRatio = nextScale / scale.value;

      translateX.value +=
        (event.focalX - STATEMENT_CARD_WIDTH / 2 - translateX.value) *
        (1 - scaleRatio);
      translateY.value +=
        (event.focalY - translateY.value) *
        (1 - scaleRatio);
      scale.value = nextScale;
    })
    .onEnd(() => {
      savedScale.value = scale.value;
    });

  const pan = Gesture.Pan()
    .minPointers(1)
    .maxPointers(1)
    .onBegin(() => {
      lastPanTranslationX.value = 0;
      lastPanTranslationY.value = 0;
    })
    .onUpdate((event) => {
      if (event.numberOfPointers > 1) {
        lastPanTranslationX.value = event.translationX;
        lastPanTranslationY.value = event.translationY;
        return;
      }
      translateX.value += event.translationX - lastPanTranslationX.value;
      translateY.value += event.translationY - lastPanTranslationY.value;
      lastPanTranslationX.value = event.translationX;
      lastPanTranslationY.value = event.translationY;
    });

  const doubleTap = Gesture.Tap()
    .numberOfTaps(2)
    .maxDuration(250)
    .maxDistance(10)
    .onEnd(() => {
      scale.value = withTiming(initialScale, { duration: 250 });
      savedScale.value = initialScale;
      translateX.value = withTiming(
        (width - 20 - STATEMENT_CARD_WIDTH) / 2,
        { duration: 250 },
      );
      translateY.value = withTiming(centeredTranslateY.value, {
        duration: 250,
      });
    });

  const gestures = Gesture.Simultaneous(pinch, pan, doubleTap);
const animatedCardStyle = useAnimatedStyle(() => ({
  transformOrigin: "top center",
  transform: [
    { translateX: translateX.value },
    { translateY: translateY.value },
    { scale: scale.value },
  ],
}));

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 2500);
  };

  const custPayments = useMemo(
    () => payments.filter((p) => String(p.customerId) === String(customer?.id)),
    [payments, customer?.id],
  );

  const custInvoices = useMemo(
    () =>
      invoices.filter((inv) => String(inv.customerId) === String(customer?.id)),
    [invoices, customer?.id],
  );

  const { statementTransactions, startBalance, endBalance, isFiltered } =
    useMemo(() => {
      const pItems = custPayments.map((p) => ({
        id: `p-${p.id}`,
        originalId: p.id,
        kind: "payment",
        type: `دریافتی (${p.method || "نقدی"})`,
        method: p.method || "نقدی",
        date: p.date || "",
        rawDate: p.createdAt || p.date || "",
        amount: Number(p.amount || 0),
      }));

      const iItems = custInvoices
        .filter((inv) => inv.type !== "پیش فاکتور")
        .map((inv) => {
          let parsedItems = inv.items;
          if (typeof inv.items === "string") {
            try {
              parsedItems = JSON.parse(inv.items);
            } catch (e) {
              parsedItems = [];
            }
          }
          return {
            id: `i-${inv.id}`,
            originalId: inv.id,
            kind: "invoice",
            type: inv.type || "فاکتور",
            number: inv.number,
            date: inv.date || "",
            rawDate: inv.createdAt || inv.date || "",
            amount: Number(inv.amount || 0),
            items: parsedItems || [],
          };
        });

      const padDate = (d: string) => {
        if (!d) return "";
        const parts = d.split("/");
        if (parts.length === 3) {
          return `${parts[0]}/${parts[1].padStart(2, "0")}/${parts[2].padStart(2, "0")}`;
        }
        return d;
      };

      const allChronological = [...pItems, ...iItems].sort((a, b) => {
        const aDate = padDate(a.date);
        const bDate = padDate(b.date);
        if (aDate && bDate && aDate !== bDate)
          return aDate.localeCompare(bDate);
        return (a.rawDate || "").localeCompare(b.rawDate || "");
      });

      const processed = allChronological.reduce((acc: any[], item: any) => {
        const lastBal = acc.length > 0 ? acc[acc.length - 1].balanceAfter : 0;
        let newBal = lastBal;
        if (item.kind === "invoice") newBal += item.amount;
        else if (item.kind === "payment") newBal -= item.amount;
        acc.push({ ...item, balanceAfter: newBal });
        return acc;
      }, []);

      let filtered = processed;
      let sBalance = 0;
      const hasFilter = !!(startDate || endDate);

      if (hasFilter) {
        if (startDate) {
          const beforeStart = processed.filter((item) => item.date < startDate);
          sBalance =
            beforeStart.length > 0
              ? beforeStart[beforeStart.length - 1].balanceAfter
              : 0;
        }
        filtered = processed.filter((item) => {
          if (startDate && item.date < startDate) return false;
          if (endDate && item.date > endDate) return false;
          return true;
        });
      }

      const eBalance =
        filtered.length > 0
          ? filtered[filtered.length - 1].balanceAfter
          : sBalance;

      if (sortOrder === "desc") {
        filtered = [...filtered].reverse();
      }

      return {
        statementTransactions: filtered,
        startBalance: sBalance,
        endBalance: eBalance,
        isFiltered: hasFilter,
      };
    }, [custPayments, custInvoices, startDate, endDate, sortOrder]);

  const toggleExpand = (id: string) => {
    setExpandedItems((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const isAnyExpanded = Object.keys(expandedItems).length > 0;

  const toggleAllExpanded = () => {
    if (isAnyExpanded) {
      setExpandedItems({});
    } else {
      const all: { [key: string]: boolean } = {};
      statementTransactions.forEach((t: any) => {
        if (t.kind === "invoice") all[t.id] = true;
      });
      setExpandedItems(all);
    }
  };

  const handleExport = async (type: "png" | "pdf") => {
    const action = showExportModal;
    setShowExportModal(null);
    if (action !== "share" && action !== "save") return;
    await exportViewFile({
      viewRef: statementCaptureRef,
      format: type,
      action,
      filename: `صورت-حساب-${customer?.name || "مشتری"}`,
      onAlert: (title, message, success) => setExportAlert({ visible: true, title, message, success }),
    });
  };

  return (
    <View style={styles.container}>
      <View style={{ zIndex: 10, elevation: 10 }}>
        <Header
          title={customer?.name}
          subtitle="صورت حساب"
          onBack={onBack}
          iconName="arrow-back"
        />
      </View>

      {/* Action Filter Bar */}
      <Animated.View
        entering={SlideInRight.duration(250)}
        style={{ zIndex: 20, elevation: 20 }}
      >
        <LinearGradient
          colors={["#22628e", "#2f77a7"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.filterBar, { direction: "ltr" }]}
        >
          <View style={styles.tabsRow}>
            <TouchableOpacity
              style={styles.sortBtn}
              onPress={() =>
                setSortOrder(sortOrder === "desc" ? "asc" : "desc")
              }
            >
              <Ionicons name="swap-vertical" size={22} color="#ffffff" />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.expandBtn}
              onPress={toggleAllExpanded}
            >
              <Ionicons
                name={isAnyExpanded ? "chevron-up" : "chevron-down"}
                size={20}
                color="#ffffff"
              />
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={[
              styles.tabBtn,
              (startDate || endDate) && styles.tabBtnActive,
            ]}
            onPress={() => {
              setTempStartDate(startDate || getCurrentPersianDate());
              setTempEndDate(endDate || getCurrentPersianDate());
              setShowDateModal(true);
            }}
          >
            <Ionicons name="calendar-outline" size={20} color="#ffffff" />
            <CustomText style={styles.tabBtnText}>تاریخ</CustomText>
          </TouchableOpacity>
        </LinearGradient>
      </Animated.View>

      {/* Main Statement Content View */}
      <Animated.View
        entering={SlideInRight.duration(250)}
        style={{ flex: 1, zIndex: 0, elevation: 0 }}
      >
        <GestureHandlerRootView style={styles.statementCardWrapper}>
          <View
            style={styles.statementViewport}
            onLayout={(event) => {
              viewportHeight.value = event.nativeEvent.layout.height;
              updateCenteredPosition(event.nativeEvent.layout.height);
            }}
          >
            <GestureDetector gesture={gestures}>
              <Animated.View
                style={styles.statementCardContent}
                onLayout={(event) => {
                  cardHeight.value = event.nativeEvent.layout.height;
                  if (viewportHeight.value > 0)
                    updateCenteredPosition(viewportHeight.value);
                }}
              >
                <Animated.View
                  ref={statementCaptureRef}
                  collapsable={false}
                  style={[styles.statementCard, animatedCardStyle]}
                >
                  <View style={styles.cardHeader}>
                    <CustomText style={styles.cardTitle}>
                      صورت حساب {customer?.name}
                    </CustomText>
                    {isFiltered && (
                      <CustomText style={styles.cardSubtitle}>
                        {startDate ? `از: ${toPersianDigits(startDate)} ` : ""}
                        {endDate ? `تا: ${toPersianDigits(endDate)}` : ""}
                      </CustomText>
                    )}
                  </View>

                  {/* Table */}
                  <View style={styles.table}>
                    {/* Header Row */}
                    <View style={styles.tableHeader}>
                      <CustomText
                        style={[styles.th, { flex: 1.2, textAlign: "right", paddingRight: 10 }]}
                      >
                        تاریخ
                      </CustomText>
                      <CustomText style={[styles.th, { flex: 2.2 , textAlign: "right", paddingRight: 20 }]}
                       >
                        شرح
                      </CustomText>
                      <CustomText
                        style={[styles.th, { flex: 1.5, textAlign: "left", paddingLeft: 5, color: "#d32f2f" }]}
                      >
                        بدهکار
                      </CustomText>
                      <CustomText
                        style={[styles.th, { flex: 1.5, textAlign: "left", paddingLeft: 5, color: "#2e7d32" }]}
                      >
                        بستانکار
                      </CustomText>
                      <CustomText
                        style={[styles.th, { flex: 1.6, textAlign: "left" ,paddingLeft: 15}]}
                      >
                        مانده
                      </CustomText>   
                    </View>

                    {/* Start Balance Row */}
                    {isFiltered && startBalance !== 0 && (
                      <View style={[styles.tableRow, styles.startBalanceRow]}>
                        <CustomText style={[styles.td, { flex: 1.2 }]}>
                          -
                        </CustomText>
                        <CustomText style={[styles.td, { flex: 2.2 }]}>
                          مانده از قبل
                        </CustomText>
                        <CustomText
                          style={[styles.td, { flex: 1.5 }]}
                        ></CustomText>
                        <CustomText
                          style={[styles.td, { flex: 1.5 }]}
                        ></CustomText>
                        <CustomText
                          style={[
                            styles.td,
                            { flex: 1.6, textAlign: "right" },
                            startBalance > 0
                              ? styles.textDebt
                              : styles.textCredit,
                          ]}
                        >
                          {toPersianDigits(
                            formatNumber(Math.abs(startBalance)),
                          )}
                        </CustomText>
                      </View>
                    )}

                    {/* Transaction Rows */}
                    {statementTransactions.map((item: any) => (
                      <React.Fragment key={item.id}>
                        <TouchableOpacity
                          activeOpacity={item.kind === "invoice" ? 0.7 : 1}
                          style={[
                            styles.tableRow,
                            item.method === "تسویه حساب" &&
                              styles.settlementRow,
                          ]}
                          onPress={
                            item.kind === "invoice"
                              ? () => toggleExpand(item.id)
                              : undefined
                          }
                        >
                          <CustomText
                            style={[
                              styles.td,
                              { flex: 1.2, textAlign: "right", paddingRight: 8 }
                            ]}
                          >
                            {toPersianDigits(item.date)}
                          </CustomText>
                          <CustomText style={[styles.td, { flex: 2.2 ,textAlign: "right"}]}>
                            {item.kind === "invoice" ? (
                              <CustomText style={styles.invoiceLink}>
                                فاکتور فروش {toPersianDigits(item.number)}
                              </CustomText>
                            ) : (
                              <CustomText style={styles.textCredit}>
                                دریافتی ({item.method})
                              </CustomText>
                            )}
                          </CustomText>

                          <CustomText
                            style={[
                              styles.td,
                              { flex: 1.5, textAlign: "left", color: "#d32f2f" },
                            ]}
                          >
                            {item.kind === "invoice"
                              ? toPersianDigits(formatNumber(item.amount))
                              : ""}
                          </CustomText>

                          <CustomText
                            style={[
                              styles.td,
                              { flex: 1.5, textAlign: "left", color: "#2e7d32" },
                            ]}
                          >
                            {item.kind === "payment"
                              ? toPersianDigits(formatNumber(item.amount))
                              : ""}
                          </CustomText>

                          <CustomText
                            style={[
                              styles.td,
                              { flex: 1.6, textAlign: "left" , paddingLeft: 8},
                              item.balanceAfter > 0
                                ? styles.textDebt
                                : item.balanceAfter < 0
                                  ? styles.textCredit
                                  : {},
                            ]}
                          >
                            {item.balanceAfter !== 0
                              ? toPersianDigits(
                                  formatNumber(Math.abs(item.balanceAfter)),
                                )
                              : "۰"}
                          </CustomText>
                        </TouchableOpacity>

                        {/* Expanded Invoice Items */}
                        {item.kind === "invoice" &&
                          expandedItems[item.id] &&
                          item.items?.length > 0 && (
                            <View style={styles.expandedItemsBox}>
                              <View style={styles.expandedHeader}>
                                <CustomText style={[styles.expTh, { flex: 2 }]}>
                                  نام کالا
                                </CustomText>
                                <CustomText
                                  style={[
                                    styles.expTh,
                                    { flex: 1, textAlign: "center" },
                                  ]}
                                >
                                  تعداد
                                </CustomText>
                                <CustomText
                                  style={[
                                    styles.expTh,
                                    { flex: 1.2, textAlign: "left" },
                                  ]}
                                >
                                  فی
                                </CustomText>
                                <CustomText
                                  style={[
                                    styles.expTh,
                                    { flex: 1.3, textAlign: "left" },
                                  ]}
                                >
                                  جمع
                                </CustomText>
                              </View>

                              {item.items.map((it: any, idx: number) => (
                                <View key={idx} style={styles.expandedRow}>
                                  <CustomText
                                    style={[styles.expTd, { flex: 2 }]}
                                  >
                                    {toPersianDigits(it.desc || it)}
                                  </CustomText>
                                  <CustomText
                                    style={[
                                      styles.expTd,
                                      { flex: 1, textAlign: "center" },
                                    ]}
                                  >
                                    {toPersianDigits(it.quantity || "1")}
                                  </CustomText>
                                  <CustomText
                                    style={[
                                      styles.expTd,
                                      { flex: 1.2, textAlign: "left" },
                                    ]}
                                  >
                                    {toPersianDigits(
                                      formatNumber(it.unitPrice || 0),
                                    )}
                                  </CustomText>
                                  <CustomText
                                    style={[
                                      styles.expTd,
                                      { flex: 1.3, textAlign: "left" },
                                    ]}
                                  >
                                    {toPersianDigits(
                                      formatNumber(
                                        Number(it.quantity || 1) *
                                          Number(it.unitPrice || 0),
                                      ),
                                    )}
                                  </CustomText>
                                </View>
                              ))}
                            </View>
                          )}
                      </React.Fragment>
                    ))}

                    {/* Final Balance Row */}
                    <View style={[styles.tableRow, styles.finalBalanceRow]}>
                      <CustomText
                        style={[
                          styles.td,
                          styles.finalBalanceLabel,
                          { flex: 3.4, fontSize: 20 },
                        ]}
                      >
                        مانده نهایی:
                      </CustomText>
                      <CustomText
                        style={[
                          styles.td,
                          { flex: 3.1, textAlign: "left", paddingLeft: 8, fontSize: 22 },
                          endBalance > 0
                            ? styles.textDebt
                            : endBalance < 0
                              ? styles.textCredit
                              : {},
                        ]}
                      >
                        {endBalance !== 0
                          ? toPersianDigits(formatNumber(Math.abs(endBalance)))
                          : "۰"}
                      </CustomText>
                    </View>
                  </View>
                </Animated.View>
              </Animated.View>
            </GestureDetector>
          </View>
        </GestureHandlerRootView>
      </Animated.View>

      {/* Floating Bottom Actions (Share & Save) */}
      <View style={[styles.bottomBar, { bottom: bottomNavHeight + 20 }]}>
        {showExportModal && (
          <View
            style={[
              styles.exportMenu,
              showExportModal === "share" && { bottom: 18 },
            ]}
          >
            <TouchableOpacity
              style={styles.exportOption}
              onPress={() => handleExport("png")}
            >
              <CustomText style={styles.exportText}>تصویر (PNG)</CustomText>
            </TouchableOpacity>
            <View style={styles.exportDivider} />
            <TouchableOpacity
              style={styles.exportOption}
              onPress={() => handleExport("pdf")}
            >
              <CustomText style={styles.exportText}>فایل (PDF)</CustomText>
            </TouchableOpacity>
          </View>
        )}
        <Animated.View
          entering={SlideInLeft.duration(300).delay(80)}
          style={styles.bottomActionsCard}
        >
          <LinearGradient
            colors={["#3282b8", "#0f4c75"]}
            style={styles.statementCircleBtn}
          >
            <TouchableOpacity
              style={styles.statementCircleTouch}
              onPress={() => setShowExportModal("save")}
            >
              <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
                <Path
                  d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"
                  stroke="#ffffff"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <Polyline
                  points="7 10 12 15 17 10"
                  stroke="#ffffff"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <Path
                  d="M12 15V3"
                  stroke="#ffffff"
                  strokeWidth={2}
                  strokeLinecap="round"
                />
              </Svg>
            </TouchableOpacity>
          </LinearGradient>
          <LinearGradient
            colors={["#3282b8", "#0f4c75"]}
            style={styles.statementCircleBtn}
          >
            <TouchableOpacity
              style={styles.statementCircleTouch}
              onPress={() => setShowExportModal("share")}
            >
              <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
                <Circle cx={18} cy={5} r={3} stroke="#ffffff" strokeWidth={2} />
                <Circle cx={6} cy={12} r={3} stroke="#ffffff" strokeWidth={2} />
                <Circle
                  cx={18}
                  cy={19}
                  r={3}
                  stroke="#ffffff"
                  strokeWidth={2}
                />
                <Path
                  d="M8.7 10.5L15.3 6.5M8.7 13.5L15.3 17.5"
                  stroke="#ffffff"
                  strokeWidth={2}
                  strokeLinecap="round"
                />
              </Svg>
            </TouchableOpacity>
          </LinearGradient>
        </Animated.View>
      </View>

      {showExportModal && (
        <TouchableOpacity
          style={StyleSheet.absoluteFill}
          activeOpacity={1}
          onPress={() => setShowExportModal(null)}
          accessibilityLabel="بستن منوی خروجی"
        />
      )}

      {/* Date Filter Modal */}
      <Modal visible={showDateModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <LinearGradient
            colors={["#0d2b43", "#0f4c75"]}
            style={styles.dateModalBox}
          >
            <CustomText style={styles.modalTitle}>فیلتر تاریخ</CustomText>

            <CustomText style={styles.inputLabel}>از تاریخ:</CustomText>
            <CustomTextInput
              style={styles.modalInput}
              placeholder="مثال: ۱۴۰۳/۰۱/۰۱"
              value={tempStartDate}
              onChangeText={setTempStartDate}
            />

            <CustomText style={styles.inputLabel}>تا تاریخ:</CustomText>
            <CustomTextInput
              style={styles.modalInput}
              placeholder="مثال: ۱۴۰۳/۱۲/۲۹"
              value={tempEndDate}
              onChangeText={setTempEndDate}
            />

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalBtn, styles.primaryBtn]}
                onPress={() => {
                  setStartDate(tempStartDate);
                  setEndDate(tempEndDate);
                  setShowDateModal(false);
                }}
              >
                <CustomText style={styles.primaryBtnText}>تایید</CustomText>
              </TouchableOpacity>
              {(tempStartDate || tempEndDate) && (
                <TouchableOpacity
                  style={[styles.modalBtn, styles.secondaryBtn]}
                  onPress={() => {
                    setTempStartDate("");
                    setTempEndDate("");
                  }}
                >
                  <CustomText style={styles.secondaryBtnText}>
                    حذف فیلتر
                  </CustomText>
                </TouchableOpacity>
              )}
            </View>
          </LinearGradient>
        </View>
      </Modal>

      {/* Toast Notification */}
      {toastMsg && (
        <View style={styles.toast}>
          <Ionicons name="checkmark-circle-outline" size={18} color="#4ade80" />
          <CustomText style={styles.toastText}>{toastMsg}</CustomText>
        </View>
      )}
      <ExportAlertModal
        visible={exportAlert.visible}
        title={exportAlert.title}
        message={exportAlert.message}
        success={exportAlert.success}
        onClose={() => setExportAlert((current) => ({ ...current, visible: false }))}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#eaf6fc",
  },
  filterBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginHorizontal: 15,
    marginTop: 10,
    marginBottom: 5,
    padding: 6,
    borderRadius: 12,
  },
  tabsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  tabBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
  },
  tabBtnActive: {
    backgroundColor: "#0f4c75",
  },
  tabBtnText: {
    color: "#ffffff",
    fontSize: 14,
  },
  sortBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#ffffff",
    borderStyle: "solid",
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    justifyContent: "center",
    alignItems: "center",
  },
  expandBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#ffffff",
    borderStyle: "solid",
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    justifyContent: "center",
    alignItems: "center",
  },
  statementCardWrapper: {
    flex: 1,
    paddingHorizontal: 10,
    overflow: "hidden",
    zIndex: 0,
  },
  statementViewport: {
    flex: 1,
    width: "100%",
    justifyContent: "flex-start",
  },
  statementCardContent: {
    width: STATEMENT_CARD_WIDTH,
  },
  statementCard: {
    width: STATEMENT_CARD_WIDTH,
    backgroundColor: "#ffffff",
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#0f4c75",
    overflow: "hidden",
    marginTop: 0,
  },
  cardHeader: {
    backgroundColor: "#0f4c75",
    padding: 12,
    alignItems: "center",
  },
  cardTitle: {
    color: "#ffffff",
    fontSize: 26,
  },
  cardSubtitle: {
    color: "#cbd5e1",
    fontSize: 26,
    marginTop: 4,
  },
  table: {
    width: "100%",
  },
  tableHeader: {
    flexDirection: "row-reverse",
    backgroundColor: "#f1f5f9",
    borderBottomWidth: 1.5,
    borderColor: "#cbd5e1",
    paddingVertical: 8,
    paddingHorizontal: 6,
  },
  th: {
    fontSize: 18,
    color: "#0e2442",
  },
  tableRow: {
    flexDirection: "row-reverse",
    borderBottomWidth: 1,
    borderColor: "#e2e8f0",
    paddingVertical: 8,
    paddingHorizontal: 6,
    alignItems: "center",
  },
  startBalanceRow: {
    backgroundColor: "#fffbeb",
  },
  settlementRow: {
    backgroundColor: "#d1fae5",
  },
  finalBalanceRow: {
    backgroundColor: "#dbeafe",
    borderTopWidth: 2,
    borderColor: "#bfdbfe",
  },
  td: {
    fontSize: 16,
    color: "#142b4b",
  },
  invoiceLink: {
    color: "#2563eb",
    fontSize: 14,
  },
  textDebt: { color: "#d32f2f" },
  textCredit: { color: "#2e7d32" },
  expandedItemsBox: {
    backgroundColor: "#f8fafc",
    paddingHorizontal: 15,
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderColor: "#e2e8f0",
  },
  expandedHeader: {
    flexDirection: "row-reverse",
    borderBottomWidth: 1,
    borderColor: "#cbd5e1",
    paddingBottom: 4,
  },
  expTh: { fontSize: 16, color: "#153868" },
  expandedRow: {
    flexDirection: "row-reverse",
    paddingVertical: 3,
    borderBottomWidth: 0.5,
    borderColor: "#e2e8f0",
  },
  expTd: { fontSize: 14, color: "153868" },
  finalBalanceLabel: {
    color: "#1e3a8a",
  },
  bottomBar: {
    position: "absolute",
    left: 16,
    alignItems: "flex-start",
    zIndex: 100,
  },
  bottomActionsCard: {
    flexDirection: "column",
    alignItems: "flex-start",
    gap: 8,
  },
  statementCircleBtn: {
    width: 44,
    height: 44,
    borderWidth: 2,
    borderColor: "#ffffff",
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
    elevation: 8,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.28,
    shadowRadius: 5,
  },
  statementCircleTouch: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.65)",
    justifyContent: "center",
    alignItems: "center",
  },
  exportMenu: {
    position: "absolute",
    bottom: 70,
    left: 50,
    backgroundColor: "#0f4c75",
    borderRadius: 12,
    padding: 10,
    minWidth: 150,
    zIndex: 110,
    elevation: 12,
  },
  exportOption: {
    paddingVertical: 10,
    alignItems: "center",
  },
  exportText: { color: "#ffffff", fontSize: 14 },
  exportDivider: { height: 1, backgroundColor: "rgba(255,255,255,0.1)" },
  dateModalBox: {
    width: "85%",
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: "#2e557c",
  },
  modalTitle: {
    color: "#ffffff",
    fontSize: 16,
    marginBottom: 15,
    textAlign: "center",
  },
  inputLabel: { color: "#cbd5e1", fontSize: 12, marginBottom: 4 },
  modalInput: {
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 8,
    paddingHorizontal: 10,
    height: 42,
    color: "#ffffff",
    fontSize: 13,
    marginBottom: 10,
    textAlign: "right",
  },
  modalActions: { flexDirection: "row", gap: 10, marginTop: 15 },
  modalBtn: {
    flex: 1,
    height: 40,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  primaryBtn: { backgroundColor: "#10b981" },
  primaryBtnText: { color: "#ffffff", fontSize: 13 },
  secondaryBtn: {
    backgroundColor: "rgba(255,255,255,0.1)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
  },
  secondaryBtnText: { color: "#ffffff", fontSize: 13 },
  toast: {
    position: "absolute",
    bottom: 80,
    alignSelf: "center",
    backgroundColor: "rgba(15, 76, 117, 0.95)",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    elevation: 10,
  },
  toastText: { color: "#ffffff", fontSize: 12 },
});