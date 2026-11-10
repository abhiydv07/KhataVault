import { evaluateExpression } from './mathParser';

export interface ScannedEntry {
  friendName: string;
  rawExpression: string;
  amount: number;
  upline?: number;
  rawUplineExpression?: string;
}

export interface ExtractedLedgerData {
  lena: ScannedEntry[];
  dena: ScannedEntry[];
  cashChargePercent?: number;
  note?: string;
  sourceType: 'excel' | 'image_ai' | 'pdf_ai' | 'text';
  fileName: string;
}

/**
 * Convert a browser File to base64 string
 */
export async function fileToBase64(file: File): Promise<string> {
  if (typeof FileReader !== 'undefined') {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        const base64 = result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = (error) => reject(error);
      reader.readAsDataURL(file);
    });
  }

  // Universal ArrayBuffer fallback (compatible with Node.js & browser environments)
  const arrayBuffer = await file.arrayBuffer();
  if (typeof Buffer !== 'undefined') {
    return Buffer.from(arrayBuffer).toString('base64');
  }

  let binary = '';
  const bytes = new Uint8Array(arrayBuffer);
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

/**
 * Parse Excel (.xlsx, .xls) or CSV file using SheetJS (dynamically imported)
 */
export async function parseExcelOrCsv(file: File): Promise<ExtractedLedgerData> {
  const XLSX = await import('xlsx');
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: 'array' });
  
  if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
    throw new Error('Excel file has no worksheets');
  }

  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  const rawRows: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' });

  if (rawRows.length === 0) {
    throw new Error('The worksheet is empty');
  }

  // Detect header row index within first 10 rows
  let headerIndex = -1;
  let nameCol = -1;
  let amountCol = -1;
  let creditCol = -1;
  let debitCol = -1;
  let typeCol = -1;
  let uplineCol = -1;
  let noteCol = -1;

  const nameKeywords = ['name', 'party', 'customer', 'vendor', 'account', 'particular', 'khata', 'naam', 'विवरण', 'पार्टी', 'नाम'];
  const creditKeywords = ['credit', 'cr', 'lena', 'jama', 'inflow', 'deposit', 'जमा', 'लेना'];
  const debitKeywords = ['debit', 'dr', 'dena', 'udhar', 'outflow', 'withdrawal', 'नामे', 'देना', 'उधार'];
  const amountKeywords = ['amount', 'balance', 'value', 'total', 'net', 'रकम', 'राशि'];
  const typeKeywords = ['type', 'cr/dr', 'd/c', 'side', 'प्रकार'];
  const uplineKeywords = ['upline', 'u/l', 'brokerage', 'comm', 'अपलाइन'];
  const noteKeywords = ['note', 'remark', 'narration', 'टिप्पणी'];

  for (let r = 0; r < Math.min(rawRows.length, 10); r++) {
    const row = rawRows[r].map((cell: any) => String(cell).toLowerCase().trim());
    
    const foundName = row.findIndex((c) => nameKeywords.some((k) => c.includes(k)));
    const foundCredit = row.findIndex((c) => creditKeywords.some((k) => c.includes(k)));
    const foundDebit = row.findIndex((c) => debitKeywords.some((k) => c.includes(k)));
    const foundAmount = row.findIndex((c) => amountKeywords.some((k) => c.includes(k)));

    if (foundName !== -1 && (foundAmount !== -1 || foundCredit !== -1 || foundDebit !== -1)) {
      headerIndex = r;
      nameCol = foundName;
      creditCol = foundCredit;
      debitCol = foundDebit;
      amountCol = foundAmount;
      typeCol = row.findIndex((c) => typeKeywords.some((k) => c.includes(k)));
      uplineCol = row.findIndex((c) => uplineKeywords.some((k) => c.includes(k)));
      noteCol = row.findIndex((c) => noteKeywords.some((k) => c.includes(k)));
      break;
    }
  }

  const lenaList: ScannedEntry[] = [];
  const denaList: ScannedEntry[] = [];
  const notesList: string[] = [];

  const startRow = headerIndex !== -1 ? headerIndex + 1 : 0;

  for (let r = startRow; r < rawRows.length; r++) {
    const row = rawRows[r];
    if (!row || row.length === 0) continue;

    let partyName = '';
    let rawAmount = '';
    let evaluated = 0;
    let uplineVal = 0;
    let uplineRaw = '';
    let isLena = true;

    if (nameCol !== -1) {
      partyName = String(row[nameCol] ?? '').trim();
    } else {
      // Heuristic: first non-empty text column
      partyName = String(row[0] ?? '').trim();
    }

    // Skip empty rows or summary/total rows
    if (!partyName || /^(total|grand total|subtotal|कुल|योग)/i.test(partyName)) {
      continue;
    }

    // Extract upline if present
    if (uplineCol !== -1 && row[uplineCol] !== undefined && row[uplineCol] !== '') {
      uplineRaw = String(row[uplineCol]).trim();
      uplineVal = evaluateExpression(uplineRaw);
    }

    // Case 1: Separate Credit and Debit columns
    if (creditCol !== -1 && debitCol !== -1) {
      const crRaw = String(row[creditCol] ?? '').trim();
      const drRaw = String(row[debitCol] ?? '').trim();

      const crVal = evaluateExpression(crRaw);
      const drVal = evaluateExpression(drRaw);

      if (crVal > 0) {
        lenaList.push({
          friendName: partyName,
          rawExpression: crRaw,
          amount: crVal,
        });
      }
      if (drVal > 0) {
        denaList.push({
          friendName: partyName,
          rawExpression: drRaw,
          amount: drVal,
          upline: uplineVal,
          rawUplineExpression: uplineRaw,
        });
      }
      continue;
    }

    // Case 2: Amount column with Type column or signed values
    if (amountCol !== -1) {
      rawAmount = String(row[amountCol] ?? '').trim();
    } else {
      // Heuristic: column 1
      rawAmount = String(row[1] ?? '').trim();
    }

    if (!rawAmount) continue;

    evaluated = evaluateExpression(rawAmount);
    if (isNaN(evaluated) || evaluated === 0) continue;

    if (typeCol !== -1 && row[typeCol]) {
      const typeStr = String(row[typeCol]).toLowerCase();
      if (typeStr.includes('dr') || typeStr.includes('debit') || typeStr.includes('dena') || typeStr.includes('udhar')) {
        isLena = false;
      } else {
        isLena = true;
      }
    } else {
      // Signed amount heuristic: negative is Dena, positive is Lena
      if (evaluated < 0) {
        isLena = false;
        evaluated = Math.abs(evaluated);
        rawAmount = rawAmount.replace(/^-/, '');
      } else {
        isLena = true;
      }
    }

    if (isLena) {
      lenaList.push({
        friendName: partyName,
        rawExpression: rawAmount,
        amount: Math.abs(evaluated),
      });
    } else {
      denaList.push({
        friendName: partyName,
        rawExpression: rawAmount,
        amount: Math.abs(evaluated),
        upline: uplineVal,
        rawUplineExpression: uplineRaw,
      });
    }

    if (noteCol !== -1 && row[noteCol]) {
      notesList.push(`${partyName}: ${row[noteCol]}`);
    }
  }

  return {
    lena: lenaList,
    dena: denaList,
    note: notesList.length > 0 ? notesList.slice(0, 3).join(', ') : `Imported from ${file.name}`,
    sourceType: 'excel',
    fileName: file.name,
  };
}

