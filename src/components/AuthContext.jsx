import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { API_BASE_URL } from '../config';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('jurisai_token'));
  const [loading, setLoading] = useState(true);
  const queryClient = useQueryClient();

  const logout = useCallback(() => {
    localStorage.removeItem('jurisai_token');
    setToken(null);
    setUser(null);
    queryClient.clear();
  }, [queryClient]);

  const checkAuth = useCallback(async () => {
    if (!token) {
      setLoading(false);
      return;
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 60000); // 60s timeout

    try {
      const res = await fetch(`${API_BASE_URL}/me`, {
        headers: { Authorization: `Bearer ${token}` },
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (res.ok) {
        const data = await res.json();
        setUser({
          name: data.name || data.user_name || 'User',
          email: data.email || 'user@firm.com',
          plan: data.plan || 'trial',
          trial_days_left: data.trial_days_left,
          role: data.role || 'user',
          firm_id: data.firm_id || '',
          firm_name: data.firm_name || '',
          profile_picture: data.profile_picture || '',
          bio: data.bio || '',
          permissions: data.permissions || [],
          workspace: data.workspace || null,
        });
      } else {
        logout();
      }
    } catch (err) {
      console.error('CheckAuth failed or timed out:', err);
      logout();
    } finally {
      clearTimeout(timeoutId);
      setLoading(false);
    }
  }, [logout, token]);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  const refreshUser = useCallback(async () => {
    if (!token) return;
    await checkAuth();
  }, [checkAuth, token]);

  const updateLocalUser = useCallback((updates) => {
    setUser((current) => current ? { ...current, ...updates } : current);
  }, []);

  const login = useCallback(async (email, password) => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 60000); // 60s timeout

    try {
      const res = await fetch(`${API_BASE_URL}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      
      let data;
      const contentType = res.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        data = await res.json();
      } else {
        const text = await res.text();
        throw new Error(text || 'Server returned an invalid response.');
      }

      let errorMsg = 'Login failed';
      if (data?.detail) {
        if (typeof data.detail === 'string') {
          errorMsg = data.detail;
        } else if (Array.isArray(data.detail)) {
          errorMsg = data.detail.map(e => e.msg).join(', ');
        } else {
          errorMsg = JSON.stringify(data.detail);
        }
      }
      if (!res.ok) throw new Error(errorMsg);
      
      localStorage.setItem('jurisai_token', data.access_token);
      setToken(data.access_token);
      setUser({ 
        name: data.name || data.user_name || 'User', 
        email: email,
        plan: data.plan || 'trial', 
        trial_days_left: data.trial_days_left,
        role: data.role || 'user',
        firm_id: data.firm_id || '',
        firm_name: data.firm_name || '',
        profile_picture: data.profile_picture || '',
        bio: data.bio || '',
        permissions: data.permissions || [],
      });
      return data;
    } finally {
      clearTimeout(timeoutId);
    }
  }, []);

  const register = useCallback(async (name, email, password, plan = 'trial', firmName = '', firmId = '', role = 'user') => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 60000); // 60s timeout

    try {
      const res = await fetch(`${API_BASE_URL}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password, plan, firm_name: firmName, firm_id: firmId, role }),
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      
      let data;
      const contentType = res.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        data = await res.json();
      } else {
        const text = await res.text();
        throw new Error(text || 'Server returned an invalid response.');
      }

      let errorMsg = 'Registration failed';
      if (data?.detail) {
        if (typeof data.detail === 'string') {
          errorMsg = data.detail;
        } else if (Array.isArray(data.detail)) {
          errorMsg = data.detail.map(e => e.msg).join(', ');
        } else {
          errorMsg = JSON.stringify(data.detail);
        }
      }
      if (!res.ok) throw new Error(errorMsg);
      
      return data;
    } finally {
      clearTimeout(timeoutId);
    }
  }, []);

  const isAdmin = useCallback(() => user?.role === 'admin', [user?.role]);

  const contextValue = useMemo(() => ({
    user,
    token,
    loading,
    isAuthenticated: !!user,
    isAdmin,
    login,
    register,
    logout,
    refreshUser,
    updateLocalUser,
  }), [user, token, loading, isAdmin, login, register, logout, refreshUser, updateLocalUser]);

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be inside AuthProvider');
  return ctx;
}
