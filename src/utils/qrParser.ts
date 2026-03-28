export type QRType =
  | 'url'
  | 'email'
  | 'phone'
  | 'sms'
  | 'wifi'
  | 'vcard'
  | 'geo'
  | 'calendar'
  | 'barcode'
  | 'text';

const LINEAR_BARCODE_TYPES = new Set([
  'ean13', 'ean8', 'upc_a', 'upc_e',
  'code128', 'code39', 'code93', 'codabar', 'itf14',
]);

export interface ParsedQR {
  type: QRType;
  raw: string;
  display: string;
  action?: string;
  metadata?: Record<string, string>;
}

export function parseQR(data: string, barcodeType?: string): ParsedQR {
  const raw = data.trim();

  // Linear barcode (EAN, UPC, Code128, etc.)
  if (barcodeType && LINEAR_BARCODE_TYPES.has(barcodeType)) {
    const format = barcodeType.toUpperCase().replace('_', '-');
    return {
      type: 'barcode',
      raw,
      display: raw,
      metadata: { format },
    };
  }

  // URL
  if (/^https?:\/\//i.test(raw) || /^www\./i.test(raw)) {
    return {
      type: 'url',
      raw,
      display: raw,
      action: raw.startsWith('http') ? raw : `https://${raw}`,
    };
  }

  // Email
  if (/^mailto:/i.test(raw)) {
    const email = raw.replace(/^mailto:/i, '').split('?')[0];
    return { type: 'email', raw, display: email, action: raw };
  }
  if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(raw)) {
    return { type: 'email', raw, display: raw, action: `mailto:${raw}` };
  }

  // Phone
  if (/^tel:/i.test(raw)) {
    const phone = raw.replace(/^tel:/i, '');
    return { type: 'phone', raw, display: phone, action: raw };
  }
  if (/^[+\d][\d\s\-().]{6,}$/.test(raw)) {
    return { type: 'phone', raw, display: raw, action: `tel:${raw.replace(/\s/g, '')}` };
  }

  // SMS
  if (/^smsto?:/i.test(raw)) {
    const parts = raw.replace(/^smsto?:/i, '').split(':');
    const phone = parts[0];
    const body = parts[1] || '';
    return {
      type: 'sms',
      raw,
      display: `${phone}${body ? `: ${body}` : ''}`,
      action: raw,
      metadata: { phone, body },
    };
  }

  // Wi-Fi
  if (/^WIFI:/i.test(raw)) {
    const meta: Record<string, string> = {};
    const wifiStr = raw.replace(/^WIFI:/i, '');
    const pairs = wifiStr.split(';');
    for (const pair of pairs) {
      const idx = pair.indexOf(':');
      if (idx !== -1) {
        const key = pair.substring(0, idx).toUpperCase();
        const val = pair.substring(idx + 1).replace(/\\;/g, ';');
        if (key && val) meta[key] = val;
      }
    }
    const ssid = meta['S'] || '';
    const password = meta['P'] || '';
    const security = meta['T'] || 'WPA';
    return {
      type: 'wifi',
      raw,
      display: ssid,
      metadata: { ssid, password, security },
    };
  }

  // vCard
  if (/^BEGIN:VCARD/i.test(raw)) {
    const lines = raw.split(/\r?\n/);
    const meta: Record<string, string> = {};
    for (const line of lines) {
      if (/^FN:/i.test(line)) meta.name = line.replace(/^FN:/i, '');
      if (/^TEL/i.test(line)) meta.phone = line.split(':')[1] || '';
      if (/^EMAIL/i.test(line)) meta.email = line.split(':')[1] || '';
    }
    return {
      type: 'vcard',
      raw,
      display: meta.name || 'Contact',
      metadata: meta,
    };
  }

  // Geo
  if (/^geo:/i.test(raw)) {
    const coords = raw.replace(/^geo:/i, '').split(',');
    const lat = coords[0] || '';
    const lon = coords[1]?.split(';')[0] || '';
    return {
      type: 'geo',
      raw,
      display: `${lat}, ${lon}`,
      action: `maps:?q=${lat},${lon}`,
      metadata: { lat, lon },
    };
  }

  // Calendar
  if (/^BEGIN:VCALENDAR/i.test(raw) || /^BEGIN:VEVENT/i.test(raw)) {
    const lines = raw.split(/\r?\n/);
    const meta: Record<string, string> = {};
    for (const line of lines) {
      if (/^SUMMARY:/i.test(line)) meta.summary = line.replace(/^SUMMARY:/i, '');
      if (/^DTSTART:/i.test(line)) meta.start = line.replace(/^DTSTART[^:]*:/i, '');
      if (/^DTEND:/i.test(line)) meta.end = line.replace(/^DTEND[^:]*:/i, '');
    }
    return {
      type: 'calendar',
      raw,
      display: meta.summary || 'Event',
      metadata: meta,
    };
  }

  // Plain text
  return { type: 'text', raw, display: raw };
}
