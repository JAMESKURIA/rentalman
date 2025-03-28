import * as Notifications from "expo-notifications";
import globalState from "../state";
import databaseService from "./DatabaseService";

// Configure notifications
Notifications.setNotificationHandler({
	handleNotification: async () => ({
		shouldShowAlert: true,
		shouldPlaySound: true,
		shouldSetBadge: false,
	}),
});

class NotificationService {
	/**
	 * Request notification permissions
	 * @returns {Promise<boolean>} Whether permissions were granted
	 */
	async requestPermissions(): Promise<boolean> {
		const { status: existingStatus } =
			await Notifications.getPermissionsAsync();
		let finalStatus = existingStatus;

		if (existingStatus !== "granted") {
			const { status } = await Notifications.requestPermissionsAsync();
			finalStatus = status;
		}

		return finalStatus === "granted";
	}

	/**
	 * Schedule a notification
	 * @param {string} title - Notification title
	 * @param {string} body - Notification body
	 * @param {Date} triggerDate - Date to trigger the notification
	 * @returns {Promise<string>} Notification identifier
	 */
	async scheduleNotification(
		title: string,
		body: string,
		triggerDate: Date
	): Promise<string> {
		// Validate the date to prevent out of bounds errors
		const now = new Date();
		const maxDate = new Date(
			now.getFullYear() + 1,
			now.getMonth(),
			now.getDate()
		); // Max 1 year in the future

		// If the date is invalid or too far in the future, use a reasonable default
		if (
			isNaN(triggerDate.getTime()) ||
			triggerDate < now ||
			triggerDate > maxDate
		) {
			console.warn(
				`Invalid trigger date: ${triggerDate}. Using tomorrow instead.`
			);
			triggerDate = new Date(
				now.getFullYear(),
				now.getMonth(),
				now.getDate() + 1,
				9,
				0
			);
		}

		return await Notifications.scheduleNotificationAsync({
			content: {
				title,
				body,
				sound: true,
				priority: Notifications.AndroidNotificationPriority.HIGH,
			},
			trigger: {
				date: triggerDate,
			},
		});
	}

	/**
	 * Cancel all scheduled notifications
	 */
	async cancelAllNotifications(): Promise<void> {
		await Notifications.cancelAllScheduledNotificationsAsync();
	}

	/**
	 * Schedule rent reminders for all active tenants
	 */
	async scheduleRentReminders(): Promise<void> {
		try {
			// Cancel existing notifications first
			await this.cancelAllNotifications();

			// Get reminder settings
			const reminderSettings = globalState.settings.rentReminders.get();

			if (!reminderSettings.enabled) {
				return;
			}

			// Get all active tenants
			const tenants = await databaseService.getActiveTenants();
			let scheduledCount = 0;

			for (const tenant of tenants) {
				try {
					// Get house details
					const house = await databaseService.getHouseById(
						tenant.houseId
					);

					if (!house) continue;

					// Calculate next rent due date
					const now = new Date();
					const rentDueDay = tenant.rentDueDay || 1; // Default to 1st if not set

					// Create a date for the next rent due date
					let nextDueDate = new Date(
						now.getFullYear(),
						now.getMonth(),
						rentDueDay
					);

					// If the due date has already passed this month, move to next month
					if (nextDueDate.getTime() <= now.getTime()) {
						nextDueDate = new Date(
							now.getFullYear(),
							now.getMonth() + 1,
							rentDueDay
						);
					}

					// Calculate reminder date (X days before due date)
					const reminderDate = new Date(nextDueDate);
					reminderDate.setDate(
						reminderDate.getDate() - reminderSettings.daysBeforeDue
					);

					// Set the time for the reminder
					const [hours, minutes] = reminderSettings.reminderTime
						.split(":")
						.map(Number);
					reminderDate.setHours(hours || 9, minutes || 0, 0, 0);

					// If the reminder date is in the past, skip it
					if (reminderDate.getTime() <= now.getTime()) {
						continue;
					}

					// Schedule the notification
					const title = "Rent Reminder";
					const body = `Rent for house ${
						house.houseNumber
					} ($${house.rentAmount.toFixed(2)}) is due in ${
						reminderSettings.daysBeforeDue
					} days.`;

					await this.scheduleNotification(title, body, reminderDate);
					scheduledCount++;
				} catch (error) {
					console.error(
						"Error scheduling rent reminder for tenant:",
						error
					);
				}
			}

			console.log(
				`Scheduled rent reminders for ${scheduledCount} tenants`
			);
		} catch (error) {
			console.error("Error scheduling rent reminders:", error);
		}
	}
}

export default new NotificationService();
