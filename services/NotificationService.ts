import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';

class NotificationService {
  async registerForPushNotifications() {
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
      });
    }

    if (Device.isDevice) {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      
      if (finalStatus !== 'granted') {
        console.log('Failed to get push token for push notification!');
        return;
      }
    } else {
      console.log('Must use physical device for Push Notifications');
    }
  }

  async scheduleRentReminder(tenantName: string, houseNumber: string, dueDate: Date) {
    // Schedule the notification 3 days before rent is due
    const reminderDate = new Date(dueDate);
    reminderDate.setDate(reminderDate.getDate() - 3);
    
    // Make sure the reminder date is in the future
    if (reminderDate <= new Date()) {
      console.log('Reminder date is in the past, not scheduling');
      return;
    }
    
    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Rent Reminder',
        body: `Reminder: ${tenantName}'s rent for house ${houseNumber} is due on ${dueDate.toLocaleDateString()}`,
        data: { tenantName, houseNumber, dueDate: dueDate.toISOString() },
      },
      trigger: reminderDate,
    });
  }

  async sendUtilityBillNotification(tenantName: string, houseNumber: string, billType: string, amount: number) {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: `${billType.charAt(0).toUpperCase() + billType.slice(1)} Bill`,
        body: `${tenantName}'s ${billType} bill for house ${houseNumber} is ${amount.toFixed(2)}`,
        data: { tenantName, houseNumber, billType, amount },
      },
      trigger: null, // Send immediately
    });
  }

  async cancelAllNotifications() {
    await Notifications.cancelAllScheduledNotificationsAsync();
  }
}

export const notificationService = new NotificationService();
export default notificationService;