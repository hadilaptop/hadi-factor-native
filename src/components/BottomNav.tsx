import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';

interface BottomNavProps {
  activeTab: string;
  onNavigate: (tab: string) => void;
}

export default function BottomNav({ activeTab, onNavigate }: BottomNavProps) {
  const insets = useSafeAreaInsets();
  // پدینگ پایین هم کمی کمتر شد تا نوار جمع‌وجورتر شود
  const safePaddingBottom = insets.bottom > 0 ? insets.bottom + 5 : 10;
  // ارتفاع پایه از 65 به 55 کاهش یافت
  const navHeight = 55 + safePaddingBottom;

  return (
    <LinearGradient
      colors={['#0f4c75', '#0d2b43']}
      style={[styles.bottomNavContainer, { height: navHeight, paddingBottom: safePaddingBottom }]}
    >
      <View style={[styles.bottomLine, { bottom: Math.max(0, safePaddingBottom - 5) }]} />
      {/* ۱. حساب جدید (منتهی‌الیه سمت راست) */}
      <TouchableOpacity style={styles.navItem} onPress={() => onNavigate('newAccount')}>
        <Ionicons name={activeTab === 'newAccount' ? "person-add" : "person-add-outline"} size={22} color={activeTab === 'newAccount' ? "#10b981" : "rgba(255,255,255,0.5)"} />
        <Text style={[styles.navText, activeTab === 'newAccount' && styles.navTextActive]}>حساب جدید</Text>
      </TouchableOpacity>

      {/* ۲. فاکتور جدید (کنار حساب جدید) */}
      <TouchableOpacity style={styles.navItem} onPress={() => onNavigate('invoice')}>
        <Ionicons name={activeTab === 'invoice' ? "document-text" : "document-text-outline"} size={22} color={activeTab === 'invoice' ? "#10b981" : "rgba(255,255,255,0.5)"} />
        <Text style={[styles.navText, activeTab === 'invoice' && styles.navTextActive]}>فاکتور جدید</Text>
      </TouchableOpacity>

      {/* ۳. صفحه اصلی (دکمه برجسته وسط) */}
      <View style={styles.centerNavBtnWrapper}>
        <TouchableOpacity 
          style={styles.centerFloatingBtn} 
          activeOpacity={0.8}
          onPress={() => onNavigate('dashboard')}
        >
          {/* سایز آیکون از 28 به 24 تغییر کرد */}
          <Ionicons name="home" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={[styles.navText, { marginTop: 6 }, activeTab === 'dashboard' && styles.navTextActive]}>صفحه اصلی</Text>
      </View>

      {/* ۴. ثبت دریافتی (سمت چپ) */}
      <TouchableOpacity style={styles.navItem} onPress={() => onNavigate('receipt')}>
        <Ionicons name={activeTab === 'receipt' ? "wallet" : "wallet-outline"} size={22} color={activeTab === 'receipt' ? "#10b981" : "rgba(255,255,255,0.5)"} />
        <Text style={[styles.navText, activeTab === 'receipt' && styles.navTextActive]}>ثبت دریافتی</Text>
      </TouchableOpacity>

      {/* ۵. تنظیمات (منتهی‌الیه سمت چپ) */}
      <TouchableOpacity style={styles.navItem} onPress={() => onNavigate('settings')}>
        <Ionicons name={activeTab === 'settings' ? "settings" : "settings-outline"} size={22} color={activeTab === 'settings' ? "#10b981" : "rgba(255,255,255,0.5)"} />
        <Text style={[styles.navText, activeTab === 'settings' && styles.navTextActive]}>تنظیمات</Text>
      </TouchableOpacity>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  bottomNavContainer: {
    flexDirection: 'row-reverse',
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    elevation: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -5 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 10,
    zIndex: 1000,
  },
  bottomLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: '#ffffff62',
    zIndex: 1001,
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 6,
  },
  navText: {
    fontFamily: 'Vazirmatn',
    fontSize: 9, // فونت کمی کوچکتر شد (از 10 به 9)
    color: 'rgba(255,255,255,0.5)', 
    marginTop: 4,
    textAlign: 'center',
  },
  navTextActive: {
    color: '#10b981', 
    fontWeight: 'bold',
  },
  centerNavBtnWrapper: {
    flex: 1.2,
    alignItems: 'center',
    justifyContent: 'flex-start',
    marginTop: -22, // دکمه وسط کمتر از لبه بالا می‌زند
  },
  centerFloatingBtn: {
    width: 50, // از 60 به 50 کاهش یافت
    height: 50, // از 60 به 50 کاهش یافت
    borderRadius: 25,
    backgroundColor: '#3282b8', 
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    borderWidth: 3, // حاشیه کمی نازک‌تر شد
    borderColor: '#eaf6fc', 
  },
});