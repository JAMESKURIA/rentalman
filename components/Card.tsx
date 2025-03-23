import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useTheme } from '../utils/ThemeContext';

interface CardProps {
  title?: string;
  children: React.ReactNode;
  onPress?: () => void;
  footer?: React.ReactNode;
  className?: string;
}

const Card: React.FC<CardProps> = ({ 
  title, 
  children, 
  onPress, 
  footer,
  className = ''
}) => {
  const { isDarkMode } = useTheme();
  
  const cardClasses = `rounded-lg overflow-hidden ${isDarkMode ? 'bg-card-dark' : 'bg-card-light'} ${className}`;
  const titleClasses = `text-lg font-bold px-4 pt-4 pb-2 ${isDarkMode ? 'text-white' : 'text-gray-800'}`;
  const contentClasses = 'px-4 py-3';
  const footerClasses = `px-4 py-3 border-t ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`;
  
  const CardComponent = (
    <View className={cardClasses}>
      {title && <Text className={titleClasses}>{title}</Text>}
      <View className={contentClasses}>{children}</View>
      {footer && <View className={footerClasses}>{footer}</View>}
    </View>
  );
  
  if (onPress) {
    return (
      <TouchableOpacity activeOpacity={0.7} onPress={onPress}>
        {CardComponent}
      </TouchableOpacity>
    );
  }
  
  return CardComponent;
};

export default Card;