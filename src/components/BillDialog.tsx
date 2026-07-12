import React from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, ScrollView, Platform } from 'react-native';
import { X, Printer } from 'lucide-react-native';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { Order, usePos, inr } from '../lib/pos-store';

export function BillDialog({ order, onClose }: { order: Order; onClose: () => void }) {
  const { settings } = usePos();

  const print = async () => {
    const html = `
      <html>
        <head>
          <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, minimum-scale=1.0, user-scalable=no" />
          <style>
            body { font-family: monospace; padding: 20px; font-size: 14px; max-width: 400px; margin: auto; }
            h1 { text-align: center; margin: 0; font-size: 20px; }
            .subtitle { text-align: center; font-size: 12px; margin-bottom: 20px; color: #555; }
            .info { font-size: 12px; margin-bottom: 10px; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
            th, td { text-align: left; padding: 4px 0; }
            .right { text-align: right; }
            .center { text-align: center; }
            .border-top { border-top: 1px dashed #000; }
            .border-bottom { border-bottom: 1px dashed #000; }
            .total { font-weight: bold; font-size: 16px; }
          </style>
        </head>
        <body>
          <h1>${settings.restaurantName}</h1>
          <div class="subtitle">
            ${settings.address}<br />
            Ph: ${settings.phone}<br />
            ${settings.gstEnabled ? 'GSTIN: ' + settings.gstNumber : ''}
          </div>
          
          <div class="info">
            Bill No: ${order.billNo}<br />
            Date: ${new Date(order.date).toLocaleString('en-IN')}<br />
            Type: ${order.orderType} ${order.acMode ? '(' + order.acMode + ')' : ''}<br />
            Payment: ${order.paymentMode}
          </div>

          <table>
            <tr class="border-top border-bottom">
              <th>Item</th>
              <th class="center">Qty</th>
              <th class="right">Amount</th>
            </tr>
            ${order.items.map(i => `
              <tr>
                <td>${i.name}</td>
                <td class="center">${i.qty}</td>
                <td class="right">${inr(i.price * i.qty)}</td>
              </tr>
            `).join('')}
          </table>

          <table style="margin-bottom: 0;">
            <tr>
              <td>Subtotal</td>
              <td class="right">${inr(order.subtotal)}</td>
            </tr>
            ${order.gstAmount > 0 ? `
              <tr>
                <td>GST (${order.gstPct}%)</td>
                <td class="right">${inr(order.gstAmount)}</td>
              </tr>
            ` : ''}
            ${order.acCharge > 0 ? `
              <tr>
                <td>AC Charges</td>
                <td class="right">${inr(order.acCharge)}</td>
              </tr>
            ` : ''}
            <tr class="border-top border-bottom">
              <td class="total" style="padding-top: 8px; padding-bottom: 8px;">TOTAL</td>
              <td class="right total" style="padding-top: 8px; padding-bottom: 8px;">${inr(order.total)}</td>
            </tr>
          </table>

          <div class="subtitle" style="margin-top: 30px;">
            ${settings.footer}
          </div>
        </body>
      </html>
    `;

    try {
      const { uri } = await Print.printToFileAsync({ html });
      if (Platform.OS === 'ios' || Platform.OS === 'android') {
        await Sharing.shareAsync(uri);
      }
    } catch (e) {
      console.error(e);
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
              {settings.phone} · GSTIN {settings.gstNumber}
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

          <Text style={styles.footerMessage}>{settings.footer}</Text>

          <View style={styles.actions}>
            <TouchableOpacity style={styles.printBtn} onPress={print}>
              <Printer size={16} color="#09090b" />
              <Text style={styles.printBtnText}>Print Bill</Text>
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
    maxHeight: '90%',
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
    maxHeight: 200,
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
  footerMessage: {
    textAlign: 'center',
    fontSize: 11,
    fontStyle: 'italic',
    color: '#71717a',
    marginTop: 16,
    marginBottom: 20,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
  },
  printBtn: {
    flex: 1,
    height: 48,
    borderRadius: 16,
    backgroundColor: '#f4f4f5',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  printBtnText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#09090b',
  },
  doneBtn: {
    flex: 1,
    height: 48,
    borderRadius: 16,
    backgroundColor: '#09090b',
    alignItems: 'center',
    justifyContent: 'center',
  },
  doneBtnText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#fff',
  },
});
