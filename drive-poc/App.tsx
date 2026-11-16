declare const process: { env: Record<string, string | undefined> };

import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import {
  GoogleSignin,
  isSuccessResponse,
} from "@react-native-google-signin/google-signin";
import * as SecureStore from "expo-secure-store";

const DRIVE_FILE_SCOPE = "https://www.googleapis.com/auth/drive.file";
const DRIVE_API = "https://www.googleapis.com/drive/v3";
const DRIVE_UPLOAD_API = "https://www.googleapis.com/upload/drive/v3";
const WEB_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID ?? "";
const FOLDER_KEY = "drive_poc_folder_id";
const ACCOUNT_KEY = "drive_poc_google_email";

type DriveFile = {
  id: string;
  name: string;
  mimeType?: string;
};

type DriveListResponse = {
  files?: DriveFile[];
};

function explainError(error: unknown): string {
  if (error instanceof Error) return error.message;
  return String(error);
}

export default function App() {
  const [accountEmail, setAccountEmail] = useState("");
  const [folderId, setFolderId] = useState("");
  const [status, setStatus] = useState("برای شروع، ابتدا حساب Google را متصل کنید.");
  const [files, setFiles] = useState<DriveFile[]>([]);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (WEB_CLIENT_ID) {
      GoogleSignin.configure({
        webClientId: WEB_CLIENT_ID,
        scopes: [DRIVE_FILE_SCOPE],
        offlineAccess: false,
      });
    }

    void restoreLocalState();
  }, []);

  async function restoreLocalState() {
    try {
      const [savedEmail, savedFolder] = await Promise.all([
        SecureStore.getItemAsync(ACCOUNT_KEY),
        SecureStore.getItemAsync(FOLDER_KEY),
      ]);
      if (savedEmail) setAccountEmail(savedEmail);
      if (savedFolder) setFolderId(savedFolder);
    } catch (error) {
      setStatus("خواندن وضعیت محلی ناموفق بود: " + explainError(error));
    }
  }

  async function getAccessToken(): Promise<string> {
    const tokens = await GoogleSignin.getTokens();
    if (!tokens.accessToken) {
      throw new Error("Google access token دریافت نشد.");
    }
    return tokens.accessToken;
  }

  async function driveFetch(
    pathOrUrl: string,
    init: RequestInit = {},
  ): Promise<Response> {
    let token = await getAccessToken();
    const url = pathOrUrl.startsWith("https://")
      ? pathOrUrl
      : DRIVE_API + pathOrUrl;

    const makeRequest = (accessToken: string) =>
      fetch(url, {
        ...init,
        headers: {
          ...(init.headers ?? {}),
          Authorization: "Bearer " + accessToken,
        },
      });

    let response = await makeRequest(token);
    if (response.status === 401) {
      await GoogleSignin.clearCachedAccessToken(token);
      token = await getAccessToken();
      response = await makeRequest(token);
    }
    return response;
  }

  async function ensureHadiFactorFolder(): Promise<string> {
    const query = encodeURIComponent(
      "name = 'HadiFactor' and mimeType = 'application/vnd.google-apps.folder' and trashed = false",
    );
    const listResponse = await driveFetch(
      "/files?q=" + query + "&pageSize=100&fields=files(id,name,mimeType)",
    );
    if (!listResponse.ok) {
      throw new Error("جست‌وجوی پوشه در Drive ناموفق بود: " + await listResponse.text());
    }

    const list = (await listResponse.json()) as DriveListResponse;
    const existing = list.files?.[0];
    if (existing?.id) {
      await SecureStore.setItemAsync(FOLDER_KEY, existing.id);
      setFolderId(existing.id);
      return existing.id;
    }

    const createResponse = await driveFetch("/files?fields=id,name,mimeType", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "HadiFactor",
        mimeType: "application/vnd.google-apps.folder",
      }),
    });
    if (!createResponse.ok) {
      throw new Error("ساخت پوشه HadiFactor ناموفق بود: " + await createResponse.text());
    }

    const created = (await createResponse.json()) as DriveFile;
    if (!created.id) throw new Error("گوگل شناسه پوشه را برنگرداند.");
    await SecureStore.setItemAsync(FOLDER_KEY, created.id);
    setFolderId(created.id);
    return created.id;
  }

  async function listFolderFiles(targetFolderId: string): Promise<DriveFile[]> {
    const query = encodeURIComponent(
      "'" + targetFolderId + "' in parents and trashed = false",
    );
    const response = await driveFetch(
      "/files?q=" + query + "&pageSize=100&orderBy=name&fields=files(id,name,mimeType)",
    );
    if (!response.ok) {
      throw new Error("خواندن فهرست فایل‌ها ناموفق بود: " + await response.text());
    }
    const result = (await response.json()) as DriveListResponse;
    const found = result.files ?? [];
    setFiles(found);
    return found;
  }

  async function uploadAndVerifyTestFile(targetFolderId: string) {
    const createdAt = new Date().toISOString();
    const fileName = "drive-poc-test-" + Date.now() + ".json";
    const payload = {
      application: "HadiFactor Drive POC",
      test: "upload-download-verify",
      createdAt,
      randomCheck: "HF-DRIVE-POC-2026",
    };
    const boundary = "hadi_factor_drive_poc_boundary";
    const metadata = {
      name: fileName,
      mimeType: "application/json",
      parents: [targetFolderId],
    };
    const body =
      "--" + boundary + "\r\n" +
      "Content-Type: application/json; charset=UTF-8\r\n\r\n" +
      JSON.stringify(metadata) + "\r\n" +
      "--" + boundary + "\r\n" +
      "Content-Type: application/json; charset=UTF-8\r\n\r\n" +
      JSON.stringify(payload) + "\r\n" +
      "--" + boundary + "--";

    const uploadResponse = await driveFetch(
      DRIVE_UPLOAD_API + "/files?uploadType=multipart&fields=id,name,mimeType",
      {
        method: "POST",
        headers: { "Content-Type": "multipart/related; boundary=" + boundary },
        body,
      },
    );
    if (!uploadResponse.ok) {
      throw new Error("بارگذاری فایل آزمایشی ناموفق بود: " + await uploadResponse.text());
    }

    const uploaded = (await uploadResponse.json()) as DriveFile;
    if (!uploaded.id) throw new Error("گوگل شناسه فایل آزمایشی را برنگرداند.");

    const downloadResponse = await driveFetch(
      "/files/" + encodeURIComponent(uploaded.id) + "?alt=media",
    );
    if (!downloadResponse.ok) {
      throw new Error("دانلود فایل آزمایشی ناموفق بود: " + await downloadResponse.text());
    }

    const downloadedText = await downloadResponse.text();
    const downloadedPayload = JSON.parse(downloadedText) as typeof payload;
    if (
      downloadedPayload.randomCheck !== payload.randomCheck ||
      downloadedPayload.createdAt !== payload.createdAt
    ) {
      throw new Error("محتوای دانلودشده با فایل بارگذاری‌شده مطابقت ندارد.");
    }

    await listFolderFiles(targetFolderId);
    setStatus("موفق: پوشه ساخته/پیدا شد، فایل در Drive بارگذاری و دوباره دانلود شد و صحت محتوا تأیید شد. فایل: " + fileName);
  }

  async function connectGoogle() {
    if (!WEB_CLIENT_ID) {
      setStatus("ابتدا شناسه OAuth نوع Web را در فایل .env قرار دهید.");
      return;
    }
    setBusy(true);
    try {
      await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
      const response = await GoogleSignin.signIn();
      if (!isSuccessResponse(response)) {
        setStatus("ورود Google توسط کاربر لغو شد.");
        return;
      }
      const email = response.data.user.email;
      setAccountEmail(email);
      await SecureStore.setItemAsync(ACCOUNT_KEY, email);
      setStatus("حساب Google متصل شد. اکنون می‌توانید آزمون Drive را اجرا کنید.");
    } catch (error) {
      setStatus("اتصال Google ناموفق بود: " + explainError(error));
    } finally {
      setBusy(false);
    }
  }

  async function runDriveTest() {
    setBusy(true);
    setStatus("در حال بررسی مجوز Drive و اجرای آزمون...");
    try {
      const targetFolderId = await ensureHadiFactorFolder();
      await uploadAndVerifyTestFile(targetFolderId);
    } catch (error) {
      setStatus("آزمون Drive ناموفق بود: " + explainError(error));
    } finally {
      setBusy(false);
    }
  }

  async function refreshFiles() {
    setBusy(true);
    try {
      const targetFolderId = folderId || await ensureHadiFactorFolder();
      const found = await listFolderFiles(targetFolderId);
      setStatus("فهرست Drive به‌روزرسانی شد. تعداد فایل‌ها: " + found.length);
    } catch (error) {
      setStatus("خواندن فایل‌ها ناموفق بود: " + explainError(error));
    } finally {
      setBusy(false);
    }
  }

  async function disconnectGoogle() {
    setBusy(true);
    try {
      await GoogleSignin.revokeAccess();
      await GoogleSignin.signOut();
      await SecureStore.deleteItemAsync(ACCOUNT_KEY);
      await SecureStore.deleteItemAsync(FOLDER_KEY);
      setAccountEmail("");
      setFolderId("");
      setFiles([]);
      setStatus("مجوز برنامه از حساب Google لغو شد و اتصال محلی پاک شد. فایل‌های Drive حذف نشده‌اند.");
    } catch (error) {
      setStatus("لغو مجوز ناموفق بود: " + explainError(error));
    } finally {
      setBusy(false);
    }
  }

  const connected = Boolean(accountEmail);

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>آزمایش Google Drive</Text>
        <Text style={styles.subtitle}>نمونه مستقل هادی فاکتور — بدون اتصال به دیتابیس اصلی</Text>

        {!WEB_CLIENT_ID ? (
          <View style={styles.warning}>
            <Text style={styles.warningText}>شناسه OAuth هنوز تنظیم نشده است. فایل .env.example را به .env کپی و شناسه Web Client را وارد کنید.</Text>
          </View>
        ) : null}

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>وضعیت حساب</Text>
          <Text style={styles.value}>{connected ? accountEmail : "متصل نیست"}</Text>
          <Text style={styles.meta}>شناسه پوشه: {folderId || "هنوز ایجاد نشده"}</Text>
          <ActionButton title="اتصال حساب Google" onPress={connectGoogle} disabled={busy || !WEB_CLIENT_ID} />
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>آزمون واقعی Drive API</Text>
          <Text style={styles.description}>پوشه قابل مشاهده HadiFactor را پیدا یا ایجاد می‌کند، یک فایل JSON آزمایشی می‌سازد، آن را بارگذاری و دوباره دانلود می‌کند و محتوای فایل را مقایسه می‌کند.</Text>
          <ActionButton title="اجرای آزمون ساخت، بارگذاری و دانلود" onPress={runDriveTest} disabled={busy || !connected} />
          <ActionButton title="به‌روزرسانی فهرست فایل‌ها" onPress={refreshFiles} disabled={busy || !connected} secondary />
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>فایل‌های پوشه</Text>
          {files.length === 0 ? (
            <Text style={styles.meta}>هنوز فهرستی دریافت نشده است.</Text>
          ) : files.map((file) => (
            <View key={file.id} style={styles.fileRow}>
              <Text style={styles.fileName}>{file.name}</Text>
              <Text style={styles.meta}>{file.mimeType || "نوع نامشخص"}</Text>
            </View>
          ))}
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>گزارش آزمون</Text>
          {busy ? <ActivityIndicator size="small" color="#1769aa" /> : null}
          <Text style={styles.status}>{status}</Text>
          <ActionButton title="قطع اتصال و لغو مجوز Google" onPress={disconnectGoogle} disabled={busy || !connected} secondary />
        </View>

        <Text style={styles.footnote}>این نمونه فقط یک فایل آزمایشی می‌سازد. هیچ اطلاعات مشتری، فاکتور یا پرداخت واقعی به Drive ارسال نمی‌شود. توکن دسترسی در فایل یا SecureStore ذخیره نمی‌شود و فقط در حافظه کتابخانه استفاده می‌شود.</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

