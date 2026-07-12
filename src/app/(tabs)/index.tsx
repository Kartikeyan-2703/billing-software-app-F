import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SectionList,
  FlatList,
  SafeAreaView,
  Platform,
} from 'react-native';
import { Search, Plus, Minus, ArrowRight } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { usePos, inr, type MenuItem } from '../../lib/pos-store';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function BillingScreen() {
  const { menu, cart, setQty, settings } = usePos();
  const [query, setQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const categories = useMemo(() => {
    return ['All', ...Array.from(new Set(menu.map((m) => m.category)))];
  }, [menu]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    let result = menu;
    if (selectedCategory !== 'All') {
      result = result.filter((m) => m.category === selectedCategory);
    }
    if (q) {
      result = result.filter(
        (m) => m.code.includes(q) || m.name.toLowerCase().includes(q)
      );
    }
    return result;
  }, [menu, query, selectedCategory]);

  const cartLines = useMemo(
    () =>
      Object.entries(cart)
        .map(([code, qty]) => {
          const m = menu.find((i) => i.code === code);
          return m ? { ...m, qty } : null;
        })
        .filter((x): x is NonNullable<typeof x> => !!x),
    [cart, menu]
  );

  const subtotal = cartLines.reduce((s, l) => s + l.price * l.qty, 0);
  const itemCount = cartLines.reduce((s, l) => s + l.qty, 0);

  const grouped = useMemo(() => {
    const g: Record<string, MenuItem[]> = {};
    for (const m of filtered) {
      (g[m.category] ||= []).push(m);
    }
    return Object.entries(g).map(([category, data]) => ({
      title: category,
      data,
    }));
  }, [filtered]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>{settings.restaurantName}</Text>
          <Text style={styles.headerSubtitle}>Point of Sale · Billing</Text>
        </View>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {settings.restaurantName.slice(0, 2).toUpperCase()}
          </Text>
        </View>
      </View>

      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Search size={16} color="#71717a" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            value={query}
            onChangeText={setQuery}
            placeholder="Search by name or code (e.g. 103)"
            placeholderTextColor="#71717a"
          />
        </View>
        <View style={styles.categoriesContainer}>
          <FlatList
            horizontal
            showsHorizontalScrollIndicator={false}
            data={categories}
            keyExtractor={(item, index) => String(item) + index}
            renderItem={({ item: cat }) => (
              <TouchableOpacity
                onPress={() => setSelectedCategory(cat as string)}
                style={[
                  styles.categoryPill,
                  selectedCategory === cat && styles.categoryPillActive,
                ]}>
                <Text
                  style={[
                    styles.categoryPillText,
                    selectedCategory === cat && styles.categoryPillTextActive,
                  ]}>
                  {cat as string}
                </Text>
              </TouchableOpacity>
            )}
          />
        </View>
      </View>

      <SectionList
        sections={grouped}
        keyExtractor={(item) => item.code}
        contentContainerStyle={[
          styles.listContent,
          itemCount > 0 && { paddingBottom: 120 },
        ]}
        renderSectionHeader={({ section: { title } }) => (
          <Text style={styles.sectionHeader}>{title}</Text>
        )}
        renderItem={({ item }) => {
          const qty = cart[item.code] ?? 0;
          return (
            <View
              style={[
                styles.menuItem,
                qty > 0 && styles.menuItemActive,
              ]}>
              <View style={styles.menuItemLeft}>
                <View style={styles.menuItemHeader}>
                  <View style={styles.codePill}>
                    <Text style={styles.codePillText}>{item.code}</Text>
                  </View>
                  <Text style={styles.menuItemName} numberOfLines={1}>
                    {item.name}
                  </Text>
                </View>
                <Text style={styles.menuItemPrice}>{inr(item.price)}</Text>
              </View>
              <QtyStepper qty={qty} onChange={(n) => setQty(item.code, n)} />
            </View>
          );
        }}
        ListEmptyComponent={() => (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>
              No dishes match “{query}”.
            </Text>
          </View>
        )}
      />

      {itemCount > 0 && (
        <View style={[styles.checkoutBar, { bottom: 0 }]}>
          <View style={styles.checkoutBarInner}>
            <View style={styles.checkoutBarRow}>
              <View>
                <Text style={styles.checkoutBarLabel}>ACTIVE BILL</Text>
                <Text style={styles.checkoutBarValue}>
                  {itemCount} {itemCount === 1 ? 'item' : 'items'}
                </Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={styles.checkoutBarLabel}>SUBTOTAL</Text>
                <Text style={styles.checkoutBarTotal}>{inr(subtotal)}</Text>
              </View>
            </View>
            <TouchableOpacity
              onPress={() => router.push('/checkout')}
              style={styles.checkoutButton}>
              <Text style={styles.checkoutButtonText}>Checkout</Text>
              <ArrowRight size={18} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

function QtyStepper({ qty, onChange }: { qty: number; onChange: (n: number) => void }) {
  if (qty === 0) {
    return (
      <TouchableOpacity
        onPress={() => onChange(1)}
        style={styles.addButton}>
        <Plus size={18} color="#fff" />
      </TouchableOpacity>
    );
  }
  return (
    <View style={styles.stepper}>
      <TouchableOpacity
        onPress={() => onChange(qty - 1)}
        style={styles.stepperButton}>
        <Minus size={18} color="#fff" />
      </TouchableOpacity>
      <Text style={styles.stepperValue}>{qty}</Text>
      <TouchableOpacity
        onPress={() => onChange(qty + 1)}
        style={styles.stepperButton}>
        <Plus size={18} color="#fff" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff', // zinc-100 no longer used here
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'android' ? 40 : 16,
    paddingBottom: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e4e4e7',
  },
  headerTitleContainer: {},
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#09090b', // zinc-950
  },
  headerSubtitle: {
    fontSize: 13,
    color: '#71717a', // zinc-500
    marginTop: 2,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#e1f7e7', // brand-soft (using red-50 roughly, or maybe zinc-100)
    borderWidth: 1,
    borderColor: '#86efac',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#0fa05c', // brand (red-600)
  },
  searchContainer: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e4e4e7',
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f4f4f5',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 44,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#09090b',
  },
  categoriesContainer: {
    marginTop: 12,
  },
  categoryPill: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#f4f4f5',
    marginRight: 8,
  },
  categoryPillActive: {
    backgroundColor: '#09090b',
  },
  categoryPillText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#52525b', // zinc-600
  },
  categoryPillTextActive: {
    color: '#ffffff',
  },
  listContent: {
    padding: 20,
  },
  sectionHeader: {
    fontSize: 11,
    fontWeight: '600',
    color: '#71717a',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
    marginTop: 24,
    paddingHorizontal: 4,
  },
  menuItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#e4e4e7',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  menuItemActive: {
    borderColor: '#0fa05c', // brand border
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
    fontSize: 14,
    fontWeight: '500',
    color: '#09090b',
  },
  menuItemPrice: {
    fontSize: 14,
    fontWeight: '600',
    color: '#18181b', // zinc-900
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#09090b',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0fa05c', // brand
    borderRadius: 12,
    padding: 4,
  },
  stepperButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
    backgroundColor: 'transparent',
  },
  stepperValue: {
    width: 24,
    textAlign: 'center',
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e4e4e7',
    borderStyle: 'dashed',
    marginTop: 20,
  },
  emptyText: {
    fontSize: 14,
    color: '#71717a',
  },
  checkoutBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    paddingBottom: 16,
    backgroundColor: 'transparent',
  },
  checkoutBarInner: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 10,
    borderWidth: 1,
    borderColor: '#e4e4e7',
  },
  checkoutBarRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  checkoutBarLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: '#71717a',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  checkoutBarValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#09090b',
    marginTop: 2,
  },
  checkoutBarTotal: {
    fontSize: 18,
    fontWeight: '600',
    color: '#09090b',
    marginTop: 2,
  },
  checkoutButton: {
    backgroundColor: '#0fa05c',
    flexDirection: 'row',
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  checkoutButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '500',
  },
});
