import * as SQLite from "expo-sqlite";
import { AppState } from "react-native";
import { getConnectedGoogleAccount } from "./googleAuth";
import { createDriveBackup, getLatestDriveBackupInfo } from "./googleDrive";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as FileSystem from "expo-file-system/legacy";

type EntityTable = "customers" | "invoices" | "payments";

type JsonRecord = {
  id: string | number;
  customerId?: string | number;
  items?: unknown;
};

const DATABASE_NAME = "hadi_factor.db";
const MIGRATION_KEY = "sqlite_initial_import_v1";
const CUSTOMER_KEY = "@hadi_factor_customers";
const NEXT_CUSTOMER_CODE_KEY = "@hadi_factor_next_customer_code";
const INVOICE_KEY = "@hadi_factor_invoices";
const PAYMENT_KEY = "@hadi_factor_payments_v2";
const LEGACY_PAYMENT_KEY = "@hadi_factor_payments";
const AUTO_BACKUP_PENDING_KEY = "@hadman_factor_drive_backup_pending";
const CLOUD_BACKUP_HOLD_KEY = "@hadman_factor_drive_backup_hold";

class NativeDatabaseService {
  private database: SQLite.SQLiteDatabase | null = null;
  private initialization: Promise<SQLite.SQLiteDatabase> | null = null;
  private autoBackupTimer: ReturnType<typeof setTimeout> | null = null;
  private autoBackupRunning = false;
  private autoBackupRequested = false;

  async getDatabase(): Promise<SQLite.SQLiteDatabase> {
    if (this.database) return this.database;
    if (this.initialization) return this.initialization;

    this.initialization = this.initialize();
    try {
      this.database = await this.initialization;
      return this.database;
    } catch (error) {
      this.initialization = null;
      throw error;
    }
  }

  private async initialize(): Promise<SQLite.SQLiteDatabase> {
    const db = await SQLite.openDatabaseAsync(DATABASE_NAME);
    await db.execAsync(`
      PRAGMA journal_mode = WAL;
      PRAGMA foreign_keys = ON;

      CREATE TABLE IF NOT EXISTS customers (
        id TEXT PRIMARY KEY NOT NULL,
        payload TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS invoices (
        id TEXT PRIMARY KEY NOT NULL,
        customer_id TEXT,
        payload TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS invoice_items (
        id TEXT NOT NULL,
        invoice_id TEXT NOT NULL,
        item_index INTEGER NOT NULL,
        payload TEXT NOT NULL,
        PRIMARY KEY (invoice_id, id),
        FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS payments (
        id TEXT PRIMARY KEY NOT NULL,
        customer_id TEXT,
        payload TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS app_meta (
        key TEXT PRIMARY KEY NOT NULL,
        value TEXT NOT NULL
      );

      CREATE INDEX IF NOT EXISTS idx_invoices_customer_id ON invoices(customer_id);
      CREATE INDEX IF NOT EXISTS idx_payments_customer_id ON payments(customer_id);
      CREATE INDEX IF NOT EXISTS idx_invoice_items_invoice_id ON invoice_items(invoice_id);
    `);

    await this.importExistingData(db);
    return db;
  }

