import * as SQLite from "expo-sqlite";
import AsyncStorage from "@react-native-async-storage/async-storage";

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

class NativeDatabaseService {
  private database: SQLite.SQLiteDatabase | null = null;
  private initialization: Promise<SQLite.SQLiteDatabase> | null = null;

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

  private async upsertInTransaction(
    db: SQLite.SQLiteDatabase,
    table: EntityTable,
    record: JsonRecord,
  ): Promise<void> {
    const id = String(record.id);
    const now = new Date().toISOString();
    const payload = JSON.stringify(record);

    if (table === "invoices") {
      await db.runAsync(
        "INSERT OR REPLACE INTO invoices (id, customer_id, payload, updated_at) VALUES (?, ?, ?, ?)",
        id,
        record.customerId == null ? null : String(record.customerId),
        payload,
        now,
      );

      await db.runAsync("DELETE FROM invoice_items WHERE invoice_id = ?", id);
      const items = Array.isArray(record.items) ? record.items : [];
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
        record.customerId == null ? null : String(record.customerId),
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
    const rows = await db.getAllAsync<{ payload: string }>(
      `SELECT payload FROM ${table} ORDER BY rowid ASC`,
    );
    return rows.map((row) => JSON.parse(row.payload) as T);
  }

  async upsert(table: EntityTable, record: JsonRecord): Promise<void> {
    const db = await this.getDatabase();
    await db.withTransactionAsync(async () => {
      await this.upsertInTransaction(db, table, record);
    });
  }

  async upsertMany(table: EntityTable, records: JsonRecord[]): Promise<void> {
    const db = await this.getDatabase();
    await db.withTransactionAsync(async () => {
      for (const record of records) {
        await this.upsertInTransaction(db, table, record);
      }
    });
  }

  async delete(table: EntityTable, id: string | number): Promise<void> {
    const db = await this.getDatabase();
    await db.runAsync(`DELETE FROM ${table} WHERE id = ?`, String(id));
  }

  async replaceAll(table: EntityTable, records: JsonRecord[]): Promise<void> {
    const db = await this.getDatabase();
    await db.withTransactionAsync(async () => {
      await db.runAsync(`DELETE FROM ${table}`);
      for (const record of records) {
        await this.upsertInTransaction(db, table, record);
      }
    });
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
  }
}

export const nativeDb = new NativeDatabaseService();