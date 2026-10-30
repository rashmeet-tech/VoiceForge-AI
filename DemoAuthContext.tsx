import React, { createContext, useContext, useState, useEffect } from 'react';

export interface DemoUser {
  name: string;
  businessName: string;
  industry: string;
  isLoggedIn: boolean;
  loginDate?: string;
}

interface DemoAuthContextType {
  user: DemoUser;
  login: (name: string, businessName?: string, industry?: string) => void;
  logout: () => void;
}

const DEFAULT_USER: DemoUser = {
  name: 'Dr. Sarah Chen',
  businessName: 'Apex Dental Clinic',
  industry: 'Healthcare / Dental',
  isLoggedIn: true,
};

const STORAGE_KEY = 'voiceforge_demo_user';

const DemoAuthContext = createContext<DemoAuthContextType | undefined>(undefined);

export const DemoAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<DemoUser>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch {
      // Ignore JSON parse errors
    }
    return DEFAULT_USER;
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
    } catch {
      // Ignore storage errors
    }
  }, [user]);

  const login = (name: string, businessName = 'My Business', industry = 'General Services') => {
    const newUser: DemoUser = {
      name: name.trim() || 'Demo Owner',
      businessName: businessName.trim() || 'My Business',
      industry: industry.trim() || 'General Services',
      isLoggedIn: true,
      loginDate: new Date().toISOString(),
    };
    setUser(newUser);
  };

  const logout = () => {
    const loggedOutUser: DemoUser = {
      name: '',
      businessName: '',
      industry: '',
      isLoggedIn: false,
    };
    setUser(loggedOutUser);
  };

  return (
    <DemoAuthContext.Provider value={{ user, login, logout }}>
      {children}
    </DemoAuthContext.Provider>
  );
};

export const useDemoAuth = (): DemoAuthContextType => {
  const context = useContext(DemoAuthContext);
  if (!context) {
    throw new Error('useDemoAuth must be used within a DemoAuthProvider');
  }
  return context;
};
