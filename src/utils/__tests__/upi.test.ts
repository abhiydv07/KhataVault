import { describe, it, expect } from 'vitest';
import { buildUpiUri, generateUpiQrDataUrl } from '../upi';

describe('UPI Payment & QR Generator', () => {
  it('builds a valid NPCI UPI intent URI with amount and note', () => {
    const uri = buildUpiUri({
      vpa: 'merchant@icici',
      payeeName: 'Ramesh Store',
      amount: 4500,
      transactionNote: 'Settlement for Nov',
    });

    expect(uri).toContain('upi://pay?');
    expect(uri).toContain('pa=merchant%40icici');
    expect(uri).toContain('pn=Ramesh+Store');
    expect(uri).toContain('am=4500.00');
    expect(uri).toContain('cu=INR');
  });

  it('generates a base64 QR code data URL asynchronously', async () => {
    const dataUrl = await generateUpiQrDataUrl({
      vpa: 'trader@okhdfcbank',
      payeeName: 'Surat Cloth House',
      amount: 12500,
    });

    expect(dataUrl).toMatch(/^data:image\/png;base64,/);
  });
});
