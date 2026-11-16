import { getDriveAccessToken, refreshDriveAccessToken } from "./googleAuth";

const DRIVE_API = "https://www.googleapis.com/drive/v3";
const DRIVE_UPLOAD_API = "https://www.googleapis.com/upload/drive/v3";
const APP_FOLDER_NAME = "HadiFactor";
const BACKUP_PREFIX = "HadmanFactorBackup_";

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
  if (!folder.id) throw new Error("پوشه HadiFactor در Google Drive ساخته نشد.");
  return folder.id;
}

export async function createDriveBackup(snapshot: CloudSnapshot): Promise<DriveFile> {
  const folderId = await ensureAppFolder();
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const metadata = {
    name: `${BACKUP_PREFIX}${stamp}.json`,
    mimeType: "application/json",
    parents: [folderId],
    appProperties: { application: "hadman-factor", schemaVersion: String(snapshot.schemaVersion) },
  };
  const boundary = `hadman_factor_${Date.now()}`;
  const body =
    `--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n` +
    JSON.stringify(metadata) +
    `\r\n--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n` +
    JSON.stringify(snapshot) +
    `\r\n--${boundary}--`;

  const uploaded = await authorizedFetch(
    `${DRIVE_UPLOAD_API}/files?uploadType=multipart&fields=id,name,modifiedTime,size`,
    { method: "POST", headers: { "Content-Type": `multipart/related; boundary=${boundary}` }, body },
  );
  return (await uploaded.json()) as DriveFile;
}

async function findLatestBackup(): Promise<DriveFile> {
  const folderId = await ensureAppFolder();
  const query = `'${folderId}' in parents and name contains '${BACKUP_PREFIX}' and trashed = false`;
  const url = `${DRIVE_API}/files?q=${encodeURIComponent(query)}&pageSize=100&orderBy=modifiedTime desc&fields=files(id,name,modifiedTime,size)`;
  const response = await authorizedFetch(url);
  const latest = ((await response.json()) as { files?: DriveFile[] }).files?.[0];
  if (!latest?.id) throw new Error("هنوز نسخه پشتیبانی در Google Drive وجود ندارد.");
  return latest;
}

export async function getLatestDriveBackupInfo(): Promise<DriveFile> {
  return findLatestBackup();
}

export async function downloadLatestDriveBackup(): Promise<CloudSnapshot> {
  const backup = await findLatestBackup();
  const response = await authorizedFetch(`${DRIVE_API}/files/${encodeURIComponent(backup.id)}?alt=media`);
  const snapshot = (await response.json()) as CloudSnapshot;
  if (
    snapshot?.schemaVersion !== 1 ||
    !Array.isArray(snapshot.customers) ||
    !Array.isArray(snapshot.invoices) ||
    !Array.isArray(snapshot.payments) ||
    !snapshot.settings ||
    typeof snapshot.settings !== "object" ||
    !(snapshot.nextCustomerCode === null || typeof snapshot.nextCustomerCode === "string")
  ) {
    throw new Error("فایل پشتیبان معتبر نیست یا با نسخه فعلی برنامه سازگار نیست.");
  }
  return snapshot;
}