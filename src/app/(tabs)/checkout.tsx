import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, SafeAreaView, Platform, Switch } from 'react-native';
import { ArrowLeft, Check, Store, ShoppingBag, Snowflake, Banknote, Smartphone } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { usePos, inr, type OrderType, type PaymentMode, type AcMode, type Order } from '../../lib/pos-store';
import { BillDialog } from '../../components/BillDialog';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function CheckoutScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { cart, menu, settings, addOrder, clearCart } = usePos();

  const lines = useMemo(
    () =>
      Object.entries(cart)
        .map(([code, qty]) => {
          const m = menu.find((i) => i.code === code);
          return m ? { code: m.code, name: m.name, price: m.price, qty } : null;
        })
        .filter((x): x is NonNullable<typeof x> => !!x),
    [cart, menu]
  );

  const [orderType, setOrderType] = useState<OrderType>('Dine-In');
  const [acMode, setAcMode] = useState<AcMode>('Non-AC');
  const [payment, setPayment] = useState<PaymentMode | null>(null);
  const [bill, setBill] = useState<Order | null>(null);

  const subtotal = lines.reduce((s, l) => s + l.price * l.qty, 0);
  const gstAmount = settings.gstEnabled ? Math.round(subtotal * (settings.gstPct / 100)) : 0;
  const acCharge =
    settings.acEnabled && orderType === 'Dine-In' && acMode === 'AC' ? settings.acCharge : 0;
  const total = subtotal + gstAmount + acCharge;

  const showAc = settings.acEnabled && orderType === 'Dine-In';

  if (lines.length === 0 && !bill) {
    return (
      <SafeAreaView style={styles.emptyContainer}>
        <Text style={styles.emptyText}>Your cart is empty.</Text>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>Back to billing</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  function generateBill() {
    if (!payment) return;
    const now = new Date();
    const order: Order = {
      billNo: `INV${String(Date.now()).slice(-8)}`,
      date: now.toISOString(),
      items: lines,
      subtotal,
      gstPct: settings.gstEnabled ? settings.gstPct : 0,
      gstAmount,
      acCharge,
      total,
      paymentMode: payment,
      orderType,
      acMode: orderType === 'Dine-In' && settings.acEnabled ? acMode : undefined,
    };
    addOrder(order);
    setBill(order);
    clearCart();
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={[styles.header, { marginTop: Platform.OS === 'android' ? 10 : 0 }]}>
        <TouchableOpacity style={styles.headerBtn} onPress={() => router.back()}>
          <ArrowLeft size={20} color="#3f3f46" />
        </TouchableOpacity>
        <View style={styles.headerTextContainer}>
          <Text style={styles.headerTitle}>Checkout</Text>
          <Text style={styles.headerSubtitle}>
            {lines.length} items · {inr(subtotal)}
          </Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Section title="ORDER TYPE">
          <View style={styles.grid}>
            <ChoiceCard
              active={orderType === 'Dine-In'}
              onClick={() => setOrderType('Dine-In')}
              icon={<Store size={24} color={orderType === 'Dine-In' ? '#0fa05c' : '#52525b'} />}
              label="Dine-In"
            />
            <ChoiceCard
              active={orderType === 'Take Away'}
              onClick={() => setOrderType('Take Away')}
              icon={<ShoppingBag size={24} color={orderType === 'Take Away' ? '#0fa05c' : '#52525b'} />}
              label="Take Away"
            />
          </View>
        </Section>

        {showAc && (
          <Section title="SEATING">
            <View style={styles.grid}>
              <ChoiceCard
                active={acMode === 'AC'}
                onClick={() => setAcMode('AC')}
                icon={<Snowflake size={24} color={acMode === 'AC' ? '#0fa05c' : '#52525b'} />}
                label="AC"
                hint={`+${inr(settings.acCharge)}`}
              />
              <ChoiceCard
                active={acMode === 'Non-AC'}
                onClick={() => setAcMode('Non-AC')}
                icon={<Store size={24} color={acMode === 'Non-AC' ? '#0fa05c' : '#52525b'} />}
                label="Non-AC"
              />
            </View>
          </Section>
        )}

        <Section title="BILL SUMMARY">
          <View style={styles.summaryCard}>
            <SummaryRow label="Subtotal" value={inr(subtotal)} />
            {settings.gstEnabled && (
              <SummaryRow label={`GST (${settings.gstPct}%)`} value={inr(gstAmount)} />
            )}
            {acCharge > 0 && <SummaryRow label="AC Charges" value={inr(acCharge)} />}
            
            <View style={styles.summaryDivider} />
            
            <View style={styles.summaryTotalRow}>
              <Text style={styles.summaryTotalLabel}>Grand Total</Text>
              <Text style={styles.summaryTotalValue}>{inr(total)}</Text>
            </View>
          </View>
        </Section>

        <Section title="PAYMENT MODE">
          <View style={styles.grid}>
            <ChoiceCard
              active={payment === 'Cash'}
              onClick={() => setPayment('Cash')}
              icon={<Banknote size={24} color={payment === 'Cash' ? '#0fa05c' : '#52525b'} />}
              label="Cash"
            />
            <ChoiceCard
              active={payment === 'UPI'}
              onClick={() => setPayment('UPI')}
              icon={<Smartphone size={24} color={payment === 'UPI' ? '#0fa05c' : '#52525b'} />}
              label="UPI"
            />
          </View>
        </Section>
      </ScrollView>

      <View style={[styles.bottomBar, { bottom: 0 }]}>
        <TouchableOpacity
          disabled={!payment}
          onPress={generateBill}
          style={[styles.generateBtn, !payment && styles.generateBtnDisabled]}>
          <Check size={20} color={payment ? '#fff' : '#a1a1aa'} />
          <Text style={[styles.generateBtnText, !payment && styles.generateBtnTextDisabled]}>
            {payment ? `Generate Bill · ${inr(total)}` : 'Select payment mode'}
          </Text>
        </TouchableOpacity>
      </View>

      {bill && (
        <BillDialog
          order={bill}
          onClose={() => {
            setBill(null);
            router.back();
          }}
        />
      )}
    </SafeAreaView>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

function ChoiceCard({
  active,
  onClick,
  icon,
  label,
  hint,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  hint?: string;
}) {
  return (
    <TouchableOpacity
      onPress={onClick}
      style={[styles.choiceCard, active && styles.choiceCardActive]}>
      {icon}
      <Text style={[styles.choiceCardLabel, active && styles.choiceCardLabelActive]}>
        {label}
      </Text>
      {hint && <Text style={styles.choiceCardHint}>{hint}</Text>}
    </TouchableOpacity>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.summaryRow}>
      <Text style={styles.summaryLabel}>{label}</Text>
      <Text style={styles.summaryValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f4f4f5',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f4f4f5',
  },
  emptyText: {
    fontSize: 16,
    color: '#71717a',
    marginBottom: 16,
  },
  backButton: {
    backgroundColor: '#0fa05c',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
  },
  backButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 15,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e4e4e7',
  },
  headerBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f4f4f5',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  headerTextContainer: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#09090b',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#71717a',
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 120,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#71717a',
    letterSpacing: 0.5,
    marginBottom: 10,
  },
  grid: {
    flexDirection: 'row',
    gap: 12,
  },
  choiceCard: {
    flex: 1,
    height: 100,
    backgroundColor: '#fff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e4e4e7',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  choiceCardActive: {
    borderColor: '#0fa05c',
    borderWidth: 2,
    backgroundColor: '#fff',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  choiceCardLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#3f3f46',
    marginTop: 8,
  },
  choiceCardLabelActive: {
    color: '#0fa05c',
    fontWeight: '600',
  },
  choiceCardHint: {
    fontSize: 11,
    color: '#71717a',
    marginTop: 2,
  },
  summaryCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e4e4e7',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#71717a',
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#09090b',
  },
  summaryDivider: {
    height: 1,
    backgroundColor: '#e4e4e7',
    marginVertical: 12,
  },
  summaryTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summaryTotalLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#09090b',
  },
  summaryTotalValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#09090b',
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: 'transparent',
  },
  generateBtn: {
    height: 56,
    backgroundColor: '#0fa05c',
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: '#0fa05c',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  generateBtnDisabled: {
    backgroundColor: '#e4e4e7',
  },
  generateBtnText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  generateBtnTextDisabled: {
    color: '#a1a1aa',
  },
});
