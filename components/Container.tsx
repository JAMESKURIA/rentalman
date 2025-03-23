import React from 'react';
import { View, ScrollView, SafeAreaView, StatusBar } from 'react-native';
import { useTheme } from '../utils/ThemeContext';

interface ContainerProps {
  children: React.ReactNode;
  scrollable?: boolean;
  padded?: boolean;
  safeArea?: boolean;
}

const Container: React.FC<ContainerProps> = ({
  children,
  scrollable = true,
  padded = true,
  safeArea = true,
}) => {
  const { isDarkMode } = useTheme();
  
  const containerClasses = `flex-1 ${isDarkMode ? 'bg-background-dark' : 'bg-background-light'}`;
  const contentClasses = padded ? 'px-4 py-4' : '';
  
  const content = (
    <>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
      {scrollable ? (
        <ScrollView className={contentClasses}>{children}</ScrollView>
      ) : (
        <View className={`${contentClasses} flex-1`}>{children}</View>
      )}
    </>
  );
  
  if (safeArea) {
    return (
      <SafeAreaView className={containerClasses}>
        {content}
      </SafeAreaView>
    );
  }
  
  return <View className={containerClasses}>{content}</View>;
};

export default Container;