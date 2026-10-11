import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import Header from "../components/Header";
import CustomText from "../components/CustomText";
import CustomTextInput from "../components/CustomTextInput";
import JalaliDatePicker from "../components/JalaliDatePicker";
import { Customer } from "../storage/customerStorage";
import { Payment } from "../storage/paymentStorage";
import {
  formatNumber,
  getCurrentPersianDate,
  parseNumber,
  toPersianDigits,
} from "../utils/invoiceHelpers";

type CustomerPaymentProps = {
  customers: Customer[];
  customer?: Customer | null;
  paymentToEdit?: any | null;
  onBack: () => void;
  onSavePayment: (payment: Payment) => Promise<boolean | void> | boolean | void;
};

const PAYMENT_METHODS = ["نقدی", "کارت به کارت", "واریز به حساب", "چک", "سایر"];

export default function CustomerPayment({
  customers,
  customer,
  paymentToEdit,
  onBack,
  onSavePayment,
}: CustomerPaymentProps) {
  const initialCustomerId = customer?.id ?? paymentToEdit?.customerId ?? "";
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | number>(initialCustomerId);
  const [customerPickerVisible, setCustomerPickerVisible] = useState(false);
  const customerPickerRef = useRef<View>(null);
  const [customerPickerPosition, setCustomerPickerPosition] = useState({
    top: 0,
    left: 0,
    width: 0,
  });
  const dropdownAnimation = useRef(new Animated.Value(0)).current;

  const toggleCustomerPicker = () => {
    if (customerPickerVisible) {
      setCustomerPickerVisible(false);
      return;
    }
    customerPickerRef.current?.measureInWindow((x, y, width, height) => {
      setCustomerPickerPosition({ top: y + height + 35, left: x, width });
      dropdownAnimation.setValue(0);
      setCustomerPickerVisible(true);
    });
  };
  const [paymentAmount, setPaymentAmount] = useState(
    paymentToEdit ? formatNumber(paymentToEdit.amount || 0) : "",
  );
  const [paymentDate, setPaymentDate] = useState(paymentToEdit?.date || getCurrentPersianDate());
  const [paymentMethod, setPaymentMethod] = useState(paymentToEdit?.method || "نقدی");
  const [bankName, setBankName] = useState(paymentToEdit?.bankName || "");
  const [checkDate, setCheckDate] = useState(paymentToEdit?.checkDate || getCurrentPersianDate());
  const [checkNumber, setCheckNumber] = useState(paymentToEdit?.checkNumber || "");
  const [paymentNote, setPaymentNote] = useState(paymentToEdit?.note || "");
  const [paymentAttachment, setPaymentAttachment] = useState<string | null>(
    paymentToEdit?.attachment || null,
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [datePickerTarget, setDatePickerTarget] = useState<"payment" | "check" | null>(null);

  useEffect(() => {
    Animated.timing(dropdownAnimation, {
      toValue: customerPickerVisible ? 1 : 0,
      duration: 220,
      useNativeDriver: true,
    }).start();
  }, [customerPickerVisible, dropdownAnimation]);

  const selectedCustomer = useMemo(
    () => customers.find((item) => String(item.id) === String(selectedCustomerId)) || customer || null,
    [customers, selectedCustomerId, customer],
  );

  const handlePickAttachment = async () => {
    try {
      const ImagePicker = await import("expo-image-picker");
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsEditing: true,
        quality: 0.7,
        base64: true,
      });
      if (result.canceled || !result.assets[0]) return;
      const asset = result.assets[0];
      if (asset.fileSize && asset.fileSize > 5 * 1024 * 1024) {
        Alert.alert("خطا در تصویر", "حجم تصویر نباید بیشتر از ۵ مگابایت باشد.");
        return;
      }
      if (asset.base64) setPaymentAttachment(`data:image/jpeg;base64,${asset.base64}`);
    } catch {
      Alert.alert("خطا", "انتخاب تصویر انجام نشد.");
    }
  };

  const handleSave = async () => {
    if (!selectedCustomer) {
      Alert.alert("خطای مشتری", "لطفاً ابتدا مشتری مورد نظر را انتخاب کنید.");
      return;
    }
    const numericAmount = parseNumber(paymentAmount);
    if (!numericAmount || numericAmount <= 0) {
      Alert.alert("مبلغ نامعتبر", "لطفاً مبلغ دریافتی معتبر وارد کنید.");
      return;
    }

    setIsSubmitting(true);
    try {
      const paymentData: Payment = {
        id: paymentToEdit ? (paymentToEdit.originalId ?? paymentToEdit.id) : Date.now().toString(),
        customerId: selectedCustomer.id,
        date: paymentDate.trim() || getCurrentPersianDate(),
        amount: numericAmount,
        method: paymentMethod,
        bankName: bankName.trim(),
        checkDate: paymentMethod === "چک" ? checkDate : "",
        checkNumber: paymentMethod === "چک" ? checkNumber.trim() : "",
        note: paymentNote.trim(),
        attachment: paymentAttachment || "",
        createdAt: paymentToEdit?.rawDate || paymentToEdit?.createdAt || new Date().toISOString(),
      };
      const saved = await onSavePayment(paymentData);
      if (saved === false) throw new Error("save failed");
      onBack();
    } catch {
      Alert.alert("خطا", "خطا در ثبت تراکنش دریافتی. لطفاً دوباره تلاش کنید.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <View style={styles.container}>
      <Header
        title={paymentToEdit ? "ویرایش دریافتی" : "ثبت دریافتی جدید"}
        onBack={onBack}
        iconName="arrow-back"
      />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <LinearGradient
          colors={["#0f4c75", "#3282b8"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.formCard, customerPickerVisible && styles.formCardDropdownOpen]}
        >
          <CustomText style={styles.cardTitle}>
            {paymentToEdit ? "ویرایش اطلاعات دریافتی" : "اطلاعات دریافتی"}
          </CustomText>

          <CustomText style={styles.inputLabel}>نام مشتری *</CustomText>
          {customer ? (
            <View style={styles.customerDisplay}>
              <Ionicons name="person-outline" size={19} color="#ffffff" />
              <CustomText style={styles.customerName}>{customer.name}</CustomText>
            </View>
          ) : (
            <View ref={customerPickerRef} collapsable={false} style={styles.customerPickerContainer}>
              <TouchableOpacity
                style={[styles.selector, customerPickerVisible && styles.selectorOpen]}
                onPress={toggleCustomerPicker}
                activeOpacity={0.8}
              >
                <CustomText
                  style={[styles.selectorText, !selectedCustomer && styles.placeholder]}
                  numberOfLines={2}
                >
                  {selectedCustomer ? selectedCustomer.name : "یک مشتری انتخاب کنید..."}
                </CustomText>
                <Ionicons
                  name={customerPickerVisible ? "chevron-up" : "chevron-down"}
                  size={20}
                  color="#ffffff"
                />
              </TouchableOpacity>


            </View>
          )}

          <CustomText style={styles.inputLabel}>مبلغ دریافتی (ریال) *</CustomText>
          <View style={styles.amountWrap}>
            <CustomTextInput
              style={[styles.input, styles.amountInput]}
              placeholder="۰"
              placeholderTextColor="#94a3b8"
              keyboardType="numeric"
              value={paymentAmount}
              onChangeText={(text) => {
                const value = parseNumber(text);
                setPaymentAmount(value ? formatNumber(value) : "");
              }}
            />
          </View>

          <CustomText style={styles.inputLabel}>تاریخ دریافت *</CustomText>
          <View style={styles.dateWrap}>
            <CustomTextInput
              style={[styles.input, styles.dateInput]}
              placeholder="۱۴۰۳/۰۵/۱۵"
              placeholderTextColor="#94a3b8"
              value={paymentDate}
              onChangeText={setPaymentDate}
            />
            <TouchableOpacity
              style={styles.calendarButton}
              onPress={() => setDatePickerTarget("payment")}
              accessibilityLabel="انتخاب تاریخ دریافت"
            >
              <Ionicons name="calendar-outline" size={20} color="#38bdf8" />
            </TouchableOpacity>
          </View>

          <CustomText style={styles.inputLabel}>روش دریافت</CustomText>
          <View style={styles.methods}>
            {PAYMENT_METHODS.map((method) => (
              <TouchableOpacity
                key={method}
                style={[styles.methodChip, paymentMethod === method && styles.methodChipActive]}
                onPress={() => setPaymentMethod(method)}
              >
                <CustomText style={[styles.methodText, paymentMethod === method && styles.methodTextActive]}>
                  {method}
                </CustomText>
              </TouchableOpacity>
            ))}
          </View>

          {paymentMethod === "چک" && (
            <View style={styles.checkCard}>
              <CustomText style={styles.inputLabel}>شماره چک / صیادی</CustomText>
              <CustomTextInput
                style={styles.input}
                placeholder="شماره چک / صیادی"
                placeholderTextColor="#94a3b8"
                value={checkNumber}
                onChangeText={setCheckNumber}
              />
              <CustomText style={styles.inputLabel}>نام بانک</CustomText>
              <CustomTextInput
                style={styles.input}
                placeholder="مثال: بانک ملی"
                placeholderTextColor="#94a3b8"
                value={bankName}
                onChangeText={setBankName}
              />
              <CustomText style={styles.inputLabel}>تاریخ سررسید</CustomText>
              <View style={styles.dateWrap}>
                <CustomTextInput
                  style={[styles.input, styles.dateInput]}
                  placeholder="۱۴۰۳/۰۶/۲۰"
                  placeholderTextColor="#94a3b8"
                  value={checkDate}
                  onChangeText={setCheckDate}
                />
                <TouchableOpacity
                  style={styles.calendarButton}
                  onPress={() => setDatePickerTarget("check")}
                  accessibilityLabel="انتخاب تاریخ سررسید چک"
                >
                  <Ionicons name="calendar-outline" size={20} color="#38bdf8" />
                </TouchableOpacity>
              </View>
            </View>
          )}

          <CustomText style={styles.inputLabel}>توضیحات / بابت</CustomText>
          <CustomTextInput
            style={[styles.input, styles.textArea]}
            placeholder="توضیحات..."
            placeholderTextColor="#94a3b8"
            multiline
            numberOfLines={3}
            value={paymentNote}
            onChangeText={setPaymentNote}
          />

          <View style={styles.profileUploadGroup}>
            <CustomText style={styles.inputLabel}>پیوست تصویر سند</CustomText>
            <View style={styles.profileUploadWrapper}>
              {paymentAttachment ? (
                <View style={styles.previewBox}>
                  <Image source={{ uri: paymentAttachment }} style={styles.previewImg} />
                  <TouchableOpacity
                    activeOpacity={0.8}
                    style={styles.removeBtn}
                    onPress={() => setPaymentAttachment(null)}
                  >
                    <CustomText style={styles.removeBtnText}>حذف تصویر</CustomText>
                  </TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity
                  activeOpacity={0.7}
                  style={styles.customFileUpload}
                  onPress={handlePickAttachment}
                >
                  <CustomText style={styles.uploadTextIndicator}>انتخاب فایل</CustomText>
                </TouchableOpacity>
              )}
            </View>
          </View>

          <View style={styles.actions}>
            <TouchableOpacity style={[styles.actionButton, styles.cancelButton]} onPress={onBack}>
              <CustomText style={styles.cancelText}>انصراف</CustomText>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionButton, styles.saveButton]}
              onPress={handleSave}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <ActivityIndicator size="small" color="#ffffff" />
              ) : (
                <CustomText style={styles.saveText}>
                  {paymentToEdit ? "ذخیره تغییرات" : "ثبت دریافتی"}
                </CustomText>
              )}
            </TouchableOpacity>
          </View>
        </LinearGradient>
      </ScrollView>

      <Modal
        visible={customerPickerVisible}
        transparent
        animationType="none"
        statusBarTranslucent
        onRequestClose={() => setCustomerPickerVisible(false)}
      >
        <View style={styles.dropdownModalOverlay}>
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={() => setCustomerPickerVisible(false)}
          />
          <Animated.View
            style={[
              styles.dropdownModalContent,
              {
                top: customerPickerPosition.top,
                left: customerPickerPosition.left,
                width: customerPickerPosition.width,
                opacity: dropdownAnimation,
                transform: [{
                  translateY: dropdownAnimation.interpolate({
                    inputRange: [0, 1],
                    outputRange: [-8, 0],
                  }),
                }],
              },
            ]}
          >
            <LinearGradient
              colors={["#22628e", "#1f5579"]}
              start={{ x: 1, y: 0 }}
              end={{ x: 0, y: 1 }}
              style={styles.dropdownList}
            >
              <ScrollView
                style={styles.dropdownScroll}
                showsVerticalScrollIndicator
                nestedScrollEnabled
                keyboardShouldPersistTaps="always"
              >
                {customers.map((item) => {
                  const isSelected = String(item.id) === String(selectedCustomerId);
                  return (
                    <TouchableOpacity
                      key={String(item.id)}
                      style={[styles.dropdownItem, isSelected && styles.dropdownItemSelected]}
                      onPress={() => {
                        setSelectedCustomerId(item.id);
                        setCustomerPickerVisible(false);
                      }}
                      activeOpacity={0.8}
                    >
                      <CustomText style={styles.dropdownItemText} numberOfLines={2}>
                        {item.name}
                      </CustomText>
                      {isSelected && <Ionicons name="checkmark" size={18} color="#ffffff" />}
                      {item.customerCode != null && (
                        <CustomText style={styles.dropdownCodeText}>
                          {toPersianDigits(String(item.customerCode))}
                        </CustomText>
                      )}
                    </TouchableOpacity>
                  );
                })}
                {customers.length === 0 && (
                  <CustomText style={styles.emptyCustomers}>
                    هنوز مشتری‌ای ثبت نشده است.
                  </CustomText>
                )}
              </ScrollView>
            </LinearGradient>
          </Animated.View>
        </View>
      </Modal>

      <JalaliDatePicker
        visible={datePickerTarget !== null}
        initialDate={datePickerTarget === "check" ? checkDate : paymentDate}
        onSelectDate={(date) => {
          if (datePickerTarget === "check") setCheckDate(date);
          else setPaymentDate(date);
        }}
        onClose={() => setDatePickerTarget(null)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#eaf6fc" },
  scroll: { flex: 1 },
  scrollContent: { paddingTop: 10, paddingHorizontal: 15, paddingBottom: 410 },
  formCard: {
    borderRadius: 20,
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderWidth: 1,
    borderColor: "#a2c8e2",
    gap: 2,
  },
  formCardDropdownOpen: { zIndex: 1000, elevation: 20 },
  cardTitle: {
    color: "#ffffff",
    fontSize: 16,
    textAlign: "right",
    marginBottom: 8,
  },
  inputLabel: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "400",
    textAlign: "right",
    marginTop: 10,
    marginBottom: 3,
    paddingHorizontal: 10,
  },
  input: {
    flex: 1,
    minHeight: 44,
    backgroundColor: "rgba(255,255,255,0.1)",
    borderRadius: 10,
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.3)",
    paddingVertical: 7,
    paddingHorizontal: 10,
    color: "#ffffff",
    fontSize: 15,
    textAlign: "right",
  },
  selector: {
    minHeight: 44,
    flexDirection: "row-reverse",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: "rgba(255,255,255,0.1)",
    borderWidth: 1.5,
    borderColor: "rgba(255,255,255,0.3)",
  },
  selectorOpen: { borderColor: "#a2c8e2" },
  selectorText: { flex: 1, color: "#ffffff", fontSize: 15, lineHeight: 21, textAlign: "right" },
  placeholder: { color: "rgba(255,255,255,0.55)" },
  customerDisplay: {
    minHeight: 44,
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: "rgba(255,255,255,0.1)",
  },
  customerName: { color: "#ffffff", fontSize: 15, textAlign: "right", flex: 1 },
  customerPickerContainer: { position: "relative", zIndex: 1001, elevation: 12 },
  dropdownModalOverlay: { flex: 1, backgroundColor: "transparent" },
  dropdownModalContent: {
    position: "absolute",
    zIndex: 1002,
    elevation: 24,
  },
  dropdownList: {
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: "#a2c8e2",
    padding: 6,
    maxHeight: 260,
    overflow: "hidden",
  },
  dropdownScroll: { height: 234, maxHeight: 234, flexGrow: 0, flexShrink: 1 },
  dropdownItem: {
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
    gap: 8,
  },
  dropdownItemSelected: { backgroundColor: "#10b981", borderColor: "#10b981" },
  dropdownItemText: { color: "#ffffff", fontSize: 14, fontWeight: "600", textAlign: "right", flex: 1 },
  dropdownCodeText: { color: "#ffffff", fontSize: 14, fontWeight: "600", marginLeft: 8 },
  amountWrap: { position: "relative", justifyContent: "center" },
  amountInput: { textAlign: "left", paddingLeft: 12 },
  dateWrap: { position: "relative", justifyContent: "center" },
  dateInput: { paddingLeft: 52 },
  calendarButton: {
    position: "absolute",
    left: 4,
    zIndex: 1,
    width: 40,
    height: 40,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.1)",
  },
  methods: { flexDirection: "row-reverse", flexWrap: "wrap", gap: 6, marginVertical: 6 },
  methodChip: { paddingHorizontal: 10, paddingVertical: 7, borderRadius: 8, backgroundColor: "rgba(255,255,255,0.08)" },
  methodChipActive: { backgroundColor: "#10b981" },
  methodText: { color: "#ffffff", fontSize: 14 },
  methodTextActive: { color: "#ffffff" },
  checkCard: {
    backgroundColor: "rgba(13,43,67,0.35)",
    padding: 10,
    borderRadius: 10,
    marginTop: 6,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
  },
  textArea: { minHeight: 78, textAlignVertical: "top", paddingTop: 10 },
  profileUploadGroup: {
    alignItems: "center",
    marginTop: 8,
    marginBottom: 15,
  },
  profileUploadWrapper: {
    justifyContent: "center",
    alignItems: "center",
    width: "100%",
  },
  customFileUpload: {
    width: 120,
    height: 120,
    borderWidth: 1,
    borderColor: "#a2c8e2",
    borderStyle: "dashed",
    borderRadius: 15,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    justifyContent: "center",
    alignItems: "center",
  },
  uploadTextIndicator: {
    color: "#b3d4e6",
    fontSize: 13,
    fontWeight: "500",
  },
  previewBox: {
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    padding: 18,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.3)",
    borderStyle: "dashed",
    gap: 15,
  },
  previewImg: {
    width: 120,
    height: 120,
    borderRadius: 15,
  },
  removeBtn: {
    backgroundColor: "#ef4444",
    paddingVertical: 8,
    paddingHorizontal: 18,
    borderRadius: 10,
    elevation: 3,
    shadowColor: "#ef4444",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
  },
  removeBtnText: {
    color: "#ffffff",
    fontSize: 14,
  },
  actions: { flexDirection: "row-reverse", gap: 10, marginTop: 18 },
  actionButton: { flex: 1, minHeight: 44, borderRadius: 10, justifyContent: "center", alignItems: "center" },
  cancelButton: { borderWidth: 1.5, borderColor: "#a2c8e2" },
  cancelText: { color: "#dee1e4", fontSize: 15 },
  saveButton: { backgroundColor: "#10b981" },
  saveText: { color: "#ffffff", fontSize: 15 },
  emptyCustomers: { color: "#ffffff", textAlign: "center", padding: 20, fontSize: 15 },
});