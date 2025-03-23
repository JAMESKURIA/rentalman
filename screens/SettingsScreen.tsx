import React from 'react';
import { View, Text, TouchableOpacity, Alert, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../utils/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import Container from '../components/Container';
import Card from '../components/Card';
import Button from '../components/Button';

const SettingsScreen = () => {
  const navigation = useNavigation<any>();
  const { isDarkMode, toggleTheme } = useTheme();
  const { logout, user } = useAuth();
  
  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Error logging out:', error);
      Alert.alert('Error', 'Failed to log out');
    }
  };
  
  const handleExportData = () => {
    Alert.alert('Info', 'Export data functionality to be implemented');
  };
  
  const handleClearData = () => {
    Alert.alert(
      'Clear All Data',
      'Are you sure you want to clear all data? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Clear Data', 
          style: 'destructive',
          onPress: () => Alert.alert('Info', 'Clear data functionality to be implemented')
        },
      ]
    );
  };
  
  return (
    <Container>
      <Text className={`text-2xl font-bold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
        Settings
      </Text>
      
      <ScrollView>
        {/* User Info */}
        <Card className="mb-4">
          <View className="items-center">
            <View className="w-16 h-16 rounded-full bg-primary items-center justify-center mb-2">
              <Text className="text-white text-2xl font-bold">
                {user?.name.charAt(0)}
              </Text>
            </View>
            <Text className={`text-lg font-bold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
              {user?.name}
            </Text>
            <Text className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              {user?.email}
            </Text>
          </View>
        </Card>
        
        {/* Appearance */}
        <Text className={`text-lg font-semibold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
          Appearance
        </Text>
        <Card className="mb-4">
          <TouchableOpacity 
            className="flex-row justify-between items-center py-2"
            onPress={toggleTheme}
          >
            <View className="flex-row items-center">
              <Ionicons 
                name={isDarkMode ? 'moon' : 'sunny'} 
                size={20} 
                color={isDarkMode ? '#9CA3AF' : '#6B7280'} 
                className="mr-3"
              />
              <Text className={`${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
                Dark Mode
              </Text>
            </View>
            <View className={`w-10 h-6 rounded-full ${isDarkMode ? 'bg-primary' : 'bg-gray-300'} justify-center px-0.5`}>
              <View className={`w-5 h-5 rounded-full bg-white ${isDarkMode ? 'ml-4' : 'ml-0'}`} />
            </View>
          </TouchableOpacity>
        </Card>
        
        {/* Data Management */}
        <Text className={`text-lg font-semibold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
          Data Management
        </Text>
        <Card className="mb-4">
          <TouchableOpacity 
            className="flex-row justify-between items-center py-2"
            onPress={handleExportData}
          >
            <View className="flex-row items-center">
              <Ionicons 
                name="download-outline" 
                size={20} 
                color={isDarkMode ? '#9CA3AF' : '#6B7280'} 
                className="mr-3"
              />
              <Text className={`${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
                Export Data
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={isDarkMode ? '#9CA3AF' : '#6B7280'} />
          </TouchableOpacity>
          
          <TouchableOpacity 
            className="flex-row justify-between items-center py-2"
            onPress={handleClearData}
          >
            <View className="flex-row items-center">
              <Ionicons 
                name="trash-outline" 
                size={20} 
                color="#EF4444" 
                className="mr-3"
              />
              <Text className="text-red-500">
                Clear All Data
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={isDarkMode ? '#9CA3AF' : '#6B7280'} />
          </TouchableOpacity>
        </Card>
        
        {/* About */}
        <Text className={`text-lg font-semibold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
          About
        </Text>
        <Card className="mb-4">
          <View className="py-2">
            <Text className={`${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
              Rental Manager
            </Text>
            <Text className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Version 1.0.0
            </Text>
          </View>
        </Card>
        
        {/* Logout Button */}
        <Button
          title="Logout"
          onPress={handleLogout}
          variant="outline"
          size="lg"
          fullWidth
          className="mt-4"
        />
      </ScrollView>
    </Container>
  );
};

export default SettingsScreen;