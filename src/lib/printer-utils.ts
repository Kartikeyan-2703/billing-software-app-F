import { Platform, PermissionsAndroid } from 'react-native';
import { BluetoothManager, BluetoothEscposPrinter } from '@mateusdegobi/react-native-bluetooth-escpos-printer';
import { type Order, type Settings } from './pos-store';

export async function requestBluetoothPermissions() {
  if (Platform.OS === 'android') {
    if (Platform.Version >= 31) { // Android 12+
      const result = await PermissionsAndroid.requestMultiple([
        PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
        PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION, // Some devices still strictly require this
      ]);
      return (
        result['android.permission.BLUETOOTH_CONNECT'] === PermissionsAndroid.RESULTS.GRANTED &&
        result['android.permission.BLUETOOTH_SCAN'] === PermissionsAndroid.RESULTS.GRANTED
      );
    } else {
      const result = await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION);
      return result === PermissionsAndroid.RESULTS.GRANTED;
    }
  }
  return true;
}

export async function enableBluetooth() {
  const isEnabled = await BluetoothManager.isBluetoothEnabled();
  if (!isEnabled) {
    await BluetoothManager.enableBluetooth();
  }
}

export async function scanDevices() {
  const permission = await requestBluetoothPermissions();
  if (!permission) throw new Error("Bluetooth permissions not granted");
  
  await enableBluetooth();
  
  return new Promise<any[]>((resolve, reject) => {
    BluetoothManager.scanDevices().then((devices: any) => {
      // devices usually comes as a JSON string
      try {
        const parsed = typeof devices === 'string' ? JSON.parse(devices) : devices;
        // Map native device object to standard format
        const paired = (parsed.paired || []).map((d: any) => ({ name: d.name, address: d.address, paired: true }));
        const found = (parsed.found || []).map((d: any) => ({ name: d.name, address: d.address, paired: false }));
        resolve([...paired, ...found]);
      } catch (e) {
        resolve([]);
      }
    }).catch(reject);
  });
}

export async function connectPrinter(address: string) {
  await BluetoothManager.connect(address);
}

// Splits a long string into multiple lines, preserving whole words
function splitTextIntoLines(text: string, maxLen: number = 32): string[] {
  if (!text) return [];
  const words = text.split(' ');
  const lines: string[] = [];
  let currentLine = '';

  for (const word of words) {
    if ((currentLine + word).length > maxLen) {
      if (currentLine.trim()) lines.push(currentLine.trim());
      currentLine = word + ' ';
    } else {
      currentLine += word + ' ';
    }
  }
  if (currentLine.trim()) lines.push(currentLine.trim());
  return lines;
}

