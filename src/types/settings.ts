export type Currency = 'USD' | 'INR';

export interface BusinessSettings {
  businessName: string;
  email: string;
  contact: string;
  address: string;
  bankName: string;
  accountNumber: string;
  ifscCode: string;
  paymentInstructions: string;
  paymentLabel: string;
  termsTitle: string;
  terms: string;
  currency: Currency;
  logo: string; // base64 data URL
  qrCode: string; // base64 data URL for payment QR code
  website: string;
}

export const DEFAULT_SETTINGS: BusinessSettings = {
  businessName: '',
  email: '',
  contact: '',
  address: '',
  bankName: '',
  accountNumber: '',
  ifscCode: '',
  paymentInstructions: '',
  paymentLabel: 'Pay Online',
  termsTitle: 'TERMS AND CONDITIONS',
  terms: '',
  currency: 'USD',
  logo: '',
  qrCode: '',
  website: '',
};

const STORAGE_KEY = 'businessSettings';

export function loadSettings(): BusinessSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch {}
  return { ...DEFAULT_SETTINGS };
}

export function saveSettings(settings: BusinessSettings): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
}
