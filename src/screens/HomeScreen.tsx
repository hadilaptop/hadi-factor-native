import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  Animated,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as jalaali from 'jalaali-js';

// کامپوننت‌های سفارشی
import CustomText from '../components/CustomText';
import { toPersianDigits } from '../utils/numberUtils';

const { width } = Dimensions.get('window');

export default function HomeScreen({
  onNavigate = (screen: string) => console.log(screen),
  customerCount = 0,
  isInitialized = true,
}) {
  
const [currentDate] = useState(() => {
    const today = new Date();
    
    // استخراج سال، ماه (باضافه یک، چون ماه‌ها در JS از صفر شروع می‌شوند) و روز
    const jDate = jalaali.toJalaali(
      today.getFullYear(), 
      today.getMonth() + 1, 
      today.getDate()
    );
    
    const persianMonths = ["فروردین", "اردیبهشت", "خرداد", "تیر", "مرداد", "شهریور", "مهر", "آبان", "آذر", "دی", "بهمن", "اسفند"];
    const weekDays = ["یکشنبه", "دوشنبه", "سه‌شنبه", "چهارشنبه", "پنج‌شنبه", "جمعه", "شنبه"];
    
    const weekdayName = weekDays[today.getDay()];
    const monthName = persianMonths[jDate.jm - 1];
    
    return `${weekdayName}، ${toPersianDigits(jDate.jd)} ${monthName} ${toPersianDigits(jDate.jy)}`;
  });

  const displayCustomerCount = toPersianDigits(customerCount || 0);
  const cardsAnim = useRef(new Animated.Value(width)).current;

  useEffect(() => {
    Animated.timing(cardsAnim, {
      toValue: 0,
      duration: 250,
      useNativeDriver: true,
    }).start();
  }, [cardsAnim]);

  const handleNavigate = (screen: string) => {
    onNavigate(screen);
  };

  return (
    <View style={styles.dashboardAppContainer}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        
        <LinearGradient
          colors={['#0d2b43', '#0f4c75']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.dashHeader}
        >
          <View style={styles.dashHeaderTop}>
            <CustomText style={styles.dashDate}>{currentDate}</CustomText>
          </View>
          <CustomText style={styles.dashHeaderTitle}>سیستم مدیریت فاکتور و حسابداری</CustomText>
        </LinearGradient>

        <Animated.View style={{ transform: [{ translateX: cardsAnim }] }}>
          <View style={styles.dashContent}>
            <View style={styles.dashGrid}>
              
              <TouchableOpacity activeOpacity={0.8} onPress={() => handleNavigate("invoice")} style={styles.cardWrapper}>
                <LinearGradient
                  colors={['#3282b8', '#0d2b43']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.dashCard}
                >
                  <View style={styles.cardHeader}>
                    <View style={styles.cardIcon}>
                      <Ionicons name="stats-chart" size={20} color="#ffffff" />
                    </View>
                    <CustomText style={styles.cardTitle}>فاکتور جدید</CustomText>
                  </View>
                  <View style={styles.cardBody}>
                    <CustomText style={styles.cardCount}>صدور سریع فاکتور</CustomText>
                    <CustomText style={styles.cardDesc}>صدور پیش‌فاکتور و فاکتور فروش</CustomText>
                  </View>
                </LinearGradient>
              </TouchableOpacity>

              <TouchableOpacity activeOpacity={0.8} onPress={() => handleNavigate("customers")} style={styles.cardWrapper}>
                <LinearGradient
                  colors={['#0d2b43', '#0f4c75']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.dashCard}
                >
                  <View style={styles.cardHeader}>
                    <View style={styles.cardIcon}>
                      <Ionicons name="people" size={22} color="#ffffff" />
                    </View>
                    <CustomText style={styles.cardTitle}>مدیریت حساب‌ها</CustomText>
                  </View>
                  <View style={styles.cardBody}>
                    <CustomText style={styles.cardCount}>
                      {!isInitialized ? "در حال به‌روزرسانی..." : `تعداد ${displayCustomerCount} مشتری`}
                    </CustomText>
                    <CustomText style={styles.cardDesc}>مشاهده صورتحساب و پرداختی‌ها</CustomText>
                  </View>
                </LinearGradient>
              </TouchableOpacity>

              <TouchableOpacity activeOpacity={0.8} onPress={() => handleNavigate("newAccount")} style={styles.cardWrapper}>
                <LinearGradient
                  colors={['#0f4c75', '#3282b8']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.dashCard}
                >
                  <View style={styles.cardHeader}>
                    <View style={styles.cardIcon}>
                      <Ionicons name="person-add" size={20} color="#ffffff" />
                    </View>
                    <CustomText style={styles.cardTitle}>حساب جدید</CustomText>
                  </View>
                  <View style={styles.cardBody}>
                    <CustomText style={styles.cardCount}>ثبت مشتری جدید</CustomText>
                    <CustomText style={styles.cardDesc}>افزودن اطلاعات برای صدور فاکتور</CustomText>
                  </View>
                </LinearGradient>
              </TouchableOpacity>

            </View>
          </View>
        </Animated.View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  dashboardAppContainer: {
    flex: 1,
    backgroundColor: '#eaf6fc',
  },
  scrollContent: {
    paddingBottom: 50,
  },
  dashHeader: {
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 65 : 55, 
    paddingBottom: 30,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    marginBottom: 10,
    elevation: 8, 
    shadowColor: '#000', 
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 15,
  },
  dashHeaderTop: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'center',

  },
  dashDate: {
    fontSize: 16,
    color: '#fff',
    textAlign: 'left',
  },
  dashHeaderTitle: {
    textAlign: 'center',
    fontSize: 18,
    color: '#fff',
    lineHeight: 25,
    marginTop: 15,
  },
  dashContent: {
    paddingHorizontal: 20,
  },
  dashGrid: {
    gap: 10,
  },
  cardWrapper: {
    width: '100%',
  },
  dashCard: {
    width: '90%',
    alignSelf: 'center',
    borderRadius: 15,
    paddingVertical: 12,
    paddingHorizontal: 16,
    minHeight: 92,
    justifyContent: 'space-between',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,

  },
  cardTitle: {
    fontSize: 19,
    color: '#ffffff',
    marginHorizontal: 10,
  },
  cardIcon: {
    width: 35,
    height: 35,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 7,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardBody: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  cardCount: {
    fontSize: 16,
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 4,
  },
  cardDesc: {
    fontSize: 14,
    color: '#ffffff',
    opacity: 0.9,
    textAlign: 'center',
  },
});