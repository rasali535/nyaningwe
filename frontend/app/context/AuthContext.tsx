'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

export interface MockUser {
  email: string;
  uid: string;
  displayName: string;
}

interface AuthContextType {
  user: MockUser | null;
  loading: boolean;
  token: string | null;
  logout: () => Promise<void>;
  loginWithCredentials: (email: string, password: string) => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<MockUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if there is a mock session stored
    const mockUserStr = typeof window !== 'undefined' ? sessionStorage.getItem('nyaningwe_mock_user') : null;
    if (mockUserStr) {
      try {
        const mockUserObj = JSON.parse(mockUserStr);
        setUser(mockUserObj);
        setToken('mock-session-token-for-admin');
      } catch (e) {
        console.error('Error loading mock admin user:', e);
      }
    }
    setLoading(false);
  }, []);

  const loginWithCredentials = async (email: string, password: string): Promise<boolean> => {
    // Hardcoded seed credentials for the MVP
    if (email === 'admin@nyaningwe.com' && password === 'admin123') {
      const mockUserObj = {
        email: 'admin@nyaningwe.com',
        uid: 'mock_admin_uid',
        displayName: 'Nyaningwe Admin'
      };
      sessionStorage.setItem('nyaningwe_mock_user', JSON.stringify(mockUserObj));
      setUser(mockUserObj);
      setToken('mock-session-token-for-admin');
      return true;
    }
    return false;
  };

  const logout = async () => {
    setLoading(true);
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('nyaningwe_mock_user');
    }
    setUser(null);
    setToken(null);
    setLoading(false);
  };

  return (
    <AuthContext.Provider value={{ user, loading, token, logout, loginWithCredentials }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
