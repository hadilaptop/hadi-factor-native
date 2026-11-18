import { getDriveAccessToken, refreshDriveAccessToken } from "./googleAuth";

const DRIVE_API = "https://www.googleapis.com/drive/v3";
const DRIVE_UPLOAD_API = "https://www.googleapis.com/upload/drive/v3";
const APP_FOLDER_NAME = "Hadman Factor";
const BACKUP_PREFIX = "HadmanFactorBackup_";
const BACKUP_FILE_NAME = "HadmanFactorBackup.json";

type DriveFile = { id: string; name: string; modifiedTime?: string; size?: string };
type CloudRecord = { id: string | number; customerId?: string | number; items?: unknown };
export type CloudSnapshot = {
  schemaVersion: 1;
  createdAt: string;
  customers: CloudRecord[];
  invoices: CloudRecord[];
  payments: CloudRecord[];
  settings: Record<string, string>;
  nextCustomerCode: string | null;
};

async function authorizedFetch(url: string, init: RequestInit = {}): Promise<Response> {
  let token = await getDriveAccessToken();
  const send = () => fetch(url, {
    ...init,
    headers: { ...(init.headers ?? {}), Authorization: `Bearer ${token}` },
  });
  let response = await send();
  if (response.status === 401) {
    token = await refreshDriveAccessToken(token);
    response = await send();
  }
  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new Error(`Google Drive خطای ${response.status} برگرداند.${detail ? " " + detail.slice(0, 240) : ""}`);
  }
  return response;
}

async function ensureAppFolder(): Promise<string> {
  const query = `name = '${APP_FOLDER_NAME}' and mimeType = 'application/vnd.google-apps.folder' and trashed = false`;
  const listUrl = `${DRIVE_API}/files?q=${encodeURIComponent(query)}&spaces=drive&pageSize=100&fields=files(id,name,mimeType)`;
  const list = await authorizedFetch(listUrl);
  const existing = ((await list.json()) as { files?: DriveFile[] }).files?.[0];
  if (existing?.id) return existing.id;

  const created = await authorizedFetch(`${DRIVE_API}/files?fields=id,name`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name: APP_FOLDER_NAME, mimeType: "application/vnd.google-apps.folder" }),
  });
  const folder = (await created.json()) as DriveFile;
  if (!folder.id) throw new Error("پوشه Hadman Factor در Google Drive ساخته نشد.");
  return folder.id;
}

/** Read-only connectivity check. Does not create, update, or delete Drive files. */
export async function testDriveConnection(): Promise<{ visibleFileCount: number }> {
  const response = await authorizedFetch(
    `${DRIVE_API}/files?pageSize=1&fields=files(id,mimeType)`,
  );
  const result = (await response.json()) as { files?: unknown[] };
  return { visibleFileCount: Array.isArray(result.files) ? result.files.length : 0 };
}

async function findBackupToUpdate(folderId: string): Promise<DriveFile | null> {
  const fixedQuery = `'${folderId}' in parents and name = '${BACKUP_FILE_NAME}' and trashed = false`;
  const fixedUrl = `${DRIVE_API}/files?q=${encodeURIComponent(fixedQuery)}&pageSize=10&fields=files(id,name,modifiedTime,size)`;
  const fixedResponse = await authorizedFetch(fixedUrl);
  const fixed = ((await fixedResponse.json()) as { files?: DriveFile[] }).files?.[0];
  if (fixed?.id) return fixed;

  const legacyQuery = `'${folderId}' in parents and name contains '${BACKUP_PREFIX}' and trashed = false`;
  const legacyUrl = `${DRIVE_API}/files?q=${encodeURIComponent(legacyQuery)}&pageSize=100&orderBy=modifiedTime desc&fields=files(id,name,modifiedTime,size)`;
  const legacyResponse = await authorizedFetch(legacyUrl);
  return ((await legacyResponse.json()) as { files?: DriveFile[] }).files?.[0] ?? null;
}

