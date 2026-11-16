import {
  GoogleOneTapSignIn,
  isCancelledResponse,
  isNoSavedCredentialFoundResponse,
  isSuccessResponse,
} from "react-native-nitro-google-signin";

export const GOOGLE_WEB_CLIENT_ID =
  "332549133135-a21m2s0vimuda59q9lhhbdn8a9d63doj.apps.googleusercontent.com";
export const DRIVE_FILE_SCOPE = "https://www.googleapis.com/auth/drive.file";

export type GoogleAccount = {
  id: string;
  email: string | null;
  name: string | null;
  photo: string | null;
};

let configured = false;

function configureGoogleSignIn(): void {
  if (configured) return;
  GoogleOneTapSignIn.configure({
    webClientId: GOOGLE_WEB_CLIENT_ID,
    autoSelectOnSignIn: false,
  });
  configured = true;
}

function getErrorDetails(error: unknown): {
  name: string;
  code: string;
  message: string;
  userInfo: string;
  cause: string;
} {
  if (error instanceof Error) {
    const candidate = error as Error & {
      code?: unknown;
      userInfo?: unknown;
      cause?: unknown;
    };
    return {
      name: candidate.name || "Error",
      code: typeof candidate.code === "string" ? candidate.code : "ندارد",
      message: candidate.message || "بدون پیام",
      userInfo:
        candidate.userInfo && typeof candidate.userInfo === "object"
          ? JSON.stringify(candidate.userInfo)
          : "ندارد",
      cause:
        candidate.cause instanceof Error
          ? candidate.cause.message
          : candidate.cause == null
            ? "ندارد"
            : String(candidate.cause),
    };
  }

  return {
    name: typeof error,
    code: "ندارد",
    message: String(error),
    userInfo: "ندارد",
    cause: "ندارد",
  };
}

function throwGoogleDiagnostic(
  stage: string,
  trail: string[],
  error: unknown,
): never {
  const details = getErrorDetails(error);
  const report = [
    "گزارش تشخیصی اتصال گوگل",
    `مرحله: ${stage}`,
    `مسیر پاسخ‌ها: ${trail.join(" → ") || "ثبت نشده"}`,
    `کد خطا: ${details.code}`,
    `نوع خطا: ${details.name}`,
    `پیام اصلی: ${details.message}`,
    `جزئیات: ${details.userInfo}`,
    `علت داخلی: ${details.cause}`,
  ].join("\n");

  console.error("[Google Sign-In Diagnostic]", report, error);
  throw new Error(report);
}

export function getConnectedGoogleAccount(): GoogleAccount | null {
  configureGoogleSignIn();
  return GoogleOneTapSignIn.getCurrentUser()?.user ?? null;
}

export async function connectGoogleAccount(): Promise<GoogleAccount> {
  let stage = "configure";
  const trail: string[] = [];

  try {
    configureGoogleSignIn();

    stage = "checkPlayServices";
    await GoogleOneTapSignIn.checkPlayServices();

    stage = "signIn";
    let response = await GoogleOneTapSignIn.signIn();
    trail.push(`signIn=${response.type}`);

    if (isNoSavedCredentialFoundResponse(response)) {
      stage = "createAccount";
      response = await GoogleOneTapSignIn.createAccount();
      trail.push(`createAccount=${response.type}`);
    }

    if (isNoSavedCredentialFoundResponse(response)) {
      stage = "presentExplicitSignIn";
      response = await GoogleOneTapSignIn.presentExplicitSignIn();
      trail.push(`presentExplicitSignIn=${response.type}`);
    }

    if (isCancelledResponse(response)) {
      throwGoogleDiagnostic(
        stage,
        trail,
        new Error(`کتابخانه پاسخ cancelled برگرداند؛ مرحله: ${stage}`),
      );
    }

    if (!isSuccessResponse(response)) {
      throwGoogleDiagnostic(
        stage,
        trail,
        new Error(`پاسخ غیرمنتظره از کتابخانه: ${response.type}`),
      );
    }

    if (!response.data.scopes.includes(DRIVE_FILE_SCOPE)) {
      stage = "requestScopes(drive.file)";
      const authorization = await GoogleOneTapSignIn.requestScopes([
        DRIVE_FILE_SCOPE,
      ]);
      if (!authorization.accessToken) {
        throwGoogleDiagnostic(
          stage,
          trail,
          new Error("درخواست مجوز Drive موفق بود اما accessToken خالی است."),
        );
      }
    }

    return response.data.user;
  } catch (error) {
    if (
      error instanceof Error &&
      error.message.startsWith("گزارش تشخیصی اتصال گوگل")
    ) {
      throw error;
    }
    throwGoogleDiagnostic(stage, trail, error);
  }
}

export async function getDriveAccessToken(): Promise<string> {
  configureGoogleSignIn();
  const session = GoogleOneTapSignIn.getCurrentUser();
  if (!session) throw new Error("ابتدا حساب گوگل را متصل کنید.");

  if (!session.scopes.includes(DRIVE_FILE_SCOPE)) {
    const authorization = await GoogleOneTapSignIn.requestScopes([DRIVE_FILE_SCOPE]);
    if (!authorization.accessToken) throw new Error("مجوز Google Drive در دسترس نیست.");
    return authorization.accessToken;
  }
  return (await GoogleOneTapSignIn.getTokens()).accessToken;
}

export async function refreshDriveAccessToken(staleToken: string): Promise<string> {
  configureGoogleSignIn();
  await GoogleOneTapSignIn.clearCachedAccessToken(staleToken);
  return (await GoogleOneTapSignIn.getTokens()).accessToken;
}

export async function disconnectGoogleAccount(): Promise<void> {
  configureGoogleSignIn();
  const session = GoogleOneTapSignIn.getCurrentUser();
  if (session?.user?.id) await GoogleOneTapSignIn.revokeAccess(session.user.id);
  await GoogleOneTapSignIn.signOut();
}
