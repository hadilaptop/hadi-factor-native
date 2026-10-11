import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Animated,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import * as jalaali from "jalaali-js";
import CustomText from "./CustomText";

type JalaliDatePickerProps = {
  visible: boolean;
  initialDate?: string;
  onSelectDate: (date: string) => void;
  onClose: () => void;
};

const PERSIAN_MONTHS = [
  "فروردین",
  "اردیبهشت",
  "خرداد",
  "تیر",
  "مرداد",
  "شهریور",
  "مهر",
  "آبان",
  "آذر",
  "دی",
  "بهمن",
  "اسفند",
];

const WEEK_DAYS = [
  "شنبه",
  "یک‌شنبه",
  "دوشنبه",
  "سه‌شنبه",
  "چهارشنبه",
  "پنج‌شنبه",
  "جمعه",
];

const YEARS = Array.from({ length: 20 }, (_, index) => 1395 + index);

function toEnglishDigits(value: string) {
  return value.replace(/[۰-۹]/g, (digit) =>
    String("۰۱۲۳۴۵۶۷۸۹".indexOf(digit))
  );
}

function toPersianDigits(value: string | number) {
  return String(value).replace(/[0-9]/g, (digit) =>
    "۰۱۲۳۴۵۶۷۸۹"[Number(digit)]
  );
}

function parseInitialDate(initialDate?: string) {
  if (!initialDate) return { year: 1403, month: 1 };

  const parts = toEnglishDigits(initialDate).split("/");
  if (parts.length === 3) {
    const year = Number.parseInt(parts[0], 10) || 1403;
    const month = Number.parseInt(parts[1], 10) || 1;
    const day = Number.parseInt(parts[2], 10) || 1;
    if (year >= 1700 && year <= 2200 && month >= 1 && month <= 12 && day >= 1 && day <= 31) {
      const jalaliDate = jalaali.toJalaali(year, month, day);
      return { year: jalaliDate.jy, month: jalaliDate.jm };
    }
    return { year, month: Math.max(1, Math.min(12, month)) };
  }

  return { year: 1403, month: 1 };
}

