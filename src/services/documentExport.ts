import { Alert, NativeModules, PermissionsAndroid, Platform, View } from "react-native";
import * as FileSystem from "expo-file-system/legacy";
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import { captureRef } from "react-native-view-shot";

type ExportFormat = "png" | "pdf";
type ExportAction = "share" | "save";

type ExportOptions = {
  viewRef: { current: View | null };
  format: ExportFormat;
  action: ExportAction;
  filename: string;
};

type DocumentExportNativeModule = {
  saveFile(base64: string, filename: string, mimeType: string): Promise<string>;
};

const EXPORT_FOLDER_NAME = "Hadi factor";
const DocumentExportModule =
  NativeModules.DocumentExportModule as DocumentExportNativeModule | undefined;

const safeFilename = (name: string) =>
  name.replace(/[\\/:*?"<>|]/g, "-").replace(/\s+/g, "-");

async function ensureLegacyStoragePermission(): Promise<void> {
  if (Platform.OS !== "android" || Number(Platform.Version) >= 29) return;

  const permission = PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE;
  const result = await PermissionsAndroid.request(permission, {
    title: "دسترسی ذخیره فایل",
    message: "برای ذخیره عکس و PDF در پوشه Download به دسترسی حافظه نیاز است.",
    buttonPositive: "اجازه دادن",
    buttonNegative: "لغو",
  });

  if (result !== PermissionsAndroid.RESULTS.GRANTED) {
    throw new Error("اجازه ذخیره فایل در حافظه عمومی داده نشد.");
  }
}

export async function exportViewFile({
  viewRef,
  format,
  action,
  filename,
}: ExportOptions): Promise<void> {
  try {
    if (!viewRef.current) {
      throw new Error("محتوای خروجی در دسترس نیست.");
    }

    const imageUri = await captureRef(viewRef.current, {
      format: "png",
      quality: 1,
      result: "tmpfile",
    });

    let fileUri = imageUri;
    let mimeType = "image/png";
    let extension = "png";

    if (format === "pdf") {
      const imageBase64 = await FileSystem.readAsStringAsync(imageUri, {
        encoding: FileSystem.EncodingType.Base64,
      });
      const pdf = await Print.printToFileAsync({
        html: `<!doctype html><html><head><meta name="viewport" content="width=device-width, initial-scale=1"></head><body style="margin:0;padding:0"><img src="data:image/png;base64,${imageBase64}" style="display:block;width:100%;height:auto" /></body></html>`,
      });
      fileUri = pdf.uri;
      mimeType = "application/pdf";
      extension = "pdf";
    }

    const finalFilename = `${safeFilename(filename)}.${extension}`;

    if (action === "share") {
      const available = await Sharing.isAvailableAsync();
      if (!available) {
        throw new Error("اشتراک‌گذاری فایل در این دستگاه در دسترس نیست.");
      }
      await Sharing.shareAsync(fileUri, {
        mimeType,
        dialogTitle: "اشتراک‌گذاری فایل",
        UTI: format === "pdf" ? "com.adobe.pdf" : "public.png",
      });
      return;
    }

    if (Platform.OS !== "android" || !DocumentExportModule) {
      throw new Error("ذخیره مستقیم در حافظه عمومی فقط در نسخه اندروید پشتیبانی می‌شود.");
    }

    await ensureLegacyStoragePermission();
    const fileBase64 = await FileSystem.readAsStringAsync(fileUri, {
      encoding: FileSystem.EncodingType.Base64,
    });
    await DocumentExportModule.saveFile(fileBase64, finalFilename, mimeType);

    Alert.alert(
      "ذخیره شد",
      `فایل در پوشه Download/${EXPORT_FOLDER_NAME} ذخیره شد: ${finalFilename}`,
    );
  } catch (error) {
    console.error("File export failed:", error);
    Alert.alert(
      "خطا در خروجی فایل",
      error instanceof Error ? error.message : "ساخت یا ذخیره فایل انجام نشد.",
    );
  }
}
