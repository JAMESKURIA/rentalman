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
          }
        },
      ]
    );
  };
  
  return (
    <Container>
      <Text className={`text-2xl font-bold mb-6 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
        Settings
      </Text>
      
      {/* User Profile */}
      <Card className="mb-4">
        <View className="items-center">
          <View className="w-20 h-20 rounded-full bg-primary flex items-center justify-center mb-3">
            <Text className="text-white text-3xl font-bold">
              {user?.name?.charAt(0) || 'U'}
            </Text>
          </View>
          <Text className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
            {user?.name || 'User'}
          </Text>
          <Text className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            {user?.email || 'user@example.com'}
          </Text>
        </View>
      </Card>
      
      {/* App Settings */}
      <Text className={`text-lg font-semibold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
        App Settings
      </Text>
      
      <Card className="mb-4">
        <TouchableOpacity 
          className="flex-row justify-between items-center py-2"
          onPress={toggleTheme}
        >
          <View className="flex-row items-center">
            <Ionicons 
              name={isDarkMode ? 'moon' : 'sunny'} 
              size={24} 
              color={isDarkMode ? '#9CA3AF' : '#F59E0B'} 
              className="mr-3"
            />
            <Text className={`text-base ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
              {isDarkMode ? 'Dark Mode' : 'Light Mode'}
            </Text>
          </View>
          <Ionicons 
            name="chevron-forward" 
            size={20} 
            color={isDarkMode ? '#9CA3AF' : '#6B7280'} 
          />
        </TouchableOpacity>
      </Card>
      
      {/* About */}
      <Text className={`text-lg font-semibold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
        About
      </Text>
      
      <Card className="mb-6">
        <View className="py-2">
          <Text className={`text-base ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
            Rental Manager
          </Text>
          <Text className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            Version 1.0.0
          </Text>
        </View>
      </Card>
      
      {/* Logout Button */}
      <Button
        title="Logout"
        onPress={handleLogout}
        variant="danger"
        size="lg"
        fullWidth
        icon={<Ionicons name="log-out-outline" size={20} color="white" />}
      />
    </Container>
  );
};

export default SettingsScreen;