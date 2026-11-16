export interface BoilerplateFile {
  path: string;
  name: string;
  category: 'Entry' | 'Navigation' | 'Screens' | 'Components' | 'Store' | 'Constants' | 'Config';
  description: string;
  content: string;
}

export const BOILERPLATE_FILES: BoilerplateFile[] = [
  {
    path: 'src/screens/PersianDashboardRN.tsx',
    name: 'PersianDashboardRN.tsx',
    category: 'Screens',
    description: 'کد استاندارد React Native داشبورد سیستم مدیریت فاکتور و حسابداری با گرادیان‌های دقیق، فواصل و تایپوگرافی فارسی',
    content: `/**
 * @file PersianDashboardRN.tsx
 * @description کامپوننت استاندارد React Native برای داشبورد سیستم مدیریت فاکتور و حسابداری
 * تبدیل شده دقیق از کدهای HTML و CSS وب با حفظ گرادیان‌های رنگی، فواصل و تایپوگرافی
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

export interface DashboardProps {
  onNavigate?: (screen: string) => void;
  customerCount?: number;
  isInitialized?: boolean;
  onOpenNewAccountPage?: () => void;
}

export function Dashboard({
  onNavigate,
  customerCount = 0,
  isInitialized = false,
  onOpenNewAccountPage,
}: DashboardProps) {
  // محاسبه تاریخ شمسی با فرمت رسمی فارسی
  const [currentDate] = useState<string>(() => {
    const today = new Date();
    const weekday = new Intl.DateTimeFormat('fa-IR', {
      weekday: 'long',
    }).format(today);
    const day = new Intl.DateTimeFormat('fa-IR', { day: 'numeric' }).format(today);
    const month = new Intl.DateTimeFormat('fa-IR', { month: 'long' }).format(today);
    const year = new Intl.DateTimeFormat('fa-IR', { year: 'numeric' }).format(today);
    return \`\${weekday}، \${day} \${month} \${year}\`;
  });

  // تبدیل اعداد به کاراکترهای فارسی
  const displayCustomerCount = Number(customerCount || 0).toLocaleString('fa-IR');

  // هندلر دکمه حساب جدید (معادل sessionStorage در وب)
  const handleNewAccountClick = () => {
    // نکته: در React Native از AsyncStorage یا Navigation Params استفاده می‌شود:
    // await AsyncStorage.setItem('accountReferrer', 'dashboard');
    if (typeof sessionStorage !== 'undefined') {
      try {
        sessionStorage.setItem('accountReferrer', 'dashboard');
      } catch (e) {
        // Safe for native
      }
    }
    if (onOpenNewAccountPage) {
      onOpenNewAccountPage();
    } else if (onNavigate) {
      onNavigate('customers');
    }
  };

  return (
    <View style={styles.dashboardAppContainer}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        bounces={true}
      >
        {/* هدر بالایی با گرادیان سرمه‌ای تیره به روشن */}
        <LinearGradient
          colors={['#0d2b43', '#0f4c75']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.dashHeader}
        >
          <View style={styles.dashHeaderTop}>
            <Text style={styles.dashDate}>{currentDate}</Text>
          </View>
          <Text style={styles.dashHeaderTitle}>
            سیستم مدیریت فاکتور و حسابداری
          </Text>
        </LinearGradient>

        {/* محتوای کارت‌های داشبورد با گرادیان‌های رنگی ۱:۱ */}
        <View style={styles.dashContent}>
          <View style={styles.dashGrid}>
            {/* کارت ۱: فاکتور جدید */}
            <TouchableOpacity
              activeOpacity={0.88}
              onPress={() => onNavigate?.('invoice')}
              style={styles.cardTouchable}
            >
              <LinearGradient
                colors={['#3282b8', '#0d2b43']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={[styles.dashCard, styles.cardInvoice]}
              >
                <View style={styles.cardHeader}>
                  <View style={styles.cardIcon}>
                    <Text style={styles.cardIconText}>📈</Text>
                  </View>
                  <Text style={styles.cardTitle}>فاکتور جدید</Text>
                </View>
                <View style={styles.cardBody}>
                  <Text style={styles.cardCount}>صدور سریع فاکتور</Text>
                  <Text style={styles.cardDesc}>صدور پیش‌فاکتور و فاکتور فروش</Text>
                </View>
              </LinearGradient>
            </TouchableOpacity>

            {/* کارت ۲: مدیریت حساب‌ها */}
            <TouchableOpacity
              activeOpacity={0.88}
              onPress={() => onNavigate?.('customers')}
              style={styles.cardTouchable}
            >
              <LinearGradient
                colors={['#0d2b43', '#0f4c75']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={[styles.dashCard, styles.cardCrm]}
              >
                <View style={styles.cardHeader}>
                  <View style={styles.cardIcon}>
                    <Text style={styles.cardIconText}>👥</Text>
                  </View>
                  <Text style={styles.cardTitle}>مدیریت حساب‌ها</Text>
                </View>
                <View style={styles.cardBody}>
                  <Text style={styles.cardCount}>
                    {!isInitialized ? (
                      'در حال به‌روزرسانی...'
                    ) : (
                      \`تعداد \${displayCustomerCount} مشتری\`
                    )}
                  </Text>
                  <Text style={styles.cardDesc}>مشاهده صورتحساب و پرداختی‌ها</Text>
                </View>
              </LinearGradient>
            </TouchableOpacity>

            {/* کارت ۳: حساب جدید */}
            <TouchableOpacity
              activeOpacity={0.88}
              onPress={handleNewAccountClick}
              style={styles.cardTouchable}
            >
              <LinearGradient
                colors={['#0f4c75', '#3282b8']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={[styles.dashCard, styles.cardAccount]}
              >
                <View style={styles.cardHeader}>
                  <View style={styles.cardIcon}>
                    <Text style={styles.cardIconText}>👤</Text>
                  </View>
                  <Text style={styles.cardTitle}>حساب جدید</Text>
                </View>
                <View style={styles.cardBody}>
                  <Text style={styles.cardCount}>ثبت مشتری جدید</Text>
                  <Text style={styles.cardDesc}>افزودن اطلاعات برای صدور فاکتور</Text>
                </View>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

export default Dashboard;

/**
 * استایل‌های موبایل ترجمه‌شده از CSS وب
 * با گرادیان‌های رنگی ۱:۱، سایه‌ها (Shadow/Elevation)، گوشه‌های گرد و فواصل دقیق
 */
const styles = StyleSheet.create({
  dashboardAppContainer: {
    flex: 1,
    backgroundColor: '#eaf6fc',
  },
  scrollContent: {
    paddingBottom: 40,
  },
  dashHeader: {
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 44 : 26,
    paddingBottom: 28,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    marginBottom: 16,
    // سایه برای هدر در iOS و Android
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.18,
    shadowRadius: 14,
    elevation: 8,
  },
  dashHeaderTop: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'center',

  },
  dashDate: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'left',
    opacity: 0.95,
  },
  dashHeaderTitle: {
    textAlign: 'center',
    fontSize: 19,
    fontWeight: '900',
    color: '#FFFFFF',
    lineHeight: 28,
    marginTop: 14,
    letterSpacing: -0.2,
  },
  dashContent: {
    paddingHorizontal: 16,
    width: '100%',
  },
  dashGrid: {
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 13,
    width: '100%',
  },
  cardTouchable: {
    width: '100%',
  },
  dashCard: {
    width: '100%',
    borderRadius: 22,
    paddingVertical: 18,
    paddingHorizontal: 18,
    minHeight: 124,
    flexDirection: 'column',
    justifyContent: 'space-between',
    alignItems: 'center',
    // سایه کارت در iOS و Android (معادل box-shadow وب)
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.14,
    shadowRadius: 10,
    elevation: 5,
  },
  cardInvoice: {
    backgroundColor: '#0d2b43',
  },
  cardCrm: {
    backgroundColor: '#0f4c75',
  },
  cardAccount: {
    backgroundColor: '#0f4c75',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    direction: 'ltr',
    marginBottom: 10,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
    marginHorizontal: 12,
  },
  cardIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardIconText: {
    fontSize: 22,
  },
  cardBody: {
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  cardCount: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 4,
  },
  cardDesc: {
    fontSize: 12.5,
    color: '#FFFFFF',
    opacity: 0.9,
    textAlign: 'center',
  },
});
`,
  },
  {
    path: 'src/screens/CustomerLedger.tsx',
    name: 'CustomerLedger.tsx',
    category: 'Screens',
    description: 'کامپوننت استاندارد React Native برای گردش حساب مشتری با لیست تراکنش‌ها، فیلترها، مودال ثبت دریافتی، لایت‌باکس و نوار ابزار صورت‌حساب',
    content: `/**
 * @file CustomerLedger.tsx
 * @description کامپوننت React Native برای گردش حساب مشتری
 * تبدیل شده دقیق از CustomerLedger.jsx و استایل‌های customer-ledger.css
 */

import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Image,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path, Polyline, Line, Circle, Rect } from 'react-native-svg';
import { useAppStore } from '../store/useAppStore';
import {
  formatNumber,
  parseNumber,
  toPersianDigits,
  getCurrentPersianDate,
  getCustomerCode,
} from '../utils/invoiceHelpers';

export interface LedgerTransaction {
  id: string;
  originalId: string | number;
  kind: 'payment' | 'invoice';
  type: string;
  method?: string;
  date: string;
  rawDate: string;
  amount: number;
  note?: string;
  number?: string;
  checkDate?: string;
  checkNumber?: string;
  bankName?: string;
  attachment?: string | null;
  items?: any;
  isFinalized: boolean;
  balanceAfter: number;
}

export interface CustomerLedgerProps {
  customer: any;
  onNavigate: (screen: string) => void;
  onOpenInvoice?: (customer: any, invoice?: any, mode?: string) => void;
  onOpenPaymentPage?: (customer: any, payment?: any) => void;
  onOpenStatement?: (customer: any) => void;
}

export function CustomerLedger({
  customer,
  onNavigate,
  onOpenInvoice,
  onOpenPaymentPage,
  onOpenStatement,
}: CustomerLedgerProps) {
  const allPayments = useAppStore((state) => state.payments);
  const allInvoices = useAppStore((state) => state.invoices);
  const allCustomers = useAppStore((state) => state.customers);
  const savePayment = useAppStore((state) => state.savePayment);
  const deletePayment = useAppStore((state) => state.deletePayment);
  const deleteInvoice = useAppStore((state) => state.deleteInvoice);

  const payments = useMemo(() => {
    if (!customer?.id) return [];
    return allPayments.filter(
      (p: any) => String(p.customerId) === String(customer.id)
    );
  }, [allPayments, customer]);

  const invoices = useMemo(() => {
    if (!customer?.id) return [];
    return allInvoices.filter(
      (i: any) => String(i.customerId) === String(customer.id)
    );
  }, [allInvoices, customer]);

  const [activeTab, setActiveTab] = useState<'all' | 'payments' | 'invoices' | 'proformas'>('all');
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');
  const [allFilters, setAllFilters] = useState({
    payments: true,
    invoices: true,
    proformas: true,
  });
  const [showAllFilterMenu, setShowAllFilterMenu] = useState(false);

  const toggleAllFilter = (key: 'payments' | 'invoices' | 'proformas') => {
    setAllFilters((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>({});
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [editingPayment, setEditingPayment] = useState<any>(null);
  const [showAddPaymentModal, setShowAddPaymentModal] = useState(false);
  const [paymentDate, setPaymentDate] = useState(getCurrentPersianDate());
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('نقدی');
  const [checkDate, setCheckDate] = useState(getCurrentPersianDate());
  const [checkNumber, setCheckNumber] = useState('');
  const [bankName, setBankName] = useState('');
  const [paymentNote, setPaymentNote] = useState('');
  const [paymentAttachment, setPaymentAttachment] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [deleteConfirmItem, setDeleteConfirmItem] = useState<any>(null);
  const [isClosingAddPaymentModal, setIsClosingAddPaymentModal] = useState(false);
  const [isClosingImageModal, setIsClosingImageModal] = useState(false);
  const [isClosingDeleteConfirmModal, setIsClosingDeleteConfirmModal] = useState(false);

  const closeAddPaymentModal = () => {
    setIsClosingAddPaymentModal(true);
    setTimeout(() => {
      setIsClosingAddPaymentModal(false);
      setShowAddPaymentModal(false);
    }, 200);
  };

  const closeImageModal = () => {
    setIsClosingImageModal(true);
    setTimeout(() => {
      setIsClosingImageModal(false);
      setSelectedImage(null);
    }, 200);
  };

  const closeDeleteConfirmModal = () => {
    setIsClosingDeleteConfirmModal(true);
    setTimeout(() => {
      setIsClosingDeleteConfirmModal(false);
      setDeleteConfirmItem(null);
    }, 200);
  };

  const prepareTransactions = (): LedgerTransaction[] => {
    const pItems = (payments || []).map((p: any) => ({
      id: \`p-\${p.id}\`,
      originalId: p.id,
      kind: 'payment' as const,
      type: \`دریافتی (\${p.method || 'نقدی'})\`,
      method: p.method || 'نقدی',
      date: p.date || '',
      rawDate: p.createdAt || p.date || '',
      amount: Number(p.amount || 0),
      note: p.note || '',
      checkDate: p.checkDate,
      checkNumber: p.checkNumber,
      bankName: p.bankName,
      attachment: p.attachment,
      isFinalized: true,
      number: undefined,
      items: undefined,
    }));

    const iItems = (invoices || []).map((inv: any) => ({
      id: \`i-\${inv.id}\`,
      originalId: inv.id,
      kind: 'invoice' as const,
      type: inv.type || 'فاکتور',
      number: inv.number,
      date: inv.date || '',
      rawDate: inv.createdAt || inv.date || '',
      amount: Number(inv.amount || 0),
      note: inv.note || '',
      items: inv.items,
      isFinalized: inv.type !== 'پیش فاکتور',
      method: undefined,
      checkDate: undefined,
      checkNumber: undefined,
      bankName: undefined,
      attachment: undefined,
    }));

    const allChronological = [...pItems, ...iItems].sort((a, b) => {
      if (a.date && b.date && a.date !== b.date) {
        return a.date.localeCompare(b.date);
      }
      return (a.rawDate || '').localeCompare(b.rawDate || '');
    });

    let runningBalance = 0;
    const processedAll: LedgerTransaction[] = allChronological.map((item) => {
      if (item.kind === 'invoice') {
        if (item.type === 'فاکتور' || item.type === 'فاکتور فروش') {
          runningBalance += item.amount;
        }
      } else if (item.kind === 'payment') {
        runningBalance -= item.amount;
      }
      return {
        ...item,
        balanceAfter: runningBalance,
      };
    });

    if (sortOrder === 'desc') {
      return [...processedAll].reverse();
    }
    return processedAll;
  };

  const transactions = prepareTransactions();

  const filteredTransactions = transactions.filter((item) => {
    if (activeTab === 'all') {
      if (item.kind === 'payment' && !allFilters.payments) return false;
      if (
        item.kind === 'invoice' &&
        item.type !== 'پیش فاکتور' &&
        !allFilters.invoices
      )
        return false;
      if (
        item.kind === 'invoice' &&
        item.type === 'پیش فاکتور' &&
        !allFilters.proformas
      )
        return false;
      return true;
    }
    if (activeTab === 'payments') return item.kind === 'payment';
    if (activeTab === 'invoices')
      return item.kind === 'invoice' && item.type !== 'پیش فاکتور';
    if (activeTab === 'proformas')
      return item.kind === 'invoice' && item.type === 'پیش فاکتور';
    return true;
  });

  const handleOpenNewPayment = () => {
    if (onOpenPaymentPage) {
      onOpenPaymentPage(customer, null);
    } else {
      setEditingPayment(null);
      setPaymentAmount('');
      setPaymentDate(getCurrentPersianDate());
      setPaymentMethod('نقدی');
      setBankName('');
      setCheckDate(getCurrentPersianDate());
      setCheckNumber('');
      setPaymentNote('');
      setPaymentAttachment(null);
      setShowAddPaymentModal(true);
    }
  };

  const handleOpenEditPayment = (item: any) => {
    if (onOpenPaymentPage) {
      onOpenPaymentPage(customer, item);
    } else {
      setEditingPayment(item);
      setPaymentAmount(formatNumber(item.amount || 0));
      setPaymentDate(item.date || getCurrentPersianDate());
      setPaymentMethod(item.method || 'نقدی');
      setBankName(item.bankName || '');
      setCheckDate(item.checkDate || getCurrentPersianDate());
      setCheckNumber(item.checkNumber || '');
      setPaymentNote(item.note || '');
      setPaymentAttachment(item.attachment || null);
      setShowAddPaymentModal(true);
    }
  };

  const toggleExpand = (itemId: string) => {
    setExpandedItems((prev) => ({
      ...prev,
      [itemId]: !prev[itemId],
    }));
  };

  const handleSavePayment = async () => {
    const numericAmount = parseNumber(paymentAmount);
    if (!numericAmount || numericAmount <= 0) {
      alert('لطفاً مبلغ دریافتی معتبری وارد کنید.');
      return;
    }
    setIsSubmitting(true);
    try {
      const paymentData: any = {
        customerId: customer.id,
        date: paymentDate.trim() || getCurrentPersianDate(),
        amount: numericAmount,
        method: paymentMethod,
        bankName: bankName.trim(),
        checkDate: paymentMethod === 'چک' ? checkDate : '',
        checkNumber: paymentMethod === 'چک' ? checkNumber.trim() : '',
        note: paymentNote.trim(),
        attachment: paymentAttachment || '',
      };
      if (editingPayment) {
        paymentData.id = editingPayment.originalId;
        paymentData.createdAt =
          editingPayment.rawDate || new Date().toISOString();
      } else {
        paymentData.createdAt = new Date().toISOString();
      }
      await savePayment(paymentData);
      setEditingPayment(null);
      setPaymentAmount('');
      setPaymentNote('');
      setCheckNumber('');
      setBankName('');
      setPaymentAttachment(null);
      closeAddPaymentModal();
    } catch (error) {
      console.error('خطا در ذخیره دریافتی:', error);
      alert('خطا در ثبت یا ویرایش دریافتی در دیتابیس.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteConfirmItem) return;
    try {
      if (deleteConfirmItem.kind === 'payment') {
        await deletePayment(deleteConfirmItem.originalId);
      } else if (deleteConfirmItem.kind === 'invoice') {
        await deleteInvoice(deleteConfirmItem.originalId);
      }
      closeDeleteConfirmModal();
    } catch (err) {
      console.error('خطا در حذف آیتم:', err);
      alert('خطا در حذف آیتم.');
      closeDeleteConfirmModal();
    }
  };

  if (!customer) {
    return (
      <View style={styles.ledgerModalWrapper}>
        <View style={styles.ledgerWrapper}>
          <LinearGradient
            colors={['#0d2b43', '#0f4c75']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.ledgerTopHeader}
          >
            <Text style={styles.ledgerMainTitle}>گردش حساب مشتری</Text>
            <View style={styles.ledgerHeaderButtons}>
              <TouchableOpacity
                style={styles.ledgerHeaderBtn}
                onPress={() => onNavigate('customers')}
                activeOpacity={0.8}
              >
                <Svg
                  viewBox="0 0 24 24"
                  width={22}
                  height={22}
                  fill="none"
                  stroke="#ffffff"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <Polyline points="9 10 4 15 9 20" />
                  <Path d="M20 4v7a4 4 0 0 1-4 4H4" />
                </Svg>
              </TouchableOpacity>
            </View>
          </LinearGradient>
          <View style={styles.ledgerContainer}>
            <Text style={styles.ledgerNotFoundMsg}>مشتری مورد نظر یافت نشد.</Text>
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.ledgerModalWrapper}>
      <View style={styles.ledgerWrapper}>
        {/* ===== هدر ===== */}
        <LinearGradient
          colors={['#0d2b43', '#0f4c75']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.ledgerTopHeader}
        >
          <View style={styles.ledgerTopHeaderInfo}>
            <Text style={styles.ledgerMainTitle}>{customer.name}</Text>
            <Text style={styles.ledgerTopHeaderSubtitle}>
              کد مشتری: {toPersianDigits(getCustomerCode(customer, allCustomers))}
            </Text>
          </View>
          <View style={styles.ledgerHeaderButtons}>
            <TouchableOpacity
              style={[styles.ledgerHeaderBtn, styles.ledgerHeaderAddPaymentBtn]}
              onPress={handleOpenNewPayment}
              activeOpacity={0.8}
            >
              <Text style={styles.moneyIconText}>💵</Text>
            </TouchableOpacity>

            {onOpenInvoice && (
              <TouchableOpacity
                style={styles.ledgerHeaderBtn}
                onPress={() => onOpenInvoice(customer)}
                activeOpacity={0.8}
              >
                <Svg
                  viewBox="0 0 24 24"
                  width={20}
                  height={20}
                  fill="none"
                  stroke="#ffffff"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <Path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <Polyline points="14 2 14 8 20 8" />
                  <Line x1="16" y1="13" x2="8" y2="13" />
                  <Line x1="16" y1="17" x2="8" y2="17" />
                </Svg>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={styles.ledgerHeaderBtn}
              onPress={() => onNavigate('customers')}
              activeOpacity={0.8}
            >
              <Svg
                viewBox="0 0 24 24"
                width={20}
                height={20}
                fill="none"
                stroke="#ffffff"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <Polyline points="9 10 4 15 9 20" />
                <Path d="M20 4v7a4 4 0 0 1-4 4H4" />
              </Svg>
            </TouchableOpacity>
          </View>
        </LinearGradient>

        {/* ===== بدنه اصلی گردش حساب ===== */}
        <ScrollView
          style={styles.ledgerScrollView}
          contentContainerStyle={styles.ledgerContainer}
          showsVerticalScrollIndicator={false}
        >
          {/* نوار فیلتر و تب‌ها */}
          <LinearGradient
            colors={['#3282b8', '#0f4c75']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.ledgerFilterBar}
          >
            <View style={styles.ledgerTabs}>
              <View style={styles.ledgerTabBtnGroup}>
                <TouchableOpacity
                  style={[
                    styles.ledgerTabBtn,
                    activeTab === 'all' && styles.ledgerTabBtnActive,
                  ]}
                  onPress={() => setActiveTab('all')}
                  activeOpacity={0.8}
                >
                  <Text style={styles.ledgerTabBtnText}>همه</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.ledgerFilterBtn}
                  onPress={() => setShowAllFilterMenu((prev) => !prev)}
                  activeOpacity={0.8}
                >
                  <Svg
                    width={14}
                    height={14}
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#ffffff"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <Polyline points="6 9 12 15 18 9" />
                  </Svg>
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                style={[
                  styles.ledgerTabBtn,
                  activeTab === 'payments' && styles.ledgerTabBtnActive,
                ]}
                onPress={() => setActiveTab('payments')}
                activeOpacity={0.8}
              >
                <Text style={styles.ledgerTabBtnText}>دریافتی</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.ledgerTabBtn,
                  activeTab === 'invoices' && styles.ledgerTabBtnActive,
                ]}
                onPress={() => setActiveTab('invoices')}
                activeOpacity={0.8}
              >
                <Text style={styles.ledgerTabBtnText}>فاکتور فروش</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.ledgerTabBtn,
                  activeTab === 'proformas' && styles.ledgerTabBtnActive,
                ]}
                onPress={() => setActiveTab('proformas')}
                activeOpacity={0.8}
              >
                <Text style={styles.ledgerTabBtnText}>پیش فاکتور</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={styles.ledgerSortBtn}
              onPress={() => setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc')}
              activeOpacity={0.8}
            >
              <Svg
                viewBox="0 0 24 24"
                width={18}
                height={18}
                fill="none"
                stroke="#ffffff"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <Path d="m7 15 5 5 5-5" />
                <Path d="m7 9 5-5 5 5" />
              </Svg>
            </TouchableOpacity>

            {showAllFilterMenu && (
              <LinearGradient
                colors={['#0d2b43', '#0f4c75']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.ledgerAllFilterDropdown}
              >
                <TouchableOpacity
                  style={[
                    styles.ledgerAllFilterOption,
                    allFilters.payments && styles.filterOptionSelected,
                  ]}
                  onPress={() => toggleAllFilter('payments')}
                  activeOpacity={0.8}
                >
                  <Text style={styles.filterOptionLabel}>دریافتی</Text>
                  {allFilters.payments && (
                    <Text style={styles.optionCheckmark}>✓</Text>
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.ledgerAllFilterOption,
                    allFilters.invoices && styles.filterOptionSelected,
                  ]}
                  onPress={() => toggleAllFilter('invoices')}
                  activeOpacity={0.8}
                >
                  <Text style={styles.filterOptionLabel}>فاکتور فروش</Text>
                  {allFilters.invoices && (
                    <Text style={styles.optionCheckmark}>✓</Text>
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.ledgerAllFilterOption,
                    allFilters.proformas && styles.filterOptionSelected,
                  ]}
                  onPress={() => toggleAllFilter('proformas')}
                  activeOpacity={0.8}
                >
                  <Text style={styles.filterOptionLabel}>پیش فاکتور</Text>
                  {allFilters.proformas && (
                    <Text style={styles.optionCheckmark}>✓</Text>
                  )}
                </TouchableOpacity>
              </LinearGradient>
            )}
          </LinearGradient>

          {/* لیست کارت‌های تراکنش */}
          <View style={styles.ledgerListContainer}>
            {filteredTransactions.length === 0 ? (
              <View style={styles.ledgerEmptyMsg}>
                <Text style={styles.ledgerEmptyMsgText}>
                  {activeTab === 'all'
                    ? 'هیچ تراکنشی برای این مشتری ثبت نشده است.'
                    : activeTab === 'payments'
                    ? 'هیچ دریافتی برای این مشتری ثبت نشده است.'
                    : activeTab === 'invoices'
                    ? 'هیچ فاکتور فروشی ثبت نشده است.'
                    : 'هیچ پیش‌فاکتوری ثبت نشده است.'}
                </Text>
              </View>
            ) : (
              <View style={styles.ledgerItemsGrid}>
                {filteredTransactions.map((item) => {
                  const isInvoice = item.kind === 'invoice';
                  const isProforma = isInvoice && item.type === 'پیش فاکتور';
                  const isPayment = item.kind === 'payment';
                  const isExpanded = !!expandedItems[item.id];
                  const isMenuOpen = openMenuId === item.id;

                  return (
                    <LinearGradient
                      key={item.id}
                      colors={['#0f4c75', '#3282b8']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={styles.ledgerItemCard}
                    >
                      <TouchableOpacity
                        style={styles.ledgerCardMainRow}
                        onPress={() => toggleExpand(item.id)}
                        activeOpacity={0.9}
                      >
                        <View style={styles.ledgerCardContentArea}>
                          <View style={styles.ledgerCardInfoGroup}>
                            <View style={styles.ledgerCardDateCol}>
                              <View style={styles.ledgerCardDateBadge}>
                                <Text style={styles.ledgerCardDate}>
                                  {toPersianDigits(item.date)}
                                </Text>
                              </View>
                              {isInvoice && item.number && (
                                <View style={styles.ledgerCardInvoiceNumberBadge}>
                                  <Text style={styles.ledgerCardInvoiceNumber}>
                                    {toPersianDigits(item.number)}
                                  </Text>
                                </View>
                              )}
                            </View>

                            <View style={styles.ledgerCardTypeCol}>
                              <View
                                style={[
                                  styles.itemTypeBadge,
                                  isPayment && styles.badgePayment,
                                ]}
                              >
                                <Text style={styles.itemTypeBadgeText}>
                                  {isProforma
                                    ? '📋 پیش‌ فاکتور'
                                    : isInvoice
                                    ? '📄 فاکتور فروش'
                                    : \`💵 \${item.method || 'نقدی'}\`}
                                </Text>
                              </View>
                              {isProforma && (
                                <View style={styles.nonBindingTag}>
                                  <Text style={styles.nonBindingTagText}>غیر مالی</Text>
                                </View>
                              )}
                            </View>
                          </View>

                          <View style={styles.ledgerCardAmountCol}>
                            <Text
                              style={[
                                styles.ledgerCardAmountVal,
                                isInvoice && styles.valDebt,
                                isPayment && styles.valCredit,
                              ]}
                            >
                              {toPersianDigits(formatNumber(item.amount || 0))} ریال
                            </Text>
                          </View>
                        </View>

                        <View style={styles.ledgerCardActionsCol}>
                          <TouchableOpacity
                            style={styles.ledgerAccordionArrow}
                            onPress={() => toggleExpand(item.id)}
                            activeOpacity={0.8}
                          >
                            <Svg
                              viewBox="0 0 24 24"
                              width={16}
                              height={16}
                              fill="none"
                              stroke="#cbd5e1"
                              strokeWidth="2.5"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              style={{
                                transform: [{ rotate: isExpanded ? '180deg' : '0deg' }],
                              }}
                            >
                              <Polyline points="6 9 12 15 18 9" />
                            </Svg>
                          </TouchableOpacity>

                          <TouchableOpacity
                            style={styles.ledgerMenuTrigger}
                            onPress={() =>
                              setOpenMenuId(isMenuOpen ? null : item.id)
                            }
                            activeOpacity={0.8}
                          >
                            <Text style={styles.ledgerDots}>⋮</Text>
                          </TouchableOpacity>
                        </View>
                      </TouchableOpacity>

                      {isMenuOpen && (
                        <LinearGradient
                          colors={['#0d2b43', '#0f4c75']}
                          start={{ x: 0, y: 0 }}
                          end={{ x: 1, y: 1 }}
                          style={styles.ledgerActionMenu}
                        >
                          {isPayment ? (
                            <TouchableOpacity
                              style={[
                                styles.ledgerActionItem,
                                styles.ledgerActionEdit,
                              ]}
                              onPress={() => {
                                setOpenMenuId(null);
                                const originalPayment = (payments || []).find(
                                  (p: any) => String(p.id) === String(item.originalId)
                                );
                                handleOpenEditPayment(originalPayment || item);
                              }}
                              activeOpacity={0.8}
                            >
                              <Text style={styles.ledgerActionText}>
                                ویرایش دریافتی
                              </Text>
                              <Svg
                                viewBox="0 0 24 24"
                                width={18}
                                height={18}
                                fill="none"
                                stroke="#ffffff"
                                strokeWidth="1.5"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              >
                                <Path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                                <Path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                              </Svg>
                            </TouchableOpacity>
                          ) : onOpenInvoice ? (
                            <>
                              <TouchableOpacity
                                style={[
                                  styles.ledgerActionItem,
                                  styles.ledgerActionView,
                                ]}
                                onPress={() => {
                                  setOpenMenuId(null);
                                  onOpenInvoice(customer, item, 'preview');
                                }}
                                activeOpacity={0.8}
                              >
                                <Text style={styles.ledgerActionText}>
                                  نمایش فاکتور
                                </Text>
                                <Svg
                                  viewBox="0 0 24 24"
                                  width={18}
                                  height={18}
                                  fill="none"
                                  stroke="#ffffff"
                                  strokeWidth="1.5"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                >
                                  <Path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                                  <Circle cx="12" cy="12" r="3" />
                                </Svg>
                              </TouchableOpacity>

                              <TouchableOpacity
                                style={[
                                  styles.ledgerActionItem,
                                  styles.ledgerActionEdit,
                                ]}
                                onPress={() => {
                                  setOpenMenuId(null);
                                  const originalInvoice = (invoices || []).find(
                                    (i: any) => String(i.id) === String(item.originalId)
                                  );
                                  onOpenInvoice(
                                    customer,
                                    originalInvoice || item,
                                    'form'
                                  );
                                }}
                                activeOpacity={0.8}
                              >
                                <Text style={styles.ledgerActionText}>
                                  ویرایش فاکتور
                                </Text>
                                <Svg
                                  viewBox="0 0 24 24"
                                  width={18}
                                  height={18}
                                  fill="none"
                                  stroke="#ffffff"
                                  strokeWidth="1.5"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                >
                                  <Path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                                  <Path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                                </Svg>
                              </TouchableOpacity>
                            </>
                          ) : null}

                          <TouchableOpacity
                            style={[
                              styles.ledgerActionItem,
                              styles.ledgerActionDelete,
                            ]}
                            onPress={() => {
                              setOpenMenuId(null);
                              setDeleteConfirmItem(item);
                            }}
                            activeOpacity={0.8}
                          >
                            <Text style={styles.ledgerActionDeleteText}>حذف</Text>
                            <Svg
                              viewBox="0 0 24 24"
                              width={18}
                              height={18}
                              fill="none"
                              stroke="#ff5c5c"
                              strokeWidth="1.5"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            >
                              <Polyline points="3 6 5 6 21 6" />
                              <Path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                              <Line x1="10" y1="11" x2="10" y2="17" />
                              <Line x1="14" y1="11" x2="14" y2="17" />
                            </Svg>
                          </TouchableOpacity>
                        </LinearGradient>
                      )}

                      {isExpanded && (
                        <View style={styles.expandableBodyInner}>
                          {isPayment && (
                            <View style={styles.paymentDetailsBox}>
                              <View style={styles.paymentAmountLine}>
                                <Text style={styles.paymentLabelText}>
                                  مبلغ دریافتی:
                                </Text>
                                <Text style={styles.paymentAmountVal}>
                                  {toPersianDigits(formatNumber(item.amount || 0))}{' '}
                                  ریال
                                </Text>
                              </View>
                              {(item.method === 'چک' ||
                                item.bankName ||
                                item.checkNumber ||
                                item.checkDate) && (
                                <View style={styles.checkSubDetails}>
                                  {!!item.bankName && (
                                    <Text style={styles.checkSubText}>
                                      🏦 بانک: {item.bankName}
                                    </Text>
                                  )}
                                  {!!item.checkNumber && (
                                    <Text style={styles.checkSubText}>
                                      🔢 شماره چک:{' '}
                                      {toPersianDigits(item.checkNumber)}
                                    </Text>
                                  )}
                                  {!!item.checkDate && (
                                    <Text style={styles.checkSubText}>
                                      📆 تاریخ سررسید:{' '}
                                      {toPersianDigits(item.checkDate)}
                                    </Text>
                                  )}
                                </View>
                              )}
                            </View>
                          )}

                          {isInvoice && (
                            <View style={styles.ledgerMiniInvoice}>
                              <View style={styles.miniInvoiceHeader}>
                                <Text style={[styles.colDesc, styles.headerText]}>
                                  شرح کالا
                                </Text>
                                <Text style={[styles.colQty, styles.headerText]}>
                                  تعداد
                                </Text>
                                <Text style={[styles.colPrice, styles.headerText]}>
                                  مبلغ (ریال)
                                </Text>
                              </View>
                              <View style={styles.miniInvoiceBody}>
                                {Array.isArray(item.items) &&
                                item.items.length > 0 ? (
                                  item.items.map((it: any, idx: number) => {
                                    let desc = it?.desc || (typeof it === 'string' ? it : 'قلم کالا');
                                    let qty = it?.quantity || '1';
                                    let price = it?.unitPrice || 0;
                                    return (
                                      <View key={idx} style={styles.miniInvoiceRow}>
                                        <Text style={styles.colDesc}>{desc}</Text>
                                        <Text style={styles.colQty}>
                                          {toPersianDigits(qty)}
                                        </Text>
                                        <Text style={styles.colPrice}>
                                          {price > 0
                                            ? toPersianDigits(formatNumber(price))
                                            : '-'}
                                        </Text>
                                      </View>
                                    );
                                  })
                                ) : (
                                  <View style={styles.miniInvoiceRow}>
                                    <Text style={styles.colDesc}>
                                      {typeof item.items === 'string'
                                        ? item.items
                                        : 'بدون اقلام تفصیلی'}
                                    </Text>
                                  </View>
                                )}
                              </View>
                              <View style={styles.miniInvoiceFooter}>
                                <Text style={styles.footerLabel}>جمع کل:</Text>
                                <Text style={styles.footerVal}>
                                  {toPersianDigits(formatNumber(item.amount || 0))}{' '}
                                  ریال
                                </Text>
                              </View>
                            </View>
                          )}

                          {!isInvoice && !!item.note && (
                            <View style={styles.noteRow}>
                              <Text style={styles.noteRowText}>
                                📝 توضیحات: {toPersianDigits(item.note)}
                              </Text>
                            </View>
                          )}

                          {!isInvoice && !!item.attachment && (
                            <View style={styles.attachmentThumbnailWrapper}>
                              <TouchableOpacity
                                style={styles.attachmentThumbnailBox}
                                onPress={() => setSelectedImage(item.attachment || null)}
                                activeOpacity={0.8}
                              >
                                <Image
                                  source={{ uri: item.attachment }}
                                  style={styles.attachmentThumbImg}
                                  resizeMode="cover"
                                />
                                <View style={styles.thumbZoomOverlay}>
                                  <Text style={styles.thumbZoomText}>🔍 مشاهده</Text>
                                </View>
                              </TouchableOpacity>
                            </View>
                          )}
                        </View>
                      )}
                    </LinearGradient>
                  );
                })}
              </View>
            )}
          </View>
        </ScrollView>

        {/* ===== نوار پایین دکمه صورت حساب ===== */}
        <View style={styles.ledgerBottomBar}>
          <View style={styles.ledgerBottomActionsCard}>
            <TouchableOpacity
              style={styles.ledgerStatementBtnCircle}
              onPress={() => {
                if (onOpenStatement) {
                  onOpenStatement(customer);
                } else {
                  alert('مشاهده صورت‌حساب کامل');
                }
              }}
              activeOpacity={0.85}
            >
              <Svg
                viewBox="0 0 24 24"
                width={24}
                height={24}
                fill="none"
                stroke="#ffffff"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <Rect x="4" y="16" width="4" height="4" fill="#ffffff" rx="1" />
                <Rect x="10" y="12" width="4" height="8" fill="#ffffff" rx="1" />
                <Rect x="16" y="8" width="4" height="12" fill="#ffffff" rx="1" />
                <Path d="M3 11 L9 5 L13 8 L20 1" />
                <Polyline points="15 1 20 1 20 6" />
              </Svg>
            </TouchableOpacity>
          </View>
        </View>

        {/* ===== مودال ثبت دریافتی جدید ===== */}
        {showAddPaymentModal && (
          <View
            style={[
              styles.ledgerAlertOverlay,
              isClosingAddPaymentModal && styles.overlayClosing,
            ]}
          >
            <LinearGradient
              colors={['#0d2b43', '#0f4c75']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.ledgerPaymentModal}
            >
              <View style={styles.ledgerModalHeader}>
                <Text style={styles.ledgerModalTitle}>
                  {editingPayment
                    ? \`ویرایش دریافتی از \${customer.name}\`
                    : \`ثبت دریافتی جدید از \${customer.name}\`}
                </Text>
                <TouchableOpacity
                  style={styles.modalCloseIcon}
                  onPress={closeAddPaymentModal}
                  activeOpacity={0.7}
                >
                  <Text style={styles.modalCloseIconText}>✕</Text>
                </TouchableOpacity>
              </View>

              <ScrollView
                style={styles.paymentModalScroll}
                keyboardShouldPersistTaps="handled"
              >
                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>مبلغ دریافتی (ریال) *</Text>
                  <TextInput
                    style={styles.formInput}
                    value={paymentAmount}
                    onChangeText={(val) => {
                      const parsed = parseNumber(val);
                      setPaymentAmount(parsed ? formatNumber(parsed) : '');
                    }}
                    placeholder="مثال: ۱,۵۰۰,۰۰۰"
                    placeholderTextColor="#94a3b8"
                    keyboardType="numeric"
                  />
                </View>

                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>تاریخ دریافت *</Text>
                  <TextInput
                    style={styles.formInput}
                    value={paymentDate}
                    onChangeText={setPaymentDate}
                    placeholder="مثال: ۱۴۰۳/۰۵/۱۵"
                    placeholderTextColor="#94a3b8"
                  />
                </View>

                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>روش دریافت</Text>
                  <View style={styles.paymentMethodsGrid}>
                    {['نقدی', 'کارت به کارت', 'واریز به حساب', 'چک', 'سایر'].map(
                      (m) => (
                        <TouchableOpacity
                          key={m}
                          style={[
                            styles.methodPill,
                            paymentMethod === m && styles.methodPillActive,
                          ]}
                          onPress={() => setPaymentMethod(m)}
                          activeOpacity={0.8}
                        >
                          <Text
                            style={[
                              styles.methodPillText,
                              paymentMethod === m && styles.methodPillTextActive,
                            ]}
                          >
                            {m === 'نقدی' && '💵 '}
                            {m === 'کارت به کارت' && '💳 '}
                            {m === 'واریز به حساب' && '🏦 '}
                            {m === 'چک' && '📜 '}
                            {m === 'سایر' && '⚙️ '}
                            {m}
                          </Text>
                        </TouchableOpacity>
                      )
                    )}
                  </View>
                </View>

                {paymentMethod === 'چک' && (
                  <View style={styles.checkFormSection}>
                    <View style={styles.formGroup}>
                      <Text style={styles.formLabel}>شماره چک</Text>
                      <TextInput
                        style={styles.formInput}
                        value={checkNumber}
                        onChangeText={setCheckNumber}
                        placeholder="شماره چک یا کد صیادی..."
                        placeholderTextColor="#94a3b8"
                      />
                    </View>
                    <View style={styles.formGroup}>
                      <Text style={styles.formLabel}>نام بانک</Text>
                      <TextInput
                        style={styles.formInput}
                        value={bankName}
                        onChangeText={setBankName}
                        placeholder="مثال: بانک ملی، صادرات..."
                        placeholderTextColor="#94a3b8"
                      />
                    </View>
                    <View style={styles.formGroup}>
                      <Text style={styles.formLabel}>تاریخ سررسید چک</Text>
                      <TextInput
                        style={styles.formInput}
                        value={checkDate}
                        onChangeText={setCheckDate}
                        placeholder="مثال: ۱۴۰۳/۰۶/۲۰"
                        placeholderTextColor="#94a3b8"
                      />
                    </View>
                  </View>
                )}

                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>توضیحات / بابت</Text>
                  <TextInput
                    style={[styles.formInput, styles.formTextarea]}
                    value={paymentNote}
                    onChangeText={setPaymentNote}
                    placeholder="توضیحات بابت این پرداخت..."
                    placeholderTextColor="#94a3b8"
                    multiline={true}
                    numberOfLines={2}
                  />
                </View>

                <View style={styles.ledgerModalActions}>
                  <TouchableOpacity
                    style={[styles.ledgerModalBtn, styles.ledgerBtnCancel]}
                    onPress={closeAddPaymentModal}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.ledgerBtnCancelText}>انصراف</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.ledgerModalBtn, styles.ledgerBtnPrimary]}
                    onPress={handleSavePayment}
                    disabled={isSubmitting}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.ledgerBtnPrimaryText}>
                      {isSubmitting
                        ? 'درحال ذخیره...'
                        : editingPayment
                        ? 'ذخیره تغییرات'
                        : 'ثبت دریافتی'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </ScrollView>
            </LinearGradient>
          </View>
        )}

        {/* ===== لایت‌باکس نمایش تصویر ===== */}
        {selectedImage && (
          <View
            style={[
              styles.ledgerAlertOverlay,
              isClosingImageModal && styles.overlayClosing,
            ]}
          >
            <View style={styles.lightboxBox}>
              <TouchableOpacity
                style={styles.lightboxCloseBtn}
                onPress={closeImageModal}
                activeOpacity={0.8}
              >
                <Text style={styles.lightboxCloseBtnText}>✕</Text>
              </TouchableOpacity>
              <Image
                source={{ uri: selectedImage }}
                style={styles.lightboxImg}
                resizeMode="contain"
              />
            </View>
          </View>
        )}

        {/* ===== مودال تایید حذف ===== */}
        {deleteConfirmItem && (
          <View
            style={[
              styles.ledgerAlertOverlay,
              isClosingDeleteConfirmModal && styles.overlayClosing,
            ]}
          >
            <LinearGradient
              colors={['#0d2b43', '#0f4c75']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.ledgerAlertBox}
            >
              <View style={styles.ledgerAlertIconBg}>
                <Svg
                  viewBox="0 0 24 24"
                  width={32}
                  height={32}
                  fill="none"
                  stroke="#ff5c5c"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <Polyline points="3 6 5 6 21 6" />
                  <Path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                  <Line x1="10" y1="11" x2="10" y2="17" />
                  <Line x1="14" y1="11" x2="14" y2="17" />
                </Svg>
              </View>
              <Text style={styles.ledgerAlertTitle}>تایید حذف تراکنش</Text>
              <Text style={styles.ledgerAlertText}>
                آیا از حذف این تراکنش مطمئن هستید؟ این عمل قابل بازگشت نیست.
              </Text>
              <View style={styles.ledgerAlertActions}>
                <TouchableOpacity
                  style={[styles.ledgerAlertBtn, styles.ledgerBtnCancel]}
                  onPress={closeDeleteConfirmModal}
                  activeOpacity={0.8}
                >
                  <Text style={styles.ledgerBtnCancelText}>انصراف</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.ledgerAlertBtn, styles.ledgerBtnDanger]}
                  onPress={handleConfirmDelete}
                  activeOpacity={0.8}
                >
                  <Text style={styles.ledgerBtnDangerText}>بله، حذف شود</Text>
                </TouchableOpacity>
              </View>
            </LinearGradient>
          </View>
        )}
      </View>
    </View>
  );
}

export default CustomerLedger;

const styles = StyleSheet.create({
  ledgerModalWrapper: {
    flex: 1,
    backgroundColor: '#eaf6fc',
    width: '100%',
    height: '100%',
  },
  ledgerWrapper: {
    flex: 1,
    flexDirection: 'column',
    backgroundColor: '#eaf6fc',
  },
  ledgerTopHeader: {
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 44 : 16,
    paddingBottom: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#2e557c',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 14,
    elevation: 8,
    zIndex: 10,
  },
  ledgerTopHeaderInfo: {
    flex: 1,
    flexDirection: 'column',
    gap: 2,
  },
  ledgerMainTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: '#ffffff',
    textAlign: 'right',
  },
  ledgerTopHeaderSubtitle: {
    fontSize: 11,
    color: '#ffffff',
    opacity: 0.9,
    fontWeight: '500',
    textAlign: 'right',
  },
  ledgerHeaderButtons: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  ledgerHeaderBtn: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  ledgerHeaderAddPaymentBtn: {
    backgroundColor: 'rgba(16, 185, 129, 0.25)',
  },
  moneyIconText: {
    fontSize: 18,
  },
  ledgerScrollView: {
    flex: 1,
  },
  ledgerContainer: {
    paddingHorizontal: 14,
    paddingTop: 10,
    paddingBottom: 100,
  },
  ledgerFilterBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    marginBottom: 10,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#2e557c',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 3,
  },
  ledgerTabs: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  ledgerTabBtnGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  ledgerTabBtn: {
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  ledgerTabBtnActive: {
    backgroundColor: '#10b981',
  },
  ledgerTabBtnText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '800',
  },
  ledgerFilterBtn: {
    paddingVertical: 6,
    paddingHorizontal: 6,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  ledgerSortBtn: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  ledgerAllFilterDropdown: {
    position: 'absolute',
    top: 48,
    right: 8,
    borderWidth: 1,
    borderColor: '#a2c8e2',
    borderRadius: 12,
    padding: 6,
    minWidth: 160,
    zIndex: 9999,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 10,
  },
  ledgerAllFilterOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 8,
    marginBottom: 4,
  },
  filterOptionSelected: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  filterOptionLabel: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
  },
  optionCheckmark: {
    color: '#10b981',
    fontWeight: 'bold',
    fontSize: 12,
  },
  ledgerListContainer: {
    flexDirection: 'column',
    gap: 8,
  },
  ledgerEmptyMsg: {
    padding: 30,
    borderRadius: 14,
    backgroundColor: '#1b6ca8',
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: 'rgba(255, 255, 255, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ledgerEmptyMsgText: {
    color: '#e2e8f0',
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'center',
  },
  ledgerItemsGrid: {
    flexDirection: 'column',
    gap: 8,
  },
  ledgerItemCard: {
    borderRadius: 14,
    padding: 10,
    borderWidth: 0.9,
    borderColor: '#09bcbc',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 3,
  },
  ledgerCardMainRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  ledgerCardContentArea: {
    flex: 1,
    flexDirection: 'column',
    gap: 4,
  },
  ledgerCardInfoGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  ledgerCardDateCol: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ledgerCardDateBadge: {
    height: 28,
    paddingHorizontal: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderWidth: 0.8,
    borderColor: '#a1bece',
    justifyContent: 'center',
    alignItems: 'center',
  },
  ledgerCardDate: {
    fontSize: 11,
    fontWeight: '700',
    color: '#ffffff',
  },
  ledgerCardInvoiceNumberBadge: {
    height: 24,
    paddingHorizontal: 6,
    borderRadius: 6,
    backgroundColor: '#e0f2fe',
    justifyContent: 'center',
    alignItems: 'center',
  },
  ledgerCardInvoiceNumber: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#075985',
  },
  ledgerCardTypeCol: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  itemTypeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderWidth: 0.8,
    borderColor: '#52dc45',
  },
  badgePayment: {
    borderColor: '#52dc45',
  },
  itemTypeBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#ffffff',
  },
  nonBindingTag: {
    backgroundColor: '#fef3c7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  nonBindingTagText: {
    fontSize: 9.5,
    fontWeight: '700',
    color: '#92400e',
  },
  ledgerCardAmountCol: {
    paddingTop: 2,
  },
  ledgerCardAmountVal: {
    fontSize: 13,
    fontWeight: '900',
    textAlign: 'left',
  },
  valDebt: {
    color: '#fca5a5',
  },
  valCredit: {
    color: '#6ee7b7',
  },
  ledgerCardActionsCol: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ledgerAccordionArrow: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  ledgerMenuTrigger: {
    width: 24,
    height: 28,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ledgerDots: {
    fontSize: 18,
    color: '#cbd5e1',
    lineHeight: 18,
  },
  ledgerActionMenu: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e5e8',
    marginTop: 8,
    overflow: 'hidden',
  },
  ledgerActionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#2e557c',
  },
  ledgerActionView: {
    borderBottomWidth: 1,
    borderBottomColor: '#2e557c',
  },
  ledgerActionEdit: {
    borderBottomWidth: 1,
    borderBottomColor: '#2e557c',
  },
  ledgerActionDelete: {
    borderBottomWidth: 0,
  },
  ledgerActionText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
  ledgerActionDeleteText: {
    color: '#ff5c5c',
    fontSize: 12,
    fontWeight: '800',
  },
  expandableBodyInner: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.15)',
    gap: 8,
  },
  paymentDetailsBox: {
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  paymentAmountLine: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  paymentLabelText: {
    color: '#cbd5e1',
    fontSize: 11,
    fontWeight: '700',
  },
  paymentAmountVal: {
    color: '#38ef7d',
    fontSize: 12,
    fontWeight: '800',
  },
  checkSubDetails: {
    marginTop: 6,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
    gap: 3,
  },
  checkSubText: {
    color: '#cbd5e1',
    fontSize: 11,
  },
  ledgerMiniInvoice: {
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  miniInvoiceHeader: {
    flexDirection: 'row',
    backgroundColor: '#f1f5f9',
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  headerText: {
    fontWeight: '700',
    color: '#475569',
    fontSize: 10.5,
  },
  miniInvoiceBody: {
    flexDirection: 'column',
  },
  miniInvoiceRow: {
    flexDirection: 'row',
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  colDesc: {
    flex: 2,
    textAlign: 'right',
    fontSize: 11,
    color: '#334155',
  },
  colQty: {
    flex: 0.6,
    textAlign: 'center',
    fontSize: 11,
    color: '#334155',
  },
  colPrice: {
    flex: 1.4,
    textAlign: 'left',
    fontSize: 11,
    color: '#334155',
  },
  miniInvoiceFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
    paddingHorizontal: 8,
    backgroundColor: '#e0f2fe',
    borderTopWidth: 1,
    borderTopColor: '#bae6fd',
  },
  footerLabel: {
    fontWeight: '700',
    color: '#0369a1',
    fontSize: 11,
  },
  footerVal: {
    fontWeight: '800',
    color: '#0369a1',
    fontSize: 11.5,
  },
  noteRow: {
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    padding: 8,
    borderRadius: 8,
  },
  noteRowText: {
    color: '#cbd5e1',
    fontSize: 11,
    lineHeight: 16,
  },
  attachmentThumbnailWrapper: {
    alignItems: 'center',
    marginTop: 4,
  },
  attachmentThumbnailBox: {
    width: 140,
    height: 100,
    borderRadius: 10,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: '#2e557c',
    position: 'relative',
  },
  attachmentThumbImg: {
    width: '100%',
    height: '100%',
  },
  thumbZoomOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    paddingVertical: 3,
    alignItems: 'center',
  },
  thumbZoomText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '700',
  },
  ledgerBottomBar: {
    position: 'absolute',
    bottom: 15,
    left: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 100,
    pointerEvents: 'box-none',
  },
  ledgerBottomActionsCard: {
    backgroundColor: '#ffffff',
    borderRadius: 30,
    padding: 4,
    borderWidth: 2,
    borderColor: '#3282b8',
    shadowColor: '#0d2b43',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 8,
  },
  ledgerStatementBtnCircle: {
    backgroundColor: '#0f4c75',
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#0f4c75',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  ledgerAlertOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    zIndex: 99999,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  overlayClosing: {
    opacity: 0,
  },
  ledgerPaymentModal: {
    width: '100%',
    maxWidth: 380,
    maxHeight: '85%',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#2e557c',
    padding: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 10,
  },
  ledgerModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
    marginBottom: 10,
  },
  ledgerModalTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#ffffff',
  },
  modalCloseIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCloseIconText: {
    color: '#cbd5e1',
    fontSize: 14,
    fontWeight: '700',
  },
  paymentModalScroll: {
    maxHeight: 400,
  },
  formGroup: {
    marginBottom: 10,
  },
  formLabel: {
    color: '#cbd5e1',
    fontWeight: '700',
    fontSize: 11.5,
    marginBottom: 4,
    textAlign: 'right',
  },
  formInput: {
    width: '100%',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    color: '#ffffff',
    fontSize: 12,
    textAlign: 'right',
  },
  formTextarea: {
    minHeight: 60,
    textAlignVertical: 'top',
  },
  paymentMethodsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 4,
  },
  methodPill: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  methodPillActive: {
    backgroundColor: '#10b981',
    borderColor: '#10b981',
  },
  methodPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#cbd5e1',
  },
  methodPillTextActive: {
    color: '#ffffff',
  },
  checkFormSection: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    padding: 10,
    borderRadius: 12,
    marginBottom: 10,
    gap: 8,
  },
  attachmentPreviewBox: {
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    padding: 10,
    borderRadius: 10,
  },
  attachmentPreviewImg: {
    width: 150,
    height: 100,
    borderRadius: 8,
  },
  removeAttBtn: {
    backgroundColor: '#ef4444',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 6,
  },
  removeAttBtnText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '700',
  },
  ledgerModalActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 12,
  },
  ledgerModalBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ledgerBtnCancel: {
    borderWidth: 1.5,
    borderColor: '#2e557c',
    backgroundColor: 'transparent',
  },
  ledgerBtnCancelText: {
    color: '#dee1e4',
    fontSize: 12,
    fontWeight: '700',
  },
  ledgerBtnPrimary: {
    backgroundColor: '#10b981',
  },
  ledgerBtnPrimaryText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
  lightboxBox: {
    width: '90%',
    maxHeight: '85%',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  lightboxCloseBtn: {
    position: 'absolute',
    top: -40,
    right: 0,
    backgroundColor: '#ffffff',
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  lightboxCloseBtnText: {
    color: '#000000',
    fontSize: 14,
    fontWeight: '900',
  },
  lightboxImg: {
    width: '100%',
    height: 340,
    borderRadius: 12,
  },
  ledgerAlertBox: {
    width: '85%',
    maxWidth: 340,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e2e5e8',
    padding: 22,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  ledgerAlertIconBg: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: 'rgba(255, 92, 92, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  ledgerAlertTitle: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '800',
    marginBottom: 6,
    textAlign: 'center',
  },
  ledgerAlertText: {
    color: '#aab7c8',
    fontSize: 11.5,
    lineHeight: 18,
    marginBottom: 16,
    textAlign: 'center',
  },
  ledgerAlertActions: {
    flexDirection: 'row',
    gap: 10,
    width: '100%',
  },
  ledgerAlertBtn: {
    flex: 1,
    paddingVertical: 9,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ledgerBtnDanger: {
    backgroundColor: '#ff5c5c',
  },
  ledgerBtnDangerText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '800',
  },
  ledgerNotFoundMsg: {
    color: '#0d2b43',
    fontWeight: '800',
    fontSize: 15,
    textAlign: 'center',
    paddingVertical: 40,
  },
});
`,
  },
  {
    path: 'src/screens/Account.tsx',
    name: 'Account.tsx',
    category: 'Screens',
    description: 'کامپوننت استاندارد React Native برای فرم ایجاد و ویرایش حساب مشتریان با گرادیان‌های دقیق، آپلود تصویر و مودال هشدار',
    content: `/**
 * @file Account.tsx
 * @description کامپوننت React Native صفحه ایجاد و ویرایش حساب
 * تبدیل شده دقیق از Account.jsx و account.css
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Image,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path, Polyline, Circle, Line } from 'react-native-svg';
import { getCustomerCode, toPersianDigits } from '../utils/invoiceHelpers';

export interface Customer {
  id?: string | number | null;
  name: string;
  address?: string;
  phone?: string;
  economicCode?: string;
  avatar?: string | null;
  [key: string]: any;
}

export interface AccountProps {
  onNavigate: (screen: string) => void;
  onSave: (customerData: Customer) => Promise<boolean | void> | boolean | void;
  customerToEdit?: Customer | null;
  existingCustomers?: Customer[];
}

export function Account({
  onNavigate,
  onSave,
  customerToEdit,
  existingCustomers = [],
}: AccountProps) {
  const [customerName, setCustomerName] = useState(customerToEdit?.name || '');
  const [address, setAddress] = useState(customerToEdit?.address || '');
  const [phone, setPhone] = useState(customerToEdit?.phone || '');
  const [economicCode, setEconomicCode] = useState(
    customerToEdit?.economicCode || ''
  );
  const [profilePreview, setProfilePreview] = useState<string | null>(
    customerToEdit?.avatar || ''
  );
  const [prevCustomerToEdit, setPrevCustomerToEdit] = useState(customerToEdit);

  // استیت‌های انیمیشن و مودال هشدار
  const [isClosingPage, setIsClosingPage] = useState(false);
  const [alertModal, setAlertModal] = useState({
    show: false,
    title: '',
    message: '',
  });
  const [isClosingAlert, setIsClosingAlert] = useState(false);

  const closeAlertModal = () => {
    setIsClosingAlert(true);
    setTimeout(() => {
      setAlertModal({
        show: false,
        title: '',
        message: '',
      });
      setIsClosingAlert(false);
    }, 200);
  };

  useEffect(() => {
    if (customerToEdit !== prevCustomerToEdit) {
      setPrevCustomerToEdit(customerToEdit);
      if (customerToEdit) {
        setCustomerName(customerToEdit.name || '');
        setAddress(customerToEdit.address || '');
        setPhone(customerToEdit.phone || '');
        setEconomicCode(customerToEdit.economicCode || '');
        setProfilePreview(customerToEdit.avatar || '');
      } else {
        setCustomerName('');
        setAddress('');
        setPhone('');
        setEconomicCode('');
        setProfilePreview('');
      }
    }
  }, [customerToEdit, prevCustomerToEdit]);

  const handleClose = () => {
    setIsClosingPage(true);

    setTimeout(() => {
      const referrer =
        typeof sessionStorage !== 'undefined'
          ? sessionStorage.getItem('accountReferrer') || 'dashboard'
          : 'dashboard';
      if (typeof sessionStorage !== 'undefined') {
        sessionStorage.removeItem('accountReferrer');
      }
      onNavigate(referrer);
    }, 200);
  };

  const handleProfilePicPick = () => {
    if (typeof document !== 'undefined') {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      input.onchange = (e: any) => {
        const file = e.target?.files?.[0];
        if (file) {
          const reader = new FileReader();
          reader.onloadend = () => {
            setProfilePreview(reader.result as string);
          };
          reader.readAsDataURL(file);
        }
      };
      input.click();
    } else {
      setProfilePreview(
        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80'
      );
    }
  };

  const handleSave = async () => {
    const trimmedName = customerName.trim();
    if (!trimmedName) {
      setAlertModal({
        show: true,
        title: 'خطای ورودی',
        message: 'لطفاً نام مشتری را وارد نمایید.',
      });
      return;
    }
    const isDuplicate = existingCustomers.some((c) => {
      if (customerToEdit && String(c.id) === String(customerToEdit.id)) {
        return false;
      }
      return (
        c.name && c.name.trim().toLowerCase() === trimmedName.toLowerCase()
      );
    });
    if (isDuplicate) {
      setAlertModal({
        show: true,
        title: 'نام تکراری',
        message: \`مشتری با نام «\${trimmedName}» قبلاً ثبت شده است. امکان ذخیره نام تکراری وجود ندارد.\`,
      });
      return;
    }
    const customerData: Customer = {
      id: customerToEdit ? customerToEdit.id : null,
      name: trimmedName,
      address: address,
      phone: phone,
      economicCode: economicCode,
      avatar: profilePreview,
    };
    const success = await onSave(customerData);
    if (success !== false) {
      onNavigate('customers');
    }
  };

  return (
    <View
      style={[
        styles.accountOverlay,
        isClosingPage && styles.accountOverlayClosing,
      ]}
    >
      <View style={styles.accountWrapper}>
        {/* هدر صفحه */}
        <LinearGradient
          colors={['#0d2b43', '#0f4c75']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.crmTopHeader}
        >
          <View style={styles.crmHeaderInfo}>
            <Text style={styles.crmTitle}>
              {customerToEdit ? 'ویرایش حساب' : 'ثبت حساب جدید'}
            </Text>
            {customerToEdit && (
              <Text style={styles.accountSubtitle}>
                کد مشتری:{' '}
                {toPersianDigits(
                  getCustomerCode(customerToEdit, existingCustomers)
                )}
              </Text>
            )}
          </View>
          <View style={styles.crmHeaderButtons}>
            <TouchableOpacity
              style={styles.crmBackBtn}
              onPress={handleClose}
              activeOpacity={0.8}
            >
              <Svg
                viewBox="0 0 24 24"
                width={22}
                height={22}
                fill="none"
                stroke="#ffffff"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <Polyline points="9 10 4 15 9 20" />
                <Path d="M20 4v7a4 4 0 0 1-4 4H4" />
              </Svg>
            </TouchableOpacity>
          </View>
        </LinearGradient>

        {/* محتوای فرم */}
        <ScrollView
          style={styles.accountScrollView}
          contentContainerStyle={styles.accountContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <LinearGradient
            colors={['#0f4c75', '#3282b8']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.accountFormCard}
          >
            {/* نام مشتری */}
            <View style={styles.accountInputGroup}>
              <Text style={styles.accountInputLabel}>نام مشتری / شرکت :</Text>
              <TextInput
                style={styles.accountInput}
                placeholder=" شرکت... "
                placeholderTextColor="#b3d4e6"
                value={customerName}
                onChangeText={setCustomerName}
              />
            </View>

            {/* آدرس */}
            <View style={styles.accountInputGroup}>
              <Text style={styles.accountInputLabel}>آدرس :</Text>
              <TextInput
                style={styles.accountInput}
                placeholder="استان، شهر، خیابان..."
                placeholderTextColor="#b3d4e6"
                value={address}
                onChangeText={setAddress}
              />
            </View>

            {/* شماره تماس */}
            <View style={styles.accountInputGroup}>
              <Text style={styles.accountInputLabel}>شماره تماس :</Text>
              <TextInput
                style={[styles.accountInput, styles.inputLtr]}
                placeholder="0912..."
                placeholderTextColor="#b3d4e6"
                keyboardType="phone-pad"
                value={phone}
                onChangeText={setPhone}
              />
            </View>

            {/* کد اقتصادی */}
            <View style={styles.accountInputGroup}>
              <Text style={styles.accountInputLabel}>کد اقتصادی :</Text>
              <TextInput
                style={[styles.accountInput, styles.inputLtr]}
                placeholder="0"
                placeholderTextColor="#b3d4e6"
                keyboardType="numeric"
                value={economicCode}
                onChangeText={setEconomicCode}
              />
            </View>

            {/* بخش آپلود عکس پروفایل */}
            <View style={[styles.accountInputGroup, styles.profileUploadGroup]}>
              <Text style={styles.accountInputLabel}>عکس پروفایل :</Text>
              <View style={styles.profileUploadWrapper}>
                {profilePreview ? (
                  <View style={styles.accountAttachmentPreviewBox}>
                    <Image
                      source={{ uri: profilePreview }}
                      style={styles.accountProfilePreviewImg}
                      resizeMode="cover"
                    />
                    <TouchableOpacity
                      style={styles.accountRemoveAttBtn}
                      onPress={() => setProfilePreview(null)}
                      activeOpacity={0.8}
                    >
                      <Text style={styles.accountRemoveAttBtnText}>حذف تصویر</Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <TouchableOpacity
                    style={styles.customFileUpload}
                    onPress={handleProfilePicPick}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.uploadTextIndicator}>انتخاب فایل</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>

            {/* دکمه اکشن ذخیره */}
            <View style={styles.accountModalActions}>
              <TouchableOpacity
                style={styles.saveBtnTouchable}
                onPress={handleSave}
                activeOpacity={0.85}
              >
                <LinearGradient
                  colors={['#10b981', '#059669']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.accountBtnSave}
                >
                  <Text style={styles.accountBtnSaveText}>
                    {customerToEdit ? 'ویرایش اطلاعات' : 'ذخیره اطلاعات'}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </LinearGradient>
        </ScrollView>
      </View>

      {/* مودال هشدار سیستم (Alert) */}
      {alertModal.show && (
        <View
          style={[
            styles.customAlertOverlay,
            isClosingAlert && styles.customAlertOverlayClosing,
          ]}
        >
          <LinearGradient
            colors={['#0d2b43', '#0f4c75']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.accountAlertBox}
          >
            <View style={styles.customAlertIconBg}>
              <Svg
                viewBox="0 0 24 24"
                width={36}
                height={36}
                fill="none"
                stroke="#f59e0b"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <Circle cx="12" cy="12" r="10" />
                <Line x1="12" y1="8" x2="12" y2="12" />
                <Line x1="12" y1="16" x2="12.01" y2="16" />
              </Svg>
            </View>
            <Text style={styles.customAlertTitle}>{alertModal.title}</Text>
            <Text style={styles.accountCustomElement}>{alertModal.message}</Text>
            <View style={styles.customAlertActions}>
              <TouchableOpacity
                style={styles.customAlertBtn}
                onPress={closeAlertModal}
                activeOpacity={0.8}
              >
                <Text style={styles.customAlertBtnText}>متوجه شدم</Text>
              </TouchableOpacity>
            </View>
          </LinearGradient>
        </View>
      )}
    </View>
  );
}

export default Account;

const styles = StyleSheet.create({
  accountOverlay: {
    flex: 1,
    backgroundColor: '#eaf6fc',
    width: '100%',
    height: '100%',
  },
  accountOverlayClosing: {
    opacity: 0.9,
  },
  accountWrapper: {
    flex: 1,
    flexDirection: 'column',
    width: '100%',
    height: '100%',
  },
  crmTopHeader: {
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 44 : 20,
    paddingBottom: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 14,
    elevation: 8,
    zIndex: 10,
  },
  crmHeaderInfo: {
    flex: 1,
  },
  crmTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#ffffff',
    textAlign: 'right',
  },
  accountSubtitle: {
    fontSize: 12,
    color: '#ffffff',
    opacity: 0.9,
    fontWeight: '500',
    marginTop: 2,
    textAlign: 'right',
  },
  crmHeaderButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginLeft: 12,
  },
  crmBackBtn: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  accountScrollView: {
    flex: 1,
  },
  accountContent: {
    padding: 15,
    paddingBottom: 40,
    alignItems: 'center',
  },
  accountFormCard: {
    width: '100%',
    borderRadius: 20,
    paddingVertical: 18,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#a2c8e2',
    shadowColor: '#0d2b43',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 14,
    elevation: 6,
  },
  accountInputGroup: {
    width: '100%',
    paddingVertical: 4,
    paddingHorizontal: 5,
    marginBottom: 8,
  },
  accountInputLabel: {
    marginBottom: 8,
    fontWeight: '700',
    fontSize: 13,
    color: '#ffffff',
    textAlign: 'right',
    paddingHorizontal: 6,
  },
  accountInput: {
    width: '100%',
    marginTop: 3,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    fontSize: 13,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    color: '#ffffff',
    textAlign: 'right',
  },
  inputLtr: {
    textAlign: 'left',
  },
  profileUploadGroup: {
    alignItems: 'center',
    marginTop: 6,
    marginBottom: 16,
  },
  profileUploadWrapper: {
    flexDirection: 'row',
    justifyContent: 'center',
    width: '100%',
  },
  customFileUpload: {
    justifyContent: 'center',
    alignItems: 'center',
    width: 110,
    height: 110,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: '#a2c8e2',
    borderRadius: 15,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  uploadTextIndicator: {
    fontSize: 12,
    fontWeight: '500',
    color: '#b3d4e6',
  },
  accountAttachmentPreviewBox: {
    flexDirection: 'column',
    alignItems: 'center',
    gap: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    padding: 14,
    borderRadius: 18,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  accountProfilePreviewImg: {
    width: 105,
    height: 105,
    borderRadius: 15,
  },
  accountRemoveAttBtn: {
    backgroundColor: '#ef4444',
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderRadius: 8,
    shadowColor: '#ef4444',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 3,
  },
  accountRemoveAttBtnText: {
    color: '#ffffff',
    fontWeight: '800',
    fontSize: 11.5,
  },
  accountModalActions: {
    width: '100%',
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 6,
  },
  saveBtnTouchable: {
    width: '60%',
  },
  accountBtnSave: {
    width: '100%',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#ffffff',
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  accountBtnSaveText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '900',
  },
  customAlertOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    zIndex: 1000,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  customAlertOverlayClosing: {
    opacity: 0,
  },
  accountAlertBox: {
    width: '85%',
    maxWidth: 360,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#adc7d8',
    paddingVertical: 20,
    paddingHorizontal: 18,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 8,
  },
  customAlertIconBg: {
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  customAlertTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: '#ffffff',
    marginBottom: 8,
    textAlign: 'center',
  },
  accountCustomElement: {
    fontSize: 12.5,
    color: '#b3d4e6',
    marginBottom: 18,
    lineHeight: 20,
    textAlign: 'center',
  },
  customAlertActions: {
    width: '100%',
    alignItems: 'center',
  },
  customAlertBtn: {
    width: '70%',
    paddingVertical: 10,
    backgroundColor: '#145d8e',
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  customAlertBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: 'bold',
  },
});
`,
  },
  {
    path: 'App.tsx',
    name: 'App.tsx',
    category: 'Entry',
    description: 'Root Expo entry point wrapping SafeAreaProvider, NavigationContainer, and RootNavigator.',
    content: `/**
 * @file App.tsx
 * @description Expo Application Root Entry Point
 * Architecture: SafeAreaProvider -> NavigationContainer -> RootNavigator
 */

import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { RootNavigator } from './src/navigation/RootNavigator';

export default function App() {
  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <RootNavigator />
        <StatusBar style="auto" />
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
`,
  },
  {
    path: 'src/navigation/types.ts',
    name: 'types.ts',
    category: 'Navigation',
    description: 'TypeScript param lists for RootStack and BottomTab navigators with global type inference.',
    content: `import type { NavigatorScreenParams } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';

export type BottomTabParamList = {
  Dashboard: undefined;
  List: undefined;
  Form: undefined;
};

export type RootStackParamList = {
  MainTabs: NavigatorScreenParams<BottomTabParamList>;
  Detail: { id: string };
  NotFound: undefined;
};

// Typed Props for Screens
export type RootStackScreenProps<T extends keyof RootStackParamList> =
  NativeStackScreenProps<RootStackParamList, T>;

export type BottomTabProps<T extends keyof BottomTabParamList> =
  BottomTabScreenProps<BottomTabParamList, T>;

declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}
`,
  },
  {
    path: 'src/navigation/RootNavigator.tsx',
    name: 'RootNavigator.tsx',
    category: 'Navigation',
    description: 'Native Stack Navigator hosting MainTabs and push screens like DetailScreen.',
    content: `import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { BottomTabNavigator } from './BottomTabNavigator';
import { DetailScreen } from '../screens/DetailScreen';
import { RootStackParamList } from './types';
import { THEME } from '../constants/theme';

const Stack = createNativeStackNavigator<RootStackParamList>();

export const RootNavigator: React.FC = () => {
  return (
    <Stack.Navigator
      initialRouteName="MainTabs"
      screenOptions={{
        headerStyle: {
          backgroundColor: THEME.colors.card,
        },
        headerTintColor: THEME.colors.textPrimary,
        headerTitleStyle: {
          fontWeight: '700',
        },
        headerShadowVisible: false,
      }}
    >
      <Stack.Screen
        name="MainTabs"
        component={BottomTabNavigator}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="Detail"
        component={DetailScreen}
        options={{
          title: 'Record Details',
          headerBackTitle: 'Back',
          animation: 'slide_from_right',
        }}
      />
    </Stack.Navigator>
  );
};
`,
  },
  {
    path: 'src/navigation/BottomTabNavigator.tsx',
    name: 'BottomTabNavigator.tsx',
    category: 'Navigation',
    description: 'Bottom Tab Navigator hosting Dashboard, List, and Form with active badge indicators.',
    content: `import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { DashboardScreen } from '../screens/DashboardScreen';
import { ListScreen } from '../screens/ListScreen';
import { FormScreen } from '../screens/FormScreen';
import { BottomTabParamList } from './types';
import { THEME } from '../constants/theme';
import { useAppStore } from '../store/useAppStore';
import { Ionicons } from '@expo/vector-icons';

const Tab = createBottomTabNavigator<BottomTabParamList>();

export const BottomTabNavigator: React.FC = () => {
  const pendingCount = useAppStore((state) => state.getMetrics().pendingItems);

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerStyle: {
          backgroundColor: THEME.colors.card,
          borderBottomWidth: 1,
          borderBottomColor: THEME.colors.border,
        },
        headerTintColor: THEME.colors.textPrimary,
        headerTitleStyle: {
          fontWeight: '700',
          fontSize: 18,
        },
        headerShadowVisible: false,
        tabBarActiveTintColor: THEME.colors.primary,
        tabBarInactiveTintColor: THEME.colors.textMuted,
        tabBarStyle: {
          backgroundColor: THEME.colors.card,
          borderTopColor: THEME.colors.border,
          borderTopWidth: 1,
          height: 60,
          paddingBottom: 8,
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
        },
        tabBarIcon: ({ color, size, focused }) => {
          let iconName: keyof typeof Ionicons.glyphMap = 'cube-outline';

          if (route.name === 'Dashboard') {
            iconName = focused ? 'grid' : 'grid-outline';
          } else if (route.name === 'List') {
            iconName = focused ? 'list' : 'list-outline';
          } else if (route.name === 'Form') {
            iconName = focused ? 'add-circle' : 'add-circle-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen
        name="Dashboard"
        component={DashboardScreen}
        options={{
          title: 'Dashboard',
          tabBarLabel: 'Dashboard',
        }}
      />
      <Tab.Screen
        name="List"
        component={ListScreen}
        options={{
          title: 'Records List',
          tabBarLabel: 'Items',
          tabBarBadge: pendingCount > 0 ? pendingCount : undefined,
        }}
      />
      <Tab.Screen
        name="Form"
        component={FormScreen}
        options={{
          title: 'New Entry',
          tabBarLabel: 'Create',
        }}
      />
    </Tab.Navigator>
  );
};
`,
  },
  {
    path: 'src/store/useAppStore.ts',
    name: 'useAppStore.ts',
    category: 'Store',
    description: 'Production Zustand store with typed state, dispatch actions, and computed selectors.',
    content: `import { create } from 'zustand';

export type Priority = 'low' | 'medium' | 'high';

export interface AppItem {
  id: string;
  title: string;
  category: string;
  description: string;
  priority: Priority;
  completed: boolean;
  createdAt: string;
}

export interface MetricSummary {
  totalItems: number;
  completedItems: number;
  pendingItems: number;
  completionRate: number;
}

export interface AppState {
  items: AppItem[];
  searchQuery: string;
  selectedFilter: 'all' | 'pending' | 'completed';
  isDarkMode: boolean;

  // Actions
  addItem: (item: { title: string; category: string; description: string; priority: Priority }) => AppItem;
  toggleItemCompleted: (id: string) => void;
  deleteItem: (id: string) => void;
  setSearchQuery: (query: string) => void;
  setSelectedFilter: (filter: 'all' | 'pending' | 'completed') => void;
  resetToDefault: () => void;

  // Computed Selectors
  getMetrics: () => MetricSummary;
  getFilteredItems: () => AppItem[];
}

const INITIAL_ITEMS: AppItem[] = [
  {
    id: 'item-1',
    title: 'Migrate React Router to React Navigation',
    category: 'Architecture',
    description: 'Set up Bottom Tabs and Stack Navigators with type-safe route parameters.',
    priority: 'high',
    completed: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'item-2',
    title: 'Replace HTML Divs with React Native Views',
    category: 'Components',
    description: 'Refactor web DOM tags to Native primitives and enforce flexbox column defaults.',
    priority: 'high',
    completed: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'item-3',
    title: 'Configure Global Zustand Store',
    category: 'State Management',
    description: 'Bind lightweight state management with selectors and async dispatchers.',
    priority: 'medium',
    completed: false,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'item-4',
    title: 'Implement FlatList with KeyExtractor',
    category: 'Performance',
    description: 'Ensure virtualized list rendering with ItemSeparatorComponent and pull-to-refresh.',
    priority: 'medium',
    completed: false,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'item-5',
    title: 'Test KeyboardAvoidingView on iOS/Android',
    category: 'Mobile UX',
    description: 'Verify TextInput behavior with platform-specific behavior padding offset.',
    priority: 'low',
    completed: false,
    createdAt: new Date().toISOString(),
  },
];

export const useAppStore = create<AppState>((set, get) => ({
  items: INITIAL_ITEMS,
  searchQuery: '',
  selectedFilter: 'all',
  isDarkMode: false,

  addItem: ({ title, category, description, priority }) => {
    const newItem: AppItem = {
      id: \`item-\${Date.now()}\`,
      title,
      category: category || 'General',
      description,
      priority,
      completed: false,
      createdAt: new Date().toISOString(),
    };

    set((state) => ({
      items: [newItem, ...state.items],
    }));

    return newItem;
  },

  toggleItemCompleted: (id) => {
    set((state) => ({
      items: state.items.map((item) =>
        item.id === id ? { ...item, completed: !item.completed } : item
      ),
    }));
  },

  deleteItem: (id) => {
    set((state) => ({
      items: state.items.filter((item) => item.id !== id),
    }));
  },

  setSearchQuery: (query) => {
    set({ searchQuery: query });
  },

  setSelectedFilter: (filter) => {
    set({ selectedFilter: filter });
  },

  resetToDefault: () => {
    set({
      items: INITIAL_ITEMS,
      searchQuery: '',
      selectedFilter: 'all',
    });
  },

  getMetrics: () => {
    const items = get().items;
    const totalItems = items.length;
    const completedItems = items.filter((i) => i.completed).length;
    const pendingItems = totalItems - completedItems;
    const completionRate = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;

    return {
      totalItems,
      completedItems,
      pendingItems,
      completionRate,
    };
  },

  getFilteredItems: () => {
    const { items, searchQuery, selectedFilter } = get();
    return items.filter((item) => {
      const matchesSearch =
        searchQuery.trim() === '' ||
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesFilter =
        selectedFilter === 'all' ||
        (selectedFilter === 'completed' && item.completed) ||
        (selectedFilter === 'pending' && !item.completed);

      return matchesSearch && matchesFilter;
    });
  },
}));
`,
  },
  {
    path: 'src/screens/DashboardScreen.tsx',
    name: 'DashboardScreen.tsx',
    category: 'Screens',
    description: 'Generic home dashboard with summary cards, metrics grid, and quick actions.',
    content: `import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { THEME } from '../constants/theme';
import { useAppStore } from '../store/useAppStore';
import { SummaryCard } from '../components/SummaryCard';
import { CustomButton } from '../components/CustomButton';

interface DashboardScreenProps {
  navigation: {
    navigate: (screen: string, params?: any) => void;
  };
}

export const DashboardScreen: React.FC<DashboardScreenProps> = ({ navigation }) => {
  const { items, getMetrics, toggleItemCompleted } = useAppStore();
  const metrics = getMetrics();
  const recentItems = items.slice(0, 3);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
    >
      {/* Welcome Banner */}
      <View style={styles.welcomeSection}>
        <Text style={styles.greetingKicker}>Mobile Architecture v1.0</Text>
        <Text style={styles.greetingTitle}>Developer Dashboard</Text>
        <Text style={styles.greetingSubtitle}>
          Production Expo & React Native starter with React Navigation and Zustand state.
        </Text>
      </View>

      {/* Summary Cards Grid */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Overview Metrics</Text>
        <Text style={styles.sectionSubtitle}>Live Zustand store metrics</Text>
      </View>

      <View style={styles.metricsGrid}>
        <View style={styles.metricRow}>
          <SummaryCard
            title="Total Tasks"
            value={metrics.totalItems}
            subtitle="Registered items"
            badge="ACTIVE"
            accentColor={THEME.colors.primary}
            onPress={() => navigation.navigate('List')}
          />
          <View style={styles.cardGap} />
          <SummaryCard
            title="Pending"
            value={metrics.pendingItems}
            subtitle="Awaiting action"
            badge="TODO"
            accentColor={THEME.colors.warning}
            onPress={() => navigation.navigate('List')}
          />
        </View>

        <View style={styles.metricRow}>
          <SummaryCard
            title="Completed"
            value={metrics.completedItems}
            subtitle="Finished items"
            badge="DONE"
            accentColor={THEME.colors.success}
            onPress={() => navigation.navigate('List')}
          />
          <View style={styles.cardGap} />
          <SummaryCard
            title="Velocity"
            value={\`\${metrics.completionRate}%\`}
            subtitle="Completion rate"
            badge="RATE"
            accentColor="#8B5CF6"
          />
        </View>
      </View>

      {/* Quick Action CTA Card */}
      <View style={styles.actionCard}>
        <View style={styles.actionCardTextContainer}>
          <Text style={styles.actionCardTitle}>Create New Record</Text>
          <Text style={styles.actionCardDescription}>
            Test React Native TextInput fields and form validation wrapped in ScrollView.
          </Text>
        </View>
        <CustomButton
          title="+ Add Task"
          variant="primary"
          onPress={() => navigation.navigate('Form')}
        />
      </View>

      {/* Recent Items Preview */}
      <View style={styles.sectionHeader}>
        <View style={styles.sectionTitleRow}>
          <Text style={styles.sectionTitle}>Recent Queue</Text>
          <TouchableOpacity onPress={() => navigation.navigate('List')}>
            <Text style={styles.viewAllText}>View All ({items.length})</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.sectionSubtitle}>Tap checkmark to toggle Zustand state</Text>
      </View>

      <View style={styles.recentList}>
        {recentItems.map((item) => (
          <TouchableOpacity
            key={item.id}
            style={styles.recentItemRow}
            onPress={() => navigation.navigate('Detail', { id: item.id })}
            activeOpacity={0.7}
          >
            <TouchableOpacity
              style={[
                styles.checkbox,
                item.completed && styles.checkboxCompleted,
              ]}
              onPress={() => toggleItemCompleted(item.id)}
            >
              {item.completed && <Text style={styles.checkmark}>✓</Text>}
            </TouchableOpacity>

            <View style={styles.recentItemInfo}>
              <Text
                style={[
                  styles.recentItemTitle,
                  item.completed && styles.itemTitleCompleted,
                ]}
                numberOfLines={1}
              >
                {item.title}
              </Text>
              <Text style={styles.recentItemMeta}>
                {item.category} · Priority: {item.priority.toUpperCase()}
              </Text>
            </View>

            <Text style={styles.chevron}>›</Text>
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME.colors.background,
  },
  contentContainer: {
    padding: THEME.spacing.md,
    paddingBottom: THEME.spacing.xxl,
  },
  welcomeSection: {
    backgroundColor: THEME.colors.card,
    borderRadius: THEME.borderRadius.lg,
    padding: THEME.spacing.lg,
    borderWidth: 1,
    borderColor: THEME.colors.border,
    marginBottom: THEME.spacing.lg,
  },
  greetingKicker: {
    fontSize: 12,
    fontWeight: '600',
    color: THEME.colors.primary,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: THEME.spacing.xs,
  },
  greetingTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: THEME.colors.textPrimary,
    letterSpacing: -0.3,
    marginBottom: 6,
  },
  greetingSubtitle: {
    fontSize: 13,
    lineHeight: 18,
    color: THEME.colors.textSecondary,
  },
  sectionHeader: {
    marginBottom: THEME.spacing.sm,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: THEME.colors.textPrimary,
  },
  sectionSubtitle: {
    fontSize: 12,
    color: THEME.colors.textMuted,
    marginTop: 2,
  },
  viewAllText: {
    fontSize: 13,
    fontWeight: '600',
    color: THEME.colors.primary,
  },
  metricsGrid: {
    marginBottom: THEME.spacing.lg,
  },
  metricRow: {
    flexDirection: 'row',
    marginBottom: THEME.spacing.md,
  },
  cardGap: {
    width: THEME.spacing.md,
  },
  actionCard: {
    backgroundColor: THEME.colors.card,
    borderRadius: THEME.borderRadius.lg,
    padding: THEME.spacing.lg,
    borderWidth: 1,
    borderColor: THEME.colors.border,
    marginBottom: THEME.spacing.lg,
  },
  actionCardTextContainer: {
    marginBottom: THEME.spacing.md,
  },
  actionCardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: THEME.colors.textPrimary,
    marginBottom: 4,
  },
  actionCardDescription: {
    fontSize: 13,
    lineHeight: 18,
    color: THEME.colors.textSecondary,
  },
  recentList: {
    backgroundColor: THEME.colors.card,
    borderRadius: THEME.borderRadius.lg,
    borderWidth: 1,
    borderColor: THEME.colors.border,
    overflow: 'hidden',
  },
  recentItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: THEME.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: THEME.colors.borderLight,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: THEME.colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: THEME.spacing.md,
  },
  checkboxCompleted: {
    backgroundColor: THEME.colors.success,
    borderColor: THEME.colors.success,
  },
  checkmark: {
    color: THEME.colors.white,
    fontSize: 12,
    fontWeight: '700',
  },
  recentItemInfo: {
    flex: 1,
  },
  recentItemTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: THEME.colors.textPrimary,
    marginBottom: 2,
  },
  itemTitleCompleted: {
    textDecorationLine: 'line-through',
    color: THEME.colors.textMuted,
  },
  recentItemMeta: {
    fontSize: 12,
    color: THEME.colors.textMuted,
  },
  chevron: {
    fontSize: 20,
    color: THEME.colors.textMuted,
    marginLeft: THEME.spacing.sm,
  },
});
`,
  },
  {
    path: 'src/screens/ListScreen.tsx',
    name: 'ListScreen.tsx',
    category: 'Screens',
    description: 'Generic list screen powered by FlatList with pull-to-refresh, filters, and actions.',
    content: `import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  RefreshControl,
} from 'react-native';
import { THEME } from '../constants/theme';
import { useAppStore, AppItem } from '../store/useAppStore';

interface ListScreenProps {
  navigation: {
    navigate: (screen: string, params?: any) => void;
  };
}

export const ListScreen: React.FC<ListScreenProps> = ({ navigation }) => {
  const {
    searchQuery,
    setSearchQuery,
    selectedFilter,
    setSelectedFilter,
    getFilteredItems,
    toggleItemCompleted,
    deleteItem,
    resetToDefault,
  } = useAppStore();

  const [refreshing, setRefreshing] = useState(false);
  const items = getFilteredItems();

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => {
      setRefreshing(false);
    }, 800);
  }, []);

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return THEME.colors.danger;
      case 'medium':
        return THEME.colors.warning;
      case 'low':
      default:
        return THEME.colors.primary;
    }
  };

  const renderItem = ({ item }: { item: AppItem }) => {
    const priorityColor = getPriorityColor(item.priority);

    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.headerLeft}>
            <TouchableOpacity
              style={[
                styles.checkbox,
                item.completed && styles.checkboxCompleted,
              ]}
              onPress={() => toggleItemCompleted(item.id)}
            >
              {item.completed && <Text style={styles.checkmark}>✓</Text>}
            </TouchableOpacity>
            <View style={styles.badgeContainer}>
              <View style={[styles.priorityDot, { backgroundColor: priorityColor }]} />
              <Text style={styles.categoryText}>{item.category}</Text>
            </View>
          </View>

          <TouchableOpacity
            style={styles.deleteButton}
            onPress={() => deleteItem(item.id)}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Text style={styles.deleteIcon}>✕</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          onPress={() => navigation.navigate('Detail', { id: item.id })}
          activeOpacity={0.7}
        >
          <Text
            style={[
              styles.itemTitle,
              item.completed && styles.itemTitleCompleted,
            ]}
          >
            {item.title}
          </Text>
          <Text style={styles.itemDescription} numberOfLines={2}>
            {item.description}
          </Text>
        </TouchableOpacity>

        <View style={styles.cardFooter}>
          <Text style={styles.timestamp}>
            Added {new Date(item.createdAt).toLocaleDateString()}
          </Text>
          <TouchableOpacity
            onPress={() => navigation.navigate('Detail', { id: item.id })}
          >
            <Text style={styles.detailsLink}>View Details ›</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderEmptyComponent = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyTitle}>No matching items found</Text>
      <Text style={styles.emptySubtitle}>
        Try adjusting your search query or filter status.
      </Text>
      <TouchableOpacity style={styles.resetButton} onPress={resetToDefault}>
        <Text style={styles.resetButtonText}>Reset Filters & Demo Data</Text>
      </TouchableOpacity>
    </View>
  );

  const renderSeparator = () => <View style={styles.separator} />;

  return (
    <View style={styles.container}>
      {/* Search Header */}
      <View style={styles.searchSection}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search by title, category, or keyword..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholderTextColor={THEME.colors.textMuted}
        />

        {/* Filter Segmented Bar */}
        <View style={styles.filterBar}>
          {(['all', 'pending', 'completed'] as const).map((filter) => (
            <TouchableOpacity
              key={filter}
              style={[
                styles.filterTab,
                selectedFilter === filter && styles.filterTabActive,
              ]}
              onPress={() => setSelectedFilter(filter)}
            >
              <Text
                style={[
                  styles.filterTabText,
                  selectedFilter === filter && styles.filterTabTextActive,
                ]}
              >
                {filter.charAt(0).toUpperCase() + filter.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* FlatList */}
      <FlatList
        data={items}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        ItemSeparatorComponent={renderSeparator}
        ListEmptyComponent={renderEmptyComponent}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME.colors.background,
  },
  searchSection: {
    backgroundColor: THEME.colors.card,
    paddingHorizontal: THEME.spacing.md,
    paddingTop: THEME.spacing.md,
    paddingBottom: THEME.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: THEME.colors.border,
  },
  searchInput: {
    height: 44,
    backgroundColor: THEME.colors.surface,
    borderColor: THEME.colors.border,
    borderRadius: THEME.borderRadius.md,
    paddingHorizontal: THEME.spacing.md,
    fontSize: 14,
    color: THEME.colors.textPrimary,
    marginBottom: THEME.spacing.sm,
  },
  filterBar: {
    flexDirection: 'row',
    backgroundColor: THEME.colors.surface,
    padding: 3,
    borderRadius: THEME.borderRadius.md,
  },
  filterTab: {
    flex: 1,
    paddingVertical: 6,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: THEME.borderRadius.sm,
  },
  filterTabActive: {
    backgroundColor: THEME.colors.card,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  filterTabText: {
    fontSize: 12,
    fontWeight: '500',
    color: THEME.colors.textSecondary,
  },
  filterTabTextActive: {
    color: THEME.colors.textPrimary,
    fontWeight: '700',
  },
  listContent: {
    padding: THEME.spacing.md,
    paddingBottom: THEME.spacing.xxl,
  },
  card: {
    backgroundColor: THEME.colors.card,
    borderRadius: THEME.borderRadius.lg,
    padding: THEME.spacing.md,
    borderWidth: 1,
    borderColor: THEME.colors.border,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: THEME.spacing.sm,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 5,
    borderWidth: 1.5,
    borderColor: THEME.colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: THEME.spacing.sm,
  },
  checkboxCompleted: {
    backgroundColor: THEME.colors.success,
    borderColor: THEME.colors.success,
  },
  checkmark: {
    color: THEME.colors.white,
    fontSize: 11,
    fontWeight: '700',
  },
  badgeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  priorityDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  categoryText: {
    fontSize: 12,
    fontWeight: '600',
    color: THEME.colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  deleteButton: {
    padding: 4,
  },
  deleteIcon: {
    fontSize: 14,
    color: THEME.colors.textMuted,
    fontWeight: '600',
  },
  itemTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: THEME.colors.textPrimary,
    marginBottom: 4,
  },
  itemTitleCompleted: {
    textDecorationLine: 'line-through',
    color: THEME.colors.textMuted,
  },
  itemDescription: {
    fontSize: 13,
    lineHeight: 18,
    color: THEME.colors.textSecondary,
    marginBottom: THEME.spacing.sm,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: THEME.spacing.xs,
    borderTopWidth: 1,
    borderTopColor: THEME.colors.borderLight,
  },
  timestamp: {
    fontSize: 11,
    color: THEME.colors.textMuted,
  },
  detailsLink: {
    fontSize: 12,
    fontWeight: '600',
    color: THEME.colors.primary,
  },
  separator: {
    height: THEME.spacing.sm,
  },
  emptyContainer: {
    padding: THEME.spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: THEME.colors.card,
    borderRadius: THEME.borderRadius.lg,
    borderWidth: 1,
    borderColor: THEME.colors.border,
    marginTop: THEME.spacing.lg,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: THEME.colors.textPrimary,
    marginBottom: 6,
  },
  emptySubtitle: {
    fontSize: 13,
    color: THEME.colors.textSecondary,
    textAlign: 'center',
    marginBottom: THEME.spacing.lg,
  },
  resetButton: {
    backgroundColor: THEME.colors.surface,
    paddingHorizontal: THEME.spacing.lg,
    paddingVertical: THEME.spacing.sm,
    borderRadius: THEME.borderRadius.md,
  },
  resetButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: THEME.colors.primary,
  },
});
`,
  },
  {
    path: 'src/screens/FormScreen.tsx',
    name: 'FormScreen.tsx',
    category: 'Screens',
    description: 'Form with TextInput, custom button, validation, and KeyboardAvoidingView layout.',
    content: `import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { THEME } from '../constants/theme';
import { useAppStore, Priority } from '../store/useAppStore';
import { CustomButton } from '../components/CustomButton';

interface FormScreenProps {
  navigation: {
    navigate: (screen: string, params?: any) => void;
  };
}

const CATEGORIES = [
  'Architecture',
  'Components',
  'State Management',
  'Performance',
  'Mobile UX',
  'Networking',
];

export const FormScreen: React.FC<FormScreenProps> = ({ navigation }) => {
  const { addItem } = useAppStore();

  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Architecture');
  const [priority, setPriority] = useState<Priority>('medium');
  const [description, setDescription] = useState('');

  const [errors, setErrors] = useState<{ title?: string; description?: string }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState(false);

  const validate = () => {
    const newErrors: { title?: string; description?: string } = {};

    if (!title.trim()) {
      newErrors.title = 'Title is required';
    } else if (title.trim().length < 3) {
      newErrors.title = 'Title must be at least 3 characters';
    }

    if (!description.trim()) {
      newErrors.description = 'Description is required';
    } else if (description.trim().length < 10) {
      newErrors.description = 'Please provide at least 10 characters for detail';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) return;

    setIsSubmitting(true);

    setTimeout(() => {
      addItem({
        title: title.trim(),
        category,
        priority,
        description: description.trim(),
      });

      setIsSubmitting(false);
      setSuccessMessage(true);

      setTitle('');
      setDescription('');

      setTimeout(() => {
        setSuccessMessage(false);
        navigation.navigate('List');
      }, 1200);
    }, 500);
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 88 : 0}
    >
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.contentContainer}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.headerBox}>
          <Text style={styles.screenTitle}>Create Mobile Record</Text>
          <Text style={styles.screenSubtitle}>
            Demonstrating React Native TextInput handling, ScrollView keyboard offset, and Zustand store dispatch.
          </Text>
        </View>

        {successMessage && (
          <View style={styles.successBanner}>
            <Text style={styles.successText}>✓ Successfully dispatched to Zustand store! Redirecting...</Text>
          </View>
        )}

        {/* Title Input */}
        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Record Title *</Text>
          <TextInput
            style={[styles.input, errors.title && styles.inputError]}
            placeholder="e.g. Implement Deep Linking with Expo Router"
            value={title}
            onChangeText={(text) => {
              setTitle(text);
              if (errors.title) setErrors((prev) => ({ ...prev, title: undefined }));
            }}
            placeholderTextColor={THEME.colors.textMuted}
          />
          {errors.title && <Text style={styles.errorText}>{errors.title}</Text>}
        </View>

        {/* Category Selector */}
        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Category</Text>
          <View style={styles.chipsContainer}>
            {CATEGORIES.map((cat) => {
              const isSelected = category === cat;
              return (
                <TouchableOpacity
                  key={cat}
                  style={[styles.chip, isSelected && styles.chipSelected]}
                  onPress={() => setCategory(cat)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.chipText, isSelected && styles.chipTextSelected]}>
                    {cat}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Priority Segmented Control */}
        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Priority Level</Text>
          <View style={styles.prioritySelector}>
            {(['low', 'medium', 'high'] as const).map((p) => {
              const isSelected = priority === p;
              return (
                <TouchableOpacity
                  key={p}
                  style={[styles.priorityTab, isSelected && styles.priorityTabSelected]}
                  onPress={() => setPriority(p)}
                >
                  <Text
                    style={[
                      styles.priorityTabText,
                      isSelected && styles.priorityTabTextSelected,
                    ]}
                  >
                    {p.toUpperCase()}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Description Multiline Input */}
        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Description *</Text>
          <TextInput
            style={[styles.textArea, errors.description && styles.inputError]}
            placeholder="Explain technical scope, acceptance criteria, or architectural decision..."
            value={description}
            onChangeText={(text) => {
              setDescription(text);
              if (errors.description) setErrors((prev) => ({ ...prev, description: undefined }));
            }}
            multiline={true}
            numberOfLines={4}
            placeholderTextColor={THEME.colors.textMuted}
          />
          {errors.description && <Text style={styles.errorText}>{errors.description}</Text>}
        </View>

        {/* Submit Button */}
        <View style={styles.buttonContainer}>
          <CustomButton
            title="Save and Dispatch Record"
            variant="primary"
            loading={isSubmitting}
            onPress={handleSubmit}
          />

          <TouchableOpacity
            style={styles.cancelButton}
            onPress={() => navigation.navigate('Dashboard')}
          >
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME.colors.background,
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    padding: THEME.spacing.md,
    paddingBottom: THEME.spacing.xxl,
  },
  headerBox: {
    marginBottom: THEME.spacing.lg,
  },
  screenTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: THEME.colors.textPrimary,
    letterSpacing: -0.3,
    marginBottom: 6,
  },
  screenSubtitle: {
    fontSize: 13,
    lineHeight: 18,
    color: THEME.colors.textSecondary,
  },
  successBanner: {
    backgroundColor: THEME.colors.successLight,
    borderColor: THEME.colors.success,
    borderWidth: 1,
    borderRadius: THEME.borderRadius.md,
    padding: THEME.spacing.md,
    marginBottom: THEME.spacing.md,
  },
  successText: {
    fontSize: 13,
    fontWeight: '600',
    color: THEME.colors.success,
  },
  fieldGroup: {
    marginBottom: THEME.spacing.lg,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: THEME.colors.textPrimary,
    marginBottom: THEME.spacing.xs,
  },
  input: {
    height: 48,
    backgroundColor: THEME.colors.card,
    borderColor: THEME.colors.border,
    borderRadius: THEME.borderRadius.md,
    paddingHorizontal: THEME.spacing.md,
    fontSize: 14,
    color: THEME.colors.textPrimary,
  },
  textArea: {
    backgroundColor: THEME.colors.card,
    borderColor: THEME.colors.border,
    borderRadius: THEME.borderRadius.md,
    padding: THEME.spacing.md,
    fontSize: 14,
    color: THEME.colors.textPrimary,
    minHeight: 100,
    textAlignVertical: 'top',
  },
  inputError: {
    borderColor: THEME.colors.danger,
  },
  errorText: {
    fontSize: 12,
    color: THEME.colors.danger,
    marginTop: 4,
  },
  chipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    backgroundColor: THEME.colors.card,
    borderWidth: 1,
    borderColor: THEME.colors.border,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: THEME.borderRadius.full,
  },
  chipSelected: {
    backgroundColor: THEME.colors.primaryLight,
    borderColor: THEME.colors.primary,
  },
  chipText: {
    fontSize: 12,
    fontWeight: '500',
    color: THEME.colors.textSecondary,
  },
  chipTextSelected: {
    color: THEME.colors.primaryDark,
    fontWeight: '700',
  },
  prioritySelector: {
    flexDirection: 'row',
    backgroundColor: THEME.colors.surface,
    padding: 3,
    borderRadius: THEME.borderRadius.md,
  },
  priorityTab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: THEME.borderRadius.sm,
  },
  priorityTabSelected: {
    backgroundColor: THEME.colors.card,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  priorityTabText: {
    fontSize: 12,
    fontWeight: '600',
    color: THEME.colors.textMuted,
  },
  priorityTabTextSelected: {
    color: THEME.colors.textPrimary,
    fontWeight: '700',
  },
  buttonContainer: {
    marginTop: THEME.spacing.md,
    gap: THEME.spacing.sm,
  },
  cancelButton: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: THEME.colors.textSecondary,
  },
});
`,
  },
  {
    path: 'src/screens/DetailScreen.tsx',
    name: 'DetailScreen.tsx',
    category: 'Screens',
    description: 'Detail screen demonstrating Native Stack parameter consumption and actions.',
    content: `import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { THEME } from '../constants/theme';
import { useAppStore } from '../store/useAppStore';
import { CustomButton } from '../components/CustomButton';

interface DetailScreenProps {
  route: {
    params: {
      id: string;
    };
  };
  navigation: {
    goBack: () => void;
    navigate: (screen: string) => void;
  };
}

export const DetailScreen: React.FC<DetailScreenProps> = ({ route, navigation }) => {
  const { items, toggleItemCompleted, deleteItem } = useAppStore();
  const itemId = route?.params?.id;
  const item = items.find((i) => i.id === itemId);

  if (!item) {
    return (
      <View style={styles.notFoundContainer}>
        <Text style={styles.notFoundTitle}>Item Not Found</Text>
        <Text style={styles.notFoundSubtitle}>
          The requested record may have been deleted or does not exist.
        </Text>
        <CustomButton
          title="Return to List"
          variant="outline"
          onPress={() => navigation.navigate('List')}
        />
      </View>
    );
  }

  const handleDelete = () => {
    deleteItem(item.id);
    navigation.goBack();
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.card}>
        <View style={styles.statusRow}>
          <View style={styles.categoryBadge}>
            <Text style={styles.categoryBadgeText}>{item.category}</Text>
          </View>

          <View
            style={[
              styles.priorityPill,
              item.priority === 'high' && styles.priorityHigh,
              item.priority === 'medium' && styles.priorityMedium,
              item.priority === 'low' && styles.priorityLow,
            ]}
          >
            <Text style={styles.priorityPillText}>
              PRIORITY: {item.priority.toUpperCase()}
            </Text>
          </View>
        </View>

        <Text style={styles.title}>{item.title}</Text>

        <View style={styles.metaRow}>
          <Text style={styles.metaLabel}>Status:</Text>
          <Text
            style={[
              styles.metaStatus,
              item.completed ? styles.statusCompleted : styles.statusPending,
            ]}
          >
            {item.completed ? 'Completed' : 'Pending Action'}
          </Text>
        </View>

        <View style={styles.metaRow}>
          <Text style={styles.metaLabel}>ID:</Text>
          <Text style={styles.metaValue}>{item.id}</Text>
        </View>

        <View style={styles.metaRow}>
          <Text style={styles.metaLabel}>Created:</Text>
          <Text style={styles.metaValue}>
            {new Date(item.createdAt).toLocaleString()}
          </Text>
        </View>

        <View style={styles.divider} />

        <Text style={styles.sectionHeader}>Description & Scope</Text>
        <Text style={styles.description}>{item.description}</Text>

        <View style={styles.actions}>
          <CustomButton
            title={item.completed ? 'Mark as Incomplete' : 'Mark as Completed'}
            variant={item.completed ? 'outline' : 'primary'}
            onPress={() => toggleItemCompleted(item.id)}
          />

          <CustomButton
            title="Delete Record"
            variant="danger"
            onPress={handleDelete}
          />
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME.colors.background,
  },
  contentContainer: {
    padding: THEME.spacing.md,
    paddingBottom: THEME.spacing.xxl,
  },
  card: {
    backgroundColor: THEME.colors.card,
    borderRadius: THEME.borderRadius.lg,
    padding: THEME.spacing.lg,
    borderWidth: 1,
    borderColor: THEME.colors.border,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: THEME.spacing.md,
  },
  categoryBadge: {
    backgroundColor: THEME.colors.surface,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: THEME.borderRadius.sm,
  },
  categoryBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: THEME.colors.textSecondary,
    textTransform: 'uppercase',
  },
  priorityPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: THEME.borderRadius.sm,
  },
  priorityHigh: {
    backgroundColor: THEME.colors.dangerLight,
  },
  priorityMedium: {
    backgroundColor: THEME.colors.warningLight,
  },
  priorityLow: {
    backgroundColor: THEME.colors.primaryLight,
  },
  priorityPillText: {
    fontSize: 10,
    fontWeight: '700',
    color: THEME.colors.textPrimary,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: THEME.colors.textPrimary,
    lineHeight: 26,
    marginBottom: THEME.spacing.md,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  metaLabel: {
    fontSize: 13,
    color: THEME.colors.textMuted,
  },
  metaValue: {
    fontSize: 13,
    color: THEME.colors.textSecondary,
    fontFamily: 'monospace',
  },
  metaStatus: {
    fontSize: 13,
    fontWeight: '600',
  },
  statusCompleted: {
    color: THEME.colors.success,
  },
  statusPending: {
    color: THEME.colors.warning,
  },
  divider: {
    height: 1,
    backgroundColor: THEME.colors.borderLight,
    marginVertical: THEME.spacing.md,
  },
  sectionHeader: {
    fontSize: 14,
    fontWeight: '600',
    color: THEME.colors.textPrimary,
    marginBottom: THEME.spacing.xs,
  },
  description: {
    fontSize: 14,
    lineHeight: 22,
    color: THEME.colors.textSecondary,
  },
  actions: {
    marginTop: THEME.spacing.md,
    gap: THEME.spacing.sm,
  },
  notFoundContainer: {
    flex: 1,
    padding: THEME.spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notFoundTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: THEME.colors.textPrimary,
    marginBottom: 8,
  },
  notFoundSubtitle: {
    fontSize: 14,
    color: THEME.colors.textSecondary,
    textAlign: 'center',
    marginBottom: THEME.spacing.lg,
  },
});
`,
  },
  {
    path: 'src/components/CustomButton.tsx',
    name: 'CustomButton.tsx',
    category: 'Components',
    description: 'Reusable touchable button with primary/secondary/outline/danger styles and loading indicator.',
    content: `import React from 'react';
import {
  TouchableOpacity,
  Text,
  ActivityIndicator,
  StyleSheet,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { THEME } from '../constants/theme';

export interface CustomButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'danger';
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  icon?: React.ReactNode;
}

export const CustomButton: React.FC<CustomButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  disabled = false,
  loading = false,
  style,
  textStyle,
  icon,
}) => {
  const buttonStyle = [
    styles.base,
    variant === 'primary' && styles.primary,
    variant === 'secondary' && styles.secondary,
    variant === 'outline' && styles.outline,
    variant === 'danger' && styles.danger,
    disabled && styles.disabled,
    style,
  ];

  const buttonTextStyle = [
    styles.text,
    variant === 'primary' && styles.textPrimary,
    variant === 'secondary' && styles.textSecondary,
    variant === 'outline' && styles.textOutline,
    variant === 'danger' && styles.textDanger,
    disabled && styles.textDisabled,
    textStyle,
  ];

  return (
    <TouchableOpacity
      style={buttonStyle}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.75}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={variant === 'outline' ? THEME.colors.primary : THEME.colors.white}
        />
      ) : (
        <>
          {icon}
          <Text style={buttonTextStyle}>{title}</Text>
        </>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  base: {
    height: 48,
    borderRadius: THEME.borderRadius.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: THEME.spacing.lg,
    gap: THEME.spacing.sm,
  },
  primary: {
    backgroundColor: THEME.colors.primary,
  },
  secondary: {
    backgroundColor: THEME.colors.secondary,
  },
  outline: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: THEME.colors.border,
  },
  danger: {
    backgroundColor: THEME.colors.danger,
  },
  disabled: {
    opacity: 0.5,
  },
  text: {
    fontSize: 15,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  textPrimary: {
    color: THEME.colors.white,
  },
  textSecondary: {
    color: THEME.colors.white,
  },
  textOutline: {
    color: THEME.colors.textPrimary,
  },
  textDanger: {
    color: THEME.colors.white,
  },
  textDisabled: {
    color: THEME.colors.textMuted,
  },
});
`,
  },
  {
    path: 'src/components/SummaryCard.tsx',
    name: 'SummaryCard.tsx',
    category: 'Components',
    description: 'Generic summary metric card built strictly with View, Text, and StyleSheet.',
    content: `import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ViewStyle } from 'react-native';
import { THEME } from '../constants/theme';

export interface SummaryCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  badge?: string;
  accentColor?: string;
  onPress?: () => void;
  style?: ViewStyle;
}

export const SummaryCard: React.FC<SummaryCardProps> = ({
  title,
  value,
  subtitle,
  badge,
  accentColor = THEME.colors.primary,
  onPress,
  style,
}) => {
  const content = (
    <View style={[styles.card, style]}>
      <View style={styles.headerRow}>
        <Text style={styles.title} numberOfLines={1}>
          {title}
        </Text>
        {badge && (
          <View style={[styles.badge, { backgroundColor: \`\${accentColor}15\` }]}>
            <Text style={[styles.badgeText, { color: accentColor }]}>{badge}</Text>
          </View>
        )}
      </View>

      <Text style={styles.value}>{value}</Text>

      {subtitle && (
        <Text style={styles.subtitle} numberOfLines={1}>
          {subtitle}
        </Text>
      )}

      <View style={[styles.accentIndicator, { backgroundColor: accentColor }]} />
    </View>
  );

  if (onPress) {
    return (
      <TouchableOpacity onPress={onPress} activeOpacity={0.7} style={styles.touchable}>
        {content}
      </TouchableOpacity>
    );
  }

  return content;
};

const styles = StyleSheet.create({
  touchable: {
    flex: 1,
  },
  card: {
    flex: 1,
    backgroundColor: THEME.colors.card,
    borderRadius: THEME.borderRadius.lg,
    padding: THEME.spacing.md,
    borderWidth: 1,
    borderColor: THEME.colors.border,
    minHeight: 105,
    justifyContent: 'space-between',
    overflow: 'hidden',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: THEME.spacing.xs,
  },
  title: {
    fontSize: 12,
    fontWeight: '500',
    color: THEME.colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  badge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: THEME.borderRadius.sm,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  value: {
    fontSize: 26,
    fontWeight: '700',
    color: THEME.colors.textPrimary,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 12,
    color: THEME.colors.textMuted,
    marginTop: 2,
  },
  accentIndicator: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 3,
  },
});
`,
  },
  {
    path: 'src/constants/theme.ts',
    name: 'theme.ts',
    category: 'Constants',
    description: 'Design tokens: palette, spacing scale, border radius, typography, and shadow presets.',
    content: `export const THEME = {
  colors: {
    primary: '#2563EB',
    primaryLight: '#DBEAFE',
    primaryDark: '#1D4ED8',
    secondary: '#0F172A',
    background: '#F8FAFC',
    card: '#FFFFFF',
    surface: '#F1F5F9',
    textPrimary: '#0F172A',
    textSecondary: '#64748B',
    textMuted: '#94A3B8',
    border: '#E2E8F0',
    borderLight: '#F1F5F9',
    success: '#16A34A',
    successLight: '#DCFCE7',
    warning: '#D97706',
    warningLight: '#FEF3C7',
    danger: '#DC2626',
    dangerLight: '#FEE2E2',
    white: '#FFFFFF',
    black: '#000000',
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 40,
  },
  borderRadius: {
    sm: 6,
    md: 10,
    lg: 16,
    xl: 24,
    full: 9999,
  },
};
`,
  },
  {
    path: 'package.json',
    name: 'package.json',
    category: 'Config',
    description: 'Expo SDK 52 package.json with React Navigation, Zustand, and TypeScript dependencies.',
    content: `{
  "name": "hadman-factor",
  "version": "1.0.0",
  "main": "index.ts",
  "scripts": {
    "start": "expo start",
    "android": "expo start --android",
    "ios": "expo start --ios",
    "web": "expo start --web"
  },
  "dependencies": {
    "expo": "~52.0.0",
    "expo-status-bar": "~2.0.0",
    "react": "18.3.1",
    "react-native": "0.76.5",
    "@react-navigation/native": "^7.0.0",
    "@react-navigation/native-stack": "^7.0.0",
    "@react-navigation/bottom-tabs": "^7.0.0",
    "react-native-screens": "~4.4.0",
    "react-native-safe-area-context": "4.12.0",
    "zustand": "^5.0.3",
    "@expo/vector-icons": "^14.0.0"
  },
  "devDependencies": {
    "@babel/core": "^7.25.0",
    "@types/react": "~18.3.12",
    "typescript": "~5.3.3"
  },
  "private": true
}
`,
  },
  {
    path: 'app.json',
    name: 'app.json',
    category: 'Config',
    description: 'Expo application configuration file with bundle identifiers and splash screen settings.',
    content: `{
  "expo": {
    "name": "Hadman Factor",
    "slug": "hadman-factor",
    "version": "1.0.0",
    "orientation": "portrait",
    "icon": "./assets/icon.png",
    "userInterfaceStyle": "light",
    "splash": {
      "image": "./assets/splash.png",
      "resizeMode": "contain",
      "backgroundColor": "#ffffff"
    },
    "ios": {
      "supportsTablet": true,
      "bundleIdentifier": "ir.hadonix.hadmanfactor"
    },
    "android": {
      "adaptiveIcon": {
        "foregroundImage": "./assets/adaptive-icon.png",
        "backgroundColor": "#ffffff"
      },
      "package": "ir.hadonix.hadmanfactor"
    }
  }
}
`,
  },
  {
    path: 'README.md',
    name: 'README.md',
    category: 'Config',
    description: 'Quick start guide, folder structure overview, and web-to-mobile migration notes.',
    content: `# Hadman Factor — React Native

A production-ready architecture designed for senior web developers migrating from React.js to React Native.

## 🚀 Quick Start

1. Initialize dependencies:
\`\`\`bash
npm install
# or
yarn install
# or
npx expo install
\`\`\`

2. Start the development server:
\`\`\`bash
npx expo start
\`\`\`

3. Press \`i\` for iOS Simulator, \`a\` for Android Emulator, or scan the QR code with the **Expo Go** app on your physical device.

---

## 📁 Recommended Folder Structure

\`\`\`text
hadman-factor/
├── app.json                     # Expo configuration
├── package.json
├── tsconfig.json
├── App.tsx                      # Root entry: SafeAreaProvider + NavigationContainer
└── src/
    ├── navigation/
    │   ├── RootNavigator.tsx         # Stack Navigator (push/modal flows)
    │   ├── BottomTabNavigator.tsx    # Bottom Tabs (Dashboard, List, Form)
    │   └── types.ts                  # Type-safe route params
    ├── screens/
    │   ├── DashboardScreen.tsx       # Summary cards with View & Text
    │   ├── ListScreen.tsx            # Virtualized FlatList + filters
    │   ├── FormScreen.tsx            # TextInput + KeyboardAvoidingView
    │   └── DetailScreen.tsx          # Stack parameter destination
    ├── components/
    │   ├── CustomButton.tsx          # Reusable TouchableOpacity button
    │   └── SummaryCard.tsx           # Generic metric card
    ├── store/
    │   └── useAppStore.ts            # Zustand global store & computed selectors
    ├── constants/
    │   └── theme.ts                  # Design tokens (colors, spacing, radii)
    └── utils/
        └── helpers.ts                # Formatters & validators
\`\`\`

---

## ⚡ React Web vs React Native Migration Rules

| React Web Concept | React Native Equivalent | Why |
| :--- | :--- | :--- |
| \`<div>\` | \`<View>\` | No DOM in Native. Flexbox defaults to \`column\`. |
| \`<p>\`, \`<h1>\`, \`<span>\` | \`<Text>\` | Text MUST be wrapped in \`<Text>\`. Strings cannot exist raw in \`<View>\`. |
| \`<button>\`, \`<a href>\` | \`<TouchableOpacity>\` or \`<Pressable>\` | Native touch gestures and opacity/ripple feedback. |
| \`<input type="text">\` | \`<TextInput>\` | Uses \`onChangeText\` (receives string) instead of \`e.target.value\`. |
| \`<ul>\` / \`items.map(...)\` | \`<FlatList>\` | Virtualized windowing prevents out-of-memory crashes on mobile. |
| CSS Classes / Tailwind | \`StyleSheet.create({ ... })\` | CSS is not supported. Styles are parsed into native view layout objects. |
| React Router | React Navigation | Mobile uses a card stack & bottom tab stack, not browser URL history. |
| \`window.localStorage\` | \`@react-native-async-storage/async-storage\` | Storage is asynchronous on native devices. |
`,
  },
];
