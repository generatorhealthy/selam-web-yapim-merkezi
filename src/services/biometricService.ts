import { Capacitor } from "@capacitor/core";
import { NativeBiometric, BiometryType } from "capacitor-native-biometric";

const SERVER = "doktorumol.biometric";

export const isBiometricAvailable = async (): Promise<boolean> => {
  if (!Capacitor.isNativePlatform()) return false;
  try {
    const r = await NativeBiometric.isAvailable();
    return r.isAvailable;
  } catch {
    return false;
  }
};

export const getBiometricType = async (): Promise<string> => {
  if (!Capacitor.isNativePlatform()) return "none";
  try {
    const r = await NativeBiometric.isAvailable();
    if (!r.isAvailable) return "none";
    switch (r.biometryType) {
      case BiometryType.FACE_ID:
      case BiometryType.FACE_AUTHENTICATION:
        return "Face ID";
      case BiometryType.TOUCH_ID:
      case BiometryType.FINGERPRINT:
        return "Parmak İzi";
      default:
        return "Biyometrik";
    }
  } catch {
    return "none";
  }
};

export const saveBiometricCredentials = async (username: string, password: string) => {
  if (!Capacitor.isNativePlatform()) return false;
  try {
    await NativeBiometric.setCredentials({ username, password, server: SERVER });
    return true;
  } catch (e) {
    console.error("[Biometric] save failed", e);
    return false;
  }
};

export const getBiometricCredentials = async (): Promise<{ username: string; password: string } | null> => {
  if (!Capacitor.isNativePlatform()) return null;
  try {
    await NativeBiometric.verifyIdentity({
      reason: "Hesabınıza giriş yapın",
      title: "Biyometrik Giriş",
      subtitle: "Face ID veya parmak izinizi kullanın",
    });
    const creds = await NativeBiometric.getCredentials({ server: SERVER });
    return { username: creds.username, password: creds.password };
  } catch (e) {
    console.warn("[Biometric] verify failed", e);
    return null;
  }
};

export const deleteBiometricCredentials = async () => {
  if (!Capacitor.isNativePlatform()) return;
  try {
    await NativeBiometric.deleteCredentials({ server: SERVER });
  } catch (e) {
    console.warn("[Biometric] delete failed", e);
  }
};

export const hasBiometricCredentialsStored = async (): Promise<boolean> => {
  if (!Capacitor.isNativePlatform()) return false;
  try {
    const creds = await NativeBiometric.getCredentials({ server: SERVER });
    return !!creds.username;
  } catch {
    return false;
  }
};