  private async importExistingData(db: SQLite.SQLiteDatabase): Promise<void> {
    const migration = await db.getFirstAsync<{ value: string }>(
      "SELECT value FROM app_meta WHERE key = ?",
      MIGRATION_KEY,
    );
    if (migration?.value === "done") return;

    const [customersRaw, invoicesRaw, paymentsRaw, legacyPaymentsRaw, nextCode] =
      await AsyncStorage.multiGet([
        CUSTOMER_KEY,
        INVOICE_KEY,
        PAYMENT_KEY,
        LEGACY_PAYMENT_KEY,
        NEXT_CUSTOMER_CODE_KEY,
      ]);

    const parseArray = (raw: string | null): JsonRecord[] => {
      if (!raw) return [];
      try {
        const parsed: unknown = JSON.parse(raw);
        return Array.isArray(parsed)
          ? parsed.filter(
              (item): item is JsonRecord =>
                Boolean(item) && typeof item === "object" && "id" in item,
            )
          : [];
      } catch {
        return [];
      }
    };

    const customers = parseArray(customersRaw[1]);
    const invoices = parseArray(invoicesRaw[1]);
    const payments = parseArray(paymentsRaw[1]);
    const legacyPayments = parseArray(legacyPaymentsRaw[1]);
    const paymentSource = paymentsRaw[1] ? payments : legacyPayments;

    await db.withTransactionAsync(async () => {
      for (const customer of customers) {
        await this.upsertInTransaction(db, "customers", customer);
      }
      for (const invoice of invoices) {
        await this.upsertInTransaction(db, "invoices", invoice);
      }
      for (const payment of paymentSource) {
        await this.upsertInTransaction(db, "payments", payment);
      }

      if (nextCode[1]) {
        await db.runAsync(
          "INSERT OR REPLACE INTO app_meta (key, value) VALUES (?, ?)",
          NEXT_CUSTOMER_CODE_KEY,
          nextCode[1],
        );
      }

      await db.runAsync(
        "INSERT OR REPLACE INTO app_meta (key, value) VALUES (?, ?)",
        MIGRATION_KEY,
        "done",
      );
    });
  }

  private async persistImage(image?: string | null): Promise<string | null | undefined> {
    if (!image?.startsWith("data:image/")) return image;

    const match = image.match(/^data:image\/([a-zA-Z0-9.+-]+);base64,([\s\S]+)$/);
    if (!match || !FileSystem.documentDirectory) {
      throw new Error("ذخیره فایل تصویر در حافظه محلی امکان‌پذیر نیست.");
    }

    const mimeSubtype = match[1].toLowerCase().split("+")[0];
    const extension =
      mimeSubtype === "jpeg"
        ? "jpg"
        : mimeSubtype.replace(/[^a-z0-9]/g, "") || "jpg";
    const fileUri = `${FileSystem.documentDirectory}image-${Date.now()}-${Math.random().toString(36).slice(2)}.${extension}`;

    await FileSystem.writeAsStringAsync(fileUri, match[2], {
      encoding: FileSystem.EncodingType.Base64,
    });
    return fileUri;
  }

  private async normalizeRecordImages(
    table: EntityTable,
    record: JsonRecord,
  ): Promise<JsonRecord> {
    const normalized = { ...record } as JsonRecord & Record<string, unknown>;
    const imageFields =
      table === "customers"
        ? ["avatar"]
        : table === "invoices"
          ? ["sellerLogo", "sellerSeal", "sellerSignature"]
          : ["attachment"];

    for (const field of imageFields) {
      const value = normalized[field];
      if (typeof value === "string" && value.startsWith("data:image/")) {
        normalized[field] = await this.persistImage(value);
      }
    }
    return normalized;
  }

  private async upsertInTransaction(
    db: SQLite.SQLiteDatabase,
    table: EntityTable,
    record: JsonRecord,
  ): Promise<void> {
    const normalizedRecord = await this.normalizeRecordImages(table, record);
    const id = String(normalizedRecord.id);
    const now = new Date().toISOString();
    const payload = JSON.stringify(normalizedRecord);

    if (table === "invoices") {
      await db.runAsync(
        "INSERT OR REPLACE INTO invoices (id, customer_id, payload, updated_at) VALUES (?, ?, ?, ?)",
        id,
        normalizedRecord.customerId == null ? null : String(normalizedRecord.customerId),
        payload,
        now,
      );

      await db.runAsync("DELETE FROM invoice_items WHERE invoice_id = ?", id);
      const items = Array.isArray(normalizedRecord.items) ? normalizedRecord.items : [];
      for (let index = 0; index < items.length; index += 1) {
        const item = items[index] as Record<string, unknown>;
        const itemId = item?.id == null ? `${id}-item-${index}` : String(item.id);
        await db.runAsync(
          "INSERT OR REPLACE INTO invoice_items (id, invoice_id, item_index, payload) VALUES (?, ?, ?, ?)",
          itemId,
          id,
          index,
          JSON.stringify(item),
        );
      }
      return;
    }

    if (table === "payments") {
      await db.runAsync(
        "INSERT OR REPLACE INTO payments (id, customer_id, payload, updated_at) VALUES (?, ?, ?, ?)",
        id,
        normalizedRecord.customerId == null ? null : String(normalizedRecord.customerId),
        payload,
        now,
      );
      return;
    }

    await db.runAsync(
      "INSERT OR REPLACE INTO customers (id, payload, updated_at) VALUES (?, ?, ?)",
      id,
      payload,
      now,
    );
  }

