import type { ComponentRef } from "react";
import { Image, NativeModules, PermissionsAndroid, Platform, View } from "react-native";
import * as FileSystem from "expo-file-system/legacy";
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import { captureRef } from "react-native-view-shot";

type ExportFormat = "png" | "pdf";
type ExportAction = "share" | "save";

type ExportOptions = {
  viewRef: { current: ComponentRef<typeof View> | null };
  format: ExportFormat;
  action: ExportAction;
  filename: string;
  paginateImage?: boolean;
  pageBreakOffsets?: number[];
  captureWidthDp?: number;
  repeatHeaderStartDp?: number;
  repeatHeaderHeightDp?: number;
  onAlert: (title: string, message: string, success: boolean) => void;
};

type DocumentExportNativeModule = {
  saveFile(base64: string, filename: string, mimeType: string): Promise<string>;
};

const EXPORT_FOLDER_NAME = "Hadman Factor";
const DocumentExportModule =
  NativeModules.DocumentExportModule as DocumentExportNativeModule | undefined;

const safeFilename = (name: string) =>
  name.replace(/[\\/:*?"<>|]/g, "-").replace(/\s+/g, "-");

function getImageDimensions(uri: string): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    Image.getSize(uri, (width, height) => resolve({ width, height }), reject);
  });
}

function createPaginatedImageHtml(
  imageBase64: string,
  imageWidth: number,
  imageHeight: number,
  pageBreakOffsetsDp: number[],
  captureWidthDp: number,
  repeatHeaderStartDp: number,
  repeatHeaderHeightDp: number,
): string {
  const pageHeightPx = Math.floor((imageWidth * 297) / 210);
  const scale = imageWidth / captureWidthDp;
  const headerStartPx = Math.max(0, Math.round(repeatHeaderStartDp * scale));
  const headerHeightPx = Math.max(0, Math.round(repeatHeaderHeightDp * scale));
  const repeatedHeaderHeight = Math.min(headerHeightPx, Math.max(0, imageHeight - headerStartPx));
  const contentStartPx = headerStartPx + repeatedHeaderHeight;
  const breakpoints = pageBreakOffsetsDp
    .map((offset) => Math.round(offset * scale))
    .filter((offset) => offset > contentStartPx && offset < imageHeight)
    .sort((a, b) => a - b);

  const segments: { offsetY: number; sliceHeight: number; repeatedHeader: boolean }[] = [];
  let offsetY = 0;
  let pageIndex = 0;

  while (offsetY < imageHeight) {
    const repeatedHeader = pageIndex > 0 && repeatedHeaderHeight > 0;
    if (repeatedHeader && offsetY < contentStartPx) offsetY = contentStartPx;

    const availableBodyHeight = Math.max(1, pageHeightPx - (repeatedHeader ? repeatedHeaderHeight : 0));
    const targetY = Math.min(offsetY + availableBodyHeight, imageHeight);
    if (targetY >= imageHeight) {
      segments.push({
        offsetY,
        sliceHeight: imageHeight - offsetY,
        repeatedHeader,
      });
      break;
    }

    const earliestSafeY = offsetY + Math.floor(availableBodyHeight * 0.65);
    const safeBreaks = breakpoints.filter((point) => point >= earliestSafeY && point <= targetY);
    const nextY = safeBreaks.length > 0 ? safeBreaks[safeBreaks.length - 1] : targetY;
    segments.push({
      offsetY,
      sliceHeight: nextY - offsetY,
      repeatedHeader,
    });
    offsetY = nextY;
    pageIndex += 1;
  }

  const imageSource = `data:image/png;base64,${imageBase64}`;
  const pages = segments.map(({ offsetY, sliceHeight, repeatedHeader }) => {
    const headerHeight = repeatedHeader ? repeatedHeaderHeight : 0;
    const pageContentHeight = headerHeight + sliceHeight;
    const pageHeightMm = (pageContentHeight / imageWidth) * 210;
    const repeatedHeaderSvg = repeatedHeader
      ? `<svg x="0" y="0" width="${imageWidth}" height="${headerHeight}" viewBox="0 ${headerStartPx} ${imageWidth} ${headerHeight}" preserveAspectRatio="none">
          <image href="${imageSource}" x="0" y="0" width="${imageWidth}" height="${imageHeight}" />
        </svg>`
      : "";
    const bodySvg = `<svg x="0" y="${headerHeight}" width="${imageWidth}" height="${sliceHeight}" viewBox="0 ${offsetY} ${imageWidth} ${sliceHeight}" preserveAspectRatio="none">
        <image href="${imageSource}" x="0" y="0" width="${imageWidth}" height="${imageHeight}" />
      </svg>`;

    return `<section class="page" style="height:${pageHeightMm.toFixed(3)}mm">
      <svg xmlns="http://www.w3.org/2000/svg" width="210mm" height="${pageHeightMm.toFixed(3)}mm"
        viewBox="0 0 ${imageWidth} ${pageContentHeight}" preserveAspectRatio="none">
        ${repeatedHeaderSvg}${bodySvg}
      </svg>
    </section>`;
  }).join("");

  return `<!doctype html><html><head><meta charset="utf-8"><style>
    @page { size:A4; margin:0; }
    html,body { margin:0; padding:0; width:210mm; background:#fff; }
    .page { width:210mm; margin:0; padding:0; overflow:hidden; page-break-after:always; break-after:page; }
    .page:last-child { page-break-after:auto; break-after:auto; }
    svg { display:block; margin:0; padding:0; }
  </style></head><body>${pages}</body></html>`;
}

