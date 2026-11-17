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
    scopes: [DRIVE_FILE_SCOPE],
    autoSelectOnSignIn: false,
  });
  configured = true;
}

/** Logs only non-sensitive checkpoints; never log tokens, account identifiers, or profile data. */
function logGoogleStep(step: string, details: Record<string, string | number | boolean>): void {
  console.info("[HADEX_GOOGLE_DIAG]", JSON.stringify({ step, ...details }));
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
    logGoogleStep("configure", { success: true, driveScopeConfigured: true });

    stage = "checkPlayServices";
    await GoogleOneTapSignIn.checkPlayServices();
    logGoogleStep("play_services", { success: true });

    stage = "signIn";
    let response = await GoogleOneTapSignIn.signIn();
    trail.push(`signIn=${response.type}`);
    logGoogleStep("account_selection", { responseType: response.type });

    if (isNoSavedCredentialFoundResponse(response)) {
      stage = "createAccount";
      response = await GoogleOneTapSignIn.createAccount();
      trail.push(`createAccount=${response.type}`);
      logGoogleStep("create_account", { responseType: response.type });
    }

    if (isNoSavedCredentialFoundResponse(response)) {
      stage = "presentExplicitSignIn";
      response = await GoogleOneTapSignIn.presentExplicitSignIn();
      trail.push(`presentExplicitSignIn=${response.type}`);
      logGoogleStep("explicit_sign_in", { responseType: response.type });
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

    const hasUserId = Boolean(response.data.user?.id);
    const hasEmail = Boolean(response.data.user?.email);
    const hasIdToken = Boolean(response.data.idToken);
    logGoogleStep("identity", {
      success: hasUserId,
      hasEmail,
      hasIdToken,
      grantedScopeCount: response.data.scopes.length,
    });
    if (!hasUserId) {
      throwGoogleDiagnostic(stage, trail, new Error("ورود موفق گزارش شد اما شناسه کاربر خالی است."));
    }

    const hasDriveScope = response.data.scopes.includes(DRIVE_FILE_SCOPE);
    logGoogleStep("drive_scope_before_request", { granted: hasDriveScope });

    if (!hasDriveScope) {
      stage = "requestScopes(drive.file)";
      logGoogleStep("drive_scope_request", { started: true });
      const authorization = await GoogleOneTapSignIn.requestScopes([
        DRIVE_FILE_SCOPE,
      ]);
      const hasAccessToken = Boolean(authorization.accessToken);
      logGoogleStep("request_scopes_result", {
        accessTokenReceived: hasAccessToken,
        serverAuthCodeReceived: Boolean(authorization.serverAuthCode),
      });
      if (!hasAccessToken) {
        throwGoogleDiagnostic(
          stage,
          trail,
          new Error("درخواست مجوز Drive انجام شد اما Access Token خالی برگشت."),
        );
      }
    } else {
      stage = "getTokens";
      const tokens = await GoogleOneTapSignIn.getTokens();
      logGoogleStep("get_tokens_result", {
        accessTokenReceived: Boolean(tokens.accessToken),
        idTokenReceived: Boolean(tokens.idToken),
      });
      if (!tokens.accessToken) {
        throwGoogleDiagnostic(stage, trail, new Error("getTokens اجرا شد اما Access Token خالی برگشت."));
      }
    }

    logGoogleStep("connect_complete", { success: true });
    return response.data.user;
  } catch (error) {
    if (
      error instanceof Error &&
      error.message.startsWith("گزارش تشخیصی اتصال گوگل")
    ) {
      throw error;
    }
    logGoogleStep("connect_failed", { stage, trail: trail.join(" -> ") });
    throwGoogleDiagnostic(stage, trail, error);
  }
}

export async function getDriveAccessToken(): Promise<string> {
  configureGoogleSignIn();
  const session = GoogleOneTapSignIn.getCurrentUser();
  if (!session) {
    logGoogleStep("drive_token_session", { sessionFound: false });
    throw new Error("ابتدا حساب گوگل را متصل کنید.");
  }

  logGoogleStep("drive_token_session", {
    sessionFound: true,
    driveScopeGranted: session.scopes.includes(DRIVE_FILE_SCOPE),
    grantedScopeCount: session.scopes.length,
  });

  if (!session.scopes.includes(DRIVE_FILE_SCOPE)) {
    logGoogleStep("drive_token_scope_request", { started: true });
    const authorization = await GoogleOneTapSignIn.requestScopes([DRIVE_FILE_SCOPE]);
    const accessTokenReceived = Boolean(authorization.accessToken);
    logGoogleStep("drive_token_scope_result", { accessTokenReceived });
    if (!accessTokenReceived) throw new Error("مجوز Google Drive در دسترس نیست.");
    return authorization.accessToken as string;
  }
  const tokens = await GoogleOneTapSignIn.getTokens();
  const accessTokenReceived = Boolean(tokens.accessToken);
  logGoogleStep("drive_get_tokens_result", { accessTokenReceived });
  if (!accessTokenReceived) throw new Error("Google توکن دسترسی خالی برگرداند.");
  return tokens.accessToken;
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