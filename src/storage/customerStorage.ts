import { nativeDb } from "../services/database";

export interface Customer {
  id: string | number;
  customerCode?: number;
  name: string;
  address?: string;
  phone?: string;
  economicCode?: string;
  avatar?: string;
}

const NEXT_CUSTOMER_CODE_KEY = "@hadi_factor_next_customer_code";
const CUSTOMER_CODE_START = 1001;

function isValidCustomerCode(value: unknown): value is number {
  return (
    typeof value === "number" &&
    Number.isInteger(value) &&
    value >= CUSTOMER_CODE_START
  );
}

async function getStoredNextCustomerCode(): Promise<number> {
  const stored = await nativeDb.getMeta(NEXT_CUSTOMER_CODE_KEY);
  const parsed = stored ? Number(stored) : NaN;
  return Number.isInteger(parsed) && parsed >= CUSTOMER_CODE_START
    ? parsed
    : CUSTOMER_CODE_START;
}

/** دریافت تمام مشتری‌های ذخیره‌شده */
export async function getCustomers(): Promise<Customer[]> {
  try {
    const customers = await nativeDb.getAll<Customer>("customers");
    const usedCodes = new Set<number>();
    let highestCode = CUSTOMER_CODE_START - 1;

    for (const customer of customers) {
      if (isValidCustomerCode(customer.customerCode)) {
        usedCodes.add(customer.customerCode);
        highestCode = Math.max(highestCode, customer.customerCode);
      }
    }

    let nextCode = Math.max(
      CUSTOMER_CODE_START,
      await getStoredNextCustomerCode(),
      highestCode + 1,
    );

    let migrated = false;
    const normalizedCustomers = customers.map((customer) => {
      if (isValidCustomerCode(customer.customerCode)) return customer;

      while (usedCodes.has(nextCode)) nextCode += 1;
      const normalized = { ...customer, customerCode: nextCode };
      usedCodes.add(nextCode);
      nextCode += 1;
      migrated = true;
      return normalized;
    });

    if (migrated) {
      await nativeDb.upsertMany("customers", normalizedCustomers);
    }

    const requiredNextCode = Math.max(nextCode, highestCode + 1);
    const storedNextCode = await getStoredNextCustomerCode();
    if (migrated || storedNextCode !== requiredNextCode) {
      await nativeDb.setMeta(NEXT_CUSTOMER_CODE_KEY, String(requiredNextCode));
    }

    return normalizedCustomers;
  } catch (error) {
    console.error("خطا در دریافت مشتری‌ها:", error);
    return [];
  }
}

/** دریافت کد بعدی مشتری */
export async function getNextCustomerCode(): Promise<number> {
  try {
    await getCustomers();
    const nextCode = await getStoredNextCustomerCode();
    await nativeDb.setMeta(NEXT_CUSTOMER_CODE_KEY, String(nextCode + 1));
    return nextCode;
  } catch (error) {
    console.error("خطا در دریافت کد مشتری:", error);
    return CUSTOMER_CODE_START;
  }
}

/** ذخیره کامل لیست مشتری‌ها */
export async function saveCustomers(customers: Customer[]): Promise<boolean> {
  try {
    await nativeDb.replaceAll("customers", customers);
    return true;
  } catch (error) {
    console.error("خطا در ذخیره مشتری‌ها:", error);
    return false;
  }
}

/** افزودن مشتری جدید */
export async function addCustomer(customer: Customer): Promise<boolean> {
  try {
    await nativeDb.upsert("customers", customer);
    return true;
  } catch (error) {
    console.error("خطا در افزودن مشتری:", error);
    return false;
  }
}

/** ویرایش مشتری موجود */
export async function updateCustomer(customer: Customer): Promise<boolean> {
  try {
    const customers = await nativeDb.getAll<Customer>("customers");
    if (!customers.some((item) => String(item.id) === String(customer.id))) {
      return false;
    }
    await nativeDb.upsert("customers", customer);
    return true;
  } catch (error) {
    console.error("خطا در ویرایش مشتری:", error);
    return false;
  }
}

/** حذف مشتری */
export async function deleteCustomer(
  customerId: string | number,
): Promise<boolean> {
  try {
    await nativeDb.delete("customers", customerId);
    return true;
  } catch (error) {
    console.error("خطا در حذف مشتری:", error);
    return false;
  }
}

/** افزودن یا ویرایش مشتری */
export async function saveCustomer(customer: Customer): Promise<boolean> {
  try {
    await nativeDb.upsert("customers", customer);
    return true;
  } catch (error) {
    console.error("خطا در ذخیره مشتری:", error);
    return false;
  }
}

/** حذف تمام مشتری‌ها؛ فقط برای استفاده داخلی/تست */
export async function clearCustomers(): Promise<boolean> {
  try {
    await nativeDb.replaceAll("customers", []);
    await nativeDb.setMeta(NEXT_CUSTOMER_CODE_KEY, String(CUSTOMER_CODE_START));
    return true;
  } catch (error) {
    console.error("خطا در پاک کردن مشتری‌ها:", error);
    return false;
  }
}
