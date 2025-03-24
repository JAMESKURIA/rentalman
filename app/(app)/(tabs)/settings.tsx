import React from 'react';
import { View, Text, TouchableOpacity, Alert, ScrollView, Switch } from 'react-native';
import { Link, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../../utils/ThemeContext';
import { useAuth } from '../../../contexts/AuthContext';
import Container from '../../../components/Container';
import Card from '../../../components/Card';
import Button from '../../../components/Button';
import globalState from '../../../state';

export default function SettingsScreen() {
  const { isDarkMode, toggleTheme } = useTheme();
  const { logout } = useAuth();
  const router = useRouter();
  
  // Get reminder settings from global state
  const reminderSettings = globalState.settings.rentReminders.get();
  
  // Handle logout
  const handleLogout = async () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            try {
              await logout();
            } catch (error) {
              console.error('Error logging out:', error);
              Alert.alert('Error', 'Failed to logout');
            }
          },
        },
      ]
    );
  };
  
  return (
    <Container>
      <Text className={`text-2xl font-bold mb-6 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
        Settings
      </Text>
      
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Appearance */}
        <Card className="mb-4">
          <Text className={`text-lg font-bold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
            Appearance
          </Text>
          
          <View className="flex-row justify-between items-center">
            <Text className={`${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              Dark Mode
            </Text>
            <Switch
              value={isDarkMode}
              onValueChange={toggleTheme}
              trackColor={{ false: '#767577', true: '#3B82F6' }}
              thumbColor={isDarkMode ? '#FFFFFF' : '#F4F3F4'}
            />
          </View>
        </Card>
        
        {/* Data Management */}
        <Card className="mb-4">
          <Text className={`text-lg font-bold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
            Data Management
          </Text>
          
          <Link href="/houseTypes" asChild>
            <TouchableOpacity className="flex-row justify-between items-center py-3 border-b border-gray-200 dark:border-gray-700">
              <View className="flex-row items-center">
                <Ionicons name="home-outline" size={20} color={isDarkMode ? '#9CA3AF' : '#6B7280'} />
                <Text className={`ml-3 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  House Types
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={isDarkMode ? '#9CA3AF' : '#6B7280'} />
            </TouchableOpacity>
          </Link>
          
          <Link href="/serviceProviders" asChild>
            <TouchableOpacity className="flex-row justify-between items-center py-3 border-b border-gray-200 dark:border-gray-700">
              <View className="flex-row items-center">
                <Ionicons name="construct-outline" size={20} color={isDarkMode ? '#9CA3AF' : '#6B7280'} />
                <Text className={`ml-3 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Service Providers
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={isDarkMode ? '#9CA3AF' : '#6B7280'} />
            </TouchableOpacity>
          </Link>
          
          <Link href="/import" asChild>
            <TouchableOpacity className="flex-row justify-between items-center py-3">
              <View className="flex-row items-center">
                <Ionicons name="cloud-upload-outline" size={20} color={isDarkMode ? '#9CA3AF' : '#6B7280'} />
                <Text className={`ml-3 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Import Data
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={isDarkMode ? '#9CA3AF' : '#6B7280'} />
            </TouchableOpacity>
          </Link>
        </Card>
        
        {/* Notifications */}
        <Card className="mb-4">
          <Text className={`text-lg font-bold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
            Notifications
          </Text>
          
          <Link href="/reminders" asChild>
            <TouchableOpacity className="flex-row justify-between items-center py-3">
              <View className="flex-row items-center">
                <Ionicons name="notifications-outline" size={20} color={isDarkMode ? '#9CA3AF' : '#6B7280'} />
                <Text className={`ml-3 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Rent Reminders
                </Text>
              </View>
              <View className="flex-row items-center">
                <Text className={`mr-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  {reminderSettings.enabled ? 'On' : 'Off'}
                </Text>
                <Ionicons name="chevron-forward" size={20} color={isDarkMode ? '#9CA3AF' : '#6B7280'} />
              </View>
            </TouchableOpacity>
          </Link>
        </Card>
        
        {/* Account */}
        <Card className="mb-4">
          <Text className={`text-lg font-bold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
            Account
          </Text>
          
          <TouchableOpacity 
            className="flex-row items-center py-3"
            onPress={handleLogout}
          >
            <Ionicons name="log-out-outline" size={20} color="#EF4444" />
            <Text className="ml-3 text-red-500">
              Logout
            </Text>
          </TouchableOpacity>
        </Card>
        
        {/* About */}
        <Card className="mb-4">
          <Text className={`text-lg font-bold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
            About
          </Text>
          
          <View className="items-center">
            <Text className={`text-center ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              Rental Manager
            </Text>
            <Text className={`text-center text-sm mt-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              Version 1.0.0
            </Text>
          </View>
        </Card>
      </ScrollView>
    </Container>
  );
}