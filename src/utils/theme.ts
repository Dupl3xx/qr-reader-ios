export interface ColorScheme {
  background: string;
  card: string;
  cardSecondary: string;
  text: string;
  textSecondary: string;
  textTertiary: string;
  border: string;
  separator: string;
  accent: string;
  accentGreen: string;
  accentRed: string;
  accentOrange: string;
  accentPurple: string;
  accentTeal: string;
  tabBar: string;
  tabBarBorder: string;
  scannerOverlay: string;
  scannerBorder: string;
  statusBar: string;
}

export const Colors: { light: ColorScheme; dark: ColorScheme } = {
  light: {
    background: '#F2F2F7',
    card: '#FFFFFF',
    cardSecondary: '#F2F2F7',
    text: '#000000',
    textSecondary: '#8E8E93',
    textTertiary: '#C7C7CC',
    border: '#C6C6C8',
    separator: '#E5E5EA',
    accent: '#007AFF',
    accentGreen: '#34C759',
    accentRed: '#FF3B30',
    accentOrange: '#FF9500',
    accentPurple: '#AF52DE',
    accentTeal: '#32ADE6',
    tabBar: '#F9F9F9',
    tabBarBorder: '#C6C6C8',
    scannerOverlay: 'rgba(0,0,0,0.5)',
    scannerBorder: '#FFFFFF',
    statusBar: 'dark',
  },
  dark: {
    background: '#000000',
    card: '#1C1C1E',
    cardSecondary: '#2C2C2E',
    text: '#FFFFFF',
    textSecondary: '#8E8E93',
    textTertiary: '#48484A',
    border: '#38383A',
    separator: '#38383A',
    accent: '#0A84FF',
    accentGreen: '#30D158',
    accentRed: '#FF453A',
    accentOrange: '#FF9F0A',
    accentPurple: '#BF5AF2',
    accentTeal: '#40C8E0',
    tabBar: '#1C1C1E',
    tabBarBorder: '#38383A',
    scannerOverlay: 'rgba(0,0,0,0.6)',
    scannerBorder: '#FFFFFF',
    statusBar: 'light',
  },
};

export function resolveScheme(scheme: string | null | undefined): 'light' | 'dark' {
  return scheme === 'dark' ? 'dark' : 'light';
}

export function getTypeColor(type: string, colors: ColorScheme): string {
  switch (type) {
    case 'url': return colors.accent;
    case 'email': return colors.accentOrange;
    case 'phone': return colors.accentGreen;
    case 'sms': return colors.accentGreen;
    case 'wifi': return colors.accentTeal;
    case 'vcard': return colors.accentPurple;
    case 'geo': return colors.accentRed;
    case 'calendar': return colors.accentOrange;
    case 'barcode': return '#FF6B35';
    default: return colors.textSecondary;
  }
}

export function getTypeIcon(type: string): string {
  switch (type) {
    case 'url': return 'globe-outline';
    case 'email': return 'mail-outline';
    case 'phone': return 'call-outline';
    case 'sms': return 'chatbubble-outline';
    case 'wifi': return 'wifi-outline';
    case 'vcard': return 'person-outline';
    case 'geo': return 'location-outline';
    case 'calendar': return 'calendar-outline';
    case 'barcode': return 'barcode-outline';
    default: return 'document-text-outline';
  }
}
