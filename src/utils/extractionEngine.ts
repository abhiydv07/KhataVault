/**
 * KhataVault Extraction Engine
 *
 * Implements strict, structured entity extraction across Voice, Photo/PDF OCR, and Excel imports.
 * Adheres to the strict output contract:
 * {
 *   partyName: string;
 *   amount: number;
 *   side: 'lena' | 'dena' | null;
 *   date: string | null;
 *   upline: number;
 *   rawText: string;
 *   confidence: number;
 *   source: 'photo' | 'pdf' | 'excel' | 'voice';
 *   isValid: boolean;
 *   isAmbiguous: boolean;
 *   validationErrors: string[];
 *   rawExpression?: string;
 * }
 */

import { evaluateExpression } from './mathParser';

export interface ExtractedRow {
  partyName: string;
  amount: number;
  side: 'lena' | 'dena' | null;
  date: string | null;
  upline: number;
  rawText: string;
  confidence: number;
  source: 'photo' | 'pdf' | 'excel' | 'voice';
  isValid: boolean;
  isAmbiguous: boolean;
  validationErrors: string[];
  rawExpression?: string;
}

export interface ParseOptions {
  source?: 'photo' | 'pdf' | 'excel' | 'voice';
  currentUserEmail?: string | null;
  currentUserName?: string | null;
  existingParties?: string[];
}

/**
 * Standardize Indian / Devanagari numerals to standard ASCII digits
 */
export function normalizeDevanagariNumerals(text: string): string {
  const devanagariDigits = ['०', '१', '२', '३', '४', '५', '६', '७', '८', '९'];
  let res = text;
  devanagariDigits.forEach((d, idx) => {
    res = res.split(d).join(String(idx));
  });
  return res;
}

/**
 * Parses numeric unit words in English and Hindi into numeric multipliers
 * e.g., "5k" -> 5000, "2 lakh" -> 200000, "5 हज़ार" -> 5000, "1 crore" -> 10000000
 */
export function parseUnitMultipliers(raw: string): { amount: number; expression: string; matchedText: string } | null {
  const normalized = normalizeDevanagariNumerals(raw);

  // 1. Math expressions with addition/subtraction, e.g. 1000+500, 1500+250-50
  const mathExprRegex = /(?:[₹Rs\.\s]*)((\d+(?:\.\d+)?)(?:\s*[\+\-\*\/]\s*\d+(?:\.\d+)?)+)/i;
  const mathMatch = normalized.match(mathExprRegex);
  if (mathMatch) {
    const expr = mathMatch[1].replace(/\s+/g, '');
    const evaluated = evaluateExpression(expr);
    return {
      amount: evaluated,
      expression: expr,
      matchedText: mathMatch[0],
    };
  }

  // 2. Numbers with k / K (thousands)
  const kRegex = /(?:[₹Rs\.\s]*)(\d+(?:\.\d+)?)\s*(?:k|K)\b/i;
  const kMatch = normalized.match(kRegex);
  if (kMatch) {
    const val = parseFloat(kMatch[1]) * 1000;
    return {
      amount: val,
      expression: String(val),
      matchedText: kMatch[0],
    };
  }

  // 3. Numbers with lakh / lac / लाख
  const lakhRegex = /(?:[₹Rs\.\s]*)(\d+(?:\.\d+)?)\s*(?:lakhs?|lac|lacs?|लाख)(?:[\s,.]|$)/i;
  const lakhMatch = normalized.match(lakhRegex);
  if (lakhMatch) {
    const val = parseFloat(lakhMatch[1]) * 100000;
    return {
      amount: val,
      expression: String(val),
      matchedText: lakhMatch[0],
    };
  }

  // 4. Numbers with हज़ार / हजार / hazar
  const hazarRegex = /(?:[₹Rs\.\s]*)(\d+(?:\.\d+)?)\s*(?:हज़ार|हजार|hazar)(?:[\s,.]|$)/i;
  const hazarMatch = normalized.match(hazarRegex);
  if (hazarMatch) {
    const val = parseFloat(hazarMatch[1]) * 1000;
    return {
      amount: val,
      expression: String(val),
      matchedText: hazarMatch[0],
    };
  }

  // 5. Numbers with crore / cr / करोड़
  const croreRegex = /(?:[₹Rs\.\s]*)(\d+(?:\.\d+)?)\s*(?:crores?|cr|करोड़)(?:[\s,.]|$)/i;
  const croreMatch = normalized.match(croreRegex);
  if (croreMatch) {
    const val = parseFloat(croreMatch[1]) * 10000000;
    return {
      amount: val,
      expression: String(val),
      matchedText: croreMatch[0],
    };
  }

  // 6. Standard numbers with optional commas and currency symbols: e.g. ₹1,234.50 or 5,000 or 5000
  // Note: Ignore numbers that look like 10-digit phone numbers
  const standardNumRegex = /(?:[₹$]|Rs\.?|INR)?\s*(\b\d{1,3}(?:,\d{3})*(?:\.\d+)?|\b\d+(?:\.\d+)?)\b/i;
  const matches = [...normalized.matchAll(new RegExp(standardNumRegex, 'gi'))];
  for (const m of matches) {
    const cleanNum = m[1].replace(/,/g, '');
    // If it is 10 digits and starts with 6-9, it's likely a phone number, skip as amount
    if (/^[6-9]\d{9}$/.test(cleanNum)) {
      continue;
    }
    const val = parseFloat(cleanNum);
    if (!isNaN(val)) {
      return {
        amount: val,
        expression: cleanNum,
        matchedText: m[0],
      };
    }
  }

  return null;
}

