import React, { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '../services/authService';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [availableUsers, setAvailableUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(localStorage.getItem('dhan_session_token') || '');

  // Load available users and default to admin or stored user
  useEffect(() => {
    async function initAuth() {
      try {
        const users = await authService.getAvailableUsers();
        setAvailableUsers(users);

        const savedUsername = localStorage.getItem('dhan_saved_username') || 'admin';
        const target = users.find(u => u.username === savedUsername) || users[0];

        if (target) {
          // Perform login or switch
          const res = await authService.login(target.username);
          setCurrentUser(res.user);
          setToken(res.token);
          localStorage.setItem('dhan_session_token', res.token);
          localStorage.setItem('dhan_saved_username', res.user.username);
        }
      } catch (err) {
        console.error('Lỗi khởi tạo danh sách người dùng:', err);
      } finally {
        setLoading(false);
      }
    }
    initAuth();
  }, []);

  const switchUser = async (username) => {
    try {
      setLoading(true);
      const res = await authService.login(username);
      setCurrentUser(res.user);
      setToken(res.token);
      localStorage.setItem('dhan_session_token', res.token);
      localStorage.setItem('dhan_saved_username', res.user.username);
    } catch (err) {
      console.error('Lỗi chuyển đổi tài khoản:', err);
    } finally {
      setLoading(false);
    }
  };

  const hasPermission = (permCode) => {
    if (!currentUser) return false;
    if (currentUser.role === 'SUPER_ADMIN') return true;
    return currentUser.permissions?.includes(permCode) ?? false;
  };

  const isClearanceSufficient = (requiredOrder) => {
    if (!currentUser) return false;
    if (currentUser.role === 'SUPER_ADMIN') return true;
    return (currentUser.clearanceLevelOrder || 1) >= requiredOrder;
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        availableUsers,
        token,
        loading,
        switchUser,
        hasPermission,
        isClearanceSufficient,
      }}
    >
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