export default function JalaliDatePicker({
  visible,
  initialDate,
  onSelectDate,
  onClose,
}: JalaliDatePickerProps) {
  const parsedInitialDate = useMemo(
    () => parseInitialDate(initialDate),
    [initialDate]
  );
  const [pickerYear, setPickerYear] = useState(parsedInitialDate.year);
  const [pickerMonth, setPickerMonth] = useState(parsedInitialDate.month);
  const [isYearMenuOpen, setIsYearMenuOpen] = useState(false);
  const [isMonthMenuOpen, setIsMonthMenuOpen] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [modalLayout, setModalLayout] = useState({ x: 0, y: 0 });
  const [selectsLayout, setSelectsLayout] = useState({ x: 0, y: 0 });
  const [yearDropdownLayout, setYearDropdownLayout] = useState({ x: 0, y: 0, width: 0, height: 0 });
  const [monthDropdownLayout, setMonthDropdownLayout] = useState({ x: 0, y: 0, width: 0, height: 0 });
  const fade = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.9)).current;

  const todayJalali = useMemo(() => jalaali.toJalaali(new Date()), []);
  const firstGregorianDate = jalaali.toGregorian(pickerYear, pickerMonth, 1);
  const firstDayOffset =
    (new Date(
      firstGregorianDate.gy,
      firstGregorianDate.gm - 1,
      firstGregorianDate.gd
    ).getDay() +
      1) %
    7;
  const daysInMonth = jalaali.jalaaliMonthLength(pickerYear, pickerMonth);

  useEffect(() => {
    setPickerYear(parsedInitialDate.year);
    setPickerMonth(parsedInitialDate.month);
    setIsYearMenuOpen(false);
    setIsMonthMenuOpen(false);
  }, [parsedInitialDate]);

  useEffect(() => {
    if (!visible) {
      fade.setValue(0);
      scale.setValue(0.9);
      setIsClosing(false);
      return;
    }

    Animated.parallel([
      Animated.timing(fade, {
        toValue: 1,
        duration: 120,
        useNativeDriver: true,
      }),
      Animated.spring(scale, {
        toValue: 1,
        speed: 18,
        bounciness: 7,
        useNativeDriver: true,
      }),
    ]).start();
  }, [visible, fade, scale]);

  const closePicker = useCallback(
    (selectDate?: string) => {
      if (isClosing) return;
      setIsClosing(true);
      Animated.parallel([
        Animated.timing(fade, {
          toValue: 0,
          duration: 120,
          useNativeDriver: true,
        }),
        Animated.timing(scale, {
          toValue: 0.9,
          duration: 120,
          useNativeDriver: true,
        }),
      ]).start(({ finished }) => {
        if (!finished) return;
        setIsClosing(false);
        setIsYearMenuOpen(false);
        setIsMonthMenuOpen(false);
        if (selectDate) onSelectDate(selectDate);
        onClose();
      });
    },
    [fade, scale, isClosing, onClose, onSelectDate]
  );

  const selectDay = (day: number) => {
    const month = String(pickerMonth).padStart(2, "0");
    const dayString = String(day).padStart(2, "0");
    closePicker(toPersianDigits(`${pickerYear}/${month}/${dayString}`));
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={() => closePicker()}
    >
      <View style={styles.overlay}>
        <Pressable
          style={StyleSheet.absoluteFill}
          onPress={() => closePicker()}
          accessibilityLabel="بستن تقویم"
        />
        <Animated.View
          style={[
            styles.modal,
            {
              opacity: fade,
              transform: [{ scale }],
            },
          ]}
          onLayout={(event) => setModalLayout({ x: event.nativeEvent.layout.x, y: event.nativeEvent.layout.y })}
        >
          <View style={styles.header}>
            <CustomText style={styles.title}>انتخاب تاریخ</CustomText>
            <Pressable
              style={styles.closeButton}
              onPress={() => closePicker()}
              accessibilityRole="button"
              accessibilityLabel="بستن"
            >
              <CustomText style={styles.closeText}>✕</CustomText>
            </Pressable>
          </View>

          <View style={styles.selects} onLayout={(event) => setSelectsLayout({ x: event.nativeEvent.layout.x, y: event.nativeEvent.layout.y })}>
            <View style={[styles.dropdown, { zIndex: isYearMenuOpen ? 30 : 1, elevation: isYearMenuOpen ? 30 : 0 }]} onLayout={(event) => setYearDropdownLayout({ x: event.nativeEvent.layout.x, y: event.nativeEvent.layout.y, width: event.nativeEvent.layout.width, height: event.nativeEvent.layout.height })}>
              <Pressable
                style={styles.selectButton}
                onPress={() => {
                  setIsYearMenuOpen((open) => !open);
                  setIsMonthMenuOpen(false);
                }}
              >
                <CustomText style={styles.selectText}>
                  {toPersianDigits(pickerYear)}
                </CustomText>
              </Pressable>
            </View>

            <View
              style={[styles.dropdown, { zIndex: isMonthMenuOpen ? 30 : 1, elevation: isMonthMenuOpen ? 30 : 0 }]}
              onLayout={(event) => setMonthDropdownLayout({ x: event.nativeEvent.layout.x, y: event.nativeEvent.layout.y, width: event.nativeEvent.layout.width, height: event.nativeEvent.layout.height })}
            >
              <Pressable
                style={styles.selectButton}
                onPress={() => {
                  setIsMonthMenuOpen((open) => !open);
                  setIsYearMenuOpen(false);
                }}
              >
                <CustomText style={styles.selectText}>
                  {PERSIAN_MONTHS[pickerMonth - 1]}
                </CustomText>
              </Pressable>
            </View>
          </View>

          <View style={styles.weekHeader}>
            {WEEK_DAYS.map((day, index) => (
              <View key={day} style={styles.weekDayCell}>
                <CustomText
                  style={[
                    styles.weekDayText,
                    index === 6 && styles.fridayText,
                  ]}
                >
                  {day}
                </CustomText>
              </View>
            ))}
          </View>

          <View style={styles.daysGrid}>
            {Array.from({ length: firstDayOffset }, (_, index) => (
              <View key={`empty-${index}`} style={styles.dayCell} />
            ))}
            {Array.from({ length: daysInMonth }, (_, index) => index + 1).map(
              (day) => {
                const weekday = (firstDayOffset + day - 1) % 7;
                const isFriday = weekday === 6;
                const isToday =
                  todayJalali.jy === pickerYear &&
                  todayJalali.jm === pickerMonth &&
                  todayJalali.jd === day;

                return (
                  <View key={day} style={styles.dayCell}>
                    <Pressable
                      style={[
                        styles.dayButton,
                        isFriday && styles.fridayButton,
                        isToday && styles.todayButton,
                      ]}
                      onPress={() => selectDay(day)}
                    >
                      <CustomText
                        style={[
                          styles.dayText,
                          isFriday && styles.fridayText,
                          isToday && styles.todayText,
                        ]}
                      >
                        {toPersianDigits(day)}
                      </CustomText>
                    </Pressable>
                  </View>
                );
              }
            )}
          </View>
        </Animated.View>
        {isYearMenuOpen && (
          <View style={[styles.dropdownListPortal, { top: modalLayout.y + selectsLayout.y + yearDropdownLayout.y + yearDropdownLayout.height + 4, left: modalLayout.x + selectsLayout.x + yearDropdownLayout.x, width: yearDropdownLayout.width }]}>
            <ScrollView style={styles.dropdownScrollView} nestedScrollEnabled keyboardShouldPersistTaps={'always'} showsVerticalScrollIndicator removeClippedSubviews={false}>
              {YEARS.map((year) => (
                <Pressable key={year} style={styles.dropdownItem} onPress={() => { setPickerYear(year); setIsYearMenuOpen(false); }}>
                  <CustomText style={styles.dropdownItemText}>{toPersianDigits(year)}</CustomText>
                </Pressable>
              ))}
            </ScrollView>
          </View>
        )}
        {isMonthMenuOpen && (
          <View style={[styles.dropdownListPortal, { top: modalLayout.y + selectsLayout.y + monthDropdownLayout.y + monthDropdownLayout.height + 4, left: modalLayout.x + selectsLayout.x + monthDropdownLayout.x, width: monthDropdownLayout.width }]}>
            <ScrollView style={styles.dropdownScrollView} nestedScrollEnabled keyboardShouldPersistTaps={'always'} showsVerticalScrollIndicator removeClippedSubviews={false}>
              {PERSIAN_MONTHS.map((month, index) => (
                <Pressable key={month} style={styles.dropdownItem} onPress={() => { setPickerMonth(index + 1); setIsMonthMenuOpen(false); }}>
                  <CustomText style={styles.dropdownItemText}>{month}</CustomText>
                </Pressable>
              ))}
            </ScrollView>
          </View>
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.65)",
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },
  modal: {
    width: "100%",
    maxWidth: 360,
    backgroundColor: "#0f4c75",
    borderColor: "#71a9cf",
    borderWidth: 1,
    borderRadius: 24,
    padding: 20,
    gap: 18,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.6,
    shadowRadius: 25,
    elevation: 16,
  },
  header: {
    flexDirection: "row-reverse",
    alignItems: "center",
    justifyContent: "space-between",
  },
  title: {
    color: "#ffffff",
    fontSize: 19,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  closeText: {
    color: "#ffffff",
    fontSize: 17,
  },
  selects: {
    flexDirection: "row-reverse",
    gap: 10,
  },
  dropdown: {
    flex: 1,
    position: "relative",
  },
  selectButton: {
    minHeight: 38,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#71a9cf",
    backgroundColor: "#3a83b7",
    justifyContent: "center",
  },
  selectText: {
    color: "#ffffff",
    fontSize: 14,
    textAlign: "center",
  },
  dropdownList: {
    position: "absolute",
    top: 42,
    left: 0,
    right: 0,
    height: 200,
    backgroundColor: "#0f4c75",
    borderWidth: 1,
    borderColor: "#71a9cf",
    borderRadius: 12,
    elevation: 30,
    overflow: "hidden",
  },
  dropdownListPortal: {
    position: 'absolute',
    height: 200,
    backgroundColor: '#0f4c75',
    borderWidth: 1,
    borderColor: '#71a9cf',
    borderRadius: 12,
    elevation: 50,
    overflow: 'hidden',
    zIndex: 50,
  },
  dropdownScrollView: {
    flex: 1,
  },
  dropdownItem: {
    paddingVertical: 12,
    paddingHorizontal: 8,
    alignItems: "stretch",
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "rgba(113,169,207,0.3)",
  },
  dropdownItemText: {
    color: "#ffffff",
    fontFamily: "Vazirmatn",
    textAlign: "center",
    alignSelf: "stretch",
    fontSize: 15,
  },
  weekHeader: {
    flexDirection: "row-reverse",
  },
  weekDayCell: {
    width: "14.2857%",
    alignItems: "center",
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.2)",
  },
  weekDayText: {
    color: "#ffffff",
    fontSize: 10,
    textAlign: "center",
  },
  daysGrid: {
    flexDirection: "row-reverse",
    flexWrap: "wrap",
    rowGap: 5,
  },
  dayCell: {
    width: "14.2857%",
    paddingHorizontal: 2,
  },
  dayButton: {
    minHeight: 39,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#71a9cf",
    backgroundColor: "#256b9c",
    alignItems: "center",
    justifyContent: "center",
  },
  dayText: {
    color: "#ffffff",
    fontSize: 16,
  },
  fridayButton: {
    borderColor: "#71a9cf",
  },
  fridayText: {
    color: "#ff6b6b",
  },
  todayButton: {
    backgroundColor: "#059669",
    borderColor: "#059669",
    shadowColor: "#059669",
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 4,
  },
  todayText: {
    color: "#ffffff",
  },
});