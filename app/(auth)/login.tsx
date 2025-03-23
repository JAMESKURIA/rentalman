import React, { useState } from 'react';
import { View, Text, Image, TouchableOpacity, Alert, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../utils/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import Input from '../../components/Input';
import Button from '../../components/Button';

export default function LoginScreen() {
  const { isDarkMode } = useTheme();
  const { login, loading, error } = useAuth();
  const router = useRouter();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  const handleLogin = async () => {
    try {
      await login(email, password);
      router.replace('/(app)/(tabs)');
    } catch (error) {
      Alert.alert('Login Failed', error.message);
    }
  };
  
  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1"
      style={{ backgroundColor: isDarkMode ? '#1F2937' : '#F9FAFB' }}
    >
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        <View className="flex-1 justify-center px-6 py-12">
          <View className="items-center mb-8">
            <Image
              source={require('../../assets/icon.png')}
              className="w-24 h-24 mb-4"
              resizeMode="contain"
            />
            <Text className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
              Rental Manager
            </Text>
            <Text className={`text-base mt-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Manage your rental properties
            </Text>
          </View>
          
          <View className="mb-6">
            <Input
              label="Email"
              value={email}
              onChangeText={setEmail}
              placeholder="Enter your email"
              keyboardType="email-address"
              autoCapitalize="none"
              leftIcon={<Ionicons name="mail-outline" size={20} color={isDarkMode ? '#9CA3AF' : '#6B7280'} />}
            />
          </View>
          
          <View className="mb-8">
            <Input
              label="Password"
              value={password}
              onChangeText={setPassword}
              placeholder="Enter your password"
              secureTextEntry={!showPassword}
              leftIcon={<Ionicons name="lock-closed-outline" size={20} color={isDarkMode ? '#9CA3AF' : '#6B7280'} />}
              rightIcon={
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                  <Ionicons
                    name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                    size={20}
                    color={isDarkMode ? '#9CA3AF' : '#6B7280'}
                  />
                </TouchableOpacity>
              }
            />
          </View>
          
          {error && (
            <View className="mb-4 p-3 bg-red-100 rounded-md">
              <Text className="text-red-800">{error}</Text>
            </View>
          )}
          
          <Button
            title="Login"
            onPress={handleLogin}
            loading={loading}
            size="lg"
            fullWidth
          />
          
          <View className="mt-8">
            <Text className={`text-center text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              For demo purposes, you can use any email and password
            </Text>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}