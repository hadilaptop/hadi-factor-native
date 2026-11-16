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

export function getConnectedGoogleAccount(): GoogleAccount | null {
  configureGoogleSignIn();
  return GoogleOneTapSignIn.getCurrentUser()?.user ?? null;
}

export async function connectGoogleAccount(): Promise<GoogleAccount> {
  configureGoogleSignIn();
  await GoogleOneTapSignIn.checkPlayServices();

  let response = await GoogleOneTapSignIn.signIn();
  if (isNoSavedCredentialFoundResponse(response)) {
    response = await GoogleOneTapSignIn.createAccount();
  }
  if (isNoSavedCredentialFoundResponse(response)) {
    response = await GoogleOneTapSignIn.presentExplicitSignIn();
  }
  if (isCancelledResponse(response)) throw new Error("ورود به حساب گوگل لغو شد.");
  if (!isSuccessResponse(response)) throw new Error("ورود به حساب گوگل انجام نشد.");

  if (!response.data.scopes.includes(DRIVE_FILE_SCOPE)) {
    const authorization = await GoogleOneTapSignIn.requestScopes([DRIVE_FILE_SCOPE]);
    if (!authorization.accessToken) {
      throw new Error("مجوز دسترسی محدود به Google Drive صادر نشد.");
    }
  }
  return response.data.user;
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
