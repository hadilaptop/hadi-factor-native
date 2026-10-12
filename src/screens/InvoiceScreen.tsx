import React, { useState, useEffect, useRef } from "react";
import {
  View,
  TouchableOpacity,
  Modal,
  Pressable,
  StyleSheet,
  Animated,
  Dimensions,
  Platform,
  ActivityIndicator,
  KeyboardAvoidingView,
  ScrollView,
  FlatList,
} from "react-native";
import {
  toPersianDigits,formatNumber,parseNumber,convertNumberToPersianWords,
} from "../utils/numberUtils";
import { LinearGradient } from "expo-linear-gradient";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";
import Header from "../components/Header";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import AnimatedScrollWrapper, {
  AnimatedScrollWrapperRef,
} from "../components/AnimatedScrollWrapper";
import InvoicePreview from "./InvoicePreview";
import { getInvoices, saveInvoice } from "../storage/invoiceStorage";

import CustomText from '../components/CustomText';
import CustomTextInput from '../components/CustomTextInput';
import JalaliDatePicker from '../components/JalaliDatePicker';
import * as jalaali from 'jalaali-js';

const { width } = Dimensions.get("window");
const MAX_ROWS = 12;

const CustomDropdown = ({ label, value, options, selectedValue, onSelect, isOpen, onOpenChange, pickerRef }: any) => {
  return (
    <View ref={pickerRef} collapsable={false} style={styles.inputGroup}>
      {label && <CustomText style={styles.label}>{label}</CustomText>}
      <TouchableOpacity
        style={[styles.input, styles.dropdownTrigger, isOpen && styles.inputFocused]}
        onPress={() => onOpenChange(!isOpen)}
        activeOpacity={0.8}
      >
        <CustomText style={styles.dropdownTriggerText} numberOfLines={2}>{value}</CustomText>
        <Ionicons name={isOpen ? "chevron-up" : "chevron-down"} size={20} color="#fff" />
      </TouchableOpacity>

    </View>
  );
};