  async getAll<T>(table: EntityTable): Promise<T[]> {
    const db = await this.getDatabase();

    // Read only small metadata rows first. A single large payload can exceed
    // Android CursorWindow, even when the query returns only one column.
    const rows = await db.getAllAsync<{ id: string; payload_length: number }>(
      `SELECT id, length(payload) AS payload_length FROM ${table} ORDER BY rowid ASC`,
    );
    const chunkSize = 100_000;
    const records: T[] = [];

    for (const row of rows) {
      let payload = "";
      for (let offset = 1; offset <= row.payload_length; offset += chunkSize) {
        const part = await db.getFirstAsync<{ chunk: string }>(
          `SELECT substr(payload, ?, ?) AS chunk FROM ${table} WHERE id = ?`,
          offset,
          chunkSize,
          row.id,
        );
        if (!part?.chunk) {
          throw new Error(`خواندن اطلاعات رکورد ${row.id} از دیتابیس ناقص بود.`);
        }
        payload += part.chunk;
      }

      const parsed = JSON.parse(payload) as JsonRecord;
      const normalized = await this.normalizeRecordImages(table, parsed);
      if (JSON.stringify(normalized) !== payload) {
        await db.runAsync(
          `UPDATE ${table} SET payload = ? WHERE id = ?`,
          JSON.stringify(normalized),
          row.id,
        );
      }
      records.push(normalized as T);
    }

    return records;
  }

  async upsert(table: EntityTable, record: JsonRecord): Promise<void> {
    const db = await this.getDatabase();
    await db.withTransactionAsync(async () => {
      await this.upsertInTransaction(db, table, record);
    });
    void this.requestCloudBackup();
  }

  async upsertMany(table: EntityTable, records: JsonRecord[]): Promise<void> {
    const db = await this.getDatabase();
    await db.withTransactionAsync(async () => {
      for (const record of records) {
        await this.upsertInTransaction(db, table, record);
      }
    });
    if (records.length) void this.requestCloudBackup();
  }

  async delete(table: EntityTable, id: string | number): Promise<void> {
    const db = await this.getDatabase();
    await db.runAsync(`DELETE FROM ${table} WHERE id = ?`, String(id));
    void this.requestCloudBackup();
  }

  async replaceAll(table: EntityTable, records: JsonRecord[]): Promise<void> {
    const db = await this.getDatabase();
    await db.withTransactionAsync(async () => {
      await db.runAsync(`DELETE FROM ${table}`);
      for (const record of records) {
        await this.upsertInTransaction(db, table, record);
      }
    });
    void this.requestCloudBackup();
  }

  private isGoogleDriveConnected(): boolean {
    try {
      return Boolean(getConnectedGoogleAccount());
    } catch {
      return false;
    }
  }

  async initializeCloudBackupSafety(): Promise<void> {
    const savedHold = await AsyncStorage.getItem(CLOUD_BACKUP_HOLD_KEY).catch(() => null);
    if (savedHold !== null) {
      if (savedHold === "0") await this.retryPendingCloudBackup();
      return;
    }

    if (!this.isGoogleDriveConnected()) {
      await this.setCloudBackupHold(false);
      return;
    }

    // Unknown first-run state: pause uploads until Drive has been checked.
    await this.setCloudBackupHold(true);
    try {
      const remoteBackup = await getLatestDriveBackupInfo();
      if (remoteBackup) return;

      await this.setCloudBackupHold(false);
      const snapshot = await this.exportCloudSnapshot();
      const hasLocalData =
        snapshot.customers.length > 0 ||
        snapshot.invoices.length > 0 ||
        snapshot.payments.length > 0 ||
        Object.entries(snapshot.settings).some(
          ([key, value]) => key !== "invoiceTheme" && value.trim().length > 0,
        );
      if (hasLocalData) await this.requestCloudBackup();
    } catch {
      // Keep the hold on network/auth errors. A later explicit check can safely resume.
    }
  }