export const printReceipt = async (order: Order, settings: Settings) => {
  try {
    // Basic settings for standard 58mm/80mm thermal printers
    await BluetoothEscposPrinter.printerInit();
    await BluetoothEscposPrinter.printerAlign(BluetoothEscposPrinter.ALIGN.CENTER);
    
    // Header
    await BluetoothEscposPrinter.printText(`${settings.restaurantName}\n\r`, {
      encoding: 'GBK',
      codepage: 0,
      widthtimes: 1,
      heigthtimes: 1,
      fonttype: 1
    });

    const addressLines = splitTextIntoLines(settings.address, 32);
    for (const line of addressLines) {
      await BluetoothEscposPrinter.printText(`${line}\n\r`, {});
    }
    
    await BluetoothEscposPrinter.printText(`Ph: ${settings.phone}\n\r`, {});
    
    if (settings.gstEnabled && settings.gstNumber) {
      await BluetoothEscposPrinter.printText(`GSTIN: ${settings.gstNumber}\n\r`, {});
    }
    
    await BluetoothEscposPrinter.printText(`--------------------------------\n\r`, {});
    
    // Order info
    await BluetoothEscposPrinter.printerAlign(BluetoothEscposPrinter.ALIGN.LEFT);
    await BluetoothEscposPrinter.printText(`Bill No: ${order.billNo}\n\r`, {});
    const formattedDate = new Date(order.date).toLocaleString('en-IN').replace(/[\u202f\u00a0]/g, ' ');
    await BluetoothEscposPrinter.printText(`Date: ${formattedDate}\n\r`, {});
    const orderMode = `${order.orderType} ${order.acMode ? '(' + order.acMode + ')' : ''}`;
    await BluetoothEscposPrinter.printText(`Type: ${orderMode}\n\r`, {});
    await BluetoothEscposPrinter.printText(`Payment: ${order.paymentMode}\n\r`, {});
    
    await BluetoothEscposPrinter.printText(`--------------------------------\n\r`, {});
    
    // Items
    // Column widths for 3 columns (e.g. 16, 6, 10 for 32 chars in 58mm printer)
    await BluetoothEscposPrinter.printColumn(
      [16, 6, 10],
      [BluetoothEscposPrinter.ALIGN.LEFT, BluetoothEscposPrinter.ALIGN.CENTER, BluetoothEscposPrinter.ALIGN.RIGHT],
      ['Item', 'Qty', 'Amount'],
      {}
    );
    await BluetoothEscposPrinter.printText(`--------------------------------\n\r`, {});

    for (const item of order.items) {
      const amount = (item.price * item.qty).toString();
      const qtyStr = item.qty.toString();

      if (item.name.length <= 16) {
        await BluetoothEscposPrinter.printColumn(
          [16, 6, 10],
          [BluetoothEscposPrinter.ALIGN.LEFT, BluetoothEscposPrinter.ALIGN.CENTER, BluetoothEscposPrinter.ALIGN.RIGHT],
          [item.name, qtyStr, amount],
          {}
        );
      } else {
        // Split by words, but ensure no string exceeds 16 chars
        const words = item.name.split(' ');
        const lines = [];
        let current = '';
        for (const word of words) {
          // If the word itself is > 16 chars, hard truncate or slice it
          let w = word;
          if (w.length > 16) w = w.substring(0, 16);
          if ((current + w).length > 16) {
            if (current.trim()) lines.push(current.trim());
            current = w + ' ';
          } else {
            current += w + ' ';
          }
        }
        if (current.trim()) lines.push(current.trim());

        await BluetoothEscposPrinter.printColumn(
          [16, 6, 10],
          [BluetoothEscposPrinter.ALIGN.LEFT, BluetoothEscposPrinter.ALIGN.CENTER, BluetoothEscposPrinter.ALIGN.RIGHT],
          [lines[0], qtyStr, amount],
          {}
        );

        for (let i = 1; i < lines.length; i++) {
          await BluetoothEscposPrinter.printColumn(
            [16, 6, 10],
            [BluetoothEscposPrinter.ALIGN.LEFT, BluetoothEscposPrinter.ALIGN.CENTER, BluetoothEscposPrinter.ALIGN.RIGHT],
            [lines[i], '', ''],
            {}
          );
        }
      }
    }
    
    await BluetoothEscposPrinter.printText(`--------------------------------\n\r`, {});
    
    // Totals
    await BluetoothEscposPrinter.printColumn(
      [16, 16],
      [BluetoothEscposPrinter.ALIGN.LEFT, BluetoothEscposPrinter.ALIGN.RIGHT],
      ['Subtotal', order.subtotal.toString()],
      {}
    );

    if (order.gstAmount > 0) {
      await BluetoothEscposPrinter.printColumn(
        [16, 16],
        [BluetoothEscposPrinter.ALIGN.LEFT, BluetoothEscposPrinter.ALIGN.RIGHT],
        [`GST (${order.gstPct}%)`, order.gstAmount.toString()],
        {}
      );
    }

    if (order.acCharge > 0) {
      await BluetoothEscposPrinter.printColumn(
        [16, 16],
        [BluetoothEscposPrinter.ALIGN.LEFT, BluetoothEscposPrinter.ALIGN.RIGHT],
        ['AC Charges', order.acCharge.toString()],
        {}
      );
    }
    
    await BluetoothEscposPrinter.printText(`--------------------------------\n\r`, {});
    await BluetoothEscposPrinter.printColumn(
      [16, 16],
      [BluetoothEscposPrinter.ALIGN.LEFT, BluetoothEscposPrinter.ALIGN.RIGHT],
      ['TOTAL', order.total.toString()],
      {}
    );
    await BluetoothEscposPrinter.printText(`--------------------------------\n\r`, {});
    
    // Footer
    await BluetoothEscposPrinter.printerAlign(BluetoothEscposPrinter.ALIGN.CENTER);
    await BluetoothEscposPrinter.printText(`\n\r${settings.footer}\n\r`, {});
    await BluetoothEscposPrinter.printText(`Powered by NeuralWeb Labs\n\r`, {});
    await BluetoothEscposPrinter.printText(` \n\r \n\r \n\r \n\r`, {});
    
  } catch (e: any) {
    throw new Error(e.message || "Failed to print");
  }
}
