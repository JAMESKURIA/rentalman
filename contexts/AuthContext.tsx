import React, { createContext, useContext, useEffect } from 'react';
import globalState from '../state';

// Define the user type
interface User {
  id: number;
  name: string;
  email: string;
}

// Define the context type
interface AuthContextType {
  isAuthenticated: boolean;
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  loading: boolean;
  error: string | null;
}

// Create the context
const AuthContext = createContext<AuthContextType>({
  isAuthenticated: false,
  user: null,
  login: async () => {},
  logout: async () => {},
  loading: false,
  error: null,
});

// Auth provider component
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Check for existing session on mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        globalState.auth.loading.set(true);
        
        // For demo purposes, we'll just set a mock user
        // In a real app, you would check for a stored token or session
        const mockUser = {
          id: 1,
          name: 'Demo User',
          email: 'demo@example.com',
        };
        
        globalState.auth.user.set(mockUser);
        globalState.auth.isAuthenticated.set(true);
        globalState.auth.loading.set(false);
      } catch (error) {
        console.error('Auth check error:', error);
        globalState.auth.loading.set(false);
      }
    };
    
    checkAuth();
  }, []);
  
  // Login function
  const login = async (email: string, password: string) => {
    try {
      globalState.auth.loading.set(true);
      globalState.auth.error.set(null);
      
      // For demo purposes, we'll just accept any credentials
      // In a real app, you would validate credentials against a backend
      if (email && password) {
        const user = {
          id: 1,
          name: 'Demo User',
          email,
        };
        
        globalState.auth.user.set(user);
        globalState.auth.isAuthenticated.set(true);
      } else {
        throw new Error('Email and password are required');
      }
    } catch (error) {
      console.error('Login error:', error);
      globalState.auth.error.set(error.message);
      throw error;
    } finally {
      globalState.auth.loading.set(false);
    }
  };
  
  // Logout function
  const logout = async () => {
    try {
      globalState.auth.loading.set(true);
      
      // Clear user data
      globalState.auth.user.set(null);
      globalState.auth.isAuthenticated.set(false);
    } catch (error) {
      console.error('Logout error:', error);
      globalState.auth.error.set(error.message);
      throw error;
    } finally {
      globalState.auth.loading.set(false);
    }
  };
  
  // Get current auth state from global state
  const isAuthenticated = globalState.auth.isAuthenticated.get();
  const user = globalState.auth.user.get();
  const loading = globalState.auth.loading.get();
  const error = globalState.auth.error.get();
  
  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        user,
        login,
        logout,
        loading,
        error,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// Hook to use the auth context
export const useAuth = () => useContext(AuthContext);