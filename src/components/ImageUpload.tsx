import React from "react";
import { Image, StyleProp, StyleSheet, TextStyle, TouchableOpacity, View, ViewStyle, ImageStyle } from "react-native";
import * as ImagePicker from "expo-image-picker";
import CustomText from "./CustomText";

type ImageUploadProps = {
  label: string; value: string | null | undefined; onChange: (image: string | null) => void;
  onError?: (message: string) => void; aspect?: [number, number] | null; quality?: number;
  encodeBase64?: boolean; imageWidth?: number; imageHeight?: number; allowEditing?: boolean;
  uploadText?: string; removeText?: string; labelStyle?: StyleProp<TextStyle>;
  uploadButtonStyle?: StyleProp<ViewStyle>; uploadTextStyle?: StyleProp<TextStyle>;
  previewBoxStyle?: StyleProp<ViewStyle>; imageStyle?: StyleProp<ImageStyle>;
  removeButtonStyle?: StyleProp<ViewStyle>; removeTextStyle?: StyleProp<TextStyle>;
  wrapperStyle?: StyleProp<ViewStyle>;
};
export default function ImageUpload({
  label, value, onChange, onError, aspect = [1, 1], quality = 0.6,
  encodeBase64 = false, imageWidth = 120, imageHeight = 120, allowEditing = true,
  uploadText = "انتخاب فایل", removeText = "حذف تصویر", labelStyle, uploadButtonStyle,
  uploadTextStyle, previewBoxStyle, imageStyle, removeButtonStyle, removeTextStyle, wrapperStyle,
}: ImageUploadProps) {
  const handleSelect = async () => {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) { onError?.("برای انتخاب تصویر، دسترسی به گالری تصاویر را فعال کنید."); return; }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"], allowsEditing: allowEditing, ...(aspect ? { aspect } : {}), quality, base64: encodeBase64,
      });
      if (result.canceled || !result.assets?.[0]?.uri) return;
      const asset = result.assets[0];
      const selectedImage = encodeBase64 && asset.base64
        ? `data:image/jpeg;base64,${asset.base64}` : asset.uri;
      onChange(selectedImage);
    } catch { onError?.("انتخاب تصویر انجام نشد. لطفاً دوباره تلاش کنید."); }
  };
  return (
    <View style={wrapperStyle}>
      <CustomText style={[styles.label, labelStyle]}>{label}</CustomText>
      {value ? (
        <View style={[styles.previewBox, previewBoxStyle]}>
          <Image source={{ uri: value }} style={[styles.previewImage, { width: imageWidth, height: imageHeight }, imageStyle]} resizeMode="contain" />
          <TouchableOpacity activeOpacity={0.8} style={[styles.removeButton, removeButtonStyle]} onPress={() => onChange(null)}>
            <CustomText style={[styles.removeText, removeTextStyle]}>{removeText}</CustomText>
          </TouchableOpacity>
        </View>
      ) : (
        <TouchableOpacity activeOpacity={0.7} style={[styles.uploadButton, uploadButtonStyle]} onPress={handleSelect}>
          <CustomText style={[styles.uploadText, uploadTextStyle]}>{uploadText}</CustomText>
        </TouchableOpacity>
      )}
    </View>
  );
}
const styles = StyleSheet.create({
  label: { fontSize: 14, fontWeight: "700", color: "#ffffff", textAlign: "right", marginBottom: 6, paddingHorizontal: 10 },
  uploadButton: { width: 120, height: 120, borderWidth: 1.5, borderColor: "rgba(255,255,255,0.4)", borderStyle: "dashed", borderRadius: 15, backgroundColor: "rgba(255,255,255,0.05)", justifyContent: "center", alignItems: "center", alignSelf: "center" },
  uploadText: { color: "#ffffff", fontSize: 14 },
  previewBox: { alignItems: "center", alignSelf: "center", backgroundColor: "rgba(255,255,255,0.05)", padding: 15, borderRadius: 18, borderWidth: 1, borderColor: "rgba(255,255,255,0.3)", borderStyle: "dashed", gap: 12 },
  previewImage: { borderRadius: 10 },
  removeButton: { backgroundColor: "#ef4444", paddingVertical: 8, paddingHorizontal: 18, borderRadius: 10 },
  removeText: { color: "#ffffff", fontSize: 14 },
});