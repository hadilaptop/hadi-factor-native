import React, { useState, useEffect, useRef } from "react";
import {
  View,
  TouchableOpacity,
  StyleSheet,
  Platform,
  KeyboardAvoidingView,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import AsyncStorage from "@react-native-async-storage/async-storage";
import ImageUpload from "../components/ImageUpload";
import Header from "../components/Header";
import ExportAlertModal from "../components/ExportAlertModal";
import AnimatedScrollWrapper, {
  AnimatedScrollWrapperRef,
} from "../components/AnimatedScrollWrapper";

// کامپوننت‌های سفارشی و توابع
import CustomText from "../components/CustomText";
import CustomTextInput from "../components/CustomTextInput";
import { toPersianDigits } from "../utils/numberUtils";

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
  const [sealPreview, setSealPreview] = useState<string | null>(null);
  const [signaturePreview, setSignaturePreview] = useState<string | null>(null);
  const [exportAlertModal, setExportAlertModal] = useState<{
    show: boolean;
    title: string;
    message: string;
    success?: boolean;
    error?: boolean;
    confirm?: boolean;
    confirmText?: string;
    cancelText?: string;
  }>({
    show: false,
    title: "",
    message: "",
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
        const storedSeal = await AsyncStorage.getItem("companySeal");
        const storedSignature = await AsyncStorage.getItem("companySignature");

        if (storedTheme) setTheme(storedTheme);
        if (storedName) setCompanyName(storedName);
        if (storedAddress) setCompanyAddress(storedAddress);
        if (storedPhone) setCompanyPhone(storedPhone);
        if (storedCode) setEconomicCode(storedCode);
        if (storedLogo) setLogoPreview(storedLogo);
        if (storedSeal) setSealPreview(storedSeal);
        if (storedSignature) setSignaturePreview(storedSignature);
      } catch (e) {
        console.error("Failed to load settings.");
      }
    };
    loadSettings();
  }, []);

  const handleClose = () => {
      onNavigate(returnScreen);
  };

  const handleSave = async () => {
    try {
      await AsyncStorage.setItem("invoiceTheme", theme);
      await AsyncStorage.setItem("companyName", companyName.trim());
      await AsyncStorage.setItem("companyAddress", companyAddress.trim());
      await AsyncStorage.setItem("companyPhone", companyPhone.trim());
      await AsyncStorage.setItem("companyEconomicCode", economicCode.trim());
      if (logoPreview) await AsyncStorage.setItem("companyLogo", logoPreview);
      else await AsyncStorage.removeItem("companyLogo");
      if (sealPreview) await AsyncStorage.setItem("companySeal", sealPreview);
      else await AsyncStorage.removeItem("companySeal");
      if (signaturePreview) await AsyncStorage.setItem("companySignature", signaturePreview);
      else await AsyncStorage.removeItem("companySignature");

      setExportAlertModal({
        show: true,
        title: "موفق",
        message: "تنظیمات با موفقیت ذخیره شد.",
        success: true,
      });
    } catch (e) {
      setExportAlertModal({ show: true, title: "خطا", message: "مشکلی در ذخیره اطلاعات پیش آمد." });
    }
  };

  const handleReset = () => {
    setExportAlertModal({
      show: true,
      title: "بازنشانی تنظیمات",
      message: "آیا از پاک کردن تمامی تنظیمات و فرم‌ها مطمئن هستید؟",
      confirm: true,
      confirmText: "بله، پاک کن",
      cancelText: "انصراف",
    });
  };

  const confirmReset = async () => {
    setExportAlertModal({ show: false, title: "", message: "" });
    setTheme("blue");
    setCompanyName("");
    setCompanyAddress("");
    setCompanyPhone("");
    setEconomicCode("");
    setLogoPreview(null);
    setSealPreview(null);
    setSignaturePreview(null);

    try {
      await AsyncStorage.multiRemove([
        "invoiceTheme",
        "companyName",
        "companyAddress",
        "companyPhone",
        "companyEconomicCode",
        "companyLogo",
        "companySeal",
        "companySignature",
      ]);

    } catch {
      setExportAlertModal({
        show: true,
        title: "خطا",
        message: "بازنشانی تنظیمات انجام نشد. لطفاً دوباره تلاش کنید.",
        error: true,
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
              <ImageUpload label="لوگوی شرکت :" value={logoPreview} onChange={setLogoPreview}
                onError={(message) => setExportAlertModal({ show: true, title: "خطا", message })}
                imageWidth={130} imageHeight={130} uploadText="انتخاب لوگو" removeText="حذف لوگو"
                uploadButtonStyle={styles.logoUploadBtn} uploadTextStyle={styles.logoUploadText}
                previewBoxStyle={styles.logoPreviewBox} imageStyle={styles.logoPreviewImg}
                removeButtonStyle={styles.logoRemoveBtn} removeTextStyle={styles.logoRemoveBtnText}
              />
            </View>
            <View style={styles.inputGroup}>
              <ImageUpload label="مهر شرکت :" value={sealPreview} onChange={setSealPreview}
                onError={(message) => setExportAlertModal({ show: true, title: "خطا", message })}
                imageWidth={130} imageHeight={130} uploadText="انتخاب مهر" removeText="حذف مهر"
                uploadButtonStyle={styles.logoUploadBtn} uploadTextStyle={styles.logoUploadText}
                previewBoxStyle={styles.logoPreviewBox} imageStyle={styles.logoPreviewImg}
                removeButtonStyle={styles.logoRemoveBtn} removeTextStyle={styles.logoRemoveBtnText}
              />
            </View>
            <View style={styles.inputGroup}>
              <ImageUpload label="امضای مدیر :" value={signaturePreview} onChange={setSignaturePreview}
                onError={(message) => setExportAlertModal({ show: true, title: "خطا", message })}
                imageWidth={130} imageHeight={130} uploadText="انتخاب امضا" removeText="حذف امضا"
                uploadButtonStyle={styles.logoUploadBtn} uploadTextStyle={styles.logoUploadText}
                previewBoxStyle={styles.logoPreviewBox} imageStyle={styles.logoPreviewImg}
                removeButtonStyle={styles.logoRemoveBtn} removeTextStyle={styles.logoRemoveBtnText}
              />
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

        <ExportAlertModal
          visible={exportAlertModal.show}
          title={exportAlertModal.title}
          message={exportAlertModal.message}
          success={exportAlertModal.success}
          error={exportAlertModal.error}
          confirm={exportAlertModal.confirm}
          confirmText={exportAlertModal.confirmText}
          cancelText={exportAlertModal.cancelText}
          onConfirm={confirmReset}
          onClose={() =>
            setExportAlertModal({ show: false, title: "", message: "" })
          }
        />
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
});