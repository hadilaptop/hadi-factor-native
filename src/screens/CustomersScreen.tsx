import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  View,
  Image,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  ScrollView,
  Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import Header from '../components/Header';
import { toPersianDigits } from '../utils/numberUtils';
import CustomText from '../components/CustomText';
import CustomTextInput from '../components/CustomTextInput';
import { Customer } from '../storage/customerStorage';
import ExportAlertModal from '../components/ExportAlertModal';
import ActionDropdown from '../components/ActionDropdown';

type CustomersScreenProps = {
  onNavigate?: (screen: string) => void;
  customers?: Customer[];
  onDeleteCustomer?: (id: string | number) => void;
  onEditCustomer?: (customer: Customer) => void;
  onSelectCustomerLedger?: (customer: Customer) => void;
};

const { width: screenWidth } = Dimensions.get('window');

const customerGradientPalettes: { colors: [string, string]; start: { x: number; y: number }; end: { x: number; y: number } }[] = [
  { colors: ['#1c629c', '#2d78a9'], start: { x: 0, y: 0 }, end: { x: 1, y: 1 } },
  { colors: ['#1f6491', '#1c629c'], start: { x: 0, y: 0 }, end: { x: 0, y: 1 } },
  { colors: ['#2674af', '#1b5c87'], start: { x: 1, y: 0 }, end: { x: 0, y: 1 } },
  { colors: ['#286d9c', '#236da5'], start: { x: 0, y: 1 }, end: { x: 1, y: 0 } },
  { colors: ['#246b9f', '#28638a'], start: { x: 1, y: 0 }, end: { x: 0, y: 0 } },
  { colors: ['#155d8e', '#2975ac'], start: { x: 0, y: 0 }, end: { x: 1, y: 0 } },
];

