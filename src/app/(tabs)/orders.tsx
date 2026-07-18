import { SafeAreaView } from 'react-native-safe-area-context';
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, FlatList, Platform, ActivityIndicator } from 'react-native';
import { Search, Receipt } from 'lucide-react-native';
import { usePos, inr, type Order } from '../../lib/pos-store';
import { BillDialog } from '../../components/BillDialog';

export default function OrdersScreen() {
  const { orders, trends, searchOrders, fetchNextOrdersPage, isFetchingOrders, hasMoreOrders } = usePos();
  const [query, setQuery] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      searchOrders(query);
    }, 500);
    return () => clearTimeout(timer);
  }, [query]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Past Orders</Text>
        <Text style={styles.headerSubtitle}>{trends?.totalOrders || orders.length} total bills</Text>
      </View>

      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Search size={16} color="#71717a" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            value={query}
            onChangeText={setQuery}
            placeholder="Search by bill no, item or date"
            placeholderTextColor="#71717a"
          />
        </View>
      </View>

      <FlatList
        data={orders}
        keyExtractor={(item) => item.billNo}
        contentContainerStyle={styles.listContent}
        onEndReached={fetchNextOrdersPage}
        onEndReachedThreshold={0.5}
        ListFooterComponent={isFetchingOrders ? <ActivityIndicator size="small" color="#0fa05c" style={{ margin: 20 }} /> : null}
        ListEmptyComponent={() => (
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIconContainer}>
              <Receipt size={24} color="#0fa05c" />
            </View>
            <Text style={styles.emptyText}>
              {query ? 'No matches.' : 'No orders yet. Generate your first bill.'}
            </Text>
          </View>
        )}
        renderItem={({ item: o }) => {
          const d = new Date(o.date);
          return (
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => setSelectedOrder(o)}
              style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.billNo}>#{o.billNo}</Text>
                  <Text style={styles.date}>
                    {d.toLocaleDateString('en-IN', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric',
                    })}{' '}
                    ·{' '}
                    {d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                  </Text>
                </View>
                <Text style={styles.total}>{inr(o.total)}</Text>
              </View>

              <View style={styles.itemsDivider} />
              <View style={styles.itemsContainer}>
                {o.items.slice(0, 3).map((l) => (
                  <View key={l.code} style={styles.itemRow}>
                    <Text style={styles.itemName} numberOfLines={1}>
                      {l.qty} × {l.name}
                    </Text>
                    <Text style={styles.itemPrice}>{inr(l.price * l.qty)}</Text>
                  </View>
                ))}
                {o.items.length > 3 && (
                  <Text style={styles.moreItems}>+ {o.items.length - 3} more</Text>
                )}
              </View>

              <View style={styles.chipsContainer}>
                <Chip text={o.orderType} />
                {o.acMode && <Chip text={o.acMode} />}
                <Chip text={o.paymentMode} />
                {o.gstPct > 0 && <Chip text={`GST ${o.gstPct}%`} />}
                {o.acCharge > 0 && <Chip text={`AC ${inr(o.acCharge)}`} />}
              </View>
            </TouchableOpacity>
          );
        }}
      />

      {selectedOrder && (
        <BillDialog order={selectedOrder} onClose={() => setSelectedOrder(null)} />
      )}
    </SafeAreaView>
  );
}

function Chip({ text }: { text: string }) {
  return (
    <View style={styles.chip}>
      <Text style={styles.chipText}>{text}</Text>
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
    fontSize: 15,
    color: '#09090b',
  },
  listContent: {
    padding: 20,
  },
  emptyContainer: {
    alignItems: 'center',
    marginTop: 60,
  },
  emptyIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: '#e1f7e7',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  emptyText: {
    fontSize: 14,
    color: '#71717a',
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e4e4e7',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  billNo: {
    fontSize: 11,
    fontWeight: '600',
    color: '#71717a',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  date: {
    fontSize: 14,
    fontWeight: '600',
    color: '#09090b',
    marginTop: 2,
  },
  total: {
    fontSize: 18,
    fontWeight: '600',
    color: '#09090b',
  },
  itemsDivider: {
    height: 1,
    borderTopWidth: 1,
    borderColor: '#e4e4e7',
    borderStyle: 'dashed',
    marginTop: 12,
    marginBottom: 12,
  },
  itemsContainer: {
    gap: 4,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  itemName: {
    fontSize: 12,
    color: '#52525b',
    flex: 1,
    marginRight: 16,
  },
  itemPrice: {
    fontSize: 12,
    color: '#52525b',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  moreItems: {
    fontSize: 11,
    color: '#a1a1aa',
    marginTop: 4,
  },
  chipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 12,
  },
  chip: {
    backgroundColor: '#f4f4f5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  chipText: {
    fontSize: 10,
    fontWeight: '500',
    color: '#52525b',
  },
});
