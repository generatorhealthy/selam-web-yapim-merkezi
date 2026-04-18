import { Capacitor } from "@capacitor/core";
import { PushNotifications, Token } from "@capacitor/push-notifications";
import { LocalNotifications } from "@capacitor/local-notifications";
import { supabase } from "@/integrations/supabase/client";

export const initPushNotifications = async (userId?: string) => {
  if (!Capacitor.isNativePlatform()) return;

  try {
    // Request permission
    let permStatus = await PushNotifications.checkPermissions();
    if (permStatus.receive === "prompt") {
      permStatus = await PushNotifications.requestPermissions();
    }
    if (permStatus.receive !== "granted") {
      console.warn("[Push] permission denied");
      return;
    }

    await PushNotifications.register();

    // Local notifications permissions too
    await LocalNotifications.requestPermissions();

    PushNotifications.addListener("registration", async (token: Token) => {
      console.log("[Push] token:", token.value);
      if (userId) {
        try {
          await supabase.from("push_tokens" as any).upsert({
            user_id: userId,
            token: token.value,
            platform: Capacitor.getPlatform(),
          });
        } catch (e) {
          console.warn("[Push] token save failed", e);
        }
      }
    });

    PushNotifications.addListener("registrationError", (err) => {
      console.error("[Push] registration error:", err);
    });

    PushNotifications.addListener("pushNotificationReceived", (n) => {
      console.log("[Push] received in foreground:", n);
      // Show as local notification when app is in foreground
      LocalNotifications.schedule({
        notifications: [
          {
            id: Date.now() % 100000,
            title: n.title || "Bildirim",
            body: n.body || "",
            schedule: { at: new Date(Date.now() + 100) },
          },
        ],
      });
    });

    PushNotifications.addListener("pushNotificationActionPerformed", (action) => {
      console.log("[Push] action:", action);
      const url = (action.notification.data as any)?.url;
      if (url) window.location.href = url;
    });
  } catch (e) {
    console.error("[Push] init failed", e);
  }
};

export const scheduleAppointmentReminder = async (
  appointmentId: string,
  title: string,
  body: string,
  date: Date
) => {
  if (!Capacitor.isNativePlatform()) return;
  try {
    await LocalNotifications.schedule({
      notifications: [
        {
          id: Math.abs(hashCode(appointmentId)) % 1000000,
          title,
          body,
          schedule: { at: date },
        },
      ],
    });
  } catch (e) {
    console.error("[Local notif] schedule failed", e);
  }
};

const hashCode = (s: string) => {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (Math.imul(31, h) + s.charCodeAt(i)) | 0;
  return h;
};
