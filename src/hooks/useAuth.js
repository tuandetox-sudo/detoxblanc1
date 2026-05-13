import { useState, useEffect } from 'react';

const AUTH_KEY = 'detoxblanc_auth';
const DEFAULT_ADMIN = { username: 'admin', password: 'detoxblanc2025', role: 'admin', displayName: 'Admin' };

export function useAuth() {
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem(AUTH_KEY);
      return saved ? JSON.parse(saved) : null;
    } catch { return null; }
  });

  const login = (username, password) => {
    const accounts = getAccounts();
    const found = accounts.find(a => a.username === username && a.password === password);
    if (!found) return false;
    const session = { username: found.username, displayName: found.displayName, role: found.role };
    localStorage.setItem(AUTH_KEY, JSON.stringify(session));
    setUser(session);
    return true;
  };

  const logout = () => {
    localStorage.removeItem(AUTH_KEY);
    setUser(null);
  };

  return { user, login, logout, isAdmin: user?.role === 'admin' };
}

export function getAccounts() {
  try {
    const saved = localStorage.getItem('detoxblanc_accounts');
    return saved ? JSON.parse(saved) : [DEFAULT_ADMIN];
  } catch { return [DEFAULT_ADMIN]; }
}

export function saveAccounts(accounts) {
  localStorage.setItem('detoxblanc_accounts', JSON.stringify(accounts));
}
