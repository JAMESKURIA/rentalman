import React, { useState } from 'react';
import { View, Text, Image, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../utils/ThemeContext';
import Container from '../../components/Container';
import Input from '../../components/Input';
import Button from '../../components/Button';

const LoginScreen = () => {
  const { login, error } = useAuth();
  const { isDarkMode, toggleTheme } = useTheme();
  
  const [email, setEmail] = useState('landlord@example.com');
  const [password, setPassword] = useState('password123');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please enter both email and password');
      return;
    }
    
    setLoading(true);
    try {
      await login(email, password);
    } catch (error) {
      // Error is handled by the auth context
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <Container scrollable={false} safeArea>
      <TouchableOpacity 
        className="absolute top-10 right-6 p-2 rounded-full bg-opacity-20 bg-gray-500"
        onPress={toggleTheme}
      >
        <Ionicons 
          name={isDarkMode ? 'sunny-outline' : 'moon-outline'} 
          size={24} 
          color={isDarkMode ? 'white' : 'black'} 
        />
      </TouchableOpacity>
      
      <View className="flex-1 justify-center px-6">
        <View className="items-center mb-8">
          <Text className={`text-3xl font-bold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
            Rental Manager
          </Text>
          <Text className={`text-base text-center ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
            Manage your rental properties efficiently
          </Text>
        </View>
        
        {error && (
          <View className="bg-red-100 border border-red-400 rounded-md p-3 mb-4">
            <Text className="text-red-800">{error}</Text>
          </View>
        )}
        
        <Input
          label="Email"
          value={email}
          onChangeText={setEmail}
          placeholder="Enter your email"
          keyboardType="email-address"
          autoCapitalize="none"
          leftIcon={<Ionicons name="mail-outline" size={20} color={isDarkMode ? '#9CA3AF' : '#6B7280'} />}
        />
        
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
        
        <Button
          title="Login"
          onPress={handleLogin}
          loading={loading}
          fullWidth
          size="lg"
          className="mt-4"
        />
        
        <View className="mt-6">
          <Text className={`text-center text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            Demo credentials are pre-filled.
          </Text>
          <Text className={`text-center text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            Just tap Login to continue.
          </Text>
        </View>
      </View>
    </Container>
  );
};

export default LoginScreen;