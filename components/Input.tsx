import React from 'react';
import { View, Text, TextInput, TextInputProps } from 'react-native';
import { useTheme } from '../utils/ThemeContext';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

const Input: React.FC<InputProps> = ({
  label,
  error,
  leftIcon,
  rightIcon,
  ...props
}) => {
  const { isDarkMode } = useTheme();
  
  const containerClasses = 'mb-4';
  const labelClasses = `text-sm font-medium mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`;
  const inputContainerClasses = `flex-row items-center border rounded-md ${
    error 
      ? 'border-red-500' 
      : isDarkMode 
        ? 'border-gray-600 bg-gray-800' 
        : 'border-gray-300 bg-white'
  }`;
  const inputClasses = `flex-1 py-2 px-3 ${isDarkMode ? 'text-white' : 'text-gray-900'}`;
  const errorClasses = 'text-red-500 text-xs mt-1';
  const iconContainerClasses = 'px-3';
  
  return (
    <View className={containerClasses}>
      {label && <Text className={labelClasses}>{label}</Text>}
      <View className={inputContainerClasses}>
        {leftIcon && <View className={iconContainerClasses}>{leftIcon}</View>}
        <TextInput
          className={inputClasses}
          placeholderTextColor={isDarkMode ? '#9ca3af' : '#9ca3af'}
          {...props}
        />
        {rightIcon && <View className={iconContainerClasses}>{rightIcon}</View>}
      </View>
      {error && <Text className={errorClasses}>{error}</Text>}
    </View>
  );
};

export default Input;