/**
 * Parse an image or PDF document using Google Gemini 1.5 Flash Vision API
 */
export async function parseDocumentWithAi(
  file: File,
  apiKey: string
): Promise<ExtractedLedgerData> {
  if (!apiKey || !apiKey.trim()) {
    throw new Error('Google Gemini API Key is required for image and PDF scanning');
  }

  const base64Data = await fileToBase64(file);
  let mimeType = file.type || 'image/jpeg';
  if (file.name.endsWith('.pdf')) {
    mimeType = 'application/pdf';
  }

  const promptText = `
You are an expert commercial accountant AI specializing in Indian merchant hisaab, bahi-khata, handwritten ledgers, daily settlement sheets, invoices, and bills in Hindi, English, and Hinglish.

Analyze this document image/PDF and extract all counterparties and financial entries.
Categorize each into:
- "lena": Money receivable / credit / jama / Lena / surplus to collect.
- "dena": Money payable / debit / naam / udhar / Dena / deficit to pay.
- "upline": Upline/commission amount if mentioned (only for dena side).
- "cashChargePercent": Cash handling surcharge percent if written (e.g. 3.0, 3.75, 4.0).
- "note": Any general ledger remark or date found.

Respond ONLY with a single valid JSON object without markdown formatting, using this exact schema:
{
  "lena": [
    { "friendName": "Ramesh Traders", "rawExpression": "4500", "amount": 4500 }
  ],
  "dena": [
    { "friendName": "Shree Shyam Agency", "rawExpression": "12000", "amount": 12000, "upline": 0 }
  ],
  "cashChargePercent": 3.0,
  "note": "Extracted from daily bahi khata"
}

Important Rules:
- If a party has multiple amounts or mathematical addition like "1500+320", store rawExpression as "1500+320" and amount as 1820.
- Clean up party names (remove serial numbers, dates, or symbols).
- Ensure "amount" is a non-negative number.
- Do not wrap in markdown code blocks like \`\`\`json. Return raw JSON.
`;

  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${encodeURIComponent(apiKey.trim())}`;

  const requestBody = {
    contents: [
      {
        parts: [
          {
            text: promptText,
          },
          {
            inline_data: {
              mime_type: mimeType,
              data: base64Data,
            },
          },
        ],
      },
    ],
    generationConfig: {
      temperature: 0.1,
      response_mime_type: 'application/json',
    },
  };

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    let message = `AI Scanner Error (${response.status})`;
    try {
      const parsedErr = JSON.parse(errorBody);
      message = parsedErr.error?.message || message;
    } catch {
      message = errorBody || message;
    }
    throw new Error(message);
  }

  const responseData = await response.json();
  const textOutput = responseData.candidates?.[0]?.content?.parts?.[0]?.text;

  if (!textOutput) {
    throw new Error('AI was unable to extract ledger text from this document');
  }

  // Sanitize text if wrapped in markdown
  const cleanedText = textOutput.replace(/```(?:json)?/gi, '').replace(/```/g, '').trim();

  let parsedJson: any;
  try {
    parsedJson = JSON.parse(cleanedText);
  } catch (err: any) {
    throw new Error(`Failed to parse AI response: ${err.message}. Raw: ${cleanedText.substring(0, 150)}`);
  }

  const lenaList: ScannedEntry[] = Array.isArray(parsedJson.lena)
    ? parsedJson.lena
        .filter((item: any) => item && (item.friendName || item.name))
        .map((item: any) => {
          const raw = String(item.rawExpression || item.amount || '0');
          const amt = typeof item.amount === 'number' ? Math.abs(item.amount) : evaluateExpression(raw);
          return {
            friendName: String(item.friendName || item.name).trim(),
            rawExpression: raw,
            amount: amt,
          };
        })
    : [];

  const denaList: ScannedEntry[] = Array.isArray(parsedJson.dena)
    ? parsedJson.dena
        .filter((item: any) => item && (item.friendName || item.name))
        .map((item: any) => {
          const raw = String(item.rawExpression || item.amount || '0');
          const amt = typeof item.amount === 'number' ? Math.abs(item.amount) : evaluateExpression(raw);
          const uplineAmt = typeof item.upline === 'number' ? item.upline : evaluateExpression(String(item.rawUplineExpression || item.upline || '0'));
          return {
            friendName: String(item.friendName || item.name).trim(),
            rawExpression: raw,
            amount: amt,
            upline: uplineAmt,
            rawUplineExpression: item.rawUplineExpression ? String(item.rawUplineExpression) : uplineAmt ? String(uplineAmt) : undefined,
          };
        })
    : [];

  return {
    lena: lenaList,
    dena: denaList,
    cashChargePercent: typeof parsedJson.cashChargePercent === 'number' ? parsedJson.cashChargePercent : undefined,
    note: parsedJson.note ? String(parsedJson.note) : `AI Scanned from ${file.name}`,
    sourceType: mimeType.includes('pdf') ? 'pdf_ai' : 'image_ai',
    fileName: file.name,
  };
}
