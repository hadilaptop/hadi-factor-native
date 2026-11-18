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

export function getConnectedGoogleAccount(): GoogleAccount | null {
  configureGoogleSignIn();
  return GoogleOneTapSignIn.getCurrentUser()?.user ?? null;
}

export async function connectGoogleAccount(): Promise<GoogleAccount> {
  try {
    configureGoogleSignIn();
    await GoogleOneTapSignIn.checkPlayServices();

    let response = await GoogleOneTapSignIn.createAccount();
    if (isNoSavedCredentialFoundResponse(response)) {
      response = await GoogleOneTapSignIn.presentExplicitSignIn();
    }

    if (isCancelledResponse(response) || !isSuccessResponse(response)) {
      throw new Error("خطا در ورود به حساب Google Drive");
    }

    if (!response.data.user?.id) {
      throw new Error("خطا در ورود به حساب Google Drive");
    }

    const hasDriveScope = response.data.scopes.includes(DRIVE_FILE_SCOPE);
    if (!hasDriveScope) {
      const authorization = await GoogleOneTapSignIn.requestScopes([
        DRIVE_FILE_SCOPE,
      ]);
      if (!authorization.accessToken) {
        throw new Error("خطا در ورود به حساب Google Drive");
      }
    } else {
      const tokens = await GoogleOneTapSignIn.getTokens();
      if (!tokens.accessToken) {
        throw new Error("خطا در ورود به حساب Google Drive");
      }
    }

    return response.data.user;
  } catch {
    throw new Error("خطا در ورود به حساب Google Drive");
  }
}

export async function getDriveAccessToken(): Promise<string> {
  configureGoogleSignIn();
  const session = GoogleOneTapSignIn.getCurrentUser();
  if (!session) {
    throw new Error("ابتدا حساب گوگل را متصل کنید.");
  }

  if (!session.scopes.includes(DRIVE_FILE_SCOPE)) {
    const authorization = await GoogleOneTapSignIn.requestScopes([DRIVE_FILE_SCOPE]);
    if (!authorization.accessToken) throw new Error("مجوز Google Drive در دسترس نیست.");
    return authorization.accessToken as string;
  }

  const tokens = await GoogleOneTapSignIn.getTokens();
  if (!tokens.accessToken) throw new Error("Google توکن دسترسی خالی برگرداند.");
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