import React, { useEffect, useState } from "react";
import { View, Pressable, Animated, StyleSheet, Platform, KeyboardAvoidingView } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Header from "../components/Header";
import ExportAlertModal from "../components/ExportAlertModal";
import AnimatedScrollWrapper from "../components/AnimatedScrollWrapper";
import CustomText from "../components/CustomText";
import { getConnectedGoogleAccount, connectGoogleAccount, disconnectGoogleAccount } from "../services/googleAuth";
import type { GoogleAccount } from "../services/googleAuth";
import { createDriveBackup, downloadLatestDriveBackup, getLatestDriveBackupInfo } from "../services/googleDrive";
import { nativeDb } from "../services/database";


type ScalePressableProps = React.PropsWithChildren<{
  onPress: () => void;
  disabled?: boolean;
  style?: any;
}>;

function ScalePressable({ children, onPress, disabled, style }: ScalePressableProps) {
  const scale = React.useRef(new Animated.Value(1)).current;
  const animateScale = (toValue: number) => {
    Animated.spring(scale, {
      toValue,
      useNativeDriver: true,
      speed: 30,
      bounciness: 4,
    }).start();
  };

  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <Pressable
        onPress={onPress}
        disabled={disabled}
        onPressIn={() => animateScale(0.97)}
        onPressOut={() => animateScale(1)}
        style={style}
      >
        {children}
      </Pressable>
    </Animated.View>
  );
}

interface GoogleDriveSettingsScreenProps { onNavigate: (screen: string) => void; onDataRestored: () => Promise<void>; }

export default function GoogleDriveSettingsScreen({ onNavigate, onDataRestored }: GoogleDriveSettingsScreenProps) {
const [googleAccount,setGoogleAccount]=useState<GoogleAccount|null>(()=>getConnectedGoogleAccount());
const [googleBusy,setGoogleBusy]=useState(false);
const [cloudOperationCompleted,setCloudOperationCompleted]=useState(false);
const [localDriveDataInitialized,setLocalDriveDataInitialized]=useState<boolean|null>(null);
const [cloudConflictPending,setCloudConflictPending]=useState(false);
const [pendingConfirmAction,setPendingConfirmAction]=useState<"restore"|"createDrive"|"overwriteDrive"|"disconnect"|null>(null);
const [exportAlertModal,setExportAlertModal]=useState<{show:boolean;title:string;message:string;success?:boolean;error?:boolean;loading?:boolean;confirm?:boolean;confirmText?:string;cancelText?:string}>({show:false,title:"",message:""});

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

  useEffect(() => { void loadLocalDriveState(); }, []);

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

  };


const handleClose=()=>onNavigate("settings");
return (<View style={styles.container}><Header title="مدیریت Google Drive" onBack={handleClose} iconName="arrow-back"/>
<KeyboardAvoidingView style={{flex:1}} behavior={Platform.OS==="ios"?"padding":undefined}>
<AnimatedScrollWrapper contentContainerStyle={styles.scrollContent} delay={0}>
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
                    <ScalePressable style={styles.cloudButtonSecondary} onPress={handlePrepareOverwriteDrive} disabled={googleBusy}>
                      <CustomText style={styles.btnText}>
                        ایجاد نسخه پشتیبان در Google Drive
                      </CustomText>
                    </ScalePressable>
                    <ScalePressable style={styles.cloudButtonSecondary} onPress={handlePrepareRestore} disabled={googleBusy}>
                      <CustomText style={styles.btnText}>
                        دریافت نسخه پشتیبان از Google Drive
                      </CustomText>
                    </ScalePressable>
                  </>
                )}
                <ScalePressable style={styles.cloudDisconnect} onPress={handleGoogleDisconnect} disabled={googleBusy}>
                  <CustomText style={styles.btnText}> خروج از حساب </CustomText>
                </ScalePressable>
              </>
            ) : (
              <ScalePressable style={styles.cloudButton} onPress={handleGoogleConnect} disabled={googleBusy}>
                <CustomText style={styles.btnText}>
                  {googleBusy ? "در حال اتصال..." : "ورود به حساب Google Drive"}
                </CustomText>
              </ScalePressable>
            )}
          </LinearGradient>
</AnimatedScrollWrapper>
<ExportAlertModal visible={exportAlertModal.show} title={exportAlertModal.title} message={exportAlertModal.message} success={exportAlertModal.success} error={exportAlertModal.error} loading={exportAlertModal.loading} confirm={exportAlertModal.confirm} confirmText={exportAlertModal.confirmText} cancelText={exportAlertModal.cancelText} onConfirm={confirmReset} onClose={()=>{setPendingConfirmAction(null);setExportAlertModal({show:false,title:"",message:""});}}/>
</KeyboardAvoidingView></View>);
}
const styles=StyleSheet.create({
container:{flex:1,backgroundColor:"#eaf6fc",position:"absolute",top:0,left:0,right:0,bottom:0,zIndex:100},
scrollContent:{paddingVertical:10,paddingHorizontal:15,paddingBottom:400},
label:{fontSize:14,fontWeight:"700",color:"#ffffff",textAlign:"right",marginBottom:3,paddingHorizontal:10},card:{borderRadius:20,paddingVertical:10,paddingHorizontal:15,marginBottom:20,elevation:8,shadowColor:"#0d2b43",shadowOffset:{width:0,height:8},shadowOpacity:0.2,shadowRadius:12,borderWidth:1,borderColor:"#a2c8e2"},
cloudInfo:{color:"#eaf6fc",fontSize:12,lineHeight:21,textAlign:"right",marginVertical:7},cloudAccount:{color:"#34d399",fontSize:13,fontWeight:"700",textAlign:"right",marginVertical:8},
cloudButton:{backgroundColor:"#10b981",borderRadius:10,paddingVertical:11,alignItems:"center",marginTop:9},cloudButtonSecondary:{backgroundColor:"#2563eb",borderRadius:10,paddingVertical:11,alignItems:"center",marginTop:9},cloudDisconnect:{backgroundColor:"#dc2626",borderRadius:10,paddingVertical:10,alignItems:"center",marginTop:9},btnText:{color:"#fff",fontSize:14}});