import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import { Platform } from "react-native";

if (Platform.OS !== "web" && Notifications?.setNotificationHandler) {
  try {
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
      }),
    });
  } catch (e) {}
}

export async function registerForPushNotifications() {
  if (Platform.OS === "web" || !Device?.isDevice || !Notifications?.getPermissionsAsync) return null;
  try {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== "granted") {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    if (finalStatus !== "granted") return null;
    if (Platform.OS === "android") {
      await Notifications.setNotificationChannelAsync("default", {
        name: "default",
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
      });
    }
    return true;
  } catch (e) {
    return null;
  }
}

export async function sendLocalNotification(title, body) {
  if (Platform.OS === "web" || !Notifications?.scheduleNotificationAsync) return;
  try {
    await Notifications.scheduleNotificationAsync({
      content: { title, body, sound: true },
      trigger: null,
    });
  } catch (e) {}
}

export async function scheduleMonthlyBudgetAlert(totalExpense, budget) {
  const percent = (totalExpense / budget) * 100;
  if (percent >= 80) {
    await sendLocalNotification(
      "Budget Alert!",
      `You have used ${percent.toFixed(0)}% of your monthly budget. Remaining: Tk ${(budget - totalExpense).toFixed(0)}`
    );
  }
}
