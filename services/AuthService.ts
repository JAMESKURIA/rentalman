import AsyncStorage from '@react-native-async-storage/async-storage';

// Mock user data for local authentication
// In a real app, this would be replaced with a proper authentication system
const MOCK_USER = {
  id: '1',
  email: 'landlord@example.com',
  password: 'password123', // In a real app, passwords would be hashed
  name: 'John Doe',
};

export interface User {
  id: string;
  email: string;
  name: string;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

class AuthService {
  // Login with email and password
  async login(email: string, password: string): Promise<User> {
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Check credentials against mock user
    if (email === MOCK_USER.email && password === MOCK_USER.password) {
      const user: User = {
        id: MOCK_USER.id,
        email: MOCK_USER.email,
        name: MOCK_USER.name,
      };
      
      // Store user in AsyncStorage
      await AsyncStorage.setItem('user', JSON.stringify(user));
      
      return user;
    } else {
      throw new Error('Invalid email or password');
    }
  }
  
  // Check if user is already logged in
  async getCurrentUser(): Promise<User | null> {
    try {
      const userJson = await AsyncStorage.getItem('user');
      if (userJson) {
        return JSON.parse(userJson) as User;
      }
      return null;
    } catch (error) {
      console.error('Error getting current user:', error);
      return null;
    }
  }
  
  // Logout user
  async logout(): Promise<void> {
    try {
      await AsyncStorage.removeItem('user');
    } catch (error) {
      console.error('Error logging out:', error);
      throw error;
    }
  }
}

export const authService = new AuthService();
export default authService;