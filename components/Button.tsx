import React from 'react';
import { Text, TouchableOpacity, ActivityIndicator, View } from 'react-native';
import { useTheme } from '../utils/ThemeContext';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  disabled?: boolean;
  loading?: boolean;
  icon?: React.ReactNode;
}

const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  disabled = false,
  loading = false,
  icon,
}) => {
  const { isDarkMode } = useTheme();
  
  // Base classes
  let buttonClasses = 'rounded-md flex-row items-center justify-center';
  let textClasses = 'font-medium';
  
  // Size classes
  if (size === 'sm') {
    buttonClasses += ' py-1.5 px-3';
    textClasses += ' text-sm';
  } else if (size === 'md') {
    buttonClasses += ' py-2.5 px-4';
    textClasses += ' text-base';
  } else if (size === 'lg') {
    buttonClasses += ' py-3 px-5';
    textClasses += ' text-lg';
  }
  
  // Width classes
  if (fullWidth) {
    buttonClasses += ' w-full';
  }
  
  // Variant classes
  if (variant === 'primary') {
    buttonClasses += ' bg-primary';
    textClasses += ' text-white';
  } else if (variant === 'secondary') {
    buttonClasses += ' bg-secondary';
    textClasses += ' text-white';
  } else if (variant === 'outline') {
    buttonClasses += isDarkMode 
      ? ' bg-transparent border border-gray-600' 
      : ' bg-transparent border border-gray-300';
    textClasses += isDarkMode ? ' text-white' : ' text-gray-800';
  } else if (variant === 'danger') {
    buttonClasses += ' bg-red-600';
    textClasses += ' text-white';
  }
  
  // Disabled state
  if (disabled || loading) {
    buttonClasses += ' opacity-50';
  }
  
  return (
    <TouchableOpacity
      className={buttonClasses}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.7}
    >
      {loading ? (
        <ActivityIndicator size="small" color={variant === 'outline' ? (isDarkMode ? '#fff' : '#000') : '#fff'} />
      ) : (
        <View className="flex-row items-center">
          {icon && <View className="mr-2">{icon}</View>}
          <Text className={textClasses}>{title}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

export default Button;