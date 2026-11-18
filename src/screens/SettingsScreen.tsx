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
import { connectGoogleAccount, disconnectGoogleAccount, getConnectedGoogleAccount } from "../services/googleAuth";
import type { GoogleAccount } from "../services/googleAuth";
import { createDriveBackup, downloadLatestDriveBackup, getLatestDriveBackupInfo } from "../services/googleDrive";
import { nativeDb } from "../services/database";

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
  const scrollRef = useRef<AnimatedScrollWrapperRef>(null);

  const [theme, setTheme] = useState("blue");
  const [companyName, setCompanyName] = useState("");
  const [companyAddress, setCompanyAddress] = useState("");
  const [companyPhone, setCompanyPhone] = useState("");
  const [economicCode, setEconomicCode] = useState("");
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [sealPreview, setSealPreview] = useState<string | null>(null);
  const [signaturePreview, setSignaturePreview] = useState<string | null>(null);
  const [googleAccount, setGoogleAccount] = useState<GoogleAccount | null>(
    () => getConnectedGoogleAccount(),
  );
  const [googleBusy, setGoogleBusy] = useState(false);
  const [cloudOperationCompleted, setCloudOperationCompleted] = useState(false);
  const [localDriveDataInitialized, setLocalDriveDataInitialized] = useState<boolean | null>(null);
  const [cloudConflictPending, setCloudConflictPending] = useState(false);
  const [pendingConfirmAction, setPendingConfirmAction] = useState<
    "reset" | "restore" | "createDrive" | "overwriteDrive" | "disconnect" | null
  >(null);
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

  const hasCloudSnapshotContent = (
    snapshot: Awaited<ReturnType<typeof nativeDb.exportCloudSnapshot>>,
  ): boolean =>
    snapshot.customers.length > 0 ||
    snapshot.invoices.length > 0 ||
    snapshot.payments.length > 0 ||
    Object.entries(snapshot.settings ?? {}).some(
      ([key, value]) => key !== "invoiceTheme" && value.trim().length > 0,
    );

  const loadLocalDriveState = async () => {
    const account = googleAccount;
    if (!account) {
      setCloudOperationCompleted(false);
      setLocalDriveDataInitialized(null);
      setCloudConflictPending(false);
      return;
    }

    try {
      const completionKey =
        "cloudOperationCompleted:" + (account.email ?? "default");
      const [localDataReady, completed] = await Promise.all([
        AsyncStorage.getItem("localDriveDataInitialized"),
        AsyncStorage.getItem(completionKey),
      ]);
      const isLocalDataReady =
        localDataReady === "true" || completed === "true";
      setLocalDriveDataInitialized(isLocalDataReady);
      setCloudOperationCompleted(isLocalDataReady);
      setCloudConflictPending(false);
    } catch {
      setLocalDriveDataInitialized(false);
      setCloudOperationCompleted(false);
      setCloudConflictPending(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      void loadLocalDriveState();
    }, 300);
    return () => clearTimeout(timer);
  }, []);

  const handleGoogleConnect = async () => {
    setLocalDriveDataInitialized(null);
    setGoogleBusy(true);
    try {
      const account = await connectGoogleAccount();
      setGoogleAccount(account);
      // Preserve local-first behavior for this device and resume the already
      // enabled automatic backup without querying Drive for existing data.
      const completionKey = `cloudOperationCompleted:${account.email ?? "default"}`;
      const [localDataReady, completed] = await Promise.all([
        AsyncStorage.getItem("localDriveDataInitialized"),
        AsyncStorage.getItem(completionKey),
      ]);
      const isLocalDataReady =
        localDataReady === "true" || completed === "true";
      setLocalDriveDataInitialized(isLocalDataReady);
      setCloudOperationCompleted(isLocalDataReady);
      setCloudConflictPending(false);
      if (isLocalDataReady) {
        await AsyncStorage.setItem("localDriveDataInitialized", "true");
        await nativeDb.initializeCloudBackupSafety();
      } else {
        await nativeDb.setCloudBackupHold(true);
      }
    } catch {
      setExportAlertModal({ show: true, title: "خطا", message: "خطا در ورود به حساب Google Drive", error: true });
    } finally {
      setGoogleBusy(false);
    }
  };

  const handleGoogleDisconnect = () => {
    setPendingConfirmAction("disconnect");
    setExportAlertModal({
      show: true,
      title: "خروج از حساب Google Drive",
      message: "آیا مطمئن هستید که می‌خواهید از حساب Google Drive خارج شوید؟",
      confirm: true,
      confirmText: "خروج از حساب",
      cancelText: "انصراف",
    });
  };

  const handlePrepareRestore = async () => {
    setCloudOperationCompleted(false);
    setGoogleBusy(true);
    setExportAlertModal({
      show: true,
      title: "در حال بررسی نسخه پشتیبان",
      message: "لطفاً تا دریافت اطلاعات Google Drive صبر کنید.",
      loading: true,
    });
    try {
      const backup = await getLatestDriveBackupInfo();
      if (!backup) {
        throw new Error("هنوز نسخه پشتیبانی در Google Drive وجود ندارد.");
      }
      setPendingConfirmAction("restore");
      setExportAlertModal({
        show: true,
        title: "جایگزینی اطلاعات گوشی با نسخه Google Drive",
        message:
          "هشدار مهم: با تأیید، تمام اطلاعات فعلی این دستگاه از جمله مشتریان، فاکتورها، دریافتی‌ها، تصاویر و تنظیمات پاک می‌شود و نسخه Google Drive جایگزین آن خواهد شد. این عملیات قابل بازگشت نیست.",
        confirm: true,
        confirmText: "بازیابی اطلاعات",
        cancelText: "انصراف",
      });
    } catch (error) {
      setExportAlertModal({ show: true, title: "خطا", message: error instanceof Error ? error.message : "نسخه پشتیبان پیدا نشد.", error: true });
    } finally {
      setGoogleBusy(false);
    }
  };

  const handlePrepareOverwriteDrive = async () => {
    setCloudOperationCompleted(false);
    setGoogleBusy(true);
    setExportAlertModal({
      show: true,
      title: "در حال بررسی Google Drive",
      message: "لطفاً تا بررسی وضعیت نسخه پشتیبان صبر کنید.",
      loading: true,
    });
    try {
      const backup = await getLatestDriveBackupInfo();
      if (!backup) {
        const snapshot = await nativeDb.exportCloudSnapshot();
        if (!hasCloudSnapshotContent(snapshot)) {
          throw new Error("اطلاعاتی برای تهیه نسخه پشتیبان وجود ندارد.");
        }
        setPendingConfirmAction("createDrive");
        setExportAlertModal({
          show: true,
          title: "ایجاد نسخه پشتیبان",
          message: "نسخه پشتیبان اطلاعات این دستگاه در Google Drive ایجاد شود؟",
          confirm: true,
          confirmText: "ایجاد نسخه پشتیبان",
          cancelText: "انصراف",
        });
        return;
      }
      setPendingConfirmAction("overwriteDrive");
      setExportAlertModal({
        show: true,
        title: "جایگزینی نسخه Google Drive با اطلاعات گوشی",
        message:
          "هشدار مهم: با تأیید، تمام محتوای فایل پشتیبان فعلی Google Drive پاک و با اطلاعات همین دستگاه جایگزین می‌شود. نسخه قبلی قابل بازیابی نخواهد بود.",
        confirm: true,
        confirmText: "جایگزینی کامل فایل Drive",
        cancelText: "انصراف",
      });
    } catch (error) {
      setExportAlertModal({ show: true, title: "خطا", message: error instanceof Error ? error.message : "بررسی نسخه Drive انجام نشد.", error: true });
    } finally {
      setGoogleBusy(false);
    }
  };

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

  useEffect(() => {
    const timer = setTimeout(() => {
      void loadSettings();
    }, 300);
    return () => clearTimeout(timer);
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

    if (action === "disconnect") {
      setGoogleBusy(true);
      try {
        await disconnectGoogleAccount();
        await AsyncStorage.removeItem(`cloudOperationCompleted:${googleAccount?.email ?? "default"}`);
        setCloudOperationCompleted(false);
        setGoogleAccount(null);
        setCloudConflictPending(false);
      } catch {
        setExportAlertModal({ show: true, title: "خطا", message: "خطا در خروج از حساب Google Drive", error: true });
      } finally {
        setGoogleBusy(false);
      }
      return;
    }

    if (action === "restore") {
      setGoogleBusy(true);
      try {
        setExportAlertModal({
          show: true,
          title: "در حال دریافت نسخه پشتیبان",
          message: "لطفاً تا پایان دریافت و بازیابی اطلاعات صبر کنید.",
          loading: true,
        });
        await nativeDb.setCloudBackupHold(true);
        const snapshot = await downloadLatestDriveBackup();
        const hasBackupContent =
          snapshot.customers.length > 0 ||
          snapshot.invoices.length > 0 ||
          snapshot.payments.length > 0 ||
          Object.entries(snapshot.settings ?? {}).some(
            ([key, value]) => key !== "invoiceTheme" && typeof value === "string" && value.trim().length > 0,
          );
        if (!hasBackupContent) throw new Error("این فایل پشتیبان خالی است؛ برای جلوگیری از جایگزینی اطلاعات، بازیابی متوقف شد.");
        await nativeDb.restoreCloudSnapshot(snapshot);
        await loadSettings();
        await onDataRestored();
        await nativeDb.completeCloudRestore();
        await AsyncStorage.setItem("localDriveDataInitialized", "true");
        await AsyncStorage.setItem(`cloudOperationCompleted:${googleAccount?.email ?? "default"}`, "true");
        setLocalDriveDataInitialized(true);
        setCloudConflictPending(false);
        setCloudOperationCompleted(true);
        setExportAlertModal({ show: true, title: "موفق", message: "بازیابی اطلاعات از Google Drive با موفقیت انجام شد.", success: true });
      } catch (error) {
        setExportAlertModal({ show: true, title: "خطا", message: error instanceof Error ? error.message : "بازیابی نسخه پشتیبان انجام نشد.", error: true });
      } finally {
        setGoogleBusy(false);
      }
      return;
    }

    if (action === "createDrive" || action === "overwriteDrive") {
      setGoogleBusy(true);
      try {
        await nativeDb.setCloudBackupHold(true);
        const snapshot = await nativeDb.exportCloudSnapshot();
        if (!hasCloudSnapshotContent(snapshot)) {
          throw new Error("اطلاعات محلی خالی است؛ برای جلوگیری از ساخت بکاپ خالی، فایل Drive جایگزین نشد.");
        }
        setExportAlertModal({
          show: true,
          title: "در حال ایجاد نسخه پشتیبان",
          message: "لطفاً تا پایان ایجاد نسخه پشتیبان صبر کنید.",
          loading: true,
        });
        const file = await createDriveBackup(snapshot);
        await nativeDb.completeCloudBackup(snapshot);
        await AsyncStorage.setItem("localDriveDataInitialized", "true");
        await AsyncStorage.setItem(`cloudOperationCompleted:${googleAccount?.email ?? "default"}`, "true");
        setLocalDriveDataInitialized(true);
        setCloudConflictPending(false);
        setCloudOperationCompleted(true);
        setExportAlertModal({
          show: true,
          title: "موفق",
          message: action === "createDrive"
            ? "نسخه پشتیبان در Google Drive با موفقیت ایجاد شد."
            : "نسخه Google Drive با اطلاعات این دستگاه با موفقیت جایگزین شد.",
          success: true,
        });
      } catch (error) {
        // If auto backup was already enabled, let it resume after a failed manual upload.
        // The persistent enable flag still prevents first-time activation here.
        await nativeDb.setCloudBackupHold(false);
        setExportAlertModal({ show: true, title: "خطا", message: error instanceof Error ? error.message : "جایگزینی نسخه Drive انجام نشد.", error: true });
      } finally {
        setGoogleBusy(false);
      }
      return;
    }

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
            <CustomText style={styles.label}>
              اتصال به Google Drive و پشتیبان‌گیری
            </CustomText>
            {!googleAccount && (
              <CustomText style={styles.cloudInfo}>
                در صورت خطا در اتصال به Google Drive فقط برای ورود اولیه به حساب از VPN استفاده کنید؛ برای ادامه پشتیبان‌گیری نیازی به VPN نیست.
              </CustomText>
            )}
            {googleAccount ? (
              <>
                <CustomText style={styles.cloudAccount}>
                  متصل:{" "}
                  {googleAccount.email ?? googleAccount.name ?? "حساب گوگل"}
                </CustomText>
                {localDriveDataInitialized === false && (
                  <>
                    <TouchableOpacity
                      style={styles.cloudButtonSecondary}
                      onPress={handlePrepareOverwriteDrive}
                      disabled={googleBusy}
                    >
                      <CustomText style={styles.btnText}>
                        ایجاد نسخه پشتیبان در Google Drive
                      </CustomText>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.cloudButtonSecondary}
                      onPress={handlePrepareRestore}
                      disabled={googleBusy}
                    >
                      <CustomText style={styles.btnText}>
                        دریافت نسخه پشتیبان از Google Drive
                      </CustomText>
                    </TouchableOpacity>
                  </>
                )}
                <TouchableOpacity
                  style={styles.cloudDisconnect}
                  onPress={handleGoogleDisconnect}
                  disabled={googleBusy}
                >
                  <CustomText style={styles.btnText}> خروج از حساب </CustomText>
                </TouchableOpacity>
              </>
            ) : (
              <TouchableOpacity
                style={styles.cloudButton}
                onPress={handleGoogleConnect}
                disabled={googleBusy}
              >
                <CustomText style={styles.btnText}>
                  {googleBusy ? "در حال اتصال..." : "ورود به حساب Google Drive"}
                </CustomText>
              </TouchableOpacity>
            )}
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
              <ImageUpload
                label="لوگوی شرکت :"
                value={logoPreview}
                onChange={setLogoPreview}
                onError={(message) =>
                  setExportAlertModal({ show: true, title: "خطا", message })
                }
                imageWidth={130}
                imageHeight={130}
                uploadText="انتخاب لوگو"
                removeText="حذف لوگو"
                uploadButtonStyle={styles.logoUploadBtn}
                uploadTextStyle={styles.logoUploadText}
                previewBoxStyle={styles.logoPreviewBox}
                imageStyle={styles.logoPreviewImg}
                removeButtonStyle={styles.logoRemoveBtn}
                removeTextStyle={styles.logoRemoveBtnText}
              />
            </View>
            <View style={styles.inputGroup}>
              <ImageUpload
                label="مهر شرکت :"
                value={sealPreview}
                onChange={setSealPreview}
                onError={(message) =>
                  setExportAlertModal({ show: true, title: "خطا", message })
                }
                imageWidth={130}
                imageHeight={130}
                uploadText="انتخاب مهر"
                removeText="حذف مهر"
                uploadButtonStyle={styles.logoUploadBtn}
                uploadTextStyle={styles.logoUploadText}
                previewBoxStyle={styles.logoPreviewBox}
                imageStyle={styles.logoPreviewImg}
                removeButtonStyle={styles.logoRemoveBtn}
                removeTextStyle={styles.logoRemoveBtnText}
              />
            </View>
            <View style={styles.inputGroup}>
              <ImageUpload
                label="امضای مدیر :"
                value={signaturePreview}
                onChange={setSignaturePreview}
                onError={(message) =>
                  setExportAlertModal({ show: true, title: "خطا", message })
                }
                imageWidth={130}
                imageHeight={130}
                uploadText="انتخاب امضا"
                removeText="حذف امضا"
                uploadButtonStyle={styles.logoUploadBtn}
                uploadTextStyle={styles.logoUploadText}
                previewBoxStyle={styles.logoPreviewBox}
                imageStyle={styles.logoPreviewImg}
                removeButtonStyle={styles.logoRemoveBtn}
                removeTextStyle={styles.logoRemoveBtnText}
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