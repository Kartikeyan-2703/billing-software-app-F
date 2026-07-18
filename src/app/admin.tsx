import { SafeAreaView } from 'react-native-safe-area-context';
import { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, Alert, ActivityIndicator, ScrollView, Platform } from "react-native";
import { StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { Shield, Plus, LogOut } from "lucide-react-native";
import { API_URL } from "../lib/api";

export default function AdminScreen() {
  const router = useRouter();
  
  // Auth State
  const [isAdminAuth, setIsAdminAuth] = useState(false);
  
  // Super Admin Credentials
  const [adminEmail, setAdminEmail] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  
  // New Hotel Details
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [menuPassword, setMenuPassword] = useState("");
  const [settingsPassword, setSettingsPassword] = useState("");
  
  const [loading, setLoading] = useState(false);

  const handleCreateHotel = async () => {
    if (!adminEmail || !adminPassword || !email || !password || !menuPassword || !settingsPassword) {
      Alert.alert("Validation", "All fields are required.");
      return;
    }

    if (menuPassword.length !== 3 || settingsPassword.length !== 3) {
      Alert.alert("Validation", "PINs must be exactly 3 digits.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/admin/hotels`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          adminEmail,
          adminPassword,
          email,
          password,
          menuPassword,
          settingsPassword
        }),
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || "Failed to create hotel");
      }

      Alert.alert("Success", "Hotel created successfully!");
      // Clear new hotel fields
      setEmail("");
      setPassword("");
      setMenuPassword("");
      setSettingsPassword("");
      
    } catch (error: any) {
      Alert.alert("Error", error.message);
    } finally {
      setLoading(false);
    }
  };

  if (!isAdminAuth) {
    return (
      <View style={styles.container}>
        <View style={styles.card}>
          <View style={[styles.iconContainer, { backgroundColor: "#09090b" }]}>
            <Shield color="#ffffff" size={32} />
          </View>
          <Text style={styles.title}>Admin Portal</Text>
          <Text style={styles.subtitle}>Master access to create hotels</Text>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Admin Email</Text>
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                value={adminEmail}
                onChangeText={setAdminEmail}
                autoCapitalize="none"
                keyboardType="email-address"
              />
            </View>
            
            <Text style={styles.sectionTitle}>Admin Password</Text>
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                value={adminPassword}
                onChangeText={setAdminPassword}
                secureTextEntry
              />
            </View>
          </View>

          <TouchableOpacity 
            style={styles.blackButton} 
            onPress={() => {
              if (adminEmail && adminPassword) {
                setIsAdminAuth(true);
              }
            }}
          >
            <Text style={styles.buttonText}>Verify Access</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#fafafa" }}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Master Admin Console</Text>
        <Text style={styles.headerSubtitle}>Create & manage hotel accounts</Text>
      </View>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={[styles.card, { marginTop: 24 }]}>
          <View style={styles.formHeader}>
            <View style={styles.smallIconContainer}>
              <Plus color="#18181b" size={20} />
            </View>
            <View>
              <Text style={styles.formTitle}>Add New Hotel</Text>
              <Text style={styles.formSubtitle}>Provision a fresh account</Text>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Hotel Email</Text>
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
              />
            </View>
            
            <Text style={styles.sectionTitle}>Main Login Password</Text>
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                value={password}
                onChangeText={setPassword}
                secureTextEntry
              />
            </View>
            
            <Text style={[styles.sectionTitle, { marginTop: 12, color: "#a1a1aa" }]}>Dashboard Gates</Text>
            <View style={{ flexDirection: 'row', gap: 12 }}>
              <View style={[styles.inputContainer, { flex: 1 }]}>
                <Text style={styles.sectionTitle}>Menu PIN</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. 123"
                  value={menuPassword}
                  onChangeText={(v) => setMenuPassword(v.replace(/\D/g, '').slice(0,3))}
                  keyboardType="numeric"
                />
              </View>
              <View style={[styles.inputContainer, { flex: 1 }]}>
                <Text style={styles.sectionTitle}>Settings PIN</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. 123"
                  value={settingsPassword}
                  onChangeText={(v) => setSettingsPassword(v.replace(/\D/g, '').slice(0,3))}
                  keyboardType="numeric"
                />
              </View>
            </View>
          </View>

          <TouchableOpacity 
            style={[styles.blackButton, loading && styles.buttonDisabled]} 
            onPress={handleCreateHotel}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Create Hotel Account</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity style={styles.signOutBtn} onPress={() => router.replace("/login")}>
            <LogOut color="#71717a" size={20} />
            <Text style={styles.signOutText}>Exit Admin Portal</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fafafa",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  scrollContainer: {
    flexGrow: 1,
    alignItems: "center",
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  header: {
    padding: 20,
    backgroundColor: "#ffffff",
    borderBottomWidth: 1,
    borderBottomColor: "#e4e4e7",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#09090b",
  },
  headerSubtitle: {
    fontSize: 12,
    color: "#71717a",
    marginTop: 2,
  },
  card: {
    width: "100%",
    maxWidth: 440,
    backgroundColor: "#ffffff",
    borderRadius: 24,
    padding: 32,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#e4e4e7",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.05,
        shadowRadius: 15,
      },
      android: {
        elevation: 5,
      },
      web: {
        boxShadow: "0 8px 40px rgba(0, 0, 0, 0.08)",
      },
    }),
  },
  formHeader: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 24,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#e4e4e7",
    borderStyle: "dashed",
    gap: 12,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  smallIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "#f4f4f5",
    alignItems: "center",
    justifyContent: "center",
  },
  formTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#09090b",
  },
  formSubtitle: {
    fontSize: 11,
    color: "#71717a",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#09090b",
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: "#71717a",
    marginBottom: 24,
  },
  section: {
    width: '100%',
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: "600",
    color: "#71717a",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  inputContainer: {
    width: "100%",
    marginBottom: 16,
  },
  input: {
    height: 48,
    width: "100%",
    backgroundColor: "#f4f4f5",
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 14,
    fontWeight: "500",
    color: "#09090b",
    borderWidth: 1,
    borderColor: "#e4e4e7",
  },
  blackButton: {
    width: "100%",
    height: 52,
    backgroundColor: "#09090b",
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "600",
  },
  signOutBtn: {
    flexDirection: 'row',
    height: 52,
    width: '100%',
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e4e4e7',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 16,
  },
  signOutText: {
    color: '#71717a',
    fontSize: 14,
    fontWeight: '600',
  },
});
