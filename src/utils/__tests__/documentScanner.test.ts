import { describe, it, expect } from 'vitest';
import { parseExcelOrCsv, fileToBase64 } from '../documentScanner';

describe('Document Scanner & Auto-Import Engine', () => {
  it('converts file to base64 successfully', async () => {
    const blob = new Blob(['Hello KhataVault'], { type: 'text/plain' });
    const file = new File([blob], 'test.txt', { type: 'text/plain' });

    const base64 = await fileToBase64(file);
    expect(typeof base64).toBe('string');
    expect(base64.length).toBeGreaterThan(0);
  });

  it('parses CSV with Name, Amount, and Type columns into Lena and Dena', async () => {
    const csvContent = `Party Name,Amount,Type
Ramesh Traders,4500,Credit
Pooja Garments,12000,Debit
Surat Office,50000,Lena
Shree Shyam,25000,Dena`;

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const file = new File([blob], 'ledger.csv', { type: 'text/csv' });

    const result = await parseExcelOrCsv(file);

    expect(result.sourceType).toBe('excel');
    expect(result.lena.length).toBe(2);
    expect(result.dena.length).toBe(2);

    expect(result.lena[0].friendName).toBe('Ramesh Traders');
    expect(result.lena[0].amount).toBe(4500);

    expect(result.dena[0].friendName).toBe('Pooja Garments');
    expect(result.dena[0].amount).toBe(12000);
  });

  it('parses CSV with separate Credit and Debit columns', async () => {
    const csvContent = `Particulars,Credit (Lena),Debit (Dena),Upline
Vikas Sharma,15000,,
Deepak Cloth House,,42000,500
Anil Kumar,8500,,`;

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const file = new File([blob], 'statement.csv', { type: 'text/csv' });

    const result = await parseExcelOrCsv(file);

    expect(result.lena.length).toBe(2);
    expect(result.dena.length).toBe(1);

    expect(result.lena[0].friendName).toBe('Vikas Sharma');
    expect(result.lena[0].amount).toBe(15000);

    expect(result.dena[0].friendName).toBe('Deepak Cloth House');
    expect(result.dena[0].amount).toBe(42000);
    expect(result.dena[0].upline).toBe(500);
  });
});
