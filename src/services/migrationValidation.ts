export type MigrationRecord = {
  id: string | number;
  customerId?: string | number;
  items?: unknown;
};

export function parseMigrationArray(
  raw: string | null,
  key: string,
  invoiceKey: string,
): MigrationRecord[] {
  if (raw === null) return [];
  if (raw.trim().length === 0) {
    throw new Error(`مقدار ذخیره‌شده برای «${key}» خالی و نامعتبر است؛ مهاجرت SQLite متوقف شد.`);
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error(`JSON ذخیره‌شده برای «${key}» خراب است؛ مهاجرت SQLite متوقف شد.`);
  }

  if (!Array.isArray(parsed)) {
    throw new Error(`ساختار «${key}» آرایه نیست؛ مهاجرت SQLite متوقف شد.`);
  }

  const seenIds = new Set<string>();
  return parsed.map((item: unknown, index: number): MigrationRecord => {
    if (!item || typeof item !== "object" || Array.isArray(item)) {
      throw new Error(`رکورد شماره ${index + 1} در «${key}» ساختار معتبری ندارد.`);
    }

    const record = item as Record<string, unknown>;
    const validId =
      (typeof record.id === "string" && record.id.trim().length > 0) ||
      (typeof record.id === "number" && Number.isFinite(record.id));
    if (!validId) {
      throw new Error(`شناسه رکورد شماره ${index + 1} در «${key}» معتبر نیست.`);
    }

    const normalizedId = String(record.id);
    if (seenIds.has(normalizedId)) {
      throw new Error(`شناسه تکراری «${normalizedId}» در «${key}» وجود دارد؛ مهاجرت متوقف شد.`);
    }
    seenIds.add(normalizedId);

    if (
      key === invoiceKey &&
      Object.prototype.hasOwnProperty.call(record, "items") &&
      !Array.isArray(record.items)
    ) {
      throw new Error(`فیلد items در فاکتور شماره ${index + 1} از «${key}» آرایه نیست.`);
    }

    return record as MigrationRecord;
  });
}
export function parsePaymentMigrationArray(
  currentRaw: string | null,
  legacyRaw: string | null,
  currentKey: string,
  legacyKey: string,
  invoiceKey: string,
): MigrationRecord[] {
  return currentRaw !== null
    ? parseMigrationArray(currentRaw, currentKey, invoiceKey)
    : parseMigrationArray(legacyRaw, legacyKey, invoiceKey);
}
