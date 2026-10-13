import React, { useState, useEffect, useRef } from "react";
import * as ImagePicker from "expo-image-picker"; 
import {
  View,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Platform,
  Image,
  Modal,
  Animated,
  Dimensions
} from "react-native";
import {
  toPersianDigits,formatNumber,parseNumber,convertNumberToPersianWords,
} from "../utils/numberUtils";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import AnimatedScrollWrapper, { AnimatedScrollWrapperRef } from '../components/AnimatedScrollWrapper';
import Header from '../components/Header';
import CustomText from '../components/CustomText';
import CustomTextInput from '../components/CustomTextInput';
import { getNextCustomerCode } from "../storage/customerStorage";

export default function AccountScreen({
  onNavigate = (screen: string) => {},
  onSave = async (data: any) => true,
  customerToEdit = null,
  existingCustomers = [],
  returnScreen = "dashboard",
}: any) {
  const scrollRef = useRef<AnimatedScrollWrapperRef>(null);
  const [customerName, setCustomerName] = useState(customerToEdit?.name || "");
  const [address, setAddress] = useState(customerToEdit?.address || "");
  const [phone, setPhone] = useState(customerToEdit?.phone || "");
  const [economicCode, setEconomicCode] = useState(customerToEdit?.economicCode || "");
  const [profilePreview, setProfilePreview] = useState(customerToEdit?.avatar || "");

  // استیت مودال هشدار
  const [alertModal, setAlertModal] = useState({
    show: false,
    title: "",
    message: "",
  });

  useEffect(() => {
    if (customerToEdit) {
      setCustomerName(customerToEdit.name || "");
      setAddress(customerToEdit.address || "");
      setPhone(customerToEdit.phone || "");
      setEconomicCode(customerToEdit.economicCode || "");
      setProfilePreview(customerToEdit.avatar || "");
    } else {
      setCustomerName("");
      setAddress("");
      setPhone("");
      setEconomicCode("");
      setProfilePreview("");
    }
  }, [customerToEdit]);

  const handleClose = () => {
      onNavigate(returnScreen);
  };

  const handleProfilePicPress = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permissionResult.granted) {
      setAlertModal({
        show: true,
        title: "دسترسی به گالری",
        message: "برای انتخاب عکس، دسترسی به گالری تصاویر را فعال کنید.",
      });
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets?.[0]?.uri) {
      setProfilePreview(result.assets[0].uri);
    }
  };

  const handleSave = async () => {
    const trimmedName = customerName.trim();
    if (!trimmedName) {
      setAlertModal({
        show: true,
        title: "خطای ورودی",
        message: "لطفاً نام مشتری را وارد نمایید.",
      });
      return;
    }

    const isDuplicate = existingCustomers.some((c: any) => {
      if (customerToEdit && String(c.id) === String(customerToEdit.id)) {
        return false;
      }
      return (
        c.name && c.name.trim().toLowerCase() === trimmedName.toLowerCase()
      );
    });

    if (isDuplicate) {
      setAlertModal({
        show: true,
        title: "نام تکراری",
        message: `مشتری با نام «${trimmedName}» قبلاً ثبت شده است. امکان ذخیره نام تکراری وجود ندارد.`,
      });
      return;
    }

    const customerData = {
      id: customerToEdit ? customerToEdit.id : Date.now(),
      customerCode: customerToEdit?.customerCode ?? await getNextCustomerCode(),
      name: trimmedName,
      address: address,
      phone: phone,
      economicCode: economicCode,
      avatar: profilePreview,
    };

    const success = await onSave(customerData);
    if (success !== false) {
      onNavigate("customers");
    }
  };

  return (
   <View style={styles.overlay}>
{/* هدر صفحه */}
      <Header
        title={
          customerToEdit
            ? `ویرایش حساب - کد مشتری: ${toPersianDigits(customerToEdit.customerCode ?? customerToEdit.id ?? "۱")}`
            : "ثبت حساب جدید"
        }
        onBack={handleClose}
        iconName="arrow-back"
      />

      {/* محتوای فرم */}
   <AnimatedScrollWrapper
        ref={scrollRef}
        style={{ flex: 1 }} 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <LinearGradient
          colors={["#0f4c75", "#3282b8"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.formCard}
        >
          {/* نام مشتری */}
          <View style={styles.inputGroup}>
            <CustomText style={styles.label}>نام مشتری / شرکت :</CustomText>
            <CustomTextInput
              style={styles.input}
              placeholder="شرکت..."
              placeholderTextColor="#b3d4e6"
              value={customerName}
              onChangeText={setCustomerName}
            />
          </View>

          {/* آدرس */}
          <View style={styles.inputGroup}>
            <CustomText style={styles.label}>آدرس :</CustomText>
            <CustomTextInput
              style={styles.input}
              placeholder="استان، شهر، خیابان..."
              placeholderTextColor="#b3d4e6"
              value={address}
              onChangeText={setAddress}
            />
          </View>

          {/* شماره تماس */}
          <View style={styles.inputGroup}>
            <CustomText style={styles.label}>شماره تماس :</CustomText>
            <CustomTextInput
              style={styles.input} 
              placeholder=" 0912... "
              placeholderTextColor="#b3d4e6"
              keyboardType="phone-pad"
              value={phone}
              onChangeText={(text: string) => setPhone(toPersianDigits(text))}
            />
          </View>

          {/* کد اقتصادی */}
          <View style={styles.inputGroup}>
            <CustomText style={styles.label}>کد اقتصادی :</CustomText>
            <CustomTextInput
              style={styles.input} 
              placeholder=" 0 "
              placeholderTextColor="#b3d4e6"
              keyboardType="numeric"
              value={economicCode}
              onChangeText={(text: string) => setEconomicCode(toPersianDigits(text))}
            />
          </View>

          {/* آپلود عکس */}
          <View style={styles.profileUploadGroup}>
            <CustomText style={styles.label}>عکس پروفایل :</CustomText>
            <View style={styles.profileUploadWrapper}>
              {profilePreview ? (
                <View style={styles.previewBox}>
                  <Image
                    source={{ uri: profilePreview }}
                    style={styles.previewImg}
                  />
                  <TouchableOpacity
                    activeOpacity={0.8}
                    style={styles.removeBtn}
                    onPress={() => setProfilePreview("")}
                  >
                    <CustomText style={styles.removeBtnText}>حذف تصویر</CustomText>
                  </TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity
                  activeOpacity={0.7}
                  style={styles.customFileUpload}
                  onPress={handleProfilePicPress}
                >
                  <CustomText style={styles.uploadTextIndicator}>انتخاب فایل</CustomText>
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* دکمه اکشن */}
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={handleSave}
            style={styles.btnSaveWrapper}
          >
            <LinearGradient
              colors={["#10b981", "#059669"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.btnSave}
            >
              <CustomText style={styles.btnSaveText}>
                {customerToEdit ? "ویرایش اطلاعات" : "ذخیره اطلاعات"}
              </CustomText>
            </LinearGradient>
          </TouchableOpacity>
        </LinearGradient>
      </AnimatedScrollWrapper>

      {/* مودال هشدار خروجی/تکراری بودن نام */}
      <Modal
        visible={alertModal.show}
        transparent={true}
        animationType="fade"
        onRequestClose={() =>
          setAlertModal({ show: false, title: "", message: "" })
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
              <Ionicons name="warning-outline" size={32} color="#f59e0b" />
            </View>
            <CustomText style={styles.alertTitle}>{alertModal.title}</CustomText>
            <CustomText style={styles.alertMessage}>{alertModal.message}</CustomText>

            <TouchableOpacity
              activeOpacity={0.8}
              style={styles.alertBtn}
              onPress={() =>
                setAlertModal({ show: false, title: "", message: "" })
              }
            >
              <CustomText style={styles.alertBtnText}>متوجه شدم</CustomText>
            </TouchableOpacity>
          </LinearGradient>
        </View>
      </Modal>

    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "#eaf6fc",
  },
 
scrollContent: {
  flexGrow: 1,
  paddingVertical: 10,
  paddingHorizontal: 15,
  paddingBottom: 400,
},
  formCard: {
    borderRadius: 20,
    paddingVertical: 10,
    paddingHorizontal: 15,
    elevation: 5,
    shadowColor: "#0d2b43",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    borderWidth: 1,
    borderColor: "#a2c8e2",
  },
  inputGroup: {
    paddingHorizontal: 5,
    paddingVertical: 5,
  },
  label: {
    fontSize: 14, 
    fontWeight: "700",
    color: "#ffffff",
    textAlign: "right",
    marginBottom: 3,
    paddingHorizontal: 10,
  },
  input: {
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderWidth: 2,
    borderColor: "rgba(255, 255, 255, 0.3)",
    borderRadius: 10,
    paddingVertical: 7,
    paddingHorizontal: 10,
    fontSize: 14,
    color: "#ffffff",
    // textAlign: "right", 
  },
  profileUploadGroup: {
    alignItems: "center",
    marginTop: 8,
    marginBottom: 15,
  },
  profileUploadWrapper: {
    justifyContent: "center",
    alignItems: "center",
    width: "100%",
  },
  customFileUpload: {
    width: 120,
    height: 120,
    borderWidth: 1,
    borderColor: "#a2c8e2",
    borderStyle: "dashed",
    borderRadius: 15,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    justifyContent: "center",
    alignItems: "center",
  },
  uploadTextIndicator: {
    color: "#b3d4e6",
    fontSize: 13, 
    fontWeight: "500",
  },
  previewBox: {
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    padding: 18,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.3)",
    borderStyle: "dashed",
    gap: 15,
  },
  previewImg: {
    width: 120,
    height: 120,
    borderRadius: 15,
  },
  removeBtn: {
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
  removeBtnText: {
    color: "#ffffff",
    fontSize: 14,
  },
  btnSaveWrapper: {
    width: "60%",
    alignSelf: "center",
    marginBottom: 10,
  },
  btnSave: {
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#ffffff",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#10b981",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
    elevation: 5,
  },
  btnSaveText: {
    color: "#ffffff",
    fontSize: 14, 
    fontWeight: "900",
  },
  alertOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    justifyContent: "center",
    alignItems: "center",
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
  alertBtn: {
    width: "70%",
    backgroundColor: "#145d8e",
    paddingVertical: 12,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  alertBtnText: {
    color: "#ffffff",
    fontSize: 16, 
    fontWeight: "bold",
  },
});