function ActionButton({
  title,
  onPress,
  disabled,
  secondary = false,
}: {
  title: string;
  onPress: () => void;
  disabled?: boolean;
  secondary?: boolean;
}) {
  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={onPress}
      disabled={disabled}
      style={[styles.button, secondary && styles.buttonSecondary, disabled && styles.buttonDisabled]}
    >
      <Text style={[styles.buttonText, secondary && styles.buttonTextSecondary]}>{title}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#eef5fb" },
  container: { padding: 20, gap: 14 },
  title: { fontSize: 25, fontWeight: "800", color: "#123b5d", textAlign: "center" },
  subtitle: { fontSize: 13, color: "#58748b", textAlign: "center", marginBottom: 6 },
  card: { backgroundColor: "#fff", borderRadius: 16, padding: 16, gap: 10, borderWidth: 1, borderColor: "#d9e6ef" },
  sectionTitle: { fontSize: 17, fontWeight: "700", color: "#183e5b" },
  value: { fontSize: 15, color: "#163c59", fontWeight: "600" },
  meta: { fontSize: 12, color: "#668094" },
  description: { fontSize: 13, lineHeight: 21, color: "#4d687c" },
  button: { backgroundColor: "#1769aa", borderRadius: 11, paddingVertical: 13, paddingHorizontal: 12, alignItems: "center", marginTop: 3 },
  buttonSecondary: { backgroundColor: "#e8f1f8", borderWidth: 1, borderColor: "#c8dce9" },
  buttonDisabled: { opacity: 0.45 },
  buttonText: { color: "#fff", fontSize: 14, fontWeight: "700", textAlign: "center" },
  buttonTextSecondary: { color: "#245575" },
  warning: { backgroundColor: "#fff4d9", borderRadius: 12, padding: 13, borderWidth: 1, borderColor: "#f0d28a" },
  warningText: { color: "#79530b", fontSize: 13, lineHeight: 20 },
  status: { color: "#284b65", fontSize: 13, lineHeight: 22 },
  fileRow: { paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: "#edf2f6", gap: 3 },
  fileName: { color: "#1c405b", fontSize: 13, fontWeight: "600" },
  footnote: { color: "#6c8292", fontSize: 11, lineHeight: 18, textAlign: "center", paddingHorizontal: 5, marginVertical: 4 },
});