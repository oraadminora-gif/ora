// src/contexts/AuthContext.tsx
/* eslint-disable react-refresh/only-export-components */
import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from 'react';

import api from '../services/api';
import type { AxiosError } from 'axios';

/* ================== TYPES ================== */

export type UserRole = 'MENTOR' | 'AP' | 'ACP' | 'CN';

export interface AuthUser {
  id: number;
  email: string;
  role: UserRole;
  roles: UserRole[];
  pole_id?: number | null;
  first_name?: string;
  last_name?: string;
  cn_acces_complet?: boolean;
}

interface AuthContextValue {
  user: AuthUser | null;
  activeRole: UserRole;
  loading: boolean;
  isAuthenticated: boolean;

  signIn: (
    email: string,
    password: string
  ) => Promise<{ error?: string; role?: UserRole }>;

  signOut: () => void;
  switchRole: (role: UserRole) => void;

  hasRole: (role: UserRole) => boolean;
  hasAnyRole: (roles: UserRole[]) => boolean;
}

/* ================== CONTEXT ================== */

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

/* ================== PROVIDER ================== */

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [activeRole, setActiveRole] = useState<UserRole>('MENTOR');
  const [loading, setLoading] = useState(true);

  const setAuthToken = useCallback((token: string | null) => {
    if (token) {
      api.defaults.headers.common.Authorization = `Bearer ${token}`;
      localStorage.setItem('access', token);
    } else {
      delete api.defaults.headers.common.Authorization;
      localStorage.removeItem('access');
    }
  }, []);

  const signOut = useCallback(() => {
    setUser(null);
    setActiveRole('MENTOR');
    setAuthToken(null);
    localStorage.removeItem('refresh');
    localStorage.removeItem('activeRole');
  }, [setAuthToken]);

  /* ================== BOOTSTRAP ================== */

  useEffect(() => {
    const bootstrapAuth = async () => {
      try {
        const access = localStorage.getItem('access');
        const savedRole = localStorage.getItem('activeRole') as UserRole | null;

        if (!access) {
          setLoading(false);
          return;
        }

        setAuthToken(access);

        const me = await api.get('/auth/me/');

        const backendRole = me.data.capabilities?.active_role as UserRole;
        const roles =
          (me.data.capabilities?.roles as UserRole[]) || [backendRole];
        const poleId = me.data.capabilities?.pole_id;

        if (!backendRole) {
          console.error('❌ Aucun rôle détecté:', me.data);
          signOut();
          return;
        }

        const userData: AuthUser = {
          ...me.data,
          role: backendRole,
          roles,
          pole_id: poleId,
          cn_acces_complet: me.data.capabilities?.cn_acces_complet ?? false,
        };

        setUser(userData);

        const effectiveRole =
          savedRole && roles.includes(savedRole)
            ? savedRole
            : backendRole;

        setActiveRole(effectiveRole);
      } catch (err) {
        console.error('Auth bootstrap failed:', err);
        signOut();
      } finally {
        setLoading(false);
      }
    };

    bootstrapAuth();
  }, [setAuthToken, signOut]);

  /* ================== LOGIN ================== */

  const signIn = useCallback(
    async (
      email: string,
      password: string
    ): Promise<{ error?: string; role?: UserRole }> => {
      try {
        const res = await api.post('/auth/login/', { email, password });

        const { access, refresh } = res.data;

        setAuthToken(access);
        localStorage.setItem('refresh', refresh);

        const me = await api.get('/auth/me/');

        const backendRole = me.data.capabilities?.active_role as UserRole;
        const roles =
          (me.data.capabilities?.roles as UserRole[]) || [backendRole];
        const poleId = me.data.capabilities?.pole_id;

        if (!backendRole) {
          return { error: 'Utilisateur sans rôle métier' };
        }

        const userData: AuthUser = {
          ...me.data,
          role: backendRole,
          roles,
          pole_id: poleId,
          cn_acces_complet: me.data.capabilities?.cn_acces_complet ?? false,
        };

        setUser(userData);
        setActiveRole(backendRole);

        localStorage.setItem('activeRole', backendRole);

        return { role: backendRole };
      } catch (error) {
        const err = error as AxiosError;
        console.error(err.response?.data);
        return { error: 'Email ou mot de passe incorrect' };
      }
    },
    [setAuthToken]
  );

  /* ================== ROLES ================== */

  const switchRole = useCallback(
    (role: UserRole) => {
      if (user?.roles.includes(role)) {
        setActiveRole(role);
        localStorage.setItem('activeRole', role);
      }
    },
    [user]
  );

  const hasRole = useCallback(
    (role: UserRole) => {
      return user?.roles.includes(role) ?? false;
    },
    [user]
  );

  const hasAnyRole = useCallback(
    (roles: UserRole[]) => {
      return roles.some((r) => user?.roles.includes(r));
    },
    [user]
  );

  const value: AuthContextValue = {
    user,
    activeRole,
    loading,
    isAuthenticated: !!user,
    signIn,
    signOut,
    switchRole,
    hasRole,
    hasAnyRole,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

/* ================== HOOK ================== */

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