export default function CustomersScreen({
  onNavigate = (screen: string) => {},
  customers = [],
  onDeleteCustomer = (id: string | number) => {},
  onEditCustomer = (customer: Customer) => {},
  onSelectCustomerLedger = (customer: Customer) => {},
}: CustomersScreenProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeDropdown, setActiveDropdown] = useState<string | number | null>(
    null
  );
  const [deleteModalData, setDeleteModalData] = useState<Customer | null>(null);
  const actionButtonRefs = useRef<Record<string, React.ComponentRef<typeof TouchableOpacity> | null>>({});
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 8 });
  const screenSlideAnim = useRef(new Animated.Value(screenWidth)).current;

  const filteredCustomers = useMemo(() => {
    if (!searchQuery.trim()) return customers;

    const query = searchQuery.trim().toLowerCase();

    return customers.filter(
      (c) =>
        (c.name && c.name.toLowerCase().includes(query)) ||
        (c.phone && c.phone.includes(query))
    );
  }, [customers, searchQuery]);

  useEffect(() => {
    Animated.timing(screenSlideAnim, {
      toValue: 0,
      duration: 250,
      useNativeDriver: true,
    }).start();
  }, [screenSlideAnim]);

  useEffect(() => {
    console.log('[CUSTOMER DEBUG][CustomersScreen]', customers.length, filteredCustomers.length, customers.map((item) => item.id));
  }, [customers, filteredCustomers]);

  const handleClose = () => {
    onNavigate('dashboard');
  };

  const confirmDelete = () => {
    if (deleteModalData) {
      onDeleteCustomer(deleteModalData.id);
    }

    setDeleteModalData(null);
  };

  return (
    <View style={styles.overlay}>
      <Header
        title=" مدیریت مشتریان"
        onBack={handleClose}
        iconName="arrow-back"
      />
      <Animated.View
        style={[
          styles.animatedContent,
          { transform: [{ translateX: screenSlideAnim }] },
        ]}
      >
        <View style={styles.searchContainer}>
          <View style={styles.searchWrapper}>
            {searchQuery.length > 0 ? (
              <TouchableOpacity
                onPress={() => setSearchQuery('')}
                style={styles.iconWrapper}
              >
                <View style={styles.clearBtn}>
                  <Ionicons name="close" size={16} color="#1f5579" />
                </View>
              </TouchableOpacity>
            ) : (
              <View style={styles.iconWrapper}>
                <Ionicons name="search" size={20} color="#1f5579" />
              </View>
            )}
            <CustomTextInput
              style={styles.searchInput}
              placeholder="جستجوی نام یا شماره مشتری..."
              placeholderTextColor="#8da4b5"
              value={searchQuery}
              onChangeText={setSearchQuery}
              disableFocusStyle={true}
            />
          </View>
        </View>

        <ScrollView
          style={styles.customerList}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {filteredCustomers.map((customer, index) => (
            <View key={String(customer.id)} style={styles.customerCardWrapper}>
              <TouchableOpacity
                activeOpacity={0.9}
                style={styles.customerCard}
                onPress={() => {
                  if (activeDropdown !== null) {
                    setActiveDropdown(null);
                    return;
                  }
                  onSelectCustomerLedger(customer);
                }}
              >
                <LinearGradient
                  colors={customerGradientPalettes[index % customerGradientPalettes.length].colors}
                  start={customerGradientPalettes[index % customerGradientPalettes.length].start}
                  end={customerGradientPalettes[index % customerGradientPalettes.length].end}
                  style={styles.cardGradient}
                >
                  <View style={styles.avatar}>
                    {customer.avatar ? (
                      <Image source={{ uri: customer.avatar }} style={styles.avatarImage} />
                    ) : (
                      <Ionicons name="person" size={20} color="#b3d4e6" />
                    )}
                  </View>
                  <View style={styles.info}>
                    <CustomText style={styles.name}>{customer.name || 'بدون نام'}</CustomText>
                    <CustomText style={styles.code}>
                      کد مشتری: {toPersianDigits(customer.customerCode ?? customer.id)}
                    </CustomText>
                  </View>
                  <TouchableOpacity
                    style={[
                      styles.actionBtn,
                      activeDropdown === customer.id && styles.actionBtnActive,
                    ]}
                    ref={(node) => { actionButtonRefs.current[String(customer.id)] = node; }}
                    onPress={(e) => {
                      e.stopPropagation();
                      if (activeDropdown === customer.id) {
                        setActiveDropdown(null);
                        return;
                      }
                      actionButtonRefs.current[String(customer.id)]?.measureInWindow((x, y, width, height) => {
                        setDropdownPosition({ top: y + height, left: Math.max(75, x - 128) });
                        setActiveDropdown(customer.id);
                      });
                    }}
                  >
                    <Ionicons name="ellipsis-vertical" size={25} color="#ffffffe1" />
                  </TouchableOpacity>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          ))}
          {filteredCustomers.length === 0 && (
            <CustomText style={styles.emptyText}>
              {searchQuery.trim()
                ? 'مشتری با این مشخصات یافت نشد.'
                : 'هنوز مشتری ثبت نشده است.'}
            </CustomText>
          )}
        </ScrollView>
      </Animated.View>

      <ActionDropdown
        visible={activeDropdown !== null}
        position={dropdownPosition}
        onClose={() => setActiveDropdown(null)}
        menuStyle={styles.dropdownMenu}
      >
        {activeDropdown !== null && (() => {
          const customer = customers.find((item) => String(item.id) === String(activeDropdown));
          if (!customer) return null;
          return (
            <>
              <TouchableOpacity style={styles.dropdownItem} onPress={() => { setActiveDropdown(null); onEditCustomer(customer); }}>
                <Ionicons name="create-outline" size={20} color="#ffffff" />
                <CustomText style={styles.dropdownText}>ویرایش مشخصات</CustomText>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.dropdownItem, { borderBottomWidth: 0 }]} onPress={() => { setActiveDropdown(null); setDeleteModalData(customer); }}>
                <Ionicons name="trash-outline" size={20} color="#ff5c5c" />
                <CustomText style={[styles.dropdownText, { color: '#ff5c5c' }]}>حذف مشتری</CustomText>
              </TouchableOpacity>
            </>
          );
        })()}
      </ActionDropdown>

      <ExportAlertModal
        visible={!!deleteModalData}
        title="آیا از حذف مطمئن هستید؟"
        message="اطلاعات این مشتری حذف خواهد شد و این عملیات قابل بازگشت نیست."
        titleFontSize={14}
        confirm
        confirmText="بله حذف شود"
        cancelText="انصراف"
        onConfirm={confirmDelete}
        onClose={() => setDeleteModalData(null)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: '#eaf6fc',
  },
  animatedContent: {
    flex: 1,
  },
  searchContainer: {
    paddingHorizontal: 20,
    marginTop: 15,
    marginBottom: 10,
  },
  searchWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 15,
    borderWidth: 2,
    borderColor: '#b3d4e6',
    paddingHorizontal: 15,
    height: 50,
    shadowColor: '#2170b1',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
  },
  iconWrapper: {
    width: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#2170b1',
    textAlign: 'right',
  },
  clearBtn: {
    width: 26,
    height: 26,
    backgroundColor: '#eaf6fc',
    borderRadius: 13,
    justifyContent: 'center',
    alignItems: 'center',
  },
  customerList: {
    flex: 1,
  },
  listContainer: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 400,
  },
  customerCardWrapper: {
    position: 'relative',
    marginBottom: 12,
  },
  customerCard: {
    width: '100%',
    shadowColor: '#3b5998',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 5,
    borderRadius: 15,
  },
  cardGradient: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 15,
  },
  avatar: {
    width: 40,
    height: 40,
    backgroundColor: '#f8f9fa',
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 15,
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: 20,
  },
  info: {
    flex: 1,
    justifyContent: 'center',
  },
  name: {
    fontSize: 16,
    color: '#ffffff',
    marginBottom: 4,
    textAlign: 'right',
  },
  code: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'right',
  },
  actionBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionBtnActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
  },
  dropdownMenu: {
    position: 'absolute',
    backgroundColor: '#1f5579',
    borderWidth: 1,
    borderColor: '#e2e5e8',
    borderRadius: 10,
    minWidth: 160,
    zIndex: 1000,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#778ca1',
  },
  dropdownText: {
    color: '#ffffff',
    fontSize: 14,
    marginLeft: 10,
  },
  emptyText: {
    textAlign: 'center',
    color: '#1f5579',
    fontSize: 16,
    marginTop: 40,
  },
});