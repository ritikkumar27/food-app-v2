import React, { createContext, useContext, useState, useEffect } from 'react';
import * as SecureStore from 'expo-secure-store';
import { authAPI, userAPI } from '../api/client';

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Check for stored token on app launch
  useEffect(() => {
    loadStoredAuth();
  }, []);

  const loadStoredAuth = async () => {
    try {
      const storedToken = await SecureStore.getItemAsync('authToken');
      if (storedToken) {
        setToken(storedToken);
        // Verify token by fetching profile
        const response = await userAPI.getProfile();
        if (response.data?.success) {
          setUser(response.data.data.user);
          setIsAuthenticated(true);
        } else {
          await clearAuth();
        }
      }
    } catch (error) {
      console.log('Stored auth invalid, clearing...');
      await clearAuth();
    } finally {
      setIsLoading(false);
    }
  };

  const signup = async (email, password) => {
    try {
      const response = await authAPI.signup(email, password);
      if (response.data?.success) {
        const { token: newToken, user: newUser } = response.data.data;
        await SecureStore.setItemAsync('authToken', newToken);
        setToken(newToken);
        setUser(newUser);
        setIsAuthenticated(true);
        return { success: true };
      }
      return { success: false, message: response.data?.message || 'Signup failed' };
    } catch (error) {
      const message = error.response?.data?.message || 'Network error. Please try again.';
      return { success: false, message };
    }
  };

  const login = async (email, password) => {
    try {
      const response = await authAPI.login(email, password);
      if (response.data?.success) {
        const { token: newToken, user: newUser } = response.data.data;
        await SecureStore.setItemAsync('authToken', newToken);
        setToken(newToken);
        setUser(newUser);
        setIsAuthenticated(true);
        return { success: true };
      }
      return { success: false, message: response.data?.message || 'Login failed' };
    } catch (error) {
      const message = error.response?.data?.message || 'Network error. Please try again.';
      return { success: false, message };
    }
  };

  const logout = async () => {
    await clearAuth();
  };

  const clearAuth = async () => {
    try {
      await SecureStore.deleteItemAsync('authToken');
    } catch (e) { /* ignore */ }
    setToken(null);
    setUser(null);
    setIsAuthenticated(false);
  };

  const refreshUser = async () => {
    try {
      const response = await userAPI.getProfile();
      if (response.data?.success) {
        setUser(response.data.data.user);
      }
    } catch (error) {
      console.error('Failed to refresh user:', error.message);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        isAuthenticated,
        signup,
        login,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
