import React, { useState, useMemo, useRef } from 'react';
import {
  View,
  Image,
  StyleSheet,
  TouchableOpacity,
    Pressable,
Modal,
  Animated,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import AnimatedScrollWrapper, {
  AnimatedScrollWrapperRef,
} from '../components/AnimatedScrollWrapper';
import Header from '../components/Header';
import { toPersianDigits } from '../utils/numberUtils';
import CustomText from '../components/CustomText';
import CustomTextInput from '../components/CustomTextInput';
import { Customer } from '../storage/customerStorage';

type CustomersScreenProps = {
  onNavigate?: (screen: string) => void;
  customers?: Customer[];
  onDeleteCustomer?: (id: string | number) => void;
  onEditCustomer?: (customer: Customer) => void;
  onSelectCustomerLedger?: (customer: Customer) => void;
};

export default function CustomersScreen({
  onNavigate = (screen: string) => {},
  customers = [],
  onDeleteCustomer = (id: string | number) => {},
  onEditCustomer = (customer: Customer) => {},
  onSelectCustomerLedger = (customer: Customer) => {},
}: CustomersScreenProps) {
  const searchRef = useRef<AnimatedScrollWrapperRef>(null);
  const scrollRef = useRef<AnimatedScrollWrapperRef>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [activeDropdown, setActiveDropdown] = useState<string | number | null>(
    null
  );
  const [deleteModalData, setDeleteModalData] = useState<Customer | null>(null);
  const actionButtonRefs = useRef<Record<string, View | null>>({});
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 8 });

  const filteredCustomers = useMemo(() => {
    if (!searchQuery.trim()) return customers;

    const query = searchQuery.trim().toLowerCase();

    return customers.filter(
      (c) =>
        (c.name && c.name.toLowerCase().includes(query)) ||
        (c.phone && c.phone.includes(query))
    );
  }, [customers, searchQuery]);

  const slideAnim = useRef(
    new Animated.Value(Dimensions.get('window').width)
  ).current;

  const handleClose = () => {
    searchRef.current?.close();
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
      <AnimatedScrollWrapper
        ref={searchRef}
        style={[
          styles.searchContainer,
          {
            transform: [{ translateX: slideAnim }],
          },
        ]}
      >
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
      </AnimatedScrollWrapper>

<AnimatedScrollWrapper
        ref={scrollRef}
        style={{
          flex: 1,
          transform: [{ translateX: slideAnim }],
        }}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
      >
        {filteredCustomers.length > 0 ? (
          filteredCustomers.map((customer, index) => (
            <View key={customer.id} style={[styles.customerCardWrapper, activeDropdown === customer.id && styles.customerCardWrapperActive]}>
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
                  colors={['#22628e', '#2f77a7']}
                  start={index % 3 === 0 ? { x: 0, y: 0 } : index % 3 === 1 ? { x: 1, y: 0 } : { x: 0, y: 1 }}
                  end={index % 3 === 0 ? { x: 1, y: 1 } : index % 3 === 1 ? { x: 0, y: 1 } : { x: 1, y: 0 }}
                  style={styles.cardGradient}
                >
                  <View style={styles.avatar}>
                    {customer.avatar ? (
                      <Image
                        source={{ uri: customer.avatar }}
                        style={styles.avatarImage}
                      />
                    ) : (
                      <Ionicons name="person" size={20} color="#b3d4e6" />
                    )}
                  </View>

                  <View style={styles.info}>
                    <CustomText style={styles.name}>
                      {customer.name}
                    </CustomText>
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
                    <Ionicons
                      name="ellipsis-vertical"
                      size={25}
                      color="#ffffffe1"
                    />
                  </TouchableOpacity>
                </LinearGradient>
              </TouchableOpacity>
</View>
          ))
        ) : (
          <CustomText style={styles.emptyText}>
            {searchQuery.trim()
              ? ' مشتری با این مشخصات یافت نشد. '
              : 'هنوز مشتری ثبت نشده است.'}
          </CustomText>
        )}
      </AnimatedScrollWrapper>

      <Modal
        visible={activeDropdown !== null}
        transparent={true}
        statusBarTranslucent={true}
        animationType="none"
        onRequestClose={() => setActiveDropdown(null)}
      >
        <View style={styles.dropdownModalOverlay}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setActiveDropdown(null)} />
          {activeDropdown !== null && (() => {
            const customer = customers.find((item) => String(item.id) === String(activeDropdown));
            if (!customer) return null;
            return (
              <View style={[styles.dropdownMenu, dropdownPosition]}>
                <TouchableOpacity style={styles.dropdownItem} onPress={() => { setActiveDropdown(null); onEditCustomer(customer); }}>
                  <Ionicons name="create-outline" size={20} color="#ffffff" />
                  <CustomText style={styles.dropdownText}>ویرایش مشخصات</CustomText>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.dropdownItem, { borderBottomWidth: 0 }]} onPress={() => { setActiveDropdown(null); setDeleteModalData(customer); }}>
                  <Ionicons name="trash-outline" size={20} color="#ff5c5c" />
                  <CustomText style={[styles.dropdownText, { color: '#ff5c5c' }]}>حذف مشتری</CustomText>
                </TouchableOpacity>
              </View>
            );
          })()}
        </View>
      </Modal>

      <Modal
        visible={!!deleteModalData}
        transparent={true}
        animationType="fade"
      >
        <View style={styles.modalOverlay}>
          <LinearGradient
            colors={['#0d2b43', '#1f5579']}
            style={styles.modalBox}
          >
            <View style={styles.modalIconBg}>
              <Ionicons name="trash-outline" size={32} color="#ff5c5c" />
            </View>
            <CustomText style={styles.modalTitle}>
              آیا از حذف مطمئن هستید؟
            </CustomText>
            <CustomText style={styles.modalText}>
              اطلاعات این مشتری حذف خواهد شد و این عملیات قابل بازگشت نیست.
            </CustomText>
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalBtn, styles.cancelBtn]}
                onPress={() => setDeleteModalData(null)}
              >
                <CustomText style={styles.cancelBtnText}>انصراف</CustomText>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalBtn, styles.dangerBtn]}
                onPress={confirmDelete}
              >
                <CustomText style={styles.dangerBtnText}>
                  بله حذف شود
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
  overlay: {
    flex: 1,
    backgroundColor: '#eaf6fc',
  },
  searchContainer: {
    flexGrow: 0,
    paddingHorizontal: 20,
    marginTop: 15,
    marginBottom: 10,
    zIndex: 1,
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
    shadowColor: '#0d2b43',
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
    color: '#0d2b43',
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
  listContainer: {
    paddingHorizontal: 20,
    paddingBottom: 410,
  },
  customerCardWrapper: {
    position: 'relative',
    marginBottom: 10,
  },
  customerCardWrapperActive: {
    zIndex: 30,
    elevation: 30,
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
  dropdownModalOverlay: {
    flex: 1,
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalBox: {
    width: '80%',
    padding: 25,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: '#2e557c',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 15,
  },
  modalIconBg: {
    width: 60,
    height: 60,
    backgroundColor: 'rgba(255, 92, 92, 0.15)',
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
  },
  modalTitle: {
    fontSize: 18,
    color: '#ffffff',
    marginBottom: 10,
  },
  modalText: {
    fontSize: 14,
    color: '#aab7c8',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 25,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 15,
    width: '100%',
  },
  modalBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelBtn: {
    borderWidth: 2,
    borderColor: '#2e557c',
  },
  cancelBtnText: {
    color: '#dee1e4',
  },
  dangerBtn: {
    backgroundColor: '#ff5c5c',
  },
  dangerBtnText: {
    color: '#ffffff',
  },
});