  async setCloudBackupHold(hold: boolean): Promise<void> {
    await AsyncStorage.setItem(CLOUD_BACKUP_HOLD_KEY, hold ? "1" : "0");
    if (hold) {
      if (this.autoBackupTimer) clearTimeout(this.autoBackupTimer);
      this.autoBackupTimer = null;
      this.autoBackupRequested = false;
    }
  }

  async releaseCloudBackupHold(): Promise<void> {
    await this.setCloudBackupHold(false);
  }

  async completeCloudRestore(): Promise<void> {
    await AsyncStorage.removeItem(AUTO_BACKUP_PENDING_KEY);
    await this.setCloudBackupHold(false);
  }

  async completeCloudBackup(uploadedSnapshot: {
    customers: JsonRecord[];
    invoices: JsonRecord[];
    payments: JsonRecord[];
    settings: Record<string, string>;
    nextCustomerCode: string | null;
  }): Promise<void> {
    await this.setCloudBackupHold(false);
    const currentSnapshot = await this.exportCloudSnapshot();
    const getContent = (snapshot: typeof currentSnapshot | typeof uploadedSnapshot) =>
      JSON.stringify({
        customers: snapshot.customers,
        invoices: snapshot.invoices,
        payments: snapshot.payments,
        settings: snapshot.settings,
        nextCustomerCode: snapshot.nextCustomerCode,
      });

    if (getContent(currentSnapshot) !== getContent(uploadedSnapshot)) {
      await this.requestCloudBackup();
      return;
    }
    await AsyncStorage.removeItem(AUTO_BACKUP_PENDING_KEY);
  }

  async requestCloudBackup(): Promise<void> {
    await AsyncStorage.setItem(AUTO_BACKUP_PENDING_KEY, "1").catch(() => undefined);
    const hold = await AsyncStorage.getItem(CLOUD_BACKUP_HOLD_KEY).catch(() => null);
    if (hold !== "0") return;
    this.autoBackupRequested = true;
    if (!this.isGoogleDriveConnected()) return;
    if (this.autoBackupRunning) return;

    if (this.autoBackupTimer) clearTimeout(this.autoBackupTimer);
    this.autoBackupTimer = setTimeout(() => {
      this.autoBackupTimer = null;
      void this.flushAutomaticBackup();
    }, 1800);
  }

  async retryPendingCloudBackup(): Promise<void> {
    const pending = await AsyncStorage.getItem(AUTO_BACKUP_PENDING_KEY).catch(() => null);
    if (pending === "1" && this.isGoogleDriveConnected()) {
      await this.requestCloudBackup();
    }
  }

  private async flushAutomaticBackup(): Promise<void> {
    const hold = await AsyncStorage.getItem(CLOUD_BACKUP_HOLD_KEY).catch(() => null);
    if (hold !== "0" || this.autoBackupRunning || !this.isGoogleDriveConnected()) return;
    this.autoBackupRunning = true;
    try {
      do {
        this.autoBackupRequested = false;
        const snapshot = await this.exportCloudSnapshot();
        await createDriveBackup(snapshot);
      } while (this.autoBackupRequested && this.isGoogleDriveConnected());

      await AsyncStorage.removeItem(AUTO_BACKUP_PENDING_KEY);
    } catch {
      await AsyncStorage.setItem(AUTO_BACKUP_PENDING_KEY, "1").catch(() => undefined);
    } finally {
      this.autoBackupRunning = false;
      if (this.autoBackupRequested && this.isGoogleDriveConnected()) {
        await this.requestCloudBackup();
      }
    }
  }

