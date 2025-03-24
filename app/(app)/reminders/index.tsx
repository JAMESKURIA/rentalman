import React, { useState, useEffect } from 'react';
import { View, Text, Switch, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../../utils/ThemeContext';
import Container from '../../../components/Container';
import Card from '../../../components/Card';
import Input from '../../../components/Input';
import Button from '../../../components/Button';
import databaseService from '../../../services/DatabaseService';
import notificationService from '../../../services/NotificationService';
import globalState from '../../../state';

export default function RentRemindersScreen() {
  const { isDarkMode } = useTheme();
  const router = useRouter();
  
  // Get reminder settings from global state
  const reminderSettings = globalState.settings.rentReminders.get();
  
  // Form state
  const [enabled, setEnabled] = useState(reminderSettings.enabled);
  const [daysBeforeDue, setDaysBeforeDue] = useState(reminderSettings.daysBeforeDue.toString());
  const [reminderTime, setReminderTime] = useState(reminderSettings.reminderTime);
  const [loading, setLoading] = useState(false);
  
  // Errors
  const [errors, setErrors] = useState({
    daysBeforeDue: '',
    reminderTime: '',
  });
  
  // Validate form
  const validate = () => {
    const newErrors = {
      daysBeforeDue: '',
      reminderTime: '',
    };
    
    if (!daysBeforeDue.trim()) {
      newErrors.daysBeforeDue = 'Days before due is required';
    } else if (isNaN(parseInt(daysBeforeDue)) || parseInt(daysBeforeDue) < 0 || parseInt(daysBeforeDue) > 30) {
      newErrors.daysBeforeDue = 'Days before due must be between 0 and 30';
    }
    
    if (!reminderTime.trim()) {
      newErrors.reminderTime = 'Reminder time is required';
    } else if (!/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(reminderTime)) {
      newErrors.reminderTime = 'Reminder time must be in HH:MM format';
    }
    
    setErrors(newErrors);
    
    return !Object.values(newErrors).some(error => error);
  };
  
  // Handle form submission
  const handleSubmit = async () => {
    if (!validate()) {
      return;
    }
    
    setLoading(true);
    try {
      const settings = {
        enabled,
        daysBeforeDue: parseInt(daysBeforeDue),
        reminderTime,
      };
      
      await databaseService.updateReminderSettings(settings);
      
      // Update global state
      globalState.settings.rentReminders.set(settings);
      
      // Schedule reminders if enabled
      if (enabled) {
        await notificationService.scheduleRentReminders();
      } else {
        await notificationService.cancelAllNotifications();
      }
      
      Alert.alert(
        'Success',
        'Reminder settings updated successfully',
        [
          {
            text: 'OK',
            onPress: () => router.back(),
          },
        ]
      );
    } catch (error) {
      console.error('Error updating reminder settings:', error);
      Alert.alert('Error', 'Failed to update reminder settings');
    } finally {
      setLoading(false);
    }
  };
  
  // Request notification permissions
  useEffect(() => {
    const requestPermissions = async () => {
      const hasPermission = await notificationService.requestPermissions();
      if (!hasPermission) {
        Alert.alert(
          'Notification Permission',
          'Please enable notifications to receive rent reminders',
          [{ text: 'OK' }]
        );
      }
    };
    
    requestPermissions();
  }, []);
  
  return (
    <Container scrollable>
      <Text className={`text-2xl font-bold mb-6 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
        Rent Reminders
      </Text>
      
      <Card className="mb-6">
        <Text className={`text-lg font-bold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
          Reminder Settings
        </Text>
        
        <View className="flex-row justify-between items-center mb-4">
          <Text className={`${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
            Enable Rent Reminders
          </Text>
          <Switch
            value={enabled}
            onValueChange={setEnabled}
            trackColor={{ false: '#767577', true: '#3B82F6' }}
            thumbColor={enabled ? '#FFFFFF' : '#F4F3F4'}
          />
        </View>
        
        <Input
          label="Days Before Due"
          value={daysBeforeDue}
          onChangeText={setDaysBeforeDue}
          placeholder="e.g., 3"
          keyboardType="numeric"
          error={errors.daysBeforeDue}
          disabled={!enabled}
        />
        
        <Input
          label="Reminder Time (HH:MM)"
          value={reminderTime}
          onChangeText={setReminderTime}
          placeholder="e.g., 09:00"
          error={errors.reminderTime}
          disabled={!enabled}
        />
        
        <Text className={`mt-2 text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
          Reminders will be sent {daysBeforeDue} days before rent is due at {reminderTime}.
        </Text>
      </Card>
      
      <Card className="mb-6">
        <Text className={`text-lg font-bold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
          How It Works
        </Text>
        
        <View className="mb-3">
          <View className="flex-row items-start mb-1">
            <Ionicons name="checkmark-circle" size={20} color="#3B82F6" style={{ marginTop: 2, marginRight: 8 }} />
            <Text className={`flex-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              Reminders are sent to tenants based on their rent due day.
            </Text>
          </View>
          
          <View className="flex-row items-start mb-1">
            <Ionicons name="checkmark-circle" size={20} color="#3B82F6" style={{ marginTop: 2, marginRight: 8 }} />
            <Text className={`flex-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              Each tenant can have a different rent due day, set in their profile.
            </Text>
          </View>
          
          <View className="flex-row items-start mb-1">
            <Ionicons name="checkmark-circle" size={20} color="#3B82F6" style={{ marginTop: 2, marginRight: 8 }} />
            <Text className={`flex-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              Reminders include the house number and rent amount.
            </Text>
          </View>
          
          <View className="flex-row items-start">
            <Ionicons name="checkmark-circle" size={20} color="#3B82F6" style={{ marginTop: 2, marginRight: 8 }} />
            <Text className={`flex-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              Reminders are automatically rescheduled when settings are changed.
            </Text>
          </View>
        </View>
      </Card>
      
      <View className="flex-row mt-4">
        <Button
          title="Cancel"
          onPress={() => router.back()}
          variant="outline"
          size="lg"
          className="flex-1 mr-2"
        />
        <Button
          title="Save Settings"
          onPress={handleSubmit}
          loading={loading}
          size="lg"
          className="flex-1 ml-2"
        />
      </View>
    </Container>
  );
}