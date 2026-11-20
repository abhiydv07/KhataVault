import QRCode from 'qrcode';

export interface UpiPaymentDetails {
  vpa: string;
  payeeName?: string;
  amount: number;
  transactionNote?: string;
}

/**
 * Standard NPCI UPI Intent URI builder
 */
export function buildUpiUri(details: UpiPaymentDetails): string {
  const cleanVpa = details.vpa.trim();
  const cleanName = (details.payeeName || 'KhataVault Merchant').trim();
  const params = new URLSearchParams();

  params.set('pa', cleanVpa);
  params.set('pn', cleanName);
  if (details.amount > 0) {
    params.set('am', details.amount.toFixed(2));
  }
  params.set('cu', 'INR');
  params.set('tn', details.transactionNote ? details.transactionNote.trim() : 'Hisaab Settlement');

  return `upi://pay?${params.toString()}`;
}

/**
 * Generate high-resolution base64 PNG data URL for UPI QR code
 */
export async function generateUpiQrDataUrl(
  details: UpiPaymentDetails,
  size: number = 320
): Promise<string> {
  const uri = buildUpiUri(details);
  return QRCode.toDataURL(uri, {
    width: size,
    margin: 1,
    color: {
      dark: '#0f172a', // slate-900
      light: '#ffffff',
    },
    errorCorrectionLevel: 'M',
  });
}

/**
 * Retrieve saved merchant UPI VPA from settings / localStorage
 */
export function getSavedMerchantUpi(): string {
  if (typeof window === 'undefined') return '';
  return (
    localStorage.getItem('khatavault_upi_id') ||
    localStorage.getItem('khatasetu_upi_id') ||
    ''
  );
}

/**
 * Save merchant UPI VPA
 */
export function saveMerchantUpi(vpa: string): void {
  if (typeof window === 'undefined') return;
  const clean = vpa.trim();
  if (clean) {
    localStorage.setItem('khatavault_upi_id', clean);
  } else {
    localStorage.removeItem('khatavault_upi_id');
  }
}
