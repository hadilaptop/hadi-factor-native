import React, { useState, useEffect } from "react";
import {
  View,
  TouchableOpacity,
  Pressable,
  Animated,
  StyleSheet,
  Platform,
  KeyboardAvoidingView,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import AsyncStorage from "@react-native-async-storage/async-storage";
import ImageUpload from "../components/ImageUpload";
import Header from "../components/Header";
import ExportAlertModal from "../components/ExportAlertModal";
import AnimatedScrollWrapper from "../components/AnimatedScrollWrapper";

// کامپوننت‌های سفارشی و توابع
import CustomText from "../components/CustomText";
import CustomTextInput from "../components/CustomTextInput";
import { toPersianDigits } from "../utils/numberUtils";
import { nativeDb } from "../services/database";


type ScalePressableProps = React.PropsWithChildren<{
  onPress: () => void;
  disabled?: boolean;
  style?: any;
}>;

function ScalePressable({ children, onPress, disabled, style }: ScalePressableProps) {
  return (
    <Pressable onPress={onPress} disabled={disabled} style={style}>
      {children}
    </Pressable>
  );
}

interface SettingsScreenProps {
  onNavigate: (screen: string) => void;
  returnScreen: string;
  onDataRestored: () => Promise<void>;
}

export default function SettingsScreen({
  onNavigate,
  returnScreen,
  onDataRestored,
}: SettingsScreenProps) {
  const [theme, setTheme] = useState("blue");
  const [companyName, setCompanyName] = useState("");
  const [companyAddress, setCompanyAddress] = useState("");
  const [companyPhone, setCompanyPhone] = useState("");
  const [economicCode, setEconomicCode] = useState("");
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [sealPreview, setSealPreview] = useState<string | null>(null);
  const [signaturePreview, setSignaturePreview] = useState<string | null>(null);
  const [pendingConfirmAction, setPendingConfirmAction] = useState<"reset" | null>(null);
  const [exportAlertModal, setExportAlertModal] = useState<{
    show: boolean;
    title: string;
    message: string;
    success?: boolean;
    error?: boolean;
    loading?: boolean;
    confirm?: boolean;
    confirmText?: string;
    cancelText?: string;
  }>({
    show: false,
    title: "",
    message: "",
  });

  const loadSettings = async () => {
    try {
      const storedSettings = new Map(
        await AsyncStorage.multiGet([
          "invoiceTheme",
          "companyName",
          "companyAddress",
          "companyPhone",
          "companyEconomicCode",
          "companyLogo",
          "companySeal",
          "companySignature",
        ]),
      );

      setTheme(storedSettings.get("invoiceTheme") ?? "blue");
      setCompanyName(storedSettings.get("companyName") ?? "");
      setCompanyAddress(storedSettings.get("companyAddress") ?? "");
      setCompanyPhone(storedSettings.get("companyPhone") ?? "");
      setEconomicCode(storedSettings.get("companyEconomicCode") ?? "");
      setLogoPreview(storedSettings.get("companyLogo") ?? null);
      setSealPreview(storedSettings.get("companySeal") ?? null);
      setSignaturePreview(storedSettings.get("companySignature") ?? null);
    } catch (e) {
      console.error("Failed to load settings.");
    }
  };

  useEffect(() => { void loadSettings(); }, []);

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
      if (logoPreview) {
        const savedLogo = await nativeDb.persistImage(logoPreview);
        await AsyncStorage.setItem("companyLogo", savedLogo ?? "");
        setLogoPreview(savedLogo ?? null);
      } else await AsyncStorage.removeItem("companyLogo");
      if (sealPreview) {
        const savedSeal = await nativeDb.persistImage(sealPreview);
        await AsyncStorage.setItem("companySeal", savedSeal ?? "");
        setSealPreview(savedSeal ?? null);
      } else await AsyncStorage.removeItem("companySeal");
      if (signaturePreview) {
        const savedSignature = await nativeDb.persistImage(signaturePreview);
        await AsyncStorage.setItem("companySignature", savedSignature ?? "");
        setSignaturePreview(savedSignature ?? null);
      } else await AsyncStorage.removeItem("companySignature");
      await nativeDb.requestCloudBackup();

      setExportAlertModal({
        show: true,
        title: "موفق",
        message: "تنظیمات با موفقیت ذخیره شد.",
        success: true,
      });
    } catch (e) {
      setExportAlertModal({
        show: true,
        title: "خطا",
        message: "مشکلی در ذخیره اطلاعات پیش آمد.",
      });
    }
  };

  const handleReset = () => {
    setPendingConfirmAction("reset");
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
    const action = pendingConfirmAction;
    setPendingConfirmAction(null);
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
          style={{ flex: 1 }}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
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



          <ScalePressable onPress={() => onNavigate("googleDriveSettings")}><LinearGradient colors={["#0f4c75","#3282b8"]} start={{x:0,y:0}} end={{x:1,y:1}} style={styles.card}><CustomText style={styles.label}>مدیریت Google Drive</CustomText><CustomText style={styles.cloudInfo}>ورود به حساب، تهیه نسخه پشتیبان و بازیابی اطلاعات</CustomText></LinearGradient></ScalePressable>
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

            <View style={styles.imageUploadsRow}>
              <ImageUpload
                wrapperStyle={styles.imageUploadItem}
                label="لوگو"
                labelStyle={styles.imageUploadLabel}
                value={logoPreview}
                onChange={setLogoPreview}
                onError={(message) =>
                  setExportAlertModal({ show: true, title: "خطا", message })
                }
                imageWidth={76}
                imageHeight={76}
                uploadText="انتخاب"
                removeText="حذف"
                uploadButtonStyle={styles.imageUploadButton}
                uploadTextStyle={styles.imageUploadText}
                previewBoxStyle={styles.imagePreviewBox}
                imageStyle={styles.imagePreview}
                removeButtonStyle={styles.imageRemoveButton}
                removeTextStyle={styles.imageRemoveText}
              />
              <ImageUpload
                wrapperStyle={styles.imageUploadItem}
                label="مهر"
                labelStyle={styles.imageUploadLabel}
                value={sealPreview}
                onChange={setSealPreview}
                onError={(message) =>
                  setExportAlertModal({ show: true, title: "خطا", message })
                }
                imageWidth={76}
                imageHeight={76}
                uploadText="انتخاب"
                removeText="حذف"
                uploadButtonStyle={styles.imageUploadButton}
                uploadTextStyle={styles.imageUploadText}
                previewBoxStyle={styles.imagePreviewBox}
                imageStyle={styles.imagePreview}
                removeButtonStyle={styles.imageRemoveButton}
                removeTextStyle={styles.imageRemoveText}
              />
              <ImageUpload
                wrapperStyle={styles.imageUploadItem}
                label="امضای مدیر"
                labelStyle={styles.imageUploadLabel}
                value={signaturePreview}
                onChange={setSignaturePreview}
                onError={(message) =>
                  setExportAlertModal({ show: true, title: "خطا", message })
                }
                imageWidth={76}
                imageHeight={76}
                uploadText="انتخاب"
                removeText="حذف"
                uploadButtonStyle={styles.imageUploadButton}
                uploadTextStyle={styles.imageUploadText}
                previewBoxStyle={styles.imagePreviewBox}
                imageStyle={styles.imagePreview}
                removeButtonStyle={styles.imageRemoveButton}
                removeTextStyle={styles.imageRemoveText}
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
          loading={exportAlertModal.loading}
          confirm={exportAlertModal.confirm}
          confirmText={exportAlertModal.confirmText}
          cancelText={exportAlertModal.cancelText}
          onConfirm={confirmReset}
          onClose={() => {
            setPendingConfirmAction(null);
            setExportAlertModal({ show: false, title: "", message: "" });
          }}
        />
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#eaf6fc",
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
  cloudInfo: {
    color: "#eaf6fc",
    fontSize: 12,
    lineHeight: 21,
    textAlign: "right",
    marginVertical: 7,
  },
  cloudAccount: {
    color: "#34d399",
    fontSize: 13,
    fontWeight: "700",
    textAlign: "right",
    marginVertical: 8,
  },
  cloudButton: {
    backgroundColor: "#10b981",
    borderRadius: 10,
    paddingVertical: 11,
    alignItems: "center",
    marginTop: 9,
  },
  cloudButtonSecondary: {
    backgroundColor: "#2563eb",
    borderRadius: 10,
    paddingVertical: 11,
    alignItems: "center",
    marginTop: 9,
  },
  cloudDisconnect: {
    backgroundColor: "#dc2626",
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: "center",
    marginTop: 9,
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
  imageUploadsRow: {
    flexDirection: "row-reverse",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 8,
    paddingHorizontal: 2,
    paddingVertical: 8,
  },
  imageUploadItem: {
    flex: 1,
    minWidth: 0,
    alignItems: "center",
  },
  imageUploadLabel: {
    width: "100%",
    color: "#ffffff",
    fontSize: 12,
    textAlign: "center",
    paddingHorizontal: 0,
    marginBottom: 6,
  },
  imageUploadButton: {
    width: 76,
    height: 76,
    alignSelf: "center",
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: "rgba(255,255,255,0.4)",
    borderStyle: "dashed",
    backgroundColor: "rgba(255,255,255,0.05)",
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
  },
  imageUploadText: {
    color: "#ffffff",
    fontSize: 12,
  },
  imagePreviewBox: {
    width: "100%",
    alignItems: "center",
    alignSelf: "center",
    backgroundColor: "rgba(255,255,255,0.05)",
    padding: 5,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.3)",
    borderStyle: "dashed",
    gap: 6,
    marginTop: 0,
  },
  imagePreview: {
    width: 76,
    height: 76,
    borderRadius: 8,
    resizeMode: "contain",
  },
  imageRemoveButton: {
    width: "100%",
    backgroundColor: "#ef4444",
    paddingVertical: 6,
    paddingHorizontal: 3,
    borderRadius: 8,
    alignItems: "center",
  },
  imageRemoveText: {
    color: "#ffffff",
    fontSize: 11,
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