  async exportCloudSnapshot(): Promise<{
    schemaVersion: 1;
    createdAt: string;
    customers: JsonRecord[];
    invoices: JsonRecord[];
    payments: JsonRecord[];
    settings: Record<string, string>;
    nextCustomerCode: string | null;
  }> {
    const [customers, invoices, payments] = await Promise.all([
      this.getAll<JsonRecord>("customers"),
      this.getAll<JsonRecord>("invoices"),
      this.getAll<JsonRecord>("payments"),
    ]);

    const encodeImages = async (table: EntityTable, record: JsonRecord): Promise<JsonRecord> => {
      const copy = { ...record } as JsonRecord & Record<string, unknown>;
      const fields = table === "customers"
        ? ["avatar"]
        : table === "invoices"
          ? ["sellerLogo", "sellerSeal", "sellerSignature"]
          : ["attachment"];

      for (const field of fields) {
        const value = copy[field];
        if (
          typeof value !== "string" ||
          !value.startsWith("file://") ||
          !FileSystem.documentDirectory ||
          !value.startsWith(FileSystem.documentDirectory)
        ) continue;

        const extension = value.split("?")[0].split(".").pop()?.toLowerCase() ?? "jpg";
        if (!["jpg", "jpeg", "png", "webp", "gif", "bmp"].includes(extension)) continue;
        const subtype = extension === "jpg" ? "jpeg" : extension;
        const base64 = await FileSystem.readAsStringAsync(value, {
          encoding: FileSystem.EncodingType.Base64,
        });
        copy[field] = `data:image/${subtype};base64,${base64}`;
      }
      return copy;
    };

    const [customersWithImages, invoicesWithImages, paymentsWithImages] = await Promise.all([
      Promise.all(customers.map((item) => encodeImages("customers", item))),
      Promise.all(invoices.map((item) => encodeImages("invoices", item))),
      Promise.all(payments.map((item) => encodeImages("payments", item))),
    ]);

    const settingKeys = [
      "invoiceTheme",
      "companyName",
      "companyAddress",
      "companyPhone",
      "companyEconomicCode",
      "companyLogo",
      "companySeal",
      "companySignature",
    ];
    const storedSettings = await AsyncStorage.multiGet(settingKeys);
    const settings: Record<string, string> = {};
    for (const [key, value] of storedSettings) {
      if (value == null) continue;
      let savedValue = value;
      if (
        ["companyLogo", "companySeal", "companySignature"].includes(key) &&
        value.startsWith("file://") &&
        FileSystem.documentDirectory &&
        value.startsWith(FileSystem.documentDirectory)
      ) {
        const extension = value.split("?")[0].split(".").pop()?.toLowerCase() ?? "jpg";
        if (["jpg", "jpeg", "png", "webp", "gif", "bmp"].includes(extension)) {
          const subtype = extension === "jpg" ? "jpeg" : extension;
          const base64 = await FileSystem.readAsStringAsync(value, {
            encoding: FileSystem.EncodingType.Base64,
          });
          savedValue = `data:image/${subtype};base64,${base64}`;
        }
      }
      settings[key] = savedValue;
    }

    return {
      schemaVersion: 1,
      createdAt: new Date().toISOString(),
      customers: customersWithImages,
      invoices: invoicesWithImages,
      payments: paymentsWithImages,
      settings,
      nextCustomerCode: await this.getMeta(NEXT_CUSTOMER_CODE_KEY),
    };
  }

