import { Amplify } from 'aws-amplify';
import {
  signIn,
  signUp,
  signOut,
  confirmSignUp,
  getCurrentUser,
  fetchAuthSession,
  signInWithRedirect,
} from '@aws-amplify/auth';
import config from './config';
import { useAuthStore } from '../stores/store';
import { api } from './api';

// Configure Amplify
export function configureAuth() {
  if (!config.cognito.userPoolId || !config.cognito.clientId) {
    console.warn('Cognito not configured, using mock auth');
    return;
  }

  Amplify.configure({
    Auth: {
      Cognito: {
        userPoolId: config.cognito.userPoolId,
        userPoolClientId: config.cognito.clientId,
        loginWith: {
          oauth: {
            domain: config.cognito.domain.replace('https://', ''),
            scopes: ['email', 'openid', 'profile'],
            redirectSignIn: [window.location.origin + '/callback'],
            redirectSignOut: [window.location.origin],
            responseType: 'code',
            providers: ['Google'],
          },
        },
      },
    },
  });
}

// Auth functions
export async function loginWithGoogle() {
  try {
    // Check if already signed in, sign out first to avoid conflicts
    try {
      const session = await fetchAuthSession();
      if (session.tokens?.accessToken) {
        await signOut();
      }
    } catch {
      // Not signed in, proceed with login
    }
    await signInWithRedirect({ provider: 'Google' });
  } catch (error) {
    console.error('Google login error:', error);
    throw error;
  }
}

export async function loginWithEmail(email: string, password: string) {
  try {
    const result = await signIn({ username: email, password });
    if (result.isSignedIn) {
      await syncUserSession();
    }
    return result;
  } catch (error) {
    console.error('Email login error:', error);
    throw error;
  }
}

export async function registerWithEmail(
  email: string,
  password: string,
  name: string
) {
  try {
    const result = await signUp({
      username: email,
      password,
      options: {
        userAttributes: {
          email,
          name,
        },
      },
    });
    return result;
  } catch (error) {
    console.error('Registration error:', error);
    throw error;
  }
}

export async function confirmRegistration(email: string, code: string) {
  try {
    await confirmSignUp({ username: email, confirmationCode: code });
    return true;
  } catch (error) {
    console.error('Confirmation error:', error);
    throw error;
  }
}

export async function logout() {
  try {
    await signOut();
    useAuthStore.getState().logout();
  } catch (error) {
    console.error('Logout error:', error);
    useAuthStore.getState().logout();
  }
}

export async function checkAuthSession() {
  try {
    const session = await fetchAuthSession();
    if (session.tokens?.accessToken) {
      useAuthStore.getState().setAccessToken(session.tokens.accessToken.toString());
      await syncUserSession();
      return true;
    }
  } catch {
    // Not authenticated
  }
  useAuthStore.getState().setLoading(false);
  return false;
}

export async function syncUserSession() {
  try {
    const session = await fetchAuthSession();
    if (!session.tokens?.accessToken) {
      throw new Error('No access token');
    }

    const token = session.tokens.accessToken.toString();
    useAuthStore.getState().setAccessToken(token);

    // Get current Cognito user
    const cognitoUser = await getCurrentUser();

    // Try to get user from our backend
    try {
      const user = await api.getMe();
      useAuthStore.getState().setUser(user as any);
    } catch {
      // User not registered in our backend yet, register them
      const idToken = session.tokens.idToken;
      const name = idToken?.payload?.name as string || cognitoUser.username;

      const user = await api.register(name, '');
      useAuthStore.getState().setUser(user as any);
    }

    useAuthStore.getState().setLoading(false);
  } catch (error) {
    console.error('Session sync error:', error);
    useAuthStore.getState().setLoading(false);
  }
}

// Demo mode for local development
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
