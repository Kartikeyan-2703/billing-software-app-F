import * as SecureStore from 'expo-secure-store';
import Toast from 'react-native-toast-message';
import { router } from 'expo-router';

// Ensure this is configured in .env for dev or CI/CD for production
export const API_URL = process.env.EXPO_PUBLIC_API_URL as string;
const AUTH_TOKEN_KEY = "auth_token";

export async function getAuthToken(): Promise<string | null> {
  return await SecureStore.getItemAsync(AUTH_TOKEN_KEY);
}

export async function setAuthToken(token: string): Promise<void> {
  await SecureStore.setItemAsync(AUTH_TOKEN_KEY, token);
}

export async function clearAuthToken(): Promise<void> {
  await SecureStore.deleteItemAsync(AUTH_TOKEN_KEY);
}

export async function apiFetch(endpoint: string, options: RequestInit = {}) {
  const token = await getAuthToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  try {
    const response = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      let errorMsg = "API Request Failed";
      try {
        const data = await response.json();
        if (data.error) errorMsg = data.error;
        if (data.message) errorMsg = data.message;
      } catch (e) {}
      
      if (response.status === 401 && endpoint !== "/auth/login") {
        await clearAuthToken();
        router.replace("/login");
      } else {
        Toast.show({
          type: 'error',
          text1: 'Error',
          text2: errorMsg,
          position: 'top',
        });
      }
      throw new Error(errorMsg);
    }

    return response.json();
  } catch (error: any) {
    if (error.message === 'Network request failed' || error.message.includes('fetch')) {
      Toast.show({
        type: 'error',
        text1: 'Network Error',
        text2: 'Could not connect to the server.',
        position: 'top',
      });
    }
    throw error;
  }
}
