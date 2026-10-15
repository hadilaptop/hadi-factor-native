import AsyncStorage from "@react-native-async-storage/async-storage";
import * as FileSystem from "expo-file-system/legacy";

export interface Payment {
  id: string | number;
  customerId: string | number;
  date: string;
  amount: number;
  method?: string;
  bankName?: string;
  checkDate?: string;
  checkNumber?: string;
  note?: string;
  attachment?: string;
  createdAt?: string;
}

const STORAGE_KEY = "@hadi_factor_payments_v2";
const LEGACY_STORAGE_KEY = "@hadi_factor_payments";

async function persistAttachment(attachment?: string): Promise<string | undefined> {
  if (!attachment?.startsWith("data:image/")) return attachment;

  const match = attachment.match(/^data:image\/([a-zA-Z0-9.+-]+);base64,([\s\S]+)$/);
  if (!match || !FileSystem.documentDirectory) {
    throw new Error("ذخیره فایل پیوست امکان‌پذیر نیست.");
  }

  const extension = match[1].toLowerCase() === "jpeg" ? "jpg" : match[1].toLowerCase();
  const fileUri = `${FileSystem.documentDirectory}payment-${Date.now()}-${Math.random().toString(36).slice(2)}.${extension}`;

  await FileSystem.writeAsStringAsync(fileUri, match[2], {
    encoding: FileSystem.EncodingType.Base64,
  });

  return fileUri;
}

export async function getPayments(): Promise<Payment[]> {
  try {
    const stored = await AsyncStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      return Array.isArray(parsed) ? parsed : [];
    }

    const legacyStored = await AsyncStorage.getItem(LEGACY_STORAGE_KEY);
    if (!legacyStored) return [];

    const legacyPayments = JSON.parse(legacyStored);
    if (!Array.isArray(legacyPayments)) return [];

    const migratedPayments: Payment[] = [];
    for (const payment of legacyPayments) {
      migratedPayments.push({
        ...payment,
        attachment: await persistAttachment(payment.attachment),
      });
    }

    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(migratedPayments));
    return migratedPayments;
  } catch (error) {
    console.error("خطا در دریافت دریافتی‌ها:", error);
    return [];
  }
}

export async function savePayment(payment: Payment): Promise<boolean> {
  try {
    const payments = await getPayments();
    const paymentToStore = {
      ...payment,
      attachment: await persistAttachment(payment.attachment),
    };
    const index = payments.findIndex((item) => String(item.id) === String(paymentToStore.id));

    if (index === -1) payments.push(paymentToStore);
    else payments[index] = paymentToStore;

    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(payments));
    return true;
  } catch (error) {
    console.error("خطا در ذخیره دریافتی:", error);
    return false;
  }
}

export async function deletePayment(paymentId: string | number): Promise<boolean> {
  try {
    const payments = await getPayments();
    const filtered = payments.filter((item) => String(item.id) !== String(paymentId));
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
    return true;
  } catch (error) {
    console.error("خطا در حذف دریافتی:", error);
    return false;
  }
}