/**
 * Detect side (Lena = Receivables / Credit vs Dena = Payables / Debit)
 */
export function detectSide(text: string): 'lena' | 'dena' | null {
  const lower = text.toLowerCase();

  const isLena =
    /\b(lena|credit|cr|jama|inflow|deposit|receive|receivable)\b/i.test(lower) ||
    /(लेना|जमा|लिया|प्राप्य|आवक)/.test(text);

  const isDena =
    /\b(dena|debit|dr|naam|udhar|outflow|pay|payable|paid|given)\b/i.test(lower) ||
    /(देना|नामे|दिया|देय|जावक|उधार)/.test(text);

  if (isLena && !isDena) return 'lena';
  if (isDena && !isLena) return 'dena';
  return null;
}

/**
 * Core Parser: Parses a natural text string into a structured ExtractedRow.
 */
export function parseTextLine(line: string, options: ParseOptions = {}): ExtractedRow {
  const rawText = line.trim();
  const validationErrors: string[] = [];
  let isAmbiguous = false;
  let confidence = 0.9;

  if (!rawText) {
    return {
      partyName: '',
      amount: 0,
      side: null,
      date: null,
      upline: 0,
      rawText: '',
      confidence: 0,
      source: options.source || 'voice',
      isValid: false,
      isAmbiguous: false,
      validationErrors: ['Empty input'],
    };
  }

  // 1. Detect side
  const side = detectSide(rawText);

  // 2. Mask phone numbers so they don't get eaten as amounts
  const phoneRegex = /(?:\+91[\-\s]?)?[6-9]\d{9}\b/g;
  const textWithoutPhones = rawText.replace(phoneRegex, ' [PHONE] ');

  // 3. Extract Amount
  const amountParsed = parseUnitMultipliers(textWithoutPhones);
  let amount = 0;
  let rawExpression = '';
  let amountTextToStrip = '';

  if (amountParsed) {
    amount = amountParsed.amount;
    rawExpression = amountParsed.expression;
    amountTextToStrip = amountParsed.matchedText;
  }

  // 4. Extract Party Name by removing amount, side indicators, currency symbols, and phone placeholders
  let remaining = rawText;
  if (amountTextToStrip) {
    remaining = remaining.replace(amountTextToStrip, ' ');
  }

  // Strip phone numbers from name
  remaining = remaining.replace(phoneRegex, ' ');

  // Strip common side and filler keywords
  // Note: Avoid \b for Devanagari words because Unicode Hindi characters are not matched by ASCII \b
  remaining = remaining
    .replace(/(?:^|\s+)(लेना|देना|लिया|दिया|जमा|नामे|हज़ार|हजार|लाख|करोड़)(?:\s+|$)/gi, ' ')
    .replace(/(?:^|\s+)(लेना|देना|लिया|दिया|जमा|नामे|हज़ार|हजार|लाख|करोड़)(?:\s+|$)/gi, ' ')
    .replace(/\b(lena|dena|credit|debit|cr|dr|k|lakhs?|lacs?|crores?|hazar|rs\.?|inr|rupees?|rupaye)\b/gi, ' ')
    .replace(/\b(call|at|for|from|to|ko|se|ka|ki|ke|shree|ji)\b/gi, ' ')
    .replace(/[₹$,:;!?"'|/\\=<>#]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  // Strip leading/trailing dashes, dots, brackets
  let partyName = remaining.replace(/^[\s\-_.\(\)]+|[\s\-_.\(\)]+$/g, '').trim();

  // Rule: Never let a standalone number become the party name
  if (/^\d+$/.test(partyName)) {
    partyName = '';
  }

  // Rule: Never use the authenticated user's email or name as counterparty
  if (options.currentUserEmail && partyName.toLowerCase() === options.currentUserEmail.toLowerCase()) {
    partyName = '';
    validationErrors.push('Authenticated user cannot be their own counterparty');
  }
  if (options.currentUserName && partyName.toLowerCase() === options.currentUserName.toLowerCase()) {
    partyName = '';
    validationErrors.push('Authenticated user cannot be their own counterparty');
  }

  // Ambiguity check: e.g. "Ramesh Suresh 5000" where two standalone first names exist without business word
  if (partyName) {
    const parts = partyName.split(/\s+/);
    const businessSuffixes = ['traders', 'agency', 'enterprise', 'store', 'shop', 'textiles', 'and', '&', 'brothers', 'sons', 'pvt', 'ltd', 'firm', 'company'];
    const hasBusinessSuffix = parts.some((p) => businessSuffixes.includes(p.toLowerCase()));

    if (parts.length === 2 && !hasBusinessSuffix) {
      // Both look like proper person names
      const isEnglishNamePair = /^[A-Z][a-z]+ [A-Z][a-z]+$/.test(partyName);
      if (isEnglishNamePair) {
        // e.g. "Ramesh Suresh"
        const knownFirstNames = ['ramesh', 'suresh', 'anil', 'mukesh', 'vikas', 'deepak', 'rahul', 'amit', 'rajesh', 'dinesh'];
        if (knownFirstNames.includes(parts[0].toLowerCase()) && knownFirstNames.includes(parts[1].toLowerCase())) {
          isAmbiguous = true;
          validationErrors.push(`Ambiguous party name: multiple individual names found ("${partyName}"). Please confirm specific party.`);
          confidence = 0.5;
        }
      }
    }
  }

  // Validation rules
  if (!partyName) {
    validationErrors.push('Missing party name');
  }

  if (amount <= 0 || isNaN(amount)) {
    validationErrors.push('Missing or zero amount');
  }

  if (side === null) {
    isAmbiguous = true;
    validationErrors.push('Transaction side (Lena or Dena) was not specified');
    confidence = Math.min(confidence, 0.7);
  }

  const isValid = Boolean(partyName && amount > 0 && !validationErrors.includes('Missing party name') && !validationErrors.includes('Missing or zero amount'));

  return {
    partyName: partyName ? partyName.charAt(0).toUpperCase() + partyName.slice(1) : '',
    amount,
    side,
    date: new Date().toISOString().split('T')[0],
    upline: 0,
    rawText,
    confidence: isValid ? confidence : 0.2,
    source: options.source || 'voice',
    isValid,
    isAmbiguous,
    validationErrors,
    rawExpression: rawExpression || String(amount),
  };
}

/**
 * Batch parses an array of text lines (e.g. from OCR text output).
 */
export function parseOcrTextLines(ocrText: string, options: ParseOptions = {}): ExtractedRow[] {
  if (!ocrText) return [];
  const lines = ocrText
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  const results: ExtractedRow[] = [];
  for (const line of lines) {
    // Skip general headers or dates
    if (/^(date|tarikh|hisaab|khata|bahi|total|page|sr|no\.)/i.test(line)) {
      continue;
    }
    const parsed = parseTextLine(line, { ...options, source: options.source || 'photo' });
    // Include all rows so user can see and correct them in preview table
    if (parsed.partyName || parsed.amount > 0) {
      results.push(parsed);
    }
  }
  return results;
}

/**
 * Deduplicate extracted rows against each other and against known existing parties.
 */
export function detectDuplicates(
  rows: ExtractedRow[],
  knownParties: string[] = []
): { row: ExtractedRow; isDuplicate: boolean; duplicateReason?: string; matchedKnownParty?: boolean }[] {
  const seenInBatch = new Set<string>();
  const normalizedKnown = new Set(knownParties.map((p) => p.trim().toLowerCase()));

  return rows.map((r) => {
    const key = `${r.partyName.toLowerCase()}_${r.amount}_${r.side}`;
    const matchedKnownParty = normalizedKnown.has(r.partyName.toLowerCase());
    if (seenInBatch.has(key)) {
      return {
        row: r,
        isDuplicate: true,
        duplicateReason: `Duplicate row in this batch: ${r.partyName} (₹ ${r.amount})`,
        matchedKnownParty,
      };
    }
    seenInBatch.add(key);

    return {
      row: r,
      isDuplicate: false,
      matchedKnownParty,
    };
  });
}
