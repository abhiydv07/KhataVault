import { describe, it, expect } from 'vitest';
import { parseTextLine, detectDuplicates, parseOcrTextLines } from '../extractionEngine';

describe('Phase 5 — AI & Speech Extraction Engine', () => {
  it('parses "Ramesh 5000 Lena" -> partyName Ramesh, amount 5000, side lena', () => {
    const res = parseTextLine('Ramesh 5000 Lena');
    expect(res.partyName).toBe('Ramesh');
    expect(res.amount).toBe(5000);
    expect(res.side).toBe('lena');
    expect(res.isValid).toBe(true);
  });

  it('parses "Ramesh 5,000 Dena" -> partyName Ramesh, amount 5000, side dena', () => {
    const res = parseTextLine('Ramesh 5,000 Dena');
    expect(res.partyName).toBe('Ramesh');
    expect(res.amount).toBe(5000);
    expect(res.side).toBe('dena');
    expect(res.isValid).toBe(true);
  });

  it('parses "Ramesh 5k" -> partyName Ramesh, amount 5000', () => {
    const res = parseTextLine('Ramesh 5k');
    expect(res.partyName).toBe('Ramesh');
    expect(res.amount).toBe(5000);
    expect(res.isValid).toBe(true);
  });

  it('parses "रमेश 5 हज़ार लेना" -> partyName रमेश, amount 5000, side lena', () => {
    const res = parseTextLine('रमेश 5 हज़ार लेना');
    expect(res.partyName).toBe('रमेश');
    expect(res.amount).toBe(5000);
    expect(res.side).toBe('lena');
    expect(res.isValid).toBe(true);
  });

  it('parses "Ramesh 1000+500" -> partyName Ramesh, amount 1500', () => {
    const res = parseTextLine('Ramesh 1000+500');
    expect(res.partyName).toBe('Ramesh');
    expect(res.amount).toBe(1500);
    expect(res.rawExpression).toBe('1000+500');
    expect(res.isValid).toBe(true);
  });

  it('parses "Ramesh ₹1,234.50" -> partyName Ramesh, amount 1234.50', () => {
    const res = parseTextLine('Ramesh ₹1,234.50');
    expect(res.partyName).toBe('Ramesh');
    expect(res.amount).toBe(1234.50);
    expect(res.isValid).toBe(true);
  });

  it('parses "Ramesh 2 lakh" -> partyName Ramesh, amount 200000', () => {
    const res = parseTextLine('Ramesh 2 lakh');
    expect(res.partyName).toBe('Ramesh');
    expect(res.amount).toBe(200000);
    expect(res.isValid).toBe(true);
  });

  it('parses "5000 Ramesh" -> partyName Ramesh, amount 5000', () => {
    const res = parseTextLine('5000 Ramesh');
    expect(res.partyName).toBe('Ramesh');
    expect(res.amount).toBe(5000);
    expect(res.isValid).toBe(true);
  });

  it('rejects "Ramesh" as invalid due to missing amount', () => {
    const res = parseTextLine('Ramesh');
    expect(res.partyName).toBe('Ramesh');
    expect(res.isValid).toBe(false);
    expect(res.validationErrors).toContain('Missing or zero amount');
  });

  it('rejects "5000" as invalid due to missing party', () => {
    const res = parseTextLine('5000');
    expect(res.partyName).toBe('');
    expect(res.amount).toBe(5000);
    expect(res.isValid).toBe(false);
    expect(res.validationErrors).toContain('Missing party name');
  });

  it('rejects "Ramesh 0" as invalid due to zero amount', () => {
    const res = parseTextLine('Ramesh 0');
    expect(res.isValid).toBe(false);
    expect(res.validationErrors).toContain('Missing or zero amount');
  });

  it('marks "Ramesh Suresh 5000" as ambiguous requiring user confirmation', () => {
    const res = parseTextLine('Ramesh Suresh 5000');
    expect(res.isAmbiguous).toBe(true);
    expect(res.amount).toBe(5000);
    expect(res.validationErrors.some((e) => e.toLowerCase().includes('ambiguous'))).toBe(true);
  });

  it('correctly ignores phone numbers and extracts the real amount: "Call Ramesh at 9876543210 for ₹5000 Lena"', () => {
    const res = parseTextLine('Call Ramesh at 9876543210 for ₹5000 Lena');
    expect(res.partyName).toBe('Ramesh');
    expect(res.amount).toBe(5000);
    expect(res.side).toBe('lena');
    expect(res.isValid).toBe(true);
  });

  it('detects duplicate entries within a batch and flags existing parties', () => {
    const row1 = parseTextLine('Ramesh 5000 Lena');
    const row2 = parseTextLine('Ramesh 5000 Lena');
    const dups = detectDuplicates([row1, row2], ['Ramesh Traders']);
    expect(dups[0].isDuplicate).toBe(false);
    expect(dups[1].isDuplicate).toBe(true);
    expect(dups[1].duplicateReason).toContain('Ramesh');
  });

  it('parses multi-line OCR text blocks via parseOcrTextLines', () => {
    const rawOcr = `
      Ramesh 5000 Lena
      Suresh 2000 Dena
    `;
    const rows = parseOcrTextLines(rawOcr, { source: 'pdf' });
    expect(rows).toHaveLength(2);
    expect(rows[0].partyName).toBe('Ramesh');
    expect(rows[0].source).toBe('pdf');
    expect(rows[1].partyName).toBe('Suresh');
    expect(rows[1].amount).toBe(2000);
  });
});