  async restoreCloudSnapshot(snapshot: {
    schemaVersion: 1;
    createdAt: string;
    customers: JsonRecord[];
    invoices: JsonRecord[];
    payments: JsonRecord[];
    settings: Record<string, string>;
    nextCustomerCode: string | null;
  }): Promise<void> {
    if (
      snapshot.schemaVersion !== 1 ||
      typeof snapshot.createdAt !== "string" ||
      !Array.isArray(snapshot.customers) ||
      !Array.isArray(snapshot.invoices) ||
      !Array.isArray(snapshot.payments) ||
      !snapshot.settings ||
      typeof snapshot.settings !== "object" ||
      Array.isArray(snapshot.settings) ||
      !Object.values(snapshot.settings).every((value) => typeof value === "string") ||
      !(snapshot.nextCustomerCode === null || typeof snapshot.nextCustomerCode === "string") ||
      ![...snapshot.customers, ...snapshot.invoices, ...snapshot.payments].every(
        (record) =>
          Boolean(record) &&
          typeof record === "object" &&
          (typeof record.id === "string" || typeof record.id === "number"),
      )
    ) throw new Error("ساختار نسخه پشتیبان معتبر نیست.");

    const hasRecoverableContent =
      snapshot.customers.length > 0 ||
      snapshot.invoices.length > 0 ||
      snapshot.payments.length > 0 ||
      Object.entries(snapshot.settings).some(
        ([key, value]) => key !== "invoiceTheme" && value.trim().length > 0,
      );
    if (!hasRecoverableContent) {
      throw new Error("نسخه پشتیبان اطلاعات قابل بازیابی ندارد؛ برای جلوگیری از پاک‌شدن اطلاعات فعلی، بازیابی متوقف شد.");
    }

    const settingKeys = [
      "invoiceTheme",
      "companyName",
      "companyAddress",
      "companyPhone",
      "companyEconomicCode",
      "companyLogo",
      "companySeal",
      "companySignature",
    ];
    const db = await this.getDatabase();
    const previousSnapshot = await this.exportCloudSnapshot();
    const previousSettings = await AsyncStorage.multiGet(settingKeys);

    const applyDatabaseSnapshot = async (data: typeof previousSnapshot) => {
      await db.withTransactionAsync(async () => {
        await db.runAsync("DELETE FROM invoices");
        await db.runAsync("DELETE FROM payments");
        await db.runAsync("DELETE FROM customers");
        for (const customer of data.customers) {
          await this.upsertInTransaction(db, "customers", customer);
        }
        for (const invoice of data.invoices) {
          await this.upsertInTransaction(db, "invoices", invoice);
        }
        for (const payment of data.payments) {
          await this.upsertInTransaction(db, "payments", payment);
        }
        if (data.nextCustomerCode) {
          await db.runAsync(
            "INSERT OR REPLACE INTO app_meta (key, value) VALUES (?, ?)",
            NEXT_CUSTOMER_CODE_KEY,
            data.nextCustomerCode,
          );
        } else {
          await db.runAsync("DELETE FROM app_meta WHERE key = ?", NEXT_CUSTOMER_CODE_KEY);
        }
      });
    };

    await applyDatabaseSnapshot(snapshot);
    try {
      await AsyncStorage.multiRemove(settingKeys);
      const settingEntries = Object.entries(snapshot.settings).filter(
        (entry): entry is [string, string] =>
          settingKeys.includes(entry[0]) && typeof entry[1] === "string",
      );
      if (settingEntries.length) await AsyncStorage.multiSet(settingEntries);
    } catch (restoreError) {
      try {
        await applyDatabaseSnapshot(previousSnapshot);
        await AsyncStorage.multiRemove(settingKeys);
        const rollbackSettings = previousSettings.filter(
          (entry): entry is [string, string] => entry[1] !== null,
        );
        if (rollbackSettings.length) await AsyncStorage.multiSet(rollbackSettings);
      } catch {
        throw new Error("بازیابی تنظیمات کامل نشد و بازگردانی اطلاعات قبلی نیز با خطا روبه‌رو شد. قبل از ادامه، اطلاعات دستگاه را بررسی کنید.");
      }
      throw restoreError;
    }
  }

  async getMeta(key: string): Promise<string | null> {
    const db = await this.getDatabase();
    const row = await db.getFirstAsync<{ value: string }>(
      "SELECT value FROM app_meta WHERE key = ?",
      key,
    );
    return row?.value ?? null;
  }

  async setMeta(key: string, value: string): Promise<void> {
    const db = await this.getDatabase();
    await db.runAsync(
      "INSERT OR REPLACE INTO app_meta (key, value) VALUES (?, ?)",
      key,
      value,
    );
    if (key === NEXT_CUSTOMER_CODE_KEY) void this.requestCloudBackup();
  }
}

export const nativeDb = new NativeDatabaseService();

AppState.addEventListener("change", (state) => {
  if (state === "active") {
    void nativeDb.retryPendingCloudBackup();
  }
});

void nativeDb.initializeCloudBackupSafety();