export default function InvoiceScreen({
  onNavigate = (screen: string) => {},
  onInvoiceSaved,
  initialCustomer = null,
  invoiceToEdit = null,
  initialMode = null,
  returnScreen = 'dashboard',
  customers = [
    {
      id: "1",
      name: "شرکت مکعب طلایی",
      phone: "09123456789",
      economicCode: "4112233",
      address: "تهران",
    },
    {
      id: "2",
      name: "سپاهان پخت",
      phone: "09131112233",
      economicCode: "998877",
      address: "اصفهان",
    },
  ],
}: any) {
  const slideAnim = useRef(new Animated.Value(width)).current;
  const bottomBarAnim = useRef(new Animated.Value(100)).current;
  const scrollRef = useRef<AnimatedScrollWrapperRef>(null);
  const insets = useSafeAreaInsets();
  const safePaddingBottom = insets.bottom > 0 ? insets.bottom + 5 : 10;
  const bottomNavHeight = 55 + safePaddingBottom;
  const [step, setStep] = useState(initialMode === "preview" ? "preview" : "form");
  const [isSaving, setIsSaving] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [isDatePickerVisible, setIsDatePickerVisible] = useState(false);
  const [isCustomerDropdownOpen, setIsCustomerDropdownOpen] = useState(false);
  const customerPickerRef = useRef<View>(null);
  const [customerPickerPosition, setCustomerPickerPosition] = useState({ top: 0, left: 0, width: 0 });

  const toggleCustomerDropdown = () => {
    if (isCustomerDropdownOpen) {
      setIsCustomerDropdownOpen(false);
      return;
    }
    customerPickerRef.current?.measureInWindow((x, y, pickerWidth, height) => {
      const screenHeight = Dimensions.get("window").height;
      setCustomerPickerPosition({ top: Math.min(y + height + insets.top + 4, screenHeight - 270), left: x, width: pickerWidth });
      setIsCustomerDropdownOpen(true);
    });
  };

  const PROFORMA_DEFAULT_NOTE =
    "به دلیل نوسانات بازار این پیش فاکتور تا زمان دریافت اسناد مالی قابل تغییر قیمت می‌باشد و فروشنده تضمینی در قبال مبلغ ندارد.";
  const INVOICE_DEFAULT_NOTE =
    "اقلام فاکتور تا زمان تسویه حساب کامل نزد خریدار به صورت امانت می باشد";

  const [invoiceType, setInvoiceType] = useState(
    invoiceToEdit?.type || "پیش فاکتور",
  );
  // ✨ توابع toPersianDigits حذف شدند
  const [invoiceNumber, setInvoiceNumber] = useState(
    invoiceToEdit?.number || "1001",
  );
  const [invoiceDate, setInvoiceDate] = useState(() => {
    if (invoiceToEdit?.date) return invoiceToEdit.date;
    const today = jalaali.toJalaali(new Date());
    return toPersianDigits(`${today.jy}/${String(today.jm).padStart(2, '0')}/${String(today.jd).padStart(2, '0')}`);
  });

  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(
    invoiceToEdit?.customerId || initialCustomer?.id || null,
  );
  const [buyerName, setBuyerName] = useState(
    invoiceToEdit?.buyerName ?? (initialCustomer ? initialCustomer.name : ""),
  );
  
  // ✨ توابع toPersianDigits حذف شدند
  const [buyerEconomicCode, setBuyerEconomicCode] = useState(
    invoiceToEdit?.buyerEconomicCode ?? initialCustomer?.economicCode ?? "",
  );
  const [buyerPhone, setBuyerPhone] = useState(
    invoiceToEdit?.buyerPhone ?? initialCustomer?.phone ?? "",
  );
  const [buyerAddress, setBuyerAddress] = useState(
    invoiceToEdit?.buyerAddress ?? initialCustomer?.address ?? "",
  );

  const [rows, setRows] = useState(
    invoiceToEdit?.items || [
      { id: Date.now(), desc: "", quantity: "", unitPrice: "" },
    ],
  );

  const [noteText, setNoteText] = useState(() => {
    if (invoiceToEdit && invoiceToEdit.note !== undefined)
      return invoiceToEdit.note;
    const initialType = invoiceToEdit
      ? invoiceToEdit.type || "پیش فاکتور"
      : "پیش فاکتور";
    return initialType === "فاکتور فروش" || initialType === "فاکتور"
      ? INVOICE_DEFAULT_NOTE
      : PROFORMA_DEFAULT_NOTE;
  });

  const [sellerName, setSellerName] = useState(invoiceToEdit?.sellerName ?? "");
  const [sellerPhone, setSellerPhone] = useState(invoiceToEdit?.sellerPhone ?? "");
  const [sellerAddress, setSellerAddress] = useState(invoiceToEdit?.sellerAddress ?? "");
  const [sellerEconomicCode, setSellerEconomicCode] = useState(invoiceToEdit?.sellerEconomicCode ?? "");
  const [sellerLogo, setSellerLogo] = useState<string | null>(invoiceToEdit?.sellerLogo ?? null);
  const [invoiceTheme, setInvoiceTheme] = useState("blue");

  useEffect(() => {
    const loadCompanySettings = async () => {
      try {
        const [name, phone, address, code, logo, storedTheme] = await AsyncStorage.multiGet([
          "companyName",
          "companyPhone",
          "companyAddress",
          "companyEconomicCode",
          "companyLogo",
          "invoiceTheme",
        ]);
        if (storedTheme[1]) setInvoiceTheme(storedTheme[1]);
        if (invoiceToEdit?.sellerName === undefined) setSellerName(name[1] || "");
        if (invoiceToEdit?.sellerPhone === undefined) setSellerPhone(phone[1] || "");
        if (invoiceToEdit?.sellerAddress === undefined) setSellerAddress(address[1] || "");
        if (invoiceToEdit?.sellerEconomicCode === undefined) setSellerEconomicCode(code[1] || "");
        if (invoiceToEdit?.sellerLogo === undefined) setSellerLogo(logo[1] || null);
      } catch (error) {
        console.error("Failed to load company invoice settings.", error);
      }
    };
    loadCompanySettings();
  }, []);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(bottomBarAnim, {
        toValue: 0,
        duration: 150,
        delay: 150,
        useNativeDriver: true,
      }),
    ]).start();
  }, [slideAnim, bottomBarAnim]);

  const handleClose = () => {
    if (step === "preview" && initialMode !== "preview") {
      setStep("form");
      return;
    }

    scrollRef.current?.close(() => {
      onNavigate(returnScreen);
    });
  };

  const grandTotal = rows.reduce((acc: number, row: any) => {
    const q = parseNumber(row.quantity) || 1;
    const p = parseNumber(row.unitPrice) || 0;
    return acc + q * p;
  }, 0);

  const addRow = () => {
    if (rows.length < MAX_ROWS) {
      setRows([
        ...rows,
        { id: Date.now(), desc: "", quantity: "1", unitPrice: "" },
      ]);
    }
  };

  const removeRow = (indexToRemove: number) => {
    if (rows.length > 1) {
      setRows(rows.filter((_: any, index: number) => index !== indexToRemove));
    }
  };

  const handleTypeChange = (newType: string) => {
    setInvoiceType(newType);
    setNoteText(
      newType === "فاکتور فروش" ? INVOICE_DEFAULT_NOTE : PROFORMA_DEFAULT_NOTE,
    );
  };

  const handleCustomerSelect = (custId: string | null) => {
    setSelectedCustomerId(custId);
    if (!custId) {
      setBuyerName("");
      setBuyerAddress("");
      setBuyerPhone("");
      setBuyerEconomicCode("");
      return;
    }
    const cust = customers.find((c: any) => c.id === custId);
    if (cust) {
      setBuyerName(cust.name || "");
      setBuyerAddress(cust.address || "");
      // ✨ توابع toPersianDigits حذف شدند
      setBuyerPhone(cust.phone || "");
      setBuyerEconomicCode(cust.economicCode || "");
    }
  };

  useEffect(() => {
    if (invoiceToEdit?.number) return;

    const selectedCustomer = selectedCustomerId
      ? customers.find(
          (item: any) => String(item.id) === String(selectedCustomerId),
        )
      : null;
    const highestCustomerCode = customers.reduce(
      (highest: number, item: any) =>
        Math.max(highest, Number(item.customerCode) || 0),
      1000,
    );
    const customerCode = selectedCustomer
      ? Number(selectedCustomer.customerCode) || highestCustomerCode + 1
      : highestCustomerCode + 1;

    let cancelled = false;
    const isSales = invoiceType === "فاکتور فروش" || invoiceType === "فاکتور";
    const pattern = isSales ? /\/(\d+)$/ : /\/b\/(\d+)$/i;

    getInvoices().then((savedInvoices) => {
      let highestNumber = isSales ? 100 : 500;

      for (const item of savedInvoices) {
        if (String(item.id) === String(invoiceToEdit?.id)) continue;
        if (!String(item.number).startsWith(`${customerCode}/`)) continue;

        const itemIsSales = item.type === "فاکتور فروش" || item.type === "فاکتور";
        if (itemIsSales !== isSales) continue;

        const match = String(item.number).match(pattern);
        if (match) highestNumber = Math.max(highestNumber, Number(match[1]));
      }

      if (!cancelled) {
        const nextNumber = highestNumber + 1;
        setInvoiceNumber(
          isSales
            ? `${customerCode}/${nextNumber}`
            : `${customerCode}/b/${nextNumber}`,
        );
      }
    });

    return () => {
      cancelled = true;
    };
  }, [selectedCustomerId, invoiceType, customers, invoiceToEdit?.id, invoiceToEdit?.number]);

  const handleSaveToDatabase = async () => {
    if (!selectedCustomerId && !buyerName.trim()) return;

    setIsSaving(true);
    try {
      const invoice = {
        id: invoiceToEdit?.id ?? `invoice-${Date.now()}`,
        customerId: selectedCustomerId ?? `manual-${Date.now()}`,
        type: invoiceType,
        number: invoiceNumber,
        date: invoiceDate,
        amount: grandTotal,
        note: noteText,
        items: rows,
        createdAt: invoiceToEdit?.createdAt ?? new Date().toISOString(),
        buyerName,
        buyerPhone,
        buyerEconomicCode,
        buyerAddress,
        sellerName,
        sellerPhone,
        sellerAddress,
        sellerEconomicCode,
        sellerLogo,
      };

      const success = await saveInvoice(invoice);
      if (success) {
        onInvoiceSaved?.(invoice);
        handleClose();
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleExport = (format: "pdf" | "png") => {
    setShowExportMenu(false);
  };

  return (
    <View style={styles.container}>
      <Header
        title={step === "form" ? (invoiceToEdit ? "ویرایش فاکتور" : "صدور فاکتور جدید") : "نمایش فاکتور"}
        onBack={handleClose}
        iconName="arrow-back"
      />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <AnimatedScrollWrapper
          key={step}
          ref={scrollRef}
          scrollEnabled={step === "form"}
          style={{ flex: 1, transform: [{ translateX: slideAnim }] }}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {step === "form" ? (
            <View style={styles.formContainer}>
              <LinearGradient
                colors={["#1f5579", "#347dad"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.card}
              >
                <CustomText style={styles.sectionTitle}>مشخصات فاکتور</CustomText>

                <View style={styles.inputGroup}>
                  <CustomText style={styles.label}>نوع فاکتور :</CustomText>
                  <View style={styles.typeSelectorRow}>
                    <TouchableOpacity
                      style={[
                        styles.typeBtn,
                        invoiceType === "پیش فاکتور" && styles.typeBtnActive,
                      ]}
                      onPress={() => handleTypeChange("پیش فاکتور")}
                      activeOpacity={0.8}
                    >
                      <CustomText
                        style={[
                          styles.typeBtnText,
                          invoiceType === "پیش فاکتور" &&
                            styles.typeBtnTextActive,
                        ]}
                        numberOfLines={1}
                        adjustsFontSizeToFit
                      >
                        پیش فاکتور
                      </CustomText>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[
                        styles.typeBtn,
                        invoiceType === "فاکتور فروش" && styles.typeBtnActive,
                      ]}
                      onPress={() => handleTypeChange("فاکتور فروش")}
                      activeOpacity={0.8}
                    >
                      <CustomText
                        style={[
                          styles.typeBtnText,
                          invoiceType === "فاکتور فروش" &&
                            styles.typeBtnTextActive,
                        ]}
                        numberOfLines={1}
                        adjustsFontSizeToFit
                      >
                        فاکتور فروش
                      </CustomText>
                    </TouchableOpacity>
                  </View>
                </View>

                <View style={styles.grid2}>
                  <View style={styles.inputGroup}>
                    <CustomText style={styles.label}>شماره فاکتور :</CustomText>
                    <CustomTextInput
                      style={[styles.input, { textAlign: "center" }]}
                      placeholderTextColor="rgba(255,255,255,0.45)"
                      value={invoiceNumber}
                      onChangeText={setInvoiceNumber} // ✨ تغییر فرمت برداشته شد
                      keyboardType="numeric"
                    />
                  </View>
                  <View style={styles.inputGroup}>
                    <CustomText style={styles.label}>تاریخ فاکتور :</CustomText>
                    <View style={styles.dateInputContainer}>
                      <CustomTextInput
                        style={[styles.input, { textAlign: 'right', flex: 1, paddingLeft: 44 }]}
                        placeholderTextColor='rgba(255,255,255,0.45)'
                        value={invoiceDate}
                        onChangeText={setInvoiceDate}
                      />
                      <TouchableOpacity
                        style={styles.dateIconWrapper}
                        onPress={() => setIsDatePickerVisible(true)}
                        accessibilityRole='button'
                        accessibilityLabel='انتخاب تاریخ فاکتور'
                      >
                        <Ionicons
                          name="calendar-outline"
                          size={20}
                          color="#fff"
                        />
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              </LinearGradient>

              <LinearGradient
                colors={["#1f5579", "#347dad"]}
                start={{ x: 1, y: 0 }}
                end={{ x: 0, y: 1 }}
                style={[styles.card, { zIndex: isCustomerDropdownOpen ? 1000 : 10 }]}
              >
                <CustomDropdown
                  isOpen={isCustomerDropdownOpen}
                  onOpenChange={toggleCustomerDropdown}
                  pickerRef={customerPickerRef}
                  label="انتخاب مشتری از لیست :"
                  value={
                    selectedCustomerId
                      ? customers.find((c: any) => String(c.id) === String(selectedCustomerId))
                          ?.name
                      : " مشتری جدید "
                  }
                  selectedValue={selectedCustomerId}
                  options={[
                    { label: " مشتری جدید ", value: null },
                    ...customers.map((c: any) => ({
                      label: c.name,
                      customerCode: c.customerCode,
                      value: c.id,
                    })),
                  ]}
                  onSelect={handleCustomerSelect}
                />
              </LinearGradient>

              <LinearGradient
                colors={["#1f5579", "#347dad"]}
                start={{ x: 0, y: 1 }}
                end={{ x: 1, y: 0 }}
                style={[styles.card, { zIndex: 1 }]}
              >
                <CustomText style={styles.sectionTitle}>اطلاعات خریدار</CustomText>

                <View style={styles.inputGroup}>
                  <CustomText style={styles.label}>نام خریدار / شرکت *</CustomText>
                  <CustomTextInput
                    style={[styles.input, selectedCustomerId ? { opacity: 0.7 } : {}]}
                    placeholderTextColor="rgba(255,255,255,0.45)"
                    placeholder="شرکت..."
                    multiline
                    textAlignVertical="top"
                    value={buyerName}
                    onChangeText={setBuyerName}
                    editable={!selectedCustomerId}
                  />
                </View>

                <View style={styles.grid2}>
                  <View style={styles.inputGroup}>
                    <CustomText style={styles.label}>کد اقتصادی خریدار</CustomText>
                    <CustomTextInput
                      style={[styles.input, selectedCustomerId ? { opacity: 0.7 } : {}]}
                      placeholderTextColor="rgba(255,255,255,0.45)"
                      placeholder=" 0 "
                      value={buyerEconomicCode}
                      onChangeText={setBuyerEconomicCode} // ✨ تغییر فرمت برداشته شد
                      keyboardType="numeric"
                      editable={!selectedCustomerId}
                    />
                  </View>
                  <View style={styles.inputGroup}>
                    <CustomText style={styles.label}>شماره تماس خریدار</CustomText>
                    <CustomTextInput
                      style={[styles.input, selectedCustomerId ? { opacity: 0.7 } : {}]}
                      placeholderTextColor="rgba(255,255,255,0.45)"
                      placeholder="  0912... "
                      value={buyerPhone}
                      onChangeText={setBuyerPhone} // ✨ تغییر فرمت برداشته شد
                      keyboardType="phone-pad"
                      editable={!selectedCustomerId}
                    />
                  </View>
                </View>

                <View style={styles.inputGroup}>
                  <CustomText style={styles.label}>نشانی خریدار</CustomText>
                  <CustomTextInput
                    style={[styles.input, selectedCustomerId ? { opacity: 0.7 } : {}]}
                    placeholderTextColor="rgba(255,255,255,0.45)"
                    placeholder="استان، شهر، خیابان..."
                    value={buyerAddress}
                    onChangeText={setBuyerAddress}
                    editable={!selectedCustomerId}
                  />
                </View>
              </LinearGradient>

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
                    onPress={addRow}
                    disabled={rows.length >= MAX_ROWS}
                  >
                    <CustomText style={styles.addButtonText}>
                      + سطر جدید ({toPersianDigits(rows.length.toString())})
                    </CustomText>
                  </TouchableOpacity>
                </View>

                {rows.map((row: any, index: number) => (
                  <View key={row.id} style={styles.itemRow}>
                    <View style={styles.itemRowTop}>
                      <CustomText style={styles.itemBadge}>
                        سطر {toPersianDigits((index + 1).toString())}
                      </CustomText>
                      {rows.length > 1 && (
                        <TouchableOpacity
                          onPress={() => removeRow(index)}
                          style={styles.deleteBtn}
                        >
                          <Ionicons
                            name="trash-outline"
                            size={16}
                            color="#ffffff"
                          />
                        </TouchableOpacity>
                      )}
                    </View>

                    <CustomText style={styles.labelSm}>شرح کالا / خدمات</CustomText>
                    <CustomTextInput
                      style={[styles.input, { marginBottom: 8 }]}
                      placeholderTextColor="rgba(255,255,255,0.45)"
                      placeholder="محصول جدید"
                      value={row.desc}
                      onChangeText={(text: string) => {
                        const newRows = [...rows];
                        newRows[index].desc = text;
                        setRows(newRows);
                      }}
                    />

                    <View style={styles.rowInputGroup}>
                      <View style={{ flex: 1 }}>
                        <CustomText style={styles.labelSm}>تعداد</CustomText>
                        <CustomTextInput
                          style={[styles.input, { textAlign: "center" }]}
                          placeholderTextColor="rgba(255,255,255,0.45)"
                          placeholder="1"
                          keyboardType="numeric"
                          value={row.quantity}
                          onChangeText={(text: string) => {
                            const cleaned = text.replace(/[^0-9۰-۹]/g, "");
                            const newRows = [...rows];
                            newRows[index].quantity = cleaned; // ✨ تغییر فرمت برداشته شد
                            setRows(newRows);
                          }}
                        />
                      </View>
                      <View style={{ flex: 2 }}>
                        <CustomText style={styles.labelSm}>قیمت واحد (ریال)</CustomText>
                        <CustomTextInput
                          style={[styles.input, { textAlign: "left" }]}
                          placeholderTextColor="rgba(255,255,255,0.45)"
                          placeholder="۰"
                          keyboardType="numeric"
                          value={
                            row.unitPrice ? formatNumber(row.unitPrice) : ""
                          }
                          onChangeText={(text: string) => {
                            const cleaned = text.replace(/[^0-9۰-۹]/g, "");
                            const newRows = [...rows];
                            newRows[index].unitPrice = cleaned;
                            setRows(newRows);
                          }}
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

              <LinearGradient
                colors={["#1f5579", "#347dad"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.card}
              >
                <CustomText style={styles.sectionTitle}>توضیحات فاکتور</CustomText>
                <CustomTextInput
                  style={[styles.input, {fontSize:14, height: 155, textAlignVertical: "top", lineHeight: 24 }]}
                  placeholderTextColor="rgba(255,255,255,0.45)"
                  multiline
                  placeholder="توضیحات یا شرایط فاکتور..."
                  value={noteText}
                  onChangeText={setNoteText}
                />
              </LinearGradient>
            </View>
          ) : (
            <InvoicePreview
              invoiceType={invoiceType}
              invoiceTheme={invoiceTheme}
              sellerName={sellerName}
              sellerAddress={sellerAddress}
              sellerPhone={sellerPhone}
              sellerEconomicCode={sellerEconomicCode}
              sellerLogo={sellerLogo}
              invoiceNumber={invoiceNumber}
              invoiceDate={invoiceDate}
              buyerName={buyerName}
              buyerPhone={buyerPhone}
              buyerEconomicCode={buyerEconomicCode}
              buyerAddress={buyerAddress}
              rows={rows}
              grandTotal={grandTotal}
              amountInWords={convertNumberToPersianWords(grandTotal)}
              noteText={noteText}
            />
          )}
        </AnimatedScrollWrapper>
      </KeyboardAvoidingView>

      <Animated.View
        style={[
          styles.bottomBar,
          {
            bottom: bottomNavHeight + 20,
            transform: [{ translateY: bottomBarAnim }],
          },
        ]}
      >
        <View style={styles.actionCard}>
          {step === "form" ? (
            <>
              <TouchableOpacity
                style={styles.circleBtnLight}
                onPress={() => setStep("preview")}
              >
                <Ionicons name="eye-outline" size={24} color="#fff" />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.circleBtnGreen}
                onPress={handleSaveToDatabase}
                disabled={isSaving}
              >
                {isSaving ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Ionicons name="checkmark-outline" size={28} color="#fff" />
                )}
              </TouchableOpacity>
            </>
          ) : (
            <>
              {showExportMenu && (
                <View style={styles.exportMenu}>
                  <TouchableOpacity
                    onPress={() => handleExport("png")}
                    style={styles.exportMenuItem}
                  >
                    <CustomText style={styles.exportMenuText}>تصویر (PNG)</CustomText>
                  </TouchableOpacity>
                  <View style={styles.exportMenuDivider} />
                  <TouchableOpacity
                    onPress={() => handleExport("pdf")}
                    style={styles.exportMenuItem}
                  >
                    <CustomText style={styles.exportMenuText}>فایل (PDF)</CustomText>
                  </TouchableOpacity>
                </View>
              )}

              <TouchableOpacity
                style={styles.circleBtnLight}
                onPress={() => setShowExportMenu(!showExportMenu)}
              >
                <Ionicons name="share-social-outline" size={24} color="#fff" />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.circleBtnLight}
                onPress={() => setShowExportMenu(!showExportMenu)}
              >
                <Ionicons name="download-outline" size={24} color="#fff" />
              </TouchableOpacity>

              {initialMode !== "preview" && (
<TouchableOpacity
                style={styles.circleBtnGreen}
                onPress={handleSaveToDatabase}
                disabled={isSaving}
              >
                {isSaving ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Ionicons name="checkmark-outline" size={28} color="#fff" />
                )}
              </TouchableOpacity>
)}
            </>
          )}
        </View>
      </Animated.View>
      <Modal
        visible={isCustomerDropdownOpen}
        transparent
        animationType="none"
        statusBarTranslucent
        onRequestClose={() => setIsCustomerDropdownOpen(false)}
      >
        <View style={styles.dropdownModalOverlay}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setIsCustomerDropdownOpen(false)} />
          <View style={[styles.dropdownModalContent, { top: customerPickerPosition.top, left: customerPickerPosition.left, width: customerPickerPosition.width }]}>
            <LinearGradient
              colors={["#22628e", "#1f5579"]}
              start={{ x: 1, y: 0 }}
              end={{ x: 0, y: 1 }}
              style={styles.dropdownList}
            >
              <ScrollView style={styles.dropdownScroll} showsVerticalScrollIndicator nestedScrollEnabled keyboardShouldPersistTaps="always">
                {[{ label: " مشتری جدید ", value: null }, ...customers.map((c: any) => ({ label: c.name, customerCode: c.customerCode, value: c.id }))].map((opt: any, index: number) => {
                  const isSelected = String(opt.value ?? "") === String(selectedCustomerId ?? "");
                  return (
                    <TouchableOpacity key={String(opt.value ?? index)} style={[styles.dropdownItem, isSelected && styles.dropdownItemSelected]} onPress={() => { handleCustomerSelect(opt.value); setIsCustomerDropdownOpen(false); }} activeOpacity={0.8}>
                      <CustomText style={styles.dropdownItemText} numberOfLines={2}>{opt.label}</CustomText>
                      {isSelected && <Ionicons name="checkmark" size={18} color="#fff" />}
                      {opt.customerCode != null && <CustomText style={styles.dropdownCodeText}>{toPersianDigits(String(opt.customerCode))}</CustomText>}
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </LinearGradient>
          </View>
        </View>
      </Modal>
      <JalaliDatePicker
        visible={isDatePickerVisible}
        initialDate={invoiceDate}
        onSelectDate={setInvoiceDate}
        onClose={() => setIsDatePickerVisible(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#eaf6fc",
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 410,
  },
  formContainer: {
    flex: 1,
  },
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
  grid2: {
    flexDirection: "row-reverse",
    gap: 10,
  },
  inputGroup: {
    paddingVertical: 6,
    flex: 1,
  },
  label: {
    
    fontSize: 14,
    color: "#ffffff",
    textAlign: "right",
    marginBottom: 6,
    paddingHorizontal: 4,
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
  inputFocused: {
    borderColor: "#ffffff",
    backgroundColor: "rgba(20, 58, 123, 0.35)",
  },
  dateInputContainer: {
    flexDirection: "row-reverse",
    alignItems: "center",
    position: "relative",
  },
  dateIconWrapper: {
    position: "absolute",
    left: 8,
    backgroundColor: "rgba(255,255,255,0.1)",
    padding: 6,
    borderRadius: 8,
  },
  typeSelectorRow: {
    flexDirection: "row-reverse",
    gap: 10,
  },
  typeBtn: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 2,
    borderRadius: 10,
    backgroundColor: "rgba(255,255,255,0.1)",
    borderWidth: 1.5,
    borderColor: "rgba(255,255,255,0.3)",
    justifyContent: "center",
  },
  typeBtnActive: {
    backgroundColor: "#10b981",
    borderColor: "#10b981",
  },
  typeBtnText: {
    
    color: "#fff",
    fontSize: 12,
    textAlign: "center",
  },
  typeBtnTextActive: {
    color: "#fff",
  },
  dropdownTrigger: {
    minHeight: 48,
    flexDirection: "row-reverse",
    justifyContent: "space-between",
    alignItems: "center",
  },
  dropdownTriggerText: {
    color: "#fff",
    fontSize: 15,
    lineHeight: 21,
    textAlign: "right",
    flex: 1,
    flexShrink: 1,
  },
  dropdownModalOverlay: { flex: 1, backgroundColor: "transparent" },
  dropdownModalContent: { position: "absolute", zIndex: 1002, elevation: 24 },
  dropdownList: {
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: "#a2c8e2",
    padding: 6,
    maxHeight: 260,
    overflow: "hidden",
  },
  dropdownScroll: {
    height: 234,
    maxHeight: 234,
    flexGrow: 0,
    flexShrink: 1,
  },
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
  },
  dropdownItemSelected: {
    backgroundColor: "#10b981",
    borderColor: "#10b981",
  },
  dropdownItemText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
    textAlign: "right",
    flex: 1,
  },
  dropdownCodeText: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "600",
    marginLeft: 8,
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
  bottomBar: {
    position: "absolute",
    bottom: Platform.OS === "ios" ? 95 : 95,
    left: 0,
    right: 0,
    alignItems: "center",
    zIndex: 100,
  },
  actionCard: {
    backgroundColor: "rgba(255,255,255,0.95)",
    flexDirection: "row-reverse",
    borderRadius: 40,
    padding: 8,
    elevation: 8,
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 15,
    gap: 45,
    borderWidth: 2,
    borderColor: "#347dad",
  },
  circleBtnLight: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#347dad",
    justifyContent: "center",
    alignItems: "center",
  },
  circleBtnGreen: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#10b981",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#10b981",
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 5,
  },
  exportMenu: {
    position: "absolute",
    bottom: 70,
    left: 20,
    backgroundColor: "#1f5579",
    borderRadius: 12,
    padding: 10,
    elevation: 10,
    shadowColor: "#000",
    shadowOpacity: 0.3,
    shadowRadius: 10,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    minWidth: 130,
  },
  exportMenuItem: {
    paddingVertical: 10,
    alignItems: "center",
  },
  exportMenuText: {
    
    color: "#fff",
    fontSize: 15,
  },
  exportMenuDivider: {
    height: 1,
    backgroundColor: "rgba(255,255,255,0.1)",
    marginVertical: 4,
  },
});