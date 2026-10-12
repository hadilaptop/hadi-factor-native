import React, { useState, useMemo, useRef, useEffect } from "react";
import {
  View,
  Animated,
  Dimensions,
  TouchableOpacity,
  Modal,
  Image,
  StyleSheet,
  ScrollView,
  Alert,
  Pressable,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import Header from "../components/Header";
import CustomText from "../components/CustomText";
import {
  toPersianDigits,
  formatNumber,
  getCustomerCode,
} from "../utils/invoiceHelpers";
import { Customer } from "../storage/customerStorage";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type CustomerLedgerScreenProps = {
  customer: Customer;
  customers?: Customer[];
  payments?: any[];
  invoices?: any[];
  onNavigate?: (screen: string) => void;
  onOpenInvoice?: (
    customer: Customer,
    invoice?: any,
    mode?: "preview" | "form",
  ) => void;
  onOpenPayment?: (payment?: any) => void;
  onDeletePayment?: (id: string | number) => Promise<void> | void;
  onDeleteInvoice?: (id: string | number) => Promise<void> | void;
};

export default function CustomerLedgerScreen({
  customer,
  customers = [],
  payments = [],
  invoices = [],
  onNavigate = () => {},
  onOpenInvoice,
  onOpenPayment,
  onDeletePayment = async () => {},
  onDeleteInvoice = async () => {},
}: CustomerLedgerScreenProps) {
  const [activeTab, setActiveTab] = useState<
    "all" | "payments" | "invoices" | "proformas"
  >("all");
  const [sortOrder, setSortOrder] = useState<"desc" | "asc">("desc");
  const [allFilters, setAllFilters] = useState({
    payments: true,
    invoices: true,
    proformas: true,
  });
  const [filtersLoaded, setFiltersLoaded] = useState(false);
  const [showAllFilterMenu, setShowAllFilterMenu] = useState(false);

  useEffect(() => {
    const loadAllFilters = async () => {
      try {
        const savedFilters = await AsyncStorage.getItem("@hadi_factor_customer_ledger_filters");
        if (savedFilters) {
          const parsedFilters = JSON.parse(savedFilters);
          if (
            typeof parsedFilters.payments === "boolean" &&
            typeof parsedFilters.invoices === "boolean" &&
            typeof parsedFilters.proformas === "boolean"
          ) {
            setAllFilters(parsedFilters);
          }
        }
      } catch (error) {
        console.error("خطا در بارگذاری فیلترهای دفتر حساب:", error);
      } finally {
        setFiltersLoaded(true);
      }
    };

    loadAllFilters();
  }, []);

  useEffect(() => {
    if (!filtersLoaded) return;

    AsyncStorage.setItem(
      "@hadi_factor_customer_ledger_filters",
      JSON.stringify(allFilters),
    ).catch((error) => {
      console.error("خطا در ذخیره فیلترهای دفتر حساب:", error);
    });
  }, [allFilters, filtersLoaded]);
  const [expandedItems, setExpandedItems] = useState<{
    [key: string]: boolean;
  }>({});
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const menuButtonRefs = useRef<Record<string, React.ElementRef<typeof TouchableOpacity> | null>>({});
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 75 });

  const insets = useSafeAreaInsets();
  const safePaddingBottom = insets.bottom > 0 ? insets.bottom + 5 : 10;
  const bottomNavHeight = 55 + safePaddingBottom;

  const slideAnim = useRef(new Animated.Value(Dimensions.get("window").width)).current;

  useEffect(() => {
    Animated.timing(slideAnim, {
      toValue: 0,
      duration: 250,
      useNativeDriver: true,
    }).start();
  }, [slideAnim]);

  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [deleteConfirmItem, setDeleteConfirmItem] = useState<any | null>(null);

  // محاسبه لیست تراکنش‌ها با مانده لحظه‌ای
  const transactions = useMemo<any[]>(() => {
    const custPayments = payments.filter(
      (p) => String(p.customerId) === String(customer?.id),
    );
    const custInvoices = invoices.filter(
      (i) => String(i.customerId) === String(customer?.id),
    );

    const pItems = custPayments.map((p) => ({
      id: `p-${p.id}`,
      originalId: p.id,
      kind: "payment",
      type: `دریافتی (${p.method || "نقدی"})`,
      method: p.method || "نقدی",
      date: p.date || "",
      rawDate: p.createdAt || p.date || "",
      amount: Number(p.amount || 0),
      note: p.note || "",
      checkDate: p.checkDate,
      checkNumber: p.checkNumber,
      bankName: p.bankName,
      attachment: p.attachment,
      isFinalized: true,
    }));

    const iItems = custInvoices.map((inv) => ({
      id: `i-${inv.id}`,
      originalId: inv.id,
      kind: "invoice",
      type: inv.type || "فاکتور",
      number: inv.number,
      date: inv.date || "",
      rawDate: inv.createdAt || inv.date || "",
      amount: Number(inv.amount || 0),
      note: inv.note || "",
      items: inv.items,
      isFinalized: inv.type !== "پیش فاکتور",
    }));

    const allChronological = [...pItems, ...iItems].sort((a, b) => {
      if (a.date && b.date && a.date !== b.date) {
        return a.date.localeCompare(b.date);
      }
      return (a.rawDate || "").localeCompare(b.rawDate || "");
    });

    let runningBalance = 0;
    const processed = allChronological.map((item) => {
      if (item.kind === "invoice" && item.type === "فاکتور") {
        runningBalance += item.amount;
      } else if (item.kind === "payment") {
        runningBalance -= item.amount;
      }
      return { ...item, balanceAfter: runningBalance };
    });

    return sortOrder === "desc" ? [...processed].reverse() : processed;
  }, [payments, invoices, customer?.id, sortOrder]);

  const filteredTransactions = useMemo(() => {
    return transactions.filter((item) => {
      if (activeTab === "all") {
        if (item.kind === "payment" && !allFilters.payments) return false;
        if (
          item.kind === "invoice" &&
          item.type !== "پیش فاکتور" &&
          !allFilters.invoices
        )
          return false;
        if (
          item.kind === "invoice" &&
          item.type === "پیش فاکتور" &&
          !allFilters.proformas
        )
          return false;
        return true;
      }
      if (activeTab === "payments") return item.kind === "payment";
      if (activeTab === "invoices")
        return item.kind === "invoice" && item.type !== "پیش فاکتور";
      if (activeTab === "proformas")
        return item.kind === "invoice" && item.type === "پیش فاکتور";
      return true;
    });
  }, [transactions, activeTab, allFilters]);

  const toggleExpand = (id: string) => {
    setExpandedItems((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleConfirmDelete = async () => {
    if (!deleteConfirmItem) return;
    try {
      if (deleteConfirmItem.kind === "payment") {
        await onDeletePayment(deleteConfirmItem.originalId);
      } else if (deleteConfirmItem.kind === "invoice") {
        await onDeleteInvoice(deleteConfirmItem.originalId);
      }
      setDeleteConfirmItem(null);
    } catch (error) {
      Alert.alert("خطا", "خطا در حذف آیتم.");
    }
  };

  if (!customer) {
    return (
      <View style={styles.container}>
        <Header
          title="گردش حساب مشتری"
          onBack={() => onNavigate("customers")}
          iconName="arrow-back"
        />
        <View style={styles.notFoundContainer}>
          <CustomText style={styles.notFoundText}>
            مشتری مورد نظر یافت نشد.
          </CustomText>
        </View>
      </View>
    );
  }

return (
    <View style={styles.container}>
      {/* Header */}
      <Header
        title={customer.name}
        subtitle={`کد مشتری: ${toPersianDigits(getCustomerCode(customer, customers))}`}
        onBack={() => onNavigate("customers")}
        iconName="arrow-back"
      />

      {/* Filter & Tabs Bar */}
      <Animated.View style={{ transform: [{ translateX: slideAnim }] }}>
        <LinearGradient colors={["#22628e", "#2f77a7"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.filterBar}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabsContainer}
        >
          <TouchableOpacity
            style={[
              styles.tabBtn,
              styles.tabGroup,
              activeTab === "all" && styles.tabBtnActive,
            ]}
            onPress={() => {
              setActiveTab("all");
              setShowAllFilterMenu((prev) => !prev);
            }}
          >
            <Ionicons name="filter-outline" size={16} color="#ffffff" />
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.tabBtn,
              activeTab === "payments" && styles.tabBtnActive,
            ]}
            onPress={() => {
              setActiveTab("payments");
              setShowAllFilterMenu(false);
            }}
          >
            <CustomText style={styles.tabText}>دریافتی</CustomText>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.tabBtn,
              activeTab === "invoices" && styles.tabBtnActive,
            ]}
            onPress={() => {
              setActiveTab("invoices");
              setShowAllFilterMenu(false);
            }}
          >
            <CustomText style={styles.tabText}>فاکتور فروش</CustomText>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.tabBtn,
              activeTab === "proformas" && styles.tabBtnActive,
            ]}
            onPress={() => {
              setActiveTab("proformas");
              setShowAllFilterMenu(false);
            }}
          >
            <CustomText style={styles.tabText}>پیش فاکتور</CustomText>
          </TouchableOpacity>
        </ScrollView>

        <TouchableOpacity
          style={styles.sortBtn}
          onPress={() => setSortOrder(sortOrder === "desc" ? "asc" : "desc")}
        >
          <Ionicons name="swap-vertical" size={22} color="#ffffff" />
        </TouchableOpacity>
      </LinearGradient>
      </Animated.View>

      {/* All Filters Dropdown Menu */}
      {showAllFilterMenu && (
        <Pressable
          style={styles.filterBackdrop}
          onPress={() => setShowAllFilterMenu(false)}
        />
      )}
      {showAllFilterMenu && (
        <LinearGradient colors={["#0d2b43", "#0f4c75"]} style={styles.allFiltersDropdown}>
          <TouchableOpacity
            style={[
              styles.filterOption,
              allFilters.payments && styles.filterOptionSelected,
            ]}
            onPress={() => {
              setAllFilters((p) => ({ ...p, payments: !p.payments }));
            }}
          >
            {allFilters.payments && (
              <Ionicons name="checkmark" size={18} color="#10b981" />
            )}
            <CustomText style={styles.filterOptionText}>دریافتی</CustomText>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.filterOption,
              allFilters.invoices && styles.filterOptionSelected,
            ]}
            onPress={() => {
              setAllFilters((p) => ({ ...p, invoices: !p.invoices }));
            }}
          >
            {allFilters.invoices && (
              <Ionicons name="checkmark" size={18} color="#10b981" />
            )}
            <CustomText style={styles.filterOptionText}>فاکتور فروش</CustomText>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.filterOption,
              allFilters.proformas && styles.filterOptionSelected,
            ]}
            onPress={() => {
              setAllFilters((p) => ({ ...p, proformas: !p.proformas }));
            }}
          >
            {allFilters.proformas && (
              <Ionicons name="checkmark" size={18} color="#10b981" />
            )}
            <CustomText style={styles.filterOptionText}>پیش فاکتور</CustomText>
          </TouchableOpacity>
        </LinearGradient>
      )}

      {/* Transactions List */}
      <Animated.ScrollView
        style={[styles.listContainer, { transform: [{ translateX: slideAnim }] }]}
        contentContainerStyle={styles.listContent}
      >
        {filteredTransactions.length === 0 ? (
          <View style={styles.emptyBox}>
            <CustomText style={styles.emptyText}>
              هیچ تراکنشی برای این مشتری یافت نشد.
            </CustomText>
          </View>
        ) : (
          filteredTransactions.map((item, index) => {
            const isInvoice = item.kind === "invoice";
            const isProforma = isInvoice && item.type === "پیش فاکتور";
            const isPayment = item.kind === "payment";
            const isExpanded = !!expandedItems[item.id];
            const isMenuOpen = openMenuId === item.id;

            return (
              <LinearGradient key={item.id} colors={['#22628e', '#2f77a7']} start={index % 3 === 0 ? { x: 0, y: 0 } : index % 3 === 1 ? { x: 1, y: 0 } : { x: 0, y: 1 }} end={index % 3 === 0 ? { x: 1, y: 1 } : index % 3 === 1 ? { x: 0, y: 1 } : { x: 1, y: 0 }} style={[styles.card, isMenuOpen && styles.cardMenuOpen]}>
                <TouchableOpacity
                  activeOpacity={0.8}
                  style={[styles.cardMainRow, isPayment && styles.cardMainRowPayment]}
                  onPress={() => toggleExpand(item.id)}
                >
                  <View style={styles.cardContent}>
                    <View style={styles.dateCol}>
                      <CustomText style={styles.dateText}>
                        {toPersianDigits(item.date)}
                      </CustomText>
                      {isInvoice && item.number && (
                        <View
                          style={[
                            styles.invNumBadge,
                            isProforma
                              ? styles.badgeProforma
                              : styles.badgeInvoice,
                          ]}
                        >
                          <CustomText style={styles.invNumText}>
                            {toPersianDigits(item.number)}
                          </CustomText>
                        </View>
                      )}
                    </View>

                    <View style={[styles.typeCol, isProforma && styles.typeColProforma]}>
                      <View
                        style={[
                          styles.typeBadge,
                          isProforma
                            ? styles.badgeProforma
                            : isInvoice
                              ? styles.badgeInvoice
                              : styles.badgePayment,
                        ]}
                      >
                        <CustomText
                          style={[
                            styles.typeBadgeText,
                            isProforma
                              ? styles.badgeProformaText
                              : isInvoice
                                ? styles.badgeInvoiceText
                                : styles.badgePaymentText,
                            isProforma && styles.proformaTypeBadgeText,
                          ]}
                        >
                          {isProforma
                              ? "📋 پیش‌ فاکتور"
                            : isInvoice
                              ? "📄 فاکتور فروش"
                              : `💵 ${item.method || "نقدی"}`}
                        </CustomText>
                      </View>
                      {isProforma && (
                        <View style={styles.nonBindingTag}>
                          <CustomText style={styles.nonBindingText}>
                            غیر مالی
                          </CustomText>
                        </View>
                      )}
                    </View>
                  </View>

                  {/* Actions Column */}
                  <View style={styles.actionsCol}>
                    <TouchableOpacity
                      style={styles.accordionArrow}
                      onPress={() => toggleExpand(item.id)}
                    >
                      <Ionicons
                        name={isExpanded ? "chevron-up" : "chevron-down"}
                        size={18}
                        color="#cbd5e1"
                      />
                    </TouchableOpacity>

                    <TouchableOpacity
                      ref={(node) => { menuButtonRefs.current[item.id] = node; }}
                      style={styles.menuTrigger}
                      onPress={(e) => {
                        e.stopPropagation();
                        if (isMenuOpen) {
                          setOpenMenuId(null);
                          return;
                        }
                        menuButtonRefs.current[item.id]?.measureInWindow((x: number, y: number, width: number, height: number) => {
                          setMenuPosition({ top: y + height, left: Math.max(75, x - 128) });
                          setOpenMenuId(item.id);
                        });
                      }}
                    >
                      <Ionicons
                        name="ellipsis-vertical"
                        size={20}
                        color="#cbd5e1"
                      />
                    </TouchableOpacity>
                  </View>

                </TouchableOpacity>

                  {/* Action Menu Dropdown */}
                  <Modal
                    visible={isMenuOpen}
                    transparent
                    animationType="none"
                    onRequestClose={() => setOpenMenuId(null)}
                  >
                    <Pressable
                      style={styles.dropdownModalOverlay}
                      onPress={() => setOpenMenuId(null)}
                    >
                      <View
                        style={[styles.cardMenu, { top: menuPosition.top, left: menuPosition.left }]}
                        onStartShouldSetResponder={() => true}
                      >
                      {isPayment ? (
                        <TouchableOpacity
                          style={styles.cardMenuItem}
                          onPress={() => {
                            setOpenMenuId(null);
                            const orig = payments.find(
                              (p) => String(p.id) === String(item.originalId),
                            );
                            onOpenPayment?.(orig || item);
                          }}
                        >
                          <Ionicons
                            name="create-outline"
                            size={18}
                            color="#ffffff"
                          />
                          <CustomText style={styles.menuText}>
                            ویرایش دریافتی
                          </CustomText>
                        </TouchableOpacity>
                      ) : (
                        <>
                          <TouchableOpacity
                            style={styles.cardMenuItem}
                            onPress={() => {
                              setOpenMenuId(null);
                              const orig = invoices.find(
                                (i) => String(i.id) === String(item.originalId),
                              );
                              onOpenInvoice?.(customer, orig || item, "preview");
                            }}
                          >
                            <Ionicons
                              name="eye-outline"
                              size={20}
                              color="#ffffff"
                            />
                            <CustomText style={styles.menuText}>
                              نمایش فاکتور
                            </CustomText>
                          </TouchableOpacity>
                          <TouchableOpacity
                            style={styles.cardMenuItem}
                            onPress={() => {
                              setOpenMenuId(null);
                              const orig = invoices.find(
                                (i) => String(i.id) === String(item.originalId),
                              );
                              onOpenInvoice?.(customer, orig || item, "form");
                            }}
                          >
                            <Ionicons
                              name="create-outline"
                              size={20}
                              color="#ffffff"
                            />
                            <CustomText style={styles.menuText}>
                              ویرایش فاکتور
                            </CustomText>
                          </TouchableOpacity>
                        </>
                      )}

                      <TouchableOpacity
                        style={[styles.cardMenuItem, { borderBottomWidth: 0 }]}
                        onPress={() => {
                          setOpenMenuId(null);
                          setDeleteConfirmItem(item);
                        }}
                      >
                        <Ionicons
                          name="trash-outline"
                          size={20}
                          color="#ff5c5c"
                        />
                        <CustomText
                          style={[styles.menuText, { color: "#ff5c5c" }]}
                        >
                         حذف فاکتور
                        </CustomText>
                      </TouchableOpacity>
                      </View>
                    </Pressable>
                  </Modal>


                {/* Expanded Details */}
                {isExpanded && (
                  <View style={styles.expandedBody}>
                    {isPayment && (
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
                      </View>
                    )}

                    {isInvoice && (
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
                                style={[styles.miniCell, { flex: 2 }]}
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
                    )}

                    {!!item.attachment && (
                      <TouchableOpacity
                        style={styles.attachmentBox}
                        onPress={() => setSelectedImage(item.attachment)}
                      >
                        <Image
                          source={{ uri: item.attachment }}
                          style={styles.attachmentImage}
                        />
                        <View style={styles.zoomIconOverlay}>
                          <Ionicons name="search" size={20} color="#ffffff" />
                        </View>
                      </TouchableOpacity>
                    )}
                  </View>
                )}
              </LinearGradient>
            );
          })
        )}
      </Animated.ScrollView>

      {/* Floating Statement Circular Button */}
      <View style={[styles.bottomBar, { bottom: bottomNavHeight + 20 }]}>
        <LinearGradient
          colors={["#3282b8", "#0f4c75"]}
          style={styles.statementCircleBtn}
        >
          <TouchableOpacity
            style={styles.statementCircleTouch}
            onPress={() => onNavigate?.("customerStatement")}
            accessibilityLabel="نمایش صورت حساب"
          >
            <Ionicons name="document-text-outline" size={26} color="#ffffff" />
          </TouchableOpacity>
        </LinearGradient>
      </View>

      {/* Lightbox Modal */}
      <Modal visible={!!selectedImage} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.lightboxBox}>
            <TouchableOpacity
              style={styles.lightboxClose}
              onPress={() => setSelectedImage(null)}
            >
              <Ionicons name="close-circle" size={32} color="#ffffff" />
            </TouchableOpacity>
            {selectedImage && (
              <Image
                source={{ uri: selectedImage }}
                style={styles.lightboxImage}
              />
            )}
          </View>
        </View>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal visible={!!deleteConfirmItem} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <LinearGradient
            colors={["#0d2b43", "#0f4c75"]}
            style={styles.confirmBox}
          >
            <View style={styles.confirmIconBg}>
              <Ionicons name="trash-outline" size={32} color="#ff5c5c" />
            </View>
            <CustomText style={styles.confirmTitle}>
              تایید حذف تراکنش
            </CustomText>
            <CustomText style={styles.confirmText}>
              آیا از حذف این تراکنش مطمئن هستید؟ این عمل قابل بازگشت نیست.
            </CustomText>
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalBtn, styles.cancelBtn]}
                onPress={() => setDeleteConfirmItem(null)}
              >
                <CustomText style={styles.cancelBtnText}>انصراف</CustomText>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalBtn, styles.dangerBtn]}
                onPress={handleConfirmDelete}
              >
                <CustomText style={styles.dangerBtnText}>
                  بله، حذف شود
                </CustomText>
              </TouchableOpacity>
            </View>
          </LinearGradient>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#eaf6fc",
  },
  filterBar: {
    flexDirection: "row-reverse",
    alignItems: "center",
    justifyContent: "space-between",
    marginHorizontal: 15,
    marginTop: 10,
    marginBottom: 5,
    padding: 6,
    borderRadius: 12,
    zIndex: 2,
    elevation: 2,
  },
  tabsContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  tabGroup: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 10,
     paddingVertical: 10,
  },
  tabBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    backgroundColor: "rgba(255, 255, 255, 0.15)",
  },
  tabBtnActive: {
    backgroundColor: "#10b981",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#ffffff",
    borderStyle: "solid",
  },
  tabText: {
    color: "#ffffff",
    fontSize: 14,
  },
  filterArrowBtn: {
    padding: 6,
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
    marginRight: 8,
  },
  filterBackdrop: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1,
    elevation: 1,
  },
  allFiltersDropdown: {
    position: "absolute",
    top: 190,
    right: 15,
    width: 190,
    zIndex: 1000,
    elevation: 10,
    padding: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#a2c8e2",
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
  },
  filterOption: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 8,
    minHeight: 40,
  },
  filterOptionSelected: {
    backgroundColor: "rgba(255, 255, 255, 0.05)",
  },
  filterOptionText: {
    color: "#ffffff",
    fontSize: 14,
    textAlign: "right",
    flex: 1,
  },
  listContainer: {
    flex: 1,
    paddingHorizontal: 15,
  },
  listContent: {
    paddingBottom: 410,
  },
  emptyBox: {
    padding: 40,
    alignItems: "center",
  },
  emptyText: {
    color: "#0f4c75",
    fontSize: 14,
  },
  card: {
    backgroundColor: "#0f4c75",
    borderRadius: 14,
    marginBottom: 8,
    padding: 10,
    borderWidth: 1,
    borderColor: "#09bcbc",
  },
  cardMenuOpen: {
    zIndex: 30,
    elevation: 30,
  },
  cardMainRow: {
    flexDirection: "row-reverse",
    justifyContent: "space-between",
    alignItems: "center",
  },
  cardMainRowPayment: {
    alignItems: "flex-start",
  },
  cardContent: {
    flexDirection: "row-reverse",
    gap: 10,
    flex: 1,
  },
  dateCol: {
    alignItems: "center",
  },
  dateText: {
    color: "#ffffff",
    fontSize: 14,
    width: 100,
    height : 32 ,
    textAlign: "center",
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  invNumBadge: {
    marginTop: 4,
    width: 100,
    height: 24,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 6,
  },
  invNumText: {
    fontSize: 12,
    color: "#075985",
  },
  typeCol: {
    gap: 4,
  },
  typeColProforma: {
    alignItems: "center",
  },
  typeBadge: {
    width: 132,
    height: 32,
    justifyContent: "center",
    borderRadius: 8,
  },
  typeBadgeText: {

    fontSize: 14,
    flexShrink: 0,
    includeFontPadding: false,
  },
  proformaTypeBadgeText: {
     textAlign: "center",
  },
  badgeInvoice: { backgroundColor: "#e0f2fe" },
  badgeInvoiceText: { color: "#075985" , textAlign: "center"},
  badgePayment: {
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    borderWidth: 1,
    borderColor: "#52dc45",
  },
  badgePaymentText: { color: "#ffffff" , textAlign: "center"},
  badgeProforma: { backgroundColor: "#fffcee" },
  badgeProformaText: { color: "#3e3b04" },
  nonBindingTag: {
    width: 132,
    height : 24,
    alignItems: "center",
    backgroundColor: "#fef3c7",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  nonBindingText: {
    color: "#92400e",
    fontSize: 10,

  },
  actionsCol: {
    alignItems: "center",
    gap: 4,
  },
  accordionArrow: {
    padding: 4,
  },
  menuTrigger: {
    padding: 4,
  },
  dropdownModalOverlay: {
    flex: 1,
  },
  cardMenu: {
    position: "absolute",
    backgroundColor: "#0f4c75",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#e2e5e8",
    zIndex: 100,
    minWidth: 180,
    elevation: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },
  cardMenuItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,

    borderBottomWidth: 1,
    borderBottomColor: "#778ca1",
  },
  menuText: {
    color: "#ffffff",
    fontSize: 14,
    marginLeft: 15,
  },
  expandedBody: {
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: "rgba(255, 255, 255, 0.15)",
    gap: 8,
  },
  detailsBox: {
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    padding: 10,
    borderRadius: 8,
  },
  detailRowBetween: {
    flexDirection: "row-reverse",
    justifyContent: "space-between",
  },
  detailLabel: { color: "#ffffff", fontSize: 14 },
  amountValue: { color: "#38ef7d", fontSize: 15 },
  checkSubDetails: { alignItems: "flex-start", marginTop: 6, gap: 4 },
  subDetailText: { color: "#cbd5e1", fontSize: 12 },
  miniInvoiceBox: {
    backgroundColor: "#f8fafc",
    borderRadius: 8,
    padding: 8,
  },
  miniHeader: {
    flexDirection: "row-reverse",
    borderBottomWidth: 1,
    borderColor: "#cbd5e1",
    paddingBottom: 4,
  },
  miniCol: { fontSize: 12, color: "#475569" },
  miniRow: {
    flexDirection: "row-reverse",
    paddingVertical: 4,
    borderBottomWidth: 0.5,
    borderColor: "#e2e8f0",
  },
  miniCell: { fontSize: 12, color: "#334155" },
  miniFooter: {
    flexDirection: "row-reverse",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 6,
    padding: 8,
    backgroundColor: "#dbeafe",
    borderRadius: 6,
  },
  miniFooterLabel: { fontSize: 12, color: "#0369a1", textAlign: "right" },
  miniFooterVal: { fontSize: 12, color: "#0369a1", textAlign: "left" },
  noteBox: {
    alignItems: "flex-start",
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    padding: 8,
    borderRadius: 8,
  },
  noteText: { color: "#cbd5e1", fontSize: 12 },
  attachmentBox: {
    width: 100,
    height: 80,
    borderRadius: 8,
    overflow: "hidden",
    position: "relative",
    alignSelf: "center",
  },
  attachmentImage: { width: "100%", height: "100%" },
  zoomIconOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: "rgba(0,0,0,0.3)",
    justifyContent: "center",
    alignItems: "center",
  },
  bottomBar: {
    position: "absolute",
    left: 18,
    right: undefined,
    alignItems: "flex-start",
    zIndex: 5,
  },
  statementCircleBtn: {
    width: 52,
    borderWidth: 2,
    borderColor: "#ffffff",
    height: 52,
    borderRadius: 26,
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
  notFoundContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  notFoundText: { color: "#0d2b43", fontSize: 16 },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.65)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  paymentModalBox: {
    width: "100%",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#2e557c",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  modalHeaderTitle: { color: "#ffffff", fontSize: 15 },
  inputLabel: { color: "#cbd5e1", fontSize: 12, marginTop: 8, marginBottom: 4 },
  modalInput: {
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 8,
    paddingHorizontal: 10,
    height: 42,
    color: "#ffffff",
    fontSize: 13,
    textAlign: "right",
  },
  textArea: { height: 70, textAlignVertical: "top", paddingTop: 8 },
  pillsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginVertical: 6,
  },
  pill: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: "rgba(255, 255, 255, 0.08)",
  },
  pillActive: { backgroundColor: "#10b981" },
  pillText: { color: "#cbd5e1", fontSize: 11 },
  pillTextActive: { color: "#ffffff" },
  checkSection: {
    backgroundColor: "rgba(255,255,255,0.05)",
    padding: 8,
    borderRadius: 8,
    marginVertical: 6,
  },
  attPreviewBox: { alignItems: "center", marginVertical: 8 },
  attImage: { width: 120, height: 90, borderRadius: 8 },
  removeAttBtn: { marginTop: 6 },
  removeAttText: { color: "#ff5c5c", fontSize: 11 },
  fileDropzone: {
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: "#38bdf8",
    borderRadius: 8,
    padding: 15,
    alignItems: "center",
    gap: 6,
    marginVertical: 8,
  },
  dropzoneText: { color: "#38bdf8", fontSize: 12 },
  modalActions: { flexDirection: "row", gap: 10, marginTop: 15 },
  modalBtn: {
    flex: 1,
    height: 42,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  cancelBtn: { borderWidth: 1, borderColor: "#2e557c" },
  cancelBtnText: { color: "#dee1e4", fontSize: 13 },
  submitBtn: { backgroundColor: "#10b981" },
  submitBtnText: { color: "#ffffff", fontSize: 13 },
  dangerBtn: { backgroundColor: "#ff5c5c" },
  dangerBtnText: { color: "#ffffff", fontSize: 13 },
  confirmBox: {
    width: "90%",
    borderRadius: 16,
    padding: 20,
    alignItems: "center",
  },
  confirmIconBg: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "rgba(255, 92, 92, 0.15)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 10,
  },
  confirmTitle: {
    color: "#ffffff",
    fontSize: 16,
    marginBottom: 6,
  },
  confirmText: {
    color: "#aab7c8",
    fontSize: 12,
    textAlign: "center",
    marginBottom: 15,
  },
  lightboxBox: {
    width: "100%",
    height: "80%",
    justifyContent: "center",
    alignItems: "center",
  },
  lightboxClose: { position: "absolute", top: -40, right: 10, zIndex: 10 },
  lightboxImage: { width: "100%", height: "100%", resizeMode: "contain" },
});