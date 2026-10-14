import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  View,
  TouchableOpacity,
  Modal,
  Animated,
  ScrollView,
  StyleSheet,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import Header from '../components/Header';
import CustomText from '../components/CustomText';
import CustomTextInput from '../components/CustomTextInput';
import { toPersianDigits, formatNumber, getCurrentPersianDate } from '../utils/invoiceHelpers';
import { Customer } from '../storage/customerStorage';

type CustomerStatementScreenProps = {
  customer: Customer;
  payments?: any[];
  invoices?: any[];
  onBack: () => void;
  onNavigate?: (screen: string) => void;
  onSaveSettlement?: (settlement: any) => Promise<void> | void;
};

export default function CustomerStatementScreen({
  customer,
  payments = [],
  invoices = [],
  onBack,
  onNavigate,
  onSaveSettlement = async () => {},
}: CustomerStatementScreenProps) {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [tempStartDate, setTempStartDate] = useState('');
  const [tempEndDate, setTempEndDate] = useState('');
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');
  const [expandedItems, setExpandedItems] = useState<{ [key: string]: boolean }>({});
  const [showDateModal, setShowDateModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState<'share' | 'save' | null>(null);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const statementActionsAnim = useRef(new Animated.Value(-120)).current;

  useEffect(() => {
    statementActionsAnim.setValue(-120);
    const animation = Animated.timing(statementActionsAnim, {
      toValue: 0,
      duration: 300,
      delay: 80,
      useNativeDriver: true,
    });
    animation.start();

    return () => animation.stop();
  }, [statementActionsAnim]);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 2500);
  };

  const custPayments = useMemo(
    () => payments.filter((p) => String(p.customerId) === String(customer?.id)),
    [payments, customer?.id]
  );

  const custInvoices = useMemo(
    () => invoices.filter((inv) => String(inv.customerId) === String(customer?.id)),
    [invoices, customer?.id]
  );

  const { statementTransactions, startBalance, endBalance, isFiltered } = useMemo(() => {
    const pItems = custPayments.map((p) => ({
      id: `p-${p.id}`,
      originalId: p.id,
      kind: 'payment',
      type: `دریافتی (${p.method || 'نقدی'})`,
      method: p.method || 'نقدی',
      date: p.date || '',
      rawDate: p.createdAt || p.date || '',
      amount: Number(p.amount || 0),
    }));

    const iItems = custInvoices
      .filter((inv) => inv.type !== 'پیش فاکتور')
      .map((inv) => {
        let parsedItems = inv.items;
        if (typeof inv.items === 'string') {
          try {
            parsedItems = JSON.parse(inv.items);
          } catch (e) {
            parsedItems = [];
          }
        }
        return {
          id: `i-${inv.id}`,
          originalId: inv.id,
          kind: 'invoice',
          type: inv.type || 'فاکتور',
          number: inv.number,
          date: inv.date || '',
          rawDate: inv.createdAt || inv.date || '',
          amount: Number(inv.amount || 0),
          items: parsedItems || [],
        };
      });

    const padDate = (d: string) => {
      if (!d) return '';
      const parts = d.split('/');
      if (parts.length === 3) {
        return `${parts[0]}/${parts[1].padStart(2, '0')}/${parts[2].padStart(2, '0')}`;
      }
      return d;
    };

    const allChronological = [...pItems, ...iItems].sort((a, b) => {
      const aDate = padDate(a.date);
      const bDate = padDate(b.date);
      if (aDate && bDate && aDate !== bDate) return aDate.localeCompare(bDate);
      return (a.rawDate || '').localeCompare(b.rawDate || '');
    });

    const processed = allChronological.reduce((acc: any[], item: any) => {
      const lastBal = acc.length > 0 ? acc[acc.length - 1].balanceAfter : 0;
      let newBal = lastBal;
      if (item.kind === 'invoice') newBal += item.amount;
      else if (item.kind === 'payment') newBal -= item.amount;
      acc.push({ ...item, balanceAfter: newBal });
      return acc;
    }, []);

    let filtered = processed;
    let sBalance = 0;
    const hasFilter = !!(startDate || endDate);

    if (hasFilter) {
      if (startDate) {
        const beforeStart = processed.filter((item) => item.date < startDate);
        sBalance = beforeStart.length > 0 ? beforeStart[beforeStart.length - 1].balanceAfter : 0;
      }
      filtered = processed.filter((item) => {
        if (startDate && item.date < startDate) return false;
        if (endDate && item.date > endDate) return false;
        return true;
      });
    }

    const eBalance = filtered.length > 0 ? filtered[filtered.length - 1].balanceAfter : sBalance;

    if (sortOrder === 'desc') {
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
        if (t.kind === 'invoice') all[t.id] = true;
      });
      setExpandedItems(all);
    }
  };

  const handleRegisterSettlement = () => {
    Alert.alert('ثبت تسویه حساب', 'آیا از ثبت تسویه حساب تا این تاریخ اطمینان دارید؟', [
      { text: 'انصراف', style: 'cancel' },
      {
        text: 'بله، ثبت شود',
        onPress: async () => {
          const currentBalance = endBalance;
          if (currentBalance === 0) {
            Alert.alert('اطلاع', 'حساب در حال حاضر صفر است و نیازی به تسویه ندارد.');
            return;
          }
          const settlementPayment = {
            customerId: customer.id,
            date: getCurrentPersianDate(),
            amount: currentBalance,
            method: 'تسویه حساب',
            note: 'تسویه حساب سیستمی',
            createdAt: new Date().toISOString(),
          };
          await onSaveSettlement(settlementPayment);
          showToast('تسویه حساب با موفقیت ثبت شد.');
        },
      },
    ]);
  };

  const handleExport = (type: 'png' | 'pdf') => {
    setShowExportModal(null);
    showToast(type === 'pdf' ? 'فایل PDF آماده شد.' : 'تصویر خروجی آماده شد.');
  };

  return (
    <View style={styles.container}>
      <Header title={customer?.name} subtitle="صورت حساب" onBack={onBack} iconName="arrow-back" />

      {/* Action Filter Bar */}
      <View style={styles.filterBar}>
        <View style={styles.tabsRow}>
          <TouchableOpacity
            style={[styles.tabBtn, (startDate || endDate) && styles.tabBtnActive]}
            onPress={() => {
              setTempStartDate(startDate || getCurrentPersianDate());
              setTempEndDate(endDate || getCurrentPersianDate());
              setShowDateModal(true);
            }}
          >
            <Ionicons name="calendar-outline" size={16} color="#ffffff" />
            <CustomText style={styles.tabBtnText}>تاریخ</CustomText>
          </TouchableOpacity>

          <TouchableOpacity style={styles.tabBtn} onPress={toggleAllExpanded}>
            <Ionicons
              name={isAnyExpanded ? 'chevron-up' : 'chevron-down'}
              size={16}
              color="#ffffff"
            />
          </TouchableOpacity>

          <TouchableOpacity style={[styles.tabBtn, styles.settlementBtn]} onPress={handleRegisterSettlement}>
            <CustomText style={styles.tabBtnText}>ثبت تسویه حساب</CustomText>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={styles.sortBtn}
          onPress={() => setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc')}
        >
          <Ionicons name="swap-vertical" size={18} color="#ffffff" />
        </TouchableOpacity>
      </View>

      {/* Main Statement Content View */}
      <ScrollView style={styles.statementCardWrapper} contentContainerStyle={styles.statementCardContent}>
        <View style={styles.statementCard}>
          <View style={styles.cardHeader}>
            <CustomText style={styles.cardTitle}>صورت حساب {customer?.name}</CustomText>
            {isFiltered && (
              <CustomText style={styles.cardSubtitle}>
                {startDate ? `از: ${toPersianDigits(startDate)} ` : ''}
                {endDate ? `تا: ${toPersianDigits(endDate)}` : ''}
              </CustomText>
            )}
          </View>

          {/* Table */}
          <View style={styles.table}>
            {/* Header Row */}
            <View style={styles.tableHeader}>
              <CustomText style={[styles.th, { flex: 1.2 }]}>تاریخ</CustomText>
              <CustomText style={[styles.th, { flex: 2.2 }]}>شرح</CustomText>
              <CustomText style={[styles.th, { flex: 1.5, textAlign: 'right' }]}>بدهکار</CustomText>
              <CustomText style={[styles.th, { flex: 1.5, textAlign: 'right' }]}>بستانکار</CustomText>
              <CustomText style={[styles.th, { flex: 1.6, textAlign: 'right' }]}>مانده</CustomText>
            </View>

            {/* Start Balance Row */}
            {isFiltered && startBalance !== 0 && (
              <View style={[styles.tableRow, styles.startBalanceRow]}>
                <CustomText style={[styles.td, { flex: 1.2 }]}>-</CustomText>
                <CustomText style={[styles.td, { flex: 2.2 }]}>مانده از قبل</CustomText>
                <CustomText style={[styles.td, { flex: 1.5 }]}></CustomText>
                <CustomText style={[styles.td, { flex: 1.5 }]}></CustomText>
                <CustomText
                  style={[
                    styles.td,
                    { flex: 1.6, textAlign: 'right' },
                    startBalance > 0 ? styles.textDebt : styles.textCredit,
                  ]}
                >
                  {toPersianDigits(formatNumber(Math.abs(startBalance)))}
                </CustomText>
              </View>
            )}

            {/* Transaction Rows */}
            {statementTransactions.map((item: any) => (
              <React.Fragment key={item.id}>
                <TouchableOpacity
                  activeOpacity={item.kind === 'invoice' ? 0.7 : 1}
                  style={[
                    styles.tableRow,
                    item.method === 'تسویه حساب' && styles.settlementRow,
                  ]}
                  onPress={item.kind === 'invoice' ? () => toggleExpand(item.id) : undefined}
                >
                  <CustomText style={[styles.td, { flex: 1.2 }]}>{toPersianDigits(item.date)}</CustomText>
                  <CustomText style={[styles.td, { flex: 2.2 }]}>
                    {item.kind === 'invoice' ? (
                      <CustomText style={styles.invoiceLink}>
                        فاکتور فروش {toPersianDigits(item.number)}
                      </CustomText>
                    ) : (
                      <CustomText style={styles.textCredit}>دریافتی ({item.method})</CustomText>
                    )}
                  </CustomText>

                  <CustomText style={[styles.td, { flex: 1.5, textAlign: 'right' }]}>
                    {item.kind === 'invoice' ? toPersianDigits(formatNumber(item.amount)) : ''}
                  </CustomText>

                  <CustomText style={[styles.td, { flex: 1.5, textAlign: 'right' }]}>
                    {item.kind === 'payment' ? toPersianDigits(formatNumber(item.amount)) : ''}
                  </CustomText>

                  <CustomText
                    style={[
                      styles.td,
                      { flex: 1.6, textAlign: 'right' },
                      item.balanceAfter > 0 ? styles.textDebt : item.balanceAfter < 0 ? styles.textCredit : {},
                    ]}
                  >
                    {item.balanceAfter !== 0 ? toPersianDigits(formatNumber(Math.abs(item.balanceAfter))) : '۰'}
                  </CustomText>
                </TouchableOpacity>

                {/* Expanded Invoice Items */}
                {item.kind === 'invoice' && expandedItems[item.id] && item.items?.length > 0 && (
                  <View style={styles.expandedItemsBox}>
                    <View style={styles.expandedHeader}>
                      <CustomText style={[styles.expTh, { flex: 2 }]}>نام کالا</CustomText>
                      <CustomText style={[styles.expTh, { flex: 1, textAlign: 'center' }]}>تعداد</CustomText>
                      <CustomText style={[styles.expTh, { flex: 1.2, textAlign: 'left' }]}>فی</CustomText>
                      <CustomText style={[styles.expTh, { flex: 1.3, textAlign: 'left' }]}>جمع</CustomText>
                    </View>

                    {item.items.map((it: any, idx: number) => (
                      <View key={idx} style={styles.expandedRow}>
                        <CustomText style={[styles.expTd, { flex: 2 }]}>
                          {toPersianDigits(it.desc || it)}
                        </CustomText>
                        <CustomText style={[styles.expTd, { flex: 1, textAlign: 'center' }]}>
                          {toPersianDigits(it.quantity || '1')}
                        </CustomText>
                        <CustomText style={[styles.expTd, { flex: 1.2, textAlign: 'left' }]}>
                          {toPersianDigits(formatNumber(it.unitPrice || 0))}
                        </CustomText>
                        <CustomText style={[styles.expTd, { flex: 1.3, textAlign: 'left' }]}>
                          {toPersianDigits(
                            formatNumber(Number(it.quantity || 1) * Number(it.unitPrice || 0))
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
              <CustomText style={[styles.td, styles.finalBalanceLabel, { flex: 3.4 }]}>
                مانده نهایی:
              </CustomText>
              <CustomText
                style={[
                  styles.td,
                  { flex: 3.1, textAlign: 'right'},
                  endBalance > 0 ? styles.textDebt : endBalance < 0 ? styles.textCredit : {},
                ]}
              >
                {endBalance !== 0 ? toPersianDigits(formatNumber(Math.abs(endBalance))) : '۰'}
              </CustomText>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Floating Bottom Actions (Share & Save) */}
      <View style={styles.bottomBar}>
        <Animated.View
          style={[
            styles.statementActionButtons,
            { transform: [{ translateX: statementActionsAnim }] },
          ]}
        >
          <LinearGradient colors={['#3282b8', '#0f4c75']} style={styles.statementCircleBtn}>
            <TouchableOpacity
              style={styles.statementCircleTouch}
              onPress={() => setShowExportModal('share')}
            >
              <Ionicons name="share-social-outline" size={24} color="#ffffff" />
            </TouchableOpacity>
          </LinearGradient>
          <LinearGradient colors={['#3282b8', '#0f4c75']} style={styles.statementCircleBtn}>
            <TouchableOpacity
              style={styles.statementCircleTouch}
              onPress={() => setShowExportModal('save')}
            >
              <Ionicons name="download-outline" size={24} color="#ffffff" />
            </TouchableOpacity>
          </LinearGradient>
        </Animated.View>
      </View>

      {/* Export Options Modal */}
      <Modal visible={!!showExportModal} transparent animationType="fade">
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setShowExportModal(null)}>
          <View style={styles.exportMenu}>
            <TouchableOpacity style={styles.exportOption} onPress={() => handleExport('png')}>
              <CustomText style={styles.exportText}>تصویر (PNG)</CustomText>
            </TouchableOpacity>
            <View style={styles.exportDivider} />
            <TouchableOpacity style={styles.exportOption} onPress={() => handleExport('pdf')}>
              <CustomText style={styles.exportText}>فایل (PDF)</CustomText>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Date Filter Modal */}
      <Modal visible={showDateModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <LinearGradient colors={['#0d2b43', '#0f4c75']} style={styles.dateModalBox}>
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
                    setTempStartDate('');
                    setTempEndDate('');
                  }}
                >
                  <CustomText style={styles.secondaryBtnText}>حذف فیلتر</CustomText>
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#eaf6fc',
  },
  filterBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#3282b8',
    marginHorizontal: 15,
    marginTop: 10,
    marginBottom: 5,
    padding: 6,
    borderRadius: 12,
  },
  tabsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  tabBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  tabBtnActive: {
    backgroundColor: '#0f4c75',
  },
  tabBtnText: {
    color: '#ffffff',
    fontSize: 12,
  },
  settlementBtn: {
    backgroundColor: '#10b981',
  },
  sortBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  statementCardWrapper: {
    flex: 1,
    paddingHorizontal: 10,
  },
  statementCardContent: {
    paddingBottom: 90,
  },
  statementCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#0f4c75',
    overflow: 'hidden',
    marginTop: 10,
  },
  cardHeader: {
    backgroundColor: '#0f4c75',
    padding: 12,
    alignItems: 'center',
  },
  cardTitle: {
    color: '#ffffff',
    fontSize: 15,
    
  },
  cardSubtitle: {
    color: '#cbd5e1',
    fontSize: 11,
    marginTop: 4,
  },
  table: {
    width: '100%',
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#f1f5f9',
    borderBottomWidth: 1.5,
    borderColor: '#cbd5e1',
    paddingVertical: 8,
    paddingHorizontal: 6,
  },
  th: {
    fontSize: 11,

    color: '#334155',
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderColor: '#e2e8f0',
    paddingVertical: 8,
    paddingHorizontal: 6,
    alignItems: 'center',
  },
  startBalanceRow: {
    backgroundColor: '#fffbeb',
  },
  settlementRow: {
    backgroundColor: '#d1fae5',
  },
  finalBalanceRow: {
    backgroundColor: '#dbeafe',
    borderTopWidth: 2,
    borderColor: '#bfdbfe',
  },
  td: {
    fontSize: 11,
    color: '#334155',
  },
  invoiceLink: {
    color: '#2563eb',

    fontSize: 11,
  },
  textDebt: { color: '#d32f2f' },
  textCredit: { color: '#2e7d32' },
  expandedItemsBox: {
    backgroundColor: '#f8fafc',
    paddingHorizontal: 15,
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderColor: '#e2e8f0',
  },
  expandedHeader: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderColor: '#cbd5e1',
    paddingBottom: 4,
  },
  expTh: { fontSize: 10, color: '#64748b'},
  expandedRow: {
    flexDirection: 'row',
    paddingVertical: 3,
    borderBottomWidth: 0.5,
    borderColor: '#e2e8f0',
  },
  expTd: { fontSize: 10, color: '#334155' },
  finalBalanceLabel: {

    color: '#1e3a8a',
  },
  bottomBar: {
    position: 'absolute',
    bottom: 25,
    left: 0,
    right: 0,
    alignItems: 'flex-start',
    paddingHorizontal: 16,
  },
  statementActionButtons: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: 8,
  },
  statementCircleBtn: {
    width: 44,
    height: 44,
    borderWidth: 2,
    borderColor: '#ffffff',
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    elevation: 8,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.28,
    shadowRadius: 5,
  },
  statementCircleTouch: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  bottomActionsCard: {
    flexDirection: 'row',
    gap: 12,
    backgroundColor: '#ffffff',
    borderRadius: 30,
    padding: 6,
    borderWidth: 2,
    borderColor: '#3282b8',
    elevation: 8,
  },
  actionCircleBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#0f4c75',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.65)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  exportMenu: {
    backgroundColor: '#0f4c75',
    borderRadius: 12,
    padding: 6,
    minWidth: 150,
  },
  exportOption: {
    paddingVertical: 10,
    alignItems: 'center',
  },
  exportText: { color: '#ffffff', fontSize: 14 },
  exportDivider: { height: 1, backgroundColor: 'rgba(255,255,255,0.1)' },
  dateModalBox: {
    width: '85%',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#2e557c',
  },
  modalTitle: { color: '#ffffff', fontSize: 16, marginBottom: 15, textAlign: 'center' },
  inputLabel: { color: '#cbd5e1', fontSize: 12, marginBottom: 4 },
  modalInput: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 8,
    paddingHorizontal: 10,
    height: 42,
    color: '#ffffff',
    fontSize: 13,
    marginBottom: 10,
    textAlign: 'right',
  },
  modalActions: { flexDirection: 'row', gap: 10, marginTop: 15 },
  modalBtn: { flex: 1, height: 40, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  primaryBtn: { backgroundColor: '#10b981' },
  primaryBtnText: { color: '#ffffff', fontSize: 13 },
  secondaryBtn: { backgroundColor: 'rgba(255,255,255,0.1)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)' },
  secondaryBtnText: { color: '#ffffff', fontSize: 13 },
  toast: {
    position: 'absolute',
    bottom: 80,
    alignSelf: 'center',
    backgroundColor: 'rgba(15, 76, 117, 0.95)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    elevation: 10,
  },
  toastText: { color: '#ffffff', fontSize: 12 },
});