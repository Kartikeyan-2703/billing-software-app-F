import React, { useState } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, ScrollView, Platform, ActivityIndicator } from 'react-native';
import { X, Bluetooth, Check, RefreshCw } from 'lucide-react-native';
import { usePos } from '../lib/pos-store';
import { scanDevices } from '../lib/printer-utils';

export function PrinterModal({ onClose }: { onClose: () => void }) {
  const { connectedPrinterAddress, connectedPrinterName, connectToPrinter, disconnectPrinter, isConnectingPrinter } = usePos();
  const [devices, setDevices] = useState<any[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const scanForPrinters = async () => {
    try {
      setIsScanning(true);
      setErrorMsg('');
      const found = await scanDevices();
      setDevices(found);
    } catch (e: any) {
      setErrorMsg(e.message || "Failed to scan Bluetooth");
    } finally {
      setIsScanning(false);
    }
  };

  const handleConnect = async (address: string, name: string | null) => {
    try {
      setErrorMsg('');
      await connectToPrinter(address, name);
    } catch (e: any) {
      setErrorMsg(e.message || "Failed to connect");
    }
  };

  return (
    <Modal visible transparent animationType="fade" onRequestClose={onClose}>
      <View style={[styles.overlay, Platform.OS === 'web' && { backdropFilter: 'blur(4px)' } as any]}>
        <View style={styles.modalContent}>
          <View style={styles.header}>
            <Text style={styles.title}>Bluetooth Printer</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <X size={20} color="#71717a" />
            </TouchableOpacity>
          </View>
          
          <View style={styles.statusSection}>
            <Text style={styles.sectionTitle}>STATUS</Text>
            <View style={styles.statusBox}>
              <View style={styles.statusRow}>
                <View style={[styles.statusDot, { backgroundColor: connectedPrinterAddress ? '#0fa05c' : '#ef4444' }]} />
                <Text style={styles.statusText} numberOfLines={1}>
                  {connectedPrinterAddress ? `Connected to ${connectedPrinterName || connectedPrinterAddress}` : 'Disconnected'}
                </Text>
              </View>
              {connectedPrinterAddress && (
                <TouchableOpacity onPress={disconnectPrinter} style={styles.disconnectBtn}>
                  <Text style={styles.disconnectBtnText}>Disconnect</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>

          <View style={styles.scanSection}>
            <View style={styles.scanHeader}>
              <Text style={styles.sectionTitle}>AVAILABLE DEVICES</Text>
              <TouchableOpacity onPress={scanForPrinters} disabled={isScanning} style={styles.scanBtn}>
                {isScanning ? <ActivityIndicator size="small" color="#0fa05c" /> : <RefreshCw size={14} color="#0fa05c" />}
                <Text style={styles.scanBtnText}>{isScanning ? 'Scanning...' : 'Scan'}</Text>
              </TouchableOpacity>
            </View>
            
            {errorMsg ? <Text style={styles.errorText}>{errorMsg}</Text> : null}
            
            {devices.length === 0 && !isScanning && !errorMsg ? (
              <Text style={styles.emptyText}>No devices found. Tap Scan to search.</Text>
            ) : (
              <ScrollView style={styles.deviceList} showsVerticalScrollIndicator={false}>
                {devices.map((d, idx) => (
                  <TouchableOpacity 
                    key={idx} 
                    style={[styles.deviceCard, connectedPrinterAddress === d.address && styles.deviceCardActive]}
                    onPress={() => handleConnect(d.address, d.name)}
                    disabled={isConnectingPrinter}
                  >
                    {isConnectingPrinter && connectedPrinterAddress === null ? (
                      <ActivityIndicator size="small" color="#0fa05c" style={{ marginRight: 12 }} />
                    ) : (
                      <Bluetooth size={16} color={connectedPrinterAddress === d.address ? "#0fa05c" : "#52525b"} />
                    )}
                    <View style={styles.deviceInfo}>
                      <Text style={styles.deviceName} numberOfLines={1}>{d.name || 'Unknown Device'}</Text>
                      <Text style={styles.deviceAddress}>{d.address}</Text>
                    </View>
                    {connectedPrinterAddress === d.address && <Check size={16} color="#0fa05c" />}
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    width: '100%',
    maxWidth: 400,
    maxHeight: '80%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 10,
    padding: 24,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#09090b',
  },
  closeBtn: {
    padding: 8,
    marginRight: -8,
    borderRadius: 20,
    backgroundColor: '#f4f4f5',
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '600',
    color: '#71717a',
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  statusSection: {
    marginBottom: 24,
  },
  statusBox: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f4f4f5',
    padding: 16,
    borderRadius: 16,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 8,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  statusText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
    color: '#18181b',
  },
  disconnectBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: '#e4e4e7',
    borderRadius: 8,
  },
  disconnectBtnText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#09090b',
  },
  scanSection: {
    flexShrink: 1,
  },
  scanHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  scanBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: '#e1f7e7',
    borderRadius: 20,
  },
  scanBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#0fa05c',
  },
  errorText: {
    color: '#ef4444',
    fontSize: 12,
    marginBottom: 12,
  },
  emptyText: {
    color: '#71717a',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 20,
  },
  deviceList: {
    maxHeight: 300,
  },
  deviceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e4e4e7',
    borderRadius: 12,
    marginBottom: 8,
  },
  deviceCardActive: {
    borderColor: '#0fa05c',
    backgroundColor: '#f0fdf4',
  },
  deviceInfo: {
    flex: 1,
    marginLeft: 12,
  },
  deviceName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#09090b',
  },
  deviceAddress: {
    fontSize: 11,
    color: '#71717a',
    marginTop: 2,
  },
});