export async function createDriveBackup(snapshot: CloudSnapshot): Promise<DriveFile> {
  const hasRecords =
    snapshot.customers.length > 0 ||
    snapshot.invoices.length > 0 ||
    snapshot.payments.length > 0;
  const hasCompanySettings = Object.entries(snapshot.settings ?? {}).some(
    ([key, value]) => key !== "invoiceTheme" && typeof value === "string" && value.trim().length > 0,
  );
  if (!hasRecords && !hasCompanySettings) {
    throw new Error("اطلاعات محلی برای تهیه نسخه پشتیبان کافی نیست؛ برای محافظت از نسخه قبلی، آپلود متوقف شد.");
  }
  const folderId = await ensureAppFolder();
  const existing = await findBackupToUpdate(folderId);
  const metadata = {
    name: BACKUP_FILE_NAME,
    mimeType: "application/json",
    appProperties: { application: "hadman-factor", schemaVersion: String(snapshot.schemaVersion) },
  };

  if (existing?.id) {
    if (existing.name !== BACKUP_FILE_NAME) {
      await authorizedFetch(`${DRIVE_API}/files/${encodeURIComponent(existing.id)}?fields=id,name`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: BACKUP_FILE_NAME }),
      });
    }

    const updated = await authorizedFetch(
      `${DRIVE_UPLOAD_API}/files/${encodeURIComponent(existing.id)}?uploadType=media&fields=id,name,modifiedTime,size`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json; charset=UTF-8" },
        body: JSON.stringify(snapshot),
      },
    );
    return (await updated.json()) as DriveFile;
  }

  const boundary = `hadman_factor_${Date.now()}`;
  const body =
    `--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n` +
    JSON.stringify({ ...metadata, parents: [folderId] }) +
    `\r\n--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n` +
    JSON.stringify(snapshot) +
    `\r\n--${boundary}--`;

  const uploaded = await authorizedFetch(
    `${DRIVE_UPLOAD_API}/files?uploadType=multipart&fields=id,name,modifiedTime,size`,
    { method: "POST", headers: { "Content-Type": `multipart/related; boundary=${boundary}` }, body },
  );
  return (await uploaded.json()) as DriveFile;
}

async function findLatestBackup(): Promise<DriveFile | null> {
  const folderId = await ensureAppFolder();
  const fixedQuery = `'${folderId}' in parents and name = '${BACKUP_FILE_NAME}' and trashed = false`;
  const fixedUrl = `${DRIVE_API}/files?q=${encodeURIComponent(fixedQuery)}&pageSize=10&fields=files(id,name,modifiedTime,size)`;
  const fixedResponse = await authorizedFetch(fixedUrl);
  const fixed = ((await fixedResponse.json()) as { files?: DriveFile[] }).files?.[0];
  if (fixed?.id) return fixed;

  const legacyQuery = `'${folderId}' in parents and name contains '${BACKUP_PREFIX}' and trashed = false`;
  const legacyUrl = `${DRIVE_API}/files?q=${encodeURIComponent(legacyQuery)}&pageSize=100&orderBy=modifiedTime desc&fields=files(id,name,modifiedTime,size)`;
  const legacyResponse = await authorizedFetch(legacyUrl);
  const latest = ((await legacyResponse.json()) as { files?: DriveFile[] }).files?.[0];
  if (!latest?.id) return null;
  return latest;
}

export async function getLatestDriveBackupInfo(): Promise<DriveFile | null> {
  return findLatestBackup();
}

export async function downloadLatestDriveBackup(): Promise<CloudSnapshot> {
  const backup = await findLatestBackup();
  if (!backup) throw new Error("هنوز نسخه پشتیبانی در Google Drive وجود ندارد.");
  const response = await authorizedFetch(`${DRIVE_API}/files/${encodeURIComponent(backup.id)}?alt=media`);
  const snapshot = (await response.json()) as CloudSnapshot;
  if (
    snapshot?.schemaVersion !== 1 ||
    typeof snapshot.createdAt !== "string" ||
    !Array.isArray(snapshot.customers) ||
    !Array.isArray(snapshot.invoices) ||
    !Array.isArray(snapshot.payments) ||
    !snapshot.settings ||
    typeof snapshot.settings !== "object" ||
    Array.isArray(snapshot.settings) ||
    !Object.values(snapshot.settings).every((value) => typeof value === "string") ||
    ![...snapshot.customers, ...snapshot.invoices, ...snapshot.payments].every(
      (record) =>
        Boolean(record) &&
        typeof record === "object" &&
        (typeof record.id === "string" || typeof record.id === "number"),
    ) ||
    !(snapshot.nextCustomerCode === null || typeof snapshot.nextCustomerCode === "string")
  ) {
    throw new Error("فایل پشتیبان معتبر نیست یا با نسخه فعلی برنامه سازگار نیست.");
  }
  return snapshot;
}