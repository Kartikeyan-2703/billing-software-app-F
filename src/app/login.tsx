import { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, Alert, ActivityIndicator, KeyboardAvoidingView } from "react-native";
import { StyleSheet, Platform } from "react-native";
import { useRouter } from "expo-router";
import { apiFetch, setAuthToken } from "../lib/api";
import { Lock, Eye, EyeOff } from "lucide-react-native";
import { usePos } from "../lib/pos-store";

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const router = useRouter();
  const { loadData } = usePos();

  const handleLogin = async () => {
    setErrorMsg("");
    if (!email || !password) {
      setErrorMsg("Please enter both email and password.");
      return;
    }

    setLoading(true);
    try {
      const data = await apiFetch("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });

      if (data.token) {
        await setAuthToken(data.token);
        await loadData();
        router.replace("/");
      }
    } catch (error: any) {
      setErrorMsg(error.message || "Invalid credentials.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.card}>
        <View style={styles.iconContainer}>
          <Lock color="#18181b" size={32} />
        </View>
        <Text style={styles.title}>Smart Bill POS</Text>
        <Text style={styles.subtitle}>Enter your credentials to continue</Text>

        {!!errorMsg && (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{errorMsg}</Text>
          </View>
        )}

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Email Address</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. hello@myrestaurant.com"
            placeholderTextColor="#a1a1aa"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
          />
          {email.length > 0 && !email.includes('@') && (
            <TouchableOpacity 
              style={styles.suggestionPill} 
              onPress={() => setEmail(email + '@gmail.com')}
            >
              <Text style={styles.suggestionText}>+ @gmail.com</Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Password</Text>
          <View style={styles.passwordWrapper}>
            <TextInput
              style={styles.passwordInput}
              placeholder="••••••••"
              placeholderTextColor="#a1a1aa"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
            />
            <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeIcon}>
              {showPassword ? <EyeOff size={20} color="#a1a1aa" /> : <Eye size={20} color="#a1a1aa" />}
            </TouchableOpacity>
          </View>
        </View>

        <TouchableOpacity 
          style={[styles.button, loading && styles.buttonDisabled]} 
          onPress={handleLogin}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Sign In</Text>
          )}
        </TouchableOpacity>
      </View>

      <View style={styles.poweredBy}>
        <Text style={styles.poweredByText}>POWERED BY NEURALWEB LABS</Text>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f4f4f5",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  card: {
    width: "100%",
    maxWidth: 400,
    backgroundColor: "#ffffff",
    borderRadius: 24,
    padding: 32,
    alignItems: "center",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.1,
        shadowRadius: 20,
      },
      android: {
        elevation: 10,
      },
      web: {
        boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
      },
    }),
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 16,
    backgroundColor: "#f4f4f5",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#18181b",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: "#71717a",
    marginBottom: 32,
    textAlign: "center",
  },
  inputContainer: {
    width: "100%",
    marginBottom: 16,
  },
  label: {
    fontSize: 12,
    fontWeight: "600",
    color: "#71717a",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  input: {
    height: 52,
    width: "100%",
    backgroundColor: "#f4f4f5",
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    color: "#18181b",
    ...(Platform.OS === 'web' ? { outlineStyle: 'none' } : {} as any),
  },
  suggestionPill: {
    alignSelf: 'flex-start',
    marginTop: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#f4f4f5',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e4e4e7',
  },
  suggestionText: {
    fontSize: 12,
    color: '#52525b',
    fontWeight: '500',
  },
  passwordWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: "#f4f4f5",
    borderRadius: 12,
    height: 52,
    width: '100%',
    overflow: 'hidden',
  },
  passwordInput: {
    flex: 1,
    minWidth: 0,
    height: "100%",
    paddingLeft: 16,
    paddingRight: 8,
    fontSize: 16,
    color: "#18181b",
    backgroundColor: 'transparent',
    ...(Platform.OS === 'web' ? { outlineStyle: 'none' } : {} as any),
  },
  eyeIcon: {
    width: 52,
    height: 52,
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  button: {
    width: "100%",
    height: 52,
    backgroundColor: "#18181b",
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 16,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
  },
  errorBox: {
    width: "100%",
    backgroundColor: "#fef2f2",
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#fecaca",
    marginBottom: 16,
  },
  errorText: {
    color: "#ef4444",
    fontSize: 14,
    fontWeight: "500",
    textAlign: "center",
  },
  poweredBy: {
    marginTop: 40,
  },
  poweredByText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#a1a1aa',
    letterSpacing: 1,
  }
});
