import React, { useState } from "react";
import { ActivityIndicator, ScrollView, StyleSheet, Text, Pressable, View } from "react-native";
import * as SQLite from "expo-sqlite";

const TEST_DATABASE = "hadi_factor_migration_test.db";

type Result = { label: string; passed: boolean };

export default function App() {
  const [running, setRunning] = useState(false);
  const [results, setResults] = useState<Result[]>([]);
  const [error, setError] = useState("");

  const runNativeSqliteTest = async () => {
    if (running) return;
    setRunning(true);
    setResults([]);
    setError("");
    let db: SQLite.SQLiteDatabase | null = null;

    try {
      db = await SQLite.openDatabaseAsync(TEST_DATABASE);
      await db.execAsync(`
        DROP TABLE IF EXISTS migration_test_records;
        DROP TABLE IF EXISTS migration_test_meta;
        CREATE TABLE migration_test_records (id TEXT PRIMARY KEY NOT NULL, payload TEXT NOT NULL);
        CREATE TABLE migration_test_meta (key TEXT PRIMARY KEY NOT NULL, value TEXT NOT NULL);
      `);

      let expectedFailureCaught = false;
      try {
        await db.withTransactionAsync(async () => {
          await db!.runAsync(
            "INSERT INTO migration_test_records (id, payload) VALUES (?, ?)",
            "rollback-check",
            JSON.stringify({ test: true }),
          );
          await db!.runAsync(
            "INSERT INTO migration_test_meta (key, value) VALUES (?, ?)",
            "sqlite_initial_import_v1",
            "done",
          );
          throw new Error("INTENTIONAL_ROLLBACK_TEST");
        });
      } catch (e) {
        expectedFailureCaught = e instanceof Error && e.message.includes("INTENTIONAL_ROLLBACK_TEST");
      }

      const recordCount = await db.getFirstAsync<{ count: number }>(
        "SELECT COUNT(*) AS count FROM migration_test_records",
      );
      const doneRow = await db.getFirstAsync<{ value: string }>(
        "SELECT value FROM migration_test_meta WHERE key = ?",
        "sqlite_initial_import_v1",
      );

      const checks: Result[] = [
        { label: "اتصال به Expo SQLite Native", passed: true },
        { label: "خطای عمدی داخل تراکنش دریافت شد", passed: expectedFailureCaught },
        { label: "رکورد نیمه‌کاره پس از rollback باقی نماند", passed: recordCount?.count === 0 },
        { label: "نشانگر done پس از rollback ثبت نشد", passed: doneRow == null },
      ];
      setResults(checks);
      if (checks.some((item) => !item.passed)) {
        setError("حداقل یکی از بررسی‌ها ناموفق بود.");
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      if (db) {
        try { await db.closeAsync(); } catch {}
      }
      setRunning(false);
    }
  };

  const allPassed = results.length > 0 && results.every((item) => item.passed);

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>آزمایش مستقل SQLite</Text>
        <Text style={styles.subtitle}>این صفحه فقط از دیتابیس آزمایشی زیر استفاده می‌کند:</Text>
        <Text style={styles.database}>{TEST_DATABASE}</Text>
        <Text style={styles.warning}>دیتابیس اصلی برنامه، AsyncStorage و Google Drive در این تست فراخوانی نمی‌شوند.</Text>
        <Pressable
          accessibilityRole="button"
          disabled={running}
          onPress={runNativeSqliteTest}
          style={({ pressed }) => [styles.button, pressed && styles.buttonPressed, running && styles.buttonDisabled]}
        >
          {running ? <ActivityIndicator color="#ffffff" /> : <Text style={styles.buttonText}>اجرای تست Native روی گوشی</Text>}
        </Pressable>
        {results.map((item, index) => (
          <View key={index} style={styles.resultRow}>
            <Text style={[styles.resultIcon, { color: item.passed ? "#16a34a" : "#dc2626" }]}>{item.passed ? "✓" : "✕"}</Text>
            <Text style={styles.resultText}>{item.label}</Text>
          </View>
        ))}
        {error ? <Text style={styles.error}>{error}</Text> : null}
        {allPassed ? <Text style={styles.success}>همه بررسی‌ها موفق شدند؛ rollback در Expo SQLite Native تأیید شد.</Text> : null}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#eef6fb" },
  content: { flexGrow: 1, justifyContent: "center", padding: 24 },
  title: { color: "#12344a", fontSize: 24, fontWeight: "700", textAlign: "center", marginBottom: 12 },
  subtitle: { color: "#334155", fontSize: 15, textAlign: "center" },
  database: { color: "#075985", fontSize: 14, fontWeight: "700", textAlign: "center", marginVertical: 12 },
  warning: { color: "#92400e", backgroundColor: "#fef3c7", padding: 12, borderRadius: 10, textAlign: "center", lineHeight: 23, marginVertical: 14 },
  button: { backgroundColor: "#0f766e", borderRadius: 12, padding: 16, alignItems: "center", marginVertical: 16 },
  buttonPressed: { opacity: 0.8 },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: "#ffffff", fontSize: 16, fontWeight: "700" },
  resultRow: { flexDirection: "row", alignItems: "center", backgroundColor: "#ffffff", borderRadius: 10, padding: 12, marginTop: 8 },
  resultIcon: { fontSize: 20, fontWeight: "700", marginRight: 10 },
  resultText: { color: "#1e293b", fontSize: 14, flex: 1 },
  success: { color: "#166534", backgroundColor: "#dcfce7", padding: 14, borderRadius: 10, textAlign: "center", fontWeight: "700", marginTop: 16, lineHeight: 24 },
  error: { color: "#991b1b", backgroundColor: "#fee2e2", padding: 12, borderRadius: 10, marginTop: 12 },
});