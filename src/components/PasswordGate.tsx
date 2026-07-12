import React, { useState, type ReactNode } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, TouchableWithoutFeedback, Keyboard } from 'react-native';
import { Lock } from 'lucide-react-native';

export function PasswordGate({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  const [unlocked, setUnlocked] = useState(false);
  const [value, setValue] = useState('');
  const [error, setError] = useState(false);

  if (unlocked) return <>{children}</>;

  const handleSubmit = () => {
    if (value === '000') {
      setUnlocked(true);
    } else {
      setError(true);
      setValue('');
    }
    Keyboard.dismiss();
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
              secureTextEntry
              keyboardType="numeric"
              value={value}
              onChangeText={(text) => {
                setValue(text);
                setError(false);
              }}
              onSubmitEditing={handleSubmit}
              placeholder="•  •  •"
              placeholderTextColor="#a1a1aa"
              style={[styles.input, error && styles.inputError]}
            />
            {error && <Text style={styles.errorText}>Incorrect PIN. Try 000.</Text>}
            <TouchableOpacity style={styles.button} onPress={handleSubmit}>
              <Text style={styles.buttonText}>Unlock</Text>
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
