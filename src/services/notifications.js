import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import { Platform } from "react-native";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export async function registerForPushNotifications() {
  if (!Device.isDevice) return null;
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
}

export async function sendLocalNotification(title, body) {
  await Notifications.scheduleNotificationAsync({
    content: { title, body, sound: true },
    trigger: null,
  });
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
