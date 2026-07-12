import AsyncStorage from "@react-native-async-storage/async-storage";

// Ensure this is configured in .env for dev or CI/CD for production
export const API_URL = process.env.EXPO_PUBLIC_API_URL as string;
const AUTH_TOKEN_KEY = "auth_token";

export async function getAuthToken(): Promise<string | null> {
  return await AsyncStorage.getItem(AUTH_TOKEN_KEY);
}

export async function setAuthToken(token: string): Promise<void> {
  await AsyncStorage.setItem(AUTH_TOKEN_KEY, token);
}

export async function clearAuthToken(): Promise<void> {
  await AsyncStorage.removeItem(AUTH_TOKEN_KEY);
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

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    let errorMsg = "API Request Failed";
    try {
      const data = await response.json();
      if (data.error) errorMsg = data.error;
    } catch (e) {}
    throw new Error(errorMsg);
  }

  return response.json();
}
