import React, { useState } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, ScrollView, Platform, ActivityIndicator } from 'react-native';
import { X, Printer, Bluetooth, Check } from 'lucide-react-native';
import { Order, usePos, inr } from '../lib/pos-store';
import { scanDevices, connectPrinter, printReceipt } from '../lib/printer-utils';

export function BillDialog({ order, onClose, autoPrint = false }: { order: Order; onClose: () => void, autoPrint?: boolean }) {
  const { settings, connectedPrinterAddress } = usePos();
  const [isPrinting, setIsPrinting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  React.useEffect(() => {
    if (autoPrint) {
      printThermal();
    }
  }, [autoPrint]);
  const printThermal = async () => {
    if (isPrinting) return;
    try {
      setIsPrinting(true);
      setErrorMsg('');
      if (!connectedPrinterAddress) {
        setErrorMsg("No printer connected! Please connect a printer from the main screen.");
        return;
      }
      await printReceipt(order, settings);
    } catch (e: any) {
      setErrorMsg(e.message || "Failed to print receipt");
    } finally {
      setIsPrinting(false);
    }
  };



  return (
    <Modal visible transparent animationType="fade" onRequestClose={onClose}>
      <View style={[styles.overlay, Platform.OS === 'web' && { backdropFilter: 'blur(4px)' } as any]}>
        <View style={styles.dialog}>
          <View style={styles.header}>
            <View style={styles.paidBadge}>
              <Text style={styles.paidBadgeText}>PAID · {order.paymentMode}</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <X size={16} color="#52525b" />
            </TouchableOpacity>
          </View>

          <View style={styles.restaurantInfo}>
            <Text style={styles.rName}>{settings.restaurantName}</Text>
            <Text style={styles.rAddress}>{settings.address}</Text>
            <Text style={styles.rContact}>
              {settings.phone}{settings.gstEnabled ? ` · GSTIN ${settings.gstNumber}` : ''}
            </Text>
          </View>

          <View style={styles.billMeta}>
            <Text style={styles.metaText}>Bill #{order.billNo}</Text>
            <Text style={styles.metaText}>
              {new Date(order.date).toLocaleDateString('en-IN')} · {new Date(order.date).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
            </Text>
          </View>

          <ScrollView style={styles.itemsList} showsVerticalScrollIndicator={false}>
            {order.items.map((l) => (
              <View key={l.code} style={styles.itemRow}>
                <View style={styles.itemLeft}>
                  <Text style={styles.itemName} numberOfLines={1}>{l.name}</Text>
                  <Text style={styles.itemSub}>
                    {l.code} · {inr(l.price)} × {l.qty}
                  </Text>
                </View>
                <Text style={styles.itemTotal}>{inr(l.price * l.qty)}</Text>
              </View>
            ))}
          </ScrollView>

          <View style={styles.totalsContainer}>
            <Row label="Subtotal" value={inr(order.subtotal)} />
            {order.gstPct > 0 && <Row label={`GST (${order.gstPct}%)`} value={inr(order.gstAmount)} />}
            {order.acCharge > 0 && <Row label="AC Charges" value={inr(order.acCharge)} />}
            
            <View style={styles.grandTotalRow}>
              <Text style={styles.grandTotalLabel}>Grand Total</Text>
              <Text style={styles.grandTotalValue}>{inr(order.total)}</Text>
            </View>
          </View>

          <View style={styles.footerMeta}>
            <Text style={styles.footerMetaText}>
              {order.orderType}
              {order.acMode ? ` · ${order.acMode}` : ''}
            </Text>
            <Text style={styles.footerMetaText}>Paid via {order.paymentMode}</Text>
          </View>
          {errorMsg ? (
            <View style={{ marginBottom: 16 }}>
              <Text style={styles.errorText}>{errorMsg}</Text>
            </View>
          ) : null}

          <View style={styles.actions}>
            <TouchableOpacity style={styles.printBtn} onPress={printThermal} disabled={isPrinting}>
              {isPrinting ? <ActivityIndicator size="small" color="#09090b" /> : <Printer size={16} color="#09090b" />}
              <Text style={styles.printBtnText}>Receipt</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.doneBtn} onPress={onClose}>
              <Text style={styles.doneBtnText}>Done</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  dialog: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
    width: '100%',
    maxWidth: 448,
    maxHeight: '95%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 25 },
    shadowOpacity: 0.15,
    shadowRadius: 50,
    elevation: 24,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  paidBadge: {
    backgroundColor: '#e1f7e7',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  paidBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#0fa05c',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f4f4f5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  restaurantInfo: {
    alignItems: 'center',
    marginBottom: 16,
  },
  rName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#09090b',
  },
  rAddress: {
    fontSize: 11,
    color: '#71717a',
    marginTop: 2,
  },
  rContact: {
    fontSize: 11,
    color: '#71717a',
  },
  billMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#e4e4e7',
    borderStyle: 'dashed',
    marginBottom: 8,
  },
  metaText: {
    fontSize: 11,
    color: '#52525b',
  },
  itemsList: {
    maxHeight: 150,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
  },
  itemLeft: {
    flex: 1,
    marginRight: 12,
  },
  itemName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#18181b',
  },
  itemSub: {
    fontSize: 11,
    color: '#71717a',
    marginTop: 2,
  },
  itemTotal: {
    fontSize: 14,
    fontWeight: '500',
    color: '#18181b',
  },
  totalsContainer: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderColor: '#e4e4e7',
    borderStyle: 'dashed',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  rowLabel: {
    fontSize: 14,
    color: '#71717a',
  },
  rowValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#09090b',
  },
  grandTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderColor: '#e4e4e7',
  },
  grandTotalLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#09090b',
  },
  grandTotalValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#09090b',
  },
  footerMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  footerMetaText: {
    fontSize: 11,
    color: '#71717a',
  },
  printerSection: {
    marginTop: 12,
    marginBottom: 16,
    padding: 12,
    backgroundColor: '#f4f4f5',
    borderRadius: 12,
  },
  printerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  printerTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#52525b',
  },
  scanText: {
    fontSize: 12,
    color: '#0fa05c',
    fontWeight: '500',
  },
  errorText: {
    fontSize: 11,
    color: '#ef4444',
    marginBottom: 8,
  },
  deviceList: {
    flexDirection: 'row',
  },
  deviceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#e4e4e7',
    gap: 6,
  },
  deviceCardActive: {
    borderColor: '#0fa05c',
    backgroundColor: '#f0fdf4',
  },
  deviceName: {
    fontSize: 12,
    color: '#18181b',
    maxWidth: 100,
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
  },
  printBtn: {
    flex: 1,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#f4f4f5',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  printBtnText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#09090b',
  },
  doneBtn: {
    flex: 1.5,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#09090b',
    alignItems: 'center',
    justifyContent: 'center',
  },
  doneBtnText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#fff',
  },
});
