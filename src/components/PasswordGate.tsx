import React, { useState, type ReactNode } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, TouchableWithoutFeedback, Keyboard, ActivityIndicator } from 'react-native';
import { Lock } from 'lucide-react-native';
import { apiFetch } from '../lib/api';

import { useFocusEffect } from 'expo-router';

export function PasswordGate({
  title,
  gateType,
  children,
}: {
  title: string;
  gateType: "menu" | "settings" | "trends";
  children: ReactNode;
}) {
  const [unlocked, setUnlocked] = useState(false);
  const [value, setValue] = useState('');
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(false);

  useFocusEffect(
    React.useCallback(() => {
      // When screen loses focus, reset state to locked
      return () => {
        setUnlocked(false);
        setValue('');
        setError(false);
      };
    }, [])
  );

  if (unlocked) return <>{children}</>;

  const handleSubmit = async () => {
    if (!value) return;
    Keyboard.dismiss();
    setLoading(true);
    
    try {
      await apiFetch("/auth/verify-gate", {
        method: "POST",
        body: JSON.stringify({ type: gateType, password: value })
      });
      setUnlocked(true);
    } catch (err) {
      setError(true);
      setValue('');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={styles.inner}>
          <View style={styles.iconContainer}>
            <Lock size={24} color="#0fa05c" />
          </View>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.subtitle}>Enter the manager PIN to continue.</Text>
          
          <View style={styles.form}>
            <TextInput
              autoFocus
              keyboardType="numeric"
              maxLength={3}
              value={value}
              onChangeText={(text) => {
                setValue(text.replace(/\D/g, ""));
                setError(false);
              }}
              onSubmitEditing={handleSubmit}
              placeholder="•  •  •"
              placeholderTextColor="#a1a1aa"
              style={[styles.input, error && styles.inputError]}
            />
            {error && <Text style={styles.errorText}>Incorrect PIN.</Text>}
            <TouchableOpacity style={styles.button} onPress={handleSubmit} disabled={loading}>
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}>Unlock</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f4f4f5',
  },
  inner: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: '#e1f7e7',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#86efac',
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#09090b',
  },
  subtitle: {
    fontSize: 14,
    color: '#71717a',
    marginTop: 4,
  },
  form: {
    width: '100%',
    maxWidth: 320,
    marginTop: 24,
  },
  input: {
    height: 56,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    textAlign: 'center',
    fontSize: 24,
    letterSpacing: 12,
    fontWeight: '600',
    color: '#09090b',
    borderWidth: 1,
    borderColor: '#e4e4e7',
  },
  inputError: {
    borderColor: '#ef4444',
  },
  errorText: {
    color: '#ef4444',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 8,
  },
  button: {
    height: 48,
    backgroundColor: '#0fa05c',
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '600',
  },
});
