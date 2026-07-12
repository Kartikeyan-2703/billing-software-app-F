import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, FlatList, SafeAreaView, Platform, Modal, Alert, KeyboardAvoidingView } from 'react-native';
import { Search, Plus, Pencil, Trash2, X } from 'lucide-react-native';
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
        <PasswordGate title="Menu Editor Locked">
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
                    { text: 'Delete', style: 'destructive', onPress: () => deleteMenu(m.code) }
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
            onClose={() => {
              setEditing(null);
              setCreating(false);
            }}
            onSubmit={(item) => {
              const err = editing ? updateMenu(editing.code, item) : addMenu(item);
              if (err) {
                Alert.alert('Error', err);
                return false;
              }
              return true;
            }}
          />
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

function ItemForm({
  initial,
  onClose,
  onSubmit,
}: {
  initial?: MenuItem;
  onClose: () => void;
  onSubmit: (item: MenuItem) => boolean;
}) {
  const [code, setCode] = useState(initial?.code ?? '');
  const [name, setName] = useState(initial?.name ?? '');
  const [price, setPrice] = useState(initial?.price.toString() ?? '');
  const [category, setCategory] = useState(initial?.category ?? CATEGORIES[0]);
  const [showCat, setShowCat] = useState(false);

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
          />
        </Field>
        
        <Field label="Item Name">
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="e.g. Masala Dosa"
          />
        </Field>

        <View style={styles.rowGrid}>
          <Field label="Price (₹)" style={{ flex: 1 }}>
            <TextInput
              style={styles.input}
              value={price}
              keyboardType="decimal-pad"
              onChangeText={(v) => setPrice(v.replace(/[^\d.]/g, ''))}
              placeholder="0.00"
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
      </View>

      <TouchableOpacity
        style={styles.submitBtn}
        onPress={() => {
          if (!code || !name || !price) {
            Alert.alert('Validation', 'Please fill all fields');
            return;
          }
          const ok = onSubmit({ code, name: name.trim(), price: Number(price), category });
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
});
