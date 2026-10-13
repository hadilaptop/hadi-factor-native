import React, { useState, useEffect, useRef } from "react";
import {
  View,
  TouchableOpacity,
  StyleSheet,
  Platform,
  Image,
  KeyboardAvoidingView,
  Alert,
  Modal,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as ImagePicker from "expo-image-picker";
import Header from "../components/Header";
import AnimatedScrollWrapper, {
  AnimatedScrollWrapperRef,
} from "../components/AnimatedScrollWrapper";

// کامپوننت‌های سفارشی و توابع
import CustomText from "../components/CustomText";
import CustomTextInput from "../components/CustomTextInput";
import { toPersianDigits } from "../utils/numberUtils";
import { Ionicons } from "@expo/vector-icons";

interface SettingsScreenProps {
  onNavigate: (screen: string) => void;
  returnScreen: string;
}

export default function SettingsScreen({
  onNavigate,
  returnScreen,
}: SettingsScreenProps) {
  const scrollRef = useRef<AnimatedScrollWrapperRef>(null);

  const [theme, setTheme] = useState("blue");
  const [companyName, setCompanyName] = useState("");
  const [companyAddress, setCompanyAddress] = useState("");
  const [companyPhone, setCompanyPhone] = useState("");
  const [economicCode, setEconomicCode] = useState("");
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [alertModal, setAlertModal] = useState({
    visible: false,
    title: "",
    message: "",
    type: "success",
    confirmReset: false,
  });

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const storedTheme = await AsyncStorage.getItem("invoiceTheme");
        const storedName = await AsyncStorage.getItem("companyName");
        const storedAddress = await AsyncStorage.getItem("companyAddress");
        const storedPhone = await AsyncStorage.getItem("companyPhone");
        const storedCode = await AsyncStorage.getItem("companyEconomicCode");
        const storedLogo = await AsyncStorage.getItem("companyLogo");

        if (storedTheme) setTheme(storedTheme);
        if (storedName) setCompanyName(storedName);
        if (storedAddress) setCompanyAddress(storedAddress);
        if (storedPhone) setCompanyPhone(storedPhone);
        if (storedCode) setEconomicCode(storedCode);
        if (storedLogo) setLogoPreview(storedLogo);
      } catch (e) {
        console.error("Failed to load settings.");
      }
    };
    loadSettings();
  }, []);

  const handleClose = () => {
      onNavigate(returnScreen);
  };

  const handleLogoSelect = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("خطا", "برای انتخاب لوگو به دسترسی گالری نیاز داریم.");
      return;
    }

    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
    });

    if (!result.canceled && result.assets[0].uri) {
      setLogoPreview(result.assets[0].uri);
    }
  };

  const handleSave = async () => {
    try {
      await AsyncStorage.setItem("invoiceTheme", theme);
      await AsyncStorage.setItem("companyName", companyName.trim());
      await AsyncStorage.setItem("companyAddress", companyAddress.trim());
      await AsyncStorage.setItem("companyPhone", companyPhone.trim());
      await AsyncStorage.setItem("companyEconomicCode", economicCode.trim());
      if (logoPreview) {
        await AsyncStorage.setItem("companyLogo", logoPreview);
      } else {
        await AsyncStorage.removeItem("companyLogo");
      }

      setAlertModal({
        visible: true,
        title: "موفق",
        message: "تنظیمات با موفقیت ذخیره شد.",
        type: "success",
        confirmReset: false,
      });
    } catch (e) {
      Alert.alert("خطا", "مشکلی در ذخیره اطلاعات پیش آمد.");
    }
  };

  const handleReset = () => {
    setAlertModal({
      visible: true,
      title: "بازنشانی تنظیمات",
      message: "آیا از پاک کردن تمامی تنظیمات و فرم‌ها مطمئن هستید؟",
      type: "warning",
      confirmReset: true,
    });
  };

  const confirmReset = async () => {
    setTheme("blue");
    setCompanyName("");
    setCompanyAddress("");
    setCompanyPhone("");
    setEconomicCode("");
    setLogoPreview(null);

    try {
      await AsyncStorage.multiRemove([
        "invoiceTheme",
        "companyName",
        "companyAddress",
        "companyPhone",
        "companyEconomicCode",
        "companyLogo",
      ]);
      setAlertModal({
        visible: false,
        title: "",
        message: "",
        type: "success",
        confirmReset: false,
      });
    } catch {
      setAlertModal({
        visible: true,
        title: "خطا",
        message: "بازنشانی تنظیمات انجام نشد. لطفاً دوباره تلاش کنید.",
        type: "error",
        confirmReset: false,
      });
    }
  };

  const renderThemeButton = (themeColor: string, colorCode: string) => (
    <TouchableOpacity
      style={[
        styles.themeBtn,
        { backgroundColor: colorCode },
        theme === themeColor && styles.themeBtnActive,
      ]}
      onPress={() => setTheme(themeColor)}
      activeOpacity={0.7}
    />
  );

  return (
    <View style={styles.container}>
      <Header
        title="تنظیمات فاکتور "
        onBack={handleClose}
        iconName="arrow-back"
      />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <AnimatedScrollWrapper
          ref={scrollRef}
          contentContainerStyle={styles.scrollContent}
          delay={0}
        >
          <LinearGradient
            colors={["#0f4c75", "#3282b8"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.card}
          >
            <CustomText style={styles.label}>تم رنگی فاکتور :</CustomText>
            <View style={styles.themeSelector}>
              {renderThemeButton("gold", "#7e5108")}
              {renderThemeButton("blue", "#0f4c75")}
              {renderThemeButton("red", "#a10000")}
              {renderThemeButton("green", "#127547")}
              {renderThemeButton("teal", "#13899d")}
            </View>
          </LinearGradient>

          <LinearGradient
            colors={["#0f4c75", "#3282b8"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.card}
          >
            <View style={styles.inputGroup}>
              <CustomText style={styles.label}>نام شرکت :</CustomText>
              <CustomTextInput
                style={styles.input}
                placeholder="نام شرکت را وارد کنید"
                placeholderTextColor="rgba(255,255,255,0.4)"
                value={companyName}
                onChangeText={setCompanyName}
              />
            </View>

            <View style={styles.inputGroup}>
              <CustomText style={styles.label}>آدرس :</CustomText>
              <CustomTextInput
                style={styles.input}
                placeholder="آدرس شرکت را وارد کنید"
                placeholderTextColor="rgba(255,255,255,0.4)"
                value={companyAddress}
                onChangeText={setCompanyAddress}
              />
            </View>

            <View style={styles.inputGroup}>
              <CustomText style={styles.label}>شماره تماس :</CustomText>
              <CustomTextInput
                style={styles.input}
                placeholder="۰۹۱۲..."
                placeholderTextColor="rgba(255,255,255,0.4)"
                keyboardType="phone-pad"
                value={companyPhone}
                onChangeText={(text: string) =>
                  setCompanyPhone(toPersianDigits(text))
                }
              />
            </View>

            <View style={styles.inputGroup}>
              <CustomText style={styles.label}>کد اقتصادی :</CustomText>
              <CustomTextInput
                style={styles.input}
                placeholder="۱۲۳..."
                placeholderTextColor="rgba(255,255,255,0.4)"
                keyboardType="numeric"
                value={economicCode}
                onChangeText={(text: string) =>
                  setEconomicCode(toPersianDigits(text))
                }
              />
            </View>

            <View style={styles.inputGroup}>
              <CustomText style={styles.label}>لوگوی شرکت :</CustomText>
              {logoPreview ? (
                <View style={styles.logoPreviewBox}>
                  <Image
                    source={{ uri: logoPreview }}
                    style={styles.logoPreviewImg}
                  />
                  <TouchableOpacity
                    activeOpacity={0.8}
                    style={styles.logoRemoveBtn}
                    onPress={() => setLogoPreview(null)}
                  >
                    <CustomText style={styles.logoRemoveBtnText}>حذف لوگو</CustomText>
                  </TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity
                  style={styles.logoUploadBtn}
                  onPress={handleLogoSelect}
                  activeOpacity={0.8}
                >
                  <CustomText style={styles.logoUploadText}>
                    انتخاب لوگو
                  </CustomText>
                </TouchableOpacity>
              )}
            </View>
          </LinearGradient>

          <LinearGradient
            colors={["#3282b8", "#0f4c75"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.actionCard}
          >
            <TouchableOpacity style={styles.btnReset} onPress={handleReset}>
              <CustomText style={styles.btnText}>🔄 بازنشانی</CustomText>
            </TouchableOpacity>
            <TouchableOpacity style={styles.btnSave} onPress={handleSave}>
              <CustomText style={styles.btnText}>ذخیره تنظیمات</CustomText>
            </TouchableOpacity>
          </LinearGradient>
        </AnimatedScrollWrapper>

        <Modal
          visible={alertModal.visible}
          transparent
          animationType="fade"
          onRequestClose={() =>
            setAlertModal((current) => ({ ...current, visible: false }))
          }
        >
          <View style={styles.alertOverlay}>
            <LinearGradient
              colors={["#0d2b43", "#0f4c75"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.alertBox}
            >
              <View style={styles.alertIconBg}>
                <Ionicons
                  name={
                    alertModal.type === "success"
                      ? "checkmark-circle-outline"
                      : alertModal.type === "error"
                        ? "close-circle-outline"
                        : "warning-outline"
                  }
                  size={32}
                  color={
                    alertModal.type === "success"
                      ? "#10b981"
                      : alertModal.type === "error"
                        ? "#f87171"
                        : "#f59e0b"
                  }
                />
              </View>
              <CustomText style={styles.alertTitle}>
                {alertModal.title}
              </CustomText>
              <CustomText style={styles.alertMessage}>
                {alertModal.message}
              </CustomText>
              {alertModal.confirmReset ? (
                <View style={styles.alertActions}>
                  <TouchableOpacity
                    activeOpacity={0.8}
                    style={[styles.alertBtn, styles.alertCancelBtn]}
                    onPress={() =>
                      setAlertModal((current) => ({
                        ...current,
                        visible: false,
                      }))
                    }
                  >
                    <CustomText style={styles.alertBtnText}>انصراف</CustomText>
                  </TouchableOpacity>
                  <TouchableOpacity
                    activeOpacity={0.8}
                    style={[styles.alertBtn, styles.alertConfirmBtn]}
                    onPress={confirmReset}
                  >
                    <CustomText style={styles.alertBtnText}>
                      بله، پاک کن
                    </CustomText>
                  </TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity
                  activeOpacity={0.8}
                  style={styles.alertBtn}
                  onPress={() => {
                    setAlertModal((current) => ({
                      ...current,
                      visible: false,
                    }));
                  }}
                >
                  <CustomText style={styles.alertBtnText}>متوجه شدم</CustomText>
                </TouchableOpacity>
              )}
            </LinearGradient>
          </View>
        </Modal>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#eaf6fc",
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 100,
  },
  scrollContent: {
    paddingVertical: 10,
    paddingHorizontal: 15,
    paddingBottom: 400,
  },
  card: {
    borderRadius: 20,
    paddingVertical: 10,
    paddingHorizontal: 15,
    marginBottom: 20,
    elevation: 8,
    shadowColor: "#0d2b43",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    borderWidth: 1,
    borderColor: "#a2c8e2",
  },
  label: {
    fontSize: 14,
    fontWeight: "700",
    color: "#ffffff",
    textAlign: "right",
    marginBottom: 3,
    paddingHorizontal: 10,
  },
  inputGroup: {
    paddingHorizontal: 5,
    paddingVertical: 5,
  },
  input: {
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderWidth: 2,
    borderColor: "rgba(255, 255, 255, 0.3)",
    borderRadius: 10,
    paddingVertical: 7,
    paddingHorizontal: 10,
    color: "#fff",
    textAlign: "right",
    fontSize: 14,
  },
  themeSelector: {
    flexDirection: "row-reverse",
    justifyContent: "space-around",
    marginTop: 10,
    marginBottom: 8,
  },
  themeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 3,
    borderColor: "rgba(255, 255, 255, 0.4)",
  },
  themeBtnActive: {
    borderColor: "#ffffff",
    transform: [{ scale: 1.08 }],
  },
  logoUploadBtn: {
    alignSelf: "center",
    width: 130,
    height: 130,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: "rgba(255, 255, 255, 0.4)",
    borderStyle: "dashed",
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
    marginTop: 10,
  },
  logoUploadText: {
    color: "#fff",
    fontSize: 15,
  },
  logoPreviewBox: {
    alignItems: "center",
    alignSelf: "center",
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    padding: 15,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.3)",
    borderStyle: "dashed",
    gap: 15,
    marginTop: 10,
  },
  logoPreviewImg: {
    width: 130,
    height: 130,
    borderRadius: 15,
    resizeMode: "cover",
  },
  logoRemoveBtn: {
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
  logoRemoveBtnText: {
    color: "#ffffff",
    fontSize: 14,
  },
  actionCard: {
    flexDirection: "row-reverse",
    borderRadius: 20,
    padding: 10,
    gap: 10,
    elevation: 8,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.15)",
  },
  btnSave: {
    flex: 1.5,
    backgroundColor: "#10b981",
    borderRadius: 10,
    paddingVertical: 8,
    alignItems: "center",
    elevation: 3,
  },
  btnReset: {
    flex: 1,
    backgroundColor: "#f59e0b",
    borderRadius: 10,
    paddingVertical: 8,
    alignItems: "center",
    elevation: 3,
  },
  btnText: {
    color: "#fff",
    fontSize: 14,
  },
  alertOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  alertBox: {
    width: "80%",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#adc7d8",
    paddingVertical: 20,
    paddingHorizontal: 15,
    alignItems: "center",
    elevation: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 15,
  },
  alertIconBg: {
    backgroundColor: "rgba(245, 158, 11, 0.12)",
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 15,
  },
  alertTitle: {
    fontSize: 19,
    fontWeight: "900",
    color: "#ffffff",
    marginBottom: 10,
    textAlign: "center",
  },
  alertMessage: {
    fontSize: 15,
    color: "#ffffff",
    textAlign: "center",
    marginBottom: 20,
    lineHeight: 22,
  },
  alertActions: {
    flexDirection: "row-reverse",
    width: "100%",
    gap: 10,
    justifyContent: "center",
  },
  alertBtn: {
    minWidth: "70%",
    backgroundColor: "#145d8e",
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  alertCancelBtn: {
    flex: 1,
    minWidth: 0,
    backgroundColor: "#64748b",
  },
  alertConfirmBtn: {
    flex: 1,
    minWidth: 0,
    backgroundColor: "#dc2626",
  },
  alertBtnText: {
    color: "#ffffff",
    fontSize: 15,
    fontWeight: "bold",
    textAlign: "center",
  },
});
