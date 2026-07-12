import React, { useMemo, useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, FlatList, SafeAreaView, Platform, Modal, Alert, KeyboardAvoidingView } from 'react-native';
import { Search, Plus, Pencil, Trash2, X, CheckCircle2, AlertCircle } from 'lucide-react-native';
import { usePos, inr, type MenuItem } from '../../lib/pos-store';
import { PasswordGate } from '../../components/PasswordGate';
import { CATEGORIES } from '../../lib/menu-data';
import { Picker } from '@react-native-picker/picker'; // We need to install this or use a simple ActionSheet/Modal for categories, or just a simple custom dropdown. Since we can't install, I'll use a custom horizontal ScrollView for Category picker

export default function MenuScreen() {
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Edit Menu</Text>
          <Text style={styles.headerSubtitle}>Manager access</Text>
        </View>
        <PasswordGate title="Menu Locked" gateType="menu">
          <MenuEditor />
        </PasswordGate>
      </View>
    </SafeAreaView>
  );
}

function MenuEditor() {
  const { menu, addMenu, updateMenu, deleteMenu } = usePos();
  const [query, setQuery] = useState('');
  const [editing, setEditing] = useState<MenuItem | null>(null);
  const [creating, setCreating] = useState(false);
  const [statusMsg, setStatusMsg] = useState({ type: '', text: '' });

  useEffect(() => {
    if (statusMsg.text) {
      const timer = setTimeout(() => {
        setStatusMsg({ type: '', text: '' });
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [statusMsg.text]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return menu;
    return menu.filter((m) => m.code.includes(q) || m.name.toLowerCase().includes(q));
  }, [menu, query]);

  return (
    <View style={styles.flex1}>
      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Search size={16} color="#71717a" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            value={query}
            onChangeText={setQuery}
            placeholder="Search by name or code"
            placeholderTextColor="#71717a"
          />
        </View>
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.code}
        contentContainerStyle={styles.listContent}
        renderItem={({ item: m }) => (
          <View style={styles.menuItem}>
            <View style={styles.menuItemLeft}>
              <View style={styles.menuItemHeader}>
                <View style={styles.codePill}>
                  <Text style={styles.codePillText}>{m.code}</Text>
                </View>
                <Text style={styles.menuItemName} numberOfLines={1}>{m.name}</Text>
              </View>
              <Text style={styles.menuItemSub}>
                {m.category} · <Text style={styles.menuItemPrice}>{inr(m.price)}</Text>
              </Text>
            </View>
            
            <View style={styles.actions}>
              <TouchableOpacity
                style={styles.actionBtn}
                onPress={() => setEditing(m)}>
                <Pencil size={16} color="#71717a" />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.actionBtnDelete}
                onPress={() => {
                  Alert.alert('Delete Item', `Delete ${m.name}?`, [
                    { text: 'Cancel', style: 'cancel' },
                    { text: 'Delete', style: 'destructive', onPress: async () => {
                        try {
                          await deleteMenu(m.code);
                          setStatusMsg({ type: 'success', text: `${m.name} was deleted.` });
                        } catch (err: any) {
                          setStatusMsg({ type: 'error', text: err.message || "Failed to delete item." });
                        }
                      } 
                    }
                  ]);
                }}>
                <Trash2 size={16} color="#ef4444" />
              </TouchableOpacity>
            </View>
          </View>
        )}
        ListEmptyComponent={() => (
          <Text style={styles.emptyText}>No items found.</Text>
        )}
      />

      <TouchableOpacity
        style={styles.fab}
        activeOpacity={0.9}
        onPress={() => setCreating(true)}>
        <Plus size={24} color="#fff" />
        <Text style={styles.fabText}>Add Item</Text>
      </TouchableOpacity>

      <Modal
        visible={!!editing || creating}
        animationType="slide"
        transparent
        onRequestClose={() => {
          setEditing(null);
          setCreating(false);
        }}>
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.modalOverlay}>
          <ItemForm
            initial={editing || undefined}
            existingCodes={menu.map(m => m.code)}
            onClose={() => {
              setEditing(null);
              setCreating(false);
            }}
            onSubmit={async (item) => {
              const err = editing ? await updateMenu(editing.code, item) : await addMenu(item);
              if (err) {
                setStatusMsg({ type: 'error', text: err });
                return false;
              }
              setStatusMsg({ type: 'success', text: `Item ${editing ? 'updated' : 'added'} successfully.` });
              return true;
            }}
          />
        </KeyboardAvoidingView>
      </Modal>

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
    </View>
  );
}

