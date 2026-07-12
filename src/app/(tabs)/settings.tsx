import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, ScrollView, TouchableOpacity, Switch, SafeAreaView, Platform, KeyboardAvoidingView, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { usePos } from '../../lib/pos-store';
import { PasswordGate } from '../../components/PasswordGate';
import { CheckCircle2, AlertCircle, LogOut } from 'lucide-react-native';
import { clearAuthToken } from '../../lib/api';

export default function SettingsScreen() {
  const [statusMsg, setStatusMsg] = useState({ type: '', text: '' });

  useEffect(() => {
    if (statusMsg.text) {
      const timer = setTimeout(() => {
        setStatusMsg({ type: '', text: '' });
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [statusMsg.text]);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <PasswordGate title="Settings Locked" gateType="settings">
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Settings</Text>
          <Text style={styles.headerSubtitle}>Restaurant & billing config</Text>
        </View>

        <SettingsEditor setStatusMsg={setStatusMsg} />

        {statusMsg.text ? (
          <View style={styles.toastContainer} pointerEvents="none">
            <View style={[styles.toast, statusMsg.type === 'error' ? styles.toastError : styles.toastSuccess]}>
              {statusMsg.type === 'error' ? (
                <AlertCircle size={20} color="#ef4444" />
              ) : (
                <CheckCircle2 size={20} color="#0fa05c" />
              )}
              <Text style={[styles.toastText, statusMsg.type === 'error' ? styles.toastTextError : styles.toastTextSuccess]}>
                {statusMsg.text}
              </Text>
            </View>
          </View>
        ) : null}
      </PasswordGate>
    </SafeAreaView>
  );
}

function SettingsEditor({ setStatusMsg }: { setStatusMsg: any }) {
  const router = useRouter();
  const { settings, updateSettings, updatePins } = usePos();
  const [s, setS] = useState(settings);
  const [menuPin, setMenuPin] = useState('');
  const [settingsPin, setSettingsPin] = useState('');

  async function save() {
    setStatusMsg({ type: '', text: '' });
    const err = await updateSettings(s);
    if (err) {
      setStatusMsg({ type: 'error', text: err });
    } else {
      setStatusMsg({ type: 'success', text: 'Settings saved successfully.' });
    }
  }

  async function savePins() {
    setStatusMsg({ type: '', text: '' });
    if (menuPin.length !== 3 || settingsPin.length !== 3) {
      setStatusMsg({ type: 'error', text: 'Both PINs must be exactly 3 digits.' });
      return;
    }
    const err = await updatePins(menuPin, settingsPin);
    if (err) {
      setStatusMsg({ type: 'error', text: err });
    } else {
      setStatusMsg({ type: 'success', text: 'Security PINs updated successfully!' });
      setMenuPin('');
      setSettingsPin('');
    }
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.panel}>
          <Text style={styles.panelTitle}>RESTAURANT DETAILS</Text>
          <View style={styles.spaceY}>
            <Field label="Restaurant Name">
              <TextInput
                style={styles.input}
                value={s.restaurantName}
                onChangeText={(v) => setS({ ...s, restaurantName: v })}
              />
            </Field>
            <Field label="Address">
              <TextInput
                style={styles.input}
                value={s.address}
                onChangeText={(v) => setS({ ...s, address: v })}
              />
            </Field>
            <View style={styles.rowGrid}>
              <Field label="Phone" style={{ flex: 1 }}>
                <TextInput
                  style={styles.input}
                  value={s.phone}
                  onChangeText={(v) => setS({ ...s, phone: v })}
                  keyboardType="phone-pad"
                />
              </Field>
              <View style={{ width: 12 }} />
              <Field label="GST Number" style={{ flex: 1 }}>
                <TextInput
                  style={styles.input}
                  value={s.gstNumber}
                  onChangeText={(v) => setS({ ...s, gstNumber: v })}
                />
              </Field>
            </View>
            <Field label="Bill Footer Text">
              <TextInput
                style={styles.input}
                value={s.footer}
                onChangeText={(v) => setS({ ...s, footer: v })}
              />
            </Field>
            <View style={styles.logoInfo}>
              <View style={styles.logoBadge}>
                <Text style={styles.logoBadgeText}>
                  {s.restaurantName.slice(0, 2).toUpperCase()}
                </Text>
              </View>
              <Text style={styles.logoInfoText}>Logo placeholder — initials shown on bill.</Text>
            </View>
          </View>
        </View>

        <View style={styles.panel}>
          <Text style={styles.panelTitle}>GST</Text>
          <View style={styles.toggleRow}>
            <View style={styles.toggleTextContainer}>
              <Text style={styles.toggleLabel}>Apply GST on bills</Text>
              <Text style={styles.toggleHint}>Adds GST separately in checkout and printed bill</Text>
            </View>
            <Switch
              value={s.gstEnabled}
              onValueChange={(v) => setS({ ...s, gstEnabled: v })}
              trackColor={{ false: '#d4d4d8', true: '#0fa05c' }}
            />
          </View>
          {s.gstEnabled && (
            <Field label="GST Percentage (%)" style={{ marginTop: 12 }}>
              <TextInput
                style={styles.input}
                keyboardType="decimal-pad"
                value={s.gstPct.toString()}
                onChangeText={(v) => setS({ ...s, gstPct: Number(v.replace(/[^\d.]/g, '')) || 0 })}
              />
            </Field>
          )}
        </View>

        <View style={styles.panel}>
          <Text style={styles.panelTitle}>AC CHARGES</Text>
          <View style={styles.toggleRow}>
            <View style={styles.toggleTextContainer}>
              <Text style={styles.toggleLabel}>Enable AC charges</Text>
              <Text style={styles.toggleHint}>Applied when customer picks AC seating in Dine-In</Text>
            </View>
            <Switch
              value={s.acEnabled}
              onValueChange={(v) => setS({ ...s, acEnabled: v })}
              trackColor={{ false: '#d4d4d8', true: '#0fa05c' }}
            />
          </View>
          {s.acEnabled && (
            <Field label="AC Charge (₹)" style={{ marginTop: 12 }}>
              <TextInput
                style={styles.input}
                keyboardType="numeric"
                value={s.acCharge.toString()}
                onChangeText={(v) => setS({ ...s, acCharge: Number(v.replace(/\D/g, '')) || 0 })}
              />
            </Field>
          )}
        </View>

        <TouchableOpacity style={styles.saveBtn} onPress={save}>
          <Text style={styles.saveBtnText}>Save Settings</Text>
        </TouchableOpacity>

        <View style={[styles.panel, { marginTop: 20 }]}>
          <Text style={styles.panelTitle}>SECURITY (PIN CODES)</Text>
          <View style={styles.rowGrid}>
            <Field label="Menu PIN" style={{ flex: 1 }}>
              <TextInput
                style={styles.input}
                value={menuPin}
                onChangeText={(v) => setMenuPin(v.replace(/\D/g, ''))}
                keyboardType="numeric"
                maxLength={3}
                placeholder="***"
                secureTextEntry
              />
            </Field>
            <View style={{ width: 12 }} />
            <Field label="Settings PIN" style={{ flex: 1 }}>
              <TextInput
                style={styles.input}
                value={settingsPin}
                onChangeText={(v) => setSettingsPin(v.replace(/\D/g, ''))}
                keyboardType="numeric"
                maxLength={3}
                placeholder="***"
                secureTextEntry
              />
            </Field>
          </View>
          <TouchableOpacity style={[styles.saveBtn, { marginTop: 12, backgroundColor: '#3f3f46', shadowColor: '#3f3f46' }]} onPress={savePins}>
            <Text style={styles.saveBtnText}>Update PINs</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity 
          style={styles.signOutBtn} 
          onPress={async () => {
            await clearAuthToken();
            router.replace('/login');
          }}>
          <LogOut size={20} color="#ef4444" />
          <Text style={styles.signOutText}>Sign Out</Text>
        </TouchableOpacity>

        <View style={styles.poweredBy}>
          <Text style={styles.poweredByText}>POWERED BY NEURALWEB LABS</Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function Field({ label, children, style }: { label: string; children: React.ReactNode; style?: any }) {
  return (
    <View style={[styles.field, style]}>
      <Text style={styles.fieldLabel}>{label}</Text>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'android' ? 40 : 16,
    paddingBottom: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e4e4e7',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#09090b',
  },
  headerSubtitle: {
    fontSize: 13,
    color: '#71717a',
    marginTop: 2,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  panel: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#e4e4e7',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  panelTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#71717a',
    letterSpacing: 0.5,
    marginBottom: 16,
  },
  spaceY: {
    gap: 12,
  },
  field: {
    marginBottom: 4,
  },
  fieldLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#71717a',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  input: {
    height: 48,
    backgroundColor: '#f4f4f5',
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 15,
    color: '#09090b',
  },
  toastContainer: {
    position: 'absolute',
    bottom: 24,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 100,
  },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
    borderWidth: 1,
    gap: 10,
  },
  toastSuccess: {
    borderColor: '#e1f7e7',
  },
  toastError: {
    borderColor: '#fef2f2',
  },
  toastText: {
    fontSize: 15,
    fontWeight: '600',
  },
  toastTextSuccess: {
    color: '#0fa05c',
  },
  toastTextError: {
    color: '#ef4444',
  },
  rowGrid: {
    flexDirection: 'row',
  },
  logoInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fafafa',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e4e4e7',
    marginTop: 8,
  },
  logoBadge: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#e1f7e7',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  logoBadgeText: {
    color: '#0fa05c',
    fontWeight: '700',
    fontSize: 18,
  },
  logoInfoText: {
    flex: 1,
    fontSize: 12,
    color: '#71717a',
  },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  toggleTextContainer: {
    flex: 1,
    marginRight: 16,
  },
  toggleLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#09090b',
  },
  toggleHint: {
    fontSize: 12,
    color: '#71717a',
    marginTop: 2,
  },
  saveBtn: {
    height: 56,
    backgroundColor: '#0fa05c',
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#0fa05c',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  saveBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  signOutBtn: {
    flexDirection: 'row',
    height: 56,
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fecaca',
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 10,
  },
  signOutText: {
    color: '#ef4444',
    fontSize: 16,
    fontWeight: '600',
  },
  poweredBy: {
    marginTop: 32,
    alignItems: 'center',
  },
  poweredByText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#d4d4d8',
    letterSpacing: 1,
  }
});
