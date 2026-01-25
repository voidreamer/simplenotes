import { supabase } from '../lib/supabase';
import config from './config';
import { useAuthStore } from '../stores/store';
import { api } from './api';

function isCapacitorNative(): boolean {
  return typeof window !== 'undefined' &&
    'Capacitor' in window &&
    (window as any).Capacitor?.isNativePlatform?.() === true;
}

function getRedirectUrl(): string {
  if (isCapacitorNative()) {
    return 'simplenotes://callback';
  }
  return window.location.origin + '/callback';
}

export function configureAuth() {
  // Supabase is configured via the client creation
  // This function exists for backward compatibility
}

export async function loginWithGoogle() {
  const redirectTo = getRedirectUrl();

  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo,
    },
  });

  if (error) {
    console.error('Google login error:', error);
    throw error;
  }
}

export async function loginWithEmail(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    console.error('Email login error:', error);
    throw error;
  }

  if (data.session) {
    useAuthStore.getState().setAccessToken(data.session.access_token);
    await syncUserSession();
  }

  return data;
}

export async function registerWithEmail(
  email: string,
  password: string,
  name: string
) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        name,
      },
    },
  });

  if (error) {
    console.error('Registration error:', error);
    throw error;
  }

  return data;
}

export async function confirmRegistration(_email: string, _code: string) {
  // Supabase handles email confirmation via magic link automatically
  // This function exists for backward compatibility
  return true;
}

export async function logout() {
  try {
    const { error } = await supabase.auth.signOut();
    // Ignore "Auth session missing" error - user is already logged out
    if (error && !error.message?.includes('Auth session missing')) {
      throw error;
    }
  } catch (error: any) {
    console.warn('Logout warning:', error.message);
  }
  // Always clear local state regardless of signOut result
  useAuthStore.getState().logout();
}

export async function checkAuthSession() {
  try {
    const { data: { session } } = await supabase.auth.getSession();

    if (session?.access_token) {
      useAuthStore.getState().setAccessToken(session.access_token);
      await syncUserSession();
      return true;
    }
  } catch (error) {
    console.error('Session check error:', error);
  }

  useAuthStore.getState().setLoading(false);
  return false;
}

export async function syncUserSession() {
  try {
    const { data: { session } } = await supabase.auth.getSession();

    if (!session?.access_token) {
      throw new Error('No access token');
    }

    useAuthStore.getState().setAccessToken(session.access_token);

    // Try to get user from our backend
    try {
      const user = await api.getMe();
      useAuthStore.getState().setUser(user as any);
    } catch {
      // User not registered in our backend yet, register them
      const name = session.user?.user_metadata?.name ||
                   session.user?.email?.split('@')[0] ||
                   'User';

      const user = await api.register(name, '');
      useAuthStore.getState().setUser(user as any);
    }

    useAuthStore.getState().setLoading(false);
  } catch (error) {
    console.error('Session sync error:', error);
    useAuthStore.getState().setLoading(false);
  }
}

export async function getAccessToken(): Promise<string | null> {
  const { data: { session } } = await supabase.auth.getSession();
  return session?.access_token || null;
}

export function enableDemoMode() {
  const demoUser = {
    user_id: 'demo-user-id',
    email: 'demo@simplenotes.app',
    name: 'Demo User',
    picture: '',
    households: [],
  };
  useAuthStore.getState().setUser(demoUser);
  useAuthStore.getState().setAccessToken('demo-token');
  useAuthStore.getState().setLoading(false);
}

export function isConfigured(): boolean {
  return !!(config.supabase.url && config.supabase.anonKey);
}