function ItemForm({
  initial,
  onClose,
  onSubmit,
  existingCodes,
}: {
  initial?: MenuItem;
  onClose: () => void;
  onSubmit: (item: MenuItem) => Promise<boolean> | boolean;
  existingCodes: string[];
}) {
  const [code, setCode] = useState(initial?.code ?? '');
  const [name, setName] = useState(initial?.name ?? '');
  const [price, setPrice] = useState(initial?.price.toString() ?? '');
  const [category, setCategory] = useState(initial?.category ?? CATEGORIES[0]);
  const [showCat, setShowCat] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  return (
    <View style={styles.modalContent}>
      <View style={styles.modalHeader}>
        <Text style={styles.modalTitle}>{initial ? 'Edit Item' : 'New Item'}</Text>
        <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
          <X size={20} color="#71717a" />
        </TouchableOpacity>
      </View>

      <View style={styles.formSpace}>
        <Field label="Item Code (3 digits)">
          <TextInput
            style={styles.inputCode}
            value={code}
            keyboardType="number-pad"
            maxLength={3}
            onChangeText={(v) => setCode(v.replace(/\D/g, '').slice(0, 3))}
            placeholder="e.g. 101"
            placeholderTextColor="#a1a1aa"
          />
        </Field>
        
        <Field label="Item Name">
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="e.g. Masala Dosa"
            placeholderTextColor="#a1a1aa"
          />
        </Field>

        <View style={styles.rowGrid}>
          <Field label="Price (₹)" style={{ flex: 1 }}>
            <TextInput
              style={styles.input}
              value={price}
              keyboardType="number-pad"
              onChangeText={(v) => setPrice(v.replace(/\D/g, ''))}
              placeholder="0"
              placeholderTextColor="#a1a1aa"
            />
          </Field>

          <Field label="Category" style={{ flex: 1 }}>
            <TouchableOpacity 
              style={[styles.input, { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }]}
              onPress={() => setShowCat(!showCat)}>
              <Text style={{ fontSize: 15, color: '#09090b' }}>{category}</Text>
              <Text style={{ fontSize: 12, color: '#71717a' }}>▼</Text>
            </TouchableOpacity>
          </Field>
        </View>

        {showCat && (
          <View style={styles.dropdownList}>
            {CATEGORIES.map(c => (
              <TouchableOpacity key={c} style={styles.dropdownItem} onPress={() => { setCategory(c); setShowCat(false); }}>
                <Text style={{ fontSize: 15, color: category === c ? '#0fa05c' : '#09090b', fontWeight: category === c ? '600' : '400' }}>{c}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
        
        {!!errorMsg && (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{errorMsg}</Text>
          </View>
        )}
      </View>

      <TouchableOpacity
        style={styles.submitBtn}
        onPress={async () => {
          setErrorMsg('');
          if (!code || !name || !price) {
            setErrorMsg('Please fill all fields');
            return;
          }
          if (!initial && existingCodes.includes(code)) {
            setErrorMsg(`Item code ${code} already exists.`);
            return;
          }
          if (initial && initial.code !== code && existingCodes.includes(code)) {
            setErrorMsg(`Item code ${code} already exists.`);
            return;
          }
          const ok = await onSubmit({ code, name: name.trim(), price: Number(price), category });
          if (ok) onClose();
        }}>
        <Text style={styles.submitBtnText}>{initial ? 'Save Changes' : 'Add Item'}</Text>
      </TouchableOpacity>
    </View>
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
  safeArea: {
    flex: 1,
    backgroundColor: '#fafafa',
  },
  container: {
    flex: 1,
    width: '100%',
    maxWidth: 720,
    alignSelf: 'center',
    backgroundColor: '#fafafa',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'android' ? 40 : 20,
    paddingBottom: 16,
    backgroundColor: '#fafafa',
    zIndex: 20,
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
  flex1: {
    flex: 1,
  },
  searchContainer: {
    backgroundColor: '#fafafa',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e4e4e7',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 44,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: '#09090b',
  },
  listContent: {
    padding: 20,
    paddingBottom: 100,
  },
  menuItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#e4e4e7',
  },
  menuItemLeft: {
    flex: 1,
    marginRight: 16,
  },
  menuItemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  codePill: {
    backgroundColor: '#f4f4f5',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    marginRight: 8,
  },
  codePillText: {
    fontSize: 10,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    fontWeight: '500',
    color: '#71717a',
  },
  menuItemName: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
    color: '#09090b',
  },
  menuItemSub: {
    fontSize: 12,
    color: '#71717a',
  },
  menuItemPrice: {
    fontWeight: '600',
    color: '#18181b',
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionBtnDelete: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#fef2f2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    textAlign: 'center',
    color: '#71717a',
    marginTop: 40,
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    height: 56,
    paddingHorizontal: 20,
    backgroundColor: '#0fa05c',
    borderRadius: 28,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: '#0fa05c',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  fabText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    ...Platform.select({
      web: {
        backdropFilter: 'blur(4px)',
      }
    }) as any,
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 24,
    width: '100%',
    maxWidth: 448,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 25 },
    shadowOpacity: 0.15,
    shadowRadius: 50,
    elevation: 24,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#09090b',
  },
  closeBtn: {
    padding: 4,
    backgroundColor: '#f4f4f5',
    borderRadius: 16,
  },
  formSpace: {
    gap: 16,
    marginBottom: 24,
  },
  field: {
    // marginBottom: 4,
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
  inputCode: {
    height: 48,
    backgroundColor: '#f4f4f5',
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 15,
    color: '#09090b',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  rowGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  dropdownList: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e4e4e7',
    borderRadius: 12,
    marginTop: -8,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  dropdownItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f4f4f5',
  },
  submitBtn: {
    height: 52,
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
  submitBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  errorBox: {
    backgroundColor: '#fef2f2',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#fecaca',
  },
  errorText: {
    color: '#ef4444',
    fontSize: 13,
    fontWeight: '500',
    textAlign: 'center',
  },
  toastContainer: {
    position: 'absolute',
    bottom: 96,
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
});
