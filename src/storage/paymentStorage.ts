import * as FileSystem from "expo-file-system/legacy";
import { nativeDb } from "../services/database";

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

async function persistAttachment(attachment?: string): Promise<string | undefined> {
  if (!attachment?.startsWith("data:image/")) return attachment;

  const match = attachment.match(/^data:image\/([a-zA-Z0-9.+-]+);base64,([\s\S]+)$/);
  if (!match || !FileSystem.documentDirectory) {
    throw new Error("ذخیره فایل پیوست امکان‌پذیر نیست.");
  }

  const extension =
    match[1].toLowerCase() === "jpeg" ? "jpg" : match[1].toLowerCase();
  const fileUri = `${FileSystem.documentDirectory}payment-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2)}.${extension}`;

  await FileSystem.writeAsStringAsync(fileUri, match[2], {
    encoding: FileSystem.EncodingType.Base64,
  });

  return fileUri;
}

export async function getPayments(): Promise<Payment[]> {
  try {
    const payments = await nativeDb.getAll<Payment>("payments");
    const result: Payment[] = [];

    for (const payment of payments) {
      const attachment = await persistAttachment(payment.attachment);
      const nextPayment =
        attachment === payment.attachment ? payment : { ...payment, attachment };
      if (nextPayment !== payment) {
        await nativeDb.upsert("payments", nextPayment);
      }
      result.push(nextPayment);
    }

    return result;
  } catch (error) {
    console.error("خطا در دریافت دریافتی‌ها:", error);
    return [];
  }
}

export async function savePayment(payment: Payment): Promise<boolean> {
  try {
    const paymentToStore: Payment = {
      ...payment,
      attachment: await persistAttachment(payment.attachment),
    };
    await nativeDb.upsert("payments", paymentToStore);
    return true;
  } catch (error) {
    console.error("خطا در ذخیره دریافتی:", error);
    return false;
  }
}

export async function deletePayment(
  paymentId: string | number,
): Promise<boolean> {
  try {
    await nativeDb.delete("payments", paymentId);
    return true;
  } catch (error) {
    console.error("خطا در حذف دریافتی:", error);
    return false;
  }
}