import { nativeDb } from "../services/database";

export interface InvoiceItem {
  id: string | number;
  desc: string;
  quantity: string | number;
  unitPrice: string | number;
}

export interface StoredInvoice {
  id: string | number;
  customerId: string | number;
  type: string;
  number: string | number;
  date: string;
  amount: number;
  note?: string;
  items?: InvoiceItem[];
  createdAt?: string;
  buyerName?: string;
  buyerPhone?: string;
  buyerEconomicCode?: string;
  buyerAddress?: string;
  sellerName?: string;
  sellerPhone?: string;
  sellerAddress?: string;
  sellerEconomicCode?: string;
  sellerLogo?: string | null;
  sellerSeal?: string | null;
  sellerSignature?: string | null;
}

export async function getInvoices(): Promise<StoredInvoice[]> {
  try {
    return await nativeDb.getAll<StoredInvoice>("invoices");
  } catch (error) {
    console.error("خطا در دریافت فاکتورها:", error);
    return [];
  }
}

export async function saveInvoice(invoice: StoredInvoice): Promise<boolean> {
  try {
    await nativeDb.upsert("invoices", invoice);
    return true;
  } catch (error) {
    console.error("خطا در ذخیره فاکتور:", error);
    return false;
  }
}

export async function deleteInvoice(
  invoiceId: string | number,
): Promise<boolean> {
  try {
    await nativeDb.delete("invoices", invoiceId);
    return true;
  } catch (error) {
    console.error("خطا در حذف فاکتور:", error);
    return false;
  }
}
