import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import databaseService, { Tenant } from './DatabaseService';
import globalState from '../state';

// Configure notifications
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

class NotificationService {
  // Request permission to send notifications
  async requestPermissions(): Promise<boolean> {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    
    if (finalStatus !== 'granted') {
      console.log('Failed to get push token for push notification!');
      return false;
    }
    
    return true;
  }
  
  // Schedule a notification
  async scheduleNotification(
    title: string,
    body: string,
    data: any = {},
    trigger: Notifications.NotificationTriggerInput = null
  ): Promise<string> {
    const hasPermission = await this.requestPermissions();
    
    if (!hasPermission) {
      throw new Error('No notification permission');
    }
    
    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data,
        sound: true,
      },
      trigger,
    });
    
    return notificationId;
  }
  
  // Cancel a notification
  async cancelNotification(notificationId: string): Promise<void> {
    await Notifications.cancelScheduledNotificationAsync(notificationId);
  }
  
  // Cancel all notifications
  async cancelAllNotifications(): Promise<void> {
    await Notifications.cancelAllScheduledNotificationsAsync();
  }
  
  // Schedule rent reminders for all active tenants
  async scheduleRentReminders(): Promise<void> {
    try {
      // Get reminder settings
      const settings = await databaseService.getReminderSettings();
      
      if (!settings || !settings.enabled) {
        return;
      }
      
      // Cancel existing rent reminders
      await this.cancelAllNotifications();
      
      // Get all active tenants
      const tenants = await databaseService.getActiveTenants();
      
      for (const tenant of tenants) {
        await this.scheduleRentReminderForTenant(tenant, settings.daysBeforeDue, settings.reminderTime);
      }
      
      console.log(`Scheduled rent reminders for ${tenants.length} tenants`);
    } catch (error) {
      console.error('Error scheduling rent reminders:', error);
    }
  }
  
  // Schedule a rent reminder for a specific tenant
  async scheduleRentReminderForTenant(
    tenant: Tenant,
    daysBeforeDue: number,
    reminderTime: string
  ): Promise<string | null> {
    try {
      // Get the house details
      const house = await databaseService.getHouseById(tenant.houseId);
      
      if (!house) {
        return null;
      }
      
      // Calculate the next rent due date
      const now = new Date();
      const currentMonth = now.getMonth();
      const currentYear = now.getFullYear();
      
      // Create a date for the rent due day in the current month
      let dueDate = new Date(currentYear, currentMonth, tenant.rentDueDay);
      
      // If the due date has passed, use next month
      if (dueDate.getTime() < now.getTime()) {
        dueDate = new Date(currentYear, currentMonth + 1, tenant.rentDueDay);
      }
      
      // Calculate the reminder date (X days before due date)
      const reminderDate = new Date(dueDate);
      reminderDate.setDate(reminderDate.getDate() - daysBeforeDue);
      
      // Set the reminder time
      const [hours, minutes] = reminderTime.split(':').map(Number);
      reminderDate.setHours(hours, minutes, 0, 0);
      
      // If the reminder date has passed, don't schedule
      if (reminderDate.getTime() < now.getTime()) {
        return null;
      }
      
      // Schedule the notification
      const notificationId = await this.scheduleNotification(
        'Rent Reminder',
        `Rent for House ${house.houseNumber} is due on ${dueDate.toLocaleDateString()}. Amount: $${house.rentAmount}`,
        {
          tenantId: tenant.id,
          houseId: house.id,
          dueDate: dueDate.toISOString(),
          amount: house.rentAmount,
        },
        {
          date: reminderDate,
        }
      );
      
      return notificationId;
    } catch (error) {
      console.error('Error scheduling rent reminder for tenant:', error);
      return null;
    }
  }
}

export const notificationService = new NotificationService();
export default notificationService;