export async function exportViewFile({
  viewRef,
  format,
  action,
  filename,
  paginateImage = false,
  pageBreakOffsets = [],
  captureWidthDp = 998,
  repeatHeaderStartDp = 0,
  repeatHeaderHeightDp = 0,
  onAlert,
}: ExportOptions): Promise<void> {
  try {
    if (!viewRef.current) {
      throw new Error("محتوای خروجی در دسترس نیست.");
    }

    let fileUri = "";
    let mimeType = "image/png";
    let extension = "png";
    let generatedPdfBase64: string | undefined;

    if (format === "pdf") {
      const imageUri = await captureRef(viewRef.current, {
        format: "png",
        quality: 1,
        result: "tmpfile",
      });
      const imageBase64 = await FileSystem.readAsStringAsync(imageUri, {
        encoding: FileSystem.EncodingType.Base64,
      });

      let html: string;
      if (paginateImage) {
        const dimensions = await getImageDimensions(imageUri);
        html = createPaginatedImageHtml(
          imageBase64,
          dimensions.width,
          dimensions.height,
          pageBreakOffsets,
          captureWidthDp,
          repeatHeaderStartDp,
          repeatHeaderHeightDp,
        );
      } else {
        html = `<!doctype html><html><head><meta name="viewport" content="width=device-width, initial-scale=1"><style>@page { margin: 0; } html, body { margin: 0; padding: 0; background-color: #ffffff; } img { display: block; width: 100%; height: auto; }</style></head><body><img src="data:image/png;base64,${imageBase64}" /></body></html>`;
      }

      const pdf = await Print.printToFileAsync({
        html,
        base64: action === "save",
      });
      fileUri = pdf.uri;
      generatedPdfBase64 = pdf.base64;
      mimeType = "application/pdf";
      extension = "pdf";
    } else {
      fileUri = await captureRef(viewRef.current, {
        format: "png",
        quality: 1,
        result: "tmpfile",
      });
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

    if (Platform.OS !== "android") {
      throw new Error("ذخیره مستقیم در حافظه عمومی فقط در نسخه اندروید پشتیبانی می‌شود.");
    }

    const fileBase64 = generatedPdfBase64 ?? await FileSystem.readAsStringAsync(fileUri, {
      encoding: FileSystem.EncodingType.Base64,
    });

    if (DocumentExportModule) {
      await ensureLegacyStoragePermission();
      await DocumentExportModule.saveFile(fileBase64, finalFilename, mimeType);
      onAlert?.(
        "ذخیره شد",
        `فایل در پوشه Download/${EXPORT_FOLDER_NAME} ذخیره شد: ${finalFilename}`,
        true,
      );
      return;
    }

    const directory = await FileSystem.StorageAccessFramework.requestDirectoryPermissionsAsync();
    if (!directory.granted) {
      throw new Error("برای ذخیره فایل، دسترسی انتخاب پوشه داده نشد.");
    }
    const savedFileUri = await FileSystem.StorageAccessFramework.createFileAsync(
      directory.directoryUri,
      finalFilename,
      mimeType,
    );
    await FileSystem.writeAsStringAsync(savedFileUri, fileBase64, {
      encoding: FileSystem.EncodingType.Base64,
    });
    onAlert?.(
      "ذخیره شد",
      `فایل با موفقیت در پوشه انتخاب‌شده ذخیره شد: ${finalFilename}`,
      true,
    );
  } catch (error) {
    console.error("File export failed:", error);
    const message = error instanceof Error ? error.message : "ساخت یا ذخیره فایل انجام نشد.";
    onAlert("خطا در خروجی فایل", message, false);